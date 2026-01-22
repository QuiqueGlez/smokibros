import { Entity } from '../engine/Entity';
import { Physics } from '../traits/Physics';
import { Solid } from '../traits/Solid';
import { PendulumWalk } from '../traits/PendulumWalk';
import { Killable } from '../traits/Killable';
import { Direction } from '../types';

// Buzzkill - Goomba equivalent
export function createBuzzkill(): Entity {
  const buzzkill = new Entity();

  buzzkill.size = { x: 16, y: 16 };

  // Add traits - ORDER MATTERS!
  // 1. PendulumWalk sets velocity direction
  // 2. Physics applies velocity to position
  // 3. Solid checks/corrects collisions
  // 4. Killable handles death
  const pendulumWalk = new PendulumWalk();
  const physics = new Physics();
  const solid = new Solid();
  const killable = new Killable();

  pendulumWalk.speed = 30;

  buzzkill.addTrait(pendulumWalk);
  buzzkill.addTrait(physics);
  buzzkill.addTrait(solid);
  buzzkill.addTrait(killable);

  // Animation
  let animFrame = 0;
  let animTimer = 0;

  buzzkill.draw = (context: CanvasRenderingContext2D) => {
    const x = Math.floor(buzzkill.pos.x);
    const y = Math.floor(buzzkill.pos.y);

    if (killable.isDead) {
      // Squashed
      drawSquashed(context, x, y);
    } else {
      // Animate walking
      animTimer += 1 / 60;
      if (animTimer >= 0.15) {
        animTimer = 0;
        animFrame = (animFrame + 1) % 2;
      }
      drawBuzzkill(context, x, y, pendulumWalk.direction, animFrame);
    }
  };

  return buzzkill;
}

function drawSquashed(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // Flat squashed security guard
  ctx.fillStyle = '#1a1a4e';
  ctx.fillRect(x, y + 12, 16, 4);
  // Squashed sunglasses
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 4, y + 13, 3, 2);
  ctx.fillRect(x + 9, y + 13, 3, 2);
  // Fallen badge
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(x + 7, y + 14, 2, 1);
}

function drawBuzzkill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: Direction,
  frame: number
): void {
  ctx.save();

  // Flip based on direction
  if (direction === Direction.RIGHT) {
    ctx.translate(x + 16, y);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(x, y);
  }

  // Security guard / Mall cop style "Buzzkill"

  // Security cap (dark blue)
  ctx.fillStyle = '#1a1a4e';
  ctx.fillRect(2, 0, 12, 4);
  ctx.fillRect(0, 3, 16, 2);
  // Cap badge
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(6, 1, 4, 2);

  // Face
  ctx.fillStyle = '#d4a574';
  ctx.fillRect(3, 4, 10, 6);

  // Sunglasses (always wearing shades)
  ctx.fillStyle = '#000';
  ctx.fillRect(3, 5, 4, 3);
  ctx.fillRect(9, 5, 4, 3);
  // Glasses shine
  ctx.fillStyle = '#444';
  ctx.fillRect(4, 5, 1, 1);
  ctx.fillRect(10, 5, 1, 1);
  // Bridge
  ctx.fillRect(7, 6, 2, 1);

  // Frown
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(6, 8, 4, 1);

  // Security uniform (dark blue)
  ctx.fillStyle = '#1a1a4e';
  ctx.fillRect(2, 10, 12, 4);

  // Badge on chest
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(6, 11, 4, 2);

  // Legs - animated
  ctx.fillStyle = '#1a1a4e';
  if (frame === 0) {
    ctx.fillRect(3, 14, 4, 2);
    ctx.fillRect(9, 14, 4, 2);
  } else {
    ctx.fillRect(2, 14, 4, 2);
    ctx.fillRect(10, 13, 4, 3);
  }

  // Black shoes
  ctx.fillStyle = '#000';
  ctx.fillRect(3, 15, 4, 1);
  ctx.fillRect(9, 15, 4, 1);

  ctx.restore();
}
