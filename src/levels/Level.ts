import { Entity } from '../engine/Entity';
import { TileResolver } from '../physics/TileResolver';
import { EntityCollider } from '../physics/EntityCollider';
import { TileType, TILE_SIZE, COLORS } from '../types';
import { createPopupCoin } from '../entities/items/Filter';
import { createGreenPaper, createGoldPaper, createBrownPaper } from '../entities/items/SmokingPaper';
import { audioManager } from '../audio/AudioManager';
import { particleSystem } from '../effects/ParticleSystem';

type BlockContent = 'coin' | 'mushroom' | 'star' | 'green' | 'gold' | 'brown' | 'empty';

export class Level {
  readonly name: string;
  readonly tileResolver: TileResolver;
  readonly entities: Set<Entity> = new Set();
  private entityCollider: EntityCollider;

  // Question block contents
  private blockContents = new Map<string, BlockContent>();
  private bouncingBlocks = new Map<string, number>();

  // Callbacks - include position for score popups
  onCoinCollected?: (x: number, y: number) => void;
  onBrickBroken?: (x: number, y: number) => void;

  constructor(name: string, tiles: number[][]) {
    this.name = name;
    this.tileResolver = new TileResolver(tiles);
    this.entityCollider = new EntityCollider(this.entities);
  }

  setBlockContent(tileX: number, tileY: number, content: BlockContent): void {
    this.blockContents.set(`${tileX},${tileY}`, content);
  }

  hitBlock(tileX: number, tileY: number, isBig: boolean = false): void {
    const tile = this.tileResolver.getByIndex(tileX, tileY);
    if (!tile) return;

    const key = `${tileX},${tileY}`;
    const pixelX = tileX * TILE_SIZE;
    const pixelY = tileY * TILE_SIZE;

    if (tile.type === TileType.QUESTION) {
      const content = this.blockContents.get(key) || 'coin';

      if (content === 'coin') {
        const coin = createPopupCoin();
        coin.pos.x = pixelX + 3;
        coin.pos.y = pixelY - 16;
        this.addEntity(coin);
        audioManager.play('coin');
        particleSystem.spawnSparkles(pixelX + 8, pixelY, '#ffff00');
        if (this.onCoinCollected) this.onCoinCollected(pixelX + 8, pixelY - 8);
      } else if (content === 'mushroom' || content === 'green') {
        // Green Smoking Paper - makes you grow
        const greenPaper = createGreenPaper(pixelX, pixelY - 16);
        this.addEntity(greenPaper);
        audioManager.play('powerup');
        particleSystem.spawnSparkles(pixelX + 8, pixelY, '#00ff00');
      } else if (content === 'star' || content === 'gold') {
        // Gold Smoking Paper - invincibility
        const goldPaper = createGoldPaper(pixelX, pixelY - 16);
        this.addEntity(goldPaper);
        audioManager.play('powerup');
        particleSystem.spawnSparkles(pixelX + 8, pixelY, '#ffff00');
      } else if (content === 'brown') {
        // Brown Smoking Paper - speed boost (max chill)
        const brownPaper = createBrownPaper(pixelX, pixelY - 16);
        this.addEntity(brownPaper);
        audioManager.play('powerup');
        particleSystem.spawnSparkles(pixelX + 8, pixelY, '#ff8800');
      }

      this.tileResolver.setTile(tileX, tileY, TileType.BLOCK);
      this.bouncingBlocks.set(key, 1);
    } else if (tile.type === TileType.BRICK) {
      if (isBig) {
        // Break the brick!
        this.tileResolver.setTile(tileX, tileY, TileType.AIR);
        // Spawn debris
        this.spawnBrickDebris(pixelX, pixelY);
        audioManager.play('brick');
        if (this.onBrickBroken) this.onBrickBroken(pixelX + 8, pixelY);
      } else {
        // Just bounce
        this.bouncingBlocks.set(key, 1);
        audioManager.play('bump');
      }
    } else if (tile.type === TileType.INVISIBLE) {
      // Invisible block - reveal it and spawn content
      const content = this.blockContents.get(key) || 'coin';

      if (content === 'coin') {
        const coin = createPopupCoin();
        coin.pos.x = pixelX + 3;
        coin.pos.y = pixelY - 16;
        this.addEntity(coin);
        audioManager.play('coin');
        particleSystem.spawnSparkles(pixelX + 8, pixelY, '#ffff00');
        if (this.onCoinCollected) this.onCoinCollected(pixelX + 8, pixelY - 8);
      } else if (content === 'mushroom' || content === 'green') {
        // Green Smoking Paper - makes you grow
        const greenPaper = createGreenPaper(pixelX, pixelY - 16);
        this.addEntity(greenPaper);
        audioManager.play('powerup');
        particleSystem.spawnSparkles(pixelX + 8, pixelY, '#00ff00');
      } else if (content === 'star' || content === 'gold') {
        // Gold Smoking Paper - invincibility
        const goldPaper = createGoldPaper(pixelX, pixelY - 16);
        this.addEntity(goldPaper);
        audioManager.play('powerup');
        particleSystem.spawnSparkles(pixelX + 8, pixelY, '#ffff00');
      } else if (content === 'brown') {
        // Brown Smoking Paper - speed boost (max chill)
        const brownPaper = createBrownPaper(pixelX, pixelY - 16);
        this.addEntity(brownPaper);
        audioManager.play('powerup');
        particleSystem.spawnSparkles(pixelX + 8, pixelY, '#ff8800');
      }

      // Surprise sparkles for hidden block reveal!
      particleSystem.spawnSparkles(pixelX + 8, pixelY + 8, '#fff');

      // Transform to used block (now visible)
      this.tileResolver.setTile(tileX, tileY, TileType.BLOCK);
      this.bouncingBlocks.set(key, 1);
    }
  }

  private spawnBrickDebris(x: number, y: number): void {
    // Create 4 debris pieces that fly outward
    const debris = [
      { vx: -60, vy: -200 },  // Top-left
      { vx: 60, vy: -200 },   // Top-right
      { vx: -40, vy: -150 },  // Bottom-left
      { vx: 40, vy: -150 },   // Bottom-right
    ];

    for (const d of debris) {
      const piece = this.createDebris(x + 4, y + 4, d.vx, d.vy);
      this.addEntity(piece);
    }
  }

  private createDebris(x: number, y: number, vx: number, vy: number): Entity {
    const debris = new Entity();
    debris.pos.x = x;
    debris.pos.y = y;
    debris.vel.x = vx;
    debris.vel.y = vy;
    debris.size = { x: 8, y: 8 };

    let rotation = 0;

    debris.draw = (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.translate(debris.pos.x + 4, debris.pos.y + 4);
      ctx.rotate(rotation);

      // Draw brick piece
      ctx.fillStyle = COLORS.BRICK_ORANGE;
      ctx.fillRect(-4, -4, 8, 8);
      ctx.fillStyle = COLORS.BRICK_DARK;
      ctx.fillRect(-4, -4, 8, 2);
      ctx.fillRect(-4, -4, 2, 8);

      ctx.restore();
    };

    const baseUpdate = debris.update.bind(debris);
    debris.update = (delta: number, level?: Level) => {
      baseUpdate(delta, level);

      // Apply gravity
      debris.vel.y += 600 * delta;
      debris.pos.x += debris.vel.x * delta;
      debris.pos.y += debris.vel.y * delta;

      // Rotate
      rotation += 10 * delta;

      // Remove when off screen
      if (debris.pos.y > 300 && level) {
        level.removeEntity(debris);
      }
    };

    return debris;
  }

  addEntity(entity: Entity): void {
    this.entities.add(entity);
  }

  removeEntity(entity: Entity): void {
    this.entities.delete(entity);
  }

  update(delta: number): void {
    for (const entity of this.entities) {
      entity.update(delta, this);
    }
    this.entityCollider.check();

    // Update bouncing blocks
    for (const [key, bounce] of this.bouncingBlocks.entries()) {
      const newBounce = bounce - delta * 8;
      if (newBounce <= 0) {
        this.bouncingBlocks.delete(key);
      } else {
        this.bouncingBlocks.set(key, newBounce);
      }
    }
  }

  draw(context: CanvasRenderingContext2D, cameraX: number, _cameraY: number): void {
    // Sky background
    context.fillStyle = COLORS.SKY_BLUE;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    // Draw background decorations
    this.drawBackground(context, cameraX);

    // Draw tiles
    const startX = Math.floor(cameraX / TILE_SIZE);
    const endX = startX + Math.ceil(context.canvas.width / TILE_SIZE) + 1;

    for (let y = 0; y < this.tileResolver.height; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.tileResolver.getByIndex(x, y);
        if (tile && tile.type !== TileType.AIR) {
          const screenX = Math.floor(x * TILE_SIZE - cameraX);
          const screenY = y * TILE_SIZE;

          // Get bounce offset
          const bounceKey = `${x},${y}`;
          const bounce = this.bouncingBlocks.get(bounceKey) || 0;
          const bounceOffset = Math.sin(bounce * Math.PI) * -4;

          this.drawTile(context, tile.type, screenX, screenY + bounceOffset);
        }
      }
    }

    // Draw entities
    for (const entity of this.entities) {
      context.save();
      context.translate(-cameraX, 0);
      entity.draw(context);
      context.restore();
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D, cameraX: number): void {
    // Draw clouds (y = 32-48)
    this.drawCloud(ctx, 64 - cameraX * 0.5, 32, 3);
    this.drawCloud(ctx, 280 - cameraX * 0.5, 40, 1);
    this.drawCloud(ctx, 440 - cameraX * 0.5, 32, 2);
    this.drawCloud(ctx, 680 - cameraX * 0.5, 40, 1);
    this.drawCloud(ctx, 920 - cameraX * 0.5, 32, 3);
    this.drawCloud(ctx, 1200 - cameraX * 0.5, 40, 2);

    // Draw hills (at ground level - y = 176)
    this.drawHill(ctx, 0 - cameraX * 0.8, 176, 'large');
    this.drawHill(ctx, 240 - cameraX * 0.8, 192, 'small');
    this.drawHill(ctx, 480 - cameraX * 0.8, 176, 'large');
    this.drawHill(ctx, 720 - cameraX * 0.8, 192, 'small');
    this.drawHill(ctx, 960 - cameraX * 0.8, 176, 'large');
    this.drawHill(ctx, 1200 - cameraX * 0.8, 192, 'small');

    // Draw bushes
    this.drawBush(ctx, 180 - cameraX * 0.9, 192, 3);
    this.drawBush(ctx, 360 - cameraX * 0.9, 192, 1);
    this.drawBush(ctx, 600 - cameraX * 0.9, 192, 2);
    this.drawBush(ctx, 840 - cameraX * 0.9, 192, 1);
    this.drawBush(ctx, 1080 - cameraX * 0.9, 192, 3);
  }

  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    if (x < -64 || x > 300) return;

    ctx.fillStyle = COLORS.CLOUD_WHITE;

    // Draw cloud segments
    for (let i = 0; i < size; i++) {
      // Top bumps
      ctx.beginPath();
      ctx.arc(x + 8 + i * 16, y + 8, 8, 0, Math.PI * 2);
      ctx.fill();

      // Bottom part
      ctx.fillRect(x + i * 16, y + 8, 16, 8);
    }

    // Outline effect
    ctx.fillStyle = COLORS.CLOUD_SHADOW;
    ctx.fillRect(x, y + 14, size * 16, 2);
  }

  private drawHill(ctx: CanvasRenderingContext2D, x: number, baseY: number, size: 'small' | 'large'): void {
    if (x < -80 || x > 300) return;

    const height = size === 'large' ? 32 : 16;
    const width = size === 'large' ? 80 : 48;

    ctx.fillStyle = COLORS.HILL_GREEN;

    // Draw hill as triangle-ish shape
    ctx.beginPath();
    ctx.moveTo(x, baseY + 16);
    ctx.lineTo(x + width / 2, baseY + 16 - height);
    ctx.lineTo(x + width, baseY + 16);
    ctx.closePath();
    ctx.fill();

    // Darker spots
    ctx.fillStyle = COLORS.HILL_DARK;
    if (size === 'large') {
      ctx.fillRect(x + 24, baseY, 4, 4);
      ctx.fillRect(x + 40, baseY - 8, 4, 4);
      ctx.fillRect(x + 52, baseY + 4, 4, 4);
    }
  }

  private drawBush(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    if (x < -48 || x > 300) return;

    ctx.fillStyle = COLORS.BUSH_GREEN;

    for (let i = 0; i < size; i++) {
      // Bush bumps
      ctx.beginPath();
      ctx.arc(x + 8 + i * 16, y + 8, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawTile(ctx: CanvasRenderingContext2D, type: TileType, x: number, y: number): void {
    switch (type) {
      case TileType.GROUND:
        this.drawGroundTile(ctx, x, y);
        break;
      case TileType.BRICK:
        this.drawBrickTile(ctx, x, y);
        break;
      case TileType.QUESTION:
        this.drawQuestionTile(ctx, x, y);
        break;
      case TileType.BLOCK:
        this.drawUsedBlock(ctx, x, y);
        break;
      case TileType.PIPE_TOP_LEFT:
        this.drawPipeTopLeft(ctx, x, y);
        break;
      case TileType.PIPE_TOP_RIGHT:
        this.drawPipeTopRight(ctx, x, y);
        break;
      case TileType.PIPE_LEFT:
        this.drawPipeLeft(ctx, x, y);
        break;
      case TileType.PIPE_RIGHT:
        this.drawPipeRight(ctx, x, y);
        break;
    }
  }

  private drawGroundTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // NES ground block pattern
    ctx.fillStyle = COLORS.BRICK_ORANGE;
    ctx.fillRect(x, y, 16, 16);

    // Brick pattern
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, 16, 1);
    ctx.fillRect(x, y + 7, 16, 2);
    ctx.fillRect(x + 7, y, 2, 8);
    ctx.fillRect(x, y + 9, 2, 7);
    ctx.fillRect(x + 11, y + 9, 2, 7);

    // Highlights
    ctx.fillStyle = COLORS.BRICK_LIGHT;
    ctx.fillRect(x + 1, y + 1, 5, 1);
    ctx.fillRect(x + 9, y + 1, 5, 1);
    ctx.fillRect(x + 1, y + 9, 2, 1);
    ctx.fillRect(x + 5, y + 9, 5, 1);
    ctx.fillRect(x + 13, y + 9, 2, 1);
  }

  private drawBrickTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Same as ground for SMB1 style
    this.drawGroundTile(ctx, x, y);
  }

  private drawQuestionTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Gold background
    ctx.fillStyle = COLORS.QUESTION_ORANGE;
    ctx.fillRect(x, y, 16, 16);

    // Dark border
    ctx.fillStyle = COLORS.QUESTION_DARK;
    ctx.fillRect(x, y, 16, 1);
    ctx.fillRect(x, y, 1, 16);
    ctx.fillRect(x, y + 15, 16, 1);
    ctx.fillRect(x + 15, y, 1, 16);

    // Light inner border
    ctx.fillStyle = COLORS.QUESTION_LIGHT;
    ctx.fillRect(x + 1, y + 1, 14, 1);
    ctx.fillRect(x + 1, y + 1, 1, 14);

    // Question mark
    ctx.fillStyle = COLORS.QUESTION_DARK;
    // Top of ?
    ctx.fillRect(x + 5, y + 3, 6, 2);
    ctx.fillRect(x + 9, y + 5, 2, 2);
    ctx.fillRect(x + 7, y + 7, 2, 2);
    ctx.fillRect(x + 7, y + 9, 2, 2);
    // Dot
    ctx.fillRect(x + 7, y + 12, 2, 2);
  }

  private drawUsedBlock(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = COLORS.BLOCK_BROWN;
    ctx.fillRect(x, y, 16, 16);

    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, 16, 1);
    ctx.fillRect(x, y, 1, 16);
    ctx.fillRect(x, y + 15, 16, 1);
    ctx.fillRect(x + 15, y, 1, 16);

    // Inner border
    ctx.fillStyle = '#5c3000';
    ctx.fillRect(x + 1, y + 1, 14, 1);
    ctx.fillRect(x + 1, y + 1, 1, 14);
    ctx.fillRect(x + 1, y + 14, 14, 1);
    ctx.fillRect(x + 14, y + 1, 1, 14);
  }

  private drawPipeTopLeft(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Main body
    ctx.fillStyle = COLORS.PIPE_GREEN;
    ctx.fillRect(x, y, 16, 16);

    // Top lip
    ctx.fillStyle = COLORS.PIPE_DARK;
    ctx.fillRect(x, y, 2, 16);

    ctx.fillStyle = COLORS.PIPE_LIGHT;
    ctx.fillRect(x + 2, y, 6, 16);

    // Top edge
    ctx.fillStyle = COLORS.PIPE_LIGHT;
    ctx.fillRect(x, y, 16, 2);

    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, 16, 1);
  }

  private drawPipeTopRight(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = COLORS.PIPE_GREEN;
    ctx.fillRect(x, y, 16, 16);

    ctx.fillStyle = COLORS.PIPE_DARK;
    ctx.fillRect(x + 14, y, 2, 16);

    ctx.fillStyle = COLORS.PIPE_LIGHT;
    ctx.fillRect(x, y, 16, 2);

    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, 16, 1);
    ctx.fillRect(x + 15, y, 1, 16);
  }

  private drawPipeLeft(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = COLORS.PIPE_GREEN;
    ctx.fillRect(x + 2, y, 14, 16);

    ctx.fillStyle = COLORS.PIPE_DARK;
    ctx.fillRect(x + 2, y, 2, 16);

    ctx.fillStyle = COLORS.PIPE_LIGHT;
    ctx.fillRect(x + 4, y, 4, 16);
  }

  private drawPipeRight(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = COLORS.PIPE_GREEN;
    ctx.fillRect(x, y, 14, 16);

    ctx.fillStyle = COLORS.PIPE_DARK;
    ctx.fillRect(x + 12, y, 2, 16);

    ctx.fillStyle = '#000';
    ctx.fillRect(x + 13, y, 1, 16);
  }

  get width(): number {
    return this.tileResolver.width * TILE_SIZE;
  }

  get height(): number {
    return this.tileResolver.height * TILE_SIZE;
  }
}
