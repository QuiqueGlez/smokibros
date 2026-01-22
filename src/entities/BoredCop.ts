import { Entity } from '../engine/Entity';
import { Trait } from '../engine/Trait';
import { Physics } from '../traits/Physics';
import { Solid } from '../traits/Solid';
import { PendulumWalk } from '../traits/PendulumWalk';
import { Killable } from '../traits/Killable';
import { SpriteSheet } from '../graphics/SpriteSheet';
import { Direction } from '../types';

// Shell behavior states
enum ShellState {
  WALKING,
  HIDING,
  SLIDING
}

// Shell behavior trait
class ShellBehavior extends Trait {
  readonly name = 'shellBehavior';

  state = ShellState.WALKING;
  private hideTime = 0;
  private readonly hideDuration = 5; // Seconds before coming out
  slideSpeed = 200;

  update(entity: Entity, delta: number): void {
    const pendulum = entity.getTrait<PendulumWalk>('pendulumWalk');

    switch (this.state) {
      case ShellState.HIDING:
        this.hideTime += delta;
        if (pendulum) pendulum.enabled = false;
        entity.vel.x = 0;

        if (this.hideTime >= this.hideDuration) {
          this.state = ShellState.WALKING;
          if (pendulum) pendulum.enabled = true;
        }
        break;

      case ShellState.SLIDING:
        if (pendulum) pendulum.enabled = false;
        // Velocity is set when kicked
        break;

      case ShellState.WALKING:
        if (pendulum) pendulum.enabled = true;
        break;
    }
  }

  hide(): void {
    this.state = ShellState.HIDING;
    this.hideTime = 0;
  }

  kick(_direction: Direction): void {
    this.state = ShellState.SLIDING;
  }

  isHiding(): boolean {
    return this.state === ShellState.HIDING;
  }

  isSliding(): boolean {
    return this.state === ShellState.SLIDING;
  }

  onTileCollide(entity: Entity, side: 'top' | 'bottom' | 'left' | 'right'): void {
    if (this.state === ShellState.SLIDING) {
      if (side === 'left' || side === 'right') {
        // Reverse direction when hitting wall
        entity.vel.x = -entity.vel.x;
      }
    }
  }
}

// BoredCop - Koopa equivalent
// An enemy that retreats into shell when stomped
export function createBoredCop(sprites?: SpriteSheet): Entity {
  const cop = new Entity();

  // Set size (taller than Buzzkill)
  cop.size = { x: 16, y: 24 };
  cop.offset = { x: 0, y: 0 };

  // Add traits
  const physics = new Physics();
  const solid = new Solid();
  const pendulumWalk = new PendulumWalk();
  const killable = new Killable();
  const shellBehavior = new ShellBehavior();

  pendulumWalk.speed = 20; // Slower than Buzzkill

  cop.addTrait(physics);
  cop.addTrait(solid);
  cop.addTrait(pendulumWalk);
  cop.addTrait(killable);
  cop.addTrait(shellBehavior);

  // Override kill to go into shell instead
  killable.kill = () => {
    if (shellBehavior.isHiding()) {
      // Already in shell - kick it
      shellBehavior.kick(Direction.RIGHT);
      cop.vel.x = 200;
    } else if (shellBehavior.isSliding()) {
      // Stop it
      shellBehavior.hide();
      cop.vel.x = 0;
    } else {
      // Go into shell
      shellBehavior.hide();
      cop.size.y = 16; // Shrink to shell size
    }
  };

  // Draw function
  cop.draw = (context: CanvasRenderingContext2D) => {
    const shell = cop.getTrait<ShellBehavior>('shellBehavior');
    const flip = pendulumWalk.direction === Direction.RIGHT;

    if (shell?.isHiding() || shell?.isSliding()) {
      drawShell(context, cop, shell.isSliding());
    } else if (sprites) {
      sprites.draw('boredcop', context, cop.pos.x, cop.pos.y, flip);
    } else {
      drawFallbackBoredCop(context, cop, flip);
    }
  };

  return cop;
}

function drawShell(
  context: CanvasRenderingContext2D,
  entity: Entity,
  sliding: boolean
): void {
  context.save();
  context.translate(entity.pos.x, entity.pos.y);

  // Shell body - blue
  context.fillStyle = sliding ? '#4169E1' : '#1E3A5F';
  context.fillRect(0, 0, 16, 16);

  // Shell pattern
  context.fillStyle = '#2E5A8F';
  context.fillRect(2, 2, 12, 2);
  context.fillRect(2, 6, 12, 2);
  context.fillRect(2, 10, 12, 2);

  context.restore();
}

function drawFallbackBoredCop(
  context: CanvasRenderingContext2D,
  entity: Entity,
  flip: boolean
): void {
  context.save();

  if (flip) {
    context.translate(entity.pos.x + entity.size.x, entity.pos.y);
    context.scale(-1, 1);
  } else {
    context.translate(entity.pos.x, entity.pos.y);
  }

  // Body - blue uniform
  context.fillStyle = '#1E3A5F';
  context.fillRect(0, 8, 16, 16);

  // Head
  context.fillStyle = '#FFD5B4';
  context.fillRect(2, 0, 12, 10);

  // Cap
  context.fillStyle = '#1E3A5F';
  context.fillRect(0, 0, 16, 4);

  // Eyes - bored expression
  context.fillStyle = '#fff';
  context.fillRect(4, 4, 3, 2);
  context.fillRect(9, 4, 3, 2);

  // Half-closed eyelids (bored look)
  context.fillStyle = '#FFD5B4';
  context.fillRect(4, 4, 3, 1);
  context.fillRect(9, 4, 3, 1);

  context.restore();
}
