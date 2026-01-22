import { Trait } from '../engine/Trait';
import type { Entity } from '../engine/Entity';
import type { Physics } from './Physics';
import type { Solid } from './Solid';
import type { ChillMeter } from './ChillMeter';
import { audioManager } from '../audio/AudioManager';

// Mario-like jump constants
const JUMP_VELOCITY_WALK = -330;      // Jump height when walking
const JUMP_VELOCITY_RUN = -380;       // Higher jump when running fast
const SPEED_THRESHOLD_FOR_HIGH_JUMP = 140; // Speed needed for higher jump
const COYOTE_TIME = 0.08;             // Grace period after leaving ground
const JUMP_BUFFER_TIME = 0.1;         // Buffer for early jump press

export class Jump extends Trait {
  readonly name = 'jump';

  // State
  private _isJumping = false;
  private wasOnGround = false;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private holdingJump = false;

  // Chill meter reference for jump boost
  private chillMeter?: ChillMeter;

  get isJumping(): boolean {
    return this._isJumping;
  }

  setChillMeter(meter: ChillMeter): void {
    this.chillMeter = meter;
  }

  start(): void {
    this.holdingJump = true;
    this.jumpBufferTimer = JUMP_BUFFER_TIME;
  }

  cancel(): void {
    this.holdingJump = false;
  }

  update(entity: Entity, delta: number): void {
    // Update physics trait to know if we're holding jump
    const physics = entity.getTrait<Physics>('physics');
    if (physics) {
      physics.isHoldingJump = this.holdingJump;
    }

    // Use Solid trait's ground detection
    const solid = entity.getTrait<Solid>('solid');
    const onGround = solid ? solid.onGround : false;

    // Start coyote time when we leave the ground
    if (this.wasOnGround && !onGround && entity.vel.y >= 0) {
      this.coyoteTimer = COYOTE_TIME;
    }
    this.wasOnGround = onGround;

    // Update timers
    if (this.coyoteTimer > 0) {
      this.coyoteTimer -= delta;
    }
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= delta;
    }

    // Check if we can jump (on ground or coyote time)
    const canJump = onGround || this.coyoteTimer > 0;

    // Execute jump if buffered and can jump
    if (this.jumpBufferTimer > 0 && canJump) {
      this.executeJump(entity);
    }

    // Update jumping state
    this._isJumping = !onGround;
  }

  private executeJump(entity: Entity): void {
    // Get horizontal speed to determine jump height
    const speed = Math.abs(entity.vel.x);

    // Get chill jump multiplier (1.0 to 1.2 based on chill level)
    const chillMult = this.chillMeter ? this.chillMeter.jumpMultiplier : 1;

    // Higher jump when running fast (like Mario)
    const baseJumpVelocity = speed > SPEED_THRESHOLD_FOR_HIGH_JUMP
      ? JUMP_VELOCITY_RUN
      : JUMP_VELOCITY_WALK;

    // Apply chill boost (more negative = higher jump)
    entity.vel.y = baseJumpVelocity * chillMult;

    // Play jump sound
    audioManager.play('jump');

    // Clear states
    this.wasOnGround = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this._isJumping = true;
  }

  onTileCollide(entity: Entity, side: 'top' | 'bottom' | 'left' | 'right'): void {
    if (side === 'top') {
      // Hit ceiling - stop upward momentum
      entity.vel.y = 0;
    }
  }
}
