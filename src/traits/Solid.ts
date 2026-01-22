import { Trait } from '../engine/Trait';
import type { Entity } from '../engine/Entity';
import type { Level } from '../levels/Level';
import type { PowerUp } from './PowerUp';
import { TileType } from '../types';

export class Solid extends Trait {
  readonly name = 'solid';

  // Whether to check collisions
  enabled = true;

  // Track if entity is on ground
  onGround = false;

  update(entity: Entity, _delta: number, level?: Level): void {
    if (!this.enabled || !level) {
      return;
    }

    // Assume not on ground until proven otherwise
    this.onGround = false;

    // Check Y collision
    this.checkY(entity, level);

    // Check X collision
    this.checkX(entity, level);
  }

  private checkX(entity: Entity, level: Level): void {
    const bounds = entity.getBounds();
    const tileSize = level.tileResolver.tileSize;

    // Helper to check if tile is solid (not air and not invisible)
    const isSolidTile = (type: number) => type !== 0 && type !== TileType.INVISIBLE;

    // Only check in the direction we're moving
    if (entity.vel.x > 0) {
      // Moving right - check right side
      const rightTile = level.tileResolver.getByPixel(
        bounds.x + bounds.width,
        bounds.y + bounds.height / 2
      );
      if (rightTile && isSolidTile(rightTile.type)) {
        entity.pos.x = rightTile.x * tileSize - entity.size.x - entity.offset.x;
        entity.vel.x = 0;
        entity.onTileCollide('right');
      }
    } else if (entity.vel.x < 0) {
      // Moving left - check left side
      const leftTile = level.tileResolver.getByPixel(bounds.x, bounds.y + bounds.height / 2);
      if (leftTile && isSolidTile(leftTile.type)) {
        entity.pos.x = (leftTile.x + 1) * tileSize - entity.offset.x;
        entity.vel.x = 0;
        entity.onTileCollide('left');
      }
    }
  }

  private checkY(entity: Entity, level: Level): void {
    const bounds = entity.getBounds();

    // Helper to check if tile is solid for falling (invisible blocks are NOT solid when falling)
    const isSolidForFalling = (type: number) => type !== 0 && type !== TileType.INVISIBLE;

    if (entity.vel.y > 0) {
      // Moving down - check bottom edge
      // Check both corners at bottom
      const leftTile = level.tileResolver.getByPixel(bounds.x + 1, bounds.y + bounds.height);
      const rightTile = level.tileResolver.getByPixel(
        bounds.x + bounds.width - 1,
        bounds.y + bounds.height
      );

      // Only collide with solid tiles (not invisible blocks when falling)
      const tile = (leftTile && isSolidForFalling(leftTile.type)) ? leftTile :
                   (rightTile && isSolidForFalling(rightTile.type)) ? rightTile : null;

      if (tile) {
        // Collision on bottom
        entity.pos.y = tile.y * level.tileResolver.tileSize - entity.size.y - entity.offset.y;
        entity.vel.y = 0;
        this.onGround = true;
        entity.onTileCollide('bottom');
      }
    } else if (entity.vel.y < 0) {
      // Moving up - check top edge (player hitting block from below)
      // Invisible blocks ARE solid when hit from below!
      const leftTile = level.tileResolver.getByPixel(bounds.x + 2, bounds.y);
      const rightTile = level.tileResolver.getByPixel(bounds.x + bounds.width - 2, bounds.y);

      const tile = leftTile?.type !== 0 ? leftTile : rightTile?.type !== 0 ? rightTile : null;

      if (tile && tile.type !== 0) {
        // Collision on top - hit the block!
        entity.pos.y = (tile.y + 1) * level.tileResolver.tileSize - entity.offset.y;
        entity.vel.y = 0;
        entity.onTileCollide('top');

        // Hit the block (for question blocks, bricks, invisible blocks, etc.)
        // Only if this entity is the player (has stomper trait = can stomp enemies)
        if (entity.hasTrait('stomper')) {
          const powerUp = entity.getTrait<PowerUp>('powerup');
          const isBig = powerUp ? powerUp.isBig : false;
          level.hitBlock(tile.x, tile.y, isBig);
        }
      }
    }
  }
}
