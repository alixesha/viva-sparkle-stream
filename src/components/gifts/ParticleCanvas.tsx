import { useEffect, useRef } from "react";
import type { Emitter, Origin, ParticleKind } from "@/lib/gifts/gift-visuals";

interface P {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  born: number;
  life: number;
  color: string;
  gravity: number;
  seed: number;
}

function originPoint(o: Origin, w: number, h: number) {
  switch (o) {
    case "bottom":
      return { x: w * (0.15 + Math.random() * 0.7), y: h * (0.94 + Math.random() * 0.08) };
    case "top":
      return { x: w * Math.random(), y: -h * 0.05 * Math.random() };
    case "left":
      return { x: -w * 0.05, y: h * (0.45 + Math.random() * 0.2) };
    case "right":
      return { x: w * 1.05, y: h * (0.45 + Math.random() * 0.2) };
    default:
      return { x: w * 0.5, y: h * 0.48 };
  }
}

function spawn(e: Emitter, w: number, h: number, now: number, i: number): P {
  const { x, y } = originPoint(e.origin ?? "center", w, h);
  const speed = (e.speed ?? 260) * (0.55 + Math.random() * 0.9);
  let angle = Math.random() * Math.PI * 2;
  if (e.origin === "bottom") angle = -Math.PI / 2 + (Math.random() - 0.5) * (e.spread ?? 0.6) * Math.PI;
  if (e.origin === "top") angle = Math.PI / 2 + (Math.random() - 0.5) * (e.spread ?? 0.4) * Math.PI;
  if (e.origin === "left") angle = (Math.random() - 0.5) * 0.5;
  if (e.origin === "right") angle = Math.PI + (Math.random() - 0.5) * 0.5;
  const scale = Math.min(w, h) / 420;
  return {
    kind: e.kind,
    x,
    y,
    vx: Math.cos(angle) * speed * scale,
    vy: Math.sin(angle) * speed * scale,
    size: (e.size ?? 8) * scale * (0.7 + Math.random() * 0.7),
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 5,
    born: now + (e.stagger ? i * e.stagger : Math.random() * 180),
    life: (e.life ?? 1400) * (0.8 + Math.random() * 0.4),
    color: e.colors[i % e.colors.length] ?? "#fff",
    gravity: (e.gravity ?? 0) * scale,
    seed: Math.random() * 1000,
  };
}

function drawHeart(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(s, -s * 0.35, s * 0.45, -s, 0, -s * 0.45);
  ctx.bezierCurveTo(-s * 0.45, -s, -s, -s * 0.35, 0, s * 0.35);
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? s : s * 0.42;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: P, t: number) {
  const k = t / p.life;
  const fade = k < 0.12 ? k / 0.12 : 1 - Math.max(0, (k - 0.55) / 0.45);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, fade));
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot + p.vr * (t / 1000));
  ctx.fillStyle = p.color;
  ctx.shadowColor = p.color;
  ctx.shadowBlur = p.size * 1.8;

  switch (p.kind) {
    case "petal":
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "heart":
      drawHeart(ctx, p.size);
      break;
    case "confetti":
      ctx.fillRect(-p.size / 2, -p.size / 6, p.size, p.size / 3);
      break;
    case "feather":
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "smoke":
      ctx.globalAlpha *= 0.28;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * (0.6 + k * 1.6), 0, Math.PI * 2);
      ctx.fill();
      break;
    case "orb": {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.4, p.color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "lava":
      ctx.beginPath();
      ctx.arc(0, 0, p.size * (1 - k * 0.4), 0, Math.PI * 2);
      ctx.fill();
      break;
    case "ember":
      ctx.beginPath();
      ctx.arc(0, 0, p.size * (1 - k * 0.7), 0, Math.PI * 2);
      ctx.fill();
      break;
    case "starfield":
      drawStar(ctx, p.size * 1.2);
      break;
    case "bolt": {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(2, p.size * 0.5);
      ctx.beginPath();
      let x = 0;
      let y = 0;
      for (let i = 0; i < 8; i++) {
        x += (Math.sin(p.seed + i) * p.size) * 3;
        y += p.size * 9;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      break;
    }
    case "ring": {
      const r = p.size * (1 + k * 26);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.5, p.size * (1 - k) * 0.9);
      ctx.globalAlpha *= 1 - k;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    default: {
      // spark — glowing streak
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 2.2, p.size * 0.6, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * GPU-friendly 2D canvas particle renderer. All emitters for one gift scene run
 * in a single rAF loop, and everything is disposed when the gift finishes.
 */
export function ParticleCanvas({ emitters, duration }: { emitters: Emitter[]; duration: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    const size = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);

    const start = performance.now();
    const pending = emitters.map((e) => ({ e, fired: false }));
    let live: P[] = [];
    let raf = 0;

    const frame = (now: number) => {
      const elapsed = now - start;
      for (const item of pending) {
        if (!item.fired && elapsed >= item.e.at) {
          item.fired = true;
          for (let i = 0; i < item.e.count; i++) live.push(spawn(item.e, w, h, now, i));
        }
      }
      ctx.clearRect(0, 0, w, h);
      const next: P[] = [];
      for (const p of live) {
        const t = now - p.born;
        if (t < 0) {
          next.push(p);
          continue;
        }
        if (t > p.life) continue;
        const dt = 1 / 60;
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === "petal") p.x += Math.sin((now + p.seed) / 320) * 0.8;
        drawParticle(ctx, p, t);
        next.push(p);
      }
      live = next;
      if (elapsed < duration + 600) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      live = [];
      ctx.clearRect(0, 0, w, h);
    };
  }, [emitters, duration]);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 size-full" />;
}
