import type { Gift } from "@/components/live/live-types";
import { sceneFor, type GiftTier } from "./gift-visuals";

/** One playable gift animation. */
export interface GiftEvent {
  id: string;
  giftId?: string;
  giftName: string;
  icon: string;
  animationKey: string;
  /** Uploaded Lottie / Rive / WebM / GIF asset — overrides the built-in scene. */
  animationUrl?: string | null;
  soundKey?: string | null;
  soundUrl?: string | null;
  durationMs?: number | null;
  tier: GiftTier | string;
  quantity: number;
  senderName: string;
  senderAvatar?: string | null;
  receiverName: string;
}

export function normalizedTier(event: GiftEvent): GiftTier {
  const t = String(event.tier ?? "").toLowerCase();
  if (t === "basic" || t === "premium" || t === "legendary") return t;
  if (t === "small") return "basic";
  if (t === "medium" || t === "big") return "premium";
  if (t === "epic" || t === "mythic") return "legendary";
  return sceneFor(event.animationKey).tier;
}

export function eventDuration(event: GiftEvent): number {
  const scene = sceneFor(event.animationKey);
  return event.durationMs && event.durationMs > 500 ? event.durationMs : scene.duration;
}

export function giftEventFromGift(gift: Gift, extras: Partial<GiftEvent> = {}): GiftEvent {
  const g = gift as Gift & { sound_key?: string | null; sound_url?: string | null; duration_ms?: number | null };
  return {
    id: `${gift.id}-${Date.now()}`,
    giftId: gift.id,
    giftName: gift.name,
    icon: gift.icon,
    animationKey: gift.animation_key,
    animationUrl: gift.animation_url,
    soundKey: g.sound_key ?? gift.animation_key,
    soundUrl: g.sound_url ?? null,
    durationMs: g.duration_ms ?? null,
    tier: gift.tier,
    quantity: 1,
    senderName: "You",
    receiverName: "Host",
    ...extras,
  };
}
