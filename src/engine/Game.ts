import { Timer } from './Timer';
import { Scene } from './Scene';
import { SCREEN_WIDTH, SCREEN_HEIGHT, PowerState, type GameState } from '../types';

export class Game {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  private timer: Timer;
  private currentScene: Scene | null = null;

  // Global game state
  state: GameState = {
    lives: 3,
    score: 0,
    filters: 0,
    chillMeter: 0,
    powerState: PowerState.NORMAL,
    currentLevel: '1-1',
    time: 400
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context');
    }
    this.context = context;

    // Set canvas size to NES resolution
    this.canvas.width = SCREEN_WIDTH;
    this.canvas.height = SCREEN_HEIGHT;

    // Disable image smoothing for pixel-perfect rendering
    this.context.imageSmoothingEnabled = false;

    // Scale canvas to fit screen while maintaining aspect ratio
    this.scaleToFit();
    window.addEventListener('resize', () => this.scaleToFit());

    // Create game loop
    this.timer = new Timer((delta) => this.update(delta));
  }

  private scaleToFit(): void {
    const aspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
    const windowAspect = window.innerWidth / window.innerHeight;

    let width: number;
    let height: number;

    if (windowAspect > aspectRatio) {
      // Window is wider than game
      height = window.innerHeight;
      width = height * aspectRatio;
    } else {
      // Window is taller than game
      width = window.innerWidth;
      height = width / aspectRatio;
    }

    // Round to nearest pixel to avoid subpixel rendering
    width = Math.floor(width);
    height = Math.floor(height);

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  setScene(scene: Scene): void {
    if (this.currentScene) {
      this.currentScene.exit();
    }
    this.currentScene = scene;
    this.currentScene.enter();
  }

  start(): void {
    this.timer.start();
  }

  stop(): void {
    this.timer.stop();
  }

  private update(delta: number): void {
    if (this.currentScene) {
      this.currentScene.update(delta);
      this.currentScene.draw(this.context);
    }
  }

  resetState(): void {
    this.state = {
      lives: 3,
      score: 0,
      filters: 0,
      chillMeter: 0,
      powerState: PowerState.NORMAL,
      currentLevel: '1-1',
      time: 400
    };
  }

  addScore(points: number): void {
    this.state.score += points;
  }

  addFilter(): void {
    this.state.filters++;
    if (this.state.filters >= 100) {
      this.state.filters = 0;
      this.state.lives++;
    }
  }

  loseLife(): boolean {
    this.state.lives--;
    this.state.powerState = PowerState.NORMAL;
    return this.state.lives > 0;
  }
}
