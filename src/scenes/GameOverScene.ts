import { Scene } from '../engine/Scene';
import type { Game } from '../engine/Game';
import { SCREEN_WIDTH, SCREEN_HEIGHT, COLORS } from '../types';

export class GameOverScene extends Scene {
  private blinkTimer = 0;
  private showRetry = true;
  private finalScore: number;
  private retryCallback: () => void;

  constructor(game: Game, finalScore: number, onRetry: () => void) {
    super(game);
    this.finalScore = finalScore;
    this.retryCallback = onRetry;
  }

  enter(): void {
    // Listen for retry input
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('touchstart', handleTouch);
        this.retryCallback();
      }
    };

    const handleTouch = () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('touchstart', handleTouch);
      this.retryCallback();
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('touchstart', handleTouch);
  }

  update(delta: number): void {
    // Blink retry text
    this.blinkTimer += delta;
    if (this.blinkTimer >= 0.5) {
      this.blinkTimer = 0;
      this.showRetry = !this.showRetry;
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    // Dark background
    context.fillStyle = '#000';
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Game Over text
    context.fillStyle = '#B22222';
    context.font = 'bold 20px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('GAME OVER', SCREEN_WIDTH / 2, 80);

    // Final score
    context.fillStyle = '#fff';
    context.font = '10px monospace';
    context.fillText('FINAL SCORE', SCREEN_WIDTH / 2, 120);

    context.fillStyle = COLORS.GOLD;
    context.font = 'bold 16px monospace';
    context.fillText(this.finalScore.toString().padStart(6, '0'), SCREEN_WIDTH / 2, 140);

    // Sad Smoky
    this.drawSadSmoky(context, SCREEN_WIDTH / 2 - 10, 160);

    // Retry prompt
    if (this.showRetry) {
      context.fillStyle = '#fff';
      context.font = '8px monospace';
      context.fillText('PRESS SPACE TO RETRY', SCREEN_WIDTH / 2, 210);
    }
  }

  private drawSadSmoky(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.save();
    context.translate(x, y);

    // Body (grayed out)
    context.fillStyle = '#1a3a17';
    context.fillRect(0, 0, 20, 24);

    // X eyes (dead)
    context.strokeStyle = '#fff';
    context.lineWidth = 2;

    // Left X
    context.beginPath();
    context.moveTo(4, 6);
    context.lineTo(8, 10);
    context.moveTo(8, 6);
    context.lineTo(4, 10);
    context.stroke();

    // Right X
    context.beginPath();
    context.moveTo(12, 6);
    context.lineTo(16, 10);
    context.moveTo(16, 6);
    context.lineTo(12, 10);
    context.stroke();

    // Frown
    context.fillStyle = '#fff';
    context.fillRect(6, 18, 8, 2);

    context.restore();
  }
}
