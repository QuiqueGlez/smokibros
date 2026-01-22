// Fixed timestep game loop (60 FPS)
const DELTA = 1 / 60;
const MAX_FRAME_TIME = 0.25; // Prevent spiral of death

export class Timer {
  private updateFn: (delta: number) => void;
  private lastTime = 0;
  private accumulator = 0;
  private animationFrameId: number | null = null;
  private _isRunning = false;

  constructor(updateFn: (delta: number) => void) {
    this.updateFn = updateFn;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  start(): void {
    if (this._isRunning) return;

    this._isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop();
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this._isRunning = false;
  }

  private loop = (): void => {
    if (!this._isRunning) return;

    const currentTime = performance.now();
    let frameTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Clamp frame time to prevent spiral of death
    if (frameTime > MAX_FRAME_TIME) {
      frameTime = MAX_FRAME_TIME;
    }

    this.accumulator += frameTime;

    // Fixed timestep updates
    while (this.accumulator >= DELTA) {
      this.updateFn(DELTA);
      this.accumulator -= DELTA;
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}

// Utility to get fixed delta
export const FIXED_DELTA = DELTA;
