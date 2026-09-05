/**
 * GiftSoundManager
 *
 * Cinematic gift audio without shipping large binaries: every gift has its own
 * bespoke sound design synthesised with the Web Audio API (layered noise beds,
 * formant roars, engine growls, thunder cracks, glass chimes) and routed through
 * a shared hall reverb so it sits in the same "room" as the footage.
 *
 * Every recipe is written against the clip's IMPACT frame: build-up layers run
 * from t=0 to the impact, the hero hit lands exactly on it and tails follow.
 * When an admin uploads a real sound file (`sound_url`) that asset plays instead.
 *
 * - one shared AudioContext, unlocked on first user gesture (autoplay safe)
 * - every play() returns a stop() handle so animations can clean up
 * - global mute persisted in localStorage
 * - never loops: all voices are one-shot and disconnected when finished
 */

const MUTE_KEY = "viva-gift-muted";

type Stop = () => void;

export interface PlayOptions {
  /** ms into the gift where the hero moment lands (the clip's impact frame) */
  impactMs?: number;
}

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
      // soft-knee limiter so stacked layers never clip
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.knee.value = 12;
      limiter.ratio.value = 6;
      limiter.attack.value = 0.004;
      limiter.release.value = 0.18;
      this.master.connect(limiter).connect(this.ctx.destination);
      // cinematic hall reverb (2.2s synthetic impulse)
      const verb = this.ctx.createConvolver();
      verb.buffer = impulse(this.ctx, 2.2, 3.2);
      const wet = this.ctx.createGain();
      wet.gain.value = 0.28;
      this.master.connect(verb).connect(wet).connect(limiter);
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

  /**
   * Play the sound for a gift. The recipe is scheduled against `impactMs` so
   * the hero hit lands on the same frame as the footage. Returns a stop handle.
   */
  play(soundKey: string | null | undefined, soundUrl?: string | null, opts: PlayOptions = {}): Stop {
    if (this.muted) return () => {};
    if (soundUrl) return this.playUrl(soundUrl);
    const ctx = this.audio();
    if (!ctx) return () => {};
    void this.resume();
    const recipe = RECIPES[soundKey ?? ""] ?? RECIPES["default"]!;
    const impact = Math.max(0, (opts.impactMs ?? 0) / 1000);
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
        impact,
        noise: () => this.noiseBuffer(ctx),
        track: (n) => nodes.push(n),
      });
    } catch {
      /* audio failures must never break an animation */
    }
    this.active.add(stop);
    window.setTimeout(stop, impact * 1000 + 12_000);
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
  /** seconds into the gift where the hero moment lands */
  impact: number;
  noise: () => AudioBuffer;
  track: (n: AudioNode) => void;
}

/* ---------- synthesis primitives ---------- */

function impulse(ctx: AudioContext, seconds: number, decay: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function tone(
  v: Voice,
  {
    type = "sine" as OscillatorType,
    from,
    to,
    at = 0,
    dur = 0.5,
    gain = 0.3,
    curve = "exp" as "exp" | "lin",
    attack,
    detune = 0,
  }: {
    type?: OscillatorType;
    from: number;
    to: number;
    at?: number;
    dur?: number;
    gain?: number;
    curve?: "exp" | "lin";
    attack?: number;
    detune?: number;
  },
) {
  const { ctx, out } = v;
  const t = ctx.currentTime + Math.max(0, at);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.detune.value = detune;
  osc.frequency.setValueAtTime(from, t);
  if (curve === "exp") osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
  else osc.frequency.linearRampToValueAtTime(Math.max(1, to), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + (attack ?? Math.min(0.08, dur * 0.2)));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
  v.track(osc);
  v.track(g);
}

function noiseHit(
  v: Voice,
  {
    at = 0,
    dur = 0.6,
    gain = 0.4,
    freq = 900,
    q = 1,
    type = "lowpass" as BiquadFilterType,
    sweepTo = 0,
    attack,
  }: {
    at?: number;
    dur?: number;
    gain?: number;
    freq?: number;
    q?: number;
    type?: BiquadFilterType;
    sweepTo?: number;
    attack?: number;
  },
) {
  const { ctx, out } = v;
  const t = ctx.currentTime + Math.max(0, at);
  const src = ctx.createBufferSource();
  src.buffer = v.noise();
  src.loop = true;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.Q.value = q;
  filt.frequency.setValueAtTime(freq, t);
  if (sweepTo) filt.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + (attack ?? Math.min(0.06, dur * 0.25)));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filt).connect(g).connect(out);
  src.start(t, Math.random() * 2);
  src.stop(t + dur + 0.05);
  v.track(src);
  v.track(g);
}

/** Slow build-up bed: swells from silence to `gain` right at `until`. */
function swell(
  v: Voice,
  {
    until,
    gain = 0.3,
    freq = 400,
    sweepTo = 2000,
    type = "bandpass" as BiquadFilterType,
    q = 0.8,
  }: { until: number; gain?: number; freq?: number; sweepTo?: number; type?: BiquadFilterType; q?: number },
) {
  const dur = Math.max(0.4, until);
  noiseHit(v, { at: 0, dur: dur + 0.3, gain, freq, sweepTo, type, q, attack: dur * 0.85 });
}

/** Animal roar: growling saw stack + throat noise. */
function roar(v: Voice, { at = 0, dur = 1.6, base = 110, gain = 0.35 }) {
  tone(v, { type: "sawtooth", from: base * 1.6, to: base * 0.7, at, dur, gain });
  tone(v, { type: "sawtooth", from: base * 1.6, to: base * 0.7, at, dur, gain: gain * 0.6, detune: 14 });
  tone(v, { type: "square", from: base * 0.9, to: base * 0.45, at: at + 0.05, dur: dur * 0.9, gain: gain * 0.5 });
  noiseHit(v, { at, dur, gain: gain * 0.6, freq: 1200, sweepTo: 220 });
  noiseHit(v, { at, dur, gain: gain * 0.35, freq: 700, q: 6, type: "bandpass", sweepTo: 380 });
}

function chime(v: Voice, notes: number[], { at = 0, step = 0.08, gain = 0.22, dur = 0.7 } = {}) {
  notes.forEach((f, i) => {
    tone(v, { type: "triangle", from: f, to: f, at: at + i * step, dur, gain });
    tone(v, { type: "sine", from: f * 2, to: f * 2, at: at + i * step, dur: dur * 0.6, gain: gain * 0.25 });
  });
}

/** Sustained shimmering chord (choir/pad) */
function pad(v: Voice, notes: number[], { at = 0, dur = 2.5, gain = 0.12, attack = 0.4 } = {}) {
  notes.forEach((f) => {
    tone(v, { type: "sine", from: f, to: f, at, dur, gain, attack });
    tone(v, { type: "triangle", from: f, to: f, at, dur, gain: gain * 0.5, attack, detune: 7 });
    tone(v, { type: "triangle", from: f, to: f, at, dur, gain: gain * 0.5, attack, detune: -7 });
  });
}

function boom(v: Voice, { at = 0, gain = 0.5, dur = 1.1 } = {}) {
  tone(v, { type: "sine", from: 120, to: 28, at, dur, gain, attack: 0.01 });
  noiseHit(v, { at, dur: dur * 0.8, gain: gain * 0.7, freq: 500, sweepTo: 60, attack: 0.01 });
}

function whoosh(v: Voice, { at = 0, dur = 0.9, gain = 0.32, from = 300, to = 2600 } = {}) {
  noiseHit(v, { at, dur, gain, freq: from, sweepTo: to, type: "bandpass", q: 1.2 });
}

function sparkleTrail(v: Voice, { at = 0, count = 8, gain = 0.16, spread = 0.07 } = {}) {
  for (let i = 0; i < count; i++) {
    const f = 900 + Math.random() * 2200;
    tone(v, { type: "sine", from: f, to: f * 1.6, at: at + i * spread, dur: 0.3, gain });
  }
}

/** Fire crackle bed: filtered noise plus random pops. */
function crackle(v: Voice, { at = 0, dur = 2, gain = 0.26 } = {}) {
  noiseHit(v, { at, dur, gain, freq: 1400, sweepTo: 900, type: "bandpass", q: 0.6, attack: 0.3 });
  tone(v, { type: "sawtooth", from: 70, to: 45, at, dur, gain: gain * 0.5, attack: 0.3 });
  const pops = Math.floor(dur * 7);
  for (let i = 0; i < pops; i++) {
    noiseHit(v, { at: at + Math.random() * dur, dur: 0.05, gain: gain * 0.9, freq: 2600 + Math.random() * 2400, type: "highpass" });
  }
}

/** Wing beats: periodic low air puffs. */
function wings(v: Voice, { at = 0, count = 4, period = 0.55, gain = 0.28 } = {}) {
  for (let i = 0; i < count; i++) {
    noiseHit(v, { at: at + i * period, dur: 0.42, gain, freq: 220, sweepTo: 900, type: "bandpass", q: 0.9, attack: 0.12 });
    tone(v, { type: "sine", from: 80, to: 40, at: at + i * period, dur: 0.3, gain: gain * 0.45 });
  }
}

function heartbeat(v: Voice, { at = 0, gain = 0.4 } = {}) {
  tone(v, { type: "sine", from: 95, to: 45, at, dur: 0.22, gain, attack: 0.01 });
  tone(v, { type: "sine", from: 80, to: 40, at: at + 0.24, dur: 0.26, gain: gain * 0.8, attack: 0.01 });
}

/** Engine: pulsing saw stack whose pitch follows an RPM curve. */
function engine(v: Voice, { at = 0, dur = 2.4, gain = 0.3, from = 70, peak = 220, to = 90 } = {}) {
  const half = dur * 0.55;
  for (const [mult, g, type] of [
    [1, 1, "sawtooth"],
    [2, 0.45, "square"],
    [0.5, 0.6, "sawtooth"],
  ] as const) {
    tone(v, { type, from: from * mult, to: peak * mult, at, dur: half, gain: gain * g, attack: 0.15 });
    tone(v, { type, from: peak * mult, to: to * mult, at: at + half, dur: dur - half, gain: gain * g, attack: 0.02 });
  }
  noiseHit(v, { at, dur, gain: gain * 0.5, freq: 800, sweepTo: 1800, type: "bandpass", q: 0.8 });
}

/** Thunder: instant crack + deep boom + rolling rumble. */
function thunderCrack(v: Voice, { at = 0, gain = 0.5 } = {}) {
  noiseHit(v, { at, dur: 0.14, gain, freq: 5200, type: "highpass", attack: 0.002 });
  noiseHit(v, { at: at + 0.02, dur: 0.5, gain: gain * 0.9, freq: 1800, sweepTo: 200, attack: 0.004 });
  boom(v, { at: at + 0.1, gain: gain * 1.1, dur: 1.4 });
  noiseHit(v, { at: at + 0.35, dur: 3.2, gain: gain * 0.6, freq: 700, sweepTo: 70, q: 0.7 });
  tone(v, { type: "sine", from: 45, to: 22, at: at + 0.3, dur: 3.0, gain: gain * 0.5, attack: 0.2 });
}

type Recipe = (v: Voice) => void;

/**
 * Realistic big-cat roar: sub rumble + growling harmonic stack with amplitude
 * modulation (the "chuff" texture of a real roar) + formant-filtered breath
 * noise + closing grunts. Peaks immediately so it locks to the mouth-open frame.
 */
function bigCatRoar(v: Voice, { at = 0, pitch = 1, dur = 1.75 } = {}) {
  const { ctx, out } = v;
  const t0 = ctx.currentTime + at;

  // growl LFO shared by the voiced layers
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = "sine";
  lfo.frequency.setValueAtTime(34, t0);
  lfo.frequency.linearRampToValueAtTime(19, t0 + dur);
  lfoGain.gain.value = 0.38;
  lfo.connect(lfoGain);
  lfo.start(t0);
  lfo.stop(t0 + dur + 0.1);
  v.track(lfo);

  const voiced = (type: OscillatorType, f0: number, f1: number, gain: number, detune = 0) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(f0 * pitch, t0);
    osc.frequency.exponentialRampToValueAtTime(f0 * pitch * 1.12, t0 + 0.12);
    osc.frequency.exponentialRampToValueAtTime(f1 * pitch, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.07);
    g.gain.setValueAtTime(gain, t0 + dur * 0.62);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    lfoGain.connect(g.gain);
    osc.connect(g).connect(out);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    v.track(osc);
    v.track(g);
  };

  voiced("sine", 52, 30, 0.5); // chest sub
  voiced("sawtooth", 96, 62, 0.3);
  voiced("sawtooth", 96, 62, 0.2, 18); // slight detune = animal, not synth
  voiced("square", 148, 92, 0.12);

  // vocal-tract formants over breath noise
  for (const [freq, q, gain] of [
    [620, 7, 0.3],
    [1180, 9, 0.2],
    [2450, 11, 0.1],
  ] as const) {
    noiseHit(v, { at, dur, gain, freq: freq * pitch, q, type: "bandpass", sweepTo: freq * pitch * 0.55 });
  }
  // air rush + throat rasp
  noiseHit(v, { at, dur: 0.5, gain: 0.24, freq: 2600, sweepTo: 700, type: "bandpass", q: 0.9 });
  noiseHit(v, { at: at + dur * 0.55, dur: 0.9, gain: 0.16, freq: 900, sweepTo: 260, type: "lowpass", q: 1 });

  // closing grunts
  tone(v, { type: "sawtooth", from: 74 * pitch, to: 46 * pitch, at: at + dur + 0.05, dur: 0.28, gain: 0.2 });
  tone(v, { type: "sawtooth", from: 68 * pitch, to: 40 * pitch, at: at + dur + 0.42, dur: 0.24, gain: 0.14 });
}

/* ---------- per-gift sound design (all timed against v.impact) ---------- */

const RECIPES: Record<string, Recipe> = {
  default: (v) => chime(v, [660, 880], { at: v.impact, gain: 0.18 }),

  /** soft petal air → bloom chord + gentle shimmer on the open frame */
  rose: (v) => {
    const i = v.impact;
    swell(v, { until: i, gain: 0.14, freq: 500, sweepTo: 2400 });
    noiseHit(v, { at: i - 0.25, dur: 0.5, gain: 0.12, freq: 3000, sweepTo: 1200, type: "bandpass", q: 1.5 });
    chime(v, [784, 988, 1319], { at: i, step: 0.09, gain: 0.16, dur: 1.1 });
    pad(v, [392, 494, 587], { at: i, dur: 2.2, gain: 0.06, attack: 0.3 });
    sparkleTrail(v, { at: i + 0.25, count: 6, gain: 0.07, spread: 0.11 });
  },

  /** two heartbeats leading in → magical glowing impact */
  heart: (v) => {
    const i = v.impact;
    heartbeat(v, { at: Math.max(0, i - 1.3), gain: 0.4 });
    heartbeat(v, { at: Math.max(0.05, i - 0.62), gain: 0.46 });
    swell(v, { until: i, gain: 0.12, freq: 300, sweepTo: 1800 });
    boom(v, { at: i, gain: 0.3, dur: 0.9 });
    chime(v, [659, 880, 1319], { at: i, step: 0.07, gain: 0.16, dur: 1.2 });
    pad(v, [330, 415, 494], { at: i, dur: 2.4, gain: 0.07 });
    sparkleTrail(v, { at: i + 0.15, count: 8, gain: 0.08 });
  },

  /** shooting-star whistle streaking in → sparkle burst as it lands */
  star: (v) => {
    const i = v.impact;
    const travel = Math.min(2.2, Math.max(0.6, i - 0.1));
    tone(v, { type: "sine", from: 2600, to: 900, at: i - travel, dur: travel, gain: 0.12, attack: 0.3 });
    tone(v, { type: "triangle", from: 3100, to: 1400, at: i - travel, dur: travel, gain: 0.05, attack: 0.3, detune: 9 });
    whoosh(v, { at: i - travel, dur: travel, gain: 0.22, from: 600, to: 3200 });
    chime(v, [1568, 1976, 2637], { at: i, step: 0.05, gain: 0.18, dur: 0.9 });
    sparkleTrail(v, { at: i, count: 14, gain: 0.14, spread: 0.05 });
    boom(v, { at: i, gain: 0.16, dur: 0.6 });
  },

  /** breathy approach → kiss pop → glittery magic */
  kiss: (v) => {
    const i = v.impact;
    swell(v, { until: i, gain: 0.1, freq: 700, sweepTo: 2200, q: 0.6 });
    noiseHit(v, { at: i - 0.03, dur: 0.16, gain: 0.42, freq: 2200, type: "bandpass", q: 3, attack: 0.008 });
    tone(v, { type: "sine", from: 1500, to: 600, at: i, dur: 0.12, gain: 0.22, attack: 0.005 });
    chime(v, [988, 1319, 1568], { at: i + 0.1, step: 0.07, gain: 0.14 });
    sparkleTrail(v, { at: i + 0.2, count: 8, gain: 0.08 });
  },

  /** crackling embers → ignition whoosh → roaring blaze */
  fire: (v) => {
    const i = v.impact;
    crackle(v, { at: 0, dur: Math.max(0.6, i) + 0.4, gain: 0.16 });
    whoosh(v, { at: i - 0.15, dur: 0.55, gain: 0.36, from: 300, to: 3000 });
    noiseHit(v, { at: i, dur: 2.0, gain: 0.34, freq: 1600, sweepTo: 320, type: "bandpass", q: 0.7, attack: 0.03 });
    tone(v, { type: "sawtooth", from: 90, to: 40, at: i, dur: 1.6, gain: 0.22, attack: 0.03 });
    crackle(v, { at: i + 0.2, dur: 1.8, gain: 0.2 });
  },

  /** rising regal swell → golden reveal chord + boom + glitter */
  crown: (v) => {
    const i = v.impact;
    swell(v, { until: i, gain: 0.16, freq: 250, sweepTo: 2600 });
    tone(v, { type: "sine", from: 130, to: 262, at: Math.max(0, i - 1.4), dur: Math.min(1.4, i), gain: 0.1, attack: 0.5, curve: "lin" });
    chime(v, [523, 659, 784, 1047], { at: i, step: 0.06, gain: 0.2, dur: 1.4 });
    pad(v, [262, 330, 392, 523], { at: i, dur: 2.6, gain: 0.08, attack: 0.15 });
    boom(v, { at: i, gain: 0.32 });
    sparkleTrail(v, { at: i + 0.1, count: 12, gain: 0.1 });
  },

  /** glassy approach → crystal ping arpeggio + shimmering facets */
  diamond: (v) => {
    const i = v.impact;
    whoosh(v, { at: Math.max(0, i - 0.9), dur: Math.min(0.9, i) + 0.1, gain: 0.18, from: 900, to: 5000 });
    tone(v, { type: "sine", from: 3200, to: 3200, at: i, dur: 1.4, gain: 0.16, attack: 0.004 });
    chime(v, [1319, 1568, 2093, 2637], { at: i, step: 0.06, gain: 0.2, dur: 1.2 });
    tone(v, { type: "sine", from: 5200, to: 4800, at: i + 0.02, dur: 0.6, gain: 0.08, attack: 0.004 });
    sparkleTrail(v, { at: i + 0.15, count: 14, gain: 0.1, spread: 0.05 });
    boom(v, { at: i, gain: 0.14, dur: 0.6 });
  },

  /** ignition rumble building → blast-off → engine pass-by */
  rocket: (v) => {
    const i = v.impact;
    const build = Math.max(0.8, i);
    noiseHit(v, { at: 0, dur: build + 0.2, gain: 0.34, freq: 200, sweepTo: 900, q: 0.8, attack: build * 0.7 });
    tone(v, { type: "sawtooth", from: 45, to: 110, at: 0, dur: build, gain: 0.2, attack: build * 0.6 });
    crackle(v, { at: Math.max(0, i - 1.2), dur: Math.min(1.2, i) + 0.3, gain: 0.12 });
    boom(v, { at: i, gain: 0.5, dur: 1.4 });
    noiseHit(v, { at: i, dur: 2.4, gain: 0.42, freq: 500, sweepTo: 2600, type: "bandpass", q: 0.8, attack: 0.02 });
    tone(v, { type: "sawtooth", from: 110, to: 520, at: i, dur: 2.0, gain: 0.24, attack: 0.02 });
    whoosh(v, { at: i + 0.9, dur: 1.2, gain: 0.26, from: 2800, to: 500 });
  },

  /** idle rumble → rev up → doppler pass-by on impact → tyre roll-off */
  supercar: (v) => {
    const i = v.impact;
    const rev = Math.max(0.9, i);
    engine(v, { at: 0, dur: rev + 0.9, gain: 0.3, from: 60, peak: 260, to: 110 });
    // second gear kick just before the pass
    tone(v, { type: "sawtooth", from: 180, to: 320, at: i - 0.35, dur: 0.35, gain: 0.18, attack: 0.05 });
    // doppler pass-by
    tone(v, { type: "sawtooth", from: 340, to: 150, at: i, dur: 0.9, gain: 0.3, attack: 0.01 });
    tone(v, { type: "square", from: 680, to: 300, at: i, dur: 0.9, gain: 0.1, attack: 0.01 });
    whoosh(v, { at: i - 0.05, dur: 1.1, gain: 0.34, from: 2200, to: 400 });
    noiseHit(v, { at: i + 0.3, dur: 1.4, gain: 0.16, freq: 900, sweepTo: 300, q: 0.6 });
  },

  /** high wind → wing beats → piercing eagle screech on impact */
  eagle: (v) => {
    const i = v.impact;
    swell(v, { until: i, gain: 0.22, freq: 500, sweepTo: 1800, q: 0.6 });
    wings(v, { at: Math.max(0, i - 1.9), count: 4, period: 0.5, gain: 0.24 });
    // screech with vibrato-like double sweep
    tone(v, { type: "sawtooth", from: 2400, to: 1500, at: i, dur: 0.55, gain: 0.16, attack: 0.02 });
    tone(v, { type: "triangle", from: 2600, to: 1300, at: i, dur: 0.6, gain: 0.2, attack: 0.02, detune: 12 });
    tone(v, { type: "triangle", from: 2100, to: 1000, at: i + 0.62, dur: 0.45, gain: 0.16, attack: 0.02 });
    whoosh(v, { at: i, dur: 1.2, gain: 0.2, from: 1200, to: 300 });
  },

  /** low prowling growl → tiger roar on the open-mouth frame */
  tiger: (v) => {
    const i = v.impact;
    noiseHit(v, { at: 0, dur: Math.max(0.6, i) + 0.2, gain: 0.14, freq: 260, sweepTo: 520, q: 1.2, attack: Math.max(0.3, i * 0.8) });
    tone(v, { type: "sawtooth", from: 55, to: 70, at: Math.max(0, i - 1.2), dur: Math.min(1.2, i), gain: 0.1, attack: 0.5 });
    bigCatRoar(v, { at: i, pitch: 1.28, dur: 1.5 });
    boom(v, { at: i + 0.04, gain: 0.42 });
    noiseHit(v, { at: i + 0.02, dur: 0.6, gain: 0.24, freq: 4200, sweepTo: 600, type: "bandpass", q: 0.8 });
  },

  /** shimmering magic build → celestial chord + rainbow sparkles */
  unicorn: (v) => {
    const i = v.impact;
    swell(v, { until: i, gain: 0.12, freq: 900, sweepTo: 4200, q: 0.7 });
    sparkleTrail(v, { at: Math.max(0, i - 1.0), count: 8, gain: 0.05, spread: 0.12 });
    tone(v, { type: "sine", from: 400, to: 800, at: Math.max(0, i - 1.0), dur: Math.min(1.0, i), gain: 0.08, attack: 0.4, curve: "lin" });
    chime(v, [784, 988, 1175, 1568, 1976], { at: i, step: 0.06, gain: 0.18, dur: 1.4 });
    pad(v, [392, 494, 587, 784], { at: i, dur: 2.8, gain: 0.07 });
    sparkleTrail(v, { at: i + 0.2, count: 16, gain: 0.1, spread: 0.06 });
    boom(v, { at: i, gain: 0.16, dur: 0.7 });
  },

  /** heavy wing beats + growl → dragon roar → fire breath blast */
  dragon: (v) => {
    const i = v.impact;
    wings(v, { at: Math.max(0, i - 3.6), count: 5, period: 0.72, gain: 0.34 });
    tone(v, { type: "sawtooth", from: 40, to: 60, at: Math.max(0, i - 2.2), dur: Math.min(2.2, i), gain: 0.14, attack: 0.8 });
    noiseHit(v, { at: Math.max(0, i - 1.4), dur: 1.4, gain: 0.16, freq: 300, sweepTo: 900, q: 1.4, attack: 0.9 });
    roar(v, { at: i - 0.35, dur: 2.0, base: 72, gain: 0.42 });
    bigCatRoar(v, { at: i - 0.3, pitch: 0.7, dur: 1.9 });
    boom(v, { at: i, gain: 0.5, dur: 1.3 });
    // fire breath
    whoosh(v, { at: i, dur: 0.6, gain: 0.34, from: 300, to: 3400 });
    noiseHit(v, { at: i + 0.1, dur: 2.2, gain: 0.4, freq: 1800, sweepTo: 260, type: "bandpass", q: 0.7, attack: 0.05 });
    crackle(v, { at: i + 0.3, dur: 2.0, gain: 0.18 });
  },

  /** fire crackle + wing whooshes → rising chime → rebirth burst */
  phoenix: (v) => {
    const i = v.impact;
    crackle(v, { at: 0, dur: Math.max(0.8, i) + 0.5, gain: 0.14 });
    wings(v, { at: Math.max(0, i - 3.0), count: 4, period: 0.6, gain: 0.22 });
    chime(v, [523, 659, 784, 988], { at: Math.max(0, i - 1.1), step: 0.26, gain: 0.12, dur: 1.0 });
    swell(v, { until: i, gain: 0.2, freq: 400, sweepTo: 3600 });
    boom(v, { at: i, gain: 0.42, dur: 1.3 });
    whoosh(v, { at: i, dur: 0.7, gain: 0.3, from: 400, to: 3800 });
    chime(v, [659, 880, 1175, 1568], { at: i, step: 0.08, gain: 0.2, dur: 1.4 });
    pad(v, [330, 440, 523, 659], { at: i, dur: 3.0, gain: 0.08 });
    sparkleTrail(v, { at: i + 0.2, count: 18, gain: 0.1, spread: 0.06 });
    crackle(v, { at: i + 0.2, dur: 2.0, gain: 0.14 });
  },

  /** deep drone + bell tolls → epic reveal chord + boom */
  castle: (v) => {
    const i = v.impact;
    tone(v, { type: "sine", from: 55, to: 82, at: 0, dur: Math.max(1, i) + 0.5, gain: 0.16, attack: Math.max(0.5, i * 0.6), curve: "lin" });
    tone(v, { type: "triangle", from: 110, to: 165, at: 0, dur: Math.max(1, i) + 0.5, gain: 0.07, attack: Math.max(0.5, i * 0.6), curve: "lin", detune: 6 });
    // bell tolls
    [3.0, 1.6].forEach((back, n) => {
      const at = i - back;
      if (at > 0) {
        tone(v, { type: "sine", from: 262, to: 262, at, dur: 1.6, gain: 0.14, attack: 0.005 });
        tone(v, { type: "sine", from: 660, to: 660, at, dur: 1.0, gain: 0.05 + n * 0.01, attack: 0.005 });
      }
    });
    swell(v, { until: i, gain: 0.2, freq: 300, sweepTo: 3000 });
    boom(v, { at: i, gain: 0.44, dur: 1.5 });
    chime(v, [523, 659, 784, 1047, 1319], { at: i, step: 0.07, gain: 0.2, dur: 1.6 });
    pad(v, [262, 330, 392, 523], { at: i, dur: 3.4, gain: 0.1, attack: 0.12 });
    sparkleTrail(v, { at: i + 0.3, count: 16, gain: 0.08, spread: 0.07 });
  },

  /** deep space drone + slow shimmer → massive cosmic swell on impact */
  galaxy: (v) => {
    const i = v.impact;
    tone(v, { type: "sine", from: 38, to: 76, at: 0, dur: Math.max(2, i) + 1, gain: 0.2, attack: Math.max(0.8, i * 0.5), curve: "lin" });
    tone(v, { type: "sine", from: 57, to: 114, at: 0, dur: Math.max(2, i) + 1, gain: 0.08, attack: Math.max(0.8, i * 0.5), curve: "lin", detune: 5 });
    sparkleTrail(v, { at: Math.max(0, i - 3), count: 10, gain: 0.04, spread: 0.28 });
    chime(v, [392, 523, 659, 784], { at: Math.max(0, i - 2.2), step: 0.5, gain: 0.08, dur: 1.4 });
    swell(v, { until: i, gain: 0.24, freq: 200, sweepTo: 3200 });
    boom(v, { at: i, gain: 0.46, dur: 1.8 });
    pad(v, [196, 262, 330, 392, 523], { at: i, dur: 3.6, gain: 0.1, attack: 0.1 });
    chime(v, [1047, 1319, 1568], { at: i, step: 0.08, gain: 0.14, dur: 1.6 });
    sparkleTrail(v, { at: i + 0.2, count: 18, gain: 0.09, spread: 0.08 });
  },

  /** wind + rain + distant rumbles → lightning crack on impact → rolling thunder */
  thunder: (v) => {
    const i = v.impact;
    noiseHit(v, { at: 0, dur: Math.max(1, i) + 3, gain: 0.1, freq: 3000, sweepTo: 2400, type: "highpass", attack: 0.8 }); // rain
    swell(v, { until: i, gain: 0.16, freq: 200, sweepTo: 900, q: 0.6 }); // wind
    [4.2, 2.4].forEach((back) => {
      const at = i - back;
      if (at > 0) {
        boom(v, { at, gain: 0.2, dur: 1.2 });
        noiseHit(v, { at: at + 0.1, dur: 1.6, gain: 0.14, freq: 400, sweepTo: 80 });
      }
    });
    tone(v, { type: "sine", from: 1200, to: 3800, at: i - 0.18, dur: 0.18, gain: 0.08, attack: 0.02 }); // charge-up zap
    thunderCrack(v, { at: i, gain: 0.55 });
    thunderCrack(v, { at: i + 1.1, gain: 0.26 });
  },

  /** growing rumble + gas hiss → eruption boom → lava crackle & falling rock */
  volcano: (v) => {
    const i = v.impact;
    tone(v, { type: "sawtooth", from: 32, to: 48, at: 0, dur: Math.max(1, i) + 0.3, gain: 0.16, attack: Math.max(0.5, i * 0.7) });
    noiseHit(v, { at: 0, dur: Math.max(1, i) + 0.3, gain: 0.22, freq: 120, sweepTo: 400, q: 0.8, attack: Math.max(0.5, i * 0.8) });
    noiseHit(v, { at: Math.max(0, i - 1.2), dur: 1.2, gain: 0.1, freq: 3500, type: "highpass", attack: 0.6 }); // gas hiss
    boom(v, { at: i, gain: 0.55, dur: 1.8 });
    boom(v, { at: i + 0.25, gain: 0.3, dur: 1.4 });
    noiseHit(v, { at: i, dur: 3.2, gain: 0.34, freq: 800, sweepTo: 120, attack: 0.02 });
    tone(v, { type: "sawtooth", from: 55, to: 26, at: i, dur: 2.8, gain: 0.24, attack: 0.02 });
    crackle(v, { at: i + 0.3, dur: 2.6, gain: 0.2 });
    for (let n = 0; n < 6; n++) boom(v, { at: i + 0.8 + n * 0.35 + Math.random() * 0.2, gain: 0.1, dur: 0.4 });
  },

  /** universe: cosmic drone → colossal creation hit → choir + endless sparkles */
  universe: (v) => {
    const i = v.impact;
    tone(v, { type: "sine", from: 36, to: 110, at: 0, dur: Math.max(1.5, i) + 0.6, gain: 0.22, attack: Math.max(0.6, i * 0.6), curve: "lin" });
    swell(v, { until: i, gain: 0.26, freq: 160, sweepTo: 4000 });
    whoosh(v, { at: Math.max(0, i - 0.6), dur: 0.65, gain: 0.3, from: 400, to: 5000 });
    boom(v, { at: i, gain: 0.55, dur: 2.0 });
    boom(v, { at: i + 0.18, gain: 0.3, dur: 1.4 });
    pad(v, [131, 196, 262, 330, 392, 523], { at: i, dur: 4.5, gain: 0.1, attack: 0.08 });
    chime(v, [523, 659, 784, 988, 1319, 1568], { at: i + 0.1, step: 0.09, gain: 0.18, dur: 1.8 });
    sparkleTrail(v, { at: i + 0.3, count: 24, gain: 0.1, spread: 0.09 });
    tone(v, { type: "sine", from: 2093, to: 2093, at: i + 0.2, dur: 3.0, gain: 0.05, attack: 0.5 });
  },

  /** Fired by LionGiftScene exactly on the mouth-open frame (fallback when the clip's own roar is blocked). */
  lion_roar: (v) => {
    bigCatRoar(v);
    boom(v, { at: 0.06, gain: 0.5 });
    noiseHit(v, { at: 0.04, dur: 0.7, gain: 0.3, freq: 4200, sweepTo: 500, type: "bandpass", q: 0.8 });
    sparkleTrail(v, { at: 0.35, count: 10, gain: 0.1 });
  },
  lion: (v) => {
    const i = v.impact;
    swell(v, { until: i, gain: 0.16, freq: 200, sweepTo: 1200 });
    bigCatRoar(v, { at: i });
    boom(v, { at: i + 0.06, gain: 0.45 });
  },
};

export const giftSounds = new SoundManager();
