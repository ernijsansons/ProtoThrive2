// Ref: CLAUDE.md - Enhanced audio service for AI feedback notifications
export interface NotificationSound {
  id: string;
  name: string;
  url: string;
  volume: number;
  type: 'success' | 'warning' | 'error' | 'info' | 'ai_insight' | 'milestone';
}

export interface AudioConfig {
  enabled: boolean;
  volume: number;
  respectSystemSettings: boolean;
  useWebAudio: boolean;
}

export class AudioService {
  private static instance: AudioService | null = null;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, NotificationSound> = new Map();
  private config: AudioConfig;
  private preloadedBuffers: Map<string, AudioBuffer> = new Map();
  private gainNode: GainNode | null = null;

  private constructor(config: AudioConfig = {
    enabled: true,
    volume: 0.7,
    respectSystemSettings: true,
    useWebAudio: true,
  }) {
    this.config = config;
    this.initializeAudioContext();
    this.loadDefaultSounds();
  }

  static getInstance(config?: AudioConfig): AudioService {
    if (!this.instance) {
      this.instance = new AudioService(config);
    }
    return this.instance;
  }

  private initializeAudioContext(): void {
    if (!this.config.useWebAudio || typeof window === 'undefined') {
      return;
    }

    try {
      // Use modern AudioContext or fallback to webkitAudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.updateVolume();
      }
    } catch (error) {
      console.warn('Failed to initialize AudioContext:', error);
      this.config.useWebAudio = false;
    }
  }

  private loadDefaultSounds(): void {
    // Define built-in notification sounds using data URLs or generated audio
    const defaultSounds: NotificationSound[] = [
      {
        id: 'success',
        name: 'Success',
        url: this.generateToneDataURL(800, 0.1, 'sine'),
        volume: 0.6,
        type: 'success',
      },
      {
        id: 'warning',
        name: 'Warning',
        url: this.generateToneDataURL(600, 0.15, 'triangle'),
        volume: 0.7,
        type: 'warning',
      },
      {
        id: 'error',
        name: 'Error',
        url: this.generateToneDataURL(400, 0.2, 'sawtooth'),
        volume: 0.8,
        type: 'error',
      },
      {
        id: 'info',
        name: 'Info',
        url: this.generateToneDataURL(700, 0.08, 'sine'),
        volume: 0.5,
        type: 'info',
      },
      {
        id: 'ai_insight',
        name: 'AI Insight',
        url: this.generateChordDataURL([523, 659, 784], 0.12, 'sine'),
        volume: 0.6,
        type: 'ai_insight',
      },
      {
        id: 'milestone',
        name: 'Milestone',
        url: this.generateProgressionDataURL([440, 523, 659, 784], 0.1, 'sine'),
        volume: 0.7,
        type: 'milestone',
      },
    ];

    defaultSounds.forEach(sound => {
      this.sounds.set(sound.id, sound);
      this.preloadSound(sound);
    });
  }

  private generateToneDataURL(frequency: number, duration: number, waveform: OscillatorType = 'sine'): string {
    if (!this.audioContext) {
      return ''; // Fallback for unsupported browsers
    }

    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (waveform) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'triangle':
          sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'sawtooth':
          sample = 2 * (frequency * t - Math.floor(frequency * t + 0.5));
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
          break;
      }

      // Apply envelope (fade in/out)
      const envelope = Math.min(
        1,
        Math.min(t / 0.01, (duration - t) / 0.01) // 10ms fade in/out
      );
      buffer[i] = sample * envelope * 0.3; // Reduce volume
    }

    return this.audioBufferToDataURL(buffer, sampleRate);
  }

  private generateChordDataURL(frequencies: number[], duration: number, waveform: OscillatorType = 'sine'): string {
    if (!this.audioContext) {
      return '';
    }

    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      frequencies.forEach(freq => {
        sample += Math.sin(2 * Math.PI * freq * t) / frequencies.length;
      });

      // Apply envelope
      const envelope = Math.min(
        1,
        Math.min(t / 0.02, (duration - t) / 0.02)
      );
      buffer[i] = sample * envelope * 0.2;
    }

    return this.audioBufferToDataURL(buffer, sampleRate);
  }

  private generateProgressionDataURL(frequencies: number[], noteDuration: number, waveform: OscillatorType = 'sine'): string {
    if (!this.audioContext) {
      return '';
    }

    const sampleRate = 44100;
    const totalDuration = frequencies.length * noteDuration;
    const numSamples = Math.floor(sampleRate * totalDuration);
    const buffer = new Float32Array(numSamples);

    frequencies.forEach((freq, noteIndex) => {
      const noteStart = Math.floor(noteIndex * noteDuration * sampleRate);
      const noteEnd = Math.floor((noteIndex + 1) * noteDuration * sampleRate);

      for (let i = noteStart; i < noteEnd && i < numSamples; i++) {
        const t = (i - noteStart) / sampleRate;
        const sample = Math.sin(2 * Math.PI * freq * t);

        // Apply envelope for each note
        const envelope = Math.min(
          1,
          Math.min(t / 0.01, (noteDuration - t) / 0.01)
        );
        buffer[i] = sample * envelope * 0.25;
      }
    });

    return this.audioBufferToDataURL(buffer, sampleRate);
  }

  private audioBufferToDataURL(buffer: Float32Array, sampleRate: number): string {
    // Convert Float32Array to 16-bit PCM
    const length = buffer.length;
    const pcmBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(pcmBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Convert samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    // Convert to base64 data URL
    const blob = new Blob([pcmBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  private async preloadSound(sound: NotificationSound): Promise<void> {
    if (!this.config.useWebAudio || !this.audioContext || !sound.url) {
      return;
    }

    try {
      const response = await fetch(sound.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.preloadedBuffers.set(sound.id, audioBuffer);
    } catch (error) {
      console.warn(`Failed to preload sound ${sound.id}:`, error);
    }
  }

  async playSound(
    soundId: string,
    options: { volume?: number; playbackRate?: number } = {}
  ): Promise<void> {
    if (!this.config.enabled || !this.isAudioAllowed()) {
      return;
    }

    const sound = this.sounds.get(soundId);
    if (!sound) {
      console.warn(`Sound not found: ${soundId}`);
      return;
    }

    try {
      if (this.config.useWebAudio && this.audioContext && this.gainNode) {
        await this.playWithWebAudio(sound, options);
      } else {
        await this.playWithHtmlAudio(sound, options);
      }
    } catch (error) {
      console.warn(`Failed to play sound ${soundId}:`, error);
    }
  }

  private async playWithWebAudio(
    sound: NotificationSound,
    options: { volume?: number; playbackRate?: number }
  ): Promise<void> {
    if (!this.audioContext || !this.gainNode) return;

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const buffer = this.preloadedBuffers.get(sound.id);
    if (!buffer) {
      // Fallback to HTML audio
      await this.playWithHtmlAudio(sound, options);
      return;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.playbackRate.value = options.playbackRate || 1;

    const volume = (options.volume ?? sound.volume) * this.config.volume;
    gainNode.gain.value = Math.max(0, Math.min(1, volume));

    source.connect(gainNode);
    gainNode.connect(this.gainNode);

    source.start();
  }

  private async playWithHtmlAudio(
    sound: NotificationSound,
    options: { volume?: number; playbackRate?: number }
  ): Promise<void> {
    if (!sound.url) return;

    const audio = new Audio(sound.url);
    audio.volume = Math.max(0, Math.min(1,
      (options.volume ?? sound.volume) * this.config.volume
    ));

    if (options.playbackRate) {
      audio.playbackRate = options.playbackRate;
    }

    await audio.play();
  }

  private isAudioAllowed(): boolean {
    if (!this.config.respectSystemSettings) {
      return true;
    }

    // Check if user has interacted with the page
    if (typeof document !== 'undefined') {
      const hasUserInteracted = document.body.classList.contains('user-interacted');
      if (!hasUserInteracted) {
        // Add event listener to enable audio after user interaction
        const enableAudio = () => {
          document.body.classList.add('user-interacted');
          document.removeEventListener('click', enableAudio);
          document.removeEventListener('keydown', enableAudio);
        };
        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('keydown', enableAudio, { once: true });
        return false;
      }
    }

    return true;
  }

  addCustomSound(sound: NotificationSound): void {
    this.sounds.set(sound.id, sound);
    this.preloadSound(sound);
  }

  removeSound(soundId: string): void {
    this.sounds.delete(soundId);
    this.preloadedBuffers.delete(soundId);
  }

  updateConfig(newConfig: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateVolume();
  }

  private updateVolume(): void {
    if (this.gainNode) {
      this.gainNode.gain.value = this.config.volume;
    }
  }

  getSounds(): NotificationSound[] {
    return Array.from(this.sounds.values());
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  async testSound(soundId: string): Promise<void> {
    await this.playSound(soundId, { volume: 0.5 });
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.sounds.clear();
    this.preloadedBuffers.clear();
    this.gainNode = null;
  }
}

// Convenience functions for common use cases
export const audioService = AudioService.getInstance();

export const playNotificationSound = (type: NotificationSound['type'], volume?: number) => {
  return audioService.playSound(type, { volume });
};

export const playSuccess = (volume?: number) => audioService.playSound('success', { volume });
export const playWarning = (volume?: number) => audioService.playSound('warning', { volume });
export const playError = (volume?: number) => audioService.playSound('error', { volume });
export const playInfo = (volume?: number) => audioService.playSound('info', { volume });
export const playAIInsight = (volume?: number) => audioService.playSound('ai_insight', { volume });
export const playMilestone = (volume?: number) => audioService.playSound('milestone', { volume });