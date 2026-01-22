// Game constants
export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 240;
export const TILE_SIZE = 16;

// NES Mario color palette (authentic colors)
export const COLORS = {
  // Sky and background
  SKY_BLUE: '#5c94fc',

  // Ground and bricks
  BRICK_ORANGE: '#c84c0c',
  BRICK_DARK: '#a82800',
  BRICK_LIGHT: '#fc9838',

  // Question blocks
  QUESTION_ORANGE: '#fca044',
  QUESTION_DARK: '#c84c0c',
  QUESTION_LIGHT: '#fcbcb0',

  // Ground blocks
  GROUND_BROWN: '#c84c0c',
  GROUND_DARK: '#a82800',

  // Pipes
  PIPE_GREEN: '#00a800',
  PIPE_DARK: '#005800',
  PIPE_LIGHT: '#74b474',

  // Player (Smoky - red theme for Smoking Paper brand)
  SMOKY_GREEN: '#C41E3A',      // Crimson red (main)
  SMOKY_LIGHT: '#FF6B6B',      // Light red
  SMOKY_DARK: '#8B0000',       // Dark red

  // Coins/Filters
  GOLD: '#fc9838',
  GOLD_LIGHT: '#fcbcb0',

  // Used block
  BLOCK_BROWN: '#a84000',

  // Hills and bushes (background)
  HILL_GREEN: '#00a800',
  HILL_DARK: '#008000',
  BUSH_GREEN: '#00a800',

  // Clouds
  CLOUD_WHITE: '#fcfcfc',
  CLOUD_SHADOW: '#b8d0d0'
} as const;

// Vector type
export interface Vec2 {
  x: number;
  y: number;
}

// Bounding box
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Tile types
export enum TileType {
  AIR = 0,
  GROUND = 1,
  BRICK = 2,
  QUESTION = 3,
  PIPE_TOP_LEFT = 4,
  PIPE_TOP_RIGHT = 5,
  PIPE_LEFT = 6,
  PIPE_RIGHT = 7,
  BLOCK = 8,
  INVISIBLE = 9  // Hidden block - only visible when hit from below
}

// Entity types
export type EntityType = 'smoky' | 'buzzkill' | 'boredcop' | 'filter' | 'grinder' | 'goldpaper' | 'cone';

// Power states
export enum PowerState {
  NORMAL = 'normal',
  COLOCADO = 'colocado',  // Big state
  PREMIUM = 'premium'      // Can shoot
}

// Direction
export enum Direction {
  LEFT = -1,
  RIGHT = 1
}

// Game state
export interface GameState {
  lives: number;
  score: number;
  filters: number;
  chillMeter: number;
  powerState: PowerState;
  currentLevel: string;
  time: number;
}

// Level data structure
export interface LevelData {
  name: string;
  width: number;
  height: number;
  tiles: number[][];
  entities: EntitySpawn[];
  background: string;
}

export interface EntitySpawn {
  type: EntityType;
  x: number;
  y: number;
}

// Collision sides
export interface CollisionSides {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}
