/**
 * SoundEngine: synthesised sound effects via the Web Audio API so the game needs no
 * audio asset files. Named cues keep the call sites declarative; swapping in sampled
 * audio later only requires changing this file.
 */
export type SoundCue =
  | 'naval-fire' | 'naval-impact'
  | 'click' | 'correct' | 'wrong' | 'hit' | 'enemy-hit' | 'victory' | 'defeat'
  | 'level-up' | 'quest' | 'unlock' | 'boss-roar' | 'build' | 'open' | 'coin' | 'combo' | 'tick' | 'fanfare';

type Note = { f: number; t: number; d: number; type?: OscillatorType; g?: number };

const CUES: Record<SoundCue, Note[]> = {
  'naval-fire': [{ f: 110, t: 0, d: 0.14, type: 'sawtooth', g: 0.12 }, { f: 55, t: 0.04, d: 0.23, type: 'triangle', g: 0.16 }],
  'naval-impact': [{ f: 75, t: 0, d: 0.26, type: 'sawtooth', g: 0.09 }, { f: 42, t: 0.1, d: 0.3, type: 'triangle', g: 0.12 }],
  click: [{ f: 660, t: 0, d: 0.05, type: 'square', g: 0.05 }],
  correct: [{ f: 523, t: 0, d: 0.09 }, { f: 659, t: 0.08, d: 0.09 }, { f: 784, t: 0.16, d: 0.14 }],
  wrong: [{ f: 220, t: 0, d: 0.15, type: 'sawtooth', g: 0.08 }, { f: 180, t: 0.12, d: 0.2, type: 'sawtooth', g: 0.08 }],
  hit: [{ f: 880, t: 0, d: 0.05, type: 'square', g: 0.08 }, { f: 440, t: 0.04, d: 0.12, type: 'sawtooth', g: 0.1 }],
  'enemy-hit': [{ f: 140, t: 0, d: 0.18, type: 'sawtooth', g: 0.12 }, { f: 90, t: 0.1, d: 0.2, type: 'square', g: 0.08 }],
  victory: [{ f: 523, t: 0, d: 0.12 }, { f: 659, t: 0.12, d: 0.12 }, { f: 784, t: 0.24, d: 0.12 }, { f: 1046, t: 0.36, d: 0.3 }],
  defeat: [{ f: 392, t: 0, d: 0.2 }, { f: 330, t: 0.2, d: 0.2 }, { f: 262, t: 0.4, d: 0.4 }],
  'level-up': [{ f: 392, t: 0, d: 0.1 }, { f: 523, t: 0.1, d: 0.1 }, { f: 659, t: 0.2, d: 0.1 }, { f: 784, t: 0.3, d: 0.1 }, { f: 1046, t: 0.4, d: 0.35 }],
  quest: [{ f: 659, t: 0, d: 0.1 }, { f: 880, t: 0.1, d: 0.25 }],
  unlock: [{ f: 440, t: 0, d: 0.08 }, { f: 554, t: 0.08, d: 0.08 }, { f: 659, t: 0.16, d: 0.08 }, { f: 880, t: 0.24, d: 0.3 }],
  'boss-roar': [{ f: 110, t: 0, d: 0.5, type: 'sawtooth', g: 0.14 }, { f: 82, t: 0.2, d: 0.6, type: 'sawtooth', g: 0.14 }, { f: 55, t: 0.4, d: 0.8, type: 'square', g: 0.1 }],
  build: [{ f: 330, t: 0, d: 0.06, type: 'square', g: 0.06 }, { f: 330, t: 0.12, d: 0.06, type: 'square', g: 0.06 }, { f: 494, t: 0.26, d: 0.2 }],
  open: [{ f: 494, t: 0, d: 0.08 }, { f: 740, t: 0.06, d: 0.16 }],
  coin: [{ f: 1318, t: 0, d: 0.07, type: 'square', g: 0.06 }, { f: 1760, t: 0.07, d: 0.18, type: 'square', g: 0.06 }],
  combo: [{ f: 659, t: 0, d: 0.06 }, { f: 880, t: 0.06, d: 0.06 }, { f: 1108, t: 0.12, d: 0.06 }, { f: 1318, t: 0.18, d: 0.22 }],
  tick: [{ f: 900, t: 0, d: 0.03, type: 'square', g: 0.03 }],
  fanfare: [{ f: 523, t: 0, d: 0.15 }, { f: 523, t: 0.15, d: 0.15 }, { f: 523, t: 0.3, d: 0.15 }, { f: 698, t: 0.45, d: 0.4 }, { f: 659, t: 0.85, d: 0.15 }, { f: 698, t: 1.0, d: 0.5 }],
};

class SoundEngineImpl {
  private ctx: AudioContext | null = null;
  private _muted = false;
  private volume = 0.5;

  get muted() { return this._muted; }
  setMuted(m: boolean) { this._muted = m; }
  setVolume(v: number) { this.volume = Math.max(0, Math.min(1, v)); }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) this.ctx = new AC();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  play(cue: SoundCue) {
    if (this._muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const n of CUES[cue]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type ?? 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      const g = (n.g ?? 0.12) * this.volume;
      gain.gain.setValueAtTime(0.0001, now + n.t);
      gain.gain.exponentialRampToValueAtTime(g, now + n.t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    }
  }
}

export const Sound = new SoundEngineImpl();
