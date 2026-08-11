import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminSection } from "@/components/admin/AdminSection";
import { DataRow, StatusBadge } from "@/components/admin/DataRow";
import { EmptyState, RowSkeletonList } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { full } from "@/lib/format";

export const Route = createFileRoute("/admin/hosts")({
  head: () => ({
    meta: [
      { title: "Hosts — Admin — VIVA LIVE" },
      { name: "description", content: "Manage host status, levels and agency assignment." },
      { property: "og:title", content: "Hosts — Admin — VIVA LIVE" },
      { property: "og:description", content: "Review and manage VIVA LIVE hosts." },
    ],
  }),
  component: AdminHosts,
});

type HostStatus = "active" | "suspended" | "pending";

function AdminHosts() {
  const [levelDrafts, setLevelDrafts] = useState<Record<string, string>>({});

  const hostsQuery = useQuery({
    queryKey: ["admin-hosts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hosts")
        .select("*, profiles!hosts_user_profile_fkey(username, display_name, avatar_url)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const agenciesQuery = useQuery({
    queryKey: ["admin-hosts-agencies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agencies").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = async (userId: string, status: HostStatus) => {
    const { error } = await supabase.from("hosts").update({ status }).eq("user_id", userId);
    if (error) return toast.error(error.message);
    toast.success("Host status updated");
    void hostsQuery.refetch();
  };

  const updateLevel = async (userId: string) => {
    const value = Number(levelDrafts[userId]);
    if (!Number.isFinite(value) || value < 1) return toast.error("Invalid level");
    const { error } = await supabase.from("hosts").update({ host_level: value }).eq("user_id", userId);
    if (error) return toast.error(error.message);
    toast.success("Host level updated");
    void hostsQuery.refetch();
  };

  const assignAgency = async (userId: string, agencyId: string) => {
    const { error } = await supabase
      .from("hosts")
      .update({ agency_id: agencyId === "none" ? null : agencyId })
      .eq("user_id", userId);
    if (error) return toast.error(error.message);
    toast.success("Agency assigned");
    void hostsQuery.refetch();
  };

  const hosts = hostsQuery.data ?? [];
  const agencies = agenciesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <AdminSection title={`Hosts (${full(hosts.length)})`}>
        {hostsQuery.isLoading ? (
          <RowSkeletonList />
        ) : hosts.length === 0 ? (
          <EmptyState icon="🎥" title="No hosts yet" />
        ) : (
          <div>
            {hosts.map((h) => {
              const profile = h.profiles as { username: string; display_name: string; avatar_url: string | null } | null;
              return (
                <DataRow
                  key={h.user_id}
                  left={
                    <div className="flex items-center gap-2">
                      <UserAvatar src={profile?.avatar_url} name={profile?.display_name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{profile?.display_name || profile?.username}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{profile?.username} · {full(h.total_diamonds)} 💎
                        </p>
                      </div>
                    </div>
                  }
                  sub={<StatusBadge status={h.status} />}
                  right={
                    <>
                      <Select value={h.status} onValueChange={(v) => void updateStatus(h.user_id, v as HostStatus)}>
                        <SelectTrigger className="h-7 w-[110px] rounded-full text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="h-7 w-16 rounded-full text-center text-[11px]"
                        defaultValue={h.host_level}
                        onChange={(e) => setLevelDrafts((d) => ({ ...d, [h.user_id]: e.target.value }))}
                      />
                      <Button size="sm" variant="secondary" className="h-7 rounded-full px-3 text-[11px]" onClick={() => void updateLevel(h.user_id)}>
                        Save lvl
                      </Button>
                      <Select value={h.agency_id ?? "none"} onValueChange={(v) => void assignAgency(h.user_id, v)}>
                        <SelectTrigger className="h-7 w-[130px] rounded-full text-[11px]">
                          <SelectValue placeholder="Agency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No agency</SelectItem>
                          {agencies.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
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
