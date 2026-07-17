// Keyboard state tracker: held keys, per-frame presses, and a normalized
// 8-directional movement axis from WASD / arrow keys.

// Keys we keep away from the browser (scrolling, quick-find, etc.).
const SWALLOWED = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'Space', 'F3',
]);

export class Input {
  constructor(target = window) {
    this.down = new Set();     // currently held
    this.pressed = new Set();  // pressed since last endFrame()

    target.addEventListener('keydown', (e) => {
      if (SWALLOWED.has(e.code)) e.preventDefault();
      if (!e.repeat) {
        this.down.add(e.code);
        this.pressed.add(e.code);
      }
    });
    target.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
  }

  isDown(code) {
    return this.down.has(code);
  }

  /** True only on the frame the key went down. Cleared by endFrame(). */
  wasPressed(code) {
    return this.pressed.has(code);
  }

  /** Normalized 8-way axis: x/y in [-1, 1], diagonals scaled by 1/sqrt(2). */
  axis() {
    let x = 0;
    let y = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  }

  /** Call at the end of every fixed update. */
  endFrame() {
    this.pressed.clear();
  }
}
