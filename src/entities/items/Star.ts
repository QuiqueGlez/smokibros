import { Entity } from '../../engine/Entity';
import type { Level } from '../../levels/Level';
import { COLORS } from '../../types';
import type { PowerUp } from '../../traits/PowerUp';
import type { ChillMeter } from '../../traits/ChillMeter';
import { audioManager } from '../../audio/AudioManager';

// Star collectible
export function createStar(x: number, y: number): Entity {
  const star = new Entity();

  star.pos.x = x;
  star.pos.y = y;
  star.size = { x: 16, y: 16 };

  // Bouncing behavior
  let bouncing = true;
  let bounceVel = -200;
  let collected = false;

  // Animation
  let animTimer = 0;
  let rotation = 0;

  star.draw = (ctx: CanvasRenderingContext2D) => {
    if (collected) return;

    const px = Math.floor(star.pos.x);
    const py = Math.floor(star.pos.y);

    ctx.save();
    ctx.translate(px + 8, py + 8);
    ctx.rotate(rotation);

    // Draw 5-pointed star
    ctx.fillStyle = COLORS.GOLD;
    ctx.beginPath();

    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;

      const outerX = Math.cos(outerAngle) * 8;
      const outerY = Math.sin(outerAngle) * 8;
      const innerX = Math.cos(innerAngle) * 3;
      const innerY = Math.sin(innerAngle) * 3;

      if (i === 0) {
        ctx.moveTo(outerX, outerY);
      } else {
        ctx.lineTo(outerX, outerY);
      }
      ctx.lineTo(innerX, innerY);
    }

    ctx.closePath();
    ctx.fill();

    // Shine in center
    ctx.fillStyle = '#FFE55C';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(-3, -1, 2, 2);
    ctx.fillRect(1, -1, 2, 2);

    ctx.restore();
  };

  const baseUpdate = star.update.bind(star);
  star.update = (delta: number, level?: Level) => {
    if (collected) {
      if (level) level.removeEntity(star);
      return;
    }

    baseUpdate(delta, level);

    // Animate rotation
    animTimer += delta;
    rotation += 2 * delta;

    // Bouncing movement
    if (bouncing) {
      star.vel.y += 800 * delta; // Gravity
      star.pos.y += star.vel.y * delta;
      star.pos.x += star.vel.x * delta;

      // Bounce on ground
      if (level) {
        const bounds = star.getBounds();
        const tileBelow = level.tileResolver.getByPixel(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height + 1
        );

        if (tileBelow && tileBelow.type !== 0) {
          star.pos.y = tileBelow.y * 16 - star.size.y;
          star.vel.y = bounceVel;
        }

        // Wall collision
        if (star.vel.x > 0) {
          const tileRight = level.tileResolver.getByPixel(
            bounds.x + bounds.width,
            bounds.y + bounds.height / 2
          );
          if (tileRight && tileRight.type !== 0) {
            star.vel.x = -star.vel.x;
          }
        } else if (star.vel.x < 0) {
          const tileLeft = level.tileResolver.getByPixel(
            bounds.x,
            bounds.y + bounds.height / 2
          );
          if (tileLeft && tileLeft.type !== 0) {
            star.vel.x = -star.vel.x;
          }
        }
      }

      // Check player collision
      if (level) {
        for (const entity of level.entities) {
          if (entity.hasTrait('stomper') && !collected) {
            const playerBounds = entity.getBounds();
            const starBounds = star.getBounds();

            if (
              playerBounds.x < starBounds.x + starBounds.width &&
              playerBounds.x + playerBounds.width > starBounds.x &&
              playerBounds.y < starBounds.y + starBounds.height &&
              playerBounds.y + playerBounds.height > starBounds.y
            ) {
              // Collected!
              collected = true;
              audioManager.play('powerup');

              // Activate star power on player
              const powerUp = entity.getTrait<PowerUp>('powerup');
              if (powerUp) {
                powerUp.activateStar();
              }

              // Add massive chill for collecting star!
              const chillMeter = entity.getTrait<ChillMeter>('chillmeter');
              if (chillMeter) {
                chillMeter.collectStar();
              }
            }
          }
        }
      }
    }
  };

  // Start moving
  star.vel.x = 80;
  star.vel.y = bounceVel;

  return star;
}
