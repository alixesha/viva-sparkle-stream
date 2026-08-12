/**
 * GiftSoundManager
 *
 * Cinematic gift audio without shipping large binaries: every sound is
 * synthesised on the fly with the Web Audio API (noise beds, filtered roars,
 * engine growls, thunder cracks, magic chimes). When an admin uploads a real
 * sound file (`sound_url`) that asset is preloaded and played instead.
 *
 * - one shared AudioContext, unlocked on first user gesture (autoplay safe)
 * - every play() returns a stop() handle so animations can clean up
 * - global mute persisted in localStorage
 * - never loops: all voices are one-shot and disconnected when finished
 */

const MUTE_KEY = "viva-gift-muted";

type Stop = () => void;

class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private muted = false;
  private urlCache = new Map<string, HTMLAudioElement>();
  private active = new Set<Stop>();
  private listeners = new Set<(muted: boolean) => void>();

  constructor() {
    if (typeof window !== "undefined") {
      this.muted = window.localStorage.getItem(MUTE_KEY) === "1";
      const unlock = () => void this.resume();
      window.addEventListener("pointerdown", unlock, { once: true });
      window.addEventListener("keydown", unlock, { once: true });
    }
  }

  get isMuted() {
    return this.muted;
  }

  onMuteChange(fn: (muted: boolean) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setMuted(v: boolean) {
    this.muted = v;
    if (typeof window !== "undefined") window.localStorage.setItem(MUTE_KEY, v ? "1" : "0");
    if (v) this.stopAll();
    this.listeners.forEach((l) => l(v));
  }

  toggleMuted() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Warm the audio graph + preload an uploaded asset. */
  preload(soundUrl?: string | null) {
    if (typeof window === "undefined") return;
    if (soundUrl && !this.urlCache.has(soundUrl)) {
      const el = new Audio(soundUrl);
      el.preload = "auto";
      el.crossOrigin = "anonymous";
      this.urlCache.set(soundUrl, el);
    }
  }

  stopAll() {
    for (const stop of Array.from(this.active)) {
      try {
        stop();
      } catch {
        /* noop */
      }
    }
    this.active.clear();
  }

  private async resume() {
    try {
      await this.audio()?.resume();
    } catch {
      /* autoplay blocked until a real gesture */
    }
  }

  private audio(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private noiseBuffer(ctx: AudioContext) {
    if (this.noise) return this.noise;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = (white * 0.6 + last * 3) * 0.5;
    }
    this.noise = buf;
    return buf;
  }

  /** Play the sound for a gift. Returns a stop handle. */
  play(soundKey: string | null | undefined, soundUrl?: string | null): Stop {
    if (this.muted) return () => {};
    if (soundUrl) return this.playUrl(soundUrl);
    const ctx = this.audio();
    if (!ctx) return () => {};
    void this.resume();
    const recipe = RECIPES[soundKey ?? ""] ?? RECIPES["default"]!;
    const nodes: AudioNode[] = [];
    const stop: Stop = () => {
      nodes.forEach((n) => {
        try {
          (n as OscillatorNode & AudioBufferSourceNode).stop?.(0);
        } catch {
          /* already stopped */
        }
        try {
          n.disconnect();
        } catch {
          /* noop */
        }
      });
      this.active.delete(stop);
    };
    try {
      recipe({
        ctx,
        out: this.master!,
        noise: () => this.noiseBuffer(ctx),
        track: (n) => nodes.push(n),
      });
    } catch {
      /* audio failures must never break an animation */
    }
    this.active.add(stop);
    window.setTimeout(stop, 10_000);
    return stop;
  }

  private playUrl(url: string): Stop {
    this.preload(url);
    const base = this.urlCache.get(url);
    const el = base ? (base.cloneNode(true) as HTMLAudioElement) : new Audio(url);
    el.loop = false;
    el.volume = 0.9;
    void el.play().catch(() => {});
    const stop: Stop = () => {
      el.pause();
      el.currentTime = 0;
      this.active.delete(stop);
    };
    el.addEventListener("ended", stop, { once: true });
    this.active.add(stop);
    return stop;
  }
}

interface Voice {
  ctx: AudioContext;
  out: AudioNode;
  noise: () => AudioBuffer;
  track: (n: AudioNode) => void;
}

/* ---------- synthesis primitives ---------- */

function tone(
  v: Voice,
  { type = "sine" as OscillatorType, from, to, at = 0, dur = 0.5, gain = 0.3, curve = "exp" as "exp" | "lin" },
) {
  const { ctx, out } = v;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  if (curve === "exp") osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
  else osc.frequency.linearRampToValueAtTime(Math.max(1, to), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.08, dur * 0.2));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
  v.track(osc);
  v.track(g);
}

function noiseHit(
  v: Voice,
  { at = 0, dur = 0.6, gain = 0.4, freq = 900, q = 1, type = "lowpass" as BiquadFilterType, sweepTo = 0 },
) {
  const { ctx, out } = v;
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = v.noise();
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.Q.value = q;
  filt.frequency.setValueAtTime(freq, t);
  if (sweepTo) filt.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.06, dur * 0.25));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filt).connect(g).connect(out);
  src.start(t);
  src.stop(t + dur + 0.05);
  v.track(src);
  v.track(g);
}

/** Animal roar: growling saw stack + throat noise. */
function roar(v: Voice, { at = 0, dur = 1.6, base = 110, gain = 0.35 }) {
  tone(v, { type: "sawtooth", from: base * 1.6, to: base * 0.7, at, dur, gain });
  tone(v, { type: "square", from: base * 0.9, to: base * 0.45, at: at + 0.05, dur: dur * 0.9, gain: gain * 0.5 });
  noiseHit(v, { at, dur, gain: gain * 0.6, freq: 1200, sweepTo: 220 });
}

function chime(v: Voice, notes: number[], { at = 0, step = 0.08, gain = 0.22 } = {}) {
  notes.forEach((f, i) => tone(v, { type: "triangle", from: f, to: f, at: at + i * step, dur: 0.7, gain }));
}

function boom(v: Voice, { at = 0, gain = 0.5 } = {}) {
  tone(v, { type: "sine", from: 120, to: 28, at, dur: 1.1, gain });
  noiseHit(v, { at, dur: 0.9, gain: gain * 0.7, freq: 500, sweepTo: 60 });
}

function whoosh(v: Voice, { at = 0, dur = 0.9, gain = 0.32 } = {}) {
  noiseHit(v, { at, dur, gain, freq: 300, sweepTo: 2600, type: "bandpass", q: 1.2 });
}

function engine(v: Voice, { at = 0, dur = 2.4, gain = 0.3 } = {}) {
  tone(v, { type: "sawtooth", from: 70, to: 190, at, dur: dur * 0.5, gain });
  tone(v, { type: "sawtooth", from: 190, to: 90, at: at + dur * 0.5, dur: dur * 0.5, gain });
  noiseHit(v, { at, dur, gain: gain * 0.5, freq: 800, sweepTo: 1800, type: "bandpass", q: 0.8 });
}

function sparkleTrail(v: Voice, { at = 0, count = 8, gain = 0.16 } = {}) {
  for (let i = 0; i < count; i++) {
    const f = 900 + Math.random() * 2200;
    tone(v, { type: "sine", from: f, to: f * 1.6, at: at + i * 0.07, dur: 0.3, gain });
  }
}

type Recipe = (v: Voice) => void;

const RECIPES: Record<string, Recipe> = {
  default: (v) => chime(v, [660, 880], { gain: 0.18 }),
  rose: (v) => {
    whoosh(v, { dur: 0.5, gain: 0.18 });
    chime(v, [784, 988, 1319], { at: 0.1, step: 0.09, gain: 0.16 });
  },
  heart: (v) => {
    tone(v, { type: "sine", from: 180, to: 90, dur: 0.35, gain: 0.3 });
    tone(v, { type: "sine", from: 180, to: 90, at: 0.32, dur: 0.35, gain: 0.26 });
    chime(v, [659, 880], { at: 0.15, gain: 0.14 });
  },
  star: (v) => sparkleTrail(v, { count: 10, gain: 0.18 }),
  kiss: (v) => {
    noiseHit(v, { dur: 0.14, gain: 0.35, freq: 2200, type: "bandpass", q: 3 });
    chime(v, [988, 1319, 1568], { at: 0.12, gain: 0.14 });
  },
  fire: (v) => {
    noiseHit(v, { dur: 1.5, gain: 0.32, freq: 1600, sweepTo: 300, type: "bandpass", q: 0.7 });
    tone(v, { type: "sawtooth", from: 90, to: 40, dur: 1.2, gain: 0.2 });
  },
  crown: (v) => {
    chime(v, [523, 659, 784, 1047], { step: 0.11, gain: 0.2 });
    boom(v, { at: 0.5, gain: 0.32 });
    sparkleTrail(v, { at: 0.7, count: 8 });
  },
  diamond: (v) => {
    chime(v, [1319, 1568, 2093], { step: 0.09, gain: 0.2 });
    whoosh(v, { at: 0.4, dur: 1.1, gain: 0.22 });
    sparkleTrail(v, { at: 0.6, count: 10 });
  },
  rocket: (v) => {
    noiseHit(v, { dur: 2.2, gain: 0.4, freq: 260, sweepTo: 2200, type: "bandpass", q: 0.8 });
    tone(v, { type: "sawtooth", from: 60, to: 420, dur: 2.0, gain: 0.28 });
    boom(v, { at: 1.9, gain: 0.36 });
  },
  supercar: (v) => {
    engine(v, { dur: 2.6, gain: 0.32 });
    whoosh(v, { at: 1.6, dur: 0.8, gain: 0.28 });
  },
  eagle: (v) => {
    noiseHit(v, { dur: 2.4, gain: 0.28, freq: 500, sweepTo: 1800, type: "bandpass", q: 0.6 });
    tone(v, { type: "triangle", from: 2200, to: 1100, at: 0.2, dur: 0.5, gain: 0.22 });
    tone(v, { type: "triangle", from: 1900, to: 900, at: 0.85, dur: 0.4, gain: 0.18 });
  },
  tiger: (v) => {
    roar(v, { dur: 1.3, base: 150, gain: 0.32 });
    boom(v, { at: 1.1, gain: 0.34 });
  },
  unicorn: (v) => {
    chime(v, [784, 988, 1175, 1568, 1976], { step: 0.1, gain: 0.18 });
    whoosh(v, { at: 0.5, dur: 1.4, gain: 0.18 });
    sparkleTrail(v, { at: 0.8, count: 12 });
  },
  lion: (v) => {
    whoosh(v, { dur: 0.7, gain: 0.24 });
    roar(v, { at: 0.5, dur: 1.9, base: 95, gain: 0.4 });
    boom(v, { at: 2.1, gain: 0.5 });
    sparkleTrail(v, { at: 2.3, count: 12 });
  },
  dragon: (v) => {
    roar(v, { at: 0.2, dur: 2.0, base: 78, gain: 0.4 });
    noiseHit(v, { at: 1.8, dur: 2.0, gain: 0.38, freq: 1800, sweepTo: 260, type: "bandpass", q: 0.7 });
    boom(v, { at: 3.2, gain: 0.42 });
  },
  phoenix: (v) => {
    noiseHit(v, { dur: 2.0, gain: 0.3, freq: 1400, sweepTo: 400, type: "bandpass", q: 0.8 });
    chime(v, [659, 880, 1175, 1568], { at: 0.6, step: 0.14, gain: 0.2 });
    boom(v, { at: 2.4, gain: 0.34 });
    sparkleTrail(v, { at: 2.6, count: 14 });
  },
  castle: (v) => {
    chime(v, [523, 659, 784, 1047, 1319], { step: 0.16, gain: 0.2 });
    whoosh(v, { at: 1.2, dur: 1.6, gain: 0.24 });
    boom(v, { at: 2.6, gain: 0.34 });
    sparkleTrail(v, { at: 2.9, count: 16 });
  },
  galaxy: (v) => {
    tone(v, { type: "sine", from: 60, to: 240, dur: 3.4, gain: 0.22, curve: "lin" });
    chime(v, [392, 523, 659, 784, 1047], { at: 0.6, step: 0.28, gain: 0.16 });
    sparkleTrail(v, { at: 2.0, count: 16, gain: 0.12 });
  },
  thunder: (v) => {
    noiseHit(v, { dur: 0.16, gain: 0.5, freq: 5200, type: "highpass" });
    boom(v, { at: 0.12, gain: 0.55 });
    noiseHit(v, { at: 0.3, dur: 2.4, gain: 0.32, freq: 900, sweepTo: 90 });
  },
  volcano: (v) => {
    boom(v, { gain: 0.5 });
    noiseHit(v, { at: 0.2, dur: 3.0, gain: 0.34, freq: 700, sweepTo: 140 });
    tone(v, { type: "sawtooth", from: 50, to: 26, at: 0.1, dur: 2.6, gain: 0.24 });
  },
  universe: (v) => {
    tone(v, { type: "sine", from: 40, to: 180, dur: 4.0, gain: 0.24, curve: "lin" });
    boom(v, { at: 1.4, gain: 0.42 });
    chime(v, [523, 659, 784, 988, 1319, 1568], { at: 1.6, step: 0.2, gain: 0.18 });
    sparkleTrail(v, { at: 3.0, count: 18, gain: 0.12 });
  },
};

export const giftSounds = new SoundManager();
