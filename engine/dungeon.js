export class Dungeon {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.tiles = {};
    this.startX = 1;
    this.startY = 1;
    this.floor = 1;
    this.rooms = [];
  }

  generate() {
    this.tiles = {};
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
    this.generate();
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
