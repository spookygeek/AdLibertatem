const FONT_SIZE = 16;
const CELL_W = 10;
const CELL_H = FONT_SIZE;

const GLYPH = {
  '#': { char: '#', color: '#555' },
  '.': { char: '.', color: '#2a2a2a' },
  '>': { char: '>', color: '#aaa' },
};

export class Renderer {
  constructor(canvas, cols, rows, hudRows) {
    this.canvas = canvas;
    this.cols = cols;
    this.rows = rows;
    this.hudRows = hudRows;
    this.cellW = CELL_W;
    this.cellH = CELL_H;

    canvas.width = cols * CELL_W;
    canvas.height = (rows + hudRows) * CELL_H;

    this.ctx = canvas.getContext('2d');
    this.ctx.font = `${FONT_SIZE}px "Courier New", monospace`;
    this.ctx.textBaseline = 'top';
  }

  // Top-left pixel of a dungeon cell
  cellX(col) { return col * this.cellW; }
  cellY(row) { return row * this.cellH; }

  // Top-left pixel of a HUD row (below dungeon area)
  hudY(row) { return (this.rows + row) * this.cellH; }

  clear() {
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawChar(char, col, row, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillText(char, this.cellX(col), this.cellY(row));
  }

  drawHudChar(char, col, row, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillText(char, this.cellX(col), this.hudY(row));
  }

  drawDungeon(dungeon, player) {
    this.clear();

    for (const [key, tile] of Object.entries(dungeon.tiles)) {
      const [x, y] = key.split(',').map(Number);
      const g = GLYPH[tile] ?? GLYPH['#'];
      this.drawChar(g.char, x, y, g.color);
    }

    this.drawChar(player.char, player.x, player.y, player.color);
  }
}
