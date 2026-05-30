/* global ROT */
import { Dungeon } from './engine/dungeon.js';
import { Player } from './engine/player.js';
import { Renderer } from './ui/renderer.js';
import { Hud } from './ui/hud.js';
import { CLASSES } from './data/classes.js';

const COLS = 72;
const ROWS = 38;
const HUD_ROWS = 5;

const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas, COLS, ROWS, HUD_ROWS);
const hud = new Hud(renderer);

// Starting class — swap key to change default
const player = new Player(CLASSES.secutor);
const dungeon = new Dungeon(COLS, ROWS);
dungeon.generate();
player.x = dungeon.startX;
player.y = dungeon.startY;

const messages = ['Welcome to the arena. Survive.'];

function redraw() {
  renderer.drawDungeon(dungeon, player);
  hud.draw(player, dungeon.floor, messages);
}

document.addEventListener('keydown', (e) => {
  const dirs = {
    ArrowUp:    [0, -1], ArrowDown:  [0,  1],
    ArrowLeft:  [-1, 0], ArrowRight: [1,  0],
    k: [0, -1], j: [0,  1], h: [-1, 0], l: [1, 0],
    y: [-1, -1], u: [1, -1], b: [-1, 1], n: [1, 1],
  };
  const delta = dirs[e.key];
  if (!delta) return;
  e.preventDefault();

  const nx = player.x + delta[0];
  const ny = player.y + delta[1];

  if (dungeon.isPassable(nx, ny)) {
    player.x = nx;
    player.y = ny;
    redraw();
  }
});

redraw();
