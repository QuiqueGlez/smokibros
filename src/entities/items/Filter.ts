import { Entity } from '../../engine/Entity';
import { Trait } from '../../engine/Trait';
import type { Level } from '../../levels/Level';
import type { PowerUp } from '../../traits/PowerUp';
import type { ChillMeter } from '../../traits/ChillMeter';
import { audioManager } from '../../audio/AudioManager';
import { productImages } from '../../graphics/ProductImages';

// Collectible trait - picked up on player contact
export class Collectible extends Trait {
  readonly name = 'collectible';

  collected = false;
  onCollect?: (player: Entity) => void;

  collect(player: Entity): void {
    if (this.collected) return;
    this.collected = true;

    if (this.onCollect) {
      this.onCollect(player);
    }
  }

  onEntityCollide(_entity: Entity, other: Entity): void {
    // Check if other is player (has 'go' and 'jump' traits)
    if (other.hasTrait('go') && other.hasTrait('jump')) {
      this.collect(other);
    }
  }

  update(entity: Entity, _delta: number, level?: Level): void {
    if (this.collected && level) {
      level.removeEntity(entity);
    }
  }
}

// Filter - Coin equivalent
export function createFilter(): Entity {
  const filter = new Entity();

  filter.size = { x: 10, y: 14 };
  filter.offset = { x: 3, y: 1 };

  const collectible = new Collectible();
  filter.addTrait(collectible);

  // Animation
  let frame = 0;
  let animTimer = 0;

  filter.draw = (context: CanvasRenderingContext2D) => {
    // Animate spinning
    animTimer += 1 / 60;
    if (animTimer >= 0.08) {
      animTimer = 0;
      frame = (frame + 1) % 4;
    }

    const x = Math.floor(filter.pos.x);
    const y = Math.floor(filter.pos.y);

    // Try product image
    const img = productImages.get('filter');
    if (img) {
      drawFilterImage(context, img, x, y, frame);
    } else {
      drawFilter(context, x, y, frame);
    }
  };

  return filter;
}

function drawFilter(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number): void {
  // Spinning librito de papel Smoking
  const widths = [10, 6, 2, 6];
  const width = widths[frame];
  const xOffset = Math.floor((10 - width) / 2);

  ctx.save();
  ctx.translate(x + xOffset, y);

  // Paper pack body (brown/supreme style)
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 0, width, 14);

  if (width > 4) {
    // Lighter inner area (label)
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(1, 2, width - 2, 8);

    // "S" logo in red
    ctx.fillStyle = '#C41E3A';
    ctx.fillRect(2, 4, Math.max(1, width - 4), 3);

    // White papers sticking out top
    ctx.fillStyle = '#fff';
    ctx.fillRect(1, 0, width - 2, 2);
  } else if (width > 2) {
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(1, 2, width - 2, 8);
  }

  // Dark edge
  ctx.fillStyle = '#5D2906';
  ctx.fillRect(width - 1, 0, 1, 14);
  ctx.fillRect(0, 13, width, 1);

  ctx.restore();
}

// Draw filter using product image with spinning effect
function drawFilterImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, frame: number): void {
  const widths = [10, 6, 2, 6];
  const width = widths[frame];
  const xOffset = Math.floor((10 - width) / 2);

  ctx.save();
  ctx.translate(x + xOffset, y);
  ctx.drawImage(img, 0, 0, width, 14);
  ctx.restore();
}

// Coin that pops up from block and disappears
export function createPopupCoin(): Entity {
  const coin = new Entity();

  coin.size = { x: 10, y: 14 };
  coin.vel.y = -300; // Pop up velocity

  let lifetime = 0;
  let frame = 0;
  let animTimer = 0;

  coin.draw = (context: CanvasRenderingContext2D) => {
    animTimer += 1 / 60;
    if (animTimer >= 0.05) {
      animTimer = 0;
      frame = (frame + 1) % 4;
    }

    const x = Math.floor(coin.pos.x);
    const y = Math.floor(coin.pos.y);

    const img = productImages.get('filter');
    if (img) {
      drawFilterImage(context, img, x, y, frame);
    } else {
      drawFilter(context, x, y, frame);
    }
  };

  // Custom update for popup behavior
  const baseUpdate = coin.update.bind(coin);
  coin.update = (delta: number, level?: Level) => {
    baseUpdate(delta, level);

    // Apply gravity
    coin.vel.y += 800 * delta;
    coin.pos.y += coin.vel.y * delta;

    lifetime += delta;

    // Remove after animation
    if (lifetime > 0.5 && level) {
      level.removeEntity(coin);
    }
  };

  return coin;
}

// Grinder (mushroom) that pops out and moves
export function createGrinder(): Entity {
  const grinder = new Entity();

  grinder.size = { x: 16, y: 16 };

  // State for emerging from block
  let emerging = true;
  let emergeProgress = 0;
  const emergeSpeed = 30; // pixels per second

  const collectible = new Collectible();

  // Power up the player when collected
  collectible.onCollect = (player: Entity) => {
    const powerUp = player.getTrait<PowerUp>('powerup');
    if (powerUp) {
      powerUp.powerUp(player);
      audioManager.play('powerup');
    }
    // Add chill for collecting power-up
    const chillMeter = player.getTrait<ChillMeter>('chillmeter');
    if (chillMeter) {
      chillMeter.collectPowerUp();
    }
  };

  grinder.addTrait(collectible);

  // Direction for movement
  let direction = 1; // Start moving right

  grinder.draw = (context: CanvasRenderingContext2D) => {
    const x = Math.floor(grinder.pos.x);
    const y = Math.floor(grinder.pos.y);

    context.save();

    // Clip if still emerging
    if (emerging) {
      context.beginPath();
      context.rect(x, y + 16 - emergeProgress, 16, emergeProgress);
      context.clip();
    }

    // Try product image
    const img = productImages.get('grinder');
    if (img) {
      context.drawImage(img, x, y, 16, 16);
    } else {
      // Fallback: procedural draw
      context.fillStyle = '#5a8a8a';
      context.fillRect(x + 1, y + 6, 14, 10);
      context.fillStyle = '#7ab0b0';
      context.fillRect(x + 3, y + 7, 4, 8);
      context.fillStyle = '#4a7070';
      context.fillRect(x, y + 7, 1, 2);
      context.fillRect(x, y + 10, 1, 2);
      context.fillRect(x + 15, y + 7, 1, 2);
      context.fillRect(x + 15, y + 10, 1, 2);
      context.fillStyle = '#1a6a8a';
      context.fillRect(x, y, 16, 7);
      context.fillStyle = '#ff6b9d';
      context.fillRect(x + 3, y + 1, 4, 3);
      context.fillStyle = '#ffcc00';
      context.fillRect(x + 8, y + 1, 5, 3);
      context.fillStyle = '#00cc66';
      context.fillRect(x + 5, y + 3, 6, 2);
      context.fillStyle = '#4a7070';
      context.fillRect(x, y + 5, 16, 2);
    }

    context.restore();
  };

  // Custom update for emerging behavior with proper physics
  const baseUpdate = grinder.update.bind(grinder);
  grinder.update = (delta: number, level?: Level) => {
    if (emerging) {
      emergeProgress += emergeSpeed * delta;
      if (emergeProgress >= 16) {
        emerging = false;
        // Start moving after emerging
        grinder.vel.x = 50 * direction;
      }
    } else {
      baseUpdate(delta, level);

      // Apply gravity
      grinder.vel.y += 1500 * delta;

      // Clamp fall speed
      if (grinder.vel.y > 400) {
        grinder.vel.y = 400;
      }

      // Move
      grinder.pos.x += grinder.vel.x * delta;
      grinder.pos.y += grinder.vel.y * delta;

      // Tile collision with level
      if (level) {
        const bounds = grinder.getBounds();

        // Ground collision (check bottom)
        const tileBelow = level.tileResolver.getByPixel(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height + 1
        );

        if (tileBelow && tileBelow.type !== 0) {
          grinder.pos.y = tileBelow.y * 16 - grinder.size.y;
          grinder.vel.y = 0;
        }

        // Wall collision (check sides)
        if (grinder.vel.x > 0) {
          const tileRight = level.tileResolver.getByPixel(
            bounds.x + bounds.width,
            bounds.y + bounds.height / 2
          );
          if (tileRight && tileRight.type !== 0) {
            direction = -1;
            grinder.vel.x = -50;
          }
        } else if (grinder.vel.x < 0) {
          const tileLeft = level.tileResolver.getByPixel(
            bounds.x,
            bounds.y + bounds.height / 2
          );
          if (tileLeft && tileLeft.type !== 0) {
            direction = 1;
            grinder.vel.x = 50;
          }
        }
      }

      // Fallback - don't fall through the world
      if (grinder.pos.y > 240) {
        grinder.pos.y = 208;
        grinder.vel.y = 0;
      }
    }
  };

  return grinder;
}
