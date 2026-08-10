import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/common/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { clock } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HostProfile, PkBattle } from "./live-types";

interface Opponent {
  profile: HostProfile | null;
  roomId: string | null;
}

function useActivePkBattle(roomId: string) {
  const [battle, setBattle] = useState<PkBattle | null | undefined>(undefined);

  const load = async () => {
    const { data } = await supabase
      .from("pk_battles")
      .select("*")
      .or(`room_a.eq.${roomId},room_b.eq.${roomId}`)
      .in("status", ["invited", "active", "finished"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setBattle(data ?? null);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useRealtime(`pk-room-a-${roomId}`, "pk_battles", `room_a=eq.${roomId}`, () => void load());
  useRealtime(`pk-room-b-${roomId}`, "pk_battles", `room_b=eq.${roomId}`, () => void load());

  return { battle, reload: load };
}

export function PkOverlay({
  roomId,
  hostId,
  currentUserId,
  isHost,
}: {
  roomId: string;
  hostId: string;
  currentUserId: string | undefined;
  isHost: boolean;
}) {
  const { battle, reload } = useActivePkBattle(roomId);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!battle) {
      setOpponent(null);
      return;
    }
    const myIsA = battle.room_a === roomId;
    const opponentHostId = myIsA ? battle.host_b : battle.host_a;
    const opponentRoomId = myIsA ? battle.room_b : battle.room_a;
    let alive = true;
    void supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, level, followers_count")
      .eq("id", opponentHostId)
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setOpponent({ profile: (data as HostProfile) ?? null, roomId: opponentRoomId });
      });
    return () => {
      alive = false;
    };
  }, [battle, roomId]);

  const iAmInvitedHost = battle?.status === "invited" && battle.host_b === currentUserId;

  const respond = async (accept: boolean) => {
    if (!battle) return;
    if (accept) {
      const endsAt = new Date(Date.now() + battle.duration_seconds * 1000).toISOString();
      const { error } = await supabase
        .from("pk_battles")
        .update({ status: "active", started_at: new Date().toISOString(), ends_at: endsAt })
        .eq("id", battle.id);
      if (error) toast.error("Could not accept battle");
      else toast.success("PK battle started!");
    } else {
      const { error } = await supabase.from("pk_battles").update({ status: "declined" }).eq("id", battle.id);
      if (error) toast.error("Could not decline");
    }
    void reload();
  };

  if (!battle || battle.status === "declined") return null;

  const total = Math.max(1, battle.score_a + battle.score_b);
  const pctA = Math.round((battle.score_a / total) * 100);
  const myScore = battle.room_a === roomId ? battle.score_a : battle.score_b;
  const oppScore = battle.room_a === roomId ? battle.score_b : battle.score_a;
  const secondsLeft = battle.ends_at ? Math.max(0, Math.floor((new Date(battle.ends_at).getTime() - now) / 1000)) : 0;
  const winnerIsMe = battle.status === "finished" && battle.winner_id === hostId;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-20 px-3">
      {iAmInvitedHost && (
        <div className="pointer-events-auto mb-2 flex items-center justify-between gap-2 rounded-2xl glass-strong px-3 py-2">
          <p className="text-xs font-semibold">⚔️ PK invite from {opponent?.profile?.display_name ?? "a host"}</p>
          <div className="flex shrink-0 gap-1.5">
            <button type="button" onClick={() => void respond(true)} className="rounded-full brand-gradient px-3 py-1 text-[11px] font-bold text-primary-foreground tap">
              Accept
            </button>
            <button type="button" onClick={() => void respond(false)} className="rounded-full glass px-3 py-1 text-[11px] font-bold tap">
              Decline
            </button>
          </div>
        </div>
      )}

      {(battle.status === "active" || battle.status === "finished") && (
        <div className="pointer-events-auto rounded-2xl glass-strong p-2">
          <div className="flex items-center gap-2">
            <UserAvatar name="Me" size="xs" />
            <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-live transition-all" style={{ width: `${pctA}%` }} />
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
                {battle.score_a} · {battle.score_b}
              </div>
            </div>
            <UserAvatar src={opponent?.profile?.avatar_url} name={opponent?.profile?.display_name} size="xs" />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>You: {myScore} · Opponent: {oppScore}</span>
            {battle.status === "active" ? <span className="font-bold">{clock(secondsLeft)}</span> : <span>Finished</span>}
          </div>
          {battle.status === "finished" && (
            <div className={cn("mt-2 animate-pop rounded-xl brand-gradient py-2 text-center text-xs font-bold text-primary-foreground")}>
              {battle.winner_id ? (winnerIsMe ? "🏆 You won the PK battle!" : `🏆 ${opponent?.profile?.display_name ?? "Opponent"} won the PK battle!`) : "🤝 PK battle ended in a tie"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PkInviteDialog({
  open,
  onOpenChange,
  roomId,
  myHostId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roomId: string;
  myHostId: string;
}) {
  const [candidates, setCandidates] = useState<{ room: { id: string; host_id: string }; profile: HostProfile }[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    void supabase
      .from("live_rooms")
      .select("id, host_id")
      .eq("status", "live")
      .neq("host_id", myHostId)
      .then(async ({ data: rooms }) => {
        const list = rooms ?? [];
        if (list.length === 0) {
          if (alive) {
            setCandidates([]);
            setLoading(false);
          }
          return;
        }
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, level, followers_count")
          .in("id", list.map((r) => r.host_id));
        const map = new Map((profiles ?? []).map((p) => [p.id, p as HostProfile]));
        if (!alive) return;
        setCandidates(
          list
            .filter((r) => map.has(r.host_id))
            .map((r) => ({ room: r, profile: map.get(r.host_id)! })),
        );
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, myHostId]);

  const invite = async (theirRoomId: string, theirHostId: string) => {
    setInviting(theirHostId);
    try {
      const { error } = await supabase.from("pk_battles").insert({
        host_a: myHostId,
        host_b: theirHostId,
        room_a: roomId,
        room_b: theirRoomId,
        status: "invited",
        duration_seconds: 300,
      });
      if (error) throw error;
      toast.success("PK invite sent");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send invite");
    } finally {
      setInviting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>Invite to PK battle</DialogTitle>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading live hosts…</p>
          ) : candidates.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No other hosts are live right now.</p>
          ) : (
            candidates.map((c) => (
              <div key={c.room.id} className="flex items-center gap-2 rounded-2xl glass px-3 py-2">
                <UserAvatar src={c.profile.avatar_url} name={c.profile.display_name} size="sm" />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{c.profile.display_name}</p>
                <button
                  type="button"
                  disabled={inviting === c.profile.id}
                  onClick={() => void invite(c.room.id, c.profile.id)}
                  className="shrink-0 rounded-full brand-gradient px-3 py-1.5 text-[11px] font-bold text-primary-foreground tap disabled:opacity-50"
                >
                  Invite
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
