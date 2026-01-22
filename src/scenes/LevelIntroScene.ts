import { Scene } from '../engine/Scene';
import type { Game } from '../engine/Game';
import { COLORS } from '../types';

// Level intro screen - shows world name before level starts
export class LevelIntroScene extends Scene {
  private worldName: string;
  private duration = 3; // Seconds to show intro
  private timer = 0;
  private onComplete: () => void;

  constructor(game: Game, worldName: string, onComplete: () => void) {
    super(game);
    this.worldName = worldName;
    this.onComplete = onComplete;
  }

  enter(): void {
    this.timer = 0;
  }

  update(delta: number): void {
    this.timer += delta;

    if (this.timer >= this.duration) {
      this.onComplete();
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    // Black background
    context.fillStyle = '#000';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    // Set font
    context.font = '8px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const centerX = context.canvas.width / 2;
    const centerY = context.canvas.height / 2;

    // "WORLD" text
    context.fillStyle = '#fff';
    context.fillText('WORLD', centerX, centerY - 30);

    // World name (e.g. "1-1")
    context.fillStyle = '#fff';
    context.fillText(this.worldName, centerX, centerY - 16);

    // Draw Smoky icon
    this.drawSmokyIcon(context, centerX - 20, centerY + 10);

    // Lives display
    context.fillStyle = '#fff';
    context.fillText(`x  ${this.game.state.lives}`, centerX + 10, centerY + 18);

    // Draw decorative elements
    this.drawDecorations(context, centerX, centerY);
  }

  private drawSmokyIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Small Smoky face
    // Hair
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(x + 2, y, 12, 3);

    // Face
    ctx.fillStyle = '#e8b88a';
    ctx.fillRect(x + 2, y + 3, 12, 8);

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 3, y + 4, 3, 2);
    ctx.fillRect(x + 10, y + 4, 3, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 4, y + 4, 2, 2);
    ctx.fillRect(x + 11, y + 4, 2, 2);

    // Smile
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 6, y + 8, 4, 1);

    // Joint
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 14, y + 6, 4, 2);
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(x + 17, y + 6, 1, 2);

    // Green hoodie
    ctx.fillStyle = COLORS.SMOKY_GREEN;
    ctx.fillRect(x + 1, y + 11, 14, 5);
  }

  private drawDecorations(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    // Smoking Paper leaf decorations (green leaves)
    ctx.fillStyle = '#2D5A27';  // Keep leaves green

    // Left leaf
    ctx.beginPath();
    ctx.moveTo(centerX - 80, centerY - 20);
    ctx.lineTo(centerX - 65, centerY - 30);
    ctx.lineTo(centerX - 60, centerY - 15);
    ctx.closePath();
    ctx.fill();

    // Right leaf
    ctx.beginPath();
    ctx.moveTo(centerX + 80, centerY - 20);
    ctx.lineTo(centerX + 65, centerY - 30);
    ctx.lineTo(centerX + 60, centerY - 15);
    ctx.closePath();
    ctx.fill();

    // Timer display at bottom
    ctx.fillStyle = '#fff';
    ctx.fillText(`TIME: ${Math.ceil(this.game.state.time)}`, centerX, centerY + 50);
  }
}
