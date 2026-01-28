import { Scene } from '../engine/Scene';
import type { Game } from '../engine/Game';
import { SCREEN_WIDTH, SCREEN_HEIGHT, COLORS } from '../types';

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

export class LevelCompleteScene extends Scene {
  private confetti: ConfettiPiece[] = [];
  private timer = 0;
  private textAlpha = 0;
  private onContinue: () => void;
  private canContinue = false;
  private blinkTimer = 0;
  private showContinue = true;

  // Corporate colors for Smoking Paper brand
  private readonly brandColors = [
    COLORS.SMOKY_GREEN,   // Crimson red
    COLORS.SMOKY_LIGHT,   // Light red
    COLORS.SMOKY_DARK,    // Dark red
    '#fff',               // White
    COLORS.GOLD,          // Gold
  ];

  constructor(game: Game, onContinue: () => void) {
    super(game);
    this.onContinue = onContinue;
  }

  enter(): void {
    // Spawn initial burst of confetti
    this.spawnConfettiBurst(80);

    // Listen for continue input
    const handleKey = (event: KeyboardEvent) => {
      if (this.canContinue && (event.code === 'Space' || event.code === 'Enter')) {
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('touchstart', handleTouch);
        this.onContinue();
      }
    };

    const handleTouch = () => {
      if (this.canContinue) {
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('touchstart', handleTouch);
        this.onContinue();
      }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('touchstart', handleTouch);
  }

  private spawnConfettiBurst(count: number): void {
    for (let i = 0; i < count; i++) {
      this.confetti.push({
        x: Math.random() * SCREEN_WIDTH,
        y: -10 - Math.random() * SCREEN_HEIGHT,
        vx: (Math.random() - 0.5) * 60,
        vy: 30 + Math.random() * 50,
        width: 2 + Math.random() * 3,
        height: 2 + Math.random() * 4,
        color: this.brandColors[Math.floor(Math.random() * this.brandColors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 6,
      });
    }
  }

  update(delta: number): void {
    this.timer += delta;

    // Fade in SMOKING text
    if (this.textAlpha < 1) {
      this.textAlpha = Math.min(1, this.textAlpha + delta * 1.5);
    }

    // Spawn more confetti over time
    if (this.timer < 3 && Math.random() < delta * 15) {
      this.spawnConfettiBurst(3);
    }

    // Update confetti
    for (const piece of this.confetti) {
      piece.x += piece.vx * delta;
      piece.vy += 20 * delta; // gravity
      piece.y += piece.vy * delta;
      piece.vx += (Math.random() - 0.5) * 40 * delta; // wobble
      piece.rotation += piece.rotationSpeed * delta;
    }

    // Remove off-screen confetti
    this.confetti = this.confetti.filter(p => p.y < SCREEN_HEIGHT + 20);

    // Allow continue after 2 seconds
    if (this.timer > 2) {
      this.canContinue = true;
      this.blinkTimer += delta;
      if (this.blinkTimer >= 0.5) {
        this.blinkTimer = 0;
        this.showContinue = !this.showContinue;
      }
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    // Dark background
    context.fillStyle = '#000';
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Draw confetti behind text
    for (const piece of this.confetti) {
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.color;
      context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
      context.restore();
    }

    // SMOKING text with brand colors
    context.save();
    context.globalAlpha = this.textAlpha;

    // Shadow
    context.fillStyle = COLORS.SMOKY_DARK;
    context.font = 'bold 28px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('SMOKING', SCREEN_WIDTH / 2 + 2, 82);

    // Main text
    context.fillStyle = COLORS.SMOKY_GREEN;
    context.fillText('SMOKING', SCREEN_WIDTH / 2, 80);

    // Highlight stroke on top
    context.fillStyle = COLORS.SMOKY_LIGHT;
    context.font = 'bold 28px monospace';
    context.fillText('SMOKING', SCREEN_WIDTH / 2, 79);

    // Subtitle
    context.fillStyle = '#fff';
    context.font = '10px monospace';
    context.fillText('LEVEL COMPLETE!', SCREEN_WIDTH / 2, 110);

    // Score
    context.fillStyle = COLORS.GOLD;
    context.font = 'bold 14px monospace';
    context.fillText(
      'SCORE ' + this.game.state.score.toString().padStart(6, '0'),
      SCREEN_WIDTH / 2,
      140
    );

    context.restore();

    // Continue prompt
    if (this.canContinue && this.showContinue) {
      context.fillStyle = '#fff';
      context.font = '8px monospace';
      context.textAlign = 'center';
      context.fillText('PRESS SPACE TO CONTINUE', SCREEN_WIDTH / 2, 200);
    }
  }
}
