import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, RowSkeletonList, TestModeBanner } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { full, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — VIVA LIVE" },
      { name: "description", content: "Request a test withdrawal of your VIVA LIVE diamonds." },
      { property: "og:title", content: "Withdraw — VIVA LIVE" },
      { property: "og:description", content: "TEST MODE — no real money is transferred." },
    ],
  }),
  component: WithdrawPage,
});

const METHODS = ["Bank transfer", "JazzCash", "Easypaisa", "PayPal"];

function statusPillClass(status: string) {
  switch (status) {
    case "completed":
    case "approved":
      return "bg-live/15 text-live";
    case "rejected":
      return "bg-destructive/15 text-destructive";
    case "processing":
      return "bg-diamond/15 text-diamond";
    default:
      return "bg-warning/15 text-warning";
  }
}

function WithdrawPage() {
  const { user, wallet, isHost, isAdmin, loading, refresh } = useAuth();
  const queryClient = useQueryClient();
  const [diamonds, setDiamonds] = useState("");
  const [method, setMethod] = useState("");
  const [details, setDetails] = useState("");

  const settingsQuery = useQuery({
    queryKey: ["app-settings", "economy"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("value").eq("key", "economy").maybeSingle();
      if (error) throw error;
      return data?.value as { withdrawal_minimum?: number } | null;
    },
  });

  const withdrawalsQuery = useQuery({
    queryKey: ["withdrawals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("host_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });

  const minimum = settingsQuery.data?.withdrawal_minimum ?? 10000;

  const request = useMutation({
    mutationFn: async () => {
      const amount = Number(diamonds);
      if (!amount || amount < minimum) throw new Error(`Minimum withdrawal is ${full(minimum)} diamonds.`);
      if (!method) throw new Error("Select a payout method.");
      if (!details.trim()) throw new Error("Enter payout details.");
      const { data, error } = await supabase.rpc("request_withdrawal", {
        _diamonds: amount,
        _method: method,
        _details: details.trim(),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Withdrawal request submitted.");
      setDiamonds("");
      setMethod("");
      setDetails("");
      void queryClient.invalidateQueries({ queryKey: ["withdrawals", user?.id] });
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message || "Could not submit withdrawal request."),
  });

  if (loading) {
    return (
      <AppShell header={<PageHeader title="Withdraw" />}>
        <RowSkeletonList count={4} />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell header={<PageHeader title="Withdraw" />}>
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

  if (!isHost && !isAdmin) {
    return (
      <AppShell header={<PageHeader title="Withdraw" />}>
        <EmptyState
          icon="🎙️"
          title="Hosts only"
          description="Only approved hosts can request withdrawals."
          action={
            <Link to="/host-apply" className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap">
              Apply to host
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell header={<PageHeader title="Withdraw" />}>
      <TestModeBanner label="TEST MODE — NO REAL MONEY IS TRANSFERRED" />

      <div className="mt-4 rounded-3xl glass p-5">
        <p className="text-xs text-muted-foreground">Your diamonds</p>
        <p className="text-2xl font-extrabold text-diamond">{full(wallet?.diamonds ?? 0)} 💎</p>
        <p className="mt-1 text-xs text-muted-foreground">Minimum withdrawal: {full(minimum)} 💎</p>
      </div>

      <form
        className="mt-4 space-y-4 rounded-3xl glass p-5"
        onSubmit={(e) => {
          e.preventDefault();
          request.mutate();
        }}
      >
        <div>
          <Label htmlFor="diamonds">Diamonds to withdraw</Label>
          <Input id="diamonds" type="number" min={minimum} value={diamonds} onChange={(e) => setDiamonds(e.target.value)} />
        </div>
        <div>
          <Label>Payout method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="details">Payout details</Label>
          <Textarea id="details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Account name, number, etc." />
        </div>
        <Button type="submit" disabled={request.isPending} className="w-full rounded-full brand-gradient font-bold text-primary-foreground">
          {request.isPending ? "Submitting…" : "Request withdrawal"}
        </Button>
      </form>

      <section className="mt-6">
        <h2 className="mb-2 text-base font-bold">Your requests</h2>
        {withdrawalsQuery.isLoading && <RowSkeletonList count={3} />}
        {withdrawalsQuery.isError && <ErrorState retry={() => void withdrawalsQuery.refetch()} />}
        {!withdrawalsQuery.isLoading && !withdrawalsQuery.data?.length && (
          <EmptyState icon="🧾" title="No requests yet" description="Your withdrawal history will appear here." />
        )}
        <div className="space-y-2">
          {withdrawalsQuery.data?.map((w) => (
            <div key={w.id} className="rounded-2xl glass p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{full(w.diamonds)} 💎 · {w.payout_method}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusPillClass(w.status)}`}>{w.status}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{timeAgo(w.created_at)}</p>
              {w.admin_note && <p className="mt-1 text-xs text-muted-foreground">Note: {w.admin_note}</p>}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
