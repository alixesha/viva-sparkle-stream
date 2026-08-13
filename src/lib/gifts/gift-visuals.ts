/**
 * Cinematic scene descriptions for every gift animation key.
 *
 * A scene = backdrop + hero motion + canvas particle emitters + camera FX.
 * The renderer lives in src/components/gifts/GiftOverlay.tsx; assets uploaded by
 * an admin (Lottie / Rive / transparent WebM / GIF) override the built-in scene.
 */

export type GiftTier = "basic" | "premium" | "legendary";

export type ParticleKind =
  | "petal"
  | "spark"
  | "ember"
  | "smoke"
  | "ring"
  | "starfield"
  | "bolt"
  | "confetti"
  | "feather"
  | "lava"
  | "heart"
  | "orb";

export type Origin = "bottom" | "center" | "top" | "left" | "right";

export interface Emitter {
  kind: ParticleKind;
  at: number;
  count: number;
  colors: string[];
  origin?: Origin;
  speed?: number;
  size?: number;
  gravity?: number;
  life?: number;
  spread?: number;
  stagger?: number;
}

export interface Scene {
  tier: GiftTier;
  /** ms — matches the DB `duration_ms`, used as a fallback. */
  duration: number;
  /** CSS animation name applied to the hero element. */
  hero: string;
  /** hero size in vmin */
  heroSize: number;
  /** backdrop CSS background */
  backdrop: string;
  rays?: string[];
  flashes?: { at: number; color: string; dur?: number }[];
  shake?: { at: number; strength: number; dur?: number }[];
  emitters: Emitter[];
  /** dim the live video behind the animation (0-1) */
  dim: number;
}

const GOLD = ["#ffd76a", "#ffb32c", "#fff3c4"];
const FIRE = ["#ff9d2e", "#ff4d18", "#ffd76a"];
const ICE = ["#a8e9ff", "#5cc9ff", "#ffffff"];
const MAGIC = ["#c9a6ff", "#7ad7ff", "#ffd1f2"];
const SMOKE = ["#8b93a7", "#5d6577", "#c3c9d6"];

export const SCENES: Record<string, Scene> = {
  rose: {
    tier: "basic",
    duration: 2000,
    hero: "cine-bloom",
    heroSize: 34,
    backdrop: "radial-gradient(circle at 50% 60%, rgba(255,90,140,.28), transparent 65%)",
    dim: 0.25,
    emitters: [
      { kind: "petal", at: 0, count: 34, colors: ["#ff6a92", "#ff9ec2", "#c8305c"], origin: "top", life: 1900, size: 12, speed: 90, gravity: 40, spread: 1 },
      { kind: "spark", at: 200, count: 18, colors: ["#ffd1e2", "#fff"], origin: "center", size: 3, speed: 130, life: 900 },
    ],
  },
  heart: {
    tier: "basic",
    duration: 2000,
    hero: "cine-pulse",
    heroSize: 36,
    backdrop: "radial-gradient(circle at 50% 55%, rgba(255,45,110,.32), transparent 68%)",
    dim: 0.28,
    flashes: [{ at: 120, color: "rgba(255,70,130,.35)" }],
    emitters: [
      { kind: "heart", at: 0, count: 26, colors: ["#ff3f7a", "#ff86ad", "#ffd0e0"], origin: "bottom", size: 26, speed: 220, life: 1800, gravity: -20, spread: 1 },
      { kind: "ring", at: 100, count: 3, colors: ["#ff5c8f"], origin: "center", life: 900, stagger: 160 },
    ],
  },
  star: {
    tier: "basic",
    duration: 2200,
    hero: "cine-spin-pop",
    heroSize: 34,
    backdrop: "radial-gradient(circle at 50% 50%, rgba(255,205,80,.3), transparent 66%)",
    dim: 0.3,
    rays: ["#ffd76a"],
    flashes: [{ at: 80, color: "rgba(255,220,140,.4)" }],
    emitters: [
      { kind: "confetti", at: 60, count: 44, colors: GOLD, origin: "center", size: 8, speed: 380, life: 1500, gravity: 260 },
      { kind: "spark", at: 60, count: 30, colors: ["#fff", ...GOLD], origin: "center", size: 3.5, speed: 480, life: 1100 },
    ],
  },
  kiss: {
    tier: "basic",
    duration: 2200,
    hero: "cine-kiss",
    heroSize: 34,
    backdrop: "radial-gradient(circle at 50% 55%, rgba(255,90,160,.28), transparent 65%)",
    dim: 0.26,
    emitters: [
      { kind: "heart", at: 0, count: 18, colors: ["#ff5f9e", "#ffb3d1"], origin: "center", size: 20, speed: 200, life: 1600, gravity: -40, spread: 0.8 },
      { kind: "orb", at: 200, count: 14, colors: ["#ffd7ea", "#fff"], origin: "center", size: 10, speed: 150, life: 1300 },
    ],
  },
  fire: {
    tier: "basic",
    duration: 2600,
    hero: "cine-flare",
    heroSize: 38,
    backdrop: "linear-gradient(to top, rgba(255,80,20,.4), rgba(255,160,40,.12) 45%, transparent 75%)",
    dim: 0.35,
    shake: [{ at: 150, strength: 4, dur: 500 }],
    emitters: [
      { kind: "ember", at: 0, count: 60, colors: FIRE, origin: "bottom", size: 9, speed: 300, life: 1900, gravity: -120, spread: 1 },
      { kind: "smoke", at: 250, count: 18, colors: SMOKE, origin: "bottom", size: 60, speed: 130, life: 2100, gravity: -50 },
    ],
  },

  crown: {
    tier: "premium",
    duration: 4000,
    hero: "cine-descend",
    heroSize: 52,
    backdrop: "radial-gradient(circle at 50% 40%, rgba(255,190,60,.34), transparent 70%)",
    dim: 0.6,
    rays: ["#ffd76a", "#fff0bd"],
    flashes: [{ at: 1100, color: "rgba(255,225,150,.55)" }],
    shake: [{ at: 1100, strength: 8, dur: 600 }],
    emitters: [
      { kind: "spark", at: 300, count: 40, colors: GOLD, origin: "top", size: 4, speed: 200, life: 1800, gravity: 120 },
      { kind: "ring", at: 1100, count: 3, colors: ["#ffd76a"], origin: "center", life: 1100, stagger: 180 },
      { kind: "confetti", at: 1150, count: 70, colors: GOLD, origin: "center", size: 10, speed: 520, life: 2200, gravity: 320 },
    ],
  },
  diamond: {
    tier: "premium",
    duration: 4200,
    hero: "cine-crystal",
    heroSize: 50,
    backdrop: "radial-gradient(circle at 50% 50%, rgba(90,210,255,.32), transparent 70%)",
    dim: 0.62,
    rays: ["#7ad7ff", "#ffffff"],
    flashes: [{ at: 1600, color: "rgba(200,245,255,.6)" }],
    emitters: [
      { kind: "spark", at: 200, count: 50, colors: ICE, origin: "center", size: 4, speed: 300, life: 1700 },
      { kind: "ring", at: 1600, count: 4, colors: ["#7ad7ff"], origin: "center", life: 1200, stagger: 150 },
      { kind: "confetti", at: 1650, count: 60, colors: ICE, origin: "center", size: 9, speed: 560, life: 2200, gravity: 260 },
    ],
  },
  rocket: {
    tier: "premium",
    duration: 4200,
    hero: "cine-launch",
    heroSize: 44,
    backdrop: "linear-gradient(to top, rgba(255,110,30,.32), rgba(20,20,60,.55) 60%, rgba(5,5,20,.7))",
    dim: 0.65,
    shake: [{ at: 0, strength: 5, dur: 1800 }, { at: 2600, strength: 12, dur: 700 }],
    emitters: [
      { kind: "ember", at: 0, count: 70, colors: FIRE, origin: "bottom", size: 10, speed: 380, life: 1600, gravity: 200 },
      { kind: "smoke", at: 100, count: 26, colors: SMOKE, origin: "bottom", size: 80, speed: 160, life: 2400 },
      { kind: "starfield", at: 900, count: 60, colors: ["#fff", "#bcd4ff"], origin: "center", size: 3, speed: 600, life: 1500 },
      { kind: "spark", at: 2600, count: 60, colors: GOLD, origin: "center", size: 4, speed: 620, life: 1400 },
    ],
  },
  supercar: {
    tier: "premium",
    duration: 4500,
    hero: "cine-drive",
    heroSize: 46,
    backdrop: "linear-gradient(to top, rgba(10,10,25,.75), rgba(60,20,120,.35) 55%, transparent)",
    dim: 0.6,
    shake: [{ at: 900, strength: 6, dur: 1400 }],
    emitters: [
      { kind: "smoke", at: 500, count: 30, colors: SMOKE, origin: "left", size: 70, speed: 260, life: 1800 },
      { kind: "spark", at: 700, count: 50, colors: ["#7ad7ff", "#fff", "#ffb32c"], origin: "left", size: 4, speed: 800, life: 1000 },
      { kind: "ring", at: 2400, count: 2, colors: ["#7ad7ff"], origin: "center", life: 900, stagger: 200 },
    ],
  },
  eagle: {
    tier: "premium",
    duration: 4500,
    hero: "cine-soar",
    heroSize: 56,
    backdrop: "linear-gradient(to bottom, rgba(120,170,255,.28), transparent 60%)",
    dim: 0.58,
    shake: [{ at: 1800, strength: 5, dur: 600 }],
    emitters: [
      { kind: "feather", at: 900, count: 34, colors: ["#e9e2d3", "#b9a98c", "#fff"], origin: "center", size: 18, speed: 220, life: 2400, gravity: 60 },
      { kind: "smoke", at: 600, count: 16, colors: ["#cfd8ea", "#9fb0cc"], origin: "right", size: 70, speed: 320, life: 1600 },
      { kind: "spark", at: 1800, count: 30, colors: ["#fff", "#cbe4ff"], origin: "center", size: 3, speed: 420, life: 1200 },
    ],
  },
  tiger: {
    tier: "premium",
    duration: 4500,
    hero: "cine-pounce",
    heroSize: 58,
    backdrop: "radial-gradient(circle at 50% 55%, rgba(255,140,40,.3), transparent 68%)",
    dim: 0.62,
    flashes: [{ at: 2100, color: "rgba(255,180,90,.5)" }],
    shake: [{ at: 2100, strength: 14, dur: 700 }],
    emitters: [
      { kind: "smoke", at: 300, count: 20, colors: SMOKE, origin: "bottom", size: 70, speed: 200, life: 1800 },
      { kind: "ring", at: 2100, count: 3, colors: ["#ff9d2e"], origin: "center", life: 900, stagger: 130 },
      { kind: "confetti", at: 2150, count: 50, colors: FIRE, origin: "center", size: 9, speed: 560, life: 1800, gravity: 300 },
    ],
  },
  unicorn: {
    tier: "premium",
    duration: 4800,
    hero: "cine-prance",
    heroSize: 52,
    backdrop: "linear-gradient(120deg, rgba(190,140,255,.3), rgba(120,220,255,.25) 50%, rgba(255,170,220,.3))",
    dim: 0.55,
    rays: ["#c9a6ff", "#ffd1f2"],
    emitters: [
      { kind: "orb", at: 300, count: 40, colors: MAGIC, origin: "center", size: 14, speed: 260, life: 2200, gravity: -60 },
      { kind: "spark", at: 500, count: 60, colors: [...MAGIC, "#fff"], origin: "left", size: 4, speed: 480, life: 1500 },
      { kind: "confetti", at: 2600, count: 50, colors: MAGIC, origin: "center", size: 9, speed: 460, life: 2000, gravity: 200 },
    ],
  },

  lion: {
    tier: "legendary",
    duration: 6500,
    hero: "cine-charge",
    heroSize: 74,
    backdrop: "radial-gradient(circle at 50% 55%, rgba(255,185,60,.4), rgba(60,25,0,.55) 60%, rgba(0,0,0,.7))",
    dim: 0.82,
    rays: ["#ffd76a", "#ff9d2e"],
    flashes: [{ at: 2600, color: "rgba(255,220,140,.65)", dur: 500 }],
    shake: [{ at: 2600, strength: 18, dur: 900 }, { at: 4200, strength: 8, dur: 500 }],
    emitters: [
      { kind: "spark", at: 200, count: 60, colors: GOLD, origin: "bottom", size: 5, speed: 260, life: 2400, gravity: -80 },
      { kind: "smoke", at: 400, count: 24, colors: SMOKE, origin: "bottom", size: 90, speed: 180, life: 2600 },
      { kind: "ring", at: 2600, count: 4, colors: ["#ffd76a", "#ff9d2e"], origin: "center", life: 1300, stagger: 170 },
      { kind: "confetti", at: 2700, count: 90, colors: GOLD, origin: "center", size: 11, speed: 700, life: 2600, gravity: 340 },
      { kind: "ember", at: 4200, count: 50, colors: GOLD, origin: "bottom", size: 8, speed: 320, life: 2200, gravity: -120 },
    ],
  },
  dragon: {
    tier: "legendary",
    duration: 7000,
    hero: "cine-fly-across",
    heroSize: 76,
    backdrop: "linear-gradient(to top, rgba(120,20,0,.6), rgba(30,10,40,.6) 55%, rgba(0,0,0,.72))",
    dim: 0.85,
    flashes: [{ at: 3200, color: "rgba(255,120,40,.6)", dur: 600 }],
    shake: [{ at: 3200, strength: 16, dur: 1200 }],
    emitters: [
      { kind: "smoke", at: 300, count: 30, colors: SMOKE, origin: "right", size: 100, speed: 260, life: 2600 },
      { kind: "ember", at: 2200, count: 100, colors: FIRE, origin: "center", size: 11, speed: 620, life: 2400, gravity: 80, spread: 1 },
      { kind: "ring", at: 3200, count: 3, colors: ["#ff6a1e"], origin: "center", life: 1200, stagger: 200 },
      { kind: "spark", at: 4600, count: 60, colors: FIRE, origin: "bottom", size: 5, speed: 420, life: 2000, gravity: -140 },
    ],
  },
  phoenix: {
    tier: "legendary",
    duration: 7000,
    hero: "cine-rise-wings",
    heroSize: 74,
    backdrop: "radial-gradient(circle at 50% 75%, rgba(255,120,20,.45), rgba(40,10,30,.6) 60%, rgba(0,0,0,.72))",
    dim: 0.84,
    rays: ["#ff9d2e", "#ffd76a"],
    flashes: [{ at: 2400, color: "rgba(255,190,90,.6)", dur: 550 }],
    shake: [{ at: 2400, strength: 12, dur: 800 }],
    emitters: [
      { kind: "ember", at: 0, count: 90, colors: FIRE, origin: "bottom", size: 11, speed: 380, life: 2600, gravity: -160 },
      { kind: "ring", at: 2400, count: 4, colors: ["#ff9d2e"], origin: "center", life: 1300, stagger: 160 },
      { kind: "feather", at: 3000, count: 40, colors: ["#ffd76a", "#ff6a1e", "#fff0bd"], origin: "center", size: 20, speed: 300, life: 2600, gravity: 40 },
      { kind: "spark", at: 4600, count: 70, colors: GOLD, origin: "center", size: 5, speed: 520, life: 2200 },
    ],
  },
  castle: {
    tier: "legendary",
    duration: 7500,
    hero: "cine-raise",
    heroSize: 78,
    backdrop: "linear-gradient(to top, rgba(30,20,70,.7), rgba(80,50,160,.35) 55%, rgba(5,5,20,.6))",
    dim: 0.8,
    rays: ["#c9a6ff", "#7ad7ff"],
    flashes: [{ at: 3400, color: "rgba(200,180,255,.5)", dur: 600 }],
    shake: [{ at: 1400, strength: 7, dur: 1600 }, { at: 3400, strength: 12, dur: 700 }],
    emitters: [
      { kind: "smoke", at: 600, count: 26, colors: SMOKE, origin: "bottom", size: 90, speed: 150, life: 2600 },
      { kind: "orb", at: 1800, count: 40, colors: MAGIC, origin: "bottom", size: 14, speed: 220, life: 2600, gravity: -90 },
      { kind: "confetti", at: 3400, count: 110, colors: [...MAGIC, ...GOLD], origin: "top", size: 10, speed: 560, life: 3000, gravity: 240 },
      { kind: "ring", at: 3500, count: 3, colors: ["#c9a6ff"], origin: "center", life: 1400, stagger: 240 },
    ],
  },
  galaxy: {
    tier: "legendary",
    duration: 8000,
    hero: "cine-orbit",
    heroSize: 70,
    backdrop: "radial-gradient(circle at 50% 50%, rgba(120,80,255,.4), rgba(10,5,40,.75) 55%, rgba(0,0,0,.85))",
    dim: 0.9,
    rays: ["#7ad7ff", "#c9a6ff"],
    emitters: [
      { kind: "starfield", at: 0, count: 160, colors: ["#fff", "#bcd4ff", "#e5c8ff"], origin: "center", size: 3, speed: 260, life: 4200 },
      { kind: "orb", at: 1200, count: 30, colors: ["#7ad7ff", "#c9a6ff", "#ffd1f2"], origin: "center", size: 18, speed: 180, life: 3400 },
      { kind: "ring", at: 3000, count: 4, colors: ["#7ad7ff"], origin: "center", life: 1800, stagger: 340 },
    ],
  },
  thunder: {
    tier: "legendary",
    duration: 7500,
    hero: "cine-strike",
    heroSize: 68,
    backdrop: "linear-gradient(to top, rgba(10,20,50,.7), rgba(90,140,255,.25) 60%, rgba(0,0,10,.7))",
    dim: 0.86,
    flashes: [
      { at: 900, color: "rgba(220,240,255,.75)", dur: 220 },
      { at: 1300, color: "rgba(180,220,255,.55)", dur: 200 },
      { at: 2600, color: "rgba(240,250,255,.7)", dur: 300 },
    ],
    shake: [{ at: 900, strength: 16, dur: 700 }, { at: 2600, strength: 20, dur: 900 }],
    emitters: [
      { kind: "bolt", at: 800, count: 8, colors: ["#dff0ff", "#8fc6ff"], origin: "top", size: 6, life: 700, stagger: 220 },
      { kind: "spark", at: 900, count: 70, colors: ["#dff0ff", "#8fc6ff"], origin: "center", size: 4, speed: 620, life: 1400 },
      { kind: "ring", at: 2600, count: 4, colors: ["#8fc6ff"], origin: "center", life: 1200, stagger: 160 },
      { kind: "ember", at: 2700, count: 40, colors: ["#8fc6ff", "#fff"], origin: "bottom", size: 8, speed: 340, life: 2000, gravity: -120 },
    ],
  },
  volcano: {
    tier: "legendary",
    duration: 8000,
    hero: "cine-erupt",
    heroSize: 78,
    backdrop: "linear-gradient(to top, rgba(120,20,0,.75), rgba(60,20,10,.5) 50%, rgba(0,0,0,.7))",
    dim: 0.88,
    flashes: [{ at: 1600, color: "rgba(255,140,40,.6)", dur: 700 }],
    shake: [{ at: 1600, strength: 20, dur: 2200 }],
    emitters: [
      { kind: "smoke", at: 0, count: 34, colors: SMOKE, origin: "bottom", size: 120, speed: 200, life: 3400, gravity: -60 },
      { kind: "lava", at: 1600, count: 90, colors: FIRE, origin: "bottom", size: 14, speed: 620, life: 3000, gravity: 420, spread: 1 },
      { kind: "ember", at: 1800, count: 80, colors: FIRE, origin: "bottom", size: 9, speed: 420, life: 2800, gravity: -100 },
      { kind: "ring", at: 1600, count: 3, colors: ["#ff6a1e"], origin: "center", life: 1400, stagger: 260 },
    ],
  },
  universe: {
    tier: "legendary",
    duration: 9500,
    hero: "cine-universe",
    heroSize: 84,
    backdrop: "radial-gradient(circle at 50% 50%, rgba(255,120,220,.35), rgba(60,30,160,.55) 40%, rgba(0,0,10,.9))",
    dim: 0.94,
    rays: ["#ffd1f2", "#7ad7ff", "#ffd76a"],
    flashes: [
      { at: 1800, color: "rgba(255,255,255,.65)", dur: 400 },
      { at: 5200, color: "rgba(255,210,255,.6)", dur: 600 },
    ],
    shake: [{ at: 1800, strength: 14, dur: 1200 }, { at: 5200, strength: 22, dur: 1400 }],
    emitters: [
      { kind: "starfield", at: 0, count: 200, colors: ["#fff", "#bcd4ff", "#ffd1f2"], origin: "center", size: 3, speed: 320, life: 5200 },
      { kind: "ring", at: 1800, count: 5, colors: ["#ffd1f2", "#7ad7ff"], origin: "center", life: 2000, stagger: 280 },
      { kind: "orb", at: 2600, count: 40, colors: ["#ffd1f2", "#7ad7ff", "#ffd76a"], origin: "center", size: 20, speed: 240, life: 3600 },
      { kind: "confetti", at: 5200, count: 140, colors: ["#ffd1f2", "#7ad7ff", ...GOLD], origin: "center", size: 11, speed: 760, life: 3400, gravity: 260 },
      { kind: "spark", at: 5400, count: 100, colors: ["#fff", "#ffd76a"], origin: "center", size: 5, speed: 820, life: 2400 },
    ],
  },
};

export const DEFAULT_SCENE: Scene = {
  tier: "basic",
  duration: 2400,
  hero: "cine-pulse",
  heroSize: 34,
  backdrop: "radial-gradient(circle at 50% 50%, rgba(255,255,255,.18), transparent 65%)",
  dim: 0.3,
  emitters: [{ kind: "spark", at: 0, count: 30, colors: ["#fff", "#ffd76a"], origin: "center", size: 4, speed: 320, life: 1400 }],
};

/** Legacy catalog keys that predate the cinematic scene set. */
export const SCENE_ALIASES: Record<string, string> = {
  hearts: "heart",
  stars: "star",
  flame: "fire",
  roses: "rose",
  car: "supercar",
  legendary: "universe",
  sportscar: "supercar",
  lightning: "thunder",
  magic_castle: "castle",
  thunder_god: "thunder",
  legendary_universe: "universe",
};

export function resolveAnimationKey(animationKey: string): string {
  const key = String(animationKey ?? "").toLowerCase();
  return SCENES[key] ? key : (SCENE_ALIASES[key] ?? key);
}

export function sceneFor(animationKey: string): Scene {
  return SCENES[resolveAnimationKey(animationKey)] ?? DEFAULT_SCENE;
}

export function tierFor(animationKey: string): GiftTier {
  return sceneFor(animationKey).tier;
}

/** Legendary > premium > basic — used by the queue for priority ordering. */
export const TIER_WEIGHT: Record<GiftTier, number> = { basic: 0, premium: 1, legendary: 2 };
