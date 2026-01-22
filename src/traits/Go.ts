import { Trait } from '../engine/Trait';
import type { Entity } from '../engine/Entity';
import { Direction } from '../types';
import type { Solid } from './Solid';
import type { ChillMeter } from './ChillMeter';

// Mario-like movement constants
const WALK_ACCEL = 600;           // Walking acceleration
const RUN_ACCEL = 900;            // Running acceleration
const RELEASE_DECEL = 800;        // Deceleration when releasing direction
const SKID_DECEL = 1800;          // Deceleration when turning around (skidding)
const MAX_WALK_SPEED = 90;        // Max walking speed
const MAX_RUN_SPEED = 180;        // Max running speed
const AIR_ACCEL_MULT = 0.65;      // Less control in air

export class Go extends Trait {
  readonly name = 'go';

  // Input state
  direction: number = 0;          // -1, 0, or 1
  running = false;                // Holding run button

  // Character state
  heading: Direction = Direction.RIGHT;
  distance = 0;
  skidding = false;

  // Chill meter reference for speed boost
  private chillMeter?: ChillMeter;

  setChillMeter(meter: ChillMeter): void {
    this.chillMeter = meter;
  }

  update(entity: Entity, delta: number): void {
    // Use Solid trait's ground detection if available
    const solid = entity.getTrait<Solid>('solid');
    const onGround = solid ? solid.onGround : entity.vel.y === 0;
    const airMult = onGround ? 1 : AIR_ACCEL_MULT;

    // Get chill speed multiplier (1.0 to 1.3 based on chill level)
    const chillMult = this.chillMeter ? this.chillMeter.speedMultiplier : 1;

    // Apply chill boost to max speed
    const baseMaxSpeed = this.running ? MAX_RUN_SPEED : MAX_WALK_SPEED;
    const maxSpeed = baseMaxSpeed * chillMult;
    const accel = (this.running ? RUN_ACCEL : WALK_ACCEL) * airMult * chillMult;

    // Check if skidding (trying to go opposite direction of current velocity)
    this.skidding = this.direction !== 0 &&
                    Math.sign(entity.vel.x) !== 0 &&
                    Math.sign(entity.vel.x) !== this.direction;

    if (this.direction !== 0) {
      // Accelerate in direction
      if (this.skidding) {
        // Skidding - use higher deceleration
        entity.vel.x += SKID_DECEL * this.direction * delta;
      } else {
        // Normal acceleration
        entity.vel.x += accel * this.direction * delta;
      }

      // Update facing direction
      this.heading = this.direction as Direction;
    } else {
      // Decelerate when not pressing direction
      if (entity.vel.x !== 0) {
        const decel = RELEASE_DECEL * delta;
        if (Math.abs(entity.vel.x) < decel) {
          entity.vel.x = 0;
        } else {
          entity.vel.x -= decel * Math.sign(entity.vel.x);
        }
      }
    }

    // Clamp to max speed
    if (Math.abs(entity.vel.x) > maxSpeed) {
      entity.vel.x = maxSpeed * Math.sign(entity.vel.x);
    }

    // Track distance for animation
    this.distance += Math.abs(entity.vel.x) * delta;
  }

  onTileCollide(entity: Entity, side: 'top' | 'bottom' | 'left' | 'right'): void {
    if (side === 'left' || side === 'right') {
      entity.vel.x = 0;
    }
  }
}
