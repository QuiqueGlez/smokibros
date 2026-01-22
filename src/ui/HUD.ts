import type { GameState } from '../types';
import { COLORS } from '../types';

export class HUD {
  private state: GameState;
  private animTimer = 0;

  constructor(state: GameState) {
    this.state = state;
  }

  update(delta: number): void {
    this.animTimer += delta;
  }

  draw(context: CanvasRenderingContext2D): void {
    context.save();

    // Set font
    context.font = '8px monospace';
    context.textBaseline = 'top';

    // Draw score
    this.drawLabel(context, 'SMOKY', 24, 8);
    this.drawValue(context, this.padNumber(this.state.score, 6), 24, 16);

    // Draw filters (coins)
    this.drawFilterIcon(context, 80, 16);
    this.drawValue(context, `x${this.padNumber(this.state.filters, 2)}`, 92, 16);

    // Draw level name
    this.drawLabel(context, 'WORLD', 136, 8);
    this.drawValue(context, this.state.currentLevel, 136, 16);

    // Draw time
    this.drawLabel(context, 'TIME', 192, 8);
    const timeColor = this.state.time <= 100 ? '#ff0000' : '#fff';
    context.fillStyle = timeColor;
    context.fillText(Math.ceil(this.state.time).toString(), 196, 16);

    // Draw Chill Meter
    this.drawChillMeter(context, 24, 28);

    context.restore();
  }

  private drawChillMeter(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const width = 60;
    const height = 6;
    const chill = this.state.chillMeter;
    const fillWidth = (chill / 100) * (width - 2);

    // Label with smoke icon
    ctx.fillStyle = '#fff';
    ctx.font = '6px monospace';
    ctx.fillText('CHILL', x, y - 1);

    // Draw smoke icon (animated when chill > 30)
    if (chill > 30) {
      const smokeOffset = Math.sin(this.animTimer * 4) * 2;
      ctx.fillStyle = this.getChillColor(chill);
      ctx.globalAlpha = 0.5 + Math.sin(this.animTimer * 3) * 0.3;
      ctx.fillRect(x + 28 + smokeOffset, y - 2, 2, 3);
      ctx.fillRect(x + 31, y - 3 - Math.abs(smokeOffset), 2, 2);
      ctx.globalAlpha = 1;
    }

    // Background bar
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y + 6, width, height);

    // Border
    ctx.fillStyle = '#444';
    ctx.fillRect(x, y + 6, width, 1);
    ctx.fillRect(x, y + 6, 1, height);
    ctx.fillRect(x + width - 1, y + 6, 1, height);
    ctx.fillRect(x, y + 6 + height - 1, width, 1);

    // Fill based on chill level
    if (chill > 0) {
      // Gradient effect based on chill level
      const color = this.getChillColor(chill);
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 7, fillWidth, height - 2);

      // Shine effect at high chill
      if (chill >= 60) {
        const shinePos = ((this.animTimer * 30) % (width + 10)) - 5;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(x + 1 + Math.max(0, shinePos), y + 7, 3, 1);
      }

      // Pulsing glow at max chill
      if (chill >= 90) {
        const pulse = (Math.sin(this.animTimer * 6) + 1) / 2;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 4 + pulse * 4;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 1, y + 7, fillWidth, height - 2);
        ctx.shadowBlur = 0;
      }
    }

    // Threshold markers
    ctx.fillStyle = '#666';
    // 30% marker (speed boost)
    ctx.fillRect(x + Math.floor(width * 0.3), y + 6, 1, height);
    // 60% marker (jump boost)
    ctx.fillRect(x + Math.floor(width * 0.6), y + 6, 1, height);
    // 90% marker (max chill)
    ctx.fillRect(x + Math.floor(width * 0.9), y + 6, 1, height);

    // Status text
    ctx.font = '6px monospace';
    if (chill >= 90) {
      ctx.fillStyle = '#FFD700';
      ctx.fillText('MAX!', x + width + 4, y + 6);
    } else if (chill >= 60) {
      ctx.fillStyle = COLORS.SMOKY_GREEN;
      ctx.fillText('NICE', x + width + 4, y + 6);
    } else if (chill >= 30) {
      ctx.fillStyle = COLORS.SMOKY_LIGHT;
      ctx.fillText('CHILL', x + width + 4, y + 6);
    }
  }

  private getChillColor(chill: number): string {
    if (chill < 30) return '#666666';           // Gray
    if (chill < 60) return COLORS.SMOKY_LIGHT;  // Light green
    if (chill < 90) return COLORS.SMOKY_GREEN;  // Dark green
    return '#FFD700';                            // Gold for max chill
  }

  private drawFilterIcon(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Draw a small filter/coin icon
    ctx.fillStyle = COLORS.GOLD;
    ctx.fillRect(x + 2, y + 1, 6, 6);
    ctx.fillStyle = COLORS.GOLD_LIGHT;
    ctx.fillRect(x + 3, y + 2, 2, 2);
  }

  private drawLabel(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number
  ): void {
    context.fillStyle = '#fff';
    context.font = '8px monospace';
    context.fillText(text, x, y);
  }

  private drawValue(
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number
  ): void {
    context.fillStyle = '#fff';
    context.font = '8px monospace';
    context.fillText(text, x, y);
  }

  private padNumber(num: number, length: number): string {
    return num.toString().padStart(length, '0');
  }
}
