import { Link } from "@tanstack/react-router";
import { full } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonus_coins: number;
  display_price: string;
  sort_order: number;
  is_active: boolean;
}

export function CoinPackageCard({ pkg, isBestValue }: { pkg: CoinPackage; isBestValue?: boolean }) {
  return (
    <Link
      to="/wallet/buy/$packageId"
      params={{ packageId: pkg.id }}
      className={cn(
        "relative flex flex-col gap-2 rounded-3xl glass p-4 tap",
        isBestValue && "border border-coin/50 bg-coin/5",
      )}
    >
      {isBestValue && (
        <span className="absolute -top-2 right-3 rounded-full bg-coin px-2 py-0.5 text-[10px] font-bold text-coin-foreground">
          Best value
        </span>
      )}
      <p className="text-sm font-bold">{pkg.name}</p>
      <p className="coin-text text-xl font-extrabold">
        {full(pkg.coins)}
        {pkg.bonus_coins > 0 && <span className="ml-1 text-xs text-live">+{full(pkg.bonus_coins)} bonus</span>}
      </p>
      <p className="text-sm font-semibold text-muted-foreground">{pkg.display_price}</p>
      <span className="mt-1 rounded-full brand-gradient px-3 py-1.5 text-center text-xs font-bold text-primary-foreground">
        Buy (test)
      </span>
    </Link>
  );
}
