import { Link } from "@tanstack/react-router";
import { UserAvatar } from "@/components/common/UserAvatar";

export interface HostCardData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  is_online?: boolean;
}

export function HostCard({ host }: { host: HostCardData }) {
  return (
    <Link
      to="/u/$username"
      params={{ username: host.username }}
      className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl glass px-3 py-3 tap"
    >
      <div className="relative">
        <UserAvatar src={host.avatar_url} name={host.display_name} size="lg" />
        {host.is_online && (
          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-live" />
        )}
      </div>
      <p className="max-w-20 truncate text-xs font-semibold">{host.display_name}</p>
      <p className="text-[10px] text-muted-foreground">Lv.{host.level}</p>
    </Link>
  );
}
