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
    const ctx = r.ctx;
    const s = player.stats;

    // HUD background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, r.hudY(0), r.canvas.width, r.hudRows * r.cellH);

    // Row 0 — class + floor
    r.drawHudChar(`${player.classDef.name}  Floor ${floor}  Lvl ${player.level}  XP ${player.xp}/${player.xpNext}  Gold ${player.gold}`, 0, 0, '#aaa');

    // Row 1 — HP bar
    const hpColor = s.hp / s.maxHp > 0.4 ? '#4caf50' : '#f44336';
    r.drawHudChar(`HP ${bar(s.hp, s.maxHp)} ${s.hp}/${s.maxHp}`, 0, 1, hpColor);

    // Row 2 — MP bar
    r.drawHudChar(`MP ${bar(s.mp, s.maxMp)} ${s.mp}/${s.maxMp}`, 0, 2, '#42a5f5');

    // Row 3-4 — message log (last 2 messages)
    const recent = messages.slice(-2);
    recent.forEach((msg, i) => {
      r.drawHudChar(msg, 0, 3 + i, '#ccc');
    });
  }
}
