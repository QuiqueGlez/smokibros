import { Entity } from '../../engine/Entity';
import { Physics } from '../../traits/Physics';
import { Solid } from '../../traits/Solid';
import { PendulumWalk } from '../../traits/PendulumWalk';
import { Collectible } from './Filter';

// Cone - 1-Up Mushroom equivalent
// Gives the player an extra life
export function createCone(): Entity {
  const cone = new Entity();

  cone.size = { x: 16, y: 16 };

  // Add physics so it moves like a mushroom
  const physics = new Physics();
  const solid = new Solid();
  const pendulumWalk = new PendulumWalk();
  const collectible = new Collectible();

  pendulumWalk.speed = 40;

  cone.addTrait(physics);
  cone.addTrait(solid);
  cone.addTrait(pendulumWalk);
  cone.addTrait(collectible);

  cone.draw = (context: CanvasRenderingContext2D) => {
    context.save();
    context.translate(cone.pos.x, cone.pos.y);

    // Filter pack box (like Filtros Biodegradables)
    // Box body (green/white diamond pattern style)
    context.fillStyle = '#e8e8e0';
    context.fillRect(1, 1, 14, 14);

    // Green diamond pattern (like the product packaging)
    context.fillStyle = '#00a800';
    context.fillRect(2, 2, 12, 3);
    context.fillRect(2, 11, 12, 3);

    // Center label area
    context.fillStyle = '#fff';
    context.fillRect(2, 5, 12, 6);

    // "Smoking" brand red stripe
    context.fillStyle = '#C41E3A';
    context.fillRect(3, 6, 10, 3);

    // "1UP" text
    context.fillStyle = '#fff';
    context.font = '5px monospace';
    context.fillText('1UP', 4, 9);

    // Box border
    context.fillStyle = '#008000';
    context.fillRect(0, 0, 16, 1);
    context.fillRect(0, 15, 16, 1);
    context.fillRect(0, 0, 1, 16);
    context.fillRect(15, 0, 1, 16);

    context.restore();
  };

  return cone;
}
