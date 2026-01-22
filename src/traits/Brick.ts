import { Entity } from '../engine/Entity';
import type { Level } from '../levels/Level';
import { TileType, PowerState } from '../types';

// Brick debris entity
export function createBrickDebris(x: number, y: number, velX: number, velY: number): Entity {
  const debris = new Entity();
  debris.pos = { x, y };
  debris.vel = { x: velX, y: velY };
  debris.size = { x: 8, y: 8 };

  let lifetime = 0;

  debris.draw = (context: CanvasRenderingContext2D) => {
    context.fillStyle = '#B22222';
    context.fillRect(debris.pos.x, debris.pos.y, 8, 8);
  };

  // Override update to apply gravity and remove after time
  const baseUpdate = debris.update.bind(debris);
  debris.update = (delta: number, level?: Level) => {
    baseUpdate(delta, level);
    debris.vel.y += 1500 * delta; // Gravity
    debris.pos.x += debris.vel.x * delta;
    debris.pos.y += debris.vel.y * delta;
    lifetime += delta;

    if (lifetime > 1 && level) {
      level.removeEntity(debris);
    }
  };

  return debris;
}

// Brick block behavior
export class BrickManager {
  break(tileX: number, tileY: number, level: Level, powerState: PowerState): boolean {
    const tile = level.tileResolver.getByIndex(tileX, tileY);
    if (!tile || tile.type !== TileType.BRICK) {
      return false;
    }

    if (powerState === PowerState.NORMAL) {
      // Small Smoky - just bump the brick
      this.bump(tileX, tileY, level);
      return false;
    } else {
      // Big Smoky - break the brick
      this.destroy(tileX, tileY, level);
      return true;
    }
  }

  private bump(_tileX: number, _tileY: number, _level: Level): void {
    // Just a visual bump - could add animation here
  }

  private destroy(tileX: number, tileY: number, level: Level): void {
    // Remove the tile
    level.tileResolver.setTile(tileX, tileY, TileType.AIR);

    // Create debris
    const x = tileX * 16;
    const y = tileY * 16;

    // Four pieces flying in different directions
    const debris = [
      createBrickDebris(x, y, -50, -200),
      createBrickDebris(x + 8, y, 50, -200),
      createBrickDebris(x, y + 8, -30, -150),
      createBrickDebris(x + 8, y + 8, 30, -150)
    ];

    debris.forEach((d) => level.addEntity(d));
  }
}
