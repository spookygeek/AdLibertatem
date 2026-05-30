/* global ROT */

export class Dungeon {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.tiles = {};
    this.startX = 1;
    this.startY = 1;
  }

  generate() {
    const digger = new ROT.Map.Digger(this.cols, this.rows);
    digger.create((x, y, wall) => {
      this.tiles[`${x},${y}`] = wall ? '#' : '.';
    });

    const rooms = digger.getRooms();
    if (rooms.length > 0) {
      const center = rooms[0].getCenter();
      this.startX = center[0];
      this.startY = center[1];
    }
  }

  isPassable(x, y) {
    return this.tiles[`${x},${y}`] === '.';
  }
}
