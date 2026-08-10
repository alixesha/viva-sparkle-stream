import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  Coins,
  Gift,
  Mic,
  ShieldCheck,
  ShieldX,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, RowSkeletonList } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

const ICONS: Record<string, LucideIcon> = {
  new_follower: UserPlus,
  host_live: Mic,
  gift_received: Gift,
  coins_approved: ShieldCheck,
  coins_rejected: ShieldX,
  admin_coins: Coins,
  host_application: Mic,
  withdrawal_approved: Wallet,
  withdrawal_rejected: Wallet,
};

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — VIVA LIVE" },
      { name: "description", content: "Follows, gifts and approvals — everything happening on your VIVA LIVE account." },
      { property: "og:title", content: "Notifications — VIVA LIVE" },
      { property: "og:description", content: "Follows, gifts and approvals in one place." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user, session, loading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "unread">("all");

  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });

  useRealtime(
    `notifications-${user?.id}`,
    "notifications",
    user?.id ? `user_id=eq.${user.id}` : undefined,
    (payload) => {
      if (payload.eventType === "INSERT") {
        queryClient.setQueryData<NotificationRow[]>(["notifications", user?.id], (prev) => [
          payload.new as unknown as NotificationRow,
          ...(prev ?? []),
        ]);
      } else {
        void queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      }
    },
    Boolean(user?.id),
  );

  async function markAllRead() {
    if (!user) return;
    queryClient.setQueryData<NotificationRow[]>(["notifications", user.id], (prev) =>
      (prev ?? []).map((n) => ({ ...n, is_read: true })),
    );
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    if (error) {
      toast.error("Failed to mark all as read");
      void queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    }
  }

  async function handleOpen(n: NotificationRow) {
    if (!n.is_read) {
      queryClient.setQueryData<NotificationRow[]>(["notifications", user?.id], (prev) =>
        (prev ?? []).map((row) => (row.id === n.id ? { ...row, is_read: true } : row)),
      );
      void supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
    }

    const data = n.data ?? {};
    const roomId = data.room_id as string | undefined;
    const userId = data.user_id as string | undefined;

    if (roomId) {
      void navigate({ to: "/room/$roomId", params: { roomId } });
      return;
    }
    if (userId) {
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
      if (profile?.username) {
        void navigate({ to: "/u/$username", params: { username: profile.username } });
        return;
      }
    }
    if (n.type.includes("coins") || n.type.includes("gift") || n.type.includes("withdrawal")) {
      void navigate({ to: "/wallet" });
      return;
    }
    if (n.type === "host_application") {
      void navigate({ to: "/host" });
      return;
    }
  }

  if (!loading && !session) {
    return (
      <AppShell header={<PageHeader title="Notifications" />}>
        <EmptyState
          icon="🔔"
          title="Sign in for updates"
          description="Sign in to see follows, gifts and approvals."
          action={
            <Button asChild className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  const items = notificationsQuery.data ?? [];
  const filtered = tab === "unread" ? items.filter((n) => !n.is_read) : items;
  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <AppShell
      header={
        <PageHeader
          title="Notifications"
          action={
            unreadCount > 0 ? (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => void markAllRead()}>
                Mark all read
              </Button>
            ) : undefined
          }
        />
      }
    >
      <div className="mb-3 flex gap-2">
        {(["all", "unread"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold tap",
              tab === t ? "brand-gradient text-primary-foreground" : "glass text-muted-foreground",
            )}
          >
            {t === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
          </button>
        ))}
      </div>

      {notificationsQuery.isLoading ? (
        <RowSkeletonList count={6} />
      ) : notificationsQuery.isError ? (
        <ErrorState retry={() => void notificationsQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔔"
          title={tab === "unread" ? "You're all caught up" : "Nothing new"}
          description="Your activity feed will show up here."
        />
      ) : (
        <div className="space-y-1.5">
          {filtered.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => void handleOpen(n)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left tap animate-fade-in",
                  n.is_read ? "glass" : "glass-strong ring-1 ring-primary/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full",
                    n.is_read ? "bg-surface-2" : "brand-gradient text-primary-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={cn("truncate text-sm", n.is_read ? "font-semibold" : "font-bold")}>{n.title}</span>
                    {!n.is_read && <span className="size-2 shrink-0 rounded-full bg-live" />}
                  </span>
                  {n.body && <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>}
                  <span className="mt-1 block text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
