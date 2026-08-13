import { LionGiftScene } from "./LionGiftScene";
import { useEffect, useMemo, useRef, useState } from "react";
import { ParticleCanvas } from "./ParticleCanvas";
import { GiftComboDisplay } from "./GiftComboDisplay";
import { CinematicHero } from "./CinematicHero";
import { resolveMedia } from "@/lib/media";
import { giftSounds } from "@/lib/gifts/gift-sound";
import { sceneFor } from "@/lib/gifts/gift-visuals";
import { eventDuration, normalizedTier, type GiftEvent } from "@/lib/gifts/gift-events";

/**
 * Gifts that ship a bespoke, hand-built cinematic scene component.
 * Everything else uses the shared CinematicHero stage.
 */
const SCENE_COMPONENTS: Record<string, React.ComponentType<{ duration?: number; icon?: string }>> = {
  lion: LionGiftScene,
};

function isVideo(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}
function isLottie(url: string) {
  return /\.(json|lottie)(\?|$)/i.test(url);
}
function isRive(url: string) {
  return /\.riv(\?|$)/i.test(url);
}

/**
 * Renders ONE gift as a full-screen cinematic sequence:
 * backdrop dim → rays → hero motion → particle bursts → flashes/shake →
 * sender ribbon → cleanup. Uploaded assets (WebM / GIF / Lottie / Rive) take
 * over the hero layer when present.
 */
export function GiftOverlay({
  event,
  onDone,
  silent = false,
}: {
  event: GiftEvent;
  onDone: () => void;
  silent?: boolean;
}) {
  const scene = useMemo(() => sceneFor(event.animationKey), [event.animationKey]);
  const tier = normalizedTier(event);
  const duration = eventDuration(event);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [flash, setFlash] = useState<{ color: string; dur: number } | null>(null);
  // Assets live in a private bucket, so every viewer resolves their own signed URL.
  const [asset, setAsset] = useState<string | null>(
    event.animationUrl && /^https?:\/\//.test(event.animationUrl) ? event.animationUrl : null,
  );

  useEffect(() => {
    let alive = true;
    void resolveMedia(event.animationUrl).then((url) => {
      if (alive) setAsset(url);
    });
    return () => {
      alive = false;
    };
  }, [event.animationUrl]);

  // sound: one voice per gift, always stopped on unmount
  useEffect(() => {
    if (silent) return;
    let stop: (() => void) | undefined;
    let alive = true;
    void resolveMedia(event.soundUrl).then((url) => {
      if (!alive) return;
      stop = giftSounds.play(event.soundKey ?? event.animationKey, url);
    });
    return () => {
      alive = false;
      stop?.();
    };
  }, [event.id, event.soundKey, event.soundUrl, event.animationKey, silent]);

  // lifecycle timer
  useEffect(() => {
    const t = window.setTimeout(onDone, duration);
    return () => window.clearTimeout(t);
  }, [event.id, duration, onDone]);

  // camera FX
  useEffect(() => {
    const timers: number[] = [];
    for (const f of scene.flashes ?? []) {
      timers.push(
        window.setTimeout(() => {
          setFlash({ color: f.color, dur: f.dur ?? 320 });
          timers.push(window.setTimeout(() => setFlash(null), f.dur ?? 320));
        }, f.at),
      );
    }
    for (const s of scene.shake ?? []) {
      timers.push(
        window.setTimeout(() => {
          const el = rootRef.current;
          if (!el) return;
          el.style.setProperty("--shake", `${s.strength}px`);
          el.classList.add("gift-shake-active");
          timers.push(window.setTimeout(() => el.classList.remove("gift-shake-active"), s.dur ?? 600));
        }, s.at),
      );
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [event.id, scene]);

  const SceneComponent = SCENE_COMPONENTS[event.animationKey];
  const assetNode = asset ? (
    isVideo(asset) ? (
      <video src={asset} autoPlay muted={silent || giftSounds.isMuted} playsInline />
    ) : isLottie(asset) || isRive(asset) ? (
      <LazyVectorAsset url={asset} />
    ) : (
      <img src={asset} alt={event.giftName} />
    )
  ) : undefined;

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {/* live video dim */}
      <div
        className="absolute inset-0 animate-gift-dim bg-black"
        style={{ ["--gift-dim" as string]: String(scene.dim), animationDuration: `${duration}ms` }}
      />
      <div className="absolute inset-0 animate-fade-in" style={{ background: scene.backdrop }} />

      {/* rotating god-rays for premium/legendary scenes */}
      {(scene.rays ?? []).map((tone, i) => (
        <div
          key={`${tone}-${i}`}
          className="absolute left-1/2 top-1/2 size-[190vmax] -translate-x-1/2 -translate-y-1/2 animate-gift-rays opacity-40"
          style={{
            animationDuration: `${8 + i * 3}s`,
            animationDirection: i % 2 ? "reverse" : "normal",
            background: `conic-gradient(from 0deg, transparent 0deg 10deg, ${tone} 10deg 14deg, transparent 14deg 28deg)`,
            maskImage: "radial-gradient(circle, black 10%, transparent 68%)",
            WebkitMaskImage: "radial-gradient(circle, black 10%, transparent 68%)",
          }}
        />
      ))}

      <ParticleCanvas emitters={scene.emitters} duration={duration} />

      {/* hero layer */}
      <div className="absolute inset-0">
        {SceneComponent && !assetNode ? (
          <SceneComponent duration={duration} icon={event.icon} />
        ) : (
          <CinematicHero
            scene={scene}
            tier={tier}
            icon={event.icon}
            duration={duration}
            asset={assetNode}
          />
        )}
      </div>
      <GiftComboDisplay quantity={event.quantity} tier={tier} />

      {/* sender ribbon */}
      <div className="absolute inset-x-0 bottom-[16%] flex justify-center px-4">
        <div className="flex animate-slide-up items-center gap-2.5 rounded-full glass-strong px-3 py-2 shadow-2xl">
          {event.senderAvatar ? (
            <img src={event.senderAvatar} alt="" className="size-8 rounded-full object-cover ring-2 ring-primary/70" />
          ) : (
            <span className="grid size-8 place-items-center rounded-full brand-gradient text-xs font-black text-primary-foreground">
              {event.senderName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="text-left text-xs leading-tight">
            <p className="font-bold">
              <span className="brand-text">{event.senderName}</span>
              <span className="text-muted-foreground"> sent </span>
              <span>{event.giftName}</span>
              <span className="text-muted-foreground"> to </span>
              <span>{event.receiverName}</span>
            </p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {tier} gift · ×{event.quantity} · TEST GIFT
            </p>
          </div>
          <span className="text-2xl">{event.icon}</span>
        </div>
      </div>

      {flash && (
        <div
          className="absolute inset-0 animate-gift-flash"
          style={{ background: flash.color, animationDuration: `${flash.dur}ms` }}
        />
      )}
    </div>
  );
}

/**
 * Lottie / Rive assets are heavy, so the player is only loaded when a gift
 * actually uses one. Install `lottie-web` or `@rive-app/canvas` to activate;
 * until then the icon scene keeps playing so nothing ever looks broken.
 */
function LazyVectorAsset({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let destroy: (() => void) | undefined;
    void (async () => {
      try {
        const spec = "lottie-web";
        const mod = (await import(/* @vite-ignore */ spec)) as {
          default: { loadAnimation: (o: Record<string, unknown>) => { destroy: () => void } };
        };
        if (!ref.current) return;
        const anim = mod.default.loadAnimation({
          container: ref.current,
          renderer: "svg",
          loop: false,
          autoplay: true,
          path: url,
        });
        destroy = () => anim.destroy();
      } catch {
        setFailed(true);
      }
    })();
    return () => destroy?.();
  }, [url]);

  if (failed) return <span className="text-[30vmin]">🎁</span>;
  return <div ref={ref} className="size-[80vmin]" />;
}
