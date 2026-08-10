import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataRow({
  left,
  sub,
  right,
  className,
}: {
  left: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-border/40 py-3 last:border-0",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {left}
        {sub}
      </div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{right}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "pending"
      ? "bg-warning/15 text-warning"
      : status === "approved" || status === "active" || status === "live" || status === "completed" || status === "resolved"
        ? "bg-success/15 text-success"
        : status === "rejected" || status === "suspended" || status === "banned" || status === "ended"
          ? "bg-destructive/15 text-destructive"
          : "bg-surface-2 text-muted-foreground";
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", tone)}>
      {status}
    </span>
  );
}
