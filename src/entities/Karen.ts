import { Entity } from '../engine/Entity';
import { Trait } from '../engine/Trait';
import type { Level } from '../levels/Level';
import type { ChillMeter } from '../traits/ChillMeter';
import { audioManager } from '../audio/AudioManager';
import { particleSystem } from '../effects/ParticleSystem';

// Karen - the "I want to speak to your manager" enemy
// She walks back and forth, and when she sees the player, she yells
// which reduces their chill meter!

class KarenBehavior extends Trait {
  readonly name = 'karen';

  // Movement
  private direction = -1;
  private walkSpeed = 35;

  // State
  private dead = false;
  private flatTimer = 0;
  private readonly flatDuration = 0.5;

  // Yelling
  private isYelling = false;
  private yellTimer = 0;
  private yellCooldown = 0;
  private readonly yellDuration = 1.5;
  private readonly yellRange = 80;  // Detection range
  private readonly chillDrain = 15; // Chill drained when yelled at

  // Animation
  private animFrame = 0;
  private animTimer = 0;
  private mouthOpen = false;

  get isDead(): boolean {
    return this.dead;
  }

  get isFlat(): boolean {
    return this.dead && this.flatTimer < this.flatDuration;
  }

  stomp(): number {
    if (this.dead) return 0;
    this.dead = true;
    this.flatTimer = 0;
    audioManager.play('stomp');
    return 200; // Score for stomping Karen
  }

  update(entity: Entity, delta: number, level?: Level): void {
    if (this.dead) {
      this.flatTimer += delta;
      if (this.flatTimer >= this.flatDuration && level) {
        level.removeEntity(entity);
      }
      return;
    }

    // Animation
    this.animTimer += delta;
    if (this.animTimer >= 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    // Cooldown
    if (this.yellCooldown > 0) {
      this.yellCooldown -= delta;
    }

    // Look for player
    let playerEntity: Entity | null = null;
    let playerDistance = Infinity;

    if (level) {
      for (const other of level.entities) {
        if (other.hasTrait('stomper')) {
          const dist = Math.abs(
            (other.pos.x + other.size.x / 2) - (entity.pos.x + entity.size.x / 2)
          );
          if (dist < playerDistance) {
            playerDistance = dist;
            playerEntity = other;
          }
        }
      }
    }

    // Yelling behavior
    if (this.isYelling) {
      this.yellTimer += delta;
      this.mouthOpen = Math.sin(this.yellTimer * 20) > 0;

      // Spawn yell particles
      if (Math.random() < 0.3) {
        const yellX = entity.pos.x + (this.direction > 0 ? 16 : -8);
        particleSystem.spawn(yellX, entity.pos.y + 4, 1, {
          color: '#ff4444',
          speed: 40,
          spread: Math.PI / 4,
          life: 0.3,
          size: 3,
          fadeOut: true
        });
      }

      // Drain player's chill if in range
      if (playerEntity && playerDistance < this.yellRange) {
        const chillMeter = playerEntity.getTrait<ChillMeter>('chillmeter');
        if (chillMeter) {
          // Drain chill over time while yelling
          chillMeter.addChill(-this.chillDrain * delta);
        }
      }

      if (this.yellTimer >= this.yellDuration) {
        this.isYelling = false;
        this.yellTimer = 0;
        this.yellCooldown = 2; // Wait before yelling again
      }
    } else {
      this.mouthOpen = false;

      // Check if should start yelling
      if (playerEntity && playerDistance < this.yellRange && this.yellCooldown <= 0) {
        this.isYelling = true;
        this.yellTimer = 0;
        // Face the player
        this.direction = playerEntity.pos.x > entity.pos.x ? 1 : -1;
      } else {
        // Normal walking
        entity.vel.x = this.direction * this.walkSpeed;

        // Check for walls and edges
        if (level) {
          const bounds = entity.getBounds();

          // Check wall collision
          const checkX = this.direction > 0
            ? bounds.x + bounds.width + 2
            : bounds.x - 2;
          const wallTile = level.tileResolver.getByPixel(checkX, bounds.y + bounds.height / 2);

          // Check edge (don't walk off platforms)
          const edgeTile = level.tileResolver.getByPixel(
            this.direction > 0 ? bounds.x + bounds.width + 2 : bounds.x - 2,
            bounds.y + bounds.height + 2
          );

          if ((wallTile && wallTile.type !== 0) || !edgeTile || edgeTile.type === 0) {
            this.direction *= -1;
            entity.vel.x = this.direction * this.walkSpeed;
          }
        }
      }
    }

    // Apply gravity
    entity.vel.y += 1500 * delta;
    if (entity.vel.y > 400) entity.vel.y = 400;

    // Move if not yelling
    if (!this.isYelling) {
      entity.pos.x += entity.vel.x * delta;
    }
    entity.pos.y += entity.vel.y * delta;

    // Ground collision
    if (level) {
      const bounds = entity.getBounds();
      const tileBelow = level.tileResolver.getByPixel(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height + 1
      );

      if (tileBelow && tileBelow.type !== 0) {
        entity.pos.y = tileBelow.y * 16 - entity.size.y;
        entity.vel.y = 0;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, entity: Entity): void {
    const x = Math.floor(entity.pos.x);
    const y = Math.floor(entity.pos.y);

    if (this.dead) {
      // Flat Karen (stomped)
      this.drawFlat(ctx, x, y);
      return;
    }

    ctx.save();

    // Flip based on direction
    if (this.direction > 0) {
      ctx.translate(x + 16, y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(x, y);
    }

    // Draw Karen
    this.drawKaren(ctx, this.animFrame, this.isYelling, this.mouthOpen);

    ctx.restore();

    // Draw yell effect
    if (this.isYelling) {
      this.drawYellEffect(ctx, x, y);
    }
  }

  private drawKaren(ctx: CanvasRenderingContext2D, frame: number, yelling: boolean, mouthOpen: boolean): void {
    // "Speak to manager" haircut (blonde bob)
    ctx.fillStyle = '#F4D03F';
    ctx.fillRect(2, 0, 12, 4);
    ctx.fillRect(0, 2, 16, 4);
    ctx.fillRect(1, 6, 3, 2);
    ctx.fillRect(12, 6, 3, 2);

    // Angry face
    ctx.fillStyle = '#FFD5B5';
    ctx.fillRect(3, 4, 10, 8);

    // Angry eyebrows (V shape)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(4, 4, 2, 1);
    ctx.fillRect(5, 5, 1, 1);
    ctx.fillRect(10, 4, 2, 1);
    ctx.fillRect(10, 5, 1, 1);

    // Eyes (narrowed when yelling)
    ctx.fillStyle = '#000';
    if (yelling) {
      ctx.fillRect(5, 6, 2, 1);
      ctx.fillRect(9, 6, 2, 1);
    } else {
      ctx.fillRect(5, 6, 2, 2);
      ctx.fillRect(9, 6, 2, 2);
    }

    // Mouth
    if (mouthOpen) {
      // Yelling mouth
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(6, 9, 4, 3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(7, 9, 2, 1);
    } else {
      // Frowning
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(6, 10, 4, 1);
    }

    // Body (business casual - polo shirt)
    ctx.fillStyle = '#E74C3C'; // Red polo
    ctx.fillRect(3, 12, 10, 2);

    // Walking animation
    if (frame === 0) {
      ctx.fillRect(4, 14, 3, 2);
      ctx.fillRect(9, 14, 3, 2);
    } else {
      ctx.fillRect(3, 14, 3, 2);
      ctx.fillRect(10, 14, 3, 2);
    }

    // Shoes
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(4, 15, 3, 1);
    ctx.fillRect(9, 15, 3, 1);
  }

  private drawFlat(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Squished Karen
    ctx.fillStyle = '#F4D03F'; // Hair
    ctx.fillRect(x + 2, y + 14, 12, 2);
    ctx.fillStyle = '#E74C3C'; // Shirt
    ctx.fillRect(x + 4, y + 14, 8, 2);
  }

  private drawYellEffect(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    // Draw speech bubble with "!" or angry symbols
    const bubbleX = this.direction > 0 ? x + 16 : x - 12;

    ctx.fillStyle = '#fff';
    ctx.fillRect(bubbleX, y - 4, 10, 10);

    // Exclamation marks
    ctx.fillStyle = '#ff0000';
    ctx.font = '8px monospace';
    ctx.fillText('!', bubbleX + 3, y + 4);

    // Sound waves
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 1;
    const waveX = this.direction > 0 ? x + 20 : x - 6;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(waveX, y + 6, 4 + i * 4, -0.5, 0.5);
      ctx.stroke();
    }
  }
}

// Create a Karen enemy
export function createKaren(): Entity {
  const karen = new Entity();

  karen.size = { x: 16, y: 16 };

  const behavior = new KarenBehavior();
  karen.addTrait(behavior);

  // Custom draw
  karen.draw = (ctx: CanvasRenderingContext2D) => {
    behavior.draw(ctx, karen);
  };

  // Handle stomp collision
  karen.onCollide = (other: Entity) => {
    if (other.hasTrait('stomper') && !behavior.isDead) {
      const otherBounds = other.getBounds();
      const karenBounds = karen.getBounds();

      // Check if player is falling onto Karen
      if (other.vel.y > 0 && otherBounds.y + otherBounds.height < karenBounds.y + 8) {
        const score = behavior.stomp();
        if (score > 0) {
          // Bounce player
          other.vel.y = -200;

          // Trigger stomp callback on player
          const stomper = other.getTrait<any>('stomper');
          if (stomper?.onStomp) {
            stomper.onStomp(score, karen.pos.x + 8, karen.pos.y);
          }
        }
      } else if (!behavior.isDead) {
        // Karen hit player from side - drain chill or damage
        const chillMeter = other.getTrait<ChillMeter>('chillmeter');
        if (chillMeter) {
          chillMeter.takeDamage();
        }

        // Check for star power
        const powerUp = other.getTrait<any>('powerup');
        if (powerUp?.hasStar) {
          behavior.stomp();
        } else if (!powerUp?.isInvincible) {
          // Player takes damage
          if (powerUp?.isBig) {
            powerUp.powerDown(other);
          } else {
            const killable = other.getTrait<any>('killable');
            if (killable && !killable.isDead) {
              killable.kill();
            }
          }
        }
      }
    }
  };

  return karen;
}
