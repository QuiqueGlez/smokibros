import { Trait } from '../engine/Trait';
import type { Entity } from '../engine/Entity';
import { PowerState } from '../types';

export class PowerUp extends Trait {
  readonly name = 'powerup';

  private _state: PowerState = PowerState.NORMAL;
  private invincibleTime = 0;
  private invincibleDuration = 2; // 2 seconds of invincibility after getting hit
  private blinkTimer = 0;
  visible = true;

  // Star power
  private starActive = false;
  private starTime = 0;
  private starDuration = 10; // 10 seconds of star power
  private starColorIndex = 0;
  private starColorTimer = 0;
  private readonly starColors = [
    '#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#0088ff', '#ff00ff'
  ];

  // Size when normal
  private normalSize = { x: 12, y: 16 };
  private normalOffset = { x: 2, y: 0 };

  // Size when big (Colocado)
  private bigSize = { x: 14, y: 28 };
  private bigOffset = { x: 1, y: 0 };

  // Callback when state changes
  onStateChange?: (state: PowerState) => void;

  get state(): PowerState {
    return this._state;
  }

  get isBig(): boolean {
    return this._state === PowerState.COLOCADO || this._state === PowerState.PREMIUM;
  }

  get isInvincible(): boolean {
    return this.invincibleTime > 0 || this.starActive;
  }

  get hasStar(): boolean {
    return this.starActive;
  }

  get starColor(): string {
    return this.starColors[this.starColorIndex];
  }

  activateStar(): void {
    this.starActive = true;
    this.starTime = this.starDuration;
  }

  powerUp(entity: Entity): void {
    if (this._state === PowerState.NORMAL) {
      this._state = PowerState.COLOCADO;
      // Grow the player
      entity.size = { ...this.bigSize };
      entity.offset = { ...this.bigOffset };
      // Adjust position so feet stay at same level
      entity.pos.y -= 12;

      if (this.onStateChange) {
        this.onStateChange(this._state);
      }
    } else if (this._state === PowerState.COLOCADO) {
      this._state = PowerState.PREMIUM;
      if (this.onStateChange) {
        this.onStateChange(this._state);
      }
    }
  }

  powerDown(entity: Entity): boolean {
    // Returns true if player survives (was big), false if should die
    if (this.isBig) {
      this._state = PowerState.NORMAL;
      // Shrink the player
      entity.size = { ...this.normalSize };
      entity.offset = { ...this.normalOffset };
      // Start invincibility
      this.invincibleTime = this.invincibleDuration;

      if (this.onStateChange) {
        this.onStateChange(this._state);
      }
      return true; // Survived
    }
    return false; // Should die
  }

  update(_entity: Entity, delta: number): void {
    // Handle damage invincibility
    if (this.invincibleTime > 0) {
      this.invincibleTime -= delta;

      // Blink effect
      this.blinkTimer += delta;
      if (this.blinkTimer >= 0.1) {
        this.blinkTimer = 0;
        this.visible = !this.visible;
      }

      // Make sure we're visible when invincibility ends
      if (this.invincibleTime <= 0) {
        this.visible = true;
      }
    }

    // Handle star power
    if (this.starActive) {
      this.starTime -= delta;

      // Cycle through colors rapidly
      this.starColorTimer += delta;
      if (this.starColorTimer >= 0.05) {
        this.starColorTimer = 0;
        this.starColorIndex = (this.starColorIndex + 1) % this.starColors.length;
      }

      // Star power ended
      if (this.starTime <= 0) {
        this.starActive = false;
      }
    }
  }
}
