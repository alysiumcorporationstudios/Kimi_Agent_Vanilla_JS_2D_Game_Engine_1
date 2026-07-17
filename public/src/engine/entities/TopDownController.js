import { Entity } from './Entity.js';

// 8-directional top-down character with walk animations and map collision.
//
// Expects the sprite sheet to provide `walk-<dir>` / `idle-<dir>` animations
// where <dir> is one of: down, up, left, right. Diagonal movement reuses the
// dominant axis direction — the classic top-down RPG convention.

export class TopDownController extends Entity {
  /**
   * @param {object} opts
   * @param {number} opts.x  Sprite top-left X in world pixels.
   * @param {number} opts.y  Sprite top-left Y in world pixels.
   * @param {number} [opts.speed]  Pixels per second.
   * @param {import('../render/SpriteSheet.js').Animator} opts.animator
   * @param {{w: number, h: number, ox: number, oy: number}} [opts.body]
   *   Collision box relative to the sprite's top-left (smaller than the sprite
   *   so shoulders can overlap scenery visually while the feet collide).
   */
  constructor({ x, y, speed = 140, animator, body = { w: 20, h: 20, ox: 6, oy: 10 } }) {
    super(x + (body.ox ?? 0), y + (body.oy ?? 0), body.w, body.h);
    this.spriteX = x;
    this.spriteY = y;
    this.bodyOffset = { x: body.ox ?? 0, y: body.oy ?? 0 };
    this.speed = speed;
    this.animator = animator;
    this.facing = 'down';
    this.moving = false;
    this.frozen = false; // e.g. while a dialogue is open
  }

  update(dt, input, collisionWorld) {
    this.moving = false;

    if (!this.frozen) {
      const axis = input.axis();
      if (axis.x !== 0 || axis.y !== 0) {
        this.moving = true;
        if (Math.abs(axis.x) > Math.abs(axis.y)) {
          this.facing = axis.x > 0 ? 'right' : 'left';
        } else {
          this.facing = axis.y > 0 ? 'down' : 'up';
        }

        const body = { x: this.x, y: this.y, w: this.w, h: this.h };
        collisionWorld.move(body, axis.x * this.speed * dt, axis.y * this.speed * dt);
        this.x = body.x;
        this.y = body.y;
        this.spriteX = this.x - this.bodyOffset.x;
        this.spriteY = this.y - this.bodyOffset.y;
      }
    }

    this.animator.play(`${this.moving ? 'walk' : 'idle'}-${this.facing}`);
    this.animator.update(dt);
  }

  draw(ctx, camera) {
    this.animator.draw(
      ctx,
      Math.floor(this.spriteX - camera.x),
      Math.floor(this.spriteY - camera.y)
    );
  }
}
