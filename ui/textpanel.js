const BAR_W = 16;

function hpBar(hp, maxHp) {
  const filled = Math.round((hp / maxHp) * BAR_W);
  return '█'.repeat(filled) + '░'.repeat(BAR_W - filled);
}

export class TextPanel {
  constructor(renderer) {
    this.r = renderer;
  }

  draw(combat) {
    const { r }  = this;
    const enemy  = combat.enemy;
    const s      = enemy.stats;

    // Background — slightly different shade from HUD to signal combat mode
    r.ctx.fillStyle = '#080810';
    r.ctx.fillRect(0, r.hudY(0), r.canvas.width, r.hudRows * r.cellH);

    // Row 0: enemy name (left) + HP bar (right side of same row)
    const hpRatio = s.hp / s.maxHp;
    const hpColor = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ffb74d' : '#f44336';
    r.drawHudChar(enemy.name,                                       0,  0, enemy.color);
    r.drawHudChar(`HP ${hpBar(s.hp, s.maxHp)} ${s.hp}/${s.maxHp}`, 14, 0, hpColor);

    // Rows 1-2: last two combat log lines
    combat.log.slice(-2).forEach((msg, i) => {
      r.drawHudChar(`> ${msg}`, 0, 1 + i, '#ccc');
    });

    // Row 3: actions or outcome
    if (combat.turn === 'player') {
      r.drawHudChar('[A] ATTACK',   0,  3, '#4caf50');
      r.drawHudChar('[F] FLEE',     12, 3, '#ffb74d');
      r.drawHudChar('[I] USE ITEM', 21, 3, '#42a5f5');
    } else if (combat.turn === 'victory') {
      r.drawHudChar('★ VICTORY  —  Press Enter to continue', 0, 3, '#ffca28');
    } else if (combat.turn === 'dead') {
      r.drawHudChar('† YOU HAVE FALLEN  —  Press Enter', 0, 3, '#ef5350');
    }

    // Row 4: hint text
    if (combat.turn === 'player') {
      r.drawHudChar('A = Attack    F = Flee    I = Use Item', 0, 4, '#444');
    }
  }
}
