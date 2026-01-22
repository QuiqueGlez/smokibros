import type { Game } from './Game';

export abstract class Scene {
  protected game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  // Called when scene becomes active
  enter(): void {
    // Override in subclasses
  }

  // Called when scene is deactivated
  exit(): void {
    // Override in subclasses
  }

  // Called every fixed update
  abstract update(delta: number): void;

  // Called to render the scene
  abstract draw(context: CanvasRenderingContext2D): void;
}
