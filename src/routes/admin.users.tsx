import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminSection } from "@/components/admin/AdminSection";
import { DataRow, StatusBadge } from "@/components/admin/DataRow";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, RowSkeletonList } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { full } from "@/lib/format";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Admin — VIVA LIVE" },
      { name: "description", content: "Search, moderate and manage VIVA LIVE users." },
      { property: "og:title", content: "Users — Admin — VIVA LIVE" },
      { property: "og:description", content: "Manage user accounts, coins, suspensions and roles." },
    ],
  }),
  component: AdminUsers,
});

const PAGE_SIZE = 20;

function AdminUsers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [coinTarget, setCoinTarget] = useState<{ id: string; name: string } | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [coinReason, setCoinReason] = useState("");
  const qc = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin-users", search, page],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (search.trim()) {
        query = query.or(`username.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%`);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const userIds = useMemo(() => (usersQuery.data?.rows ?? []).map((r) => r.id), [usersQuery.data]);

  const rolesQuery = useQuery({
    queryKey: ["admin-users-roles", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
      if (error) throw error;
      const map = new Map<string, string[]>();
      for (const r of data ?? []) {
        map.set(r.user_id, [...(map.get(r.user_id) ?? []), r.role]);
      }
      return map;
    },
  });

  const bansQuery = useQuery({
    queryKey: ["admin-users-bans", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("bans").select("user_id").in("user_id", userIds);
      if (error) throw error;
      return new Set((data ?? []).map((b) => b.user_id));
    },
  });

  const refetchAll = () => {
    void usersQuery.refetch();
    void qc.invalidateQueries({ queryKey: ["admin-users-roles"] });
    void qc.invalidateQueries({ queryKey: ["admin-users-bans"] });
  };

  const toggleSuspend = async (id: string, next: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_suspended: next }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? "User suspended" : "User unsuspended");
    refetchAll();
  };

  const toggleBan = async (id: string, banned: boolean) => {
    if (banned) {
      const { error } = await supabase.from("bans").delete().eq("user_id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Ban lifted");
    } else {
      const { error } = await supabase.from("bans").insert({ user_id: id, reason: "Admin action", is_permanent: true });
      if (error) { toast.error(error.message); return; }
      toast.success("User banned");
    }
    refetchAll();
  };

  const toggleRole = async (id: string, role: "moderator" | "admin", has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", role);
      if (error) { toast.error(error.message); return; }
      toast.success(`${role} revoked`);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: id, role });
      if (error) { toast.error(error.message); return; }
      toast.success(`${role} granted`);
    }
    refetchAll();
  };

  const submitCoinAdjust = async () => {
    if (!coinTarget) return;
    const amount = Number(coinAmount);
    if (!Number.isFinite(amount) || amount === 0) {
      toast.error("Enter a non-zero amount");
      return;
    }
    const { error } = await supabase.rpc("admin_adjust_coins", {
      _user_id: coinTarget.id,
      _amount: amount,
      _reason: coinReason || "Admin adjustment",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Coins adjusted (TEST COINS)");
    setCoinTarget(null);
    setCoinAmount("");
    setCoinReason("");
    refetchAll();
  };

  const rows = usersQuery.data?.rows ?? [];
  const count = usersQuery.data?.count ?? 0;
  const roles = rolesQuery.data ?? new Map<string, string[]>();
  const banned = bansQuery.data ?? new Set<string>();

  return (
    <div className="space-y-4">
      <AdminSection title="Search users">
        <Input
          placeholder="Search by username or display name"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </AdminSection>

      <AdminSection title={`Users (${full(count)})`}>
        {usersQuery.isLoading ? (
          <RowSkeletonList />
        ) : rows.length === 0 ? (
          <EmptyState icon="🙈" title="No users found" />
        ) : (
          <div>
            {rows.map((u) => {
              const userRoles = roles.get(u.id) ?? [];
              const isBanned = banned.has(u.id);
              return (
                <DataRow
                  key={u.id}
                  left={
                    <div className="flex items-center gap-2">
                      <UserAvatar src={u.avatar_url} name={u.display_name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{u.display_name || u.username}</p>
                        <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                  }
                  sub={
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Lvl {u.level} · XP {full(u.xp)} · {full(u.followers_count)} followers ·{" "}
                      {u.is_online ? "🟢 online" : "offline"}
                    </p>
                  }
                  right={
                    <>
                      {u.is_suspended && <StatusBadge status="suspended" />}
                      {isBanned && <StatusBadge status="banned" />}
                      {userRoles.includes("admin") && <StatusBadge status="approved" />}
                      <Dialog
                        open={coinTarget?.id === u.id}
                        onOpenChange={(o) => {
                          if (!o) setCoinTarget(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 rounded-full px-3 text-[11px]"
                            onClick={() => setCoinTarget({ id: u.id, name: u.display_name || u.username })}
                          >
                            Coins
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>Adjust TEST coins — {coinTarget?.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Input
                              type="number"
                              placeholder="Amount (negative to deduct)"
                              value={coinAmount}
                              onChange={(e) => setCoinAmount(e.target.value)}
                            />
                            <Input
                              placeholder="Reason"
                              value={coinReason}
                              onChange={(e) => setCoinReason(e.target.value)}
                            />
                            <p className="text-[11px] text-muted-foreground">TEST COINS — no real money value.</p>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => void submitCoinAdjust()}>Apply</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="outline" className="h-7 rounded-full px-3 text-[11px]">
                            {u.is_suspended ? "Unsuspend" : "Suspend"}
                          </Button>
                        }
                        title={u.is_suspended ? "Unsuspend user?" : "Suspend user?"}
                        onConfirm={() => void toggleSuspend(u.id, !u.is_suspended)}
                        destructive={!u.is_suspended}
                      />
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="outline" className="h-7 rounded-full px-3 text-[11px]">
                            {isBanned ? "Lift ban" : "Ban"}
                          </Button>
                        }
                        title={isBanned ? "Lift ban?" : "Ban user?"}
                        onConfirm={() => void toggleBan(u.id, isBanned)}
                        destructive={!isBanned}
                      />
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="outline" className="h-7 rounded-full px-3 text-[11px]">
                            {userRoles.includes("moderator") ? "Revoke mod" : "Make mod"}
                          </Button>
                        }
                        title="Toggle moderator role"
                        onConfirm={() => void toggleRole(u.id, "moderator", userRoles.includes("moderator"))}
                      />
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="outline" className="h-7 rounded-full px-3 text-[11px]">
                            {userRoles.includes("admin") ? "Revoke admin" : "Make admin"}
                          </Button>
                        }
                        title="Toggle admin role"
                        onConfirm={() => void toggleRole(u.id, "admin", userRoles.includes("admin"))}
                        destructive={userRoles.includes("admin")}
                      />
                    </>
                  }
                />
              );
            })}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {Math.max(1, Math.ceil(count / PAGE_SIZE))}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={(page + 1) * PAGE_SIZE >= count}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </AdminSection>
    </div>
  );
}
