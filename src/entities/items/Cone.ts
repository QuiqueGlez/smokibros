import { Entity } from '../../engine/Entity';
import { Physics } from '../../traits/Physics';
import { Solid } from '../../traits/Solid';
import { PendulumWalk } from '../../traits/PendulumWalk';
import { Collectible } from './Filter';
import { COLORS } from '../../types';

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

    // Cone shape (ice cream cone / joint cone)
    // Cone part (bottom triangle-ish)
    context.fillStyle = '#D2691E'; // Chocolate brown
    context.beginPath();
    context.moveTo(8, 16);
    context.lineTo(2, 6);
    context.lineTo(14, 6);
    context.closePath();
    context.fill();

    // Waffle pattern
    context.strokeStyle = '#8B4513';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(5, 8);
    context.lineTo(11, 8);
    context.moveTo(6, 10);
    context.lineTo(10, 10);
    context.moveTo(7, 12);
    context.lineTo(9, 12);
    context.stroke();

    // Green top (the good stuff)
    context.fillStyle = COLORS.SMOKY_GREEN;
    context.beginPath();
    context.arc(8, 5, 6, 0, Math.PI * 2);
    context.fill();

    // Highlight
    context.fillStyle = '#4a8a47';
    context.beginPath();
    context.arc(6, 3, 2, 0, Math.PI * 2);
    context.fill();

    // "1UP" indicator
    context.fillStyle = '#fff';
    context.font = '6px monospace';
    context.fillText('1', 5, 6);

    context.restore();
  };

  return cone;
}
