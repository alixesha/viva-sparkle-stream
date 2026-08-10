import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/common/States";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminGate({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-full bg-surface-2" />
        <Skeleton className="h-24 w-full rounded-3xl bg-surface-2" />
        <Skeleton className="h-24 w-full rounded-3xl bg-surface-2" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <EmptyState
        icon="🔒"
        title="Admins only"
        description="You don't have permission to view this area."
        action={
          <Link
            to="/"
            className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap"
          >
            Go home
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
