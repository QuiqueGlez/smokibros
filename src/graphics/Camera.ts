import type { Entity } from '../engine/Entity';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../types';

export class Camera {
  pos = { x: 0, y: 0 };

  // Deadzone - player can move within this area without camera moving
  private deadzoneLeft = 80;
  private deadzoneRight = 160;

  // Bounds
  private minX = 0;
  private minY = 0;
  private maxX = Infinity;
  private maxY = 0;

  setBounds(levelWidth: number, levelHeight: number): void {
    this.maxX = Math.max(0, levelWidth - SCREEN_WIDTH);
    this.maxY = Math.max(0, levelHeight - SCREEN_HEIGHT);
  }

  follow(entity: Entity): void {
    const entityCenterX = entity.pos.x + entity.size.x / 2;

    // Horizontal following with deadzone
    if (entityCenterX - this.pos.x > this.deadzoneRight) {
      this.pos.x = entityCenterX - this.deadzoneRight;
    } else if (entityCenterX - this.pos.x < this.deadzoneLeft) {
      // Only follow left if we're not at the start
      if (this.pos.x > this.minX) {
        this.pos.x = entityCenterX - this.deadzoneLeft;
      }
    }

    // Clamp to bounds
    this.pos.x = Math.max(this.minX, Math.min(this.maxX, this.pos.x));
    this.pos.y = Math.max(this.minY, Math.min(this.maxY, this.pos.y));

    // Round to avoid subpixel rendering
    this.pos.x = Math.floor(this.pos.x);
    this.pos.y = Math.floor(this.pos.y);
  }

  // Lock camera at position (for cutscenes, etc)
  lock(x: number, y: number): void {
    this.pos.x = Math.max(this.minX, Math.min(this.maxX, x));
    this.pos.y = Math.max(this.minY, Math.min(this.maxY, y));
  }

  // Reset camera to start
  reset(): void {
    this.pos.x = this.minX;
    this.pos.y = this.minY;
  }
}
