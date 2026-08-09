import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-2xl brand-gradient",
        className,
      )}
      aria-hidden="true"
    >
      <span className="absolute inset-0 opacity-40 mix-blend-overlay brand-gradient animate-spin-slow" />
      <svg viewBox="0 0 24 24" className="relative size-5" fill="none">
        <path
          d="M4 6.5 9.5 18 15 6.5"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary-foreground"
        />
        <circle cx="18.5" cy="8" r="2" className="fill-primary-foreground" />
      </svg>
    </span>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-lg leading-none font-extrabold tracking-tight">
          <span className="brand-text">VIVA</span>{" "}
          <span className="text-foreground/90">LIVE</span>
        </span>
      )}
    </span>
  );
}