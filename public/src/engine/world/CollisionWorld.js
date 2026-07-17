// Combines the map's collision layer with object collision boxes, and resolves
// movement with axis-separated sliding so bodies hug walls instead of sticking.

export class CollisionWorld {
  /** @param {import('./TileMap.js').TileMap} tileMap */
  constructor(tileMap) {
    this.map = tileMap;
    /** @type {{x: number, y: number, w: number, h: number}[]} static AABBs in pixels */
    this.statics = [];
  }

  /** Register a static collision box (building, vehicle, prop). */
  addBox(x, y, w, h) {
    const box = { x, y, w, h };
    this.statics.push(box);
    return box;
  }

  removeBox(box) {
    const i = this.statics.indexOf(box);
    if (i !== -1) this.statics.splice(i, 1);
  }

  _tilesCollide(x, y, w, h) {
    const ts = this.map.tileSize;
    const x0 = Math.floor(x / ts);
    const y0 = Math.floor(y / ts);
    const x1 = Math.floor((x + w - 0.001) / ts);
    const y1 = Math.floor((y + h - 0.001) / ts);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (this.map.isSolidTile(tx, ty)) return true;
      }
    }
    return false;
  }

  /** True if the given AABB overlaps a solid tile or any static box. */
  collides(x, y, w, h) {
    if (this._tilesCollide(x, y, w, h)) return true;
    for (const b of this.statics) {
      if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) return true;
    }
    return false;
  }

  /**
   * Move a body {x, y, w, h} by (dx, dy), sliding along obstacles.
   * The body object is mutated in place.
   */
  move(body, dx, dy) {
    if (dx !== 0) {
      const nx = body.x + dx;
      if (!this.collides(nx, body.y, body.w, body.h)) body.x = nx;
    }
    if (dy !== 0) {
      const ny = body.y + dy;
      if (!this.collides(body.x, ny, body.w, body.h)) body.y = ny;
    }
  }
}
