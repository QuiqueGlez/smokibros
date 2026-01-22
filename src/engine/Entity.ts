import { Trait } from './Trait';
import type { Level } from '../levels/Level';
import type { BoundingBox, Vec2 } from '../types';

export class Entity {
  // Position and size
  pos: Vec2 = { x: 0, y: 0 };
  vel: Vec2 = { x: 0, y: 0 };
  size: Vec2 = { x: 16, y: 16 };
  offset: Vec2 = { x: 0, y: 0 };

  // State
  lifetime = 0;

  // Traits map for O(1) lookup
  private traits = new Map<string, Trait>();

  // Draw function (set by entity factory)
  draw: (context: CanvasRenderingContext2D) => void = () => {};

  // Optional collision callback (set by entity factory)
  onCollide?: (other: Entity) => void;

  addTrait(trait: Trait): void {
    this.traits.set(trait.name, trait);
  }

  getTrait<T extends Trait>(name: string): T | undefined {
    return this.traits.get(name) as T | undefined;
  }

  hasTrait(name: string): boolean {
    return this.traits.has(name);
  }

  update(delta: number, level?: Level): void {
    this.lifetime += delta;

    for (const trait of this.traits.values()) {
      trait.update(this, delta, level);
    }
  }

  getBounds(): BoundingBox {
    return {
      x: this.pos.x + this.offset.x,
      y: this.pos.y + this.offset.y,
      width: this.size.x,
      height: this.size.y
    };
  }

  // Notify all traits of tile collision
  onTileCollide(side: 'top' | 'bottom' | 'left' | 'right'): void {
    for (const trait of this.traits.values()) {
      trait.onTileCollide(this, side);
    }
  }

  // Notify all traits of entity collision
  onEntityCollide(other: Entity): void {
    for (const trait of this.traits.values()) {
      trait.onEntityCollide(this, other);
    }
  }
}
