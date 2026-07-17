// Kasi Lifestyle — game-specific glue.
//
// Everything here is driven by JSON content (see /public/data). The engine in
// /public/src/engine knows nothing about kasi life; this file wires content to
// engine systems: map -> TileMap + CollisionWorld, placements -> MapObjects,
// characters -> Player/NPCs, config -> HUD.

import { AssetLoader } from '../engine/core/AssetLoader.js';
import { Camera } from '../engine/core/Camera.js';
import { SpriteSheet, Animator } from '../engine/render/SpriteSheet.js';
import { TileMap } from '../engine/world/TileMap.js';
import { CollisionWorld } from '../engine/world/CollisionWorld.js';
import { TopDownController } from '../engine/entities/TopDownController.js';
import { NPC } from '../engine/entities/NPC.js';

const TILE_SIZE = 32;

// A static, y-sorted world object (building, vehicle, prop) placed via map JSON.
class MapObject {
  constructor(type, def, image, x, y) {
    this.type = type;
    this.image = image;
    this.x = x;
    this.y = y;
    this.w = def.width ?? image.width;
    this.h = def.height ?? image.height;
    this.collision = def.collision ?? null;
    this.box = null;
    this.visible = true;
  }

  get sortY() {
    return this.y + this.h;
  }

  draw(ctx, camera) {
    ctx.drawImage(this.image, Math.round(this.x - camera.x), Math.round(this.y - camera.y));
  }
}

export class KasiGame {
  constructor({ canvas, input, ui }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.ui = ui;
    this.assets = new AssetLoader();

    this.viewW = 960;
    this.viewH = 540;
    this.camera = new Camera(this.viewW, this.viewH);

    this.entities = []; // player + npcs + objects, y-sorted at render time
    this.npcs = [];
    this.interactTarget = null;
    this.activeNPC = null;

    this.debug = false; // F3: collision boxes, NPC radii, FPS
    this.fps = 0;
    this._fpsTime = 0;
    this._fpsFrames = 0;
  }

  /** Load all content JSON + art, then build the world. */
  async load(onProgress = () => {}, mapUrl = null) {
    const config = await (await fetch('/data/config/game.json')).json();
    this.config = config;

    const [mapData, playerData, npcData, objectData] = await Promise.all(
      [mapUrl ?? config.startMap, config.player, config.npcs, config.objects].map((url) =>
        fetch(url).then((r) => {
          if (!r.ok) throw new Error(`Failed to load ${url} (${r.status})`);
          return r.json();
        })
      )
    );

    // The asset manifest is derived entirely from content JSON — the game code
    // never hardcodes an art path. Swap PNGs on disk and they just appear.
    const images = { tileset: mapData.tileset, player: playerData.sprite };
    for (const def of Object.values(npcData)) images[`npc:${def.id}`] = def.sprite;
    for (const [type, def] of Object.entries(objectData)) images[`obj:${type}`] = def.image;
    await this.assets.loadManifest({ images }, onProgress);

    // World
    this.map = new TileMap(mapData, this.assets.image('tileset'));
    this.collision = new CollisionWorld(this.map);
    this.camera.setBounds(this.map.pixelWidth, this.map.pixelHeight);

    // Placed objects: buildings, taxis, props (each may add a collision box)
    for (const p of this.map.placements) {
      const def = objectData[p.type];
      if (!def) {
        console.warn(`Unknown object type in map placements: "${p.type}" — skipped`);
        continue;
      }
      const obj = new MapObject(
        p.type,
        def,
        this.assets.image(`obj:${p.type}`),
        p.x * TILE_SIZE,
        p.y * TILE_SIZE
      );
      if (obj.collision) {
        obj.box = this.collision.addBox(
          obj.x + obj.collision.x,
          obj.y + obj.collision.y,
          obj.collision.w,
          obj.collision.h
        );
      }
      this.entities.push(obj);
    }

    // Player
    const playerSheet = new SpriteSheet(this.assets.image('player'), playerData);
    this.player = new TopDownController({
      x: this.map.playerStart.x * TILE_SIZE,
      y: this.map.playerStart.y * TILE_SIZE,
      speed: playerData.speed ?? 140,
      animator: new Animator(playerSheet),
      body: playerData.body,
    });
    this.entities.push(this.player);

    // NPCs (definitions live in npcs.json; spawn positions live in the map)
    for (const spawn of this.map.npcSpawns) {
      const def = npcData[spawn.id];
      if (!def) {
        console.warn(`Unknown NPC id in map: "${spawn.id}" — skipped`);
        continue;
      }
      const sheet = new SpriteSheet(this.assets.image(`npc:${def.id}`), def);
      const route = spawn.patrol ?? def.patrol ?? null;
      const patrol = route
        ? route.map(([tx, ty]) => ({
            x: tx * TILE_SIZE + TILE_SIZE / 2,
            y: ty * TILE_SIZE + TILE_SIZE / 2,
          }))
        : null;

      const npc = new NPC({
        id: def.id,
        name: def.name,
        x: spawn.x * TILE_SIZE,
        y: spawn.y * TILE_SIZE,
        animator: new Animator(sheet),
        dialogue: def.dialogue ?? [],
        speed: def.speed ?? 60,
        patrol,
        facing: spawn.facing ?? def.facing ?? 'down',
        interactRadius: def.interactRadius ?? 48,
        body: def.body,
      });
      this.npcs.push(npc);
      this.entities.push(npc);
    }

    // HUD
    this.ui.setTitle(config.title ?? 'Kasi Lifestyle');
    this.ui.setLocation(this.map.name);
    this.ui.setWallet(`${config.currency ?? 'R'} ${config.walletStart ?? 0}`);
    this.ui.showHUD();

    this.camera.jumpTo(this.player.centerX, this.player.centerY);
  }

  resize(w, h) {
    this.viewW = w;
    this.viewH = h;
    this.camera.setViewport(w, h);
  }

  update(dt) {
    // FPS meter (for the debug overlay)
    this._fpsTime += dt;
    this._fpsFrames += 1;
    if (this._fpsTime >= 0.5) {
      this.fps = Math.round(this._fpsFrames / this._fpsTime);
      this._fpsTime = 0;
      this._fpsFrames = 0;
    }

    if (this.input.wasPressed('F3')) this.debug = !this.debug;

    const interactPressed = (this.config.interactKeys ?? ['KeyE']).some((k) =>
      this.input.wasPressed(k)
    );

    if (this.ui.dialogueOpen) {
      if (interactPressed) this.ui.advanceDialogue();
    } else {
      this.interactTarget = this.npcs.find((n) => n.inRangeOf(this.player)) ?? null;

      if (this.interactTarget) {
        this.ui.showHint(`Press E — talk to ${this.interactTarget.name}`);
        if (interactPressed && this.interactTarget.dialogue.length > 0) {
          const npc = this.interactTarget;
          npc.faceTowards(this.player);
          npc.paused = true;
          this.activeNPC = npc;
          this.player.frozen = true;
          this.ui.openDialogue(npc.name, npc.dialogue, () => {
            this.player.frozen = false;
            if (this.activeNPC) {
              this.activeNPC.paused = false;
              this.activeNPC = null;
            }
          });
        }
      } else {
        this.ui.hideHint();
      }
    }

    this.player.update(dt, this.input, this.collision);
    for (const npc of this.npcs) npc.update(dt, this.collision);
    this.camera.follow(this.player.centerX, this.player.centerY, dt);
    this.input.endFrame();
  }

  render() {
    const { ctx, camera } = this;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#14100a';
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    this.map.draw(ctx, camera);

    // Y-sort: lower-on-screen draws later, so you can walk behind houses
    // and in front of tree trunks naturally.
    const sorted = [...this.entities].sort((a, b) => a.sortY - b.sortY);
    for (const e of sorted) {
      if (e.visible !== false) e.draw(ctx, camera);
    }

    if (this.debug) this._drawDebug(ctx);
  }

  _drawDebug(ctx) {
    const cam = this.camera;
    ctx.save();
    ctx.lineWidth = 1;

    ctx.strokeStyle = 'rgba(255, 60, 60, 0.8)';
    for (const b of this.collision.statics) {
      ctx.strokeRect(b.x - cam.x + 0.5, b.y - cam.y + 0.5, b.w, b.h);
    }

    ctx.strokeStyle = 'rgba(80, 255, 120, 0.9)';
    ctx.strokeRect(this.player.x - cam.x + 0.5, this.player.y - cam.y + 0.5, this.player.w, this.player.h);
    for (const n of this.npcs) {
      ctx.strokeRect(n.x - cam.x + 0.5, n.y - cam.y + 0.5, n.w, n.h);
      ctx.strokeStyle = 'rgba(255, 220, 80, 0.5)';
      ctx.beginPath();
      ctx.arc(n.centerX - cam.x, n.centerY - cam.y, n.interactRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(80, 255, 120, 0.9)';
    }

    ctx.fillStyle = '#7CFC00';
    ctx.font = '12px monospace';
    ctx.fillText(
      `FPS ${this.fps}  ·  entities ${this.entities.length}  ·  cam ${Math.round(cam.x)},${Math.round(cam.y)}`,
      10,
      this.viewH - 28
    );
    ctx.restore();
  }
}
