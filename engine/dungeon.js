const FOV_RADIUS = 8;

export class Dungeon {
  constructor(cols, rows) {
    this.cols     = cols;
    this.rows     = rows;
    this.tiles    = {};
    this.startX   = 1;
    this.startY   = 1;
    this.floor    = 1;
    this.rooms    = [];
    this.visible  = new Set();  // tiles in the player's current FOV
    this.explored = new Set();  // tiles ever seen (persists until floor change)
  }

  generate() {
    this.tiles    = {};
    this.visible  = new Set();
    this.explored = new Set();

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
    return this;
  }

  descend() {
    this.floor += 1;
    this.generate();  // resets tiles + explored + visible for the new floor
  }

  /**
   * Recompute which tiles are currently visible from (px, py).
   * Clears this.visible, then fills it (and this.explored) using rot.js FOV.
   * Call this whenever the player moves.
   */
  computeFov(px, py) {
    this.visible.clear();

    // Light passes through floor tiles and stairs; walls block it.
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

  isStairs(x, y) {
    return this.tiles[`${x},${y}`] === '>';
  }

  _placeStairs() {
    if (this.rooms.length < 2) return;
    const last = this.rooms[this.rooms.length - 1].getCenter();
    this.tiles[`${last[0]},${last[1]}`] = '>';
  }
}
