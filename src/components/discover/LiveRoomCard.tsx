import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { resolveMedia } from "@/lib/media";
import { compact } from "@/lib/format";

export interface LiveRoomCardData {
  id: string;
  title: string;
  category: string;
  viewer_count: number;
  likes_count: number;
  diamonds_earned: number;
  thumbnail_url: string | null;
  country: string;
  language: string;
  created_at: string;
  host_id: string;
  profiles: { username: string; display_name: string; avatar_url: string | null } | null;
}

export function LiveRoomCard({ room }: { room: LiveRoomCardData }) {
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void resolveMedia(room.thumbnail_url).then((u) => {
      if (alive) setThumb(u);
    });
    return () => {
      alive = false;
    };
  }, [room.thumbnail_url]);

  return (
    <Link
      to="/room/$roomId"
      params={{ roomId: room.id }}
      className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl bg-surface-2 tap"
    >
      {thumb ? (
        <img src={thumb} alt={room.title} className="absolute inset-0 size-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-surface-2 text-3xl">🎥</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-live px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
        <span className="size-1.5 animate-pulse rounded-full bg-primary-foreground" /> Live
      </span>
      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-bold">
        <Eye className="size-3" /> {compact(room.viewer_count)}
      </span>
      <div className="relative z-10 p-2.5">
        <p className="truncate text-sm font-bold">{room.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {room.profiles?.display_name ?? room.profiles?.username ?? "Host"} · {room.category}
        </p>
      </div>
    </Link>
  );
}
