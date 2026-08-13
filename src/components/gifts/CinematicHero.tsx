import { useEffect, useMemo, useRef } from "react";
import type { Scene } from "@/lib/gifts/gift-visuals";
import type { GiftTier } from "@/lib/gifts/gift-visuals";

/**
 * Professional, TikTok/MICO-style hero stage used by every gift that does not
 * ship a bespoke scene component (Lion has its own).
 *
 * Layers, back to front:
 *   spotlight pool → counter-rotating halos → orbiting sparkles → energy streaks
 *   → hero core (per-gift CSS keyframe from the scene spec) → shockwave rings
 *   → impact bloom
 *
 * The choreography scales with the gift duration so basic (≈2s) gifts feel
 * snappy while legendary (≈8s) gifts get a real entrance / impact / exit arc.
 */
export function CinematicHero({
  scene,
  tier,
  icon,
  duration,
  asset,
}: {
  scene: Scene;
  tier: GiftTier;
  icon: string;
  duration: number;
  /** Optional resolved image/video element rendered instead of the emoji core. */
  asset?: React.ReactNode;
}) {
  const root = useRef<HTMLDivElement | null>(null);

  const glow = useMemo(() => {
    const rays = scene.rays ?? [];
    const fromEmitter = scene.emitters[0]?.colors ?? [];
    const pool = [...rays, ...fromEmitter, "#ffd76a"];
    return { a: pool[0]!, b: pool[1] ?? pool[0]!, c: pool[2] ?? pool[0]! };
  }, [scene]);

  // key beats, as a fraction of the total duration
  const enter = Math.round(duration * 0.28);
  const impact = Math.round(duration * 0.42);
  const exit = Math.max(duration - 800, Math.round(duration * 0.78));

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const timers: number[] = [];
    const add = (ms: number, cls: string) =>
      timers.push(window.setTimeout(() => el.classList.add(cls), ms));
    add(40, "ch-awake");
    add(enter, "ch-charged");
    add(impact, "ch-impact");
    add(exit, "ch-exit");
    return () => timers.forEach(window.clearTimeout);
  }, [enter, impact, exit]);

  const ringCount = tier === "legendary" ? 4 : tier === "premium" ? 3 : 2;
  const orbitCount = tier === "legendary" ? 16 : tier === "premium" ? 12 : 8;

  return (
    <div
      ref={root}
      className="cine-hero absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={
        {
          ["--ch-a" as string]: glow.a,
          ["--ch-b" as string]: glow.b,
          ["--ch-c" as string]: glow.c,
          ["--ch-size" as string]: `${scene.heroSize}vmin`,
          ["--ch-dur" as string]: `${duration}ms`,
          ["--ch-hero" as string]: scene.hero,
        } as React.CSSProperties
      }
    >
      <style>{`
        .cine-hero { isolation: isolate; pointer-events: none; }

        .cine-hero .ch-pool {
          position: absolute; left: 50%; top: 52%;
          width: 95vmin; height: 95vmin;
          transform: translate(-50%,-50%) scale(.6);
          background: radial-gradient(circle, color-mix(in srgb, var(--ch-a) 45%, transparent) 0%, transparent 58%);
          opacity: 0; filter: blur(10px); mix-blend-mode: screen;
          transition: opacity 700ms ease-out, transform 900ms cubic-bezier(.16,.84,.28,1);
        }
        .cine-hero.ch-awake .ch-pool { opacity: .6; transform: translate(-50%,-50%) scale(1); }

        .cine-hero .ch-halo {
          position: absolute; left: 50%; top: 52%;
          width: 120vmin; height: 120vmin;
          transform: translate(-50%,-50%);
          border-radius: 50%;
          background: conic-gradient(from 0deg,
            transparent 0 12deg,
            color-mix(in srgb, var(--ch-b) 70%, transparent) 12deg 16deg,
            transparent 16deg 40deg,
            color-mix(in srgb, var(--ch-c) 55%, transparent) 40deg 43deg,
            transparent 43deg 90deg);
          mask-image: radial-gradient(circle, transparent 26%, black 42%, transparent 70%);
          -webkit-mask-image: radial-gradient(circle, transparent 26%, black 42%, transparent 70%);
          opacity: 0;
          animation: ch-spin 9s linear infinite;
          transition: opacity 600ms ease-out;
        }
        .cine-hero .ch-halo.h2 { width: 92vmin; height: 92vmin; animation: ch-spin 6s linear infinite reverse; }
        .cine-hero.ch-awake .ch-halo { opacity: .7; }
        .cine-hero.ch-exit .ch-halo, .cine-hero.ch-exit .ch-pool { opacity: 0; }

        .cine-hero .ch-orbit {
          position: absolute; left: 50%; top: 52%;
          width: 0; height: 0;
          animation: ch-spin 5.5s linear infinite;
          opacity: 0; transition: opacity 500ms ease-out;
        }
        .cine-hero.ch-awake .ch-orbit { opacity: 1; }
        .cine-hero .ch-orbit i {
          position: absolute;
          width: 1.1vmin; height: 1.1vmin;
          border-radius: 50%;
          background: var(--ch-a);
          box-shadow: 0 0 12px 3px color-mix(in srgb, var(--ch-a) 80%, transparent);
          animation: ch-twinkle 1.6s ease-in-out infinite;
        }

        .cine-hero .ch-streaks {
          position: absolute; inset: 0;
          background:
            repeating-linear-gradient(115deg,
              transparent 0 6vmin,
              color-mix(in srgb, var(--ch-b) 22%, transparent) 6vmin 6.4vmin,
              transparent 6.4vmin 14vmin);
          mask-image: radial-gradient(ellipse at 50% 52%, black 8%, transparent 60%);
          -webkit-mask-image: radial-gradient(ellipse at 50% 52%, black 8%, transparent 60%);
          mix-blend-mode: screen;
          opacity: 0;
          animation: ch-streaks 2.4s linear infinite;
        }
        .cine-hero.ch-charged .ch-streaks { opacity: .3; }
        .cine-hero.ch-exit .ch-streaks { opacity: 0; }

        .cine-hero .ch-core {
          position: absolute; left: 50%; top: 52%;
          transform: translate(-50%,-50%);
          z-index: 6;
          display: grid; place-items: center;
          will-change: transform, filter, opacity;
        }
        .cine-hero .ch-core-inner {
          font-size: var(--ch-size);
          line-height: 1;
          user-select: none;
          animation-name: var(--ch-hero);
          animation-duration: var(--ch-dur);
          animation-timing-function: cubic-bezier(.16,.84,.28,1);
          animation-fill-mode: both;
          filter:
            drop-shadow(0 0 22px color-mix(in srgb, var(--ch-a) 85%, transparent))
            drop-shadow(0 0 70px color-mix(in srgb, var(--ch-b) 60%, transparent));
        }
        .cine-hero .ch-core-inner > img,
        .cine-hero .ch-core-inner > video {
          max-height: 85vh; width: auto; max-width: 95vw; display: block;
        }
        .cine-hero .ch-core-glow {
          position: absolute; left: 50%; top: 50%;
          width: calc(var(--ch-size) * 1.5); height: calc(var(--ch-size) * 1.5);
          transform: translate(-50%,-50%);
          border-radius: 50%;
          background: radial-gradient(circle, color-mix(in srgb, var(--ch-a) 55%, transparent), transparent 64%);
          filter: blur(16px); mix-blend-mode: screen;
          z-index: -1;
          animation: ch-breathe 1.6s ease-in-out infinite;
        }
        .cine-hero.ch-impact .ch-core-inner { animation-play-state: running; }
        .cine-hero.ch-exit .ch-core { animation: ch-core-exit 800ms cubic-bezier(.6,.05,.9,.25) forwards; }

        .cine-hero .ch-wave {
          position: absolute; left: 50%; top: 52%;
          width: 22vmin; height: 22vmin;
          border-radius: 50%;
          border: .5vmin solid color-mix(in srgb, var(--ch-a) 85%, transparent);
          box-shadow: 0 0 30px color-mix(in srgb, var(--ch-b) 75%, transparent),
                      inset 0 0 24px color-mix(in srgb, var(--ch-c) 55%, transparent);
          transform: translate(-50%,-50%) scale(.1);
          opacity: 0; z-index: 5;
        }
        .cine-hero.ch-impact .ch-wave { animation: ch-wave 1100ms cubic-bezier(.1,.7,.15,1) forwards; }

        .cine-hero .ch-bloom {
          position: absolute; inset: 0; z-index: 9;
          background: radial-gradient(circle at 50% 52%, #fff, transparent 55%);
          mix-blend-mode: screen; opacity: 0;
        }
        .cine-hero.ch-impact .ch-bloom { animation: ch-bloom 420ms ease-out forwards; }

        @keyframes ch-spin { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes ch-twinkle { 0%,100% { opacity: .35; transform: scale(.7); } 50% { opacity: 1; transform: scale(1.5); } }
        @keyframes ch-streaks { to { background-position: 28vmin 0; } }
        @keyframes ch-breathe { 0%,100% { opacity: .55; transform: translate(-50%,-50%) scale(.9); } 50% { opacity: 1; transform: translate(-50%,-50%) scale(1.12); } }
        @keyframes ch-wave {
          0% { opacity: 0; transform: translate(-50%,-50%) scale(.12); }
          14% { opacity: .95; }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(6.5); }
        }
        @keyframes ch-bloom { 0% { opacity: 0; } 25% { opacity: .8; } 100% { opacity: 0; } }
        @keyframes ch-core-exit {
          0% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-58%) scale(.82); }
        }

        @media (prefers-reduced-motion: reduce) {
          .cine-hero * { animation-duration: 1ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>

      <div className="ch-pool" />
      <div className="ch-halo" />
      <div className="ch-halo h2" />
      <div className="ch-streaks" />

      <div className="ch-orbit">
        {Array.from({ length: orbitCount }).map((_, i) => {
          const angle = (360 / orbitCount) * i;
          const radius = 26 + (i % 3) * 7;
          return (
            <i
              key={i}
              style={{
                transform: `rotate(${angle}deg) translateY(-${radius}vmin)`,
                animationDelay: `${(i % 5) * 180}ms`,
                background: i % 3 === 0 ? glow.a : i % 3 === 1 ? glow.b : glow.c,
              }}
            />
          );
        })}
      </div>

      <div className="ch-core">
        <div className="ch-core-glow" />
        <div className="ch-core-inner">{asset ?? icon}</div>
      </div>

      {Array.from({ length: ringCount }).map((_, i) => (
        <div
          key={i}
          className="ch-wave"
          style={{ animationDelay: `${i * 150}ms`, borderColor: i % 2 ? glow.b : glow.a }}
        />
      ))}
      <div className="ch-bloom" />
    </div>
  );
}