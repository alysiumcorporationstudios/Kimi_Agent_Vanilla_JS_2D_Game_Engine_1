import { Entity } from './Entity.js';

// Data-driven NPC: a static greeter or a waypoint patroller, with a proximity
// radius for dialogue. All personality (name, sprite, dialogue, route) comes
// from JSON — the engine only knows how to walk, animate, and be talked to.

export class NPC extends Entity {
  /**
   * @param {object} opts
   * @param {string} opts.id
   * @param {string} opts.name
   * @param {number} opts.x  Sprite top-left X in world pixels.
   * @param {number} opts.y  Sprite top-left Y in world pixels.
   * @param {import('../render/SpriteSheet.js').Animator} opts.animator
   * @param {string[]} [opts.dialogue]  Lines shown in order on interaction.
   * @param {number} [opts.speed]  Patrol speed, px/s.
   * @param {{x: number, y: number}[] | null} [opts.patrol]  Waypoints in px; null = static.
   * @param {string} [opts.facing]  Initial facing: down/up/left/right.
   * @param {number} [opts.interactRadius]  Proximity radius in px.
   * @param {{w: number, h: number, ox: number, oy: number}} [opts.body]
   */
  constructor({
    id,
    name,
    x,
    y,
    animator,
    dialogue = [],
    speed = 60,
    patrol = null,
    facing = 'down',
    interactRadius = 48,
    body = { w: 20, h: 20, ox: 6, oy: 10 },
  }) {
    super(x + (body.ox ?? 0), y + (body.oy ?? 0), body.w, body.h);
    this.id = id;
    this.name = name;
    this.spriteX = x;
    this.spriteY = y;
    this.bodyOffset = { x: body.ox ?? 0, y: body.oy ?? 0 };
    this.animator = animator;
    this.dialogue = dialogue;
    this.speed = speed;
    this.interactRadius = interactRadius;
    this.facing = facing;
    this.paused = false; // set while in conversation

    this.waypoints = patrol && patrol.length > 1 ? patrol : null;
    this.waypointIndex = 0;

    this.animator.play(`idle-${this.facing}`);
  }

  faceTowards(entity) {
    const dx = entity.centerX - this.centerX;
    const dy = entity.centerY - this.centerY;
    this.facing =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    this.animator.play(`idle-${this.facing}`);
  }

  inRangeOf(entity) {
    const dx = entity.centerX - this.centerX;
    const dy = entity.centerY - this.centerY;
    return Math.hypot(dx, dy) <= this.interactRadius;
  }

  update(dt, collisionWorld) {
    let moving = false;

    if (!this.paused && this.waypoints) {
      const target = this.waypoints[this.waypointIndex];
      const dx = target.x - this.centerX;
      const dy = target.y - this.centerY;
      const dist = Math.hypot(dx, dy);

      if (dist < 4) {
        this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
      } else {
        moving = true;
        const step = Math.min(this.speed * dt, dist);
        const nx = (dx / dist) * step;
        const ny = (dy / dist) * step;
        this.facing =
          Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';

        const body = { x: this.x, y: this.y, w: this.w, h: this.h };
        collisionWorld.move(body, nx, ny);
        this.x = body.x;
        this.y = body.y;
        this.spriteX = this.x - this.bodyOffset.x;
        this.spriteY = this.y - this.bodyOffset.y;
      }
    }

    if (!this.paused) {
      this.animator.play(`${moving ? 'walk' : 'idle'}-${this.facing}`);
    }
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
