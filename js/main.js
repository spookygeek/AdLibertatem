import { Dungeon } from './dungeon.js';
import { Player } from './player.js';
import { Renderer } from './renderer.js';

const TILE = 16;
const COLS = 60;
const ROWS = 40;

const canvas = document.getElementById('game-canvas');
canvas.width = COLS * TILE;
canvas.height = ROWS * TILE;

const dungeon = new Dungeon(COLS, ROWS);
dungeon.generate();

const player = new Player(dungeon.startX, dungeon.startY);
const renderer = new Renderer(canvas, TILE);

document.addEventListener('keydown', (e) => {
  const moved = player.handleKey(e.key, dungeon);
  if (moved) renderer.draw(dungeon, player);
});

renderer.draw(dungeon, player);
