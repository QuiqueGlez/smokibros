import { Scene } from '../engine/Scene';
import type { Game } from '../engine/Game';
import { SCREEN_WIDTH, SCREEN_HEIGHT, COLORS } from '../types';

export class TitleScene extends Scene {
  private blinkTimer = 0;
  private showPressStart = true;
  private startCallback: () => void;

  constructor(game: Game, onStart: () => void) {
    super(game);
    this.startCallback = onStart;
  }

  enter(): void {
    // Listen for start input
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('touchstart', handleTouch);
        this.startCallback();
      }
    };

    const handleTouch = () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('touchstart', handleTouch);
      this.startCallback();
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('touchstart', handleTouch);
  }

  update(delta: number): void {
    // Blink "Press Start"
    this.blinkTimer += delta;
    if (this.blinkTimer >= 0.5) {
      this.blinkTimer = 0;
      this.showPressStart = !this.showPressStart;
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    // Background
    context.fillStyle = COLORS.SKY_BLUE;
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Title
    context.fillStyle = COLORS.SMOKY_GREEN;
    context.font = 'bold 24px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('SMOKING', SCREEN_WIDTH / 2, 60);

    context.fillStyle = COLORS.GOLD;
    context.fillText('BROS', SCREEN_WIDTH / 2, 90);

    // Subtitle
    context.fillStyle = '#fff';
    context.font = '8px monospace';
    context.fillText('A Smoking Paper Adventure', SCREEN_WIDTH / 2, 120);

    // Draw Smoky character placeholder
    this.drawSmokyLogo(context, SCREEN_WIDTH / 2 - 20, 140);

    // Press Start
    if (this.showPressStart) {
      context.fillStyle = '#fff';
      context.font = '10px monospace';
      context.fillText('PRESS SPACE TO START', SCREEN_WIDTH / 2, 200);
    }

    // Copyright
    context.fillStyle = '#888';
    context.font = '6px monospace';
    context.fillText('2024 SMOKING PAPER', SCREEN_WIDTH / 2, 230);
  }

  private drawSmokyLogo(context: CanvasRenderingContext2D, x: number, y: number): void {
    // Large Smoky character for title screen - guy with joint
    const scale = 2;

    context.save();
    context.translate(x, y);
    context.scale(scale, scale);

    // Hair
    context.fillStyle = '#4a3728';
    context.fillRect(4, 0, 12, 5);
    context.fillRect(2, 2, 3, 4);
    context.fillRect(15, 2, 3, 4);

    // Face
    context.fillStyle = '#e8b88a';
    context.fillRect(3, 5, 14, 10);

    // Eyes
    context.fillStyle = '#fff';
    context.fillRect(5, 7, 4, 3);
    context.fillRect(11, 7, 4, 3);
    context.fillStyle = '#000';
    context.fillRect(7, 8, 2, 2);
    context.fillRect(13, 8, 2, 2);

    // Smile
    context.fillStyle = '#000';
    context.fillRect(7, 12, 6, 1);

    // Joint
    context.fillStyle = '#fff';
    context.fillRect(17, 11, 8, 3);
    context.fillStyle = '#ff6600';
    context.fillRect(24, 11, 2, 3);

    // Green hoodie
    context.fillStyle = COLORS.SMOKY_GREEN;
    context.fillRect(2, 15, 16, 9);
    context.fillStyle = COLORS.SMOKY_DARK;
    context.fillRect(7, 15, 6, 7);

    context.restore();
  }
}
