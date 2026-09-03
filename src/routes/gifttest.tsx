import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { GiftAnimationLayer, useGiftQueue } from "@/components/gifts/GiftAnimationEngine";
import { GIFT_CLIPS } from "@/lib/gifts/gift-clips";

// TEMPORARY verification harness — removed after visual QA.
export const Route = createFileRoute("/gifttest")({
  validateSearch: (s: Record<string, unknown>) => ({
    keys: typeof s["keys"] === "string" ? (s["keys"] as string) : "rose",
  }),
  component: Page,
});

function Page() {
  const { keys } = Route.useSearch();
  const { queue, push, consume } = useGiftQueue();

  useEffect(() => {
    keys.split(",").forEach((k, i) =>
      push({
        id: `${k}-${i}-${Date.now()}`,
        giftName: k,
        icon: "🎁",
        animationKey: k,
        tier: GIFT_CLIPS[k] && GIFT_CLIPS[k]!.duration > 9000 ? "legendary" : "premium",
        quantity: i + 1,
        senderName: "Ali",
        receiverName: "Usman",
        durationMs: 2000,
      }),
    );
  }, [keys, push]);

  useEffect(() => {
    (window as unknown as { __giftQueue: unknown }).__giftQueue = queue.map((q) => q.animationKey);
  }, [queue]);

  return (
    <div className="relative h-dvh w-full bg-neutral-900">
      <GiftAnimationLayer queue={queue} onConsume={consume} silent />
    </div>
  );
}
