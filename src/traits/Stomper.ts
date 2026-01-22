import { Trait } from '../engine/Trait';
import type { Entity } from '../engine/Entity';
import type { Killable } from './Killable';
import type { PowerUp } from './PowerUp';
import { audioManager } from '../audio/AudioManager';
import { particleSystem } from '../effects/ParticleSystem';

export class Stomper extends Trait {
  readonly name = 'stomper';

  // Bounce velocity after stomping
  private bounceVelocity = -250;

  // Score for stomping
  private stompScore = 100;

  // Callback for scoring - now includes position
  onStomp?: (score: number, x: number, y: number) => void;

  onEntityCollide(entity: Entity, other: Entity): void {
    // Check if other entity is killable (enemy)
    const killable = other.getTrait<Killable>('killable');
    if (!killable || killable.isDead) {
      return;
    }

    // Get positions
    const entityBottom = entity.pos.y + entity.size.y;
    const otherMid = other.pos.y + other.size.y * 0.6;

    // Check if we're falling and our feet are above enemy's midpoint
    if (entity.vel.y > 0 && entityBottom <= otherMid + 4) {
      // Stomp!
      killable.kill();
      audioManager.play('stomp');

      // Spawn hit effect particles
      particleSystem.spawnHitEffect(
        other.pos.x + other.size.x / 2,
        other.pos.y + other.size.y / 2
      );

      // Bounce up
      entity.vel.y = this.bounceVelocity;

      // Score - pass position of stomped enemy
      if (this.onStomp) {
        this.onStomp(this.stompScore, other.pos.x + other.size.x / 2, other.pos.y);
      }
    } else if (!killable.isDead) {
      // Player got hit by enemy!
      // Check for power-up first
      const powerUp = entity.getTrait<PowerUp>('powerup');

      // If star power, kill the enemy instead
      if (powerUp && powerUp.hasStar) {
        killable.kill();
        audioManager.play('stomp');
        if (this.onStomp) {
          this.onStomp(this.stompScore, other.pos.x + other.size.x / 2, other.pos.y);
        }
        return;
      }

      // If invincible (from damage), ignore
      if (powerUp && powerUp.isInvincible) {
        return;
      }

      // If big, shrink instead of dying
      if (powerUp && powerUp.isBig) {
        powerUp.powerDown(entity);
        return;
      }

      // Otherwise, check if player is killable and kill them
      const playerKillable = entity.getTrait<Killable>('killable');
      if (playerKillable && !playerKillable.isDead) {
        playerKillable.kill();
      }
    }
  }
}
