import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, RowSkeletonList, TestModeBanner } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { compact, duration, full, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/host")({
  head: () => ({
    meta: [
      { title: "Host dashboard — VIVA LIVE" },
      { name: "description", content: "Track your VIVA LIVE hosting earnings, live history and top gifters." },
      { property: "og:title", content: "Host dashboard — VIVA LIVE" },
      { property: "og:description", content: "Earnings, live history and top supporters." },
    ],
  }),
  component: HostDashboardPage,
});

function HostDashboardPage() {
  const { user, isHost, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <AppShell header={<PageHeader title="Host dashboard" />}>
        <RowSkeletonList count={5} />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell header={<PageHeader title="Host dashboard" />}>
        <EmptyState
          icon="🔒"
          title="Sign in required"
          description="Sign in to view your host dashboard."
          action={
            <Link to="/auth" className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap">
              Sign in
            </Link>
          }
        />
      </AppShell>
    );
  }

  if (!isHost && !isAdmin) {
    return (
      <AppShell header={<PageHeader title="Host dashboard" />}>
        <EmptyState
          icon="🎙️"
          title="Not a host yet"
          description="Apply to become a host to unlock the dashboard."
          action={
            <Link to="/host-apply" className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap">
              Apply to host
            </Link>
          }
        />
      </AppShell>
    );
  }

  return <HostDashboard userId={user.id} />;
}

function HostDashboard({ userId }: { userId: string }) {
  const hostQuery = useQuery({
    queryKey: ["host-row", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("hosts").select("*").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const earningsQuery = useQuery({
    queryKey: ["host-earnings", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("host_earnings")
        .select("*")
        .eq("host_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  const roomsQuery = useQuery({
    queryKey: ["host-rooms", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_rooms")
        .select("*")
        .eq("host_id", userId)
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const giftersQuery = useQuery({
    queryKey: ["host-top-gifters", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_transactions")
        .select("sender_id, diamonds_earned, sender:profiles!gift_transactions_sender_id_fkey(username, display_name, avatar_url)")
        .eq("receiver_id", userId)
        .limit(500);
      if (error) throw error;
      const totals = new Map<string, { name: string; avatar: string | null; diamonds: number }>();
      for (const row of data ?? []) {
        const sender = row.sender as { username: string; display_name: string; avatar_url: string | null } | null;
        const key = row.sender_id;
        const prev = totals.get(key);
        const diamonds = (prev?.diamonds ?? 0) + row.diamonds_earned;
        totals.set(key, {
          name: sender?.display_name || sender?.username || "Someone",
          avatar: sender?.avatar_url ?? null,
          diamonds,
        });
      }
      return Array.from(totals.values()).sort((a, b) => b.diamonds - a.diamonds).slice(0, 10);
    },
  });

  const host = hostQuery.data;

  return (
    <AppShell header={<PageHeader title="Host dashboard" />}>
      <TestModeBanner label="TEST BALANCE — NO REAL VALUE" />

      {hostQuery.isLoading && <RowSkeletonList count={2} />}
      {hostQuery.isError && <ErrorState retry={() => void hostQuery.refetch()} />}
      {host && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-3xl glass p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Diamonds</p>
            <p className="text-xl font-extrabold text-diamond">{compact(host.total_diamonds)}</p>
          </div>
          <div className="rounded-3xl glass p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Gifts</p>
            <p className="text-xl font-extrabold">{compact(host.total_gifts_received)}</p>
          </div>
          <div className="rounded-3xl glass p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Live time</p>
            <p className="text-xl font-extrabold">{duration(host.total_live_seconds)}</p>
          </div>
        </div>
      )}

      <Link to="/withdraw" className="mt-4 block rounded-full brand-gradient px-4 py-3 text-center text-sm font-bold text-primary-foreground tap">
        Request withdrawal
      </Link>

      <section className="mt-6">
        <h2 className="mb-2 text-base font-bold">Top gifters</h2>
        {giftersQuery.isLoading && <RowSkeletonList count={3} />}
        {!giftersQuery.isLoading && !giftersQuery.data?.length && (
          <EmptyState icon="🎁" title="No gifts yet" description="Gifts you receive will show up here." />
        )}
        <div className="space-y-2">
          {giftersQuery.data?.map((g, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl glass p-3">
              <UserAvatar src={g.avatar} name={g.name} size="sm" />
              <p className="min-w-0 flex-1 truncate text-sm font-semibold">{g.name}</p>
              <p className="text-sm font-bold text-diamond">{compact(g.diamonds)} 💎</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-base font-bold">Earnings history</h2>
        {earningsQuery.isLoading && <RowSkeletonList count={3} />}
        {!earningsQuery.isLoading && !earningsQuery.data?.length && (
          <EmptyState icon="💎" title="No earnings yet" description="Earn diamonds from gifts while live." />
        )}
        <div className="space-y-2">
          {earningsQuery.data?.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-2xl glass p-3 text-sm">
              <div>
                <p className="font-semibold capitalize">{e.source}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(e.created_at)}</p>
              </div>
              <p className="font-bold text-diamond">+{full(e.diamonds)} 💎</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-base font-bold">Live history</h2>
        {roomsQuery.isLoading && <RowSkeletonList count={3} />}
        {!roomsQuery.isLoading && !roomsQuery.data?.length && (
          <EmptyState icon="📺" title="No streams yet" description="Go live to start building your history." />
        )}
        <div className="space-y-2">
          {roomsQuery.data?.map((r) => {
            const secs = r.ended_at
              ? Math.max(0, (new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 1000)
              : (Date.now() - new Date(r.started_at).getTime()) / 1000;
            return (
              <div key={r.id} className="rounded-2xl glass p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate font-semibold">{r.title}</p>
                  {r.status === "live" ? (
                    <Link to="/room/$roomId" params={{ roomId: r.id }} className="shrink-0 rounded-full bg-live/15 px-3 py-1 text-xs font-bold text-live tap">
                      Go to room
                    </Link>
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(r.started_at)}</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>👁 {compact(r.peak_viewers)} peak</span>
                  <span>❤️ {compact(r.likes_count)}</span>
                  <span>💎 {compact(r.diamonds_earned)}</span>
                  <span>⏱ {duration(secs)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
