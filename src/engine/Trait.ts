import type { Entity } from './Entity';
import type { Level } from '../levels/Level';

export abstract class Trait {
  abstract readonly name: string;

  // Called every fixed update
  update(_entity: Entity, _delta: number, _level?: Level): void {
    // Override in subclasses
  }

  // Called when entity collides with a tile
  onTileCollide(_entity: Entity, _side: 'top' | 'bottom' | 'left' | 'right'): void {
    // Override in subclasses
  }

  // Called when entity collides with another entity
  onEntityCollide(_entity: Entity, _other: Entity): void {
    // Override in subclasses
  }
}
