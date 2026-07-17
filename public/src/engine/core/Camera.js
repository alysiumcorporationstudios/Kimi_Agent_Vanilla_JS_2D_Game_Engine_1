// Smooth follow camera that clamps to the map boundaries.
// x/y is the top-left corner of the view, in world pixels.

export class Camera {
  constructor(viewWidth, viewHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.mapWidth = null;
    this.mapHeight = null;
    this.smoothing = 12; // higher = snappier follow
  }

  setViewport(w, h) {
    this.viewWidth = w;
    this.viewHeight = h;
    this.clamp();
  }

  setBounds(width, height) {
    this.mapWidth = width;
    this.mapHeight = height;
    this.clamp();
  }

  /** Snap instantly (used on spawn / map load). */
  jumpTo(centerX, centerY) {
    this.x = centerX - this.viewWidth / 2;
    this.y = centerY - this.viewHeight / 2;
    this.clamp();
  }

  /** Ease toward the target each frame, then clamp to the map. */
  follow(centerX, centerY, dt) {
    const tx = centerX - this.viewWidth / 2;
    const ty = centerY - this.viewHeight / 2;
    const t = 1 - Math.exp(-this.smoothing * dt);
    this.x += (tx - this.x) * t;
    this.y += (ty - this.y) * t;
    this.clamp();
  }

  clamp() {
    if (this.mapWidth == null || this.mapHeight == null) return;
    this.x = this._clampAxis(this.x, this.mapWidth, this.viewWidth);
    this.y = this._clampAxis(this.y, this.mapHeight, this.viewHeight);
  }

  _clampAxis(value, world, view) {
    if (world <= view) return (world - view) / 2; // map smaller than screen: center it
    return Math.min(Math.max(value, 0), world - view);
  }
}
