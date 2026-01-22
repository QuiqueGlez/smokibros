// Simple particle system for visual effects

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity?: number;
  fadeOut?: boolean;
  shrink?: boolean;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  // Spawn particles at a position
  spawn(
    x: number,
    y: number,
    count: number,
    options: {
      color?: string;
      speed?: number;
      spread?: number;
      life?: number;
      size?: number;
      gravity?: number;
      fadeOut?: boolean;
      shrink?: boolean;
      direction?: 'all' | 'up' | 'down';
    } = {}
  ): void {
    const {
      color = '#fff',
      speed = 50,
      spread = Math.PI * 2,
      life = 0.5,
      size = 2,
      gravity = 0,
      fadeOut = true,
      shrink = false,
      direction = 'all'
    } = options;

    for (let i = 0; i < count; i++) {
      let angle: number;
      if (direction === 'up') {
        angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      } else if (direction === 'down') {
        angle = Math.PI / 2 + (Math.random() - 0.5) * spread;
      } else {
        angle = Math.random() * spread;
      }

      const particleSpeed = speed * (0.5 + Math.random() * 0.5);

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * particleSpeed,
        vy: Math.sin(angle) * particleSpeed,
        life: life * (0.5 + Math.random() * 0.5),
        maxLife: life,
        size: size * (0.5 + Math.random() * 0.5),
        color,
        gravity,
        fadeOut,
        shrink
      });
    }
  }

  // Spawn dust cloud (for landing, skidding)
  spawnDust(x: number, y: number): void {
    this.spawn(x, y, 5, {
      color: '#ccc',
      speed: 30,
      spread: Math.PI,
      life: 0.3,
      size: 3,
      direction: 'up',
      fadeOut: true
    });
  }

  // Spawn sparkles (for coins, stars)
  spawnSparkles(x: number, y: number, color = '#ffff00'): void {
    this.spawn(x, y, 8, {
      color,
      speed: 80,
      spread: Math.PI * 2,
      life: 0.4,
      size: 2,
      fadeOut: true,
      shrink: true
    });
  }

  // Spawn hit effect (for stomping)
  spawnHitEffect(x: number, y: number): void {
    // Burst of white particles
    this.spawn(x, y, 6, {
      color: '#fff',
      speed: 60,
      spread: Math.PI * 2,
      life: 0.2,
      size: 3,
      fadeOut: true
    });
  }

  // Spawn smoke (for joints, pipes)
  spawnSmoke(x: number, y: number): void {
    this.spawn(x, y, 3, {
      color: '#aaa',
      speed: 10,
      spread: Math.PI / 4,
      life: 1,
      size: 4,
      gravity: -20, // Float up
      fadeOut: true,
      direction: 'up'
    });
  }

  // Spawn joint smoke (smaller, for character's joint)
  spawnJointSmoke(x: number, y: number): void {
    this.spawn(x, y, 1, {
      color: '#ccc',
      speed: 8,
      spread: Math.PI / 6,
      life: 0.8,
      size: 2,
      gravity: -30, // Float up slowly
      fadeOut: true,
      direction: 'up'
    });
  }

  // Spawn chill smoke (green-tinted, for high chill level)
  spawnChillSmoke(x: number, y: number, intensity: number = 1): void {
    const count = Math.ceil(intensity * 2);
    this.spawn(x, y, count, {
      color: intensity > 0.6 ? '#7EC87E' : '#aaa', // Green when very chill
      speed: 15 + intensity * 10,
      spread: Math.PI / 3,
      life: 0.6 + intensity * 0.4,
      size: 3 + intensity * 2,
      gravity: -40,
      fadeOut: true,
      direction: 'up'
    });
  }

  // Spawn running trail (speed lines)
  spawnSpeedTrail(x: number, y: number, direction: number): void {
    this.spawn(x, y, 2, {
      color: '#fff',
      speed: 20,
      spread: Math.PI / 8,
      life: 0.15,
      size: 1,
      fadeOut: true
    });
    // Add directional streak
    const streakX = x + (direction > 0 ? -8 : 8);
    this.spawn(streakX, y, 1, {
      color: 'rgba(255,255,255,0.5)',
      speed: 5,
      life: 0.1,
      size: 2,
      fadeOut: true
    });
  }

  // Spawn landing impact
  spawnLandingImpact(x: number, y: number): void {
    // Dust clouds on both sides
    this.spawn(x - 4, y, 3, {
      color: '#ccc',
      speed: 25,
      spread: Math.PI / 2,
      life: 0.25,
      size: 3,
      direction: 'up',
      fadeOut: true
    });
    this.spawn(x + 4, y, 3, {
      color: '#ccc',
      speed: 25,
      spread: Math.PI / 2,
      life: 0.25,
      size: 3,
      direction: 'up',
      fadeOut: true
    });
  }

  update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update position
      p.x += p.vx * delta;
      p.y += p.vy * delta;

      // Apply gravity
      if (p.gravity) {
        p.vy += p.gravity * delta;
      }

      // Update life
      p.life -= delta;

      // Shrink if enabled
      if (p.shrink) {
        p.size = (p.life / p.maxLife) * p.size;
      }

      // Remove dead particles
      if (p.life <= 0 || p.size < 0.5) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number = 0): void {
    for (const p of this.particles) {
      ctx.save();

      // Calculate alpha for fade out
      let alpha = 1;
      if (p.fadeOut) {
        alpha = p.life / p.maxLife;
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      // Draw particle as circle
      const x = Math.floor(p.x - cameraX);
      const y = Math.floor(p.y);

      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Clear all particles
  clear(): void {
    this.particles = [];
  }

  get count(): number {
    return this.particles.length;
  }
}

// Global particle system instance
export const particleSystem = new ParticleSystem();
