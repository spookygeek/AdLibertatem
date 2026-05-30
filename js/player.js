const KEY_MAP = {
  ArrowUp:    [0, -1],
  ArrowDown:  [0,  1],
  ArrowLeft:  [-1, 0],
  ArrowRight: [1,  0],
  k: [0, -1],
  j: [0,  1],
  h: [-1, 0],
  l: [1,  0],
};

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  handleKey(key, dungeon) {
    const delta = KEY_MAP[key];
    if (!delta) return false;
    const nx = this.x + delta[0];
    const ny = this.y + delta[1];
    if (!dungeon.isPassable(nx, ny)) return false;
    this.x = nx;
    this.y = ny;
    return true;
  }
}
