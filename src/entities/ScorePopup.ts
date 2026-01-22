import { Entity } from '../engine/Entity';
import type { Level } from '../levels/Level';

// Floating score text that appears when collecting items or stomping enemies
export function createScorePopup(score: number, x: number, y: number): Entity {
  const popup = new Entity();

  popup.pos.x = x;
  popup.pos.y = y;
  popup.size = { x: 20, y: 10 };

  let lifetime = 0;
  const maxLifetime = 0.8; // How long the popup lasts
  const riseSpeed = 60; // Pixels per second

  popup.draw = (context: CanvasRenderingContext2D) => {
    const alpha = 1 - (lifetime / maxLifetime);

    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = '#fff';
    context.font = 'bold 8px monospace';
    context.textAlign = 'center';
    context.fillText(score.toString(), popup.pos.x, popup.pos.y);

    // Shadow for better visibility
    context.fillStyle = '#000';
    context.fillText(score.toString(), popup.pos.x + 1, popup.pos.y + 1);
    context.fillStyle = '#fff';
    context.fillText(score.toString(), popup.pos.x, popup.pos.y);

    context.restore();
  };

  const baseUpdate = popup.update.bind(popup);
  popup.update = (delta: number, level?: Level) => {
    baseUpdate(delta, level);

    // Float upward
    popup.pos.y -= riseSpeed * delta;

    lifetime += delta;

    // Remove when expired
    if (lifetime >= maxLifetime && level) {
      level.removeEntity(popup);
    }
  };

  return popup;
}
