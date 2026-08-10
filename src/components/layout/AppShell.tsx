import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronLeft, Search } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { UserAvatar } from "@/components/common/UserAvatar";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CoinPill() {
  const { wallet } = useAuth();
  return (
    <Link
      to="/wallet"
      className="flex items-center gap-1 rounded-full border border-coin/40 bg-coin/10 px-2.5 py-1 text-xs font-bold tap"
    >
      <span aria-hidden>💰</span>
      <span className="coin-text">{compact(wallet?.coins ?? 0)}</span>
    </Link>
  );
}

export function AppHeader() {
  const { session, profile } = useAuth();
  const uid = session?.user.id;
  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications-unread", uid],
    enabled: Boolean(uid),
    refetchInterval: 30_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid!)
        .eq("is_read", false);
      return count ?? 0;
    },
  });
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-3 px-4 pt-3 pb-2 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
          <CoinPill />
          <Link
            to="/discover"
            aria-label="Search"
            className="grid size-9 place-items-center rounded-full glass tap"
          >
            <Search className="size-4" />
          </Link>
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative grid size-9 place-items-center rounded-full glass tap"
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-live px-1 text-[10px] font-bold text-primary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          {session ? (
            <Link to="/profile" aria-label="Profile">
              <UserAvatar size="sm" src={profile?.avatar_url ?? null} name={profile?.display_name ?? "Me"} />
            </Link>
          ) : (
            <Link
              to="/auth"
              className="rounded-full brand-gradient px-3 py-1.5 text-xs font-bold text-primary-foreground tap"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function PageHeader({
  title,
  back = true,
  action,
}: {
  title: string;
  back?: boolean;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-3 px-4 py-3 backdrop-blur-xl">
      {back && (
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="Go back"
          className="grid size-9 shrink-0 place-items-center rounded-full glass tap"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
      {action}
    </header>
  );
}

export function AppShell({
  children,
  header,
  nav = true,
  className,
}: {
  children: ReactNode;
  header?: ReactNode;
  nav?: boolean;
  className?: string;
}) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-lg px-4">
      {header}
      <main className={cn("animate-fade-in", nav && "pb-28", className)}>{children}</main>
      {nav && <BottomNav />}
    </div>
  );
}