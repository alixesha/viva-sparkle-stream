import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Animated combo counter — bumps its scale each time the multiplier grows. */
export function GiftComboDisplay({ quantity, tier }: { quantity: number; tier: string }) {
  const [bump, setBump] = useState(0);
  useEffect(() => setBump((b) => b + 1), [quantity]);
  if (quantity < 2) return null;
  return (
    <div className="pointer-events-none absolute right-4 top-[13%] z-40 select-none">
      <span
        key={bump}
        className={cn(
          "block animate-combo-pop font-display font-black italic leading-none drop-shadow-[0_4px_18px_rgba(0,0,0,.6)]",
          tier === "legendary"
            ? "bg-gradient-to-b from-[#fff6cf] via-[#ffd76a] to-[#ff8a1e] bg-clip-text text-[4.5rem] text-transparent"
            : tier === "premium"
              ? "bg-gradient-to-b from-white via-[#c9a6ff] to-[#7ad7ff] bg-clip-text text-[3.5rem] text-transparent"
              : "text-[2.75rem] text-foreground",
        )}
      >
        x{quantity}
      </span>
    </div>
  );
}
