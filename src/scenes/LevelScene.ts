import { Scene } from '../engine/Scene';
import type { Game } from '../engine/Game';
import { Level } from '../levels/Level';
import { Camera } from '../graphics/Camera';
import { HUD } from '../ui/HUD';
import { KeyboardState, setupPlayerControls } from '../input/KeyboardState';
import { TouchControls } from '../input/TouchControls';
import { getSmokyControls } from '../entities/Smoky';
import { particleSystem } from '../effects/ParticleSystem';
import { createScorePopup } from '../entities/ScorePopup';
import { SCREEN_HEIGHT, Direction } from '../types';
import type { Entity } from '../engine/Entity';
import type { Killable } from '../traits/Killable';
import type { Stomper } from '../traits/Stomper';
import type { ChillMeter } from '../traits/ChillMeter';
import type { Go } from '../traits/Go';
import type { Solid } from '../traits/Solid';
import type { PipeWarp } from '../traits/PipeWarp';

export class LevelScene extends Scene {
  private level: Level;
  private camera: Camera;
  private hud: HUD;
  private player: Entity | null = null;
  private keyboard: KeyboardState | null = null;
  private touchControls: TouchControls | null = null;
  private touchContainer: HTMLDivElement | null = null;

  // Smoke effect timers
  private speedTrailTimer = 0;
  private wasInAir = false;

  // Callbacks
  private onGameOver?: () => void;
  private onLevelComplete?: () => void;

  constructor(
    game: Game,
    level: Level,
    options?: {
      onGameOver?: () => void;
      onLevelComplete?: () => void;
    }
  ) {
    super(game);
    this.level = level;
    this.camera = new Camera();
    this.hud = new HUD(game.state);
    this.onGameOver = options?.onGameOver;
    this.onLevelComplete = options?.onLevelComplete;
  }

  enter(): void {
    // Find player entity
    for (const entity of this.level.entities) {
      if (entity.hasTrait('go') && entity.hasTrait('jump')) {
        this.player = entity;
        break;
      }
    }

    if (this.player) {
      // Setup keyboard controls
      this.keyboard = new KeyboardState();
      const controls = getSmokyControls(this.player);
      setupPlayerControls(this.keyboard, controls);

      // Setup touch controls for mobile
      this.setupTouchControls(controls);

      // Setup pipe warp controls if trait exists
      const pipeWarp = this.player.getTrait<PipeWarp>('pipewarp');
      if (pipeWarp) {
        this.keyboard.addMapping('ArrowDown', (pressed) => {
          pipeWarp.downPressed = pressed;
        });
        this.keyboard.addMapping('KeyS', (pressed) => {
          pipeWarp.downPressed = pressed;
        });

        // Disable Go and Solid during warp
        pipeWarp.onWarpStart = () => {
          const go = this.player?.getTrait<Go>('go');
          const solid = this.player?.getTrait<Solid>('solid');
          if (go) go.direction = 0;
          if (solid) solid.enabled = false;
        };

        pipeWarp.onWarpEnd = () => {
          const solid = this.player?.getTrait<Solid>('solid');
          if (solid) solid.enabled = true;
        };

        pipeWarp.onCameraJump = (cameraX: number) => {
          this.camera.lock(cameraX, 0);
        };
      }

      // Get chill meter for connecting to events
      const chillMeter = this.player.getTrait<ChillMeter>('chillmeter');

      // Connect chill meter to game state
      if (chillMeter) {
        chillMeter.setGame(this.game);
      }

      // Setup stomp scoring with popup and chill bonus
      const stomper = this.player.getTrait<Stomper>('stomper');
      if (stomper) {
        stomper.onStomp = (score: number, x: number, y: number) => {
          this.game.addScore(score);
          // Create score popup
          const popup = createScorePopup(score, x, y);
          this.level.addEntity(popup);
          // Add chill for stomping enemy
          if (chillMeter) {
            chillMeter.stompEnemy();
          }
        };
      }
    }

    // Set camera bounds
    this.camera.setBounds(this.level.width, this.level.height);

    // Get chill meter reference for coin collection
    const playerChillMeter = this.player?.getTrait<ChillMeter>('chillmeter');

    // Setup coin collection scoring with popup and chill bonus
    this.level.onCoinCollected = (x: number, y: number) => {
      this.game.addScore(200);
      this.game.addFilter();
      // Create score popup
      const popup = createScorePopup(200, x, y);
      this.level.addEntity(popup);
      // Add chill for collecting filter
      if (playerChillMeter) {
        playerChillMeter.collectFilter();
      }
    };
  }

  update(delta: number): void {
    // Update timer
    if (this.game.state.time > 0) {
      this.game.state.time -= delta;
      if (this.game.state.time <= 0) {
        this.game.state.time = 0;
        // Time's up - kill player
        if (this.player) {
          const killable = this.player.getTrait<Killable>('killable');
          if (killable && !killable.isDead) {
            killable.kill();
          }
        }
      }
    }

    // Update level
    this.level.update(delta);

    // Update particles
    particleSystem.update(delta);

    // Update HUD animations
    this.hud.update(delta);

    // Spawn smoke effects based on player state
    this.updateSmokeEffects(delta);

    // Update camera
    if (this.player) {
      // Don't follow camera during warp (camera is snapped by PipeWarp)
      const pipeWarp = this.player.getTrait<PipeWarp>('pipewarp');
      const isWarping = pipeWarp?.isWarping ?? false;

      if (!isWarping) {
        this.camera.follow(this.player);
      }

      // Skip death/completion checks during warp
      if (!isWarping) {
        // Check if player fell off the level
        if (this.player.pos.y > SCREEN_HEIGHT + 16) {
          this.handlePlayerDeath();
        }

        // Check if player is dead (hit by enemy)
        const killable = this.player.getTrait<Killable>('killable');
        if (killable?.isDead) {
          this.handlePlayerDeath();
        }

        // Check for level completion (reached end of level, but not in underground)
        const completionX = this.level.completionX ?? (this.level.width - 32);
        const inUnderground = this.level.undergroundRange &&
          this.player.pos.x >= this.level.undergroundRange.startTile * 16 &&
          this.player.pos.x < this.level.undergroundRange.endTile * 16;
        if (this.player.pos.x > completionX && !inUnderground) {
          this.handleLevelComplete();
        }
      }
    }
  }

  draw(context: CanvasRenderingContext2D): void {
    // Draw level
    this.level.draw(context, this.camera.pos.x, this.camera.pos.y);

    // Draw particles
    particleSystem.draw(context, this.camera.pos.x);

    // Draw HUD on top
    this.hud.draw(context);
  }

  private handlePlayerDeath(): void {
    if (!this.game.loseLife()) {
      // No more lives - game over
      if (this.onGameOver) {
        this.onGameOver();
      }
    } else {
      // Respawn player
      this.respawnPlayer();
    }
  }

  private respawnPlayer(): void {
    if (this.player) {
      // Reset player position
      this.player.pos.x = 32;
      this.player.pos.y = 192;
      this.player.vel.x = 0;
      this.player.vel.y = 0;

      // Revive if dead
      const killable = this.player.getTrait<Killable>('killable');
      if (killable) {
        killable.revive();
      }

      // Reset camera
      this.camera.reset();
    }
  }

  private handleLevelComplete(): void {
    if (this.onLevelComplete) {
      this.onLevelComplete();
    }
  }

  private setupTouchControls(controls: ReturnType<typeof getSmokyControls>): void {
    // Only setup if touch is supported
    if (!('ontouchstart' in window)) {
      return;
    }

    // Create container for touch controls
    this.touchContainer = document.createElement('div');
    this.touchContainer.id = 'touch-controls';
    document.body.appendChild(this.touchContainer);

    // Setup touch controls
    this.touchControls = new TouchControls(this.touchContainer, {
      onLeft: (pressed) => {
        if (pressed) {
          controls.go.direction = -1;
        } else if (controls.go.direction === -1) {
          controls.go.direction = 0;
        }
      },
      onRight: (pressed) => {
        if (pressed) {
          controls.go.direction = 1;
        } else if (controls.go.direction === 1) {
          controls.go.direction = 0;
        }
      },
      onJump: (pressed) => {
        if (pressed) {
          controls.jump.start();
        } else {
          controls.jump.cancel();
        }
      }
    });
  }

  private updateSmokeEffects(delta: number): void {
    if (!this.player) return;

    const go = this.player.getTrait<Go>('go');
    const solid = this.player.getTrait<Solid>('solid');
    const chillMeter = this.player.getTrait<ChillMeter>('chillmeter');
    const killable = this.player.getTrait<Killable>('killable');

    // Don't spawn smoke if dead
    if (killable?.isDying || killable?.isDead) return;

    const playerX = this.player.pos.x + this.player.size.x / 2;
    const onGround = solid?.onGround ?? false;

    // Speed trail when running fast
    const speed = Math.abs(this.player.vel.x);
    if (speed > 120 && onGround) {
      this.speedTrailTimer += delta;
      if (this.speedTrailTimer >= 0.05) {
        this.speedTrailTimer = 0;
        const direction = go?.heading ?? Direction.RIGHT;
        particleSystem.spawnSpeedTrail(
          playerX,
          this.player.pos.y + this.player.size.y - 2,
          direction
        );
      }
    }

    // Landing impact
    const isInAir = !onGround;
    if (this.wasInAir && !isInAir && this.player.vel.y >= 0) {
      // Just landed!
      particleSystem.spawnLandingImpact(
        playerX,
        this.player.pos.y + this.player.size.y
      );
    }
    this.wasInAir = isInAir;

    // Chill smoke when chill level is high
    if (chillMeter && chillMeter.hasSpeedBoost) {
      const intensity = chillMeter.chillPercent;
      // Spawn chill smoke around the player
      if (Math.random() < intensity * 0.3) {
        const offsetX = (Math.random() - 0.5) * 16;
        particleSystem.spawnChillSmoke(
          playerX + offsetX,
          this.player.pos.y + this.player.size.y,
          intensity
        );
      }
    }
  }

  exit(): void {
    // Cleanup touch controls
    if (this.touchControls) {
      this.touchControls.destroy();
      this.touchControls = null;
    }
    if (this.touchContainer) {
      this.touchContainer.remove();
      this.touchContainer = null;
    }
  }
}
