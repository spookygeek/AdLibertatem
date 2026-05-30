# Ad Libertatem — Claude Context

## What this is
A vanilla JS HTML5 Canvas roguelike. No build tools, no frameworks — runs directly in the browser from `index.html`. rot.js 2.x loaded from CDN as a UMD global (`window.ROT`).

## How to run
```bash
docker compose up -d   # nginx on port 8080
# or
npm run serve          # npx serve on port 8080
```

Open http://localhost:8080

> ES modules require HTTP — `file://` won't work.

## Dev workflow
- Branch per change. `main` = production.
- `npm run lint` before every push.
- No build step — the browser runs the source directly.

## Architecture
```
index.html       — entry point; loads rot.js CDN then js/main.js
css/style.css    — minimal black-background layout
js/
  main.js        — canvas setup, game loop, keyboard listener
  dungeon.js     — rot.js Digger map generation; exposes isPassable()
  player.js      — position + movement; reads KEY_MAP for arrow + vi keys
  renderer.js    — canvas 2D rendering of tiles and player
docker-compose.yml  — nginx:alpine static server for local dev
nginx.conf          — MIME types + try_files config
.github/workflows/ci.yml  — ESLint on push/PR
```

## Key decisions
- **rot.js as UMD global** — loaded via `<script>` tag (not import), sets `window.ROT`; avoids CDN ESM compatibility issues. Declared `ROT: 'readonly'` in eslint.config.js so ESLint doesn't flag it.
- **No build tools** — deliberate; simplicity is the point. Don't add bundlers or transpilers without good reason.
- **ES modules for game code** — `type="module"` scripts get deferred execution and module scope for free; clean import/export between game files.
