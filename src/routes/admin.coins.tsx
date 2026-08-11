import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminSection } from "@/components/admin/AdminSection";
import { DataRow, StatusBadge } from "@/components/admin/DataRow";
import { EmptyState, RowSkeletonList, TestModeBanner } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { resolveMedia } from "@/lib/media";
import { full } from "@/lib/format";

export const Route = createFileRoute("/admin/coins")({
  head: () => ({
    meta: [
      { title: "Coin Requests — Admin — VIVA LIVE" },
      { name: "description", content: "Review TEST coin purchase requests." },
      { property: "og:title", content: "Coin Requests — Admin — VIVA LIVE" },
      { property: "og:description", content: "Approve or reject TEST coin purchase requests." },
    ],
  }),
  component: AdminCoins,
});

type Status = "pending" | "approved" | "rejected";

function ProofImage({ ref }: { ref: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  useState(() => {
    void resolveMedia(ref).then(setUrl);
    return undefined;
  });
  if (!ref) return <p className="text-xs text-muted-foreground">No proof uploaded</p>;
  return url ? (
    <img src={url} alt="Payment proof" className="max-h-64 w-full rounded-2xl object-contain" />
  ) : (
    <p className="text-xs text-muted-foreground">Loading proof…</p>
  );
}

function AdminCoins() {
  const [tab, setTab] = useState<Status>("pending");
  const [note, setNote] = useState("");

  const query = useQuery({
    queryKey: ["admin-coins", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_purchase_requests")
        .select("*, profiles!coin_purchase_requests_user_profile_fkey(username, display_name, avatar_url)")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const review = async (id: string, approve: boolean) => {
    const { error } = await supabase.rpc("review_coin_request", { _request_id: id, _approve: approve, ...(note ? { _note: note } : {}) });
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? "Request approved" : "Request rejected");
    setNote("");
    void query.refetch();
  };

  const rows = query.data ?? [];

  return (
    <div className="space-y-4">
      <TestModeBanner label="TEST COINS — NO REAL MONEY" />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="flex-1">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="flex-1">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <AdminSection title="Coin requests">
        {query.isLoading ? (
          <RowSkeletonList />
        ) : rows.length === 0 ? (
          <EmptyState icon="🪙" title="No requests" />
        ) : (
          <div>
            {rows.map((r) => {
              const profile = r.profiles as { username: string; display_name: string; avatar_url: string | null } | null;
              return (
                <DataRow
                  key={r.id}
                  left={
                    <div className="flex items-center gap-2">
                      <UserAvatar src={profile?.avatar_url} name={profile?.display_name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{profile?.display_name || profile?.username}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {full(r.coins)} coins · {r.display_price} (TEST) · ref {r.payment_reference}
                        </p>
                      </div>
                    </div>
                  }
                  sub={<StatusBadge status={r.status} />}
                  right={
                    r.status === "pending" ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="secondary" className="h-7 rounded-full px-3 text-[11px]">
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>Review coin request</DialogTitle>
                          </DialogHeader>
                          <ProofImage ref={r.screenshot_url} />
                          <Textarea placeholder="Admin note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                          <DialogFooter className="gap-2">
                            <Button variant="destructive" onClick={() => void review(r.id, false)}>Reject</Button>
                            <Button onClick={() => void review(r.id, true)}>Approve</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
