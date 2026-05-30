const TILE_COLORS = {
  '#': '#444',
  '.': '#1a1a1a',
};

const FLOOR_OUTLINE = '#2a2a2a';

export class Renderer {
  constructor(canvas, tileSize) {
    this.ctx = canvas.getContext('2d');
    this.canvas = canvas;
    this.T = tileSize;
  }

  draw(dungeon, player) {
    const { ctx, T } = this;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const [key, tile] of Object.entries(dungeon.tiles)) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillStyle = TILE_COLORS[tile] ?? '#000';
      ctx.fillRect(x * T, y * T, T, T);
      if (tile === '.') {
        ctx.strokeStyle = FLOOR_OUTLINE;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x * T + 0.5, y * T + 0.5, T - 1, T - 1);
      }
    }

    ctx.fillStyle = '#f0c040';
    ctx.fillRect(player.x * T + 3, player.y * T + 3, T - 6, T - 6);
  }
}
