import { Game } from './engine/Game';
import { Level } from './levels/Level';
import { createTestLevel, createLevel2 } from './levels/LevelLoader';
import { TitleScene } from './scenes/TitleScene';
import { LevelScene } from './scenes/LevelScene';
import { LevelIntroScene } from './scenes/LevelIntroScene';
import { GameOverScene } from './scenes/GameOverScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { getSmokyControls } from './entities/Smoky';
import { setupTouchControls } from './input/TouchControls';

// Main game controller
class SmokingBros {
  private game: Game;
  private touchControlsContainer: HTMLElement | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.game = new Game(canvas);
    this.touchControlsContainer = document.getElementById('touch-controls');
  }

  start(): void {
    this.showTitleScreen();
    this.game.start();
    console.log('Smoking Bros started!');
  }

  private showTitleScreen(): void {
    const titleScene = new TitleScene(this.game, () => {
      this.startLevel('1-1');
    });
    this.game.setScene(titleScene);
  }

  private startLevel(levelName: string): void {
    // Reset game state for new game or keep for continuing
    this.game.state.currentLevel = levelName;
    this.game.state.time = 400; // Reset timer for new level

    // Show level intro first
    const introScene = new LevelIntroScene(this.game, levelName, () => {
      // After intro, start the actual level
      this.startLevelGameplay(levelName);
    });
    this.game.setScene(introScene);
  }

  private startLevelGameplay(levelName: string): void {
    // Create level based on name
    const level = levelName === '1-2' ? createLevel2() : createTestLevel();

    // Create level scene
    const levelScene = new LevelScene(this.game, level, {
      onGameOver: () => this.showGameOver(),
      onLevelComplete: () => this.handleLevelComplete()
    });

    this.game.setScene(levelScene);

    // Setup touch controls if available
    this.setupTouchControlsForLevel(level);
  }

  private setupTouchControlsForLevel(level: Level): void {
    if (!this.touchControlsContainer) return;

    // Find player
    let player = null;
    for (const entity of level.entities) {
      if (entity.hasTrait('go') && entity.hasTrait('jump')) {
        player = entity;
        break;
      }
    }

    if (player) {
      const controls = getSmokyControls(player);
      setupTouchControls(this.touchControlsContainer, controls);
    }
  }

  private showGameOver(): void {
    const gameOverScene = new GameOverScene(
      this.game,
      this.game.state.score,
      () => {
        this.game.resetState();
        this.showTitleScreen();
      }
    );
    this.game.setScene(gameOverScene);
  }

  private handleLevelComplete(): void {
    this.game.addScore(5000); // Level completion bonus
    const currentLevel = this.game.state.currentLevel;

    const completeScene = new LevelCompleteScene(this.game, () => {
      if (currentLevel === '1-1') {
        // Progress to Level 1-2
        this.startLevel('1-2');
      } else {
        // All levels complete, return to title
        this.showTitleScreen();
      }
    });
    this.game.setScene(completeScene);
  }
}

// Bootstrap the game
async function main(): Promise<void> {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  const game = new SmokingBros(canvas);
  game.start();
}

// Run the game
main().catch(console.error);
