/**
 * Production clip registry — every built-in gift ships a cinematic, photoreal
 * 9:16 clip (MP4/H.264 + WebM/VP9) hosted on the CDN. The browser picks the
 * first `<source>` it can decode, so WebM is listed first for Chromium builds
 * that lack H.264 and MP4 covers Safari / everything else.
 *
 * `impact` is the frame (ms) where the gift "lands" — the flash, shockwave and
 * camera shake are locked to it. `duration` is the clip length plus a short
 * exit tail so the fade-out never cuts the last frame.
 */
import roseMp4 from "@/assets/gifts/rose.mp4.asset.json";
import roseWebm from "@/assets/gifts/rose.webm.asset.json";
import heartMp4 from "@/assets/gifts/heart.mp4.asset.json";
import heartWebm from "@/assets/gifts/heart.webm.asset.json";
import starMp4 from "@/assets/gifts/star.mp4.asset.json";
import starWebm from "@/assets/gifts/star.webm.asset.json";
import kissMp4 from "@/assets/gifts/kiss.mp4.asset.json";
import kissWebm from "@/assets/gifts/kiss.webm.asset.json";
import fireMp4 from "@/assets/gifts/fire.mp4.asset.json";
import fireWebm from "@/assets/gifts/fire.webm.asset.json";
import crownMp4 from "@/assets/gifts/crown.mp4.asset.json";
import crownWebm from "@/assets/gifts/crown.webm.asset.json";
import diamondMp4 from "@/assets/gifts/diamond.mp4.asset.json";
import diamondWebm from "@/assets/gifts/diamond.webm.asset.json";
import rocketMp4 from "@/assets/gifts/rocket.mp4.asset.json";
import rocketWebm from "@/assets/gifts/rocket.webm.asset.json";
import supercarMp4 from "@/assets/gifts/supercar.mp4.asset.json";
import supercarWebm from "@/assets/gifts/supercar.webm.asset.json";
import eagleMp4 from "@/assets/gifts/eagle.mp4.asset.json";
import eagleWebm from "@/assets/gifts/eagle.webm.asset.json";
import tigerMp4 from "@/assets/gifts/tiger.mp4.asset.json";
import tigerWebm from "@/assets/gifts/tiger.webm.asset.json";
import unicornMp4 from "@/assets/gifts/unicorn.mp4.asset.json";
import unicornWebm from "@/assets/gifts/unicorn.webm.asset.json";
import lionMp4 from "@/assets/gifts/lion.mp4.asset.json";
import lionWebm from "@/assets/gifts/lion.webm.asset.json";
import dragonMp4 from "@/assets/gifts/dragon.mp4.asset.json";
import dragonWebm from "@/assets/gifts/dragon.webm.asset.json";
import phoenixMp4 from "@/assets/gifts/phoenix.mp4.asset.json";
import phoenixWebm from "@/assets/gifts/phoenix.webm.asset.json";
import castleMp4 from "@/assets/gifts/castle.mp4.asset.json";
import castleWebm from "@/assets/gifts/castle.webm.asset.json";
import galaxyMp4 from "@/assets/gifts/galaxy.mp4.asset.json";
import galaxyWebm from "@/assets/gifts/galaxy.webm.asset.json";
import thunderMp4 from "@/assets/gifts/thunder.mp4.asset.json";
import thunderWebm from "@/assets/gifts/thunder.webm.asset.json";
import volcanoMp4 from "@/assets/gifts/volcano.mp4.asset.json";
import volcanoWebm from "@/assets/gifts/volcano.webm.asset.json";
import universeMp4 from "@/assets/gifts/universe.mp4.asset.json";
import universeWebm from "@/assets/gifts/universe.webm.asset.json";

export interface GiftClip {
  mp4: string;
  webm: string;
  /** total scene length in ms (clip + exit tail) */
  duration: number;
  /** ms into the clip where the hero impact lands */
  impact: number;
  /** accent used for the impact flash / glow */
  glow: string;
  /** how strongly the live video is dimmed behind the clip (0-1) */
  dim: number;
  /** clip carries its own soundtrack — skip the generic SFX */
  scored?: boolean;
}

const SHORT = 5700; // 5.17s clips
const LONG = 10700; // 10.1s clips

export const GIFT_CLIPS: Record<string, GiftClip> = {
  rose: { mp4: roseMp4.url, webm: roseWebm.url, duration: SHORT, impact: 2400, glow: "rgba(255,70,90,.55)", dim: 0.55 },
  heart: { mp4: heartMp4.url, webm: heartWebm.url, duration: SHORT, impact: 1400, glow: "rgba(255,90,140,.6)", dim: 0.55 },
  star: { mp4: starMp4.url, webm: starWebm.url, duration: SHORT, impact: 3000, glow: "rgba(255,215,106,.7)", dim: 0.6 },
  kiss: { mp4: kissMp4.url, webm: kissWebm.url, duration: SHORT, impact: 2000, glow: "rgba(255,120,170,.55)", dim: 0.55 },
  fire: { mp4: fireMp4.url, webm: fireWebm.url, duration: SHORT, impact: 1300, glow: "rgba(255,140,40,.7)", dim: 0.6 },
  crown: { mp4: crownMp4.url, webm: crownWebm.url, duration: SHORT, impact: 2000, glow: "rgba(255,200,80,.7)", dim: 0.65 },
  diamond: { mp4: diamondMp4.url, webm: diamondWebm.url, duration: SHORT, impact: 1500, glow: "rgba(190,235,255,.75)", dim: 0.65 },
  rocket: { mp4: rocketMp4.url, webm: rocketWebm.url, duration: SHORT, impact: 3000, glow: "rgba(255,180,90,.7)", dim: 0.65 },
  supercar: { mp4: supercarMp4.url, webm: supercarWebm.url, duration: SHORT, impact: 2200, glow: "rgba(255,60,60,.6)", dim: 0.7 },
  eagle: { mp4: eagleMp4.url, webm: eagleWebm.url, duration: SHORT, impact: 2200, glow: "rgba(255,210,140,.6)", dim: 0.7 },
  tiger: { mp4: tigerMp4.url, webm: tigerWebm.url, duration: SHORT, impact: 2300, glow: "rgba(255,150,60,.65)", dim: 0.7 },
  unicorn: { mp4: unicornMp4.url, webm: unicornWebm.url, duration: SHORT, impact: 2400, glow: "rgba(200,170,255,.65)", dim: 0.7 },
  lion: { mp4: lionMp4.url, webm: lionWebm.url, duration: 11500, impact: 6420, glow: "rgba(255,190,80,.7)", dim: 0.8, scored: true },
  dragon: { mp4: dragonMp4.url, webm: dragonWebm.url, duration: LONG, impact: 5200, glow: "rgba(255,110,30,.75)", dim: 0.8 },
  phoenix: { mp4: phoenixMp4.url, webm: phoenixWebm.url, duration: LONG, impact: 5600, glow: "rgba(255,150,40,.75)", dim: 0.8 },
  castle: { mp4: castleMp4.url, webm: castleWebm.url, duration: LONG, impact: 7200, glow: "rgba(200,170,255,.65)", dim: 0.8 },
  galaxy: { mp4: galaxyMp4.url, webm: galaxyWebm.url, duration: LONG, impact: 8600, glow: "rgba(190,170,255,.7)", dim: 0.85 },
  thunder: { mp4: thunderMp4.url, webm: thunderWebm.url, duration: LONG, impact: 8300, glow: "rgba(150,210,255,.85)", dim: 0.85 },
  volcano: { mp4: volcanoMp4.url, webm: volcanoWebm.url, duration: LONG, impact: 4200, glow: "rgba(255,110,40,.8)", dim: 0.8 },
  universe: { mp4: universeMp4.url, webm: universeWebm.url, duration: LONG, impact: 2600, glow: "rgba(255,215,140,.8)", dim: 0.85 },
};

export function clipFor(resolvedKey: string): GiftClip | undefined {
  return GIFT_CLIPS[resolvedKey];
}
