import { Entity } from '../engine/Entity';
import { Physics } from '../traits/Physics';
import { Jump } from '../traits/Jump';
import { Go } from '../traits/Go';
import { Solid } from '../traits/Solid';
import { Stomper } from '../traits/Stomper';
import { Killable } from '../traits/Killable';
import { PowerUp } from '../traits/PowerUp';
import { ChillMeter } from '../traits/ChillMeter';
import { SpriteSheet } from '../graphics/SpriteSheet';
import { Direction, PowerState, COLORS } from '../types';

// Helper to darken a color for star power
function darkenColor(hex: string): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 60);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 60);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 60);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function createSmoky(_sprites?: SpriteSheet): Entity {
  const smoky = new Entity();

  // Set size (Mario-like proportions)
  smoky.size = { x: 12, y: 16 };
  smoky.offset = { x: 2, y: 0 };

  // Add traits
  const physics = new Physics();
  const jump = new Jump();
  const go = new Go();
  const solid = new Solid();
  const stomper = new Stomper();
  const killable = new Killable();
  const powerUp = new PowerUp();
  const chillMeter = new ChillMeter();

  // Enable Mario-style death animation
  killable.deathAnimation = true;

  // Connect chill meter to movement traits
  go.setChillMeter(chillMeter);
  jump.setChillMeter(chillMeter);

  smoky.addTrait(physics);
  smoky.addTrait(jump);
  smoky.addTrait(go);
  smoky.addTrait(solid);
  smoky.addTrait(stomper);
  smoky.addTrait(killable);
  smoky.addTrait(powerUp);
  smoky.addTrait(chillMeter);

  // Animation frame tracking
  let animFrame = 0;
  let animTimer = 0;

  // Power state
  let powerState = PowerState.NORMAL;

  // Draw function
  smoky.draw = (context: CanvasRenderingContext2D) => {
    // Skip drawing if invisible (blinking during invincibility)
    if (!powerUp.visible) {
      return;
    }

    const flip = go.heading === Direction.LEFT;

    // Check if dying - draw death pose
    if (killable.isDying) {
      drawSmokyDeath(context, smoky);
      return;
    }

    // Update walk animation based on speed
    if (Math.abs(smoky.vel.x) > 10) {
      animTimer += Math.abs(smoky.vel.x) * 0.001;
      if (animTimer > 1) {
        animTimer = 0;
        animFrame = (animFrame + 1) % 3;
      }
    } else {
      animFrame = 0;
      animTimer = 0;
    }

    // Get star color for flashing effect
    const starColor = powerUp.hasStar ? powerUp.starColor : null;

    // Draw the character (big or small)
    if (powerUp.isBig) {
      drawBigSmoky(context, smoky, go, jump, flip, animFrame, starColor);
    } else {
      drawSmoky(context, smoky, go, jump, powerState, flip, animFrame, starColor);
    }
  };

  return smoky;
}

function drawSmoky(
  context: CanvasRenderingContext2D,
  entity: Entity,
  go: Go,
  jump: Jump,
  _powerState: PowerState,
  flip: boolean,
  animFrame: number,
  starColor: string | null = null
): void {
  context.save();

  const x = Math.floor(entity.pos.x);
  const y = Math.floor(entity.pos.y);

  if (flip) {
    context.translate(x + entity.size.x + entity.offset.x * 2, y);
    context.scale(-1, 1);
  } else {
    context.translate(x, y);
  }

  const w = entity.size.x + entity.offset.x * 2;
  const h = entity.size.y;

  // Determine pose and draw
  if (jump.isJumping) {
    drawJumping(context, w, h, starColor);
  } else if (go.skidding) {
    drawSkidding(context, w, h, starColor);
  } else if (Math.abs(entity.vel.x) > 10) {
    // Walking animation
    const walkFns = [
      (ctx: CanvasRenderingContext2D, pw: number, ph: number, color: string | null) => drawWalk1(ctx, pw, ph, color),
      (ctx: CanvasRenderingContext2D, pw: number, ph: number, color: string | null) => drawWalk2(ctx, pw, ph, color),
      (ctx: CanvasRenderingContext2D, pw: number, ph: number, color: string | null) => drawWalk3(ctx, pw, ph, color)
    ];
    walkFns[animFrame](context, w, h, starColor);
  } else {
    drawStanding(context, w, h, starColor);
  }

  context.restore();
}

// Standing pose - guy with joint
function drawStanding(ctx: CanvasRenderingContext2D, w: number, h: number, starColor: string | null = null): void {
  // Hair (brown/dark)
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(3, 0, w - 6, 3);
  ctx.fillRect(2, 1, 2, 2);
  ctx.fillRect(w - 4, 1, 2, 2);

  // Face/skin
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(3, 3, w - 6, 6);

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(4, 4, 3, 2);
  ctx.fillRect(9, 4, 3, 2);
  ctx.fillStyle = '#000';
  ctx.fillRect(5, 4, 2, 2);
  ctx.fillRect(10, 4, 2, 2);

  // Smile
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 7, 3, 1);

  // Joint/cigarette in mouth
  ctx.fillStyle = '#fff';
  ctx.fillRect(w - 2, 6, 5, 2);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(w + 2, 6, 1, 2); // ember

  // Green hoodie body (or star color)
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(2, 9, w - 4, 4);

  // Hoodie detail (darker shade of star color or normal)
  ctx.fillStyle = starColor ? darkenColor(starColor) : COLORS.SMOKY_DARK;
  ctx.fillRect(6, 9, 4, 4);

  // Pants (jeans)
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(3, 13, w - 6, 1);

  // Shoes
  ctx.fillStyle = '#333';
  ctx.fillRect(2, h - 2, 5, 2);
  ctx.fillRect(w - 7, h - 2, 5, 2);
}

// Walking pose 1 - guy with joint
function drawWalk1(ctx: CanvasRenderingContext2D, w: number, h: number, starColor: string | null = null): void {
  // Hair
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(3, 0, w - 6, 3);
  ctx.fillRect(2, 1, 2, 2);
  ctx.fillRect(w - 4, 1, 2, 2);

  // Face
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(3, 3, w - 6, 6);

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(4, 4, 3, 2);
  ctx.fillRect(9, 4, 3, 2);
  ctx.fillStyle = '#000';
  ctx.fillRect(5, 4, 2, 2);
  ctx.fillRect(10, 4, 2, 2);

  // Smile
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 7, 3, 1);

  // Joint
  ctx.fillStyle = '#fff';
  ctx.fillRect(w - 2, 6, 5, 2);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(w + 2, 6, 1, 2);

  // Green hoodie (or star color)
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(2, 9, w - 4, 4);
  ctx.fillStyle = starColor ? darkenColor(starColor) : COLORS.SMOKY_DARK;
  ctx.fillRect(6, 9, 4, 4);

  // Pants
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(3, 13, w - 6, 1);

  // Shoes - walking
  ctx.fillStyle = '#333';
  ctx.fillRect(0, h - 2, 5, 2);
  ctx.fillRect(w - 4, h - 3, 5, 2);
}

// Walking pose 2 - guy with joint
function drawWalk2(ctx: CanvasRenderingContext2D, w: number, h: number, starColor: string | null = null): void {
  // Hair
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(3, 0, w - 6, 3);
  ctx.fillRect(2, 1, 2, 2);
  ctx.fillRect(w - 4, 1, 2, 2);

  // Face
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(3, 3, w - 6, 6);

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(4, 4, 3, 2);
  ctx.fillRect(9, 4, 3, 2);
  ctx.fillStyle = '#000';
  ctx.fillRect(5, 4, 2, 2);
  ctx.fillRect(10, 4, 2, 2);

  // Smile
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 7, 3, 1);

  // Joint
  ctx.fillStyle = '#fff';
  ctx.fillRect(w - 2, 6, 5, 2);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(w + 2, 6, 1, 2);

  // Green hoodie (or star color)
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(2, 9, w - 4, 4);
  ctx.fillStyle = starColor ? darkenColor(starColor) : COLORS.SMOKY_DARK;
  ctx.fillRect(6, 9, 4, 4);

  // Pants
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(3, 13, w - 6, 1);

  // Shoes - together
  ctx.fillStyle = '#333';
  ctx.fillRect(3, h - 2, 4, 2);
  ctx.fillRect(w - 7, h - 2, 4, 2);
}

// Walking pose 3 - guy with joint
function drawWalk3(ctx: CanvasRenderingContext2D, w: number, h: number, starColor: string | null = null): void {
  // Hair
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(3, 0, w - 6, 3);
  ctx.fillRect(2, 1, 2, 2);
  ctx.fillRect(w - 4, 1, 2, 2);

  // Face
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(3, 3, w - 6, 6);

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(4, 4, 3, 2);
  ctx.fillRect(9, 4, 3, 2);
  ctx.fillStyle = '#000';
  ctx.fillRect(5, 4, 2, 2);
  ctx.fillRect(10, 4, 2, 2);

  // Smile
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 7, 3, 1);

  // Joint
  ctx.fillStyle = '#fff';
  ctx.fillRect(w - 2, 6, 5, 2);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(w + 2, 6, 1, 2);

  // Green hoodie (or star color)
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(2, 9, w - 4, 4);
  ctx.fillStyle = starColor ? darkenColor(starColor) : COLORS.SMOKY_DARK;
  ctx.fillRect(6, 9, 4, 4);

  // Pants
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(3, 13, w - 6, 1);

  // Shoes - other forward
  ctx.fillStyle = '#333';
  ctx.fillRect(w - 4, h - 2, 5, 2);
  ctx.fillRect(1, h - 3, 5, 2);
}

// Jumping pose - guy with joint
function drawJumping(ctx: CanvasRenderingContext2D, w: number, h: number, starColor: string | null = null): void {
  // Hair
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(3, 0, w - 6, 3);
  ctx.fillRect(2, 1, 2, 2);
  ctx.fillRect(w - 4, 1, 2, 2);

  // Face
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(3, 3, w - 6, 6);

  // Eyes - excited/looking up
  ctx.fillStyle = '#fff';
  ctx.fillRect(4, 3, 3, 3);
  ctx.fillRect(9, 3, 3, 3);
  ctx.fillStyle = '#000';
  ctx.fillRect(5, 3, 2, 2);
  ctx.fillRect(10, 3, 2, 2);

  // Open mouth (excited)
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 7, 3, 2);

  // Joint going up
  ctx.fillStyle = '#fff';
  ctx.fillRect(w - 1, 5, 4, 2);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(w + 2, 5, 1, 2);

  // Green hoodie (or star color)
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(2, 9, w - 4, 4);

  // Arms up!
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(0, 6, 3, 2);
  ctx.fillRect(w - 3, 6, 3, 2);
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(0, 8, 3, 3);
  ctx.fillRect(w - 3, 8, 3, 3);

  // Hoodie detail
  ctx.fillStyle = starColor ? darkenColor(starColor) : COLORS.SMOKY_DARK;
  ctx.fillRect(6, 9, 4, 4);

  // Pants
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(3, 13, w - 6, 1);

  // Shoes spread
  ctx.fillStyle = '#333';
  ctx.fillRect(1, h - 2, 4, 2);
  ctx.fillRect(w - 5, h - 2, 4, 2);
}

// Skidding pose (turning around) - guy with joint
function drawSkidding(ctx: CanvasRenderingContext2D, w: number, h: number, starColor: string | null = null): void {
  // Hair - messy from skidding
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(4, 0, w - 7, 3);
  ctx.fillRect(3, 1, 2, 2);
  ctx.fillRect(w - 4, 0, 3, 2);

  // Face - leaning back
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(4, 3, w - 7, 6);

  // Eyes - surprised/worried
  ctx.fillStyle = '#fff';
  ctx.fillRect(5, 3, 3, 3);
  ctx.fillRect(10, 3, 3, 3);
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 4, 2, 2);
  ctx.fillRect(11, 4, 2, 2);

  // Worried mouth
  ctx.fillStyle = '#000';
  ctx.fillRect(7, 7, 2, 1);

  // Joint almost falling
  ctx.fillStyle = '#fff';
  ctx.fillRect(w - 1, 7, 4, 2);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(w + 2, 7, 1, 2);

  // Green hoodie - leaning (or star color)
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(3, 9, w - 5, 4);
  ctx.fillStyle = starColor ? darkenColor(starColor) : COLORS.SMOKY_DARK;
  ctx.fillRect(6, 9, 4, 4);

  // Pants
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(4, 13, w - 7, 1);

  // Dust cloud effect
  ctx.fillStyle = '#ccc';
  ctx.fillRect(0, h - 4, 3, 2);
  ctx.fillRect(1, h - 6, 2, 2);

  // Shoes - braking
  ctx.fillStyle = '#333';
  ctx.fillRect(4, h - 2, 5, 2);
  ctx.fillRect(w - 5, h - 2, 4, 2);
}

// Big Smoky drawing function (when powered up)
function drawBigSmoky(
  context: CanvasRenderingContext2D,
  entity: Entity,
  go: Go,
  jump: Jump,
  flip: boolean,
  animFrame: number,
  starColor: string | null = null
): void {
  context.save();

  const x = Math.floor(entity.pos.x);
  const y = Math.floor(entity.pos.y);

  if (flip) {
    context.translate(x + entity.size.x + entity.offset.x * 2, y);
    context.scale(-1, 1);
  } else {
    context.translate(x, y);
  }

  const w = 16; // Wider
  const h = 28; // Taller

  // Determine pose and draw
  if (jump.isJumping) {
    drawBigJumping(context, w, h, starColor);
  } else if (go.skidding) {
    drawBigSkidding(context, w, h, starColor);
  } else if (Math.abs(entity.vel.x) > 10) {
    // Walking animation
    const walkFns = [
      (ctx: CanvasRenderingContext2D, pw: number, ph: number, color: string | null) => drawBigWalk1(ctx, pw, ph, color),
      (ctx: CanvasRenderingContext2D, pw: number, ph: number, color: string | null) => drawBigWalk2(ctx, pw, ph, color),
      (ctx: CanvasRenderingContext2D, pw: number, ph: number, color: string | null) => drawBigWalk3(ctx, pw, ph, color)
    ];
    walkFns[animFrame](context, w, h, starColor);
  } else {
    drawBigStanding(context, w, h, starColor);
  }

  context.restore();
}

// Big standing pose - guy with joint (powered up)
function drawBigStanding(ctx: CanvasRenderingContext2D, w: number, h: number, starColor: string | null = null): void {
  // Hair
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(4, 0, w - 8, 4);
  ctx.fillRect(3, 2, 2, 3);
  ctx.fillRect(w - 5, 2, 2, 3);

  // Face
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(3, 5, w - 6, 8);

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(4, 6, 4, 3);
  ctx.fillRect(10, 6, 4, 3);
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 7, 2, 2);
  ctx.fillRect(12, 7, 2, 2);

  // Smile
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 10, 4, 1);

  // Joint
  ctx.fillStyle = '#fff';
  ctx.fillRect(w - 1, 9, 6, 2);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(w + 4, 9, 1, 2);

  // Green hoodie (or star color)
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(2, 13, w - 4, 6);
  ctx.fillStyle = starColor ? darkenColor(starColor) : COLORS.SMOKY_DARK;
  ctx.fillRect(6, 13, 4, 5);

  // Pants
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(3, 19, w - 6, 5);

  // Shoes
  ctx.fillStyle = '#333';
  ctx.fillRect(2, h - 4, 6, 4);
  ctx.fillRect(w - 8, h - 4, 6, 4);
}

// Big walking poses - guy with joint
function drawBigWalk1(ctx: CanvasRenderingContext2D, w: number, h: number, starColor: string | null = null): void {
  // Hair
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(4, 0, w - 8, 4);
  ctx.fillRect(3, 2, 2, 3);
  ctx.fillRect(w - 5, 2, 2, 3);

  // Face
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(3, 5, w - 6, 8);

  ctx.fillStyle = '#fff';
  ctx.fillRect(4, 6, 4, 3);
  ctx.fillRect(10, 6, 4, 3);
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 7, 2, 2);
  ctx.fillRect(12, 7, 2, 2);
  ctx.fillRect(6, 10, 4, 1);

  // Joint
  ctx.fillStyle = '#fff';
  ctx.fillRect(w - 1, 9, 6, 2);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(w + 4, 9, 1, 2);

  // Green hoodie (or star color)
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(2, 13, w - 4, 6);
  ctx.fillStyle = starColor ? darkenColor(starColor) : COLORS.SMOKY_DARK;
  ctx.fillRect(6, 13, 4, 5);

  // Pants - walking
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(1, 19, 6, 5);
  ctx.fillRect(w - 5, 20, 5, 4);

  ctx.fillStyle = '#333';
  ctx.fillRect(0, h - 4, 6, 4);
  ctx.fillRect(w - 4, h - 3, 5, 3);
}

function drawBigWalk2(ctx: CanvasRenderingContext2D, w: number, h: number, starColor: string | null = null): void {
  // Hair
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(4, 0, w - 8, 4);
  ctx.fillRect(3, 2, 2, 3);
  ctx.fillRect(w - 5, 2, 2, 3);

  // Face
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(3, 5, w - 6, 8);

  ctx.fillStyle = '#fff';
  ctx.fillRect(4, 6, 4, 3);
  ctx.fillRect(10, 6, 4, 3);
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 7, 2, 2);
  ctx.fillRect(12, 7, 2, 2);
  ctx.fillRect(6, 10, 4, 1);

  // Joint
  ctx.fillStyle = '#fff';
  ctx.fillRect(w - 1, 9, 6, 2);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(w + 4, 9, 1, 2);

  // Green hoodie (or star color)
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(2, 13, w - 4, 6);
  ctx.fillStyle = starColor ? darkenColor(starColor) : COLORS.SMOKY_DARK;
  ctx.fillRect(6, 13, 4, 5);

  // Pants - together
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(4, 19, 4, 5);
  ctx.fillRect(w - 8, 19, 4, 5);

  ctx.fillStyle = '#333';
  ctx.fillRect(3, h - 4, 5, 4);
  ctx.fillRect(w - 8, h - 4, 5, 4);
}

function drawBigWalk3(ctx: CanvasRenderingContext2D, w: number, h: number, starColor: string | null = null): void {
  // Hair
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(4, 0, w - 8, 4);
  ctx.fillRect(3, 2, 2, 3);
  ctx.fillRect(w - 5, 2, 2, 3);

  // Face
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(3, 5, w - 6, 8);

  ctx.fillStyle = '#fff';
  ctx.fillRect(4, 6, 4, 3);
  ctx.fillRect(10, 6, 4, 3);
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 7, 2, 2);
  ctx.fillRect(12, 7, 2, 2);
  ctx.fillRect(6, 10, 4, 1);

  // Joint
  ctx.fillStyle = '#fff';
  ctx.fillRect(w - 1, 9, 6, 2);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(w + 4, 9, 1, 2);

  // Green hoodie (or star color)
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(2, 13, w - 4, 6);
  ctx.fillStyle = starColor ? darkenColor(starColor) : COLORS.SMOKY_DARK;
  ctx.fillRect(6, 13, 4, 5);

  // Pants - walking reversed
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(w - 6, 19, 5, 5);
  ctx.fillRect(2, 20, 5, 4);

  ctx.fillStyle = '#333';
  ctx.fillRect(w - 5, h - 4, 6, 4);
  ctx.fillRect(1, h - 3, 5, 3);
}

// Big jumping pose - guy with joint
function drawBigJumping(ctx: CanvasRenderingContext2D, w: number, h: number, starColor: string | null = null): void {
  // Hair
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(4, 0, w - 8, 4);
  ctx.fillRect(3, 2, 2, 3);
  ctx.fillRect(w - 5, 2, 2, 3);

  // Face
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(3, 5, w - 6, 8);

  // Excited eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(4, 5, 4, 4);
  ctx.fillRect(10, 5, 4, 4);
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 5, 2, 2);
  ctx.fillRect(12, 5, 2, 2);

  // Open mouth (yay!)
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 10, 4, 2);

  // Joint going up
  ctx.fillStyle = '#fff';
  ctx.fillRect(w, 7, 5, 2);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(w + 4, 7, 1, 2);

  // Arms up - skin
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(0, 7, 3, 3);
  ctx.fillRect(w - 3, 7, 3, 3);

  // Green hoodie (or star color)
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(2, 13, w - 4, 6);
  ctx.fillRect(0, 10, 3, 4);
  ctx.fillRect(w - 3, 10, 3, 4);
  ctx.fillStyle = starColor ? darkenColor(starColor) : COLORS.SMOKY_DARK;
  ctx.fillRect(6, 13, 4, 5);

  // Pants - spread
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(1, 19, 5, 5);
  ctx.fillRect(w - 6, 19, 5, 5);

  ctx.fillStyle = '#333';
  ctx.fillRect(0, h - 3, 5, 3);
  ctx.fillRect(w - 5, h - 3, 5, 3);
}

// Big skidding pose - guy with joint
function drawBigSkidding(ctx: CanvasRenderingContext2D, w: number, h: number, starColor: string | null = null): void {
  // Hair - messy
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(5, 0, w - 9, 4);
  ctx.fillRect(4, 2, 2, 3);
  ctx.fillRect(w - 4, 1, 3, 3);

  // Face - leaning
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(4, 5, w - 7, 8);

  // Worried eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(5, 6, 4, 4);
  ctx.fillRect(11, 6, 4, 4);
  ctx.fillStyle = '#000';
  ctx.fillRect(7, 7, 2, 2);
  ctx.fillRect(13, 7, 2, 2);

  // Worried mouth
  ctx.fillStyle = '#000';
  ctx.fillRect(7, 11, 3, 1);

  // Joint almost falling
  ctx.fillStyle = '#fff';
  ctx.fillRect(w, 10, 5, 2);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(w + 4, 10, 1, 2);

  // Green hoodie - leaning (or star color)
  ctx.fillStyle = starColor || COLORS.SMOKY_GREEN;
  ctx.fillRect(3, 13, w - 5, 6);
  ctx.fillStyle = starColor ? darkenColor(starColor) : COLORS.SMOKY_DARK;
  ctx.fillRect(6, 13, 4, 5);

  // Dust
  ctx.fillStyle = '#ccc';
  ctx.fillRect(0, h - 6, 4, 3);
  ctx.fillRect(1, h - 9, 3, 3);

  // Pants
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(4, 19, 5, 5);
  ctx.fillRect(w - 6, 19, 5, 5);

  ctx.fillStyle = '#333';
  ctx.fillRect(4, h - 4, 6, 4);
  ctx.fillRect(w - 6, h - 4, 5, 4);
}

// Death pose - guy with joint falling
function drawSmokyDeath(ctx: CanvasRenderingContext2D, entity: Entity): void {
  ctx.save();

  const x = Math.floor(entity.pos.x);
  const y = Math.floor(entity.pos.y);
  const w = entity.size.x + entity.offset.x * 2;
  const h = entity.size.y;

  ctx.translate(x, y);

  // Hair - messy
  ctx.fillStyle = '#4a3728';
  ctx.fillRect(3, 0, w - 6, 3);
  ctx.fillRect(2, 1, 2, 3);
  ctx.fillRect(w - 4, 1, 3, 2);

  // Face
  ctx.fillStyle = '#e8b88a';
  ctx.fillRect(3, 3, w - 6, 6);

  // X eyes (knocked out)
  ctx.fillStyle = '#000';
  ctx.fillRect(4, 4, 1, 1);
  ctx.fillRect(6, 4, 1, 1);
  ctx.fillRect(5, 5, 1, 1);
  ctx.fillRect(4, 6, 1, 1);
  ctx.fillRect(6, 6, 1, 1);

  ctx.fillRect(9, 4, 1, 1);
  ctx.fillRect(11, 4, 1, 1);
  ctx.fillRect(10, 5, 1, 1);
  ctx.fillRect(9, 6, 1, 1);
  ctx.fillRect(11, 6, 1, 1);

  // Open sad mouth
  ctx.fillStyle = '#000';
  ctx.fillRect(6, 7, 3, 2);

  // Joint falling away
  ctx.fillStyle = '#fff';
  ctx.fillRect(w + 1, 8, 3, 2);

  // Green hoodie
  ctx.fillStyle = COLORS.SMOKY_GREEN;
  ctx.fillRect(2, 9, w - 4, 4);
  ctx.fillStyle = COLORS.SMOKY_DARK;
  ctx.fillRect(6, 9, 4, 4);

  // Pants
  ctx.fillStyle = '#3d5c94';
  ctx.fillRect(3, 13, w - 6, 1);

  // Shoes dangling
  ctx.fillStyle = '#333';
  ctx.fillRect(2, h - 2, 4, 2);
  ctx.fillRect(w - 6, h - 2, 4, 2);

  ctx.restore();
}

// Helper to get traits for input binding
export function getSmokyControls(smoky: Entity): {
  go: Go;
  jump: Jump;
} {
  const go = smoky.getTrait<Go>('go');
  const jump = smoky.getTrait<Jump>('jump');

  if (!go || !jump) {
    throw new Error('Smoky missing required traits');
  }

  return { go, jump };
}
