/**
 * Compatibility surface for the premium gift system.
 * Implementation lives in GiftAnimationEngine / GiftOverlay / ParticleCanvas.
 */
export { GiftAnimationLayer, useGiftQueue, useGiftPreview, pickNext } from "./GiftAnimationEngine";
export { GiftOverlay } from "./GiftOverlay";
export { giftSounds } from "@/lib/gifts/gift-sound";
export { SCENES, sceneFor, tierFor } from "@/lib/gifts/gift-visuals";
export { giftEventFromGift, eventDuration, normalizedTier } from "@/lib/gifts/gift-events";
export type { GiftEvent } from "@/lib/gifts/gift-events";

/** Animation keys shipped with the app, in catalog order. */
export const ANIMATION_KEYS = [
  "rose",
  "heart",
  "star",
  "kiss",
  "fire",
  "crown",
  "diamond",
  "rocket",
  "supercar",
  "eagle",
  "tiger",
  "unicorn",
  "lion",
  "dragon",
  "phoenix",
  "castle",
  "galaxy",
  "thunder",
  "volcano",
  "universe",
] as const;

export type AnimationKey = (typeof ANIMATION_KEYS)[number];
