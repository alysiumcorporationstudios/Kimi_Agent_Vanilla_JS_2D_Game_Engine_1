# Kasi Lifestyle

A 2D top-down web game engine (HTML5 Canvas, vanilla JavaScript — no game-engine
libraries) with a South African township ("kasi") life-sim theme, served as a
Node.js/Express web service ready for Render.com's free tier.

![Genre](https://img.shields.io/badge/genre-top--down%20life--sim-orange)

## Features

- **Fixed-timestep game loop** (60 Hz update, decoupled render)
- **JSON-defined tile maps** with multiple layers (ground, collision, …)
- **Sprite system** — PNG spritesheets animated by JSON frame sequences
- **Player controller** — 8-directional movement, walk animations, collision
- **NPC system** — static or patrol-path NPCs with proximity dialogue
- **Object placement** — buildings, taxis, props from JSON, each with a collision box
- **Camera** — smooth follow, clamped to map boundaries
- **HTML/CSS UI overlay** — dialogue box, HUD, hints, loading screen
- **Y-sorted rendering** — walk behind houses and in front of tree trunks

All art is placeholder (colored shapes). Swap the PNGs for real art later — the
game picks up new files with **zero code changes**.

## Quick start (local)

```bash
npm install
npm start
# open http://localhost:3000
```

Requires Node.js 18+. No build step.

## Deploy to Render.com (free tier)

1. Push this folder to a GitHub/GitLab repo.
2. In the Render dashboard: **New → Blueprint** → select the repo.
3. Render reads `render.yaml` and provisions the web service automatically
   (Node runtime, free plan, `npm install` build, `npm start`, health check on
   `/healthz`).

Free-tier note: the service sleeps after ~15 minutes of inactivity, so the first
visit after a quiet period takes up to a minute to wake. That's a Render limit,
not a bug. A `Dockerfile` is included too, but the blueprint uses the native
Node runtime — no Docker needed.

## Controls

| Input | Action |
|---|---|
| WASD / Arrow keys | Move (8-directional) |
| E or Space | Talk to NPC / advance dialogue |
| F3 | Debug overlay (FPS, collision boxes, NPC radii) |

## Project structure

```
├── server.js                 # Express static server (+ /healthz)
├── render.yaml               # Render.com blueprint
├── package.json
└── public/
    ├── index.html            # Canvas + UI overlay DOM
    ├── css/style.css         # All UI styling (re-theme here)
    ├── src/
    │   ├── main.js           # Bootstrap
    │   ├── engine/           # === REUSABLE ENGINE (game-agnostic) ===
    │   │   ├── core/         # GameLoop, Input, AssetLoader, Camera
    │   │   ├── render/       # SpriteSheet + Animator
    │   │   ├── world/        # TileMap, CollisionWorld
    │   │   ├── entities/     # Entity, TopDownController, NPC
    │   │   └── ui/           # UIManager (dialogue + HUD)
    │   └── game/
    │       └── KasiGame.js   # === GAME GLUE (loads JSON, wires content) ===
    ├── data/                 # === ALL CONTENT — edit these, not the engine ===
    │   ├── config/game.json      # Title, start map, wallet, interact keys
    │   ├── maps/kasi-central.json
    │   ├── characters/player.json
    │   ├── characters/npcs.json
    │   └── objects/objects.json
    └── assets/
        ├── tiles/tiles.png   # Tileset strip (32px tiles, row-major)
        ├── sprites/*.png     # Character sheets (96×128: 3 frames × 4 dirs)
        └── objects/*.png     # One PNG per placeable object
```

The engine never hardcodes content: `KasiGame.js` reads the JSON files, derives
the asset manifest from them, and builds the world. Add content by editing JSON
and dropping in PNGs.

## How to add content

### Reskin an existing sprite (no code changes)

Replace the PNG file, keeping the **same filename and layout**:

- **Characters** (`assets/sprites/*.png`): 96×128 px sheet — 3 columns
  (idle, step A, step B) × 4 rows (down, left, right, up), 32×32 frames.
- **Tiles** (`assets/tiles/tiles.png`): horizontal strip of 32×32 tiles. Tile
  value in a map layer = frame index in the strip (0-based, left to right).
- **Objects** (`assets/objects/*.png`): any size; must match `width`/`height`
  in `objects.json` (or update those two numbers).

### Add a new NPC

1. Drop a sprite sheet in `public/assets/sprites/npc-skeleton.png` (96×128,
   layout above).
2. Add an entry in `public/data/characters/npcs.json`:

```json
"skeleton-crew-leader": {
  "id": "skeleton-crew-leader",
  "name": "Bra Vusi",
  "sprite": "/assets/sprites/npc-skeleton.png",
  "frameWidth": 32,
  "frameHeight": 32,
  "speed": 60,
  "facing": "down",
  "interactRadius": 48,
  "animations": {
    "idle-down":  { "frames": [0], "fps": 1 },
    "walk-down":  { "frames": [1, 0, 2, 0], "fps": 7 },
    "idle-left":  { "frames": [3], "fps": 1 },
    "walk-left":  { "frames": [4, 3, 5, 3], "fps": 7 },
    "idle-right": { "frames": [6], "fps": 1 },
    "walk-right": { "frames": [7, 6, 8, 6], "fps": 7 },
    "idle-up":    { "frames": [9], "fps": 1 },
    "walk-up":    { "frames": [10, 9, 11, 9], "fps": 7 }
  },
  "dialogue": ["Heita!", "Pull up a chair, the braai is just getting started."]
}
```

3. Spawn them in a map's `npcs` array:

```json
{ "id": "skeleton-crew-leader", "x": 20, "y": 24 }
```

or with a patrol route (tile coordinates — the NPC walks them in a loop):

```json
{ "id": "skeleton-crew-leader", "x": 20, "y": 24, "patrol": [[20, 24], [26, 24], [26, 30]] }
```

Omit `patrol` (or give one point) for a static NPC. `facing` sets the initial
direction (`down`, `up`, `left`, `right`).

### Add a new object type (building / vehicle / prop)

1. Drop a PNG in `public/assets/objects/`, e.g. `braai-stand.png`.
2. Register it in `public/data/objects/objects.json`:

```json
"braai-stand": {
  "image": "/assets/objects/braai-stand.png",
  "width": 32,
  "height": 32,
  "collision": { "x": 2, "y": 8, "w": 28, "h": 20 }
}
```

`collision` is a pixel box **relative to the image's top-left**. Set it to
`null` (or omit it) for walk-through decoration. For tall objects (trees,
poles), put the box near the base so players can walk "behind" the top.
3. Place it in any map's `placements` array (x/y in **tile** coordinates):

```json
{ "type": "braai-stand", "x": 15, "y": 20 }
```

### Add a new map

1. Create `public/data/maps/my-map.json`:

```json
{
  "name": "Soweto Heights",
  "tileSize": 32,
  "width": 40,
  "height": 30,
  "tileset": "/assets/tiles/tiles.png",
  "legend": { "0": "grass", "3": "road" },
  "layers": [
    { "name": "ground",    "type": "tiles",     "data": [ /* width*height tile frame indices */ ] },
    { "name": "collision", "type": "collision", "data": [ /* width*height: 0 walkable, 1 solid */ ] }
  ],
  "placements":  [ { "type": "rdp-house", "x": 5, "y": 4 } ],
  "npcs":        [ { "id": "mama-nomsa", "x": 12, "y": 10 } ],
  "playerStart": { "x": 20, "y": 15 }
}
```

- Layer `data` arrays are flat, row-major, `width * height` long. Tile values
  are frame indices into the tileset strip; use `-1` for empty cells.
- Add more `"type": "tiles"` layers — they render in array order.
- The collision layer is never drawn.
- `legend` is documentation only (handy when hand-editing).

2. Load it either by changing `startMap` in `data/config/game.json`, or — no
   config change needed — via URL param:

```
http://localhost:3000/?map=my-map
```

### Change the player

Edit `data/characters/player.json` — sprite path, speed, collision `body`
(`w`,`h` box offset by `ox`,`oy` from the sprite's top-left), and animations.

## Engine notes

- **GameLoop** — accumulator pattern; update always receives exactly `1/60s`,
  render receives an interpolation alpha (unused by default).
- **Collision** — tile grid + static AABBs, axis-separated sliding (you slide
  along walls instead of sticking).
- **TileMap** — draws only camera-visible tiles each frame; no giant offscreen
  canvases, so big maps stay light on memory.
- **Rendering** — pixel-art friendly (`imageSmoothingEnabled` off, integer
  draw positions), DPI-aware canvas.
- **UI** — engine touches element IDs and text only; all theming is CSS.

## Performance on Render free tier

- One runtime dependency (`express`), ~5 MB of assets, no build step.
- Server is static-file serving only; all game logic runs in the browser.
- Cold starts after free-tier sleep are normal — assets are cached for an hour
  (`Cache-Control`), so repeat loads are quick.

## License

MIT
