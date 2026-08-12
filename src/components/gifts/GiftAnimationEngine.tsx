import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GiftOverlay } from "./GiftOverlay";
import { giftSounds } from "@/lib/gifts/gift-sound";
import { TIER_WEIGHT } from "@/lib/gifts/gift-visuals";
import { normalizedTier, type GiftEvent } from "@/lib/gifts/gift-events";

/**
 * GiftAnimationQueue — decides what plays next.
 *
 * - legendary gifts jump the queue, then premium, then basic
 * - identical gifts from the same sender are merged into a single combo burst,
 *   so a x100 spam never replays an expensive 8s scene 100 times
 * - only ever one full-screen animation on screen at a time
 */
export function pickNext(queue: GiftEvent[]): { event: GiftEvent; ids: string[] } | null {
  if (queue.length === 0) return null;
  const best = queue.reduce((a, b) => (TIER_WEIGHT[normalizedTier(b)] > TIER_WEIGHT[normalizedTier(a)] ? b : a));
  const group = queue.filter((g) => g.animationKey === best.animationKey && g.senderName === best.senderName);
  const quantity = Math.min(
    999,
    group.reduce((sum, g) => sum + (g.quantity || 1), 0),
  );
  return { event: { ...best, quantity }, ids: group.map((g) => g.id) };
}

/** Queue-driven host for gift animations. Drop one per live room. */
export function GiftAnimationLayer({
  queue,
  onConsume,
  silent = false,
}: {
  queue: GiftEvent[];
  onConsume: (ids: string[]) => void;
  silent?: boolean;
}) {
  const [playing, setPlaying] = useState<{ event: GiftEvent; ids: string[] } | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (busy.current) return;
    const next = pickNext(queue);
    if (!next) return;
    busy.current = true;
    setPlaying(next);
  }, [queue]);

  const done = useCallback(() => {
    const ids = playing?.ids ?? [];
    setPlaying(null);
    busy.current = false;
    onConsume(ids);
  }, [playing, onConsume]);

  // stop any lingering voice when the room unmounts
  useEffect(() => () => giftSounds.stopAll(), []);

  if (!playing) return null;
  return <GiftOverlay key={playing.event.id} event={playing.event} onDone={done} silent={silent} />;
}

/** Local queue helper for pages that receive realtime gift events. */
export function useGiftQueue() {
  const [queue, setQueue] = useState<GiftEvent[]>([]);
  const push = useCallback((event: GiftEvent) => setQueue((q) => [...q, event].slice(-60)), []);
  const consume = useCallback((ids: string[]) => setQueue((q) => q.filter((g) => !ids.includes(g.id))), []);
  const clear = useCallback(() => setQueue([]), []);
  return { queue, push, consume, clear };
}

/** Preview a single gift (used by the admin gift manager). */
export function useGiftPreview() {
  const [event, setEvent] = useState<GiftEvent | null>(null);
  const queue = useMemo(() => (event ? [event] : []), [event]);
  return {
    queue,
    preview: (e: GiftEvent | null) => setEvent(e ? { ...e, id: `${e.id}-${Date.now()}` } : null),
    clear: () => setEvent(null),
  };
}

export { giftSounds };
export type { GiftEvent };
