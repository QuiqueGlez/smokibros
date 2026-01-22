import { Trait } from '../engine/Trait';
import type { Entity } from '../engine/Entity';
import { Direction } from '../types';
import type { Killable } from './Killable';

export class PendulumWalk extends Trait {
  readonly name = 'pendulumWalk';

  // Movement speed
  speed = 30;

  // Current direction
  direction: Direction = Direction.LEFT;

  // Whether this entity is enabled
  enabled = true;

  update(entity: Entity, _delta: number): void {
    if (!this.enabled) {
      entity.vel.x = 0;
      return;
    }

    // Check if dead
    const killable = entity.getTrait<Killable>('killable');
    if (killable?.isDead) {
      entity.vel.x = 0;
      return;
    }

    // Move in current direction
    entity.vel.x = this.speed * this.direction;
  }

  onTileCollide(_entity: Entity, side: 'top' | 'bottom' | 'left' | 'right'): void {
    // Reverse direction immediately when hitting a wall
    if (side === 'left' && this.direction === Direction.LEFT) {
      this.direction = Direction.RIGHT;
    } else if (side === 'right' && this.direction === Direction.RIGHT) {
      this.direction = Direction.LEFT;
    }
  }

  onEntityCollide(entity: Entity, other: Entity): void {
    // Check if we collided horizontally with another enemy
    const killable = entity.getTrait<Killable>('killable');
    if (killable?.isDead) return;

    // If the other has pendulumWalk (another enemy), reverse
    if (other.hasTrait('pendulumWalk')) {
      const entityCenter = entity.pos.x + entity.size.x / 2;
      const otherCenter = other.pos.x + other.size.x / 2;

      if (entityCenter < otherCenter && this.direction === Direction.RIGHT) {
        this.direction = Direction.LEFT;
      } else if (entityCenter > otherCenter && this.direction === Direction.LEFT) {
        this.direction = Direction.RIGHT;
      }
    }
  }
}
