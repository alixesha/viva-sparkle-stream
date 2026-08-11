import { useEffect, useMemo, useState } from "react";
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

/** Every animation key rendered by the engine, in catalog order. */
export const ANIMATION_KEYS = [
  "rose",
  "hearts",
  "kiss",
  "stars",
  "flame",
  "crown",
  "rocket",
  "diamond",
  "car",
  "supercar",
  "castle",
  "legendary",
] as const;

export type AnimationKey = (typeof ANIMATION_KEYS)[number];

/** How long each animation stays on screen (ms). */
const DURATION: Record<string, number> = {
  rose: 2900,
  hearts: 2800,
  kiss: 2700,
  stars: 3000,
  flame: 3000,
  crown: 4300,
  rocket: 3400,
  diamond: 4300,
  car: 3500,
  supercar: 4700,
  castle: 5300,
  legendary: 5700,
};

const FULLSCREEN = new Set(["crown", "diamond", "supercar", "castle", "legendary", "rocket"]);

const SIZE: Record<string, string> = {
  small: "text-6xl",
  medium: "text-7xl",
  large: "text-[7rem]",
  premium: "text-[8.5rem]",
};

function particles(count: number) {
  return Array.from({ length: count }, (_, i) => i);
}

/** Deterministic pseudo-random offsets so bursts look organic without re-render jitter. */
function spread(i: number, span: number) {
  const seq = [0, 0.62, -0.44, 0.28, -0.78, 0.9, -0.16, 0.46, -0.62, 0.74, -0.3, 0.12];
  return (seq[i % seq.length] ?? 0) * span;
}

function Burst({
  icons,
  count,
  className,
  duration,
  size = "text-4xl",
}: {
  icons: string[];
  count: number;
  className: string;
  duration: number;
  size?: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {particles(count).map((i) => (
        <span
          key={i}
          className={cn("absolute bottom-[12%] left-1/2", size, className)}
          style={{
            marginLeft: `${spread(i, 36)}vw`,
            animationDelay: `${(i % 6) * 0.14}s`,
            animationDuration: `${duration}ms`,
          }}
        >
          {icons[i % icons.length]}
        </span>
      ))}
    </div>
  );
}

function Rays({ tone = "var(--primary)" }: { tone?: string }) {
  return (
    <div
      className="absolute size-[150vmax] animate-gift-rays opacity-40"
      style={{
        background: `conic-gradient(from 0deg, transparent 0deg 12deg, ${tone} 12deg 16deg, transparent 16deg 30deg)`,
        maskImage: "radial-gradient(circle, black 20%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(circle, black 20%, transparent 70%)",
      }}
    />
  );
}

/** Per-key stage renderer — every gift gets a visually distinct effect. */
function Stage({ event }: { event: GiftEvent }) {
  const icon = event.icon;
  const big = SIZE[event.tier] ?? "text-7xl";
  const scale = Math.min(1 + Math.log10(Math.max(1, event.quantity)) * 0.35, 1.9);

  switch (event.animationKey) {
    case "rose":
      return <Burst icons={[icon, "🌷", icon]} count={Math.min(4 + event.quantity, 14)} className="animate-gift-rose" duration={2800} />;

    case "hearts":
      return (
        <Burst
          icons={[icon, "💖", "💗", "💓"]}
          count={Math.min(6 + event.quantity, 20)}
          className="animate-gift-heart drop-shadow-[0_0_18px_var(--accent)]"
          duration={2600}
        />
      );

    case "kiss":
      return (
        <div className="relative grid place-items-center">
          <span className={cn("animate-gift-kiss drop-shadow-[0_0_28px_var(--accent)]", big)} style={{ scale: String(scale) }}>
            {icon}
          </span>
          <Burst icons={["💋", "💗"]} count={8} className="animate-gift-heart opacity-80" duration={2400} size="text-2xl" />
        </div>
      );

    case "stars":
      return (
        <div className="relative grid size-full place-items-center">
          <span className={cn("animate-pulse-glow", big)}>{icon}</span>
          {particles(12).map((i) => (
            <span
              key={i}
              className="absolute animate-gift-star text-2xl"
              style={{
                marginLeft: `${spread(i, 34)}vw`,
                marginTop: `${spread(i + 3, 22)}vh`,
                animationDelay: `${(i % 6) * 0.16}s`,
              }}
            >
              ✨
            </span>
          ))}
        </div>
      );

    case "flame":
      return (
        <div className="relative grid place-items-center">
          <span className={cn("animate-flame", big)} style={{ scale: String(scale) }}>
            {icon}
          </span>
          <Burst icons={["🔥", "✨"]} count={10} className="animate-gift-heart opacity-70" duration={2200} size="text-xl" />
        </div>
      );

    case "crown":
      return (
        <div className="relative grid place-items-center">
          <Rays tone="var(--coin)" />
          <span className={cn("relative animate-gift-crown", big)} style={{ scale: String(scale) }}>
            {icon}
          </span>
          <Burst icons={["👑", "✨", "💫"]} count={8} className="animate-gift-star opacity-80" duration={1500} size="text-xl" />
        </div>
      );

    case "rocket":
      return (
        <div className="relative grid size-full place-items-center">
          <span className={cn("animate-rocket", big)} style={{ scale: String(scale) }}>
            {icon}
          </span>
          <Burst icons={["💨", "⭐"]} count={8} className="animate-gift-heart opacity-60" duration={2000} size="text-xl" />
        </div>
      );

    case "diamond":
      return (
        <div className="relative grid place-items-center">
          <Rays tone="var(--diamond)" />
          <span className={cn("relative animate-gift-diamond", big)} style={{ scale: String(scale) }}>
            {icon}
          </span>
          <div className="absolute h-24 w-1/2 animate-gift-shine bg-foreground/70 blur-md" />
        </div>
      );

    case "car":
      return (
        <div className="relative flex size-full items-center">
          <div className="relative flex w-full items-center animate-gift-car">
            <span className="absolute -left-10 animate-gift-smoke text-2xl">💨</span>
            <span className={cn("animate-gift-shake", big)}>{icon}</span>
          </div>
        </div>
      );

    case "supercar":
      return (
        <div className="relative flex size-full items-center overflow-hidden">
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="relative flex w-full items-center justify-center animate-gift-supercar">
            <span className={cn("animate-gift-shake drop-shadow-[0_0_30px_var(--primary)]", big)}>{icon}</span>
          </div>
        </div>
      );

    case "castle":
      return (
        <div className="relative grid size-full place-items-end justify-center pb-6">
          <Rays tone="var(--primary)" />
          <span className={cn("relative animate-gift-castle", big)} style={{ scale: String(scale) }}>
            {icon}
          </span>
          <Burst icons={["✨", "🎆", "💫"]} count={14} className="animate-gift-star" duration={1500} size="text-2xl" />
        </div>
      );

    case "legendary":
      return (
        <div className="relative grid size-full place-items-center">
          <Rays tone="var(--accent)" />
          <Rays tone="var(--coin)" />
          <span className={cn("relative animate-gift-legendary", big)} style={{ scale: String(scale) }}>
            {icon}
          </span>
          <Burst icons={["🌟", "🔥", "💫", "✨"]} count={18} className="animate-gift-heart" duration={2600} size="text-2xl" />
        </div>
      );

    default:
      return (
        <span className={cn("animate-pop drop-shadow-[0_0_30px_var(--primary)]", big)} style={{ scale: String(scale) }}>
          {icon}
        </span>
      );
  }
}

/**
 * CSS-driven gift animation. A gift's `animation_key` picks the effect; when an
 * admin uploads an `animationUrl` (GIF / MP4 / WEBM) that asset plays instead.
 */
export function GiftAnimation({ event, onDone }: { event: GiftEvent; onDone: () => void }) {
  const duration = DURATION[event.animationKey] ?? 3000;

  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [event.id, duration, onDone]);

  const fullScreen = FULLSCREEN.has(event.animationKey) || event.tier === "premium";
  const isVideo = Boolean(event.animationUrl && /\.(mp4|webm)$/i.test(event.animationUrl));

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {fullScreen && (
        <div className="absolute inset-0 animate-fade-in bg-gradient-to-t from-background/80 via-primary/20 to-transparent" />
      )}

      <div className="absolute inset-0 grid place-items-center">
        {event.animationUrl ? (
          isVideo ? (
            <video src={event.animationUrl} autoPlay muted playsInline className="max-h-[60vh] w-auto animate-fade-in" />
          ) : (
            <img src={event.animationUrl} alt={event.giftName} className="max-h-[60vh] w-auto animate-fade-in" />
          )
        ) : (
          <Stage event={event} />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-24 flex justify-center px-4">
        <div className="animate-slide-up rounded-full glass-strong px-4 py-1.5 text-center text-xs font-bold">
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

/** Small helper used by the admin gift manager to preview an animation key. */
export function useGiftPreview() {
  const [preview, setPreview] = useState<GiftEvent | null>(null);
  const queue = useMemo(() => (preview ? [preview] : []), [preview]);
  return { queue, preview: setPreview, clear: () => setPreview(null) };
}