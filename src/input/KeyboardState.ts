type KeyCallback = (pressed: boolean) => void;

export class KeyboardState {
  private keyStates = new Map<string, boolean>();
  private keyCallbacks = new Map<string, KeyCallback>();

  constructor() {
    window.addEventListener('keydown', (event) => this.handleKey(event, true));
    window.addEventListener('keyup', (event) => this.handleKey(event, false));
  }

  private handleKey(event: KeyboardEvent, pressed: boolean): void {
    const key = event.code;

    // Prevent default for game keys
    if (this.keyCallbacks.has(key)) {
      event.preventDefault();
    }

    // Only trigger callback on state change
    if (this.keyStates.get(key) !== pressed) {
      this.keyStates.set(key, pressed);

      const callback = this.keyCallbacks.get(key);
      if (callback) {
        callback(pressed);
      }
    }
  }

  addMapping(keyCode: string, callback: KeyCallback): void {
    this.keyCallbacks.set(keyCode, callback);
  }

  isPressed(keyCode: string): boolean {
    return this.keyStates.get(keyCode) ?? false;
  }
}

// Setup player controls - now includes run button
export function setupPlayerControls(
  keyboard: KeyboardState,
  player: {
    go: { direction: number; running: boolean };
    jump: { start: () => void; cancel: () => void };
  }
): void {
  // Left/Right movement
  keyboard.addMapping('ArrowLeft', (pressed) => {
    if (pressed) {
      player.go.direction = -1;
    } else if (player.go.direction === -1) {
      player.go.direction = 0;
    }
  });

  keyboard.addMapping('ArrowRight', (pressed) => {
    if (pressed) {
      player.go.direction = 1;
    } else if (player.go.direction === 1) {
      player.go.direction = 0;
    }
  });

  // Alternative WASD controls
  keyboard.addMapping('KeyA', (pressed) => {
    if (pressed) {
      player.go.direction = -1;
    } else if (player.go.direction === -1) {
      player.go.direction = 0;
    }
  });

  keyboard.addMapping('KeyD', (pressed) => {
    if (pressed) {
      player.go.direction = 1;
    } else if (player.go.direction === 1) {
      player.go.direction = 0;
    }
  });

  // Jump
  keyboard.addMapping('Space', (pressed) => {
    if (pressed) {
      player.jump.start();
    } else {
      player.jump.cancel();
    }
  });

  keyboard.addMapping('ArrowUp', (pressed) => {
    if (pressed) {
      player.jump.start();
    } else {
      player.jump.cancel();
    }
  });

  keyboard.addMapping('KeyW', (pressed) => {
    if (pressed) {
      player.jump.start();
    } else {
      player.jump.cancel();
    }
  });

  // Run button (Shift or Z)
  keyboard.addMapping('ShiftLeft', (pressed) => {
    player.go.running = pressed;
  });

  keyboard.addMapping('ShiftRight', (pressed) => {
    player.go.running = pressed;
  });

  keyboard.addMapping('KeyZ', (pressed) => {
    player.go.running = pressed;
  });

  // Alternative X for jump (like NES)
  keyboard.addMapping('KeyX', (pressed) => {
    if (pressed) {
      player.jump.start();
    } else {
      player.jump.cancel();
    }
  });
}
