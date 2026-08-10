import { cn } from "@/lib/utils";

export type StatusPillStatus = "pending" | "approved" | "rejected" | string;

const STYLES: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-live/15 text-live",
  rejected: "bg-destructive/15 text-destructive",
};

export function StatusPill({ status, className }: { status: StatusPillStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold capitalize",
        STYLES[status] ?? "bg-surface-2 text-muted-foreground",
        className,
      )}
    >
      {status}
    </span>
  );
}
