import { createFileRoute } from "@tanstack/react-router";
import { GiftOverlay } from "@/components/gifts/GiftOverlay";

export const Route = createFileRoute("/liontest")({
  component: () => (
    <div className="relative mx-auto h-dvh w-full max-w-md overflow-hidden bg-black">
      <GiftOverlay
        event={{
          id: "t1",
          giftName: "Lion",
          icon: "🦁",
          animationKey: "lion",
          tier: "legendary",
          quantity: 1,
          durationMs: 11500,
          senderName: "Ali",
          receiverName: "Usman",
        }}
        onDone={() => undefined}
        silent
      />
    </div>
  ),
});
