import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface GiftEvent {
  id: string;
  giftName: string;
  icon: string;
  animationKey: string;
  animationUrl?: string | null;
  tier: string;
  quantity: number;
  senderName: string;
  receiverName: string;
}

const animationClass: Record<string, string> = {
  float: "animate-float-up",
  pulse: "animate-pulse-glow",
  sparkle: "animate-sparkle",
  flame: "animate-flame",
  crown: "animate-pop",
  rocket: "animate-rocket",
  drive: "animate-drive",
  galaxy: "animate-galaxy",
};

const tierDuration: Record<string, number> = {
  small: 2600,
  medium: 3200,
  large: 4200,
  premium: 5200,
};

const tierSize: Record<string, string> = {
  small: "text-5xl",
  medium: "text-7xl",
  large: "text-[7rem]",
  premium: "text-[9rem]",
};

/**
 * Elegant CSS-driven gift animation. `animationUrl` (Lottie JSON, GIF or MP4)
 * takes over automatically once assets are uploaded by an admin.
 */
export function GiftAnimation({ event, onDone }: { event: GiftEvent; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, tierDuration[event.tier] ?? 3000);
    return () => clearTimeout(t);
  }, [event, onDone]);

  const fullScreen = event.tier === "premium" || event.tier === "large";
  const anim = animationClass[event.animationKey] ?? "animate-pop";
  const isVideo = event.animationUrl?.endsWith(".mp4") || event.animationUrl?.endsWith(".webm");

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden">
      {fullScreen && (
        <div className="absolute inset-0 animate-fade-in bg-gradient-to-t from-background/80 via-primary/20 to-transparent" />
      )}

      <div className={cn("relative flex flex-col items-center gap-3", anim)}>
        {event.animationUrl ? (
          isVideo ? (
            <video
              src={event.animationUrl}
              autoPlay
              muted
              playsInline
              className="max-h-[60vh] w-auto"
            />
          ) : (
            <img src={event.animationUrl} alt={event.giftName} className="max-h-[60vh] w-auto" />
          )
        ) : (
          <span className={cn("drop-shadow-[0_0_30px_var(--primary)]", tierSize[event.tier] ?? "text-6xl")}>
            {event.icon}
          </span>
        )}

        <div className="rounded-full glass-strong px-4 py-1.5 text-center text-xs font-bold">
          <span className="brand-text">{event.senderName}</span>
          <span className="text-muted-foreground"> → </span>
          <span>{event.receiverName}</span>
          <span className="ml-2 text-foreground/90">
            {event.giftName} ×{event.quantity}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Queue-based host for gift animations so bursts play one after another. */
export function GiftAnimationLayer({ queue, onConsume }: { queue: GiftEvent[]; onConsume: (id: string) => void }) {
  const [current, setCurrent] = useState<GiftEvent | null>(null);

  useEffect(() => {
    if (!current && queue.length > 0) setCurrent(queue[0] ?? null);
  }, [queue, current]);

  if (!current) return null;
  return (
    <GiftAnimation
      event={current}
      onDone={() => {
        onConsume(current.id);
        setCurrent(null);
      }}
    />
  );
}