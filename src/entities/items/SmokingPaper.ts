import { Entity } from '../../engine/Entity';
import type { Level } from '../../levels/Level';
import type { PowerUp } from '../../traits/PowerUp';
import type { ChillMeter } from '../../traits/ChillMeter';
import { audioManager } from '../../audio/AudioManager';

// Paper types matching Smoking Paper products
export type PaperType = 'green' | 'gold' | 'brown';

// Smoking Paper colors
const PAPER_COLORS = {
  green: {
    main: '#2D5A27',    // Smoking Green
    light: '#7EC87E',
    dark: '#1a3a17',
    glow: '#00ff00'
  },
  gold: {
    main: '#C9A227',    // Smoking Gold
    light: '#FFD700',
    dark: '#8B7500',
    glow: '#ffff00'
  },
  brown: {
    main: '#8B4513',    // Smoking Brown (unbleached)
    light: '#CD853F',
    dark: '#5D2906',
    glow: '#ff8800'
  }
};

// Create a Smoking Paper power-up
export function createSmokingPaper(x: number, y: number, type: PaperType): Entity {
  const paper = new Entity();

  paper.pos.x = x;
  paper.pos.y = y;
  paper.size = { x: 16, y: 16 };

  const colors = PAPER_COLORS[type];

  // State for emerging from block
  let emerging = true;
  let emergeProgress = 0;
  const emergeSpeed = 30;

  let collected = false;
  let direction = 1;

  // Animation
  let animTimer = 0;
  let floatOffset = 0;
  let glowPulse = 0;

  paper.draw = (ctx: CanvasRenderingContext2D) => {
    if (collected) return;

    const px = Math.floor(paper.pos.x);
    const py = Math.floor(paper.pos.y + floatOffset);

    ctx.save();

    // Clip if still emerging
    if (emerging) {
      ctx.beginPath();
      ctx.rect(px, py + 16 - emergeProgress, 16, emergeProgress);
      ctx.clip();
    }

    // Glow effect for gold paper
    if (type === 'gold') {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 4 + Math.sin(glowPulse) * 2;
    }

    // Paper pack body
    ctx.fillStyle = colors.main;
    ctx.fillRect(px + 2, py + 2, 12, 12);

    // Paper edges (white papers sticking out)
    ctx.fillStyle = '#fff';
    ctx.fillRect(px + 3, py, 10, 3);
    ctx.fillRect(px + 4, py - 1, 8, 2);

    // Smoking logo area (simplified)
    ctx.fillStyle = colors.light;
    ctx.fillRect(px + 4, py + 5, 8, 4);

    // "S" logo
    ctx.fillStyle = colors.dark;
    ctx.fillRect(px + 5, py + 5, 2, 1);
    ctx.fillRect(px + 5, py + 6, 1, 1);
    ctx.fillRect(px + 5, py + 7, 2, 1);
    ctx.fillRect(px + 6, py + 8, 1, 1);
    ctx.fillRect(px + 5, py + 8, 2, 1);

    // Border
    ctx.fillStyle = colors.dark;
    ctx.fillRect(px + 1, py + 1, 14, 1);
    ctx.fillRect(px + 1, py + 1, 1, 14);
    ctx.fillRect(px + 1, py + 14, 14, 1);
    ctx.fillRect(px + 14, py + 1, 1, 14);

    // Shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(px + 3, py + 3, 2, 6);

    ctx.restore();
  };

  const baseUpdate = paper.update.bind(paper);
  paper.update = (delta: number, level?: Level) => {
    if (collected) {
      if (level) level.removeEntity(paper);
      return;
    }

    baseUpdate(delta, level);

    // Animation
    animTimer += delta;
    floatOffset = Math.sin(animTimer * 3) * 2;
    glowPulse += delta * 4;

    if (emerging) {
      emergeProgress += emergeSpeed * delta;
      if (emergeProgress >= 16) {
        emerging = false;
        paper.vel.x = 50 * direction;
      }
    } else {
      // Apply gravity
      paper.vel.y += 1500 * delta;
      if (paper.vel.y > 400) paper.vel.y = 400;

      // Move
      paper.pos.x += paper.vel.x * delta;
      paper.pos.y += paper.vel.y * delta;

      // Tile collision
      if (level) {
        const bounds = paper.getBounds();

        // Ground collision
        const tileBelow = level.tileResolver.getByPixel(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height + 1
        );

        if (tileBelow && tileBelow.type !== 0) {
          paper.pos.y = tileBelow.y * 16 - paper.size.y;
          paper.vel.y = 0;
        }

        // Wall collision
        if (paper.vel.x > 0) {
          const tileRight = level.tileResolver.getByPixel(
            bounds.x + bounds.width,
            bounds.y + bounds.height / 2
          );
          if (tileRight && tileRight.type !== 0) {
            direction = -1;
            paper.vel.x = -50;
          }
        } else if (paper.vel.x < 0) {
          const tileLeft = level.tileResolver.getByPixel(
            bounds.x,
            bounds.y + bounds.height / 2
          );
          if (tileLeft && tileLeft.type !== 0) {
            direction = 1;
            paper.vel.x = 50;
          }
        }
      }

      // Don't fall through world
      if (paper.pos.y > 240) {
        paper.pos.y = 208;
        paper.vel.y = 0;
      }

      // Check player collision
      if (level) {
        for (const entity of level.entities) {
          if (entity.hasTrait('stomper') && !collected) {
            const playerBounds = entity.getBounds();
            const paperBounds = paper.getBounds();

            if (
              playerBounds.x < paperBounds.x + paperBounds.width &&
              playerBounds.x + playerBounds.width > paperBounds.x &&
              playerBounds.y < paperBounds.y + paperBounds.height &&
              playerBounds.y + playerBounds.height > paperBounds.y
            ) {
              collected = true;
              audioManager.play('powerup');
              applyPaperEffect(entity, type);
            }
          }
        }
      }
    }
  };

  return paper;
}

// Apply the effect based on paper type
function applyPaperEffect(player: Entity, type: PaperType): void {
  const powerUp = player.getTrait<PowerUp>('powerup');
  const chillMeter = player.getTrait<ChillMeter>('chillmeter');

  switch (type) {
    case 'green':
      // Green paper = grow bigger
      if (powerUp) {
        powerUp.powerUp(player);
      }
      if (chillMeter) {
        chillMeter.collectPowerUp();
      }
      break;

    case 'gold':
      // Gold paper = star power / invincibility
      if (powerUp) {
        powerUp.activateStar();
      }
      if (chillMeter) {
        chillMeter.collectStar();
      }
      break;

    case 'brown':
      // Brown paper = instant max chill (speed boost)
      if (chillMeter) {
        chillMeter.addChill(100); // Max chill!
      }
      break;
  }
}

// Convenience functions for creating specific paper types
export function createGreenPaper(x: number, y: number): Entity {
  return createSmokingPaper(x, y, 'green');
}

export function createGoldPaper(x: number, y: number): Entity {
  return createSmokingPaper(x, y, 'gold');
}

export function createBrownPaper(x: number, y: number): Entity {
  return createSmokingPaper(x, y, 'brown');
}
