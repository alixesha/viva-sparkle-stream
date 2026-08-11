import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminSection } from "@/components/admin/AdminSection";
import { DataRow, StatusBadge } from "@/components/admin/DataRow";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, RowSkeletonList } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { full } from "@/lib/format";

export const Route = createFileRoute("/admin/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms — Admin — VIVA LIVE" },
      { name: "description", content: "Monitor and manage live and ended rooms." },
      { property: "og:title", content: "Rooms — Admin — VIVA LIVE" },
      { property: "og:description", content: "Moderate VIVA LIVE rooms." },
    ],
  }),
  component: AdminRooms,
});

function AdminRooms() {
  const [tab, setTab] = useState<"live" | "ended">("live");

  const query = useQuery({
    queryKey: ["admin-rooms", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_rooms")
        .select("*, profiles!live_rooms_host_profile_fkey(username, display_name)")
        .eq("status", tab)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const forceEnd = async (id: string) => {
    const { error } = await supabase.from("live_rooms").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Room ended");
    void query.refetch();
  };

  const rows = query.data ?? [];

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "live" | "ended")}>
        <TabsList className="w-full">
          <TabsTrigger value="live" className="flex-1">Live</TabsTrigger>
          <TabsTrigger value="ended" className="flex-1">Ended</TabsTrigger>
        </TabsList>
      </Tabs>

      <AdminSection title="Rooms">
        {query.isLoading ? (
          <RowSkeletonList />
        ) : rows.length === 0 ? (
          <EmptyState icon="📺" title="No rooms" />
        ) : (
          <div>
            {rows.map((r) => {
              const profile = r.profiles as { username: string; display_name: string } | null;
              return (
                <DataRow
                  key={r.id}
                  left={
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.title}</p>
                      <p className="truncate text-xs text-muted-foreground">Host: {profile?.display_name || profile?.username}</p>
                    </div>
                  }
                  sub={
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      <StatusBadge status={r.status} /> 👁 {full(r.viewer_count)} · peak {full(r.peak_viewers)} · ❤️ {full(r.likes_count)} · 💎 {full(r.diamonds_earned)}
                    </p>
                  }
                  right={
                    r.status === "live" ? (
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="destructive" className="h-7 rounded-full px-3 text-[11px]">
                            Force end
                          </Button>
                        }
                        title="Force end this room?"
                        onConfirm={() => void forceEnd(r.id)}
                        destructive
                      />
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
