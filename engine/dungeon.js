import { createEnemy }         from '../data/enemies.js';
import { ITEMS }               from '../data/items.js';
import { BOSSES, createBoss }  from '../data/bosses.js';

const FOV_RADIUS = 8;

const enemyCount = (floor) => Math.min(4 + Math.floor(floor * 0.6), 12);

function enemyPool(floor) {
  if (floor < 4)  return ['prisoner', 'prisoner', 'gladiator', 'beast'];
  if (floor < 8)  return ['gladiator', 'mercenary', 'beast', 'prisoner'];
  if (floor < 15) return ['mercenary', 'legionary', 'beast', 'gladiator'];
  return ['legionary', 'legionary', 'mercenary', 'beast'];
}

export class Dungeon {
  constructor(cols, rows) {
    this.cols         = cols;
    this.rows         = rows;
    this.tiles        = {};
    this.startX       = 1;
    this.startY       = 1;
    this.floor        = 1;
    this.rooms        = [];
    this.visible      = new Set();
    this.explored     = new Set();
    this.enemies      = [];
    this.items        = [];
    this.bossFloor    = false;  // true when this floor has a boss guardian
    this.bossDefeated = false;  // stairs only unlock when true
  }

  generate() {
    this.tiles        = {};
    this.visible      = new Set();
    this.explored     = new Set();
    this.enemies      = [];
    this.items        = [];
    this.bossFloor    = false;
    this.bossDefeated = false;

    const digger = new ROT.Map.Digger(this.cols, this.rows);
    digger.create((x, y, wall) => {
      this.tiles[`${x},${y}`] = wall ? '#' : '.';
    });

    this.rooms = digger.getRooms();
    if (this.rooms.length > 0) {
      const c = this.rooms[0].getCenter();
      this.startX = c[0];
      this.startY = c[1];
    }

    this._placeStairs();
    this._spawnBoss();       // must run before _spawnEnemies so boss room is flagged
    this._spawnEnemies();
    this._spawnItems();
    return this;
  }

  descend() {
    this.floor += 1;
    this.generate();
  }

  computeFov(px, py) {
    this.visible.clear();
    const fov = new ROT.FOV.PreciseShadowcasting((x, y) => {
      const t = this.tiles[`${x},${y}`];
      return t === '.' || t === '>';
    });
    fov.compute(px, py, FOV_RADIUS, (x, y) => {
      const key = `${x},${y}`;
      this.visible.add(key);
      this.explored.add(key);
    });
  }

  isPassable(x, y) {
    return this.tiles[`${x},${y}`] === '.';
  }

  /** Stairs are only accessible when the boss has been defeated (or there is no boss). */
  isStairs(x, y) {
    if (this.tiles[`${x},${y}`] !== '>') return false;
    if (this.bossFloor && !this.bossDefeated) return false;
    return true;
  }

  _placeStairs() {
    if (this.rooms.length < 2) return;
    const last = this.rooms[this.rooms.length - 1].getCenter();
    this.tiles[`${last[0]},${last[1]}`] = '>';
  }

  _spawnBoss() {
    const template = BOSSES.find(b => b.floor === this.floor);
    if (!template) return;

    this.bossFloor = true;

    // Boss guards the last room (same room as the stairs)
    const lastRoom = this.rooms[this.rooms.length - 1];
    const center   = lastRoom.getCenter();

    // Place boss one tile away from stairs so both can coexist
    const bx = center[0] + (center[0] < this.cols / 2 ? 1 : -1);
    const by = center[1];

    const boss = createBoss(template.id, bx, by, this.floor);
    this.enemies.push(boss);
  }

  _spawnItems() {
    const count = 2 + Math.floor(ROT.RNG.getUniform() * 3);
    const pool  = this._itemPool();

    for (let i = 0; i < count; i++) {
      const room  = ROT.RNG.getItem(this.rooms);
      const left  = room.getLeft()   + 1;
      const top   = room.getTop()    + 1;
      const right = room.getRight()  - 1;
      const bot   = room.getBottom() - 1;

      if (right < left || bot < top) continue;

      let x, y, tries = 0;
      do {
        x = ROT.RNG.getUniformInt(left, right);
        y = ROT.RNG.getUniformInt(top,  bot);
        tries++;
      } while (
        tries < 20 && (
          this.items.some(it => it.x === x && it.y === y) ||
          this.enemies.some(e  => e.x  === x && e.y  === y) ||
          (x === this.startX && y === this.startY)
        )
      );

      if (tries >= 20) continue;
      const itemId = ROT.RNG.getItem(pool);
      const def    = ITEMS[itemId];
      this.items.push({ itemId, x, y, char: def.char, color: def.color });
    }
  }

  _itemPool() {
    if (this.floor < 4)  return ['health_potion', 'health_potion', 'gladius', 'bronze_shield', 'iron_helm', 'leather_boots'];
    if (this.floor < 8)  return ['health_potion', 'mana_potion', 'trident', 'iron_shield', 'scroll_of_fire', 'lorica_manica'];
    if (this.floor < 15) return ['bulls_blood_potion', 'trident', 'serpent_scale', 'scroll_of_fire', 'scroll_of_haste', 'ring_of_strength'];
    return ['bulls_blood_potion', 'giant_club', 'serpent_scale', 'regen_scroll', 'ring_of_vitality', 'amulet_of_fortune'];
  }

  _spawnEnemies() {
    // Skip first room (player start) and last room (boss/stairs)
    const spawnRooms = this.rooms.slice(1, this.rooms.length - 1);
    if (spawnRooms.length === 0) return;

    const count = enemyCount(this.floor);
    const pool  = enemyPool(this.floor);

    for (let i = 0; i < count; i++) {
      const room  = ROT.RNG.getItem(spawnRooms);
      const left  = room.getLeft()  + 1;
      const top   = room.getTop()   + 1;
      const right = room.getRight() - 1;
      const bot   = room.getBottom()- 1;

      if (right < left || bot < top) continue;

      let x, y, tries = 0;
      do {
        x = ROT.RNG.getUniformInt(left, right);
        y = ROT.RNG.getUniformInt(top,  bot);
        tries++;
      } while (
        tries < 20 &&
        this.enemies.some(e => e.x === x && e.y === y)
      );

      if (tries >= 20) continue;
      this.enemies.push(createEnemy(ROT.RNG.getItem(pool), x, y, this.floor));
    }
  }
}
