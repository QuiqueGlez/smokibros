// Simple audio manager using Web Audio API for game sounds
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private enabled = true;
  private volume = 0.5;

  constructor() {
    // Create audio context on first user interaction
    this.initOnInteraction();
  }

  private initOnInteraction(): void {
    const init = () => {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
        this.generateSounds();
      }
      document.removeEventListener('click', init);
      document.removeEventListener('keydown', init);
      document.removeEventListener('touchstart', init);
    };
    document.addEventListener('click', init);
    document.addEventListener('keydown', init);
    document.addEventListener('touchstart', init);
  }

  private generateSounds(): void {
    if (!this.audioContext) return;

    // Generate sounds programmatically (no external files needed)
    this.createSound('jump', this.generateJump());
    this.createSound('coin', this.generateCoin());
    this.createSound('stomp', this.generateStomp());
    this.createSound('powerup', this.generatePowerup());
    this.createSound('brick', this.generateBrick());
    this.createSound('bump', this.generateBump());
    this.createSound('death', this.generateDeath());
    this.createSound('flagpole', this.generateFlagpole());
    this.createSound('1up', this.generate1Up());
    this.createSound('pipe', this.generatePipe());
  }

  private createSound(name: string, buffer: AudioBuffer): void {
    this.sounds.set(name, buffer);
  }

  play(name: string): void {
    if (!this.enabled || !this.audioContext) return;

    const buffer = this.sounds.get(name);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    gainNode.gain.value = this.volume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start();
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Sound generation methods using oscillators
  private generateJump(): AudioBuffer {
    return this.createTone([
      { freq: 350, duration: 0.05 },
      { freq: 450, duration: 0.05 },
      { freq: 550, duration: 0.1 }
    ], 'sine');
  }

  private generateCoin(): AudioBuffer {
    return this.createTone([
      { freq: 988, duration: 0.05 },
      { freq: 1319, duration: 0.15 }
    ], 'square', 0.3);
  }

  private generateStomp(): AudioBuffer {
    return this.createNoise(0.1, 800, 200);
  }

  private generatePowerup(): AudioBuffer {
    const tones: { freq: number; duration: number }[] = [];
    for (let i = 0; i < 8; i++) {
      tones.push({ freq: 200 + i * 100, duration: 0.06 });
    }
    return this.createTone(tones, 'square', 0.3);
  }

  private generateBrick(): AudioBuffer {
    return this.createNoise(0.15, 400, 100);
  }

  private generateBump(): AudioBuffer {
    return this.createTone([
      { freq: 200, duration: 0.05 },
      { freq: 150, duration: 0.05 }
    ], 'square', 0.4);
  }

  private generateDeath(): AudioBuffer {
    const tones: { freq: number; duration: number }[] = [];
    for (let i = 0; i < 6; i++) {
      tones.push({ freq: 400 - i * 50, duration: 0.1 });
    }
    return this.createTone(tones, 'triangle', 0.5);
  }

  private generateFlagpole(): AudioBuffer {
    const tones: { freq: number; duration: number }[] = [];
    const notes = [523, 659, 784, 1047, 1319, 1568, 2093]; // C E G C E G C
    for (const note of notes) {
      tones.push({ freq: note, duration: 0.08 });
    }
    return this.createTone(tones, 'square', 0.3);
  }

  private generatePipe(): AudioBuffer {
    return this.createTone([
      { freq: 600, duration: 0.08 },
      { freq: 500, duration: 0.08 },
      { freq: 400, duration: 0.08 },
      { freq: 300, duration: 0.08 },
      { freq: 200, duration: 0.15 },
    ], 'square', 0.3);
  }

  private generate1Up(): AudioBuffer {
    return this.createTone([
      { freq: 330, duration: 0.08 },
      { freq: 392, duration: 0.08 },
      { freq: 523, duration: 0.08 },
      { freq: 659, duration: 0.08 },
      { freq: 784, duration: 0.08 },
      { freq: 1047, duration: 0.2 }
    ], 'square', 0.3);
  }

  private createTone(
    tones: { freq: number; duration: number }[],
    type: OscillatorType = 'sine',
    volumeMult: number = 1
  ): AudioBuffer {
    const ctx = this.audioContext!;
    const totalDuration = tones.reduce((sum, t) => sum + t.duration, 0);
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, Math.ceil(sampleRate * totalDuration), sampleRate);
    const data = buffer.getChannelData(0);

    let offset = 0;
    for (const tone of tones) {
      const samples = Math.floor(sampleRate * tone.duration);
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        let sample = 0;

        switch (type) {
          case 'sine':
            sample = Math.sin(2 * Math.PI * tone.freq * t);
            break;
          case 'square':
            sample = Math.sin(2 * Math.PI * tone.freq * t) > 0 ? 1 : -1;
            break;
          case 'triangle':
            sample = Math.abs(((t * tone.freq) % 1) * 4 - 2) - 1;
            break;
          case 'sawtooth':
            sample = ((t * tone.freq) % 1) * 2 - 1;
            break;
        }

        // Apply envelope
        const attackEnd = 0.01;
        const releaseStart = tone.duration - 0.02;
        let envelope = 1;
        if (t < attackEnd) {
          envelope = t / attackEnd;
        } else if (t > releaseStart) {
          envelope = (tone.duration - t) / 0.02;
        }

        data[offset + i] = sample * envelope * 0.5 * volumeMult;
      }
      offset += samples;
    }

    return buffer;
  }

  private createNoise(duration: number, freqStart: number, freqEnd: number): AudioBuffer {
    const ctx = this.audioContext!;
    const sampleRate = ctx.sampleRate;
    const samples = Math.ceil(sampleRate * duration);
    const buffer = ctx.createBuffer(1, samples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const progress = t / duration;
      const freq = freqStart + (freqEnd - freqStart) * progress;

      // Filtered noise using a simple sine wave modulation
      const noise = (Math.random() * 2 - 1);
      const carrier = Math.sin(2 * Math.PI * freq * t);

      // Envelope
      const envelope = 1 - progress;

      data[i] = noise * carrier * envelope * 0.3;
    }

    return buffer;
  }
}

// Global audio manager instance
export const audioManager = new AudioManager();
