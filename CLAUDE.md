# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smoking Bros is a Super Mario Bros-style 2D platformer built with TypeScript and vanilla Canvas2D (no game framework). The player character "Smoky" collects filters, stomps enemies, and uses smoking-themed power-ups across multiple levels.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server with hot reload
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build locally
```

No test runner or linter is configured. TypeScript strict mode (`strict: true`, `noUnusedLocals`, `noUnusedParameters`) serves as the primary code quality check.

## Architecture

### Entity-Trait Composition System

The core architecture uses **trait-based composition** rather than class inheritance:

- **Entity** (`src/engine/Entity.ts`): Data container holding position, velocity, size, and a map of Trait instances.
- **Trait** (`src/engine/Trait.ts`): Abstract behavior component with `update(entity, delta, level)`, `onTileCollide()`, and `onEntityCollide()` hooks.
- Entities are built by composing traits (e.g., Smoky has Physics + Jump + Go + Solid + Stomper + Killable + PowerUp + ChillMeter).

### Game Loop

`Timer.ts` implements a fixed 60 FPS timestep with an accumulator pattern. Each frame: Scene.update(delta) → entity trait updates → collision detection → Scene.draw().

### Scene State Machine

`Game.ts` manages scene transitions between: TitleScene → LevelIntroScene → LevelScene → GameOverScene. Game-wide state (lives, score, filters, power state) lives on the Game instance.

### Physics & Collision

- **Movement** (`Go` trait): Mario-like acceleration/deceleration with distinct walk/run speeds, air control at 65%, and skid deceleration.
- **Jumping** (`Jump` trait): Variable-height jumps via gravity switching (holding jump = 900 px/s², falling = 2400 px/s²). Includes coyote time (80ms) and jump buffering (100ms).
- **Tile collisions**: `TileResolver` does O(1) grid-based lookups. Entities query bounding box regions against the tile grid.
- **Entity collisions**: `EntityCollider` uses AABB bounding box checks.

### Rendering

- Canvas renders at 256×256 NES-style resolution, scaled to fit screen with `imageSmoothingEnabled: false`.
- All sprites are procedurally drawn via Canvas2D `fillRect()` calls (no image assets).
- Camera uses deadzone following (80px left, 160px right) clamped to level bounds.
- `ParticleSystem` handles smoke puffs, sparkles, speed trails, and landing dust.

### Level System

Levels are JSON files in `public/levels/` (1-1.json through 1-4.json). `LevelLoader.ts` parses these into tile grids and entity placements.

### Input

`KeyboardState.ts` handles desktop input (arrows/WASD + space/shift). `TouchControls.ts` provides mobile on-screen buttons, hidden on desktop.

### Chill Meter

A unique mechanic tracked by the `ChillMeter` trait: fills 0-100% from collecting filters and stomping enemies, providing speed (up to 1.3×) and jump (up to 1.2×) multipliers.

## Key Types & Constants

- Power states: NORMAL, COLOCADO (big), PREMIUM (star/invincibility)
- Player sizes: 12×16 (small), 16×28 (big)
- Global types and constants are in `src/types.ts`

## Dependencies

Zero runtime dependencies. Dev dependencies are only TypeScript 5.3.3 and Vite 5.0.10.
