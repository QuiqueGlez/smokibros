import { Trait } from '../engine/Trait';
import type { Entity } from '../engine/Entity';
import type { Level } from '../levels/Level';
import { TileType } from '../types';

// Callback type for spawning items
type SpawnCallback = (x: number, y: number) => Entity | null;

export class QuestionBlock extends Trait {
  readonly name = 'questionBlock';

  // Position in tile coordinates
  tileX: number;
  tileY: number;

  // Item to spawn (callback that creates the entity)
  private spawnItem: SpawnCallback;

  // Whether block has been hit
  private used = false;

  // Animation
  private bounceOffset = 0;
  private bouncing = false;

  constructor(tileX: number, tileY: number, spawnItem: SpawnCallback) {
    super();
    this.tileX = tileX;
    this.tileY = tileY;
    this.spawnItem = spawnItem;
  }

  hit(level: Level): void {
    if (this.used) return;

    this.used = true;
    this.bouncing = true;
    this.bounceOffset = -4;

    // Change tile to empty block
    level.tileResolver.setTile(this.tileX, this.tileY, TileType.BLOCK);

    // Spawn item above the block
    const itemX = this.tileX * 16;
    const itemY = (this.tileY - 1) * 16;
    const item = this.spawnItem(itemX, itemY);

    if (item) {
      level.addEntity(item);
    }
  }

  update(_entity: Entity, delta: number): void {
    if (this.bouncing) {
      this.bounceOffset += 20 * delta;
      if (this.bounceOffset >= 0) {
        this.bounceOffset = 0;
        this.bouncing = false;
      }
    }
  }

  getBounceOffset(): number {
    return this.bounceOffset;
  }

  isUsed(): boolean {
    return this.used;
  }
}

// Manager for question blocks in a level
export class QuestionBlockManager {
  private blocks = new Map<string, QuestionBlock>();

  register(tileX: number, tileY: number, spawnItem: SpawnCallback): void {
    const key = `${tileX},${tileY}`;
    this.blocks.set(key, new QuestionBlock(tileX, tileY, spawnItem));
  }

  hit(tileX: number, tileY: number, level: Level): void {
    const key = `${tileX},${tileY}`;
    const block = this.blocks.get(key);
    if (block) {
      block.hit(level);
    }
  }

  getBlock(tileX: number, tileY: number): QuestionBlock | undefined {
    const key = `${tileX},${tileY}`;
    return this.blocks.get(key);
  }
}
