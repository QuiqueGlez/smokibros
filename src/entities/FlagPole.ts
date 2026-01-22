import { Entity } from '../engine/Entity';
import type { Level } from '../levels/Level';
import { COLORS } from '../types';
import { audioManager } from '../audio/AudioManager';

// Flag pole at end of level
export function createFlagPole(x: number, groundY: number): Entity {
  const flagPole = new Entity();

  const poleHeight = 144; // 9 tiles tall
  flagPole.pos.x = x;
  flagPole.pos.y = groundY - poleHeight;
  flagPole.size = { x: 16, y: poleHeight };

  // Flag state
  let flagY = 0; // Flag position on pole (0 = top)
  let flagDropping = false;
  let playerSliding = false;
  let playerRef: Entity | null = null;
  let victoryCallback: (() => void) | null = null;

  // Score based on flag height when touched
  let scoreAwarded = false;

  flagPole.draw = (ctx: CanvasRenderingContext2D) => {
    const px = Math.floor(flagPole.pos.x);
    const py = Math.floor(flagPole.pos.y);

    // Pole
    ctx.fillStyle = '#00a800';
    ctx.fillRect(px + 7, py, 2, poleHeight);

    // Pole ball on top
    ctx.fillStyle = '#00a800';
    ctx.beginPath();
    ctx.arc(px + 8, py, 4, 0, Math.PI * 2);
    ctx.fill();

    // Flag
    const flagPosY = py + flagY;
    ctx.fillStyle = COLORS.SMOKY_GREEN;
    ctx.fillRect(px + 9, flagPosY + 4, 12, 10);

    // Flag design - Smoking Paper leaf
    ctx.fillStyle = '#7EC87E';
    ctx.fillRect(px + 12, flagPosY + 6, 6, 6);

    // Base block
    ctx.fillStyle = '#00a800';
    ctx.fillRect(px, py + poleHeight - 16, 16, 16);
    ctx.fillStyle = '#005800';
    ctx.fillRect(px, py + poleHeight - 16, 4, 16);
  };

  const baseUpdate = flagPole.update.bind(flagPole);
  flagPole.update = (delta: number, level?: Level) => {
    baseUpdate(delta, level);

    // Check for player collision
    if (level && !playerSliding) {
      for (const entity of level.entities) {
        if (entity.hasTrait('stomper')) {
          const playerBounds = entity.getBounds();
          const poleBounds = {
            x: flagPole.pos.x + 4,
            y: flagPole.pos.y,
            width: 8,
            height: poleHeight
          };

          // Check if player touches pole
          if (
            playerBounds.x + playerBounds.width > poleBounds.x &&
            playerBounds.x < poleBounds.x + poleBounds.width &&
            playerBounds.y + playerBounds.height > poleBounds.y &&
            playerBounds.y < poleBounds.y + poleBounds.height
          ) {
            // Start flag slide!
            playerSliding = true;
            flagDropping = true;
            playerRef = entity;
            audioManager.play('flagpole');

            // Calculate score based on height
            const touchHeight = playerBounds.y - flagPole.pos.y;
            if (!scoreAwarded) {
              scoreAwarded = true;
              // Higher touch = more points
              if (touchHeight < 20) {
                flagY = 0;
              } else {
                flagY = Math.min(touchHeight, poleHeight - 40);
              }
            }

            // Stop player movement
            entity.vel.x = 0;
            entity.vel.y = 0;

            // Disable player controls
            const go = entity.getTrait<any>('go');
            const jump = entity.getTrait<any>('jump');
            if (go) go.direction = 0;
            if (jump) jump.cancel();
          }
        }
      }
    }

    // Animate flag dropping and player sliding
    if (flagDropping) {
      // Drop flag
      if (flagY < poleHeight - 40) {
        flagY += 100 * delta;
      }

      // Slide player down
      if (playerRef) {
        const targetY = flagPole.pos.y + poleHeight - playerRef.size.y - 16;
        if (playerRef.pos.y < targetY) {
          playerRef.pos.y += 100 * delta;
          playerRef.pos.x = flagPole.pos.x - playerRef.size.x + 4;
        } else {
          // Player reached bottom
          playerRef.pos.y = targetY;
          flagDropping = false;

          // Walk to castle
          setTimeout(() => {
            if (playerRef) {
              const go = playerRef.getTrait<any>('go');
              if (go) {
                go.direction = 1;
                go.running = false;
              }
            }

            // Trigger victory after walk
            setTimeout(() => {
              if (victoryCallback) {
                victoryCallback();
              }
            }, 1500);
          }, 500);
        }
      }
    }
  };

  // Method to set victory callback
  (flagPole as any).onVictory = (callback: () => void) => {
    victoryCallback = callback;
  };

  return flagPole;
}
