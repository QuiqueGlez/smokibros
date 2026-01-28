import { Entity } from '../../engine/Entity';
import { Physics } from '../../traits/Physics';
import { Solid } from '../../traits/Solid';
import { PendulumWalk } from '../../traits/PendulumWalk';
import { Collectible } from './Filter';
import { productImages } from '../../graphics/ProductImages';

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
    const px = Math.floor(grinder.pos.x);
    const py = Math.floor(grinder.pos.y);

    const img = productImages.get('grinder');
    if (img) {
      context.drawImage(img, px, py, 16, 16);
    } else {
      // Fallback: procedural draw
      context.save();
      context.translate(px, py);

      context.fillStyle = '#5a8a8a';
      context.fillRect(1, 6, 14, 10);
      context.fillStyle = '#7ab0b0';
      context.fillRect(3, 7, 4, 8);
      context.fillStyle = '#4a7070';
      for (let i = 0; i < 3; i++) {
        context.fillRect(0, 7 + i * 3, 1, 2);
        context.fillRect(15, 7 + i * 3, 1, 2);
      }
      context.fillStyle = '#1a6a8a';
      context.fillRect(0, 0, 16, 7);
      context.fillStyle = '#ff6b9d';
      context.fillRect(3, 1, 4, 3);
      context.fillStyle = '#ffcc00';
      context.fillRect(8, 1, 5, 3);
      context.fillStyle = '#00cc66';
      context.fillRect(5, 3, 6, 2);
      context.fillStyle = '#4a7070';
      context.fillRect(0, 5, 16, 2);

      context.restore();
    }
  };

  return grinder;
}
