export interface TouchControlCallbacks {
  onLeft: (pressed: boolean) => void;
  onRight: (pressed: boolean) => void;
  onJump: (pressed: boolean) => void;
  onAction?: (pressed: boolean) => void;
}

export class TouchControls {
  private container: HTMLElement;
  private callbacks: TouchControlCallbacks;
  private activeTouches = new Map<number, string>();

  constructor(container: HTMLElement, callbacks: TouchControlCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.setup();
  }

  private setup(): void {
    // Create touch control elements
    this.container.innerHTML = `
      <style>
        .touch-controls {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 120px;
          display: flex;
          justify-content: space-between;
          padding: 10px 20px;
          pointer-events: none;
        }
        .touch-dpad {
          display: flex;
          gap: 10px;
          pointer-events: auto;
        }
        .touch-buttons {
          display: flex;
          gap: 10px;
          pointer-events: auto;
        }
        .touch-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          border: 3px solid rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
          user-select: none;
          -webkit-user-select: none;
          touch-action: none;
        }
        .touch-btn:active, .touch-btn.active {
          background: rgba(255, 255, 255, 0.6);
        }
        .touch-btn-jump {
          width: 80px;
          height: 80px;
          background: rgba(45, 90, 39, 0.5);
          border-color: rgba(45, 90, 39, 0.8);
        }
      </style>
      <div class="touch-controls">
        <div class="touch-dpad">
          <button class="touch-btn" data-action="left">◀</button>
          <button class="touch-btn" data-action="right">▶</button>
        </div>
        <div class="touch-buttons">
          <button class="touch-btn touch-btn-jump" data-action="jump">A</button>
        </div>
      </div>
    `;

    // Add touch listeners
    const buttons = this.container.querySelectorAll('.touch-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('touchstart', this.handleTouchStart, { passive: false });
      btn.addEventListener('touchend', this.handleTouchEnd, { passive: false });
      btn.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
    });

    // Prevent default touch behavior on the container
    this.container.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  }

  private handleTouchStart = (event: Event): void => {
    const touchEvent = event as TouchEvent;
    const target = touchEvent.target as HTMLElement;
    const action = target.dataset.action;

    if (!action) return;

    touchEvent.preventDefault();
    target.classList.add('active');

    // Track this touch
    for (const touch of Array.from(touchEvent.changedTouches)) {
      this.activeTouches.set(touch.identifier, action);
    }

    this.triggerCallback(action, true);
  };

  private handleTouchEnd = (event: Event): void => {
    const touchEvent = event as TouchEvent;
    const target = touchEvent.target as HTMLElement;

    touchEvent.preventDefault();
    target.classList.remove('active');

    // Check which actions ended
    for (const touch of Array.from(touchEvent.changedTouches)) {
      const action = this.activeTouches.get(touch.identifier);
      if (action) {
        this.activeTouches.delete(touch.identifier);

        // Only trigger release if no other touch is holding this action
        const stillHeld = Array.from(this.activeTouches.values()).includes(action);
        if (!stillHeld) {
          this.triggerCallback(action, false);
        }
      }
    }
  };

  private triggerCallback(action: string, pressed: boolean): void {
    switch (action) {
      case 'left':
        this.callbacks.onLeft(pressed);
        break;
      case 'right':
        this.callbacks.onRight(pressed);
        break;
      case 'jump':
        this.callbacks.onJump(pressed);
        break;
      case 'action':
        this.callbacks.onAction?.(pressed);
        break;
    }
  }

  destroy(): void {
    const buttons = this.container.querySelectorAll('.touch-btn');
    buttons.forEach((btn) => {
      btn.removeEventListener('touchstart', this.handleTouchStart);
      btn.removeEventListener('touchend', this.handleTouchEnd);
      btn.removeEventListener('touchcancel', this.handleTouchEnd);
    });
    this.container.innerHTML = '';
  }
}

// Setup touch controls for a player entity
export function setupTouchControls(
  container: HTMLElement,
  player: {
    go: { direction: number };
    jump: { start: () => void; cancel: () => void };
  }
): TouchControls {
  return new TouchControls(container, {
    onLeft: (pressed) => {
      if (pressed) {
        player.go.direction = -1;
      } else if (player.go.direction === -1) {
        player.go.direction = 0;
      }
    },
    onRight: (pressed) => {
      if (pressed) {
        player.go.direction = 1;
      } else if (player.go.direction === 1) {
        player.go.direction = 0;
      }
    },
    onJump: (pressed) => {
      if (pressed) {
        player.jump.start();
      } else {
        player.jump.cancel();
      }
    }
  });
}
