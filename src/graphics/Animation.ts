export type FrameSelector = (distance: number) => string;

// Create animation based on distance traveled
export function createDistanceAnimation(
  frames: string[],
  pixelsPerFrame: number
): FrameSelector {
  return (distance: number) => {
    const frameIndex = Math.floor(distance / pixelsPerFrame) % frames.length;
    return frames[frameIndex];
  };
}

// Create animation based on time
export function createTimeAnimation(
  frames: string[],
  frameRate: number
): (time: number) => string {
  const frameDuration = 1 / frameRate;
  return (time: number) => {
    const frameIndex = Math.floor(time / frameDuration) % frames.length;
    return frames[frameIndex];
  };
}

// Animation class for more complex animations
export class Animation {
  private frames: string[];
  private frameIndex = 0;
  private elapsed = 0;
  private frameDuration: number;
  private loop: boolean;
  private finished = false;

  constructor(frames: string[], frameRate: number, loop = true) {
    this.frames = frames;
    this.frameDuration = 1 / frameRate;
    this.loop = loop;
  }

  update(delta: number): void {
    if (this.finished) return;

    this.elapsed += delta;

    while (this.elapsed >= this.frameDuration) {
      this.elapsed -= this.frameDuration;
      this.frameIndex++;

      if (this.frameIndex >= this.frames.length) {
        if (this.loop) {
          this.frameIndex = 0;
        } else {
          this.frameIndex = this.frames.length - 1;
          this.finished = true;
        }
      }
    }
  }

  getCurrentFrame(): string {
    return this.frames[this.frameIndex];
  }

  reset(): void {
    this.frameIndex = 0;
    this.elapsed = 0;
    this.finished = false;
  }

  isFinished(): boolean {
    return this.finished;
  }
}
