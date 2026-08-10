import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { follow, unfollow, isFollowing } from "@/lib/social";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HostProfile } from "./live-types";

export function RoomHeader({
  host,
  viewerCount,
  currentUserId,
  isHost,
  onClose,
}: {
  host: HostProfile;
  viewerCount: number;
  currentUserId: string | undefined;
  isHost: boolean;
  onClose: () => void;
}) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!currentUserId || currentUserId === host.id) return;
    void isFollowing(currentUserId, host.id).then((v) => alive && setFollowing(v));
    return () => {
      alive = false;
    };
  }, [currentUserId, host.id]);

  const toggleFollow = async () => {
    if (!currentUserId || busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next);
    try {
      if (next) await follow(currentUserId, host.id);
      else await unfollow(currentUserId, host.id);
    } catch {
      setFollowing(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pointer-events-auto flex items-center gap-2 p-3">
      <Link to="/profile" className="flex min-w-0 items-center gap-2 rounded-full glass-strong py-1 pl-1 pr-3 tap">
        <UserAvatar src={host.avatar_url} name={host.display_name} size="sm" ring />
        <span className="min-w-0 text-left">
          <span className="block truncate text-xs font-bold leading-tight">{host.display_name}</span>
          <span className="block text-[10px] text-muted-foreground">
            Lv.{host.level} · {compact(host.followers_count)} followers
          </span>
        </span>
      </Link>

      {!isHost && currentUserId && currentUserId !== host.id && (
        <button
          type="button"
          onClick={() => void toggleFollow()}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold tap",
            following ? "glass" : "brand-gradient text-primary-foreground",
          )}
        >
          {following ? "Following" : "Follow"}
        </button>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-live/90 px-2.5 py-1 text-[10px] font-bold uppercase text-primary-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" /> Live
        </span>
        <span className="rounded-full glass-strong px-2.5 py-1 text-[10px] font-bold">
          👁 {compact(viewerCount)}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Leave room"
          className="grid size-8 place-items-center rounded-full glass-strong tap"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
