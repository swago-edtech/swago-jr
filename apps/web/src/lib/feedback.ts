"use client";

class FeedbackUtility {
  private audioCtx: AudioContext | null = null;
  private isSupported: boolean = true;

  constructor() {
    // Only init if in browser
    if (typeof window === "undefined") {
      this.isSupported = false;
      return;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (!this.isSupported) return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      // Audio context might be suspended by default on some browsers until interaction
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (e) {
      console.warn("Web Audio API not supported", e);
      this.isSupported = false;
      return null;
    }
  }

  /**
   * Triggers a vibration if supported (Android).
   * @param pattern - Duration in ms or array of durations [vibrate, pause, vibrate...]
   */
  public vibrate(pattern: number | number[]): void {
    if (typeof window === "undefined") return;
    try {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(pattern);
      }
    } catch (e) {
      // Ignore vibration errors
    }
  }

  /**
   * Plays a quick rising "pop" sound.
   * Ideal for adding items or increasing quantities.
   */
  public playPop(): void {
    const ctx = this.getAudioContext();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      
      // Frequency sweep
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

      // Volume envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    }
    
    // Light haptic tap
    this.vibrate(50);
  }

  /**
   * Plays a quick descending "thud" sound.
   * Ideal for removing items or decreasing quantities.
   */
  public playRemove(): void {
    const ctx = this.getAudioContext();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      
      // Frequency sweep downwards
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);

      // Volume envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    }
    
    // Medium haptic thud
    this.vibrate(80);
  }

  /**
   * Plays an energetic success chime (arpeggio).
   * Ideal for successful orders, rewards, etc.
   */
  public playSuccess(): void {
    const ctx = this.getAudioContext();
    if (ctx) {
      // Arpeggio notes (C5, E5, G5, C6) in frequencies
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const duration = 0.1;

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        const startTime = ctx.currentTime + i * duration;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    }

    // Success vibration pattern (short, short, long)
    this.vibrate([50, 50, 50, 50, 150]);
  }

  /**
   * Plays a crisp "ding" (like a coin).
   * Ideal for Swago Money, points, unlocking something.
   */
  public playCoin(): void {
    const ctx = this.getAudioContext();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.1); // E6

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }

    this.vibrate([100]);
  }

  /**
   * Plays a low, short descending buzz.
   * Ideal for errors, invalid codes, or failures.
   */
  public playError(): void {
    const ctx = this.getAudioContext();
    if (ctx) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    }

    // Heavy haptic buzz
    this.vibrate([100, 50, 150]);
  }
}

export const Feedback = new FeedbackUtility();
