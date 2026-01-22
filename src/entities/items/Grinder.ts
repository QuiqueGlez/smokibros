import { Entity } from '../../engine/Entity';
import { Physics } from '../../traits/Physics';
import { Solid } from '../../traits/Solid';
import { PendulumWalk } from '../../traits/PendulumWalk';
import { Collectible } from './Filter';
import { COLORS } from '../../types';

// Grinder - Mushroom equivalent
// Makes the player "Colocado" (high) = bigger
export function createGrinder(): Entity {
  const grinder = new Entity();

  grinder.size = { x: 16, y: 16 };

  // Add physics so it falls and moves
  const physics = new Physics();
  const solid = new Solid();
  const pendulumWalk = new PendulumWalk();
  const collectible = new Collectible();

  pendulumWalk.speed = 40;

  grinder.addTrait(physics);
  grinder.addTrait(solid);
  grinder.addTrait(pendulumWalk);
  grinder.addTrait(collectible);

  grinder.draw = (context: CanvasRenderingContext2D) => {
    context.save();
    context.translate(grinder.pos.x, grinder.pos.y);

    // Grinder body - green herb grinder
    context.fillStyle = COLORS.SMOKY_GREEN;
    context.fillRect(0, 4, 16, 12);

    // Top cap
    context.fillStyle = '#1a3a17';
    context.fillRect(0, 0, 16, 6);

    // Ridges on sides
    context.fillStyle = '#1a3a17';
    for (let i = 0; i < 3; i++) {
      context.fillRect(0, 6 + i * 4, 2, 2);
      context.fillRect(14, 6 + i * 4, 2, 2);
    }

    // Shine
    context.fillStyle = '#4a8a47';
    context.fillRect(4, 2, 4, 2);

    context.restore();
  };

  return grinder;
}
