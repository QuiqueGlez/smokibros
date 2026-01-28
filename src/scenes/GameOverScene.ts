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

    // "Te ha dao un amarillo" text
    context.fillStyle = '#FFD700';
    context.font = 'bold 12px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('TE HA DAO', SCREEN_WIDTH / 2, 70);
    context.fillText('UN AMARILLO', SCREEN_WIDTH / 2, 88);

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

  private drawSadSmoky(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    const w = 16;

    // Hair (brown/dark)
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(3, 0, w - 6, 3);
    ctx.fillRect(2, 1, 2, 2);
    ctx.fillRect(w - 4, 1, 2, 2);

    // Face/skin
    ctx.fillStyle = '#e8b88a';
    ctx.fillRect(3, 3, w - 6, 6);

    // X eyes (KO)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    // Left X
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(7, 6);
    ctx.moveTo(7, 4);
    ctx.lineTo(4, 6);
    ctx.stroke();
    // Right X
    ctx.beginPath();
    ctx.moveTo(9, 4);
    ctx.lineTo(12, 6);
    ctx.moveTo(12, 4);
    ctx.lineTo(9, 6);
    ctx.stroke();

    // Frown
    ctx.fillStyle = '#000';
    ctx.fillRect(6, 7, 4, 1);

    // Green hoodie body
    ctx.fillStyle = COLORS.SMOKY_GREEN;
    ctx.fillRect(2, 9, w - 4, 4);

    // Darker hoodie details
    ctx.fillStyle = '#1a5c14';
    ctx.fillRect(7, 9, 2, 4);

    // Jeans
    ctx.fillStyle = '#4a6fa5';
    ctx.fillRect(3, 13, w - 6, 3);
    ctx.fillStyle = '#3a5a8a';
    ctx.fillRect(7, 13, 1, 3);

    ctx.restore();
  }
}
