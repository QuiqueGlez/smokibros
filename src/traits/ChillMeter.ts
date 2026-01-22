import { Trait } from '../engine/Trait';
import type { Entity } from '../engine/Entity';
import type { Game } from '../engine/Game';

// Chill meter - fills up when collecting items, provides bonuses
export class ChillMeter extends Trait {
  readonly name = 'chillmeter';

  private _chill = 0;           // Current chill level (0-100)
  private readonly maxChill = 100;
  private decayRate = 2;        // Chill lost per second normally
  private boostDecayRate = 5;   // Chill lost per second when using boosts

  // Boost thresholds
  private readonly speedBoostThreshold = 30;   // 30% chill for speed boost
  private readonly jumpBoostThreshold = 60;    // 60% chill for jump boost
  private readonly maxChillThreshold = 90;     // 90% chill for max chill state

  // Visual effects
  private pulseTimer = 0;
  private smokeTimer = 0;

  // Reference to game for updating state
  private game?: Game;

  setGame(game: Game): void {
    this.game = game;
  }

  get chill(): number {
    return this._chill;
  }

  get chillPercent(): number {
    return this._chill / this.maxChill;
  }

  get hasSpeedBoost(): boolean {
    return this._chill >= this.speedBoostThreshold;
  }

  get hasJumpBoost(): boolean {
    return this._chill >= this.jumpBoostThreshold;
  }

  get isMaxChill(): boolean {
    return this._chill >= this.maxChillThreshold;
  }

  // Get speed multiplier based on chill level
  get speedMultiplier(): number {
    if (this._chill < this.speedBoostThreshold) return 1.0;
    // Gradually increase from 1.0 to 1.3 as chill goes from 30 to 100
    const boostRange = this.maxChill - this.speedBoostThreshold;
    const currentBoost = this._chill - this.speedBoostThreshold;
    return 1.0 + (currentBoost / boostRange) * 0.3;
  }

  // Get jump multiplier based on chill level
  get jumpMultiplier(): number {
    if (this._chill < this.jumpBoostThreshold) return 1.0;
    // Gradually increase from 1.0 to 1.2 as chill goes from 60 to 100
    const boostRange = this.maxChill - this.jumpBoostThreshold;
    const currentBoost = this._chill - this.jumpBoostThreshold;
    return 1.0 + (currentBoost / boostRange) * 0.2;
  }

  // Add chill when collecting items
  addChill(amount: number): void {
    this._chill = Math.min(this.maxChill, this._chill + amount);
    this.updateGameState();
  }

  // Chill amounts for different actions
  collectFilter(): void {
    this.addChill(5);  // Coin/filter = +5 chill
  }

  collectPowerUp(): void {
    this.addChill(20); // Power-up = +20 chill
  }

  collectStar(): void {
    this.addChill(50); // Star = +50 chill
  }

  stompEnemy(): void {
    this.addChill(10); // Stomp = +10 chill
  }

  // Lose chill when taking damage
  takeDamage(): void {
    this._chill = Math.max(0, this._chill - 30);
    this.updateGameState();
  }

  private updateGameState(): void {
    if (this.game) {
      this.game.state.chillMeter = this._chill;
    }
  }

  update(_entity: Entity, delta: number): void {
    // Decay chill over time
    const decay = this.isMaxChill ? this.boostDecayRate : this.decayRate;
    this._chill = Math.max(0, this._chill - decay * delta);

    // Update pulse timer for visual effects
    this.pulseTimer += delta;
    if (this.pulseTimer >= 1) {
      this.pulseTimer = 0;
    }

    // Update smoke effect timer
    if (this._chill > this.speedBoostThreshold) {
      this.smokeTimer += delta;
    }

    this.updateGameState();
  }

  // Get the current "vibe" color based on chill level
  getVibeColor(): string {
    if (this._chill < 30) return '#666666';      // Gray - no vibe
    if (this._chill < 60) return '#7EC87E';      // Light green - getting there
    if (this._chill < 90) return '#2D5A27';      // Dark green - chill
    return '#FFD700';                             // Gold - max chill!
  }

  // Get pulse intensity for visual effects (0-1)
  getPulseIntensity(): number {
    if (this._chill < this.speedBoostThreshold) return 0;
    return (Math.sin(this.pulseTimer * Math.PI * 2) + 1) / 2;
  }

  // Should spawn smoke particles?
  shouldSpawnSmoke(): boolean {
    if (this._chill < this.speedBoostThreshold) return false;
    if (this.smokeTimer >= 0.1) {
      this.smokeTimer = 0;
      return true;
    }
    return false;
  }
}
