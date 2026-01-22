import { Trait } from '../engine/Trait';
import type { Entity } from '../engine/Entity';
import type { Level } from '../levels/Level';
import { audioManager } from '../audio/AudioManager';

export class Killable extends Trait {
  readonly name = 'killable';

  private _isDead = false;
  private deadTime = 0;
  private removeAfter = 0.5; // Seconds before removing from level

  // Death animation support
  deathAnimation = false; // Whether to play Mario-style death animation
  private deathAnimStarted = false;
  private freezeTime = 0.4; // Freeze before jumping up
  private deathVelocity = -350; // Initial jump velocity when dying
  private deathGravity = 1200;

  // Callback when killed
  onDeath?: () => void;

  get isDead(): boolean {
    return this._isDead;
  }

  get isDying(): boolean {
    return this._isDead && this.deathAnimation;
  }

  kill(): void {
    if (this._isDead) return;

    this._isDead = true;
    this.deadTime = 0;
    this.deathAnimStarted = false;

    // Play death sound for player (has death animation)
    if (this.deathAnimation) {
      audioManager.play('death');
    }

    if (this.onDeath) {
      this.onDeath();
    }
  }

  revive(): void {
    this._isDead = false;
    this.deadTime = 0;
    this.deathAnimStarted = false;
  }

  update(entity: Entity, delta: number, level?: Level): void {
    if (!this._isDead) return;

    this.deadTime += delta;

    // Death animation for player
    if (this.deathAnimation) {
      // Freeze briefly before jumping
      if (this.deadTime < this.freezeTime) {
        entity.vel.x = 0;
        entity.vel.y = 0;
        return;
      }

      // Start death jump
      if (!this.deathAnimStarted) {
        this.deathAnimStarted = true;
        entity.vel.y = this.deathVelocity;
        entity.vel.x = 0;
      }

      // Apply gravity during death animation
      entity.vel.y += this.deathGravity * delta;
      entity.pos.y += entity.vel.y * delta;

      // Remove when fallen off screen
      if (entity.pos.y > 300) {
        if (level) {
          level.removeEntity(entity);
        }
      }
      return;
    }

    // Default behavior - remove after delay
    if (this.deadTime >= this.removeAfter && level) {
      level.removeEntity(entity);
    }
  }
}
