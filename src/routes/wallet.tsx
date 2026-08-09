import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, TestModeBanner } from "@/components/common/States";
import { useAuth } from "@/hooks/useAuth";
import { compact } from "@/lib/format";

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

function WalletPage() {
  const { wallet } = useAuth();
  return (
    <AppShell header={<PageHeader title="Wallet" />}>
      <TestModeBanner />
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
      <EmptyState className="mt-4" icon="🧾" title="No transactions yet" description="Coin packages and history land in the next pass." />
    </AppShell>
  );
}