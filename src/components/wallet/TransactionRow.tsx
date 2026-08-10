import { full, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CoinTransaction {
  id: string;
  type: "purchase" | "gift_sent" | "admin_credit" | "admin_debit" | "signup_bonus" | "refund";
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

const TYPE_LABEL: Record<CoinTransaction["type"], string> = {
  purchase: "Purchase",
  gift_sent: "Gift sent",
  admin_credit: "Admin credit",
  admin_debit: "Admin debit",
  signup_bonus: "Signup bonus",
  refund: "Refund",
};

const TYPE_BADGE: Record<CoinTransaction["type"], string> = {
  purchase: "bg-coin/15 text-coin",
  gift_sent: "bg-primary/15 text-primary",
  admin_credit: "bg-live/15 text-live",
  admin_debit: "bg-destructive/15 text-destructive",
  signup_bonus: "bg-diamond/15 text-diamond",
  refund: "bg-warning/15 text-warning",
};

export function TransactionRow({ tx }: { tx: CoinTransaction }) {
  const positive = tx.amount >= 0;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", TYPE_BADGE[tx.type])}>
            {TYPE_LABEL[tx.type]}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo(tx.created_at)}</span>
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">{tx.description}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("text-sm font-extrabold", positive ? "text-live" : "text-destructive")}>
          {positive ? "+" : ""}
          {full(tx.amount)}
        </p>
        <p className="text-xs text-muted-foreground">bal {full(tx.balance_after)}</p>
      </div>
    </div>
  );
}
