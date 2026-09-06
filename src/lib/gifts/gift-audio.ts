/**
 * Real cinematic gift audio — each MP3 is a layered mix of royalty-free
 * recordings (Mixkit free license) rendered so its hero hit lands exactly on
 * the matching clip's `impact` frame (see gift-clips.ts). Files start at t=0
 * of the gift, so playback is simply "play from the first frame".
 *
 * Lion is intentionally absent: its clip carries the real recorded roar.
 */
import rose from "@/assets/gift-sounds/rose.mp3.asset.json";
import heart from "@/assets/gift-sounds/heart.mp3.asset.json";
import star from "@/assets/gift-sounds/star.mp3.asset.json";
import kiss from "@/assets/gift-sounds/kiss.mp3.asset.json";
import fire from "@/assets/gift-sounds/fire.mp3.asset.json";
import crown from "@/assets/gift-sounds/crown.mp3.asset.json";
import diamond from "@/assets/gift-sounds/diamond.mp3.asset.json";
import rocket from "@/assets/gift-sounds/rocket.mp3.asset.json";
import supercar from "@/assets/gift-sounds/supercar.mp3.asset.json";
import eagle from "@/assets/gift-sounds/eagle.mp3.asset.json";
import tiger from "@/assets/gift-sounds/tiger.mp3.asset.json";
import unicorn from "@/assets/gift-sounds/unicorn.mp3.asset.json";
import dragon from "@/assets/gift-sounds/dragon.mp3.asset.json";
import phoenix from "@/assets/gift-sounds/phoenix.mp3.asset.json";
import castle from "@/assets/gift-sounds/castle.mp3.asset.json";
import galaxy from "@/assets/gift-sounds/galaxy.mp3.asset.json";
import thunder from "@/assets/gift-sounds/thunder.mp3.asset.json";
import volcano from "@/assets/gift-sounds/volcano.mp3.asset.json";
import universe from "@/assets/gift-sounds/universe.mp3.asset.json";

export const GIFT_AUDIO: Record<string, string> = {
  rose: rose.url,
  heart: heart.url,
  star: star.url,
  kiss: kiss.url,
  fire: fire.url,
  crown: crown.url,
  diamond: diamond.url,
  rocket: rocket.url,
  supercar: supercar.url,
  eagle: eagle.url,
  tiger: tiger.url,
  unicorn: unicorn.url,
  dragon: dragon.url,
  phoenix: phoenix.url,
  castle: castle.url,
  galaxy: galaxy.url,
  thunder: thunder.url,
  volcano: volcano.url,
  universe: universe.url,
};

const ALIASES: Record<string, string> = {
  hearts: "heart",
  stars: "star",
  flame: "fire",
  roses: "rose",
  car: "supercar",
  sportscar: "supercar",
  legendary: "universe",
  legendary_universe: "universe",
  lightning: "thunder",
  thunder_god: "thunder",
  magic_castle: "castle",
};

/** Hosted MP3 for a gift sound key (or its alias), if one exists. */
export function giftAudioFor(key: string | null | undefined): string | undefined {
  const k = String(key ?? "").toLowerCase();
  return GIFT_AUDIO[k] ?? GIFT_AUDIO[ALIASES[k] ?? ""];
}
