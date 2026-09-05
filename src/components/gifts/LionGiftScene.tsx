import { useEffect, useRef } from "react";
import { giftSounds } from "@/lib/gifts/gift-sound";
import { GIFT_CLIPS } from "@/lib/gifts/gift-clips";

const lionClip = GIFT_CLIPS["lion"]!;

type Props = {
  duration?: number;
  icon?: string;
  /** Set to true when the overlay is muted (preview, global mute). */
  silent?: boolean;
};

/**
 * Beats, in ms, matched to the rendered footage in `lion-cinematic.mp4`:
 * 0.0-2.0 walk-in from the left, 2.0-5.5 approach + head/chest raise,
 * 5.5-6.3 close-up, 6.3-8.6 mouth wide open roar, 8.6-9.6 mouth closes,
 * 9.6+ camera pulls back and the lion exits to the right.
 */
const BEAT = {
  intro: 0,
  roar: 6300,
  impact: 6420,
  calm: 8800,
  exit: 9700,
};

/**
 * LION — bespoke cinematic gift scene built around a real, photoreal lion clip.
 *
 * The footage carries the performance (walk-in, zoom, wide-open roar, exit) and
 * the DOM layers only add cinematic garnish: golden light wash, roar flash,
 * shockwave rings and a subtle camera shake locked to the roar frame. The clip's
 * own roar audio is used when playback with sound is allowed, otherwise the
 * synthesized roar fires on the exact same frame so every viewer stays in sync.
 */
export function LionGiftScene({ duration = 11500, silent = false }: Props) {
  const root = useRef<HTMLDivElement | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const timers: number[] = [];
    let stopSound: (() => void) | undefined;
    const add = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    add(BEAT.intro + 60, () => el.classList.add("lion-awake"));
    add(BEAT.roar, () => el.classList.add("lion-roar"));
    add(BEAT.impact, () => el.classList.add("lion-impact"));
    add(BEAT.calm, () => el.classList.add("lion-calm"));
    add(Math.max(BEAT.exit, duration - 1600), () => el.classList.add("lion-exit"));

    // Prefer the clip's own recorded roar; fall back to the synthesized one.
    const v = video.current;
    const muted = silent || giftSounds.isMuted;
    if (v) {
      v.muted = muted;
      v.currentTime = 0;
      void v.play().catch(() => {
        v.muted = true;
        void v.play().catch(() => undefined);
        if (!muted) add(BEAT.roar, () => (stopSound = giftSounds.play("lion_roar")));
      });
    }

    return () => {
      timers.forEach(window.clearTimeout);
      stopSound?.();
    };
  }, [duration, silent]);

  return (
    <div ref={root} className="lion-scene absolute inset-0 overflow-hidden" aria-hidden="true">
      <style>{`
        .lion-scene { --gold:#ffd76a; --amber:#ff9a24; isolation:isolate; pointer-events:none; }

        /* ---------- environment ---------- */
        .lion-scene .l-bg {
          position:absolute; inset:0;
          background:
            radial-gradient(120% 90% at 50% 78%, rgba(255,138,31,.22), transparent 62%),
            linear-gradient(to bottom, #05030a 0%, #0d0603 55%, #180802 100%);
          opacity:0; animation:l-fade 700ms ease-out forwards;
        }
        .lion-scene .l-vignette {
          position:absolute; inset:0;
          background:radial-gradient(circle at 50% 52%, transparent 0 32%, rgba(0,0,0,.45) 66%, rgba(0,0,0,.9) 100%);
        }
        @keyframes l-fade { to { opacity:1 } }

        /* ---------- hero footage ---------- */
        .lion-scene .l-stage {
          position:absolute; inset:0;
          opacity:0;
          transform:translateX(-14%) scale(1.06);
          transition:opacity 900ms ease-out, transform 1400ms cubic-bezier(.2,.7,.2,1);
        }
        .lion-scene.lion-awake .l-stage { opacity:1; transform:translateX(0) scale(1); }
        .lion-scene.lion-roar .l-stage { transform:scale(1.05); transition:transform 700ms ease-out; }
        .lion-scene.lion-calm .l-stage { transform:scale(1); transition:transform 900ms ease-out; }
        .lion-scene.lion-exit .l-stage {
          opacity:0; transform:translateX(26%) scale(.98);
          transition:opacity 1200ms ease-in, transform 1500ms cubic-bezier(.4,0,.8,.4);
        }
        .lion-scene .l-stage video {
          width:100%; height:100%; object-fit:cover;
          filter:contrast(1.08) saturate(1.12) brightness(1.02);
        }

        /* warm key light that breathes with the roar */
        .lion-scene .l-key {
          position:absolute; inset:0; mix-blend-mode:screen; opacity:.25;
          background:radial-gradient(circle at 50% 44%, rgba(255,196,92,.55), transparent 58%);
          transition:opacity 500ms ease-out;
        }
        .lion-scene.lion-roar .l-key { opacity:.7; }
        .lion-scene.lion-calm .l-key { opacity:.22; }

        /* ---------- roar impact ---------- */
        .lion-scene .l-flash {
          position:absolute; inset:0; opacity:0; mix-blend-mode:screen;
          background:radial-gradient(circle at 50% 45%, rgba(255,244,214,.95), rgba(255,168,54,.5) 45%, transparent 72%);
        }
        .lion-scene.lion-impact .l-flash { animation:l-flash 620ms ease-out forwards; }
        @keyframes l-flash { 0%{opacity:0} 12%{opacity:1} 100%{opacity:0} }


        /* dust/ember haze kicked up by the roar */
        .lion-scene .l-dust {
          position:absolute; inset:0; opacity:0; mix-blend-mode:screen;
          background:
            radial-gradient(2px 2px at 20% 70%, rgba(255,214,122,.9), transparent 60%),
            radial-gradient(2px 2px at 74% 62%, rgba(255,186,84,.9), transparent 60%),
            radial-gradient(3px 3px at 46% 82%, rgba(255,226,150,.8), transparent 60%),
            radial-gradient(2px 2px at 62% 88%, rgba(255,200,110,.8), transparent 60%),
            radial-gradient(2px 2px at 32% 90%, rgba(255,214,122,.8), transparent 60%);
        }
        .lion-scene.lion-impact .l-dust { animation:l-dust 2600ms ease-out forwards; }
        @keyframes l-dust {
          0%{opacity:0; transform:translateY(6vmin) scale(1)}
          20%{opacity:.9}
          100%{opacity:0; transform:translateY(-16vmin) scale(1.25)}
        }

        /* ---------- camera shake ---------- */
        .lion-scene.lion-impact .l-cam { animation:l-shake 900ms cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes l-shake {
          0%,100%{transform:translate3d(0,0,0)}
          10%{transform:translate3d(-1.1vmin,.6vmin,0) rotate(-.35deg)}
          22%{transform:translate3d(1vmin,-.7vmin,0) rotate(.32deg)}
          38%{transform:translate3d(-.7vmin,.4vmin,0) rotate(-.2deg)}
          56%{transform:translate3d(.5vmin,-.3vmin,0) rotate(.15deg)}
          78%{transform:translate3d(-.25vmin,.15vmin,0)}
        }

        @media (prefers-reduced-motion: reduce) {
          .lion-scene.lion-impact .l-cam { animation:none }
        }
      `}</style>

      <div className="l-bg" />
      <div className="l-cam absolute inset-0">
        <div className="l-stage">
          <video
            ref={video}
            playsInline
            preload="auto"
            autoPlay
            disablePictureInPicture
            controls={false}
          >
            {/* WebM/VP9 first for Chromium builds without H.264; MP4 covers Safari */}
            <source src={lionClip.webm} type="video/webm" />
            <source src={lionClip.mp4} type="video/mp4" />
          </video>

        </div>
        <div className="l-key" />
        <div className="l-flash" />
        <div className="l-dust" />
      </div>
      <div className="l-vignette" />
    </div>
  );
}

export default LionGiftScene;
