import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminSection({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-4 rounded-3xl glass p-4", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: ReactNode;
  href?: string;
  tone?: "warn" | "live" | "coin" | "diamond";
}) {
  const toneClass =
    tone === "warn"
      ? "text-warning"
      : tone === "live"
        ? "text-live"
        : tone === "coin"
          ? "coin-text"
          : tone === "diamond"
            ? "text-diamond"
            : "";
  const content = (
    <div className="rounded-2xl glass p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-display font-bold", toneClass)}>{value}</p>
    </div>
  );
  if (href) {
    return (
      <a href={href} className="tap block">
        {content}
      </a>
    );
  }
  return content;
}
