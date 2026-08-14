import { useEffect, useRef } from "react";
import { giftSounds } from "@/lib/gifts/gift-sound";

type Props = {
  duration?: number;
  icon?: string;
  /** Set to true when the overlay is muted (preview, global mute). */
  silent?: boolean;
};

/** Cinematic beats, in ms, relative to scene mount. */
const BEAT = {
  enter: 220,
  settle: 1600,
  headUp: 2080,
  roar: 2520,
  roarSound: 2600,
  impact: 2680,
  exit: 5400,
};

/** Length of the mouth open -> hold -> close cycle. Must match CSS below. */
const MOUTH_CYCLE = 1900;

/**
 * LION — bespoke frame-based cinematic gift scene.
 *
 * Real mouth movement is achieved by cross-cutting three registered frames of
 * the same artwork (closed jaw -> mid open -> full roar) instead of scaling a
 * single static PNG. The roar SFX is fired exactly on the open frame so audio
 * and animation stay locked for every viewer.
 */
export function LionGiftScene({ duration = 7000, silent = false }: Props) {
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const timers: number[] = [];
    let stopSound: (() => void) | undefined;
    const add = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    add(BEAT.enter, () => el.classList.add("lion-awake"));
    add(BEAT.settle, () => el.classList.add("lion-settled"));
    add(BEAT.headUp, () => el.classList.add("lion-headup"));
    add(BEAT.roar, () => el.classList.add("lion-roar"));
    if (!silent) add(BEAT.roarSound, () => (stopSound = giftSounds.play("lion_roar")));
    add(BEAT.impact, () => el.classList.add("lion-impact"));
    add(BEAT.roar + MOUTH_CYCLE, () => el.classList.add("lion-calm"));
    add(Math.max(BEAT.exit, duration - 1100), () => el.classList.add("lion-exit"));

    return () => {
      timers.forEach(window.clearTimeout);
      stopSound?.();
    };
  }, [duration, silent]);

  return (
    <div ref={root} className="lion-scene absolute inset-0 overflow-hidden" aria-hidden="true">
      <style>{`
        .lion-scene {
          --gold: #ffd76a;
          --amber: #ff9a24;
          --fire: #ff3b0a;
          isolation: isolate;
          pointer-events: none;
        }

        /* ---------- environment ---------- */
        .lion-scene .l-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(120% 90% at 50% 78%, rgba(255,138,31,.30), transparent 62%),
            radial-gradient(circle at 50% 46%, rgba(255,206,110,.20), transparent 55%),
            linear-gradient(to bottom, #0a0509 0%, #170a05 45%, #2a0d03 100%);
          opacity: 0; animation: l-fade 800ms ease-out forwards;
        }
        .lion-scene .l-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 55%, transparent 0 26%, rgba(0,0,0,.35) 60%, rgba(0,0,0,.88) 100%);
        }
        .lion-scene .l-rays {
          position: absolute; left: 50%; top: 50%; width: 180vmax; height: 180vmax;
          transform: translate(-50%,-50%);
          background: conic-gradient(from 0deg,
            transparent 0 9deg, rgba(255,215,106,.20) 9deg 12deg,
            transparent 12deg 28deg, rgba(255,138,31,.14) 28deg 31deg, transparent 31deg 52deg);
          mask-image: radial-gradient(circle, black 6%, transparent 62%);
          -webkit-mask-image: radial-gradient(circle, black 6%, transparent 62%);
          opacity: 0; animation: l-spin 11s linear infinite;
        }
        .lion-scene.lion-awake .l-rays { opacity: .85; transition: opacity 700ms ease-out; }

        .lion-scene .l-groundglow {
          position: absolute; left: 50%; bottom: 4%;
          width: 90vmin; height: 26vmin; transform: translateX(-50%);
          background: radial-gradient(ellipse at center, rgba(255,170,50,.55), transparent 70%);
          filter: blur(14px); opacity: 0;
        }
        .lion-scene.lion-awake .l-groundglow { opacity: 1; transition: opacity 900ms ease-out; }

        .lion-scene .l-aura {
          position: absolute; left: 50%; top: 52%; width: 74vmin; height: 74vmin;
          transform: translate(-50%,-50%); border-radius: 50%;
          background: radial-gradient(circle, rgba(255,214,111,.42), rgba(255,91,10,.16) 45%, transparent 72%);
          filter: blur(12px); opacity: 0; animation: l-aura 2.2s ease-in-out infinite;
        }
        .lion-scene.lion-awake .l-aura { opacity: 1; }

        /* ---------- lion body / frames ---------- */
        .lion-scene .l-lion {
          position: absolute; left: 50%; top: 54%;
          width: min(104vw, 92vmin); height: min(104vw, 92vmin);
          transform: translate(-50%, 105vh) scale(.62);
          z-index: 6;
          filter: drop-shadow(0 18px 40px rgba(0,0,0,.65)) drop-shadow(0 0 42px rgba(255,140,30,.45));
          will-change: transform;
        }
        .lion-scene.lion-awake .l-lion { animation: l-enter 1500ms cubic-bezier(.14,.86,.16,1) forwards; }
        .lion-scene.lion-settled .l-lion { animation: l-idle 2.6s ease-in-out infinite; }
        .lion-scene.lion-headup .l-lion { animation: l-headup 520ms cubic-bezier(.3,.9,.2,1) forwards; }
        .lion-scene.lion-roar .l-lion { animation: l-roarbody ${MOUTH_CYCLE}ms cubic-bezier(.2,.85,.2,1) forwards; }
        .lion-scene.lion-calm .l-lion { animation: l-idle 3s ease-in-out infinite; }
        .lion-scene.lion-exit .l-lion { animation: l-exit 1000ms cubic-bezier(.6,.05,.9,.25) forwards; }

        .lion-scene .l-frame {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: contain; display: block; user-select: none; -webkit-user-drag: none;
          transform-origin: 50% 42%;
        }
        .lion-scene .l-frame.mid,
        .lion-scene .l-frame.open { opacity: 0; }

        /* mouth cycle: closed -> mid -> WIDE OPEN (hold) -> mid -> closed */
        .lion-scene.lion-roar .l-frame.closed { animation: l-mouth-closed ${MOUTH_CYCLE}ms linear forwards; }
        .lion-scene.lion-roar .l-frame.mid    { animation: l-mouth-mid ${MOUTH_CYCLE}ms linear forwards; }
        .lion-scene.lion-roar .l-frame.open   { animation: l-mouth-open ${MOUTH_CYCLE}ms linear forwards; }

        /* mane shake, only while roaring */
        .lion-scene.lion-roar .l-frames { animation: l-mane 150ms linear 14; }

        .lion-scene .l-frames { position: absolute; inset: 0; }

        /* eye glow tracks the face position of the artwork */
        .lion-scene .l-eyes {
          position: absolute; left: 50.5%; top: 24.5%;
          width: 22%; height: 8%; transform: translate(-50%,-50%);
          background: radial-gradient(ellipse, rgba(255,248,190,.85), rgba(255,170,40,.35) 55%, transparent 72%);
          filter: blur(7px); mix-blend-mode: screen; opacity: 0; z-index: 8;
        }
        .lion-scene.lion-settled .l-eyes { animation: l-eyes 1.6s ease-in-out infinite; }
        .lion-scene.lion-roar .l-eyes { animation: l-eyes-burn ${MOUTH_CYCLE}ms ease-out forwards; }

        /* breath / heat haze out of the mouth during the roar */
        .lion-scene .l-breath {
          position: absolute; left: 51%; top: 31%;
          width: 26%; height: 22%; transform: translate(-50%,-30%) scale(.4);
          background: radial-gradient(ellipse at 50% 100%, rgba(255,236,190,.55), rgba(255,120,20,.25) 45%, transparent 72%);
          filter: blur(10px); mix-blend-mode: screen; opacity: 0; z-index: 9;
        }
        .lion-scene.lion-roar .l-breath { animation: l-breath ${MOUTH_CYCLE}ms ease-out forwards; }

        /* ---------- roar impact FX ---------- */
        .lion-scene .l-wave, .lion-scene .l-ring {
          position: absolute; left: 50%; top: 40%; border-radius: 50%;
          transform: translate(-50%,-50%) scale(.12); opacity: 0; z-index: 7;
        }
        .lion-scene .l-wave {
          width: 30vmin; height: 30vmin;
          border: 5px solid rgba(255,232,160,.9);
          box-shadow: 0 0 40px rgba(255,150,30,.85), inset 0 0 30px rgba(255,215,106,.6);
        }
        .lion-scene .l-ring { width: 16vmin; height: 16vmin; border: 3px solid rgba(255,196,90,.75); }
        .lion-scene .l-ring.r2 { border-color: rgba(255,139,38,.65); }
        .lion-scene .l-ring.r3 { border-color: rgba(255,246,200,.5); }
        .lion-scene.lion-roar .l-wave { animation: l-wave 1000ms cubic-bezier(.1,.7,.2,1) forwards; }
        .lion-scene.lion-impact .l-ring.r1 { animation: l-ring 900ms cubic-bezier(.1,.7,.15,1) forwards; }
        .lion-scene.lion-impact .l-ring.r2 { animation: l-ring 1050ms 120ms cubic-bezier(.1,.7,.15,1) forwards; }
        .lion-scene.lion-impact .l-ring.r3 { animation: l-ring 1200ms 240ms cubic-bezier(.1,.7,.15,1) forwards; }

        .lion-scene .l-fire {
          position: absolute; inset: -10%; z-index: 5; opacity: 0;
          background:
            radial-gradient(circle at 50% 60%, rgba(255,150,30,.55), transparent 42%),
            radial-gradient(circle at 30% 70%, rgba(255,80,10,.4), transparent 38%),
            radial-gradient(circle at 70% 68%, rgba(255,200,80,.4), transparent 38%);
          mix-blend-mode: screen; filter: blur(6px);
        }
        .lion-scene.lion-impact .l-fire { animation: l-fire 1400ms ease-out forwards; }

        .lion-scene .l-spark {
          position: absolute; inset: -25%; z-index: 7; opacity: 0;
          background-image:
            radial-gradient(circle, rgba(255,222,130,.95) 0 1.5px, transparent 2.5px),
            radial-gradient(circle, rgba(255,130,25,.9) 0 2px, transparent 3px),
            radial-gradient(circle, rgba(255,248,210,.85) 0 1px, transparent 2px);
          background-size: 52px 66px, 77px 91px, 99px 58px;
          mix-blend-mode: screen;
        }
        .lion-scene.lion-impact .l-spark { animation: l-spark 1600ms ease-out forwards; }

        .lion-scene .l-flash {
          position: absolute; inset: 0; z-index: 11; background: #fff6df; opacity: 0; mix-blend-mode: screen;
        }
        .lion-scene.lion-roar .l-flash { animation: l-flash 340ms 60ms ease-out forwards; }
        .lion-scene.lion-exit .l-flash { animation: l-flash 700ms ease-out forwards; }

        /* camera shake on the whole scene, only at the roar */
        .lion-scene.lion-impact .l-shake { animation: l-shake 90ms linear 9; }
        .lion-scene .l-shake { position: absolute; inset: 0; }

        /* ---------- keyframes ---------- */
        @keyframes l-fade { to { opacity: 1; } }
        @keyframes l-spin { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes l-aura {
          0%,100% { transform: translate(-50%,-50%) scale(.86); opacity: .5; }
          50% { transform: translate(-50%,-50%) scale(1.1); opacity: .95; }
        }
        @keyframes l-enter {
          0%   { transform: translate(-50%, 105vh) scale(.62) rotate(-5deg); }
          55%  { transform: translate(-50%, -46%) scale(1.08) rotate(2deg); }
          78%  { transform: translate(-50%, -52%) scale(.98) rotate(-1deg); }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
        }
        @keyframes l-idle {
          0%,100% { transform: translate(-50%,-50%) scale(1) rotate(0deg); }
          50%     { transform: translate(-50%,-51.2%) scale(1.022) rotate(.4deg); }
        }
        @keyframes l-headup {
          0%   { transform: translate(-50%,-50%) scale(1) rotate(0deg); }
          100% { transform: translate(-50%,-53.5%) scale(1.06) rotate(-1.6deg); }
        }
        @keyframes l-roarbody {
          0%   { transform: translate(-50%,-53.5%) scale(1.06) rotate(-1.6deg); }
          10%  { transform: translate(-50%,-55%) scale(1.20) rotate(.6deg); }
          22%  { transform: translate(-50%,-54%) scale(1.15) rotate(-.6deg); }
          55%  { transform: translate(-50%,-54.5%) scale(1.18) rotate(.4deg); }
          80%  { transform: translate(-50%,-52%) scale(1.06) rotate(0deg); }
          100% { transform: translate(-50%,-50%) scale(1) rotate(0deg); }
        }
        @keyframes l-exit {
          0%   { transform: translate(-50%,-50%) scale(1); opacity: 1; }
          35%  { transform: translate(-50%,-52%) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%,-46%) scale(.8); opacity: 0; }
        }
        /* mouth frame cross-cuts (percentages of MOUTH_CYCLE) */
        @keyframes l-mouth-closed {
          0%,4% { opacity: 1; } 8% { opacity: 0; } 82% { opacity: 0; } 92%,100% { opacity: 1; }
        }
        @keyframes l-mouth-mid {
          0%,3% { opacity: 0; } 7% { opacity: 1; } 13% { opacity: 0; }
          76% { opacity: 0; } 84% { opacity: 1; } 92%,100% { opacity: 0; }
        }
        @keyframes l-mouth-open {
          0%,9% { opacity: 0; }
          14% { opacity: 1; transform: scale(1.02); }
          70% { opacity: 1; transform: scale(1); }
          80% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes l-mane {
          0% { transform: translate(0,0) rotate(0deg); }
          25% { transform: translate(-.5%, .35%) rotate(-.5deg); }
          60% { transform: translate(.55%, -.3%) rotate(.55deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        @keyframes l-eyes {
          0%,100% { opacity: .25; transform: translate(-50%,-50%) scale(.85); }
          50%     { opacity: .9; transform: translate(-50%,-50%) scale(1.15); }
        }
        @keyframes l-eyes-burn {
          0% { opacity: .6; transform: translate(-50%,-50%) scale(1); }
          15% { opacity: 1; transform: translate(-50%,-50%) scale(1.5); }
          70% { opacity: .95; transform: translate(-50%,-50%) scale(1.3); }
          100% { opacity: .3; transform: translate(-50%,-50%) scale(1); }
        }
        @keyframes l-breath {
          0% { opacity: 0; transform: translate(-50%,-30%) scale(.35); }
          16% { opacity: .9; transform: translate(-50%,-42%) scale(.9); }
          70% { opacity: .7; transform: translate(-50%,-58%) scale(1.35); }
          100% { opacity: 0; transform: translate(-50%,-70%) scale(1.7); }
        }
        @keyframes l-wave {
          0% { opacity: 0; transform: translate(-50%,-50%) scale(.12); }
          10% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(6); }
        }
        @keyframes l-ring {
          0% { opacity: 0; transform: translate(-50%,-50%) scale(.1); }
          12% { opacity: .95; }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(7.5); }
        }
        @keyframes l-fire {
          0% { opacity: 0; transform: scale(.7); }
          18% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.45); }
        }
        @keyframes l-spark {
          0% { opacity: 0; transform: translate3d(0, 6%, 0) scale(.8); }
          15% { opacity: 1; }
          100% { opacity: 0; transform: translate3d(-2%, -14%, 0) scale(1.35); }
        }
        @keyframes l-flash { 0% { opacity: 0; } 20% { opacity: .8; } 100% { opacity: 0; } }
        @keyframes l-shake {
          0% { transform: translate(0,0); }
          25% { transform: translate(-1.1vmin, .8vmin); }
          50% { transform: translate(1vmin, -.9vmin); }
          75% { transform: translate(-.7vmin, -.5vmin); }
          100% { transform: translate(0,0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .lion-scene .l-rays, .lion-scene .l-spark, .lion-scene .l-shake { animation: none !important; }
        }
      `}</style>

      <div className="l-bg" />
      <div className="l-rays" />
      <div className="l-aura" />
      <div className="l-groundglow" />

      <div className="l-shake">
        <div className="l-fire" />
        <div className="l-lion">
          <div className="l-frames">
            <img className="l-frame closed" src="/gifts/lion-f-closed.webp" alt="" draggable={false} />
            <img className="l-frame mid" src="/gifts/lion-f-mid.webp" alt="" draggable={false} />
            <img className="l-frame open" src="/gifts/lion-f-roar.webp" alt="" draggable={false} />
          </div>
          <div className="l-eyes" />
          <div className="l-breath" />
        </div>
        <div className="l-wave" />
        <div className="l-ring r1" />
        <div className="l-ring r2" />
        <div className="l-ring r3" />
        <div className="l-spark" />
      </div>

      <div className="l-vignette" />
      <div className="l-flash" />
    </div>
  );
}
