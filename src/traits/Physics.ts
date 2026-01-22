import { Trait } from '../engine/Trait';
import type { Entity } from '../engine/Entity';

// Mario-like physics constants (tuned to feel like SMB)
const GRAVITY_HOLDING_JUMP = 900;   // Floatier when holding jump
const GRAVITY_FALLING = 2400;       // Snappier fall when releasing
const MAX_FALL_SPEED = 450;         // Terminal velocity

export class Physics extends Trait {
  readonly name = 'physics';

  // Exposed so Jump trait can modify gravity behavior
  gravityMultiplier = 1;
  isHoldingJump = false;

  update(entity: Entity, delta: number): void {
    // Variable gravity - lower when holding jump for floatier jumps
    const gravity = this.isHoldingJump && entity.vel.y < 0
      ? GRAVITY_HOLDING_JUMP
      : GRAVITY_FALLING;

    // Apply gravity
    entity.vel.y += gravity * this.gravityMultiplier * delta;

    // Clamp fall speed
    if (entity.vel.y > MAX_FALL_SPEED) {
      entity.vel.y = MAX_FALL_SPEED;
    }

    // Apply velocity to position
    entity.pos.x += entity.vel.x * delta;
    entity.pos.y += entity.vel.y * delta;
  }
}
