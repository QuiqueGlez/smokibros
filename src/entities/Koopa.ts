import { Entity } from '../engine/Entity';
import { Physics } from '../traits/Physics';
import { Solid } from '../traits/Solid';
import { PendulumWalk } from '../traits/PendulumWalk';
import { Killable } from '../traits/Killable';
import { Direction, COLORS } from '../types';
import { audioManager } from '../audio/AudioManager';
import type { Level } from '../levels/Level';

// Koopa states
enum KoopaState {
  WALKING,
  SHELL_IDLE,
  SHELL_MOVING
}

export function createKoopa(): Entity {
  const koopa = new Entity();

  koopa.size = { x: 16, y: 24 };
  koopa.offset = { x: 0, y: 0 };

  // Traits
  const physics = new Physics();
  const solid = new Solid();
  const pendulumWalk = new PendulumWalk();
  const killable = new Killable();

  pendulumWalk.speed = 30;

  // State management
  let state = KoopaState.WALKING;
  let shellDirection = 0;
  const shellSpeed = 200;

  // Animation
  let animFrame = 0;
  let animTimer = 0;

  // Override killable behavior - Koopa doesn't die immediately
  killable.onDeath = () => {
    // Don't actually die, just go into shell mode
  };

  koopa.addTrait(pendulumWalk);
  koopa.addTrait(physics);
  koopa.addTrait(solid);
  koopa.addTrait(killable);

  // Custom stomp handling
  const handleStomp = (stomper: Entity): boolean => {
    if (state === KoopaState.WALKING) {
      // Enter shell mode
      state = KoopaState.SHELL_IDLE;
      koopa.size = { x: 16, y: 14 };
      koopa.pos.y += 10; // Adjust position for smaller hitbox
      pendulumWalk.enabled = false;
      koopa.vel.x = 0;
      audioManager.play('stomp');
      return true;
    } else if (state === KoopaState.SHELL_IDLE) {
      // Kick the shell
      state = KoopaState.SHELL_MOVING;
      const kickDirection = stomper.pos.x < koopa.pos.x ? 1 : -1;
      shellDirection = kickDirection;
      koopa.vel.x = shellSpeed * kickDirection;
      audioManager.play('stomp');
      return true;
    } else if (state === KoopaState.SHELL_MOVING) {
      // Stop the shell
      state = KoopaState.SHELL_IDLE;
      koopa.vel.x = 0;
      shellDirection = 0;
      audioManager.play('stomp');
      return true;
    }
    return false;
  };

  // Override entity collision to handle shell hitting enemies
  const originalOnEntityCollide = koopa.onEntityCollide.bind(koopa);
  koopa.onEntityCollide = (other: Entity) => {
    originalOnEntityCollide(other);

    // Shell kills enemies it hits
    if (state === KoopaState.SHELL_MOVING) {
      const otherKillable = other.getTrait<Killable>('killable');
      if (otherKillable && !otherKillable.isDead && other !== koopa) {
        // Check if other entity is an enemy (has pendulumWalk trait)
        if (other.hasTrait('pendulumWalk')) {
          otherKillable.kill();
          audioManager.play('stomp');
        }
      }
    }

    // Handle being stomped
    if (other.hasTrait('stomper')) {
      const otherBounds = other.getBounds();
      const koopaBounds = koopa.getBounds();

      // Check if being stomped from above
      if (other.vel.y > 0 && otherBounds.y + otherBounds.height <= koopaBounds.y + 8) {
        if (handleStomp(other)) {
          // Bounce the stomper
          other.vel.y = -250;
        }
      } else if (state === KoopaState.SHELL_IDLE) {
        // Player walked into idle shell - kick it
        const kickDirection = other.pos.x < koopa.pos.x ? 1 : -1;
        state = KoopaState.SHELL_MOVING;
        shellDirection = kickDirection;
        koopa.vel.x = shellSpeed * kickDirection;
        audioManager.play('stomp');
      } else if (state === KoopaState.SHELL_MOVING) {
        // Moving shell hit player - player takes damage (handled by Stomper trait)
      }
    }
  };

  // Wall collision - reverse shell direction
  koopa.onTileCollide = (side: 'top' | 'bottom' | 'left' | 'right') => {
    if (state === KoopaState.SHELL_MOVING) {
      if (side === 'left' || side === 'right') {
        shellDirection = -shellDirection;
        koopa.vel.x = shellSpeed * shellDirection;
        audioManager.play('bump');
      }
    }
  };

  // Draw function
  koopa.draw = (ctx: CanvasRenderingContext2D) => {
    const x = Math.floor(koopa.pos.x);
    const y = Math.floor(koopa.pos.y);

    ctx.save();

    if (state === KoopaState.WALKING) {
      // Draw walking Koopa
      const flip = pendulumWalk.direction === Direction.LEFT;

      if (flip) {
        ctx.translate(x + koopa.size.x, y);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(x, y);
      }

      drawWalkingKoopa(ctx, animFrame);
    } else {
      // Draw shell
      ctx.translate(x, y);
      drawShell(ctx, state === KoopaState.SHELL_MOVING);
    }

    ctx.restore();
  };

  // Update animation
  const baseUpdate = koopa.update.bind(koopa);
  koopa.update = (delta: number, level?: Level) => {
    baseUpdate(delta, level);

    // Walking animation
    if (state === KoopaState.WALKING && Math.abs(koopa.vel.x) > 5) {
      animTimer += delta;
      if (animTimer > 0.15) {
        animTimer = 0;
        animFrame = (animFrame + 1) % 2;
      }
    }

    // Shell movement
    if (state === KoopaState.SHELL_MOVING) {
      koopa.vel.x = shellSpeed * shellDirection;
    }
  };

  // Expose stomp handler for Stomper trait to use
  (koopa as any).handleStomp = handleStomp;
  (koopa as any).getState = () => state;

  return koopa;
}

function drawWalkingKoopa(ctx: CanvasRenderingContext2D, frame: number): void {
  // Shell (back)
  ctx.fillStyle = COLORS.SMOKY_GREEN;
  ctx.fillRect(2, 8, 12, 14);
  ctx.fillStyle = '#1a4d1a';
  ctx.fillRect(4, 10, 8, 10);

  // Head
  ctx.fillStyle = '#90EE90';
  ctx.fillRect(4, 0, 8, 10);

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(8, 2, 4, 4);
  ctx.fillStyle = '#000';
  ctx.fillRect(10, 3, 2, 2);

  // Beak
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(12, 5, 3, 3);

  // Legs
  ctx.fillStyle = '#90EE90';
  if (frame === 0) {
    ctx.fillRect(2, 22, 4, 2);
    ctx.fillRect(10, 20, 4, 4);
  } else {
    ctx.fillRect(2, 20, 4, 4);
    ctx.fillRect(10, 22, 4, 2);
  }

  // Feet
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(0, 22, 4, 2);
  ctx.fillRect(12, 22, 4, 2);
}

function drawShell(ctx: CanvasRenderingContext2D, spinning: boolean): void {
  // Shell body
  ctx.fillStyle = COLORS.SMOKY_GREEN;
  ctx.fillRect(0, 0, 16, 14);

  // Shell pattern
  ctx.fillStyle = '#1a4d1a';
  ctx.fillRect(2, 2, 12, 10);

  // Shell ridges
  ctx.fillStyle = COLORS.SMOKY_GREEN;
  ctx.fillRect(4, 0, 2, 14);
  ctx.fillRect(10, 0, 2, 14);

  // Shell highlights
  ctx.fillStyle = '#7EC87E';
  ctx.fillRect(1, 1, 2, 2);
  ctx.fillRect(13, 1, 2, 2);

  // Spinning effect
  if (spinning) {
    ctx.fillStyle = '#fff';
    const shimmer = Math.floor(Date.now() / 50) % 4;
    ctx.fillRect(2 + shimmer * 3, 6, 2, 2);
  }
}
