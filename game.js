import { Dungeon }             from './engine/dungeon.js';
import { Player }              from './engine/player.js';
import { resolveMelee,
         applyDamage }         from './engine/combat.js';
import { Renderer }            from './ui/renderer.js';
import { Hud }                 from './ui/hud.js';
import { TextPanel }           from './ui/textpanel.js';
import { CLASSES }             from './data/classes.js';
import { ITEMS }               from './data/items.js';

// ── Layout constants ──────────────────────────────────────────────────────────
const COLS     = 72;
const ROWS     = 38;
const HUD_ROWS = 5;

// Class cycling order on the selection screen
const CLASS_ORDER = ['secutor', 'retiarius', 'murmillo', 'dimachaerus'];

// Maximums for scaling stat bars on the class-select screen
const STAT_MAX = { hp: 120, str: 18, def: 12, spd: 12, mp: 60 };

// How far away an enemy must be before it notices the player
const DETECT_RANGE = 8;

// ── Core modules ──────────────────────────────────────────────────────────────
const canvas    = document.getElementById('game-canvas');
const renderer  = new Renderer(canvas, COLS, ROWS, HUD_ROWS);
const hud       = new Hud(renderer);
const textPanel = new TextPanel(renderer);
const ctx       = renderer.ctx;

// ── Intro narrative pages ─────────────────────────────────────────────────────
const INTRO_PAGES = [
  [
    'The year is 73 BC.',
    '',
    'You are a slave in the ludus of Capua —',
    'trained to fight, bred to die for the crowd\'s amusement.',
    '',
    'But the arena holds one truth above all:',
    'survive long enough, and Rome must grant you freedom.',
  ],
  [
    'Your doctore hands you a weapon.',
    '',
    '"The crowd decides your fate tonight," he growls.',
    '"Give them blood. Give them a show."',
    '',
    'You step into the torchlight.',
    'The crowd roars.',
  ],
  [
    'Your journey to freedom begins now.',
    '',
    'Fight. Earn honor. Buy your liberty.',
    '',
    '       AD  LIBERTATEM.',
  ],
];

// ── Shared game state ─────────────────────────────────────────────────────────
const gs = {
  player:       null,
  dungeon:      null,
  messages:     [],
  state:        null,

  classIndex:   0,
  pendingClass: null,
  pendingName:  '',
  introPage:    0,
  ludusRested:  false,

  // Active combat data; populated when entering COMBAT state
  combat: {
    enemy: null,
    log:   [],
    turn:  'player',  // 'player' | 'victory' | 'dead'
  },
};

// ── Stat bar helper (class-select screen) ─────────────────────────────────────
function drawStatBar(label, value, max, x, y, color) {
  const BARS   = 18;
  const filled = Math.round((value / max) * BARS);
  const barStr = '█'.repeat(filled) + '░'.repeat(BARS - filled);
  renderer.text(label.padEnd(4), x,         y, '#777', 14);
  renderer.text(barStr,          x + 48,    y, color,  14);
  renderer.text(String(value),   x + 48 + BARS * 9, y, '#ccc', 14);
}

// ── Enemy AI helpers ──────────────────────────────────────────────────────────

/**
 * Returns the next [x, y] that moves entity one step toward target.
 * Tries diagonal first, then cardinal directions.
 * Returns entity's current position if completely blocked.
 */
function stepToward(entity, target, dungeon) {
  const dx = Math.sign(target.x - entity.x);
  const dy = Math.sign(target.y - entity.y);

  const candidates = [];
  if (dx !== 0 && dy !== 0) candidates.push([entity.x + dx, entity.y + dy]);
  if (dx !== 0)              candidates.push([entity.x + dx, entity.y]);
  if (dy !== 0)              candidates.push([entity.x,      entity.y + dy]);

  for (const [nx, ny] of candidates) {
    // Allow stepping onto the target tile (player tile) even if not "passable"
    if (nx === target.x && ny === target.y) return [nx, ny];
    if (dungeon.isPassable(nx, ny)) return [nx, ny];
  }
  return [entity.x, entity.y];
}

/**
 * Advance every living enemy one step toward the player.
 * If any enemy reaches the player tile, enters COMBAT state and returns early.
 */
function processEnemyTurns(gs) {
  for (const enemy of gs.dungeon.enemies) {
    if (!enemy.alive) continue;

    const dist = Math.abs(enemy.x - gs.player.x) + Math.abs(enemy.y - gs.player.y);
    if (dist > DETECT_RANGE) continue;

    const [nx, ny] = stepToward(enemy, gs.player, gs.dungeon);

    // Enemy reaches player tile → enter combat
    if (nx === gs.player.x && ny === gs.player.y) {
      gs.combat = {
        enemy,
        log:  [`The ${enemy.name} closes in on you!`],
        turn: 'player',
      };
      transition('COMBAT');
      return; // stop — one combat at a time
    }

    // Don't stack onto another enemy
    const blocked = gs.dungeon.enemies.some(
      e => e.alive && e !== enemy && e.x === nx && e.y === ny,
    );
    if (!blocked) {
      enemy.x = nx;
      enemy.y = ny;
    }
  }
}

// ── Combat helpers ────────────────────────────────────────────────────────────

function doEnemyAttack(gs) {
  const { player, combat } = gs;
  const result = resolveMelee(combat.enemy, player);
  applyDamage(player, result.damage);
  combat.log.push(result.log);

  if (player.isDead()) {
    combat.log.push('You have fallen...');
    combat.turn = 'dead';
  } else {
    combat.turn = 'player';
  }
}

function doPlayerAttack(gs) {
  const { player, combat } = gs;
  const result = resolveMelee(player, combat.enemy);
  applyDamage(combat.enemy, result.damage);
  combat.log.push(result.log);

  if (combat.enemy.stats.hp <= 0) {
    combat.enemy.alive = false;
    const leveled = player.gainXp(combat.enemy.xp);
    player.gold += combat.enemy.gold;
    combat.log.push(
      `${combat.enemy.name} defeated!  +${combat.enemy.xp} XP  +${combat.enemy.gold} gold`,
    );
    leveled.forEach(lv => combat.log.push(`★ LEVEL UP — you are now level ${lv}!`));
    combat.turn = 'victory';
  } else {
    doEnemyAttack(gs);
  }
}

/**
 * Use the best available item from inventory during combat.
 * Priority: fire scroll > bull's blood > health potion > mana potion.
 * Using an item costs the player's turn (enemy attacks back) unless it ends combat.
 */
function doUseItem(gs) {
  const { player, combat } = gs;
  const priority = ['scroll_of_fire', 'bulls_blood_potion', 'health_potion', 'mana_potion'];
  const useId    = priority.find(id => player.inventory.has(id));

  if (!useId) {
    combat.log.push('No usable items in your pack!');
    return;
  }

  const result = player.useItem(useId);
  if (!result) return;

  if (result.effect === 'heal') {
    combat.log.push(`Used ${result.item.name} — restored ${result.amount} HP.`);
  } else if (result.effect === 'restore_mp') {
    combat.log.push(`Used ${result.item.name} — restored ${result.amount} MP.`);
  } else if (result.effect === 'fireball') {
    const dmg = result.item.damage;
    applyDamage(combat.enemy, dmg);
    combat.log.push(`Scroll of Fire! Dealt ${dmg} fire damage!`);
    if (combat.enemy.stats.hp <= 0) {
      combat.enemy.alive = false;
      const leveled = player.gainXp(combat.enemy.xp);
      player.gold += combat.enemy.gold;
      combat.log.push(`${combat.enemy.name} defeated! +${combat.enemy.xp} XP  +${combat.enemy.gold} gold`);
      leveled.forEach(lv => combat.log.push(`★ LEVEL UP — level ${lv}!`));
      combat.turn = 'victory';
      return; // skip enemy counter-attack
    }
  }

  // Using an item costs a turn — enemy attacks back
  doEnemyAttack(gs);
}

function doPlayerFlee(gs) {
  const { player, combat } = gs;
  const speedAdv = player.stats.spd - combat.enemy.stats.spd;
  const chance   = Math.max(0.20, Math.min(0.85, 0.40 + speedAdv * 0.05));

  if (ROT.RNG.getUniform() < chance) {
    gs.messages.push(`You fled from the ${combat.enemy.name}.`);
    transition('EXPLORATION');   // transition draws for us
  } else {
    combat.log.push('You fail to escape!');
    doEnemyAttack(gs);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: TITLE
// ═══════════════════════════════════════════════════════════════════════════════
const TITLE = {
  enter() {},

  draw() {
    renderer.clearFull('#0a0a0a');
    renderer.text(
      'AD LIBERTATEM',
      renderer.centerX('AD LIBERTATEM', 36), 150, '#e8c97d', 36,
    );
    renderer.text(
      "A Gladiator's Journey to Freedom",
      renderer.centerX("A Gladiator's Journey to Freedom", 18), 205, '#888', 18,
    );
    renderer.hline(415, '#2a2a2a');
    renderer.text(
      'PRESS  ENTER  TO  BEGIN',
      renderer.centerX('PRESS  ENTER  TO  BEGIN', 16), 448, '#bbb', 16,
    );
    renderer.text(
      'Arrow keys + Enter to navigate   |   Escape to return to Ludus in-game',
      renderer.centerX('Arrow keys + Enter to navigate   |   Escape to return to Ludus in-game', 12),
      492, '#444', 12,
    );
  },

  handle(gs, e) {
    if (e.key === 'Enter') { transition('CHARACTER_CLASS'); return false; }
    return false;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: CHARACTER_CLASS
// ═══════════════════════════════════════════════════════════════════════════════
const CHARACTER_CLASS = {
  enter(gs) {
    gs.classIndex   = 0;
    gs.pendingClass = CLASSES[CLASS_ORDER[0]];
  },

  draw(gs) {
    renderer.clearFull('#0a0a0a');
    const W = canvas.width;
    const H = canvas.height;

    renderer.text(
      'CHOOSE  YOUR  CLASS',
      renderer.centerX('CHOOSE  YOUR  CLASS', 22), 22, '#e8c97d', 22,
    );

    // Class tabs
    const tabW = Math.floor(W / 4);
    CLASS_ORDER.forEach((key, i) => {
      const cls      = CLASSES[key];
      const tabX     = i * tabW;
      const selected = i === gs.classIndex;
      const fontSize = selected ? 18 : 15;
      const color    = selected ? cls.color : '#555';
      const label    = cls.name.toUpperCase();

      if (selected) {
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(tabX + 1, 60, tabW - 2, 36);
      }

      ctx.font = `${fontSize}px "Courier New", monospace`;
      const lx = tabX + Math.floor((tabW - ctx.measureText(label).width) / 2);
      renderer.text(label, lx, 68, color, fontSize);
    });

    renderer.hline(100, '#2a2a2a');

    // Left column: class details
    const cls  = gs.pendingClass;
    const LEFT = 30;
    renderer.text(cls.name.toUpperCase(), LEFT, 118, cls.color, 22);

    const words = cls.flavor.split(' ');
    let   line  = '';
    let   ly    = 156;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (test.length > 40) {
        renderer.text(line, LEFT, ly, '#999', 14);
        ly += 22;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) { renderer.text(line, LEFT, ly, '#999', 14); ly += 22; }

    ly += 10;
    renderer.text(`Weapon:  ${cls.startWeapon}`, LEFT, ly,      '#ccc',    14); ly += 22;
    renderer.text(`Armor:   ${cls.startArmor}`,  LEFT, ly,      '#ccc',    14); ly += 22;
    renderer.text(`Ability: ${cls.ability}`,     LEFT, ly,      '#ffca28', 14);

    // Right column: stat bars
    const RIGHT = Math.floor(W / 2) + 10;
    let   ry    = 118;
    renderer.text('STATISTICS', RIGHT, ry, '#555', 14); ry += 28;
    drawStatBar('HP',  cls.stats.hp,  STAT_MAX.hp,  RIGHT, ry, '#4caf50'); ry += 26;
    drawStatBar('STR', cls.stats.str, STAT_MAX.str, RIGHT, ry, '#ef5350'); ry += 26;
    drawStatBar('DEF', cls.stats.def, STAT_MAX.def, RIGHT, ry, '#42a5f5'); ry += 26;
    drawStatBar('SPD', cls.stats.spd, STAT_MAX.spd, RIGHT, ry, '#ffca28'); ry += 26;
    drawStatBar('MP',  cls.stats.mp,  STAT_MAX.mp,  RIGHT, ry, '#ab47bc');

    renderer.hline(H - 110, '#2a2a2a');
    renderer.text(
      '← →  to select     Enter to confirm',
      renderer.centerX('← →  to select     Enter to confirm', 14),
      H - 88, '#777', 14,
    );
  },

  handle(gs, e) {
    if (e.key === 'ArrowLeft') {
      gs.classIndex   = (gs.classIndex - 1 + CLASS_ORDER.length) % CLASS_ORDER.length;
      gs.pendingClass = CLASSES[CLASS_ORDER[gs.classIndex]];
      return true;
    }
    if (e.key === 'ArrowRight') {
      gs.classIndex   = (gs.classIndex + 1) % CLASS_ORDER.length;
      gs.pendingClass = CLASSES[CLASS_ORDER[gs.classIndex]];
      return true;
    }
    if (e.key === 'Enter') { transition('CHARACTER_NAME'); return false; }
    return false;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: CHARACTER_NAME
// ═══════════════════════════════════════════════════════════════════════════════
const CHARACTER_NAME = {
  enter(gs) { gs.pendingName = ''; },

  draw(gs) {
    renderer.clearFull('#0a0a0a');
    const W   = canvas.width;
    const cls = gs.pendingClass;

    renderer.text(
      'NAME  YOUR  GLADIATOR',
      renderer.centerX('NAME  YOUR  GLADIATOR', 28), 180, '#e8c97d', 28,
    );

    const boxW = 420;
    const boxX = Math.floor((W - boxW) / 2);
    const boxY = 256;
    ctx.strokeStyle = '#555';
    ctx.lineWidth   = 1;
    ctx.strokeRect(boxX, boxY, boxW, 38);
    renderer.text(`${gs.pendingName}_`, boxX + 14, boxY + 9, '#fff', 20);

    const reminder = `Class: ${cls.name}`;
    renderer.text(reminder, renderer.centerX(reminder, 16), 330, cls.color, 16);

    renderer.text(
      'Type a name (max 16 characters), then press Enter',
      renderer.centerX('Type a name (max 16 characters), then press Enter', 14),
      428, '#666', 14,
    );
    renderer.text(
      'Backspace to delete',
      renderer.centerX('Backspace to delete', 13),
      456, '#444', 13,
    );
  },

  handle(gs, e) {
    if (e.key === 'Backspace') {
      gs.pendingName = gs.pendingName.slice(0, -1);
      return true;
    }
    if (e.key === 'Enter' && gs.pendingName.trim().length > 0) {
      gs.player      = new Player(gs.pendingClass);
      gs.player.name = gs.pendingName.trim();
      transition('INTRO');
      return false;
    }
    if (e.key.length === 1 && gs.pendingName.length < 16) {
      gs.pendingName += e.key;
      return true;
    }
    return false;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: INTRO
// ═══════════════════════════════════════════════════════════════════════════════
const INTRO = {
  enter(gs) { gs.introPage = 0; },

  draw(gs) {
    renderer.clearFull('#080808');
    const lines = INTRO_PAGES[gs.introPage];
    let   ly    = 160;

    for (const line of lines) {
      if (line === '') { ly += 14; continue; }
      renderer.text(line, 80, ly, '#ccc', 16);
      ly += 28;
    }

    const isLast = gs.introPage === INTRO_PAGES.length - 1;
    const hint   = isLast ? 'Press Enter to enter the Ludus...' : 'Press Enter to continue...';
    renderer.text(hint, renderer.centerX(hint, 14), 568, '#555', 14);
  },

  handle(gs, e) {
    if (e.key === 'Enter') {
      gs.introPage += 1;
      if (gs.introPage >= INTRO_PAGES.length) { transition('LUDUS'); return false; }
      return true;
    }
    return false;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: LUDUS
// ═══════════════════════════════════════════════════════════════════════════════
const LUDUS = {
  enter() {},

  draw(gs) {
    renderer.clearFull('#0c0c0f');
    const H = canvas.height;

    renderer.text('LUDUS  MAGNUS', renderer.centerX('LUDUS  MAGNUS', 28), 26, '#c0a060', 28);
    renderer.text('Capua, 73 BC',  renderer.centerX('Capua, 73 BC',  14), 66, '#555',    14);
    renderer.hline(90, '#2a2a2a');

    if (gs.player) {
      const p = gs.player;
      const s = p.stats;
      renderer.text(p.name, 40, 108, p.color, 20);
      renderer.text(`${p.classDef.name}   Level ${p.level}   XP ${p.xp}/${p.xpNext}`, 40, 136, '#aaa', 14);
      renderer.text(
        `HP ${s.hp}/${s.maxHp}   MP ${s.mp}/${s.maxMp}   Gold ${p.gold}   Honor ${p.honor}/${p.honorMax}`,
        40, 158, '#aaa', 14,
      );
    }

    renderer.hline(188, '#2a2a2a');
    renderer.text('WHAT  WILL  YOU  DO?', 40, 208, '#666', 14);

    const restedNote = gs.ludusRested ? '  (already rested)' : '';
    const items = [
      { key: 'M', label: 'Mission Board', desc: 'Enter the arena',                   color: '#4caf50' },
      { key: 'B', label: 'Barracks',      desc: `Rest and recover HP / MP${restedNote}`, color: '#42a5f5' },
      { key: 'S', label: 'Stash',         desc: 'View your equipment',                color: '#ffb74d' },
      { key: 'G', label: 'Gate to Town',  desc: 'Visit the market',                   color: '#ce93d8' },
    ];
    items.forEach((item, i) => {
      const y = 248 + i * 46;
      renderer.text('[',        40,        y, '#666',     16);
      renderer.text(item.key,   52,        y, '#fff',     16);
      renderer.text(']',        62,        y, '#666',     16);
      renderer.text(item.label, 82,        y, item.color, 16);
      renderer.text(`— ${item.desc}`, 82 + 168, y, '#555', 13);
    });

    renderer.hline(H - 62, '#2a2a2a');
    gs.messages.slice(-2).forEach((msg, i) => {
      renderer.text(msg, 40, H - 50 + i * 20, '#777', 13);
    });
  },

  handle(gs, e) {
    switch (e.key.toUpperCase()) {
      case 'M': {
        gs.dungeon = new Dungeon(COLS, ROWS);
        gs.dungeon.generate();
        gs.player.x = gs.dungeon.startX;
        gs.player.y = gs.dungeon.startY;
        gs.messages = [`${gs.player.name} enters the arena. Floor ${gs.dungeon.floor}.`];
        transition('EXPLORATION');
        return false;
      }
      case 'B': {
        if (!gs.ludusRested) {
          gs.player.stats.hp = gs.player.stats.maxHp;
          gs.player.stats.mp = gs.player.stats.maxMp;
          gs.ludusRested = true;
          gs.messages.push('You rest in the barracks. HP and MP fully restored.');
        } else {
          gs.messages.push('You have already rested this cycle. Complete a mission first.');
        }
        return true;
      }
      case 'S':
        transition('STASH');
        return false;
      case 'G':
        gs.messages.push('[Town Gate] Coming in a future update.');
        return true;
    }
    return false;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: EXPLORATION
// ═══════════════════════════════════════════════════════════════════════════════
const MOVE_KEYS = {
  ArrowUp:    [0, -1], ArrowDown:  [0,  1],
  ArrowLeft:  [-1, 0], ArrowRight: [1,  0],
  k: [0, -1], j: [0,  1], h: [-1, 0], l: [1,  0],
  y: [-1, -1], u: [1, -1], b: [-1, 1], n: [1,  1],
};

const EXPLORATION = {
  enter(gs) {
    gs.ludusRested = false;
    gs.dungeon.computeFov(gs.player.x, gs.player.y);
  },

  draw(gs) {
    renderer.drawDungeon(gs.dungeon, gs.player);
    hud.draw(gs.player, gs.dungeon.floor, gs.messages);
  },

  handle(gs, e) {
    // Debug escape: return to Ludus
    if (e.key === 'Escape') {
      gs.messages.push('You retreat from the arena.');
      transition('LUDUS');
      return false;
    }

    const delta = MOVE_KEYS[e.key];
    if (!delta) return false;

    const nx = gs.player.x + delta[0];
    const ny = gs.player.y + delta[1];

    // Stepping on stairs → descend
    if (gs.dungeon.isStairs(nx, ny)) {
      gs.dungeon.descend();
      gs.player.x = gs.dungeon.startX;
      gs.player.y = gs.dungeon.startY;
      gs.dungeon.computeFov(gs.player.x, gs.player.y);
      gs.messages.push(`Descended to floor ${gs.dungeon.floor}.`);
      return true;
    }

    if (!gs.dungeon.isPassable(nx, ny)) return false;

    // Player bumps into an enemy → enter combat (player attacks first)
    const target = gs.dungeon.enemies.find(e => e.alive && e.x === nx && e.y === ny);
    if (target) {
      gs.combat = {
        enemy: target,
        log:   [`You engage the ${target.name}!`],
        turn:  'player',
      };
      transition('COMBAT');
      return false;
    }

    // Normal move
    gs.player.x = nx;
    gs.player.y = ny;
    gs.dungeon.computeFov(gs.player.x, gs.player.y);

    // Item pickup — auto-collect anything on this tile
    const itemIdx = gs.dungeon.items.findIndex(
      it => it.x === gs.player.x && it.y === gs.player.y,
    );
    if (itemIdx !== -1) {
      const { itemId } = gs.dungeon.items[itemIdx];
      gs.dungeon.items.splice(itemIdx, 1);
      const result = gs.player.pickup(itemId);
      const def    = ITEMS[itemId];
      const verb   = result === 'equipped' ? '(equipped)' : '(stored in pack)';
      gs.messages.push(`Picked up ${def.name} ${verb}.`);
    }

    // Enemy turns — may transition to COMBAT if an enemy closes in
    processEnemyTurns(gs);

    // If processEnemyTurns called transition(), gs.state is no longer EXPLORATION.
    // Returning false prevents a redundant EXPLORATION redraw over the COMBAT screen.
    return gs.state === 'EXPLORATION';
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: COMBAT
// ═══════════════════════════════════════════════════════════════════════════════
const COMBAT = {
  enter(gs) {
    if (!gs.combat.log.length) {
      gs.combat.log = [`You engage the ${gs.combat.enemy.name}!`];
    }
  },

  draw(gs) {
    // Dungeon is "frozen" during combat — draw it but don't update FOV
    renderer.drawDungeon(gs.dungeon, gs.player);
    textPanel.draw(gs.combat);
  },

  handle(gs, e) {
    const { turn } = gs.combat;

    // Victory or death: any key to advance
    if (turn === 'victory' || turn === 'dead') {
      if (e.key === 'Enter' || e.key === ' ') {
        if (turn === 'dead') {
          transition('GAME_OVER');
        } else {
          // Remove dead enemies and return to exploration
          gs.dungeon.enemies = gs.dungeon.enemies.filter(en => en.alive);
          transition('EXPLORATION');
        }
        return false;
      }
      return false;
    }

    if (turn !== 'player') return false;

    const prevState = gs.state;

    if (e.key.toLowerCase() === 'a') {
      doPlayerAttack(gs);
    } else if (e.key.toLowerCase() === 'f') {
      doPlayerFlee(gs);    // may call transition('EXPLORATION') internally
    } else if (e.key.toLowerCase() === 'i') {
      doUseItem(gs);
    } else {
      return false;
    }

    // If a transition happened (e.g. flee succeeded), don't redraw COMBAT
    return gs.state === prevState;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: GAME_OVER
// ═══════════════════════════════════════════════════════════════════════════════
const GAME_OVER = {
  enter() {},

  draw(gs) {
    renderer.clearFull('#060608');
    renderer.text(
      'YOU  HAVE  FALLEN',
      renderer.centerX('YOU  HAVE  FALLEN', 34), 190, '#ef5350', 34,
    );
    if (gs.player) {
      const summary = `${gs.player.name}  —  ${gs.player.classDef.name}  —  Level ${gs.player.level}`;
      renderer.text(summary, renderer.centerX(summary, 18), 258, '#888', 18);
    }
    renderer.text(
      '"The crowd is silent."',
      renderer.centerX('"The crowd is silent."', 16), 340, '#555', 16,
    );
    renderer.hline(430, '#2a2a2a');
    renderer.text(
      'Press Enter to return to the title screen',
      renderer.centerX('Press Enter to return to the title screen', 14), 462, '#777', 14,
    );
  },

  handle(gs, e) {
    if (e.key === 'Enter') {
      // Reset for a fresh run
      gs.player      = null;
      gs.dungeon     = null;
      gs.messages    = [];
      gs.ludusRested = false;
      transition('TITLE');
      return false;
    }
    return false;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATE: STASH
// ═══════════════════════════════════════════════════════════════════════════════
const SLOT_LABELS = {
  head: 'Head', body: 'Body', boots: 'Boots',
  mainhand: 'Weapon', offhand: 'Off-hand', ring: 'Ring', necklace: 'Neck',
};

const STASH = {
  enter() {},

  draw(gs) {
    renderer.clearFull('#0a0a0a');
    const W = canvas.width;
    const H = canvas.height;

    renderer.text('STASH', renderer.centerX('STASH', 26), 22, '#ffb74d', 26);
    renderer.hline(58, '#2a2a2a');

    // ── Left column: equipped gear ──────────────────────────────────────────
    renderer.text('EQUIPPED', 40, 72, '#666', 13);
    let ey = 94;
    for (const [slot, label] of Object.entries(SLOT_LABELS)) {
      const itemId = gs.player.equipment[slot];
      const name   = itemId ? ITEMS[itemId].name : '(empty)';
      const color  = itemId ? '#ccc' : '#3a3a3a';
      renderer.text(`${label.padEnd(8)}: ${name}`, 40, ey, color, 13);
      ey += 20;
    }

    // Stats summary
    renderer.hline(ey + 8, '#1a1a1a');
    ey += 20;
    const s = gs.player.stats;
    renderer.text(`STR ${s.str}  DEF ${s.def}  SPD ${s.spd}  HP ${s.hp}/${s.maxHp}  MP ${s.mp}/${s.maxMp}`, 40, ey, '#888', 13);

    // ── Right column: pack ──────────────────────────────────────────────────
    const RIGHT = Math.floor(W / 2) + 10;
    renderer.text(`PACK  (${gs.player.inventory.slots.length}/${gs.player.inventory.capacity})`, RIGHT, 72, '#666', 13);

    const packSlots = gs.player.inventory.slots;
    if (packSlots.length === 0) {
      renderer.text('(empty)', RIGHT, 94, '#3a3a3a', 13);
    } else {
      packSlots.slice(0, 15).forEach((slot, i) => {
        const def = ITEMS[slot.itemId];
        if (!def) return;
        const qty  = slot.qty > 1 ? ` ×${slot.qty}` : '';
        const hint = (def.type === 'weapon' || def.type === 'armor') ? ' [equip]' : '';
        renderer.text(`[${i + 1}] ${def.name}${qty}${hint}`, RIGHT, 94 + i * 20, '#ccc', 13);
      });
    }

    renderer.hline(H - 44, '#2a2a2a');
    renderer.text('1–9 to equip gear from pack   Escape to leave', 40, H - 30, '#555', 13);
  },

  handle(gs, e) {
    if (e.key === 'Escape') { transition('LUDUS'); return false; }

    const idx = parseInt(e.key, 10) - 1;
    if (!isNaN(idx) && idx >= 0 && idx < gs.player.inventory.slots.length) {
      const { itemId } = gs.player.inventory.slots[idx];
      const def = ITEMS[itemId];
      if (def && (def.type === 'weapon' || def.type === 'armor')) {
        gs.player.equip(itemId);
        return true; // redraw to show updated equipment
      }
    }
    return false;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// State registry + machine
// ═══════════════════════════════════════════════════════════════════════════════
const STATES = {
  TITLE,
  CHARACTER_CLASS,
  CHARACTER_NAME,
  INTRO,
  LUDUS,
  EXPLORATION,
  COMBAT,
  GAME_OVER,
  STASH,
};

/**
 * Switch to a new state: update gs.state, run enter(), then draw().
 *
 * Any handle() that calls transition() must return false afterward —
 * transition() already drew the new state, and returning true would cause a
 * second redundant draw of the new state from the keydown handler.
 */
function transition(newState) {
  gs.state = newState;
  STATES[newState].enter(gs);
  STATES[newState].draw(gs);
}

document.addEventListener('keydown', (e) => {
  const s = STATES[gs.state];
  if (!s) return;
  const consumed = s.handle(gs, e);
  if (consumed) {
    e.preventDefault();
    s.draw(gs);
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────
transition('TITLE');
