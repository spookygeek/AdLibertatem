import { createEnemy } from '../data/enemies.js';

const FOV_RADIUS = 8;

// How many enemies spawn per floor (min 4, scales with depth, cap 12)
const enemyCount = (floor) => Math.min(4 + Math.floor(floor * 0.6), 12);

// Enemy type pool by floor depth
function enemyPool(floor) {
  if (floor < 4)  return ['prisoner', 'prisoner', 'gladiator', 'beast'];
  if (floor < 8)  return ['gladiator', 'mercenary', 'beast', 'prisoner'];
  if (floor < 15) return ['mercenary', 'legionary', 'beast', 'gladiator'];
  return ['legionary', 'legionary', 'mercenary', 'beast'];
}

export class Dungeon {
  constructor(cols, rows) {
    this.cols     = cols;
    this.rows     = rows;
    this.tiles    = {};
    this.startX   = 1;
    this.startY   = 1;
    this.floor    = 1;
    this.rooms    = [];
    this.visible  = new Set();
    this.explored = new Set();
    this.enemies  = [];
  }

  generate() {
    this.tiles    = {};
    this.visible  = new Set();
    this.explored = new Set();
    this.enemies  = [];

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
    this._spawnEnemies();
    return this;
  }

  descend() {
    this.floor += 1;
    this.generate();
  }

  /**
   * Recompute which tiles are currently visible from (px, py).
   * Clears this.visible, then fills it (and this.explored) using rot.js FOV.
   */
  computeFov(px, py) {
    this.visible.clear();
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

  _spawnEnemies() {
    // Skip first room (player start) and last room (stairs)
    const spawnRooms = this.rooms.slice(1, this.rooms.length - 1);
    if (spawnRooms.length === 0) return;

    const count = enemyCount(this.floor);
    const pool  = enemyPool(this.floor);

    for (let i = 0; i < count; i++) {
      const room  = ROT.RNG.getItem(spawnRooms);
      const left  = room.getLeft()  + 1;
      const top   = room.getTop()   + 1;
      const right = room.getRight() - 1;
      const bot   = room.getBottom()- 1;

      if (right < left || bot < top) continue; // room too small

      let x, y, tries = 0;
      do {
        x = ROT.RNG.getUniformInt(left, right);
        y = ROT.RNG.getUniformInt(top,  bot);
        tries++;
      } while (
        tries < 20 &&
        this.enemies.some(e => e.x === x && e.y === y)
      );

      if (tries >= 20) continue;

      const typeId = ROT.RNG.getItem(pool);
      this.enemies.push(createEnemy(typeId, x, y, this.floor));
    }
  }
}
