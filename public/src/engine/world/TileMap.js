// JSON-defined, multi-layer tile map.
//
// Layers marked `type: "tiles"` are drawn in order; the layer marked
// `type: "collision"` feeds the collision world (0 = walkable, 1 = solid).
// Only the tiles visible in the camera are drawn each frame, so maps stay
// cheap on memory — no giant offscreen canvases.

export class TileMap {
  /**
   * @param {object} data  Parsed map JSON (see README for the format).
   * @param {HTMLImageElement} tilesetImage
   */
  constructor(data, tilesetImage) {
    this.name = data.name ?? 'Unnamed Map';
    this.tileSize = data.tileSize;
    this.width = data.width;
    this.height = data.height;
    this.tileset = tilesetImage;
    this.tilesetColumns = Math.max(1, Math.floor(tilesetImage.width / this.tileSize));
    this.legend = data.legend ?? {};
    this.layers = data.layers ?? [];
    this.playerStart = data.playerStart ?? { x: 1, y: 1 };
    this.placements = data.placements ?? [];
    this.npcSpawns = data.npcs ?? [];

    this.collisionLayer = this.layers.find((l) => l.type === 'collision') ?? null;
    this.renderLayers = this.layers.filter((l) => l.type === 'tiles');
  }

  get pixelWidth() {
    return this.width * this.tileSize;
  }

  get pixelHeight() {
    return this.height * this.tileSize;
  }

  isSolidTile(tx, ty) {
    // Out of bounds is always solid — the world has a hard edge.
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return true;
    if (!this.collisionLayer) return false;
    return this.collisionLayer.data[ty * this.width + tx] === 1;
  }

  draw(ctx, camera) {
    const ts = this.tileSize;
    const startX = Math.max(0, Math.floor(camera.x / ts));
    const startY = Math.max(0, Math.floor(camera.y / ts));
    const endX = Math.min(this.width - 1, Math.floor((camera.x + camera.viewWidth) / ts));
    const endY = Math.min(this.height - 1, Math.floor((camera.y + camera.viewHeight) / ts));

    for (const layer of this.renderLayers) {
      for (let ty = startY; ty <= endY; ty++) {
        for (let tx = startX; tx <= endX; tx++) {
          const value = layer.data[ty * this.width + tx];
          if (value < 0) continue; // -1 = empty cell
          const sx = (value % this.tilesetColumns) * ts;
          const sy = Math.floor(value / this.tilesetColumns) * ts;
          ctx.drawImage(
            this.tileset,
            sx, sy, ts, ts,
            Math.floor(tx * ts - camera.x),
            Math.floor(ty * ts - camera.y),
            ts, ts
          );
        }
      }
    }
  }
}
