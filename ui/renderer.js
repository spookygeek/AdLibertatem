const FONT_SIZE = 16;
const CELL_W = 10;
const CELL_H = FONT_SIZE;

// Full brightness — tile is in the player's current FOV
const GLYPH = {
  '#': { char: '#', color: '#888' },
  '.': { char: '.', color: '#444' },
  '>': { char: '>', color: '#ccc' },
};

// Dim memory — tile was explored but is no longer in FOV
const GLYPH_DIM = {
  '#': { char: '#', color: '#2a2a2a' },
  '.': { char: '.', color: '#1a1a1a' },
  '>': { char: '>', color: '#555' },
};

export class Renderer {
  constructor(canvas, cols, rows, hudRows) {
    this.canvas  = canvas;
    this.cols    = cols;
    this.rows    = rows;
    this.hudRows = hudRows;
    this.cellW   = CELL_W;
    this.cellH   = CELL_H;

    canvas.width  = cols * CELL_W;
    canvas.height = (rows + hudRows) * CELL_H;

    this.ctx = canvas.getContext('2d');
    this.ctx.font          = `${FONT_SIZE}px "Courier New", monospace`;
    this.ctx.textBaseline  = 'top';
  }

  // ── Coordinate helpers ────────────────────────────────────────────────────

  cellX(col) { return col * this.cellW; }
  cellY(row) { return row * this.cellH; }
  hudY(row)  { return (this.rows + row) * this.cellH; }

  // ── Drawing primitives ────────────────────────────────────────────────────

  /** Fill the dungeon area only. */
  clear() {
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Fill the entire canvas — used by menu/title screens. */
  clearFull(bgColor = '#0a0a0a') {
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw text at pixel coordinates (not grid cells).
   * Temporarily changes font size, then restores default — never breaks dungeon rendering.
   */
  text(str, x, y, color, fontSize = FONT_SIZE) {
    this.ctx.fillStyle = color;
    this.ctx.font      = `${fontSize}px "Courier New", monospace`;
    this.ctx.fillText(str, x, y);
    this.ctx.font      = `${FONT_SIZE}px "Courier New", monospace`;
  }

  /** Full-width horizontal separator line, 1px tall. */
  hline(y, color = '#333') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, y, this.canvas.width, 1);
  }

  /**
   * Returns the x coordinate that horizontally centers str on the canvas.
   * Temporarily sets the font for measurement, then restores default.
   */
  centerX(str, fontSize = FONT_SIZE) {
    this.ctx.font   = `${fontSize}px "Courier New", monospace`;
    const w         = this.ctx.measureText(str).width;
    this.ctx.font   = `${FONT_SIZE}px "Courier New", monospace`;
    return Math.floor((this.canvas.width - w) / 2);
  }

  // ── Grid-based helpers (used by HUD) ─────────────────────────────────────

  drawChar(char, col, row, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillText(char, this.cellX(col), this.cellY(row));
  }

  drawHudChar(str, col, row, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillText(str, this.cellX(col), this.hudY(row));
  }

  // ── Dungeon rendering ─────────────────────────────────────────────────────

  drawDungeon(dungeon, player) {
    this.clear();

    // Tiles — three visibility states
    for (const [key, tile] of Object.entries(dungeon.tiles)) {
      const [x, y] = key.split(',').map(Number);

      if (dungeon.visible.has(key)) {
        const g = GLYPH[tile] ?? GLYPH['#'];
        this.drawChar(g.char, x, y, g.color);
      } else if (dungeon.explored.has(key)) {
        const g = GLYPH_DIM[tile] ?? GLYPH_DIM['#'];
        this.drawChar(g.char, x, y, g.color);
      }
      // Hidden: draw nothing, black background shows through
    }

    // Enemies — only draw when in the player's current FOV
    for (const enemy of dungeon.enemies) {
      if (!enemy.alive) continue;
      if (dungeon.visible.has(`${enemy.x},${enemy.y}`)) {
        this.drawChar(enemy.char, enemy.x, enemy.y, enemy.color);
      }
    }

    // Player is always visible
    this.drawChar(player.char, player.x, player.y, player.color);
  }
}
