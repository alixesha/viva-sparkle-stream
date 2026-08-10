import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, RowSkeletonList, TestModeBanner } from "@/components/common/States";
import { StatusPill } from "@/components/wallet/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { uploadUserFile, resolveMedia } from "@/lib/media";
import { full } from "@/lib/format";

export const Route = createFileRoute("/wallet/buy/$packageId")({
  head: () => ({
    meta: [
      { title: "Buy test coins — VIVA LIVE" },
      { name: "description", content: "Submit a test coin purchase request for admin approval." },
      { property: "og:title", content: "Buy test coins — VIVA LIVE" },
      { property: "og:description", content: "TEST MODE — no real money is processed." },
    ],
  }),
  component: BuyPackagePage,
});

const schema = z.object({
  payment_reference: z.string().trim().min(3, "Enter at least 3 characters").max(80, "Keep it under 80 characters"),
});

function BuyPackagePage() {
  const { packageId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const pkgQuery = useQuery({
    queryKey: ["coin-package", packageId],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("coin_packages")
        .select("*")
        .eq("id", packageId)
        .eq("is_active", true)
        .maybeSingle();
      if (err) throw err;
      return data;
    },
  });

  const pendingQuery = useQuery({
    queryKey: ["coin-purchase-request-pending", packageId, user?.id],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("coin_purchase_requests")
        .select("*")
        .eq("user_id", user!.id)
        .eq("package_id", packageId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .maybeSingle();
      if (err) throw err;
      return data;
    },
    enabled: Boolean(user),
  });

  const proofQuery = useQuery({
    queryKey: ["media", pendingQuery.data?.screenshot_url],
    queryFn: () => resolveMedia(pendingQuery.data?.screenshot_url),
    enabled: Boolean(pendingQuery.data?.screenshot_url),
  });

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ payment_reference: paymentReference });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid input");
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      }
      setError(null);
      let screenshot_url: string | null = null;
      if (file) {
        screenshot_url = await uploadUserFile("payment-proofs", user!.id, file);
      }
      const pkg = pkgQuery.data!;
      const { error: err } = await supabase.from("coin_purchase_requests").insert({
        user_id: user!.id,
        package_id: pkg.id,
        coins: pkg.coins + pkg.bonus_coins,
        display_price: pkg.display_price,
        payment_reference: parsed.data.payment_reference,
        screenshot_url,
      });
      if (err) throw err;
    },
    onSuccess: () => {
      toast.success("Request submitted! An admin will review it soon.");
      void queryClient.invalidateQueries({ queryKey: ["coin-purchase-requests", user?.id] });
      void navigate({ to: "/wallet" });
    },
    onError: (e: Error) => toast.error(e.message || "Could not submit request."),
  });

  if (loading || pkgQuery.isLoading) {
    return (
      <AppShell header={<PageHeader title="Buy coins" />}>
        <RowSkeletonList count={4} />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell header={<PageHeader title="Buy coins" />}>
        <EmptyState
          icon="🔒"
          title="Sign in required"
          description="Sign in to buy test coins."
          action={
            <Link to="/auth" className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap">
              Sign in
            </Link>
          }
        />
      </AppShell>
    );
  }

  if (pkgQuery.isError) {
    return (
      <AppShell header={<PageHeader title="Buy coins" />}>
        <ErrorState retry={() => void pkgQuery.refetch()} />
      </AppShell>
    );
  }

  const pkg = pkgQuery.data;
  if (!pkg) {
    return (
      <AppShell header={<PageHeader title="Buy coins" />}>
        <EmptyState
          icon="🚫"
          title="Package not found"
          description="This coin package doesn't exist or is no longer active."
          action={
            <Link to="/wallet" className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap">
              Back to wallet
            </Link>
          }
        />
      </AppShell>
    );
  }

  const pending = pendingQuery.data;

  return (
    <AppShell header={<PageHeader title={pkg.name} />}>
      <TestModeBanner label="TEST MODE — NO REAL MONEY IS PROCESSED" />

      <div className="mt-4 rounded-3xl glass p-4">
        <p className="text-sm text-muted-foreground">You'll receive</p>
        <p className="coin-text text-2xl font-extrabold">
          {full(pkg.coins)}
          {pkg.bonus_coins > 0 && <span className="ml-1 text-sm text-live">+{full(pkg.bonus_coins)} bonus</span>}
        </p>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">{pkg.display_price}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Submitting this form creates a purchase request that an admin approves manually. No payment is processed
          and no real money moves — this is a TEST COIN ECONOMY.
        </p>
      </div>

      {pendingQuery.isLoading && (
        <div className="mt-4">
          <RowSkeletonList count={1} />
        </div>
      )}

      {!pendingQuery.isLoading && pending && (
        <div className="mt-4 rounded-3xl glass p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Request already pending</p>
            <StatusPill status={pending.status} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Ref: {pending.payment_reference}</p>
          {proofQuery.data && (
            <img src={proofQuery.data} alt="Payment proof" className="mt-3 h-32 w-full rounded-2xl object-cover" />
          )}
          <Link
            to="/wallet"
            className="mt-4 block rounded-full brand-gradient px-4 py-2 text-center text-sm font-bold text-primary-foreground tap"
          >
            Back to wallet
          </Link>
        </div>
      )}

      {!pendingQuery.isLoading && !pending && (
        <form
          className="mt-4 space-y-4 rounded-3xl glass p-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <div>
            <Label htmlFor="payment_reference">Payment reference / note</Label>
            <Input
              id="payment_reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. TXN123456 or a short note"
              maxLength={80}
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>

          <div>
            <Label htmlFor="proof">Proof screenshot (optional)</Label>
            <input
              ref={fileRef}
              id="proof"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="mt-1 block w-full text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-xs file:font-bold"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                setPreviewUrl(f ? URL.createObjectURL(f) : null);
              }}
            />
            {previewUrl && (
              <img src={previewUrl} alt="Proof preview" className="mt-3 h-32 w-full rounded-2xl object-cover" />
            )}
          </div>

          <Button type="submit" disabled={submit.isPending} className="w-full rounded-full brand-gradient font-bold">
            {submit.isPending ? "Submitting…" : "Submit test purchase request"}
          </Button>
        </form>
      )}
    </AppShell>
  );
}
