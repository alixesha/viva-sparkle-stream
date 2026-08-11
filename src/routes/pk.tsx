import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, RowSkeletonList } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { supabase } from "@/integrations/supabase/client";
import { clock, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HostProfile, PkBattle } from "@/components/live/live-types";

export const Route = createFileRoute("/pk")({
  head: () => ({
    meta: [
      { title: "PK Battles — VIVA LIVE" },
      { name: "description", content: "Invite hosts to head-to-head PK battles, track live scores and view your battle history on VIVA LIVE." },
      { property: "og:title", content: "PK Battles — VIVA LIVE" },
      { property: "og:description", content: "Challenge hosts, watch live PK scores and review your battle history." },
    ],
  }),
  component: PkPage,
});

type Tab = "invites" | "active" | "history";

const TABS: { value: Tab; label: string }[] = [
  { value: "invites", label: "Invites" },
  { value: "active", label: "Active" },
  { value: "history", label: "History" },
];

function useCountdown(endsAt: string | null | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return 0;
  return Math.max(0, Math.floor((new Date(endsAt).getTime() - now) / 1000));
}

function BattleScoreBar({ battle, myHostId, hostA, hostB }: { battle: PkBattle; myHostId: string; hostA: HostProfile | null; hostB: HostProfile | null }) {
  const secondsLeft = useCountdown(battle.ends_at);
  const total = Math.max(1, battle.score_a + battle.score_b);
  const pctA = Math.round((battle.score_a / total) * 100);
  return (
    <div className="rounded-2xl glass p-3">
      <div className="flex items-center gap-2">
        <UserAvatar src={hostA?.avatar_url} name={hostA?.display_name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="relative h-3 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-live transition-all" style={{ width: `${pctA}%` }} />
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
              {battle.score_a} · {battle.score_b}
            </div>
          </div>
        </div>
        <UserAvatar src={hostB?.avatar_url} name={hostB?.display_name} size="sm" />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <p className="min-w-0 flex-1 truncate">
          {hostA?.display_name ?? "Host"} <span className="opacity-60">vs</span> {hostB?.display_name ?? "Host"}
        </p>
        <span className="shrink-0 font-bold text-live">{clock(secondsLeft)}</span>
      </div>
    </div>
  );
}

function InviteRow({
  battle,
  profile,
  onAccept,
  onDecline,
  busy,
}: {
  battle: PkBattle;
  profile: HostProfile | null;
  onAccept: () => void;
  onDecline: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl glass px-3 py-2">
      <UserAvatar src={profile?.avatar_url} name={profile?.display_name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{profile?.display_name ?? "Host"}</p>
        <p className="text-[11px] text-muted-foreground">invited you to a PK battle · {clock(battle.duration_seconds)}</p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <button type="button" disabled={busy} onClick={onAccept} className="rounded-full brand-gradient px-3 py-1.5 text-[11px] font-bold text-primary-foreground tap disabled:opacity-50">
          Accept
        </button>
        <button type="button" disabled={busy} onClick={onDecline} className="rounded-full glass px-3 py-1.5 text-[11px] font-bold tap disabled:opacity-50">
          Decline
        </button>
      </div>
    </div>
  );
}

function HistoryRow({ battle, myHostId, profile }: { battle: PkBattle; myHostId: string; profile: HostProfile | null }) {
  const won = battle.status === "finished" && battle.winner_id === myHostId;
  const lost = battle.status === "finished" && battle.winner_id && battle.winner_id !== myHostId;
  return (
    <div className="flex items-center gap-2 rounded-2xl glass px-3 py-2">
      <UserAvatar src={profile?.avatar_url} name={profile?.display_name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">vs {profile?.display_name ?? "Host"}</p>
        <p className="text-[11px] text-muted-foreground">{timeAgo(battle.created_at)} · {battle.score_a} - {battle.score_b}</p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
          won && "bg-live/15 text-live",
          lost && "bg-secondary text-muted-foreground",
          !won && !lost && "bg-secondary text-muted-foreground",
        )}
      >
        {battle.status === "finished" ? (won ? "Won" : lost ? "Lost" : "Tie") : battle.status === "declined" ? "Declined" : "Cancelled"}
      </span>
    </div>
  );
}

function PkPage() {
  const { session, isHost, profile } = useAuth();
  const myId = session?.user.id;
  const [tab, setTab] = useState<Tab>("invites");
  const [battles, setBattles] = useState<PkBattle[]>([]);
  const [profiles, setProfiles] = useState<Record<string, HostProfile>>({});
  const [myLiveRoomId, setMyLiveRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [inviteUsername, setInviteUsername] = useState("");
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    if (!myId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("pk_battles")
      .select("*")
      .or(`host_a.eq.${myId},host_b.eq.${myId}`)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Could not load PK battles");
      setLoading(false);
      return;
    }
    const list = (data ?? []) as PkBattle[];
    setBattles(list);
    const ids = new Set<string>();
    for (const b of list) {
      ids.add(b.host_a);
      ids.add(b.host_b);
    }
    if (ids.size > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, level, followers_count")
        .in("id", Array.from(ids));
      const map: Record<string, HostProfile> = {};
      for (const p of profs ?? []) map[p.id] = p as HostProfile;
      setProfiles(map);
    }
    const { data: room } = await supabase
      .from("live_rooms")
      .select("id")
      .eq("host_id", myId)
      .eq("status", "live")
      .maybeSingle();
    setMyLiveRoomId(room?.id ?? null);
    setLoading(false);
  }, [myId]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtime("pk-battles-hub", "pk_battles", undefined, () => void load(), Boolean(myId));

  const invites = useMemo(
    () => battles.filter((b) => b.host_b === myId && b.status === "invited"),
    [battles, myId],
  );
  const active = useMemo(
    () => battles.filter((b) => b.status === "active" && (b.host_a === myId || b.host_b === myId)),
    [battles, myId],
  );
  const history = useMemo(
    () =>
      battles.filter(
        (b) => ["finished", "declined", "cancelled"].includes(b.status) && (b.host_a === myId || b.host_b === myId),
      ),
    [battles, myId],
  );

  const respond = async (battle: PkBattle, accept: boolean) => {
    setBusyId(battle.id);
    try {
      if (accept) {
        const endsAt = new Date(Date.now() + battle.duration_seconds * 1000).toISOString();
        const { error } = await supabase
          .from("pk_battles")
          .update({ status: "active", started_at: new Date().toISOString(), ends_at: endsAt })
          .eq("id", battle.id);
        if (error) throw error;
        toast.success("PK battle started!");
      } else {
        const { error } = await supabase.from("pk_battles").update({ status: "declined" }).eq("id", battle.id);
        if (error) throw error;
        toast.success("Invite declined");
      }
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  const sendInvite = async () => {
    if (!myId || !inviteUsername.trim()) return;
    setInviting(true);
    try {
      const username = inviteUsername.trim().replace(/^@/, "");
      const { data: target, error: profErr } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, level, followers_count")
        .ilike("username", username)
        .maybeSingle();
      if (profErr) throw profErr;
      if (!target) {
        toast.error("No user found with that username");
        return;
      }
      if (target.id === myId) {
        toast.error("You can't invite yourself");
        return;
      }
      const { data: hostRow, error: hostErr } = await supabase
        .from("hosts")
        .select("user_id, status")
        .eq("user_id", target.id)
        .eq("status", "active")
        .maybeSingle();
      if (hostErr) throw hostErr;
      if (!hostRow) {
        toast.error(`${target.display_name} is not an active host`);
        return;
      }
      const { error } = await supabase.from("pk_battles").insert({
        host_a: myId,
        host_b: target.id,
        status: "invited",
        duration_seconds: 300,
      });
      if (error) throw error;
      toast.success(`PK invite sent to ${target.display_name}`);
      setInviteUsername("");
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send invite");
    } finally {
      setInviting(false);
    }
  };

  if (!myId) {
    return (
      <AppShell header={<PageHeader title="PK battles" />}>
        <EmptyState
          icon="⚔️"
          title="Sign in to view PK battles"
          description="Sign in to challenge hosts and track your PK battles."
          action={
            <Link to="/auth" className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap">
              Sign in
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell header={<PageHeader title="PK battles" />}>
      <div className="space-y-4">
        {isHost && (
          <div className="rounded-2xl glass p-3">
            <p className="mb-2 text-sm font-bold">Challenge a host</p>
            <div className="flex gap-2">
              <input
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="@username"
                className="min-w-0 flex-1 rounded-full bg-secondary px-3 py-2 text-sm outline-none"
              />
              <button
                type="button"
                disabled={inviting || !inviteUsername.trim()}
                onClick={() => void sendInvite()}
                className="shrink-0 rounded-full brand-gradient px-4 py-2 text-xs font-bold text-primary-foreground tap disabled:opacity-50"
              >
                Invite
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-1.5 rounded-full glass p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-xs font-bold tap",
                tab === t.value ? "brand-gradient text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t.label}
              {t.value === "invites" && invites.length > 0 && (
                <span className="ml-1 text-[10px]">({invites.length})</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <RowSkeletonList count={4} />
        ) : tab === "invites" ? (
          invites.length === 0 ? (
            <EmptyState icon="📨" title="No invites" description="PK battle invites from other hosts will show up here." />
          ) : (
            <div className="space-y-2">
              {invites.map((b) => (
                <InviteRow
                  key={b.id}
                  battle={b}
                  profile={profiles[b.host_a] ?? null}
                  busy={busyId === b.id}
                  onAccept={() => void respond(b, true)}
                  onDecline={() => void respond(b, false)}
                />
              ))}
            </div>
          )
        ) : tab === "active" ? (
          active.length === 0 ? (
            <EmptyState icon="⚔️" title="No active battles" description="Active PK battles you're part of will appear here." />
          ) : (
            <div className="space-y-3">
              {active.map((b) => (
                <div key={b.id} className="space-y-2">
                  <BattleScoreBar battle={b} myHostId={myId} hostA={profiles[b.host_a] ?? null} hostB={profiles[b.host_b] ?? null} />
                  {myLiveRoomId && (b.host_a === myId || b.host_b === myId) && (
                    <Link
                      to="/room/$roomId"
                      params={{ roomId: myLiveRoomId }}
                      className="block rounded-xl brand-gradient py-2 text-center text-xs font-bold text-primary-foreground tap"
                    >
                      Go to my live room
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )
        ) : history.length === 0 ? (
          <EmptyState icon="🗂️" title="No history yet" description="Finished, declined or cancelled battles will show up here." />
        ) : (
          <div className="space-y-2">
            {history.map((b) => {
              const opponentId = b.host_a === myId ? b.host_b : b.host_a;
              return <HistoryRow key={b.id} battle={b} myHostId={myId} profile={profiles[opponentId] ?? null} />;
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
