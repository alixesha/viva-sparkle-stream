import { useEffect, useRef } from "react";

type Props = {
  duration?: number;
  icon?: string;
};

export function LionGiftScene({ duration = 6500 }: Props) {
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const timers: number[] = [];

    // Cinematic hit points: entrance -> roar -> impact -> exit.
    const add = (ms: number, fn: () => void) => {
      const t = window.setTimeout(fn, ms);
      timers.push(t);
    };

    add(500, () => el.classList.add("lion-scene-awake"));
    add(2350, () => el.classList.add("lion-scene-roar"));
    add(2750, () => el.classList.add("lion-scene-impact"));
    add(4700, () => el.classList.add("lion-scene-exit"));

    return () => timers.forEach(window.clearTimeout);
  }, [duration]);

  return (
    <div
      ref={root}
      className="lion-gift-scene absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <style>{`
        .lion-gift-scene {
          --lion-gold: #ffd76a;
          --lion-orange: #ff8a1f;
          --lion-fire: #ff3b0a;
          --lion-black: #07030a;
          isolation: isolate;
          pointer-events: none;
        }

        .lion-gift-scene .lion-vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 52%, transparent 0 24%, rgba(0,0,0,.18) 55%, rgba(0,0,0,.82) 100%),
            linear-gradient(to bottom, rgba(3,2,8,.25), rgba(5,1,0,.62));
          opacity: 0;
          animation: lion-vignette-in 900ms ease-out forwards;
        }

        .lion-gift-scene .lion-rays {
          position: absolute;
          width: 180vmax;
          height: 180vmax;
          left: 50%;
          top: 50%;
          transform: translate(-50%,-50%);
          background: conic-gradient(
            from 0deg,
            transparent 0 8deg,
            rgba(255,215,106,.22) 8deg 11deg,
            transparent 11deg 27deg,
            rgba(255,138,31,.16) 27deg 30deg,
            transparent 30deg 50deg
          );
          mask-image: radial-gradient(circle, black 4%, transparent 64%);
          -webkit-mask-image: radial-gradient(circle, black 4%, transparent 64%);
          opacity: 0;
          animation: lion-rays-spin 8s linear infinite;
        }

        .lion-gift-scene .lion-aura {
          position: absolute;
          left: 50%;
          top: 52%;
          width: 55vmin;
          height: 55vmin;
          transform: translate(-50%,-50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,214,111,.62), rgba(255,91,10,.18) 42%, transparent 72%);
          filter: blur(9px);
          opacity: 0;
          animation: lion-aura-pulse 1.8s ease-in-out infinite;
        }

        .lion-gift-scene .lion-image-wrap {
          position: absolute;
          left: 50%;
          top: 53%;
          width: min(88vw, 78vmin);
          height: min(88vw, 78vmin);
          transform: translate(-50%, 100vh) scale(.58) rotate(-3deg);
          filter:
            drop-shadow(0 0 18px rgba(255,145,32,.7))
            drop-shadow(0 0 60px rgba(255,88,8,.45));
          z-index: 5;
          will-change: transform, filter;
        }

        .lion-gift-scene .lion-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          user-select: none;
          -webkit-user-drag: none;
          animation: lion-breathe 1.35s ease-in-out infinite;
        }

        .lion-gift-scene .lion-eye-glow {
          position: absolute;
          left: 50%;
          top: 48%;
          width: 34%;
          height: 18%;
          transform: translate(-50%,-50%);
          background: radial-gradient(ellipse, rgba(255,246,170,.72), transparent 60%);
          filter: blur(12px);
          mix-blend-mode: screen;
          opacity: 0;
          z-index: 7;
          animation: lion-eyes 1.8s ease-in-out infinite;
        }

        .lion-gift-scene .lion-ring {
          position: absolute;
          left: 50%;
          top: 53%;
          width: 12vmin;
          height: 12vmin;
          border: 3px solid rgba(255,215,106,.85);
          border-radius: 50%;
          transform: translate(-50%,-50%) scale(.1);
          opacity: 0;
          z-index: 4;
          box-shadow: 0 0 28px rgba(255,138,31,.8), inset 0 0 20px rgba(255,215,106,.45);
        }

        .lion-gift-scene .lion-ring.r2 { border-color: rgba(255,139,38,.7); }
        .lion-gift-scene .lion-ring.r3 { border-color: rgba(255,244,190,.5); }

        .lion-gift-scene .lion-particles {
          position: absolute;
          inset: -20%;
          z-index: 3;
          opacity: 0;
          background-image:
            radial-gradient(circle, rgba(255,215,106,.95) 0 1px, transparent 2px),
            radial-gradient(circle, rgba(255,120,20,.9) 0 1.5px, transparent 2.5px),
            radial-gradient(circle, rgba(255,245,200,.8) 0 1px, transparent 2px);
          background-size: 48px 62px, 71px 83px, 91px 54px;
          background-position: 0 0, 20px 10px, 40px 35px;
          animation: lion-particles-float 2.8s linear infinite;
          mix-blend-mode: screen;
        }

        .lion-gift-scene .lion-flash {
          position: absolute;
          inset: 0;
          z-index: 10;
          background: white;
          opacity: 0;
          mix-blend-mode: screen;
        }

        .lion-gift-scene .lion-roar-wave {
          position: absolute;
          left: 50%;
          top: 53%;
          width: 25vmin;
          height: 25vmin;
          border-radius: 50%;
          border: 4px solid rgba(255,226,142,.8);
          transform: translate(-50%,-50%) scale(.15);
          opacity: 0;
          z-index: 8;
          filter: drop-shadow(0 0 18px rgba(255,150,30,.9));
        }

        .lion-gift-scene.lion-scene-awake .lion-rays,
        .lion-gift-scene.lion-scene-awake .lion-aura,
        .lion-gift-scene.lion-scene-awake .lion-particles {
          opacity: 1;
        }

        .lion-gift-scene.lion-scene-awake .lion-image-wrap {
          animation: lion-entrance 1450ms cubic-bezier(.12,.85,.18,1) forwards;
        }

        .lion-gift-scene.lion-scene-roar .lion-image-wrap {
          animation: lion-roar 850ms cubic-bezier(.2,.9,.2,1) forwards;
        }

        .lion-gift-scene.lion-scene-roar .lion-eye-glow {
          opacity: 1;
          animation-duration: 520ms;
        }

        .lion-gift-scene.lion-scene-roar .lion-roar-wave {
          animation: lion-wave 1000ms cubic-bezier(.1,.7,.2,1) forwards;
        }

        .lion-gift-scene.lion-scene-roar .lion-flash {
          animation: lion-flash 260ms ease-out forwards;
        }

        .lion-gift-scene.lion-scene-impact .lion-ring.r1 {
          animation: lion-ring 900ms cubic-bezier(.1,.7,.15,1) forwards;
        }
        .lion-gift-scene.lion-scene-impact .lion-ring.r2 {
          animation: lion-ring 1050ms 120ms cubic-bezier(.1,.7,.15,1) forwards;
        }
        .lion-gift-scene.lion-scene-impact .lion-ring.r3 {
          animation: lion-ring 1200ms 240ms cubic-bezier(.1,.7,.15,1) forwards;
        }

        .lion-gift-scene.lion-scene-exit .lion-image-wrap {
          animation: lion-exit 900ms cubic-bezier(.65,.05,.9,.25) forwards;
        }

        @keyframes lion-vignette-in { to { opacity: 1; } }
        @keyframes lion-rays-spin { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes lion-aura-pulse {
          0%,100% { transform: translate(-50%,-50%) scale(.82); opacity: .45; }
          50% { transform: translate(-50%,-50%) scale(1.12); opacity: .9; }
        }
        @keyframes lion-entrance {
          0% { transform: translate(-50%, 100vh) scale(.58) rotate(-4deg); }
          65% { transform: translate(-50%, -5%) scale(1.06) rotate(1deg); }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0); }
        }
        @keyframes lion-roar {
          0% { transform: translate(-50%,-50%) scale(1); }
          25% { transform: translate(-50%,-50%) scale(1.12) rotate(-1deg); }
          50% { transform: translate(-50%,-50%) scale(.96) rotate(1deg); }
          75% { transform: translate(-50%,-50%) scale(1.08) rotate(0); }
          100% { transform: translate(-50%,-50%) scale(1); }
        }
        @keyframes lion-breathe {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.025); }
        }
        @keyframes lion-eyes {
          0%,100% { opacity: .2; transform: translate(-50%,-50%) scale(.7); }
          50% { opacity: 1; transform: translate(-50%,-50%) scale(1.35); }
        }
        @keyframes lion-wave {
          0% { opacity: 0; transform: translate(-50%,-50%) scale(.15); }
          12% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(5.5); }
        }
        @keyframes lion-ring {
          0% { opacity: 0; transform: translate(-50%,-50%) scale(.1); }
          12% { opacity: .95; }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(7); }
        }
        @keyframes lion-flash {
          0% { opacity: 0; }
          18% { opacity: .9; }
          100% { opacity: 0; }
        }
        @keyframes lion-particles-float {
          from { transform: translate3d(0, 5%, 0) scale(1); }
          to { transform: translate3d(-3%, -8%, 0) scale(1.04); }
        }
        @keyframes lion-exit {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%,-44%) scale(.88); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .lion-gift-scene * { animation-duration: 1ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>

      <div className="lion-vignette" />
      <div className="lion-rays" />
      <div className="lion-aura" />
      <div className="lion-particles" />

      <div className="lion-image-wrap">
        <img className="lion-image" src="/gifts/lion.png" alt="" draggable={false} />
        <div className="lion-eye-glow" />
      </div>

      <div className="lion-ring r1" />
      <div className="lion-ring r2" />
      <div className="lion-ring r3" />
      <div className="lion-roar-wave" />
      <div className="lion-flash" />
    </div>
  );
}
