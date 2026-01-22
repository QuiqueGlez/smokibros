import { Level } from './Level';
import { loadJSON } from '../engine/Loader';
import { createSmoky } from '../entities/Smoky';
import { createBuzzkill } from '../entities/Buzzkill';
import { createKoopa } from '../entities/Koopa';
import { createKaren } from '../entities/Karen';
import { createPiranhaPlant } from '../entities/PiranhaPlant';
import { createFlagPole } from '../entities/FlagPole';
import { SpriteSheet } from '../graphics/SpriteSheet';
import type { LevelData, EntitySpawn } from '../types';

export async function loadLevelData(name: string): Promise<LevelData> {
  return loadJSON<LevelData>(`/levels/${name}.json`);
}

export function createLevel(data: LevelData, _sprites?: SpriteSheet): Level {
  const level = new Level(data.name, data.tiles);
  return level;
}

export function spawnEntities(
  level: Level,
  spawns: EntitySpawn[],
  sprites?: SpriteSheet
): Map<string, ReturnType<typeof createSmoky>> {
  const entityMap = new Map<string, ReturnType<typeof createSmoky>>();

  for (const spawn of spawns) {
    switch (spawn.type) {
      case 'smoky': {
        const smoky = createSmoky(sprites);
        smoky.pos.x = spawn.x;
        smoky.pos.y = spawn.y;
        level.addEntity(smoky);
        entityMap.set('smoky', smoky);
        break;
      }
      default:
        console.warn(`Unknown entity type: ${spawn.type}`);
    }
  }

  return entityMap;
}

// Create a level based on Super Mario Bros 1-1
// SMB 1-1 structure: https://www.mariowiki.com/World_1-1_(Super_Mario_Bros.)
export function createTestLevel(): Level {
  const LEVEL_WIDTH = 212;  // SMB 1-1 is about 212 tiles wide
  const tiles: number[][] = [];

  // Initialize with air (15 rows, LEVEL_WIDTH columns)
  for (let y = 0; y < 15; y++) {
    tiles.push(new Array(LEVEL_WIDTH).fill(0));
  }

  // Helper to set ground tiles
  const setGround = (startX: number, endX: number) => {
    for (let x = startX; x <= endX; x++) {
      tiles[13][x] = 1;  // Ground row
      tiles[14][x] = 1;  // Below ground
    }
  };

  // Ground with pits
  // Pit 1: tiles 69-70 (before pyramid with gap)
  // Pit 2: tiles 86-88 (pit in pyramid area)
  // Pit 3: tiles 153-155 (late game pit)
  setGround(0, 68);
  setGround(71, 85);
  setGround(89, 152);
  setGround(156, LEVEL_WIDTH - 1);

  // ============================================
  // SECTION 1: Start area (tiles 0-20)
  // ============================================

  // First ? block alone (tile 16, row 9)
  tiles[9][16] = 3;

  // ============================================
  // SECTION 2: First block formation (tiles 20-24)
  // Pyramid: brick, ?, brick, ?, brick (row 9)
  // With ? block above middle (row 5)
  // ============================================
  tiles[9][20] = 2;  // brick
  tiles[9][21] = 3;  // ? (coin)
  tiles[9][22] = 2;  // brick
  tiles[9][23] = 3;  // ? (MUSHROOM - first power-up!)
  tiles[9][24] = 2;  // brick

  // ============================================
  // SECTION 3: Four pipes of increasing height (tiles 28-45)
  // Pipe 1: 2 tiles tall (tiles 28-29)
  // Pipe 2: 3 tiles tall (tiles 38-39)
  // Pipe 3: 4 tiles tall (tiles 46-47) - has piranha plant
  // Pipe 4: 4 tiles tall (tiles 57-58) - has piranha plant
  // ============================================

  // Pipe 1 (small, 2 tiles) at x=28
  tiles[12][28] = 4; tiles[12][29] = 5;  // top
  tiles[13][28] = 6; tiles[13][29] = 7;  // body (overlaps ground)

  // Pipe 2 (medium, 3 tiles) at x=38
  tiles[11][38] = 4; tiles[11][39] = 5;  // top
  tiles[12][38] = 6; tiles[12][39] = 7;  // body
  tiles[13][38] = 6; tiles[13][39] = 7;  // body

  // Pipe 3 (tall, 4 tiles) at x=46 - with piranha
  tiles[10][46] = 4; tiles[10][47] = 5;  // top
  tiles[11][46] = 6; tiles[11][47] = 7;  // body
  tiles[12][46] = 6; tiles[12][47] = 7;  // body
  tiles[13][46] = 6; tiles[13][47] = 7;  // body

  // Pipe 4 (tall, 4 tiles) at x=57 - with piranha
  tiles[10][57] = 4; tiles[10][58] = 5;  // top
  tiles[11][57] = 6; tiles[11][58] = 7;  // body
  tiles[12][57] = 6; tiles[12][58] = 7;  // body
  tiles[13][57] = 6; tiles[13][58] = 7;  // body

  // ============================================
  // SECTION 4: Hidden 1-up block (tile 64, row 9)
  // ============================================
  tiles[9][64] = 9;  // INVISIBLE block with mushroom

  // ============================================
  // SECTION 5: After pit - ? block (tile 78)
  // ============================================
  tiles[9][78] = 3;  // ? with power-up

  // ============================================
  // SECTION 6: Elevated brick row with enemies below (tiles 80-88)
  // Long row of bricks at row 5 (higher up)
  // ============================================
  for (let x = 80; x <= 88; x++) {
    tiles[5][x] = 2;  // bricks up high
  }
  tiles[5][84] = 3;  // ? block in the middle

  // ============================================
  // SECTION 7: 10-coin brick and Starman area (tiles 94-100)
  // ============================================
  tiles[9][94] = 2;  // 10-coin brick (special)
  tiles[9][100] = 2; // brick
  tiles[9][101] = 2; // brick with STARMAN

  // ============================================
  // SECTION 8: ? block triangle formation (tiles 106-110)
  // Bottom row: ?, brick, ?
  // Top: ? (with power-up)
  // ============================================
  tiles[9][106] = 3;  // ? (coin)
  tiles[9][107] = 2;  // brick
  tiles[9][108] = 3;  // ? (coin)
  tiles[5][107] = 3;  // ? up high (power-up)

  // ============================================
  // SECTION 9: More blocks and enemies (tiles 118-130)
  // ============================================
  tiles[9][118] = 2;  // brick
  tiles[9][119] = 3;  // ?
  tiles[9][120] = 2;  // brick
  tiles[9][121] = 2;  // brick
  tiles[9][122] = 3;  // ?
  tiles[9][123] = 2;  // brick

  // ============================================
  // SECTION 10: First pyramid with gap (tiles 134-142)
  // Stairs up, gap, stairs down
  // ============================================
  // Stairs up (4 tiles)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j <= i; j++) {
      tiles[12 - j][134 + i] = 1;
    }
  }
  // Gap at 138-139
  // Stairs down (4 tiles)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j <= 3 - i; j++) {
      tiles[12 - j][140 + i] = 1;
    }
  }

  // ============================================
  // SECTION 11: Second pyramid with pit (tiles 148-158)
  // Stairs up, pit, stairs down
  // (pit is at 153-155 in ground)
  // ============================================
  // Stairs up
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j <= i; j++) {
      tiles[12 - j][148 + i] = 1;
    }
  }
  // Stairs down (after pit)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j <= 3 - i; j++) {
      tiles[12 - j][156 + i] = 1;
    }
  }

  // ============================================
  // SECTION 12: Exit pipe from bonus (tile 163)
  // ============================================
  tiles[11][163] = 4; tiles[11][164] = 5;
  tiles[12][163] = 6; tiles[12][164] = 7;
  tiles[13][163] = 6; tiles[13][164] = 7;

  // ============================================
  // SECTION 13: Four blocks (tiles 170-173)
  // 3 bricks + 1 ?
  // ============================================
  tiles[9][170] = 2;
  tiles[9][171] = 2;
  tiles[9][172] = 3;  // ? with coin
  tiles[9][173] = 2;

  // ============================================
  // SECTION 14: Final pipe (tile 179)
  // ============================================
  tiles[11][179] = 4; tiles[11][180] = 5;
  tiles[12][179] = 6; tiles[12][180] = 7;
  tiles[13][179] = 6; tiles[13][180] = 7;

  // ============================================
  // SECTION 15: Final staircase (tiles 185-193)
  // 8 tiles going up
  // ============================================
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j <= i; j++) {
      tiles[12 - j][185 + i] = 1;
    }
  }

  // Ground after flagpole (tiles 198+)
  for (let x = 198; x < LEVEL_WIDTH; x++) {
    tiles[12][x] = 1;
  }

  // ============================================
  // Create level and set block contents
  // ============================================
  const level = new Level('1-1', tiles);

  // Block contents - Now with Smoking Paper power-ups!
  level.setBlockContent(16, 9, 'coin');          // First ? block
  level.setBlockContent(21, 9, 'coin');          // Formation ?
  level.setBlockContent(23, 9, 'green');         // Green Paper - grow!
  level.setBlockContent(64, 9, 'green');         // Hidden Green Paper
  level.setBlockContent(78, 9, 'green');         // ? after pit
  level.setBlockContent(84, 5, 'brown');         // Brown Paper - speed boost!
  // 94 = 10-coin brick (could add special handling later)
  level.setBlockContent(101, 9, 'gold');         // Gold Paper - invincibility!
  level.setBlockContent(106, 9, 'coin');
  level.setBlockContent(107, 5, 'green');        // Triangle top - Green Paper
  level.setBlockContent(108, 9, 'coin');
  level.setBlockContent(119, 9, 'brown');        // Another Brown Paper
  level.setBlockContent(122, 9, 'coin');
  level.setBlockContent(172, 9, 'coin');

  // ============================================
  // Add player
  // ============================================
  const smoky = createSmoky();
  smoky.pos.x = 48;
  smoky.pos.y = 192;
  level.addEntity(smoky);

  // ============================================
  // Add enemies (Buzzkills - Goombas)
  // SMB 1-1 has Goombas at specific locations
  // ============================================

  // First Goomba (early in level)
  const goomba1 = createBuzzkill();
  goomba1.pos.x = 22 * 16;  // tile 22
  goomba1.pos.y = 192;
  level.addEntity(goomba1);

  // Goombas between pipes
  const goomba2 = createBuzzkill();
  goomba2.pos.x = 33 * 16;
  goomba2.pos.y = 192;
  level.addEntity(goomba2);

  const goomba3 = createBuzzkill();
  goomba3.pos.x = 42 * 16;
  goomba3.pos.y = 192;
  level.addEntity(goomba3);

  // Pair of Goombas after pipes
  const goomba4 = createBuzzkill();
  goomba4.pos.x = 51 * 16;
  goomba4.pos.y = 192;
  level.addEntity(goomba4);

  const goomba5 = createBuzzkill();
  goomba5.pos.x = 52 * 16 + 8;
  goomba5.pos.y = 192;
  level.addEntity(goomba5);

  // Goombas under elevated bricks
  const goomba6 = createBuzzkill();
  goomba6.pos.x = 82 * 16;
  goomba6.pos.y = 192;
  level.addEntity(goomba6);

  const goomba7 = createBuzzkill();
  goomba7.pos.x = 83 * 16 + 8;
  goomba7.pos.y = 192;
  level.addEntity(goomba7);

  // Goombas after Koopa area
  const goomba8 = createBuzzkill();
  goomba8.pos.x = 97 * 16;
  goomba8.pos.y = 192;
  level.addEntity(goomba8);

  const goomba9 = createBuzzkill();
  goomba9.pos.x = 98 * 16 + 8;
  goomba9.pos.y = 192;
  level.addEntity(goomba9);

  // Goombas near pyramids
  const goomba10 = createBuzzkill();
  goomba10.pos.x = 114 * 16;
  goomba10.pos.y = 192;
  level.addEntity(goomba10);

  const goomba11 = createBuzzkill();
  goomba11.pos.x = 115 * 16 + 8;
  goomba11.pos.y = 192;
  level.addEntity(goomba11);

  // Goombas before exit pipe
  const goomba12 = createBuzzkill();
  goomba12.pos.x = 167 * 16;
  goomba12.pos.y = 192;
  level.addEntity(goomba12);

  const goomba13 = createBuzzkill();
  goomba13.pos.x = 168 * 16 + 8;
  goomba13.pos.y = 192;
  level.addEntity(goomba13);

  // ============================================
  // Add Koopa (turtle enemy)
  // SMB 1-1 has one Koopa after the triangle formation
  // ============================================
  const koopa1 = createKoopa();
  koopa1.pos.x = 107 * 16;
  koopa1.pos.y = 184;
  level.addEntity(koopa1);

  // ============================================
  // Add Karens (the "I want to speak to your manager" enemies)
  // They yell at the player and reduce chill!
  // ============================================
  const karen1 = createKaren();
  karen1.pos.x = 60 * 16;  // After the pipes
  karen1.pos.y = 192;
  level.addEntity(karen1);

  const karen2 = createKaren();
  karen2.pos.x = 130 * 16;  // Near the pyramids
  karen2.pos.y = 192;
  level.addEntity(karen2);

  const karen3 = createKaren();
  karen3.pos.x = 175 * 16;  // Near the end
  karen3.pos.y = 192;
  level.addEntity(karen3);

  // ============================================
  // Add Piranha Plants to tall pipes
  // ============================================
  // Pipe 3 at tile 46 (pipeY = 10 * 16 = 160)
  const plant1 = createPiranhaPlant(46 * 16, 10 * 16);
  level.addEntity(plant1);

  // Pipe 4 at tile 57 (pipeY = 10 * 16 = 160)
  const plant2 = createPiranhaPlant(57 * 16, 10 * 16);
  level.addEntity(plant2);

  // ============================================
  // Add flag pole at end of level
  // Position after final staircase (tile 198)
  // ============================================
  const flagPole = createFlagPole(198 * 16, 12 * 16);
  level.addEntity(flagPole);

  return level;
}
