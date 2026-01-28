import { Trait } from '../engine/Trait';
import type { Entity } from '../engine/Entity';
import type { Level } from '../levels/Level';
import { TILE_SIZE } from '../types';
import { audioManager } from '../audio/AudioManager';

export interface WarpPoint {
  entranceTileX: number;
  entranceTileY: number;
  exitX: number;
  exitY: number;
  exitCameraX: number;
}

enum WarpState {
  IDLE,
  SINKING,
  TELEPORTING,
  RISING,
}

const SINK_DURATION = 0.8;
const TELEPORT_DURATION = 0.3;
const RISE_DURATION = 0.8;
const SINK_DISTANCE = 24;

export class PipeWarp extends Trait {
  readonly name = 'pipewarp';

  downPressed = false;

  private state = WarpState.IDLE;
  private stateTimer = 0;
  private warpPoints: WarpPoint[] = [];
  private activeWarp: WarpPoint | null = null;
  private startY = 0;
  private pipeTopY = 0;  // Y pixel of pipe top, for clipping

  // Callbacks for scene integration
  onWarpStart?: () => void;
  onWarpEnd?: () => void;
  onCameraJump?: (cameraX: number) => void;

  get isWarping(): boolean {
    return this.state !== WarpState.IDLE;
  }

  setWarpPoints(points: WarpPoint[]): void {
    this.warpPoints = points;
  }

  update(entity: Entity, delta: number, _level?: Level): void {
    switch (this.state) {
      case WarpState.IDLE:
        this.updateIdle(entity);
        break;
      case WarpState.SINKING:
        this.updateSinking(entity, delta);
        break;
      case WarpState.TELEPORTING:
        this.updateTeleporting(entity, delta);
        break;
      case WarpState.RISING:
        this.updateRising(entity, delta);
        break;
    }
  }

  private updateIdle(entity: Entity): void {
    if (!this.downPressed) return;

    // Check if player is standing on top of a warp pipe entrance
    const entityCenterX = entity.pos.x + entity.size.x / 2;
    const entityBottomY = entity.pos.y + entity.size.y;

    for (const wp of this.warpPoints) {
      const pipeLeftPixel = wp.entranceTileX * TILE_SIZE;
      const pipeTopPixel = wp.entranceTileY * TILE_SIZE;

      // Player must be centered on the pipe (within pipe width = 2 tiles = 32px)
      const pipeCenter = pipeLeftPixel + TILE_SIZE;
      const distFromCenter = Math.abs(entityCenterX - pipeCenter);
      // Player must be standing on the pipe top row
      const onPipeTop = Math.abs(entityBottomY - pipeTopPixel) < 4;

      if (distFromCenter < 10 && onPipeTop) {
        // Start warp!
        this.activeWarp = wp;
        this.state = WarpState.SINKING;
        this.stateTimer = 0;
        this.startY = entity.pos.y;
        this.pipeTopY = pipeTopPixel;

        // Freeze player
        entity.vel.x = 0;
        entity.vel.y = 0;

        // Center player on pipe
        entity.pos.x = pipeCenter - entity.size.x / 2;

        // Clip player sprite at pipe top
        entity.clipY = pipeTopPixel;

        audioManager.play('pipe');

        if (this.onWarpStart) {
          this.onWarpStart();
        }
        return;
      }
    }
  }

  private updateSinking(entity: Entity, delta: number): void {
    this.stateTimer += delta;
    const progress = Math.min(this.stateTimer / SINK_DURATION, 1);

    // Move player down into pipe
    entity.pos.y = this.startY + SINK_DISTANCE * progress;
    entity.vel.x = 0;
    entity.vel.y = 0;

    if (progress >= 1) {
      // Transition to teleporting
      this.state = WarpState.TELEPORTING;
      this.stateTimer = 0;
      entity.visible = false;
      entity.clipY = null;
    }
  }

  private updateTeleporting(entity: Entity, delta: number): void {
    this.stateTimer += delta;

    if (this.stateTimer >= TELEPORT_DURATION && this.activeWarp) {
      // Teleport player to exit position (start below pipe, will rise up)
      entity.pos.x = this.activeWarp.exitX;
      entity.pos.y = this.activeWarp.exitY + SINK_DISTANCE;
      entity.vel.x = 0;
      entity.vel.y = 0;
      this.startY = this.activeWarp.exitY;

      // Calculate exit pipe top Y for clipping
      // exitY is where the player ends up standing, pipe top is at that Y + entity height
      this.pipeTopY = this.activeWarp.exitY + entity.size.y;
      entity.clipY = this.pipeTopY;

      // Snap camera
      if (this.onCameraJump) {
        this.onCameraJump(this.activeWarp.exitCameraX);
      }

      this.state = WarpState.RISING;
      this.stateTimer = 0;
      entity.visible = true;
    }
  }

  private updateRising(entity: Entity, delta: number): void {
    this.stateTimer += delta;
    const progress = Math.min(this.stateTimer / RISE_DURATION, 1);

    // Move player up out of pipe
    entity.pos.y = (this.startY + SINK_DISTANCE) - SINK_DISTANCE * progress;
    entity.vel.x = 0;
    entity.vel.y = 0;

    if (progress >= 1) {
      // Done warping
      this.state = WarpState.IDLE;
      this.activeWarp = null;
      entity.visible = true;
      entity.clipY = null;

      if (this.onWarpEnd) {
        this.onWarpEnd();
      }
    }
  }
}
