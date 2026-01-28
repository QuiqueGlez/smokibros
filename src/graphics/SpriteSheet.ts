export interface SpriteDefinition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class SpriteSheet {
  private image: HTMLImageElement;
  private sprites = new Map<string, HTMLCanvasElement>();
  private flippedSprites = new Map<string, HTMLCanvasElement>();

  constructor(image: HTMLImageElement) {
    this.image = image;
  }

  define(name: string, x: number, y: number, width: number, height: number): void {
    // Create a canvas for this sprite
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d')!;
    context.imageSmoothingEnabled = false;
    context.drawImage(this.image, x, y, width, height, 0, 0, width, height);

    this.sprites.set(name, canvas);

    // Create flipped version
    const flippedCanvas = document.createElement('canvas');
    flippedCanvas.width = width;
    flippedCanvas.height = height;

    const flippedContext = flippedCanvas.getContext('2d')!;
    flippedContext.imageSmoothingEnabled = false;
    flippedContext.scale(-1, 1);
    flippedContext.drawImage(canvas, -width, 0);

    this.flippedSprites.set(name, flippedCanvas);
  }

  defineTile(name: string, x: number, y: number, tileSize = 16): void {
    this.define(name, x * tileSize, y * tileSize, tileSize, tileSize);
  }

  draw(
    name: string,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    flip = false
  ): void {
    const sprites = flip ? this.flippedSprites : this.sprites;
    const sprite = sprites.get(name);

    if (sprite) {
      context.drawImage(sprite, Math.floor(x), Math.floor(y));
    }
  }

  drawTile(
    name: string,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    tileSize = 16
  ): void {
    this.draw(name, context, x * tileSize, y * tileSize);
  }

  getSize(name: string): { width: number; height: number } | undefined {
    const sprite = this.sprites.get(name);
    if (sprite) {
      return { width: sprite.width, height: sprite.height };
    }
    return undefined;
  }
}

// Create placeholder sprites using colored rectangles
export function createPlaceholderSprites(): SpriteSheet {
  // Create a 256x256 canvas for placeholder sprites
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Smoky (green) - normal size 14x16 at (0,0)
  ctx.fillStyle = '#2D5A27';
  ctx.fillRect(0, 0, 14, 16);
  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(3, 4, 3, 3);
  ctx.fillRect(8, 4, 3, 3);

  // Smoky walking frame at (16, 0)
  ctx.fillStyle = '#2D5A27';
  ctx.fillRect(16, 0, 14, 16);
  ctx.fillStyle = '#fff';
  ctx.fillRect(19, 4, 3, 3);
  ctx.fillRect(24, 4, 3, 3);
  ctx.fillStyle = '#1a3a17';
  ctx.fillRect(18, 12, 4, 4);

  // Smoky jumping at (32, 0)
  ctx.fillStyle = '#2D5A27';
  ctx.fillRect(32, 0, 14, 16);
  ctx.fillStyle = '#fff';
  ctx.fillRect(35, 3, 3, 3);
  ctx.fillRect(40, 3, 3, 3);

  // Smoky big 14x32 at (0, 32)
  ctx.fillStyle = '#2D5A27';
  ctx.fillRect(0, 32, 14, 32);
  ctx.fillStyle = '#fff';
  ctx.fillRect(3, 8 + 32, 3, 4);
  ctx.fillRect(8, 8 + 32, 3, 4);

  // Ground tile at (0, 80)
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 80, 16, 16);
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, 80, 16, 2);
  ctx.fillRect(4, 84, 2, 2);
  ctx.fillRect(10, 88, 2, 2);

  // Brick tile at (16, 80)
  ctx.fillStyle = '#B22222';
  ctx.fillRect(16, 80, 16, 16);
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(16, 80, 16, 1);
  ctx.fillRect(16, 87, 16, 1);
  ctx.fillRect(23, 80, 1, 8);

  // Question block at (32, 80)
  ctx.fillStyle = '#C9A227';
  ctx.fillRect(32, 80, 16, 16);
  ctx.fillStyle = '#000';
  ctx.font = '12px monospace';
  ctx.fillText('S', 36, 92);

  // Empty block at (48, 80)
  ctx.fillStyle = '#654321';
  ctx.fillRect(48, 80, 16, 16);

  // Buzzkill (enemy) at (0, 112)
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(0, 112, 16, 16);
  ctx.fillStyle = '#fff';
  ctx.fillRect(3, 116, 3, 3);
  ctx.fillRect(10, 116, 3, 3);

  // Filter (coin) at (16, 112)
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(24, 120, 6, 0, Math.PI * 2);
  ctx.fill();

  // Pipe top at (0, 144)
  ctx.fillStyle = '#228B22';
  ctx.fillRect(0, 144, 32, 16);
  ctx.fillStyle = '#32CD32';
  ctx.fillRect(0, 144, 32, 4);

  // Pipe body at (0, 160)
  ctx.fillStyle = '#228B22';
  ctx.fillRect(2, 160, 28, 16);
  ctx.fillStyle = '#32CD32';
  ctx.fillRect(2, 160, 4, 16);

  // Sky/empty at (64, 80)
  ctx.fillStyle = '#6b8cff';
  ctx.fillRect(64, 80, 16, 16);

  // Create spritesheet from canvas
  const image = new Image();
  image.src = canvas.toDataURL();

  // Create the sheet directly from the canvas image
  const syncSheet = new SpriteSheet(image);

  // Manually copy canvas data
  syncSheet.define('smoky-idle', 0, 0, 14, 16);
  syncSheet.define('smoky-walk-1', 0, 0, 14, 16);
  syncSheet.define('smoky-walk-2', 16, 0, 14, 16);
  syncSheet.define('smoky-walk-3', 0, 0, 14, 16);
  syncSheet.define('smoky-jump', 32, 0, 14, 16);
  syncSheet.define('smoky-big-idle', 0, 32, 14, 32);

  syncSheet.define('ground', 0, 80, 16, 16);
  syncSheet.define('brick', 16, 80, 16, 16);
  syncSheet.define('question', 32, 80, 16, 16);
  syncSheet.define('empty-block', 48, 80, 16, 16);
  syncSheet.define('sky', 64, 80, 16, 16);

  syncSheet.define('buzzkill', 0, 112, 16, 16);
  syncSheet.define('filter', 16, 112, 16, 16);

  syncSheet.define('pipe-top-left', 0, 144, 16, 16);
  syncSheet.define('pipe-top-right', 16, 144, 16, 16);
  syncSheet.define('pipe-left', 0, 160, 16, 16);
  syncSheet.define('pipe-right', 16, 160, 16, 16);

  return syncSheet;
}
