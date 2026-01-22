import { Entity } from '../../engine/Entity';
import { Collectible } from './Filter';
import { COLORS } from '../../types';

// GoldPaper - Fire Flower equivalent
// Gives the player "Premium" power (can shoot)
export function createGoldPaper(): Entity {
  const goldPaper = new Entity();

  goldPaper.size = { x: 16, y: 16 };

  const collectible = new Collectible();
  goldPaper.addTrait(collectible);

  // Animation
  let shimmer = 0;

  goldPaper.draw = (context: CanvasRenderingContext2D) => {
    shimmer += 0.1;

    context.save();
    context.translate(goldPaper.pos.x, goldPaper.pos.y);

    // Rolling paper shape
    context.fillStyle = COLORS.GOLD;
    context.fillRect(2, 2, 12, 12);

    // Inner lighter gold
    const shimmerOffset = Math.sin(shimmer) * 0.3 + 0.7;
    context.fillStyle = `rgba(255, 223, 100, ${shimmerOffset})`;
    context.fillRect(4, 4, 8, 8);

    // Crown symbol (premium)
    context.fillStyle = '#8B6914';
    // Crown base
    context.fillRect(5, 8, 6, 2);
    // Crown points
    context.fillRect(5, 6, 2, 2);
    context.fillRect(7, 5, 2, 3);
    context.fillRect(9, 6, 2, 2);

    // Sparkle effect
    if (Math.sin(shimmer * 2) > 0.5) {
      context.fillStyle = '#fff';
      context.fillRect(3, 3, 1, 1);
      context.fillRect(12, 3, 1, 1);
    }

    context.restore();
  };

  return goldPaper;
}
