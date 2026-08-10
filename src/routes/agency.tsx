import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, RowSkeletonList, TestModeBanner } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { compact, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/agency")({
  head: () => ({
    meta: [
      { title: "Agency — VIVA LIVE" },
      { name: "description", content: "Manage your VIVA LIVE agency, hosts and test commission." },
      { property: "og:title", content: "Agency — VIVA LIVE" },
      { property: "og:description", content: "Agency dashboard and membership." },
    ],
  }),
  component: AgencyPage,
});

type MemberRow = {
  host_id: string;
  profile: { username: string; display_name: string; avatar_url: string | null } | null;
  host: { total_diamonds: number; total_gifts_received: number; status: string } | null;
};

function statusPillClass(status: string) {
  if (status === "approved" || status === "active") return "bg-live/15 text-live";
  if (status === "rejected") return "bg-destructive/15 text-destructive";
  return "bg-warning/15 text-warning";
}

function AgencyPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <AppShell header={<PageHeader title="Agency" />}>
        <RowSkeletonList count={4} />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell header={<PageHeader title="Agency" />}>
        <EmptyState
          icon="🔒"
          title="Sign in required"
          action={
            <Link to="/auth" className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap">
              Sign in
            </Link>
          }
        />
      </AppShell>
    );
  }

  return <AgencyContent userId={user.id} />;
}

function AgencyContent({ userId }: { userId: string }) {
  const ownedQuery = useQuery({
    queryKey: ["agency-owned", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("agencies").select("*").eq("owner_id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const membershipsQuery = useQuery({
    queryKey: ["agency-memberships", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_members")
        .select("*, agency:agencies(*)")
        .eq("host_id", userId);
      if (error) throw error;
      return data;
    },
    enabled: !ownedQuery.data && ownedQuery.isFetched,
  });

  if (ownedQuery.isLoading) {
    return (
      <AppShell header={<PageHeader title="Agency" />}>
        <RowSkeletonList count={4} />
      </AppShell>
    );
  }

  if (ownedQuery.isError) {
    return (
      <AppShell header={<PageHeader title="Agency" />}>
        <ErrorState retry={() => void ownedQuery.refetch()} />
      </AppShell>
    );
  }

  if (ownedQuery.data) {
    return <AgencyOwnerDashboard agency={ownedQuery.data} />;
  }

  return (
    <AppShell header={<PageHeader title="Agency" />}>
      <TestModeBanner label="TEST COINS — NO REAL MONEY" />
      <CreateAgencyForm userId={userId} />

      <section className="mt-6">
        <h2 className="mb-2 text-base font-bold">Your memberships</h2>
        {membershipsQuery.isLoading && <RowSkeletonList count={2} />}
        {!membershipsQuery.isLoading && !membershipsQuery.data?.length && (
          <EmptyState icon="🏢" title="Not part of an agency" description="Agencies you join will appear here." />
        )}
        <div className="space-y-3">
          {membershipsQuery.data?.map((m) => {
            const agency = m.agency as { id: string; name: string; status: string; commission_percent: number } | null;
            if (!agency) return null;
            return (
              <div key={m.id} className="rounded-3xl glass p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{agency.name}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusPillClass(agency.status)}`}>{agency.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Commission: {agency.commission_percent}%</p>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function CreateAgencyForm({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [commission, setCommission] = useState("10");

  const create = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Enter an agency name.");
      const pct = Number(commission);
      if (Number.isNaN(pct) || pct < 0 || pct > 50) throw new Error("Commission must be between 0 and 50.");
      const { error } = await supabase.from("agencies").insert({
        owner_id: userId,
        name: trimmed,
        commission_percent: pct,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agency created, pending admin approval.");
      setName("");
      void queryClient.invalidateQueries({ queryKey: ["agency-owned", userId] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not create agency."),
  });

  return (
    <form
      className="mt-4 space-y-4 rounded-3xl glass p-5"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
    >
      <p className="text-sm text-muted-foreground">Create an agency to manage hosts. New agencies require admin approval before going active.</p>
      <div>
        <Label htmlFor="name">Agency name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      </div>
      <div>
        <Label htmlFor="commission">Requested commission (%)</Label>
        <Input id="commission" type="number" min={0} max={50} value={commission} onChange={(e) => setCommission(e.target.value)} />
      </div>
      <Button type="submit" disabled={create.isPending} className="w-full rounded-full brand-gradient font-bold text-primary-foreground">
        {create.isPending ? "Creating…" : "Create agency"}
      </Button>
    </form>
  );
}

function AgencyOwnerDashboard({ agency }: { agency: { id: string; name: string; status: string; commission_percent: number } }) {
  const membersQuery = useQuery({
    queryKey: ["agency-members", agency.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_members")
        .select("host_id, profile:profiles!agency_members_host_id_fkey(username, display_name, avatar_url), host:hosts!agency_members_host_id_fkey(total_diamonds, total_gifts_received, status)")
        .eq("agency_id", agency.id);
      if (error) throw error;
      return data as unknown as MemberRow[];
    },
  });

  const rows = membersQuery.data ?? [];
  const totalDiamonds = rows.reduce((sum, r) => sum + (r.host?.total_diamonds ?? 0), 0);
  const totalCommission = Math.round((totalDiamonds * agency.commission_percent) / 100);

  return (
    <AppShell header={<PageHeader title="Agency" />}>
      <TestModeBanner label="TEST COINS — NO REAL MONEY" />

      <div className="mt-4 rounded-3xl glass p-5">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">{agency.name}</p>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusPillClass(agency.status)}`}>{agency.status}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Commission rate: {agency.commission_percent}%</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface-2 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Members</p>
            <p className="text-xl font-extrabold">{rows.length}</p>
          </div>
          <div className="rounded-2xl bg-surface-2 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">Test commission</p>
            <p className="text-xl font-extrabold text-diamond">{compact(totalCommission)} 💎</p>
          </div>
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-base font-bold">Hosts</h2>
        {membersQuery.isLoading && <RowSkeletonList count={3} />}
        {membersQuery.isError && <ErrorState retry={() => void membersQuery.refetch()} />}
        {!membersQuery.isLoading && !rows.length && (
          <EmptyState icon="👥" title="No hosts yet" description="Hosts assigned to your agency will appear here." />
        )}
        <div className="space-y-2">
          {rows.map((r) => {
            const commission = Math.round(((r.host?.total_diamonds ?? 0) * agency.commission_percent) / 100);
            return (
              <div key={r.host_id} className="flex items-center gap-3 rounded-2xl glass p-3">
                <UserAvatar src={r.profile?.avatar_url} name={r.profile?.display_name ?? r.profile?.username} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.profile?.display_name ?? r.profile?.username ?? "Host"}</p>
                  <p className="text-xs text-muted-foreground">
                    {compact(r.host?.total_diamonds ?? 0)} 💎 · {compact(r.host?.total_gifts_received ?? 0)} gifts
                  </p>
                </div>
                <p className="text-sm font-bold text-diamond">{compact(commission)} 💎</p>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
