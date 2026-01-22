import { Entity } from '../engine/Entity';
import type { Level } from '../levels/Level';
import type { Killable as KillableTrait } from '../traits/Killable';

// Piranha Plant - emerges from pipes periodically
export function createPiranhaPlant(pipeX: number, pipeY: number): Entity {
  const plant = new Entity();

  // Size of the plant
  plant.size = { x: 16, y: 24 };

  // Center plant in pipe (pipe is 32px wide)
  plant.pos.x = pipeX + 8;

  // Y positions for animation
  const fullyHiddenY = pipeY + 8;   // Just below pipe opening
  const fullyVisibleY = pipeY - 24; // Fully emerged above pipe

  // Start hidden
  plant.pos.y = fullyHiddenY;

  // State machine
  type PlantState = 'waiting' | 'rising' | 'showing' | 'lowering';
  let state: PlantState = 'waiting';
  let stateTimer = 0;
  let dead = false;

  // Timing constants
  const WAIT_TIME = 2.0;      // Time hidden in pipe
  const SHOW_TIME = 2.0;      // Time visible above pipe
  const MOVE_SPEED = 50;      // Pixels per second

  // Animation
  let mouthOpen = false;
  let animTimer = 0;

  // Update function
  plant.update = (delta: number, level?: Level) => {
    if (dead) return;

    stateTimer += delta;
    animTimer += delta;

    // Animate mouth every 0.2 seconds
    if (animTimer > 0.2) {
      animTimer = 0;
      mouthOpen = !mouthOpen;
    }

    // Check if player is too close to pipe (don't emerge if so)
    let playerTooClose = false;
    if (level && state === 'waiting') {
      for (const entity of level.entities) {
        if (entity.hasTrait('stomper')) {
          const playerCenterX = entity.pos.x + entity.size.x / 2;
          const pipeCenterX = pipeX + 16;
          const dist = Math.abs(playerCenterX - pipeCenterX);
          if (dist < 32) {
            playerTooClose = true;
            break;
          }
        }
      }
    }

    // State machine
    switch (state) {
      case 'waiting':
        // Stay hidden
        plant.pos.y = fullyHiddenY;
        // After wait time, start rising (if player not too close)
        if (stateTimer >= WAIT_TIME && !playerTooClose) {
          state = 'rising';
          stateTimer = 0;
        }
        break;

      case 'rising':
        // Move upward
        plant.pos.y -= MOVE_SPEED * delta;
        // Check if fully emerged
        if (plant.pos.y <= fullyVisibleY) {
          plant.pos.y = fullyVisibleY;
          state = 'showing';
          stateTimer = 0;
        }
        break;

      case 'showing':
        // Stay visible
        plant.pos.y = fullyVisibleY;
        // After show time, start lowering
        if (stateTimer >= SHOW_TIME) {
          state = 'lowering';
          stateTimer = 0;
        }
        break;

      case 'lowering':
        // Move downward
        plant.pos.y += MOVE_SPEED * delta;
        // Check if fully hidden
        if (plant.pos.y >= fullyHiddenY) {
          plant.pos.y = fullyHiddenY;
          state = 'waiting';
          stateTimer = 0;
        }
        break;
    }

    // Collision with player (only when visible above pipe)
    if (level && plant.pos.y < pipeY) {
      for (const entity of level.entities) {
        if (entity.hasTrait('stomper')) {
          const playerBounds = entity.getBounds();
          const plantLeft = plant.pos.x + 2;
          const plantRight = plant.pos.x + 14;
          const plantTop = plant.pos.y;
          const plantBottom = Math.min(plant.pos.y + 24, pipeY);

          // Check collision
          if (playerBounds.x + playerBounds.width > plantLeft &&
              playerBounds.x < plantRight &&
              playerBounds.y + playerBounds.height > plantTop &&
              playerBounds.y < plantBottom) {

            // Check for star power - kills plant
            const powerUp = entity.getTrait<any>('powerup');
            if (powerUp && powerUp.hasStar) {
              dead = true;
              return;
            }

            // Player hit the plant - take damage
            if (powerUp && powerUp.isInvincible) {
              // Player is invincible, ignore
            } else if (powerUp && powerUp.isBig) {
              // Player is big, shrink them
              powerUp.powerDown(entity);
            } else {
              // Player dies
              const killable = entity.getTrait<KillableTrait>('killable');
              if (killable && !killable.isDead) {
                killable.kill();
              }
            }
          }
        }
      }
    }
  };

  // Draw function
  plant.draw = (ctx: CanvasRenderingContext2D) => {
    if (dead) return;

    // Only draw if any part is visible above pipe
    if (plant.pos.y >= pipeY) return;

    const x = Math.floor(plant.pos.x);
    const y = Math.floor(plant.pos.y);

    ctx.save();

    // Clip to only show part above pipe opening
    ctx.beginPath();
    ctx.rect(x - 4, 0, 24, pipeY);
    ctx.clip();

    // Draw stem (green)
    ctx.fillStyle = '#00a800';
    ctx.fillRect(x + 5, y + 12, 6, 16);
    ctx.fillStyle = '#005800';
    ctx.fillRect(x + 5, y + 12, 2, 16);

    // Draw head (red with spots)
    ctx.fillStyle = '#d82800';
    ctx.fillRect(x + 1, y + 2, 14, 10);
    ctx.fillRect(x, y + 4, 16, 6);

    // Darker edges
    ctx.fillStyle = '#a80000';
    ctx.fillRect(x, y + 4, 2, 6);
    ctx.fillRect(x + 14, y + 4, 2, 6);

    // White spots
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 3, y + 3, 3, 3);
    ctx.fillRect(x + 10, y + 3, 3, 3);

    // Lips (pink/light red)
    ctx.fillStyle = '#fc7460';
    ctx.fillRect(x + 2, y + 2, 12, 2);

    // Mouth with teeth animation
    if (mouthOpen) {
      // Open mouth
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 2, y + 8, 12, 4);
      // Teeth
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 3, y + 8, 2, 2);
      ctx.fillRect(x + 7, y + 8, 2, 2);
      ctx.fillRect(x + 11, y + 8, 2, 2);
      ctx.fillRect(x + 5, y + 10, 2, 2);
      ctx.fillRect(x + 9, y + 10, 2, 2);
    } else {
      // Closed mouth
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 3, y + 9, 10, 2);
      // Teeth hints
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 4, y + 9, 2, 1);
      ctx.fillRect(x + 7, y + 9, 2, 1);
      ctx.fillRect(x + 10, y + 9, 2, 1);
    }

    ctx.restore();
  };

  return plant;
}
