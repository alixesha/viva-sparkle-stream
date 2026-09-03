import { useEffect, useRef, useState } from "react";
import type { GiftClip } from "@/lib/gifts/gift-clips";

type Props = {
  clip: GiftClip;
  duration: number;
  /** Rendered if neither source can be decoded — keeps the gift from ever looking broken. */
  fallback?: React.ReactNode;
};

/**
 * Shared cinematic stage for every clip-backed gift.
 *
 * The photoreal clip IS the gift; the DOM only adds the garnish a real LIVE
 * gift has: a dark intro, a soft edge mask so the clip melts into the dimmed
 * stream, an accent key light that swells at the impact frame, a flash +
 * shockwave rings + micro camera shake locked to that frame, and a clean exit.
 *
 * `<source>` order gives automatic codec fallback (WebM/VP9 → MP4/H.264).
 */
export function VideoGiftScene({ clip, duration, fallback }: Props) {
  const root = useRef<HTMLDivElement | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const timers: number[] = [];
    const add = (ms: number, cls: string) => timers.push(window.setTimeout(() => el.classList.add(cls), ms));
    add(40, "vg-awake");
    add(clip.impact, "vg-impact");
    add(Math.max(600, duration - 900), "vg-exit");

    const v = video.current;
    if (v) {
      v.muted = true; // clips are silent; SFX comes from the sound manager
      v.currentTime = 0;
      void v.play().catch(() => undefined);
    }
    return () => timers.forEach(window.clearTimeout);
  }, [clip, duration]);

  if (failed && fallback) return <>{fallback}</>;

  return (
    <div
      ref={root}
      className="vg-scene absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{ ["--vg-glow" as string]: clip.glow }}
    >
      <style>{`
        .vg-scene { isolation:isolate; pointer-events:none; }
        .vg-scene .vg-stage {
          position:absolute; inset:0; opacity:0; transform:scale(1.08);
          transition:opacity 650ms ease-out, transform 1200ms cubic-bezier(.2,.7,.2,1);
        }
        .vg-scene.vg-awake .vg-stage { opacity:1; transform:scale(1); }
        .vg-scene.vg-impact .vg-stage { transform:scale(1.03); transition:transform 500ms ease-out; }
        .vg-scene.vg-exit .vg-stage { opacity:0; transform:scale(1.06); transition:opacity 850ms ease-in, transform 900ms ease-in; }
        .vg-scene video {
          width:100%; height:100%; object-fit:cover;
          filter:contrast(1.06) saturate(1.1);
          mask-image:radial-gradient(120% 100% at 50% 50%, #000 55%, rgba(0,0,0,.6) 78%, transparent 100%);
          -webkit-mask-image:radial-gradient(120% 100% at 50% 50%, #000 55%, rgba(0,0,0,.6) 78%, transparent 100%);
        }
        .vg-scene .vg-key {
          position:absolute; inset:0; mix-blend-mode:screen; opacity:0;
          background:radial-gradient(circle at 50% 50%, var(--vg-glow), transparent 62%);
          transition:opacity 420ms ease-out;
        }
        .vg-scene.vg-impact .vg-key { animation:vg-key 1600ms ease-out forwards; }
        @keyframes vg-key { 0%{opacity:0} 15%{opacity:.5} 100%{opacity:.08} }
        .vg-scene .vg-flash {
          position:absolute; inset:0; opacity:0; mix-blend-mode:screen;
          background:radial-gradient(circle at 50% 50%, rgba(255,255,255,.9), var(--vg-glow) 35%, transparent 65%);
        }
        .vg-scene.vg-impact .vg-flash { animation:vg-flash 560ms ease-out forwards; }
        @keyframes vg-flash { 0%{opacity:0} 14%{opacity:1} 100%{opacity:0} }
        .vg-scene .vg-ring {
          position:absolute; left:50%; top:50%; width:30vmin; aspect-ratio:1;
          margin:-15vmin 0 0 -15vmin; border-radius:9999px; opacity:0;
          border:.45vmin solid rgba(255,255,255,.85);
          box-shadow:0 0 5vmin var(--vg-glow), inset 0 0 3vmin var(--vg-glow);
        }
        .vg-scene.vg-impact .vg-ring { animation:vg-ring 1000ms cubic-bezier(.15,.7,.2,1) forwards; }
        .vg-scene.vg-impact .vg-ring.d2 { animation-delay:160ms }
        .vg-scene.vg-impact .vg-ring.d3 { animation-delay:320ms }
        @keyframes vg-ring { 0%{opacity:.9; transform:scale(.3)} 70%{opacity:.4} 100%{opacity:0; transform:scale(3.6)} }
        .vg-scene.vg-impact .vg-cam { animation:vg-shake 700ms cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes vg-shake {
          0%,100%{transform:translate3d(0,0,0)}
          12%{transform:translate3d(-.8vmin,.5vmin,0) rotate(-.25deg)}
          26%{transform:translate3d(.7vmin,-.5vmin,0) rotate(.22deg)}
          44%{transform:translate3d(-.45vmin,.3vmin,0)}
          64%{transform:translate3d(.3vmin,-.2vmin,0)}
        }
        .vg-scene .vg-vignette {
          position:absolute; inset:0;
          background:radial-gradient(circle at 50% 50%, transparent 0 40%, rgba(0,0,0,.35) 72%, rgba(0,0,0,.85) 100%);
        }
        @media (prefers-reduced-motion: reduce) { .vg-scene.vg-impact .vg-cam { animation:none } }
      `}</style>

      <div className="vg-cam absolute inset-0">
        <div className="vg-stage">
          <video
            ref={video}
            playsInline
            muted
            autoPlay
            preload="auto"
            disablePictureInPicture
            controls={false}
            onError={() => setFailed(true)}
          >
            <source src={clip.webm} type="video/webm" />
            <source src={clip.mp4} type="video/mp4" />
          </video>
        </div>
        <div className="vg-key" />
        <div className="vg-flash" />
        <div className="vg-ring" />
        <div className="vg-ring d2" />
        <div className="vg-ring d3" />
      </div>
      <div className="vg-vignette" />
    </div>
  );
}

export default VideoGiftScene;
