import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Gift, Heart, MessageCircle, Share2, Flag, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { EmptyState, ErrorState } from "@/components/common/States";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoStage } from "@/components/live/VideoStage";
import { RoomHeader } from "@/components/live/RoomHeader";
import { RoomChat } from "@/components/live/RoomChat";
import { GiftPanel } from "@/components/live/GiftPanel";
import { ViewerListSheet } from "@/components/live/ViewerListSheet";
import { HostControls } from "@/components/live/HostControls";
import { PkOverlay, PkInviteDialog } from "@/components/live/PkOverlay";
import { GiftAnimationLayer, giftSounds, type GiftEvent } from "@/components/gifts/GiftAnimation";
import { readGiftMeta, type HostProfile, type LiveMessage, type LiveRoom } from "@/components/live/live-types";
import { streamingService, type StreamSession } from "@/lib/streaming";
import { reportContent, shareLink } from "@/lib/social";
import { compact } from "@/lib/format";
import { REPORT_CATEGORIES } from "@/lib/format";

export const Route = createFileRoute("/room/$roomId")({
  head: () => ({
    meta: [
      { title: "Live room — VIVA LIVE" },
      { name: "description", content: "Join the live room, chat in realtime and send animated test gifts." },
      { property: "og:title", content: "Live room — VIVA LIVE" },
      { property: "og:description", content: "Join the live room and send animated test gifts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [room, setRoom] = useState<LiveRoom | null | undefined>(undefined);
  const [host, setHost] = useState<HostProfile | null>(null);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [giftQueue, setGiftQueue] = useState<GiftEvent[]>([]);
  const [liked, setLiked] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [pkInviteOpen, setPkInviteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [session, setSession] = useState<StreamSession | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const seenGifts = useRef(new Set<string>());

  const isHost = Boolean(user && room && user.id === room.host_id);

  const loadRoom = useCallback(async () => {
    const { data } = await supabase.from("live_rooms").select("*").eq("id", roomId).maybeSingle();
    setRoom(data ?? null);
    if (data) {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, level, followers_count")
        .eq("id", data.host_id)
        .maybeSingle();
      setHost(p ?? null);
    }
  }, [roomId]);

  useEffect(() => {
    void loadRoom();
  }, [loadRoom]);

  // Initial chat history
  useEffect(() => {
    let alive = true;
    void supabase
      .from("live_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(150)
      .then(({ data }) => {
        if (!alive) return;
        const list = data ?? [];
        for (const m of list) if (m.kind === "gift") seenGifts.current.add(m.id);
        setMessages(list);
      });
    return () => {
      alive = false;
    };
  }, [roomId]);

  // Realtime chat + gift animations
  useRealtime(`room-messages-${roomId}`, "live_messages", `room_id=eq.${roomId}`, (payload) => {
    const row = payload.new as LiveMessage | null;
    if (!row) return;
    setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row].slice(-200)));
    if (row.kind === "gift" && !seenGifts.current.has(row.id)) {
      seenGifts.current.add(row.id);
      const meta = readGiftMeta(row.meta);
      setGiftQueue((q) => [
        ...q,
        {
          id: row.id,
          giftName: meta.gift_name ?? "Gift",
          icon: meta.icon ?? "🎁",
          animationKey: meta.animation_key ?? "star",
          animationUrl: meta.animation_url ?? null,
          soundKey: meta.sound_key ?? meta.animation_key ?? null,
          soundUrl: meta.sound_url ?? null,
          durationMs: meta.duration_ms ?? null,
          tier: meta.tier ?? "basic",
          quantity: meta.quantity ?? 1,
          senderName: row.username,
          senderAvatar: row.avatar_url,
          receiverName: host?.display_name ?? "Host",
        },
      ]);
    }
  });

  // Realtime room stats (viewers, likes, diamonds, status)
  useRealtime(`room-row-${roomId}`, "live_rooms", `id=eq.${roomId}`, (payload) => {
    const row = payload.new as LiveRoom | null;
    if (row) setRoom(row);
  });

  // Join / leave presence
  useEffect(() => {
    if (!user || !room || room.host_id === user.id) return;
    let cancelled = false;
    void (async () => {
      await supabase.from("live_participants").insert({ room_id: roomId, user_id: user.id });
      if (cancelled) return;
      await supabase
        .from("live_rooms")
        .update({ viewer_count: (room.viewer_count ?? 0) + 1 })
        .eq("id", roomId);
      await supabase.from("live_messages").insert({
        room_id: roomId,
        user_id: user.id,
        username: profile?.display_name ?? profile?.username ?? "Someone",
        avatar_url: profile?.avatar_url ?? null,
        body: "joined the room",
        kind: "join",
      });
    })();
    return () => {
      cancelled = true;
      void supabase
        .from("live_participants")
        .update({ left_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .is("left_at", null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, room?.id]);

  const sendMessage = async (body: string) => {
    if (!user) return;
    const { error } = await supabase.from("live_messages").insert({
      room_id: roomId,
      user_id: user.id,
      username: profile?.display_name ?? profile?.username ?? "Guest",
      avatar_url: profile?.avatar_url ?? null,
      body,
      kind: "chat",
      is_host: isHost,
    });
    if (error) toast.error(error.message);
  };

  const like = async () => {
    if (!room || liked) return;
    setLiked(true);
    await supabase
      .from("live_rooms")
      .update({ likes_count: (room.likes_count ?? 0) + 1 })
      .eq("id", roomId);
  };

  const endLive = async () => {
    await supabase
      .from("live_rooms")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", roomId);
    await streamingService.disconnect(session);
    toast.success("Live ended");
    void navigate({ to: "/host" });
  };

  const report = async () => {
    if (!user || !room) return;
    await reportContent({
      reporterId: user.id,
      targetUserId: room.host_id,
      targetRoomId: room.id,
      category: REPORT_CATEGORIES[0] ?? "other",
      details: "Reported from live room",
    });
    toast.success("Report sent to moderators");
  };

  if (room === undefined) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-md space-y-3 p-4">
        <Skeleton className="aspect-[9/16] w-full rounded-3xl bg-surface-2" />
        <Skeleton className="h-10 w-full rounded-full bg-surface-2" />
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-md p-4">
        <ErrorState message="This room no longer exists." />
      </div>
    );
  }

  const ended = room.status === "ended";

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md overflow-hidden bg-background">
      <div className="relative">
        <VideoStage room={room} isHost={isHost} onSession={setSession} />
        <GiftAnimationLayer
          queue={giftQueue}
          onConsume={(ids) => setGiftQueue((q) => q.filter((g) => !ids.includes(g.id)))}
        />

        <div className="absolute inset-x-0 top-0 z-20">
          {host && (
            <RoomHeader
              host={host}
              viewerCount={room.viewer_count}
              currentUserId={user?.id}
              isHost={isHost}
              onClose={() => void navigate({ to: "/" })}
            />
          )}
          <div className="px-3 pt-1">
            <PkOverlay roomId={roomId} hostId={room.host_id} currentUserId={user?.id} isHost={isHost} />
          </div>
        </div>

        <div className="absolute right-2 top-1/3 z-20 flex flex-col items-center gap-2.5">
          <ActionButton label="Like" onClick={() => void like()} active={liked} count={room.likes_count}>
            <Heart className={liked ? "size-5 fill-current" : "size-5"} />
          </ActionButton>
          <ActionButton label="Gifts" onClick={() => setGiftOpen(true)}>
            <Gift className="size-5" />
          </ActionButton>
          <ActionButton label="Viewers" onClick={() => setViewersOpen(true)} count={room.viewer_count}>
            <Users className="size-5" />
          </ActionButton>
          <ActionButton label="Chat" onClick={() => setChatOpen((v) => !v)}>
            <MessageCircle className="size-5" />
          </ActionButton>
          <ActionButton
            label="Share"
            onClick={() => void shareLink(window.location.href, `${host?.display_name ?? "Host"} is live on VIVA LIVE`)}
          >
            <Share2 className="size-5" />
          </ActionButton>
          {!isHost && (
            <ActionButton label="Report" onClick={() => void report()}>
              <Flag className="size-5" />
            </ActionButton>
          )}
        </div>

        <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 rounded-full glass-strong px-2.5 py-1 text-[11px] font-bold">
          <span className="text-diamond">💎 {compact(room.diamonds_earned)}</span>
          <span className="text-muted-foreground">TEST</span>
        </div>
      </div>

      {ended && (
        <EmptyState
          className="mx-3 mt-3"
          icon="🏁"
          title="This live has ended"
          description="Explore other rooms to keep the party going."
        />
      )}

      {isHost && !ended && (
        <HostControls
          cameraOn={cameraOn}
          micOn={micOn}
          onToggleCamera={() => {
            const next = !cameraOn;
            setCameraOn(next);
            void streamingService.setCameraEnabled(session, next);
          }}
          onToggleMic={() => {
            const next = !micOn;
            setMicOn(next);
            void streamingService.setMicrophoneEnabled(session, next);
          }}
          onSwitchCamera={() => void streamingService.switchCamera(session).then(setSession)}
          onOpenViewers={() => setViewersOpen(true)}
          onOpenPk={() => setPkInviteOpen(true)}
          onEndLive={() => void endLive()}
        />
      )}

      {chatOpen && (
        <div className="h-[38dvh] border-t border-border/40">
          <RoomChat
            messages={messages}
            canChat={Boolean(user) && !ended}
            disabledReason={ended ? "This live has ended" : "Sign in to chat"}
            onSend={sendMessage}
          />
        </div>
      )}

      <GiftPanel open={giftOpen} onOpenChange={setGiftOpen} roomId={roomId} receiverId={room.host_id} />
      <ViewerListSheet
        open={viewersOpen}
        onOpenChange={setViewersOpen}
        roomId={roomId}
        isHost={isHost}
        hostUserId={room.host_id}
      />
      {isHost && (
        <PkInviteDialog open={pkInviteOpen} onOpenChange={setPkInviteOpen} roomId={roomId} myHostId={room.host_id} />
      )}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  children,
  count,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex flex-col items-center gap-0.5 tap"
    >
      <span
        className={
          active
            ? "grid size-10 place-items-center rounded-full bg-accent text-accent-foreground"
            : "grid size-10 place-items-center rounded-full glass-strong"
        }
      >
        {children}
      </span>
      {count !== undefined && <span className="text-[10px] font-bold">{compact(count)}</span>}
    </button>
  );
}