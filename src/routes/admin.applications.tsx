import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminSection } from "@/components/admin/AdminSection";
import { DataRow, StatusBadge } from "@/components/admin/DataRow";
import { EmptyState, RowSkeletonList } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({
    meta: [
      { title: "Host Applications — Admin — VIVA LIVE" },
      { name: "description", content: "Review pending host applications." },
      { property: "og:title", content: "Host Applications — Admin — VIVA LIVE" },
      { property: "og:description", content: "Approve or reject host applications." },
    ],
  }),
  component: AdminApplications,
});

type Status = "pending" | "approved" | "rejected";

function AdminApplications() {
  const [tab, setTab] = useState<Status>("pending");
  const [note, setNote] = useState("");

  const query = useQuery({
    queryKey: ["admin-applications", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("host_applications")
        .select("*, profiles!host_applications_user_profile_fkey(username, display_name, avatar_url)")
        .eq("status", tab)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const review = async (id: string, approve: boolean) => {
    const { error } = await supabase.rpc("review_host_application", { _app_id: id, _approve: approve, _note: note || null });
    if (error) return toast.error(error.message);
    toast.success(approve ? "Application approved" : "Application rejected");
    setNote("");
    void query.refetch();
  };

  const rows = query.data ?? [];

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList className="w-full">
          <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
          <TabsTrigger value="approved" className="flex-1">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="flex-1">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <AdminSection title="Applications">
        {query.isLoading ? (
          <RowSkeletonList />
        ) : rows.length === 0 ? (
          <EmptyState icon="📄" title="No applications" />
        ) : (
          <div>
            {rows.map((a) => {
              const profile = a.profiles as { username: string; display_name: string; avatar_url: string | null } | null;
              return (
                <DataRow
                  key={a.id}
                  left={
                    <div className="flex items-center gap-2">
                      <UserAvatar src={profile?.avatar_url} name={profile?.display_name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{profile?.display_name || profile?.username}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.real_name} · {a.country} · age {a.age ?? "-"}
                        </p>
                      </div>
                    </div>
                  }
                  sub={
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      <StatusBadge status={a.status} /> {a.experience}
                    </p>
                  }
                  right={
                    a.status === "pending" ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="secondary" className="h-7 rounded-full px-3 text-[11px]">
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>Review application</DialogTitle>
                          </DialogHeader>
                          <Textarea placeholder="Admin note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                          <DialogFooter className="gap-2">
                            <Button variant="destructive" onClick={() => void review(a.id, false)}>Reject</Button>
                            <Button onClick={() => void review(a.id, true)}>Approve</Button>
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
