// Minimal base entity: a pixel-space body with a draw anchor used for
// y-sorting (so characters can walk behind / in front of objects).

export class Entity {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.visible = true;
  }

  get centerX() {
    return this.x + this.w / 2;
  }

  get centerY() {
    return this.y + this.h / 2;
  }

  /** Draw-order anchor: entities with a lower bottom edge draw first. */
  get sortY() {
    return this.y + this.h;
  }

  update(dt, game) {}

  draw(ctx, camera) {}
}
