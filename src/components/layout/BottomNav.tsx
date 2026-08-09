import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Home, MessageCircle, Radio, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/go-live", label: "Go Live", icon: Radio, center: true },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg px-3 pb-[env(safe-area-inset-bottom)]">
      <div className="mb-2 flex items-end justify-between gap-1 rounded-3xl glass-strong px-2 py-2">
        {items.map(({ to, label, icon: Icon, ...rest }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          const center = "center" in rest && rest.center;
          if (center) {
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className="relative -mt-6 grid size-14 shrink-0 place-items-center rounded-full brand-gradient neon-ring tap"
              >
                <Icon className="size-6 text-primary-foreground" strokeWidth={2.4} />
              </Link>
            );
          }
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold tap",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("size-5", active && "drop-shadow-[0_0_10px_currentColor]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}