import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminSection, StatTile } from "@/components/admin/AdminSection";
import { ErrorState, TestModeBanner } from "@/components/common/States";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { compact, full } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Admin — VIVA LIVE" },
      { name: "description", content: "Live platform overview and pending queues." },
      { property: "og:title", content: "Dashboard — Admin — VIVA LIVE" },
      { property: "og:description", content: "Platform overview for VIVA LIVE admins." },
    ],
  }),
  component: AdminDashboard,
});

interface AdminStats {
  total_users?: number;
  online_users?: number;
  live_rooms?: number;
  hosts?: number;
  pending_host_applications?: number;
  pending_coin_requests?: number;
  coins_issued?: number;
  gifts_sent?: number;
  diamonds?: number;
  pending_withdrawals?: number;
  open_reports?: number;
}

function AdminDashboard() {
  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return (data ?? {}) as AdminStats;
    },
  });

  const s = statsQuery.data ?? {};

  return (
    <div className="space-y-4">
      <TestModeBanner />

      {statsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl bg-surface-2" />
          ))}
        </div>
      ) : statsQuery.isError ? (
        <ErrorState message="Couldn't load admin stats." retry={() => void statsQuery.refetch()} />
      ) : (
        <>
          <AdminSection title="Platform">
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Total users" value={full(s.total_users)} />
              <StatTile label="Online now" value={full(s.online_users)} tone="live" />
              <StatTile label="Live rooms" value={full(s.live_rooms)} tone="live" />
              <StatTile label="Hosts" value={full(s.hosts)} />
            </div>
          </AdminSection>

          <AdminSection title="Economy">
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Coins issued" value={compact(s.coins_issued)} tone="coin" />
              <StatTile label="Gifts sent" value={full(s.gifts_sent)} />
              <StatTile label="Diamonds" value={compact(s.diamonds)} tone="diamond" />
            </div>
          </AdminSection>

          <AdminSection title="Pending queues">
            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/applications">
                <StatTile label="Host applications" value={full(s.pending_host_applications)} tone="warn" />
              </Link>
              <Link to="/admin/coins">
                <StatTile label="Coin requests" value={full(s.pending_coin_requests)} tone="warn" />
              </Link>
              <Link to="/admin/coins">
                <StatTile label="Withdrawals" value={full(s.pending_withdrawals)} tone="warn" />
              </Link>
              <Link to="/admin/rooms">
                <StatTile label="Open reports" value={full(s.open_reports)} tone="warn" />
              </Link>
            </div>
          </AdminSection>
        </>
      )}
    </div>
  );
}
