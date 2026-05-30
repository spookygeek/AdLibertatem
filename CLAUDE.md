# Ad Libertatem — Claude Context

## What this is
A vanilla JS HTML5 Canvas roguelike set in a Roman gladiatorial arena. No build tools — runs directly in the browser from `index.html`. rot.js 2.x from CDN (UMD global `window.ROT`). Turn-based combat, 4 gladiator classes, mythological bosses every 5 floors.

## How to run
```bash
docker compose up -d   # nginx on port 8080
# or
npm run serve          # npx serve on port 8080
```
Open http://localhost:8080. ES modules require HTTP — `file://` won't work.

## Dev workflow
- Branch per change. `main` = production.
- `npm run lint` before every push.
- No build step — the browser runs the source directly.

## Architecture
```
index.html          — entry point; loads rot.js CDN then game.js
game.js             — canvas init, keyboard input, top-level game loop
engine/
  dungeon.js        — rot.js Digger map; isPassable(), descend(); stair placement
  combat.js         — resolveMelee(attacker, defender), applyDamage(target, dmg)
  player.js         — Player class; gainXp(), _levelUp(), heal(), isDead()
  economy.js        — Inventory (add/remove/has), Vendor (buy/sell at 50% sell-back)
ui/
  renderer.js       — ASCII canvas renderer; drawDungeon(dungeon, player)
  hud.js            — HP/MP bar rows + message log drawn below dungeon area
data/
  classes.js        — 4 gladiator classes: Secutor, Retiarius, Murmillo, Dimachaerus
  bosses.js         — mythological creature definitions (floor 5, 10, 15, 20)
  items.js          — gear (weapons/armor), consumables (potions), scrolls
```

## Key decisions
- **rot.js UMD global** — loaded via `<script>` in index.html, sets `window.ROT`. Declared `ROT: 'readonly'` in eslint.config.js.
- **ASCII on Canvas** — `ctx.fillText` with `"Courier New", monospace`; `CELL_W=10, CELL_H=16`. HUD drawn in rows below the dungeon area on the same canvas.
- **No build tools** — deliberate. Don't add bundlers or transpilers.
- **Combat formula** — `damage = max(1, atk + rand(1,4) − def)`; 10% crit ×1.5; miss chance ~5% adjusted by speed delta.
- **XP formula** — `xp_for_level = level × 20`; on level-up: +3 maxHp, +1 atk, +1 def.
- **Inventory** — fixed 20-slot capacity; stackable flag on consumables/scrolls.
- **Boss placement** — floors 5/10/15/20 defined in `data/bosses.js`; `game.js` is responsible for spawning on floor entry.
