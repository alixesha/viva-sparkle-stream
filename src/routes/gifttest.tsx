import { createFileRoute } from "@tanstack/react-router";
import { GiftOverlay } from "@/components/gifts/GiftOverlay";
import type { GiftEvent } from "@/lib/gifts/gift-events";

export const Route = createFileRoute("/gifttest")({ component: Page });

const keys = ["lion", "rose", "crown", "universe"];

function Page() {
  return (
    <div className="grid grid-cols-2">
      {keys.map((k) => {
        const e: GiftEvent = {
          id: k, giftName: k, icon: "🦁", animationKey: k, tier: "legendary",
          quantity: 3, senderName: "Ali", receiverName: "Usman",
        };
        return (
          <div key={k} className="relative h-[420px] w-full bg-black">
            <GiftOverlay event={e} onDone={() => {}} silent />
          </div>
        );
      })}
    </div>
  );
}
