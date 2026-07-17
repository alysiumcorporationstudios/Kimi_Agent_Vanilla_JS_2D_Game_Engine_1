// Grid-based sprite sheet + frame-sequence animator.
//
// Sheets are row-major: frame index = row * columns + column.
// Animations are plain JSON: { "walk-down": { "frames": [1, 0, 2, 0], "fps": 8 } }
// so all animation data can live in external character files.

export class SpriteSheet {
  /**
   * @param {HTMLImageElement} image
   * @param {object} def
   * @param {number} def.frameWidth
   * @param {number} def.frameHeight
   * @param {Record<string, {frames: number[], fps?: number, loop?: boolean}>} [def.animations]
   */
  constructor(image, { frameWidth, frameHeight, animations = {} }) {
    this.image = image;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.columns = Math.max(1, Math.floor(image.width / frameWidth));
    this.animations = animations;
  }

  frameRect(index) {
    return {
      sx: (index % this.columns) * this.frameWidth,
      sy: Math.floor(index / this.columns) * this.frameHeight,
      sw: this.frameWidth,
      sh: this.frameHeight,
    };
  }
}

export class Animator {
  constructor(sheet) {
    this.sheet = sheet;
    this.current = null;
    this.time = 0;
    this.frameIndex = 0;
  }

  play(name, restart = false) {
    if (this.current === name && !restart) return;
    if (!this.sheet.animations[name]) throw new Error(`Unknown animation: ${name}`);
    this.current = name;
    this.time = 0;
    this.frameIndex = 0;
  }

  update(dt) {
    if (!this.current) return;
    const anim = this.sheet.animations[this.current];
    const fps = anim.fps ?? 8;
    const frameDuration = 1 / fps;
    this.time += dt;
    while (this.time >= frameDuration) {
      this.time -= frameDuration;
      this.frameIndex += 1;
      if (this.frameIndex >= anim.frames.length) {
        this.frameIndex = anim.loop === false ? anim.frames.length - 1 : 0;
      }
    }
  }

  draw(ctx, dx, dy, dw = this.sheet.frameWidth, dh = this.sheet.frameHeight) {
    if (!this.current) return;
    const anim = this.sheet.animations[this.current];
    const f = this.sheet.frameRect(anim.frames[this.frameIndex]);
    ctx.drawImage(this.sheet.image, f.sx, f.sy, f.sw, f.sh, dx, dy, dw, dh);
  }
}
