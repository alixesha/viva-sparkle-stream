import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { CardSkeletonGrid, EmptyState, ErrorState, RowSkeletonList, TestModeBanner } from "@/components/common/States";
import { CoinPackageCard, type CoinPackage } from "@/components/wallet/CoinPackageCard";
import { TransactionRow, type CoinTransaction } from "@/components/wallet/TransactionRow";
import { StatusPill } from "@/components/wallet/StatusPill";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { supabase } from "@/integrations/supabase/client";
import { resolveMedia } from "@/lib/media";
import { compact, full, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — VIVA LIVE" },
      { name: "description", content: "Your VIVA LIVE test coins, diamonds and transaction history." },
      { property: "og:title", content: "Wallet — VIVA LIVE" },
      { property: "og:description", content: "Test coins, diamonds and transactions." },
    ],
  }),
  component: WalletPage,
});

type TxFilter = "all" | CoinTransaction["type"];

const TX_FILTERS: { value: TxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "purchase", label: "Purchases" },
  { value: "gift_sent", label: "Gifts" },
  { value: "admin_credit", label: "Credits" },
  { value: "admin_debit", label: "Debits" },
  { value: "signup_bonus", label: "Bonus" },
  { value: "refund", label: "Refunds" },
];

function RequestProof({ ref }: { ref: string | null }) {
  const q = useQuery({
    queryKey: ["media", ref],
    queryFn: () => resolveMedia(ref),
    enabled: Boolean(ref),
    staleTime: 45 * 60 * 1000,
  });
  if (!ref) return null;
  if (!q.data) return <div className="size-12 shrink-0 rounded-xl bg-surface-2" />;
  return (
    <img src={q.data} alt="Payment proof" className="size-12 shrink-0 rounded-xl object-cover" />
  );
}

function WalletPage() {
  const { user, wallet, loading, refresh } = useAuth();
  const queryClient = useQueryClient();
  const [txFilter, setTxFilter] = useState<TxFilter>("all");

  const packagesQuery = useQuery({
    queryKey: ["coin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CoinPackage[];
    },
  });

  const requestsQuery = useQuery({
    queryKey: ["coin-purchase-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_purchase_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(user),
  });

  const transactionsQuery = useQuery({
    queryKey: ["coin-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as CoinTransaction[];
    },
    enabled: Boolean(user),
  });

  useRealtime(
    `coin-purchase-requests-${user?.id ?? "anon"}`,
    "coin_purchase_requests",
    user ? `user_id=eq.${user.id}` : undefined,
    (payload) => {
      void queryClient.invalidateQueries({ queryKey: ["coin-purchase-requests", user?.id] });
      const status = (payload.new as { status?: string } | null)?.status;
      if (payload.eventType === "UPDATE" && status === "approved") {
        void refresh();
        void queryClient.invalidateQueries({ queryKey: ["coin-transactions", user?.id] });
      }
    },
    Boolean(user),
  );

  const bestValueId = useMemo(() => {
    const list = packagesQuery.data ?? [];
    if (list.length === 0) return null;
    let best = list[0]!;
    let bestRatio = best.coins > 0 ? best.bonus_coins / best.coins : 0;
    for (const p of list) {
      const ratio = p.coins > 0 ? p.bonus_coins / p.coins : 0;
      if (ratio > bestRatio) {
        best = p;
        bestRatio = ratio;
      }
    }
    return bestRatio > 0 ? best.id : null;
  }, [packagesQuery.data]);

  const filteredTx = (transactionsQuery.data ?? []).filter((t) => txFilter === "all" || t.type === txFilter);

  if (!loading && !user) {
    return (
      <AppShell header={<PageHeader title="Wallet" />}>
        <TestModeBanner label="TEST COINS — NO REAL MONEY IS CHARGED" />
        <EmptyState
          className="mt-4"
          icon="🔒"
          title="Sign in to view your wallet"
          description="See your coins, diamonds and transaction history."
          action={
            <Link to="/auth" className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap">
              Sign in
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell header={<PageHeader title="Wallet" />}>
      <TestModeBanner label="TEST COINS — NO REAL MONEY IS CHARGED" />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl glass p-4">
          <p className="text-xs text-muted-foreground">Coins</p>
          <p className="coin-text text-2xl font-extrabold">{compact(wallet?.coins ?? 0)}</p>
        </div>
        <div className="rounded-3xl glass p-4">
          <p className="text-xs text-muted-foreground">Diamonds</p>
          <p className="text-2xl font-extrabold text-diamond">{compact(wallet?.diamonds ?? 0)}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface-2 p-3">
          <p className="text-[11px] text-muted-foreground">Total purchased</p>
          <p className="text-sm font-bold">{full(wallet?.total_coins_purchased ?? 0)}</p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-3">
          <p className="text-[11px] text-muted-foreground">Total spent</p>
          <p className="text-sm font-bold">{full(wallet?.total_coins_spent ?? 0)}</p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-3">
          <p className="text-[11px] text-muted-foreground">Diamonds earned</p>
          <p className="text-sm font-bold">{full(wallet?.total_diamonds_earned ?? 0)}</p>
        </div>
        <div className="rounded-2xl bg-surface-2 p-3">
          <p className="text-[11px] text-muted-foreground">Withdrawn</p>
          <p className="text-sm font-bold">{full(wallet?.total_withdrawn ?? 0)}</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-bold">Buy test coins</h2>
        {packagesQuery.isLoading && <CardSkeletonGrid count={4} />}
        {packagesQuery.isError && <ErrorState retry={() => void packagesQuery.refetch()} />}
        {!packagesQuery.isLoading && !packagesQuery.isError && (packagesQuery.data ?? []).length === 0 && (
          <EmptyState icon="🪙" title="No packages available" description="Coin packages will appear here soon." />
        )}
        {!packagesQuery.isLoading && (packagesQuery.data ?? []).length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {(packagesQuery.data ?? []).map((pkg) => (
              <CoinPackageCard key={pkg.id} pkg={pkg} isBestValue={pkg.id === bestValueId} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-bold">My coin requests</h2>
        {requestsQuery.isLoading && <RowSkeletonList count={3} />}
        {requestsQuery.isError && <ErrorState retry={() => void requestsQuery.refetch()} />}
        {!requestsQuery.isLoading && (requestsQuery.data ?? []).length === 0 && (
          <EmptyState icon="🧾" title="No requests yet" description="Buy a coin package to see your requests here." />
        )}
        {!requestsQuery.isLoading && (requestsQuery.data ?? []).length > 0 && (
          <div className="space-y-2">
            {(requestsQuery.data ?? []).map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-2xl glass p-3">
                <RequestProof ref={r.screenshot_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">
                      {full(r.coins)} coins · {r.display_price}
                    </p>
                    <StatusPill status={r.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">Ref: {r.payment_reference}</p>
                  {r.admin_note && <p className="mt-0.5 truncate text-xs text-warning">Note: {r.admin_note}</p>}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(r.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-base font-bold">Transaction history</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {TX_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTxFilter(f.value)}
              className={
                "rounded-full px-3 py-1.5 text-xs font-bold tap " +
                (txFilter === f.value ? "brand-gradient text-primary-foreground" : "bg-surface-2 text-muted-foreground")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        {transactionsQuery.isLoading && <RowSkeletonList count={5} />}
        {transactionsQuery.isError && <ErrorState retry={() => void transactionsQuery.refetch()} />}
        {!transactionsQuery.isLoading && filteredTx.length === 0 && (
          <EmptyState icon="📄" title="No transactions" description="Your coin activity will show up here." />
        )}
        {!transactionsQuery.isLoading && filteredTx.length > 0 && (
          <div className="space-y-2">
            {filteredTx.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
