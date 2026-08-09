import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, AppHeader } from "@/components/layout/AppShell";
import { CardSkeletonGrid, EmptyState, SectionHeader, TestModeBanner } from "@/components/common/States";
import { compact } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VIVA LIVE — Live rooms happening now" },
      { name: "description", content: "Watch live rooms, chat in realtime and send animated gifts on VIVA LIVE." },
      { property: "og:title", content: "VIVA LIVE — Live rooms happening now" },
      { property: "og:description", content: "Watch live rooms, chat in realtime and send animated gifts." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["live-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_rooms")
        .select("id, title, viewer_count, thumbnail_url, status")
        .eq("status", "live")
        .order("viewer_count", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 15_000,
  });

  return (
    <AppShell header={<AppHeader />}>
      <TestModeBanner />
      <div className="mt-4">
        <SectionHeader title="Live now" icon={<Radio className="size-4 text-live" />} />
        {isLoading ? (
          <CardSkeletonGrid />
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {data.map((room) => (
              <Link
                key={room.id}
                to="/room/$roomId"
                params={{ roomId: room.id }}
                className="relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl glass p-3 tap"
              >
                <span className="absolute top-2 left-2 rounded-full bg-live px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  LIVE
                </span>
                <span className="truncate text-sm font-bold">{room.title}</span>
                <span className="text-xs text-muted-foreground">
                  👀 {compact(room.viewer_count ?? 0)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📡"
            title="No one is live yet"
            description="Be the first to start a room tonight."
            action={
              <Link to="/go-live" className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap">
                Go live
              </Link>
            }
          />
        )}
      </div>
    </AppShell>
  );
}
