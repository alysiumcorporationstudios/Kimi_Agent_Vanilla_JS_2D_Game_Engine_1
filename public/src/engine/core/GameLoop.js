// Fixed-timestep game loop with an accumulator.
// Update runs at a constant rate (default 60 Hz) regardless of display refresh;
// render runs once per animation frame and receives an interpolation alpha.

export class GameLoop {
  /**
   * @param {object} opts
   * @param {(dt: number) => void} opts.update  Fixed-step update (dt = step).
   * @param {(alpha: number) => void} opts.render  Per-frame render.
   * @param {number} [opts.step]  Fixed timestep in seconds (default 1/60).
   * @param {number} [opts.maxFrameTime]  Clamp for long frames (tab switches).
   */
  constructor({ update, render, step = 1 / 60, maxFrameTime = 0.25 }) {
    this.update = update;
    this.render = render;
    this.step = step;
    this.maxFrameTime = maxFrameTime;

    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;
    this._rafId = null;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = 0;
    this._rafId = requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  _tick(time) {
    if (!this.running) return;
    this._rafId = requestAnimationFrame(this._tick);

    if (this.lastTime === 0) this.lastTime = time;
    let frameTime = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Prevent the "spiral of death" after the tab was backgrounded.
    if (frameTime > this.maxFrameTime) frameTime = this.maxFrameTime;

    this.accumulator += frameTime;
    while (this.accumulator >= this.step) {
      this.update(this.step);
      this.accumulator -= this.step;
    }

    // Alpha (0..1) is how far we are between fixed steps — available for
    // render interpolation if a game wants buttery motion.
    this.render(this.accumulator / this.step);
  }
}
