const BAR_WIDTH = 20;

function bar(current, max) {
  const filled = Math.round((current / max) * BAR_WIDTH);
  return '[' + '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled) + ']';
}

export class Hud {
  constructor(renderer) {
    this.r = renderer;
  }

  draw(player, floor, messages = []) {
    const { r } = this;
    const s     = player.stats;

    // HUD background
    r.ctx.fillStyle = '#111';
    r.ctx.fillRect(0, r.hudY(0), r.canvas.width, r.hudRows * r.cellH);

    // Row 0 — identity + economy
    r.drawHudChar(
      `${player.classDef.name}  Floor ${floor}  Lvl ${player.level}  XP ${player.xp}/${player.xpNext}  Gold ${player.gold}  Honor ${player.honor}/${player.honorMax}`,
      0, 0, '#aaa',
    );

    // Row 1 — HP bar
    const hpColor = s.hp / s.maxHp > 0.4 ? '#4caf50' : '#f44336';
    r.drawHudChar(`HP ${bar(s.hp, s.maxHp)} ${s.hp}/${s.maxHp}`, 0, 1, hpColor);

    // Row 2 — MP bar
    r.drawHudChar(`MP ${bar(s.mp, s.maxMp)} ${s.mp}/${s.maxMp}`, 0, 2, '#42a5f5');

    // Rows 3–4 — last 2 messages
    messages.slice(-2).forEach((msg, i) => {
      r.drawHudChar(msg, 0, 3 + i, '#ccc');
    });
  }
}
