import type { Entity } from '../engine/Entity';
import type { BoundingBox } from '../types';

// Check if two bounding boxes overlap (AABB collision)
function boxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export class EntityCollider {
  private entities: Set<Entity>;

  constructor(entities: Set<Entity>) {
    this.entities = entities;
  }

  // Check collisions between all entity pairs
  check(): void {
    const entityArray = Array.from(this.entities);

    for (let i = 0; i < entityArray.length; i++) {
      for (let j = i + 1; j < entityArray.length; j++) {
        const a = entityArray[i];
        const b = entityArray[j];

        if (boxesOverlap(a.getBounds(), b.getBounds())) {
          // Notify both entities of collision
          a.onEntityCollide(b);
          b.onEntityCollide(a);
          // Also call optional callbacks
          if (a.onCollide) a.onCollide(b);
          if (b.onCollide) b.onCollide(a);
        }
      }
    }
  }

  // Check collisions for a specific entity against all others
  checkEntity(entity: Entity): void {
    const bounds = entity.getBounds();

    for (const other of this.entities) {
      if (other === entity) continue;

      if (boxesOverlap(bounds, other.getBounds())) {
        entity.onEntityCollide(other);
        other.onEntityCollide(entity);
      }
    }
  }
}
