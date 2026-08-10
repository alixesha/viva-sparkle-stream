import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const LINKS: { to: string; label: string }[] = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/hosts", label: "Hosts" },
  { to: "/admin/applications", label: "Applications" },
  { to: "/admin/rooms", label: "Rooms" },
  { to: "/admin/coins", label: "Coin requests" },
  { to: "/admin/packages", label: "Packages" },
  { to: "/admin/gifts", label: "Gifts" },
  { to: "/admin/withdrawals", label: "Withdrawals" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/agencies", label: "Agencies" },
  { to: "/admin/transactions", label: "Transactions" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/logs", label: "Logs" },
];

export function AdminNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {LINKS.map((l) => {
        const active = l.to === "/admin" ? pathname === "/admin" : pathname.startsWith(l.to);
        return (
          <Link
            key={l.to}
            to={l.to}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold tap",
              active ? "brand-gradient text-primary-foreground" : "glass text-muted-foreground",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
