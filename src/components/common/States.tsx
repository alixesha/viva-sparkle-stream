import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function SectionHeader({
  title,
  action,
  icon,
}: {
  title: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex min-w-0 items-center gap-2 text-base font-bold">
        {icon}
        <span className="truncate">{title}</span>
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon = "✨",
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-3xl glass px-6 py-12 text-center",
        className,
      )}
    >
      <div className="text-3xl">{icon}</div>
      <p className="font-display font-bold">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, retry }: { message?: string; retry?: () => void }) {
  return (
    <EmptyState
      icon="⚠️"
      title="Something went wrong"
      description={message ?? "Please try again in a moment."}
      action={
        retry ? (
          <button onClick={retry} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground tap">
            Try again
          </button>
        ) : undefined
      }
    />
  );
}

export function CardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-[3/4] rounded-3xl bg-surface-2" />
      ))}
    </div>
  );
}

export function RowSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-2xl bg-surface-2" />
      ))}
    </div>
  );
}

export function TestModeBanner({ label = "TEST MODE — NO REAL MONEY" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] font-bold tracking-wide text-warning uppercase">
      <span className="grid size-5 place-items-center rounded-full bg-warning/20">!</span>
      <span className="min-w-0 flex-1">{label}</span>
    </div>
  );
}