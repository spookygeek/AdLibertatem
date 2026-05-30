# Ad Libertatem

Vanilla JS HTML5 Canvas roguelike using [rot.js](https://ondras.github.io/rot.js/) for dungeon generation. No build tools — runs directly in the browser.

## Running locally

### Option 1: Docker Compose (recommended)
```bash
docker compose up -d
```
Open http://localhost:8080

### Option 2: `serve` (no Docker required)
```bash
npm install
npm run serve
```
Open http://localhost:8080

> ES modules require an HTTP server — opening `index.html` via `file://` will not work.

## Dev setup

```bash
npm install        # installs ESLint — no build step
npm run lint       # lint js/ files
```

## Controls

| Key | Action |
|-----|--------|
| Arrow keys | Move |
| h / j / k / l | Move (vi keys) |

## Stack

- rot.js 2.x — dungeon generation (loaded from CDN)
- HTML5 Canvas — rendering
- Native ES modules — no bundler
- nginx (Docker) — local static server
- GitHub Actions — CI lint check
