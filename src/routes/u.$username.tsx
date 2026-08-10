import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle, Share2, ShieldAlert, ShieldOff, UserPlus, UserMinus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, RowSkeletonList } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LiveRoomCard, type LiveRoomCardData } from "@/components/discover/LiveRoomCard";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { compact, full, timeAgo, REPORT_CATEGORIES } from "@/lib/format";
import { follow, unfollow, isFollowing, blockUser, unblockUser, isBlocked, reportContent, shareLink } from "@/lib/social";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — VIVA LIVE` },
      { name: "description", content: `View ${params.username}'s profile on VIVA LIVE.` },
      { property: "og:title", content: `@${params.username} — VIVA LIVE` },
      { property: "og:description", content: `View ${params.username}'s profile on VIVA LIVE.` },
    ],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { username } = useParams({ from: "/u/$username" });
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<string>(REPORT_CATEGORIES[0] ?? "Other");
  const [reportDetails, setReportDetails] = useState("");

  const profileQuery = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const profile = profileQuery.data;
  const isSelf = user?.id === profile?.id;

  const hostQuery = useQuery({
    queryKey: ["public-profile-host", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("hosts")
        .select("status")
        .eq("user_id", profile!.id)
        .maybeSingle();
      return data;
    },
  });

  const roomsQuery = useQuery({
    queryKey: ["public-profile-rooms", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const select =
        "id, title, category, viewer_count, likes_count, diamonds_earned, thumbnail_url, country, language, created_at, host_id, profiles:host_id(username, display_name, avatar_url)";
      const [liveRes, endedRes] = await Promise.all([
        supabase.from("live_rooms").select(select).eq("host_id", profile!.id).eq("status", "live").maybeSingle(),
        supabase
          .from("live_rooms")
          .select(select)
          .eq("host_id", profile!.id)
          .eq("status", "ended")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      return {
        live: (liveRes.data as unknown as LiveRoomCardData) ?? null,
        ended: (endedRes.data as unknown as LiveRoomCardData[]) ?? [],
      };
    },
  });

  const followQuery = useQuery({
    queryKey: ["public-profile-following", user?.id, profile?.id],
    enabled: Boolean(user?.id && profile?.id && !isSelf),
    queryFn: () => isFollowing(user!.id, profile!.id),
  });

  const blockQuery = useQuery({
    queryKey: ["public-profile-blocked", user?.id, profile?.id],
    enabled: Boolean(user?.id && profile?.id && !isSelf),
    queryFn: () => isBlocked(user!.id, profile!.id),
  });

  if (profileQuery.isLoading) {
    return (
      <AppShell header={<PageHeader title="Profile" />}>
        <RowSkeletonList count={6} />
      </AppShell>
    );
  }

  if (profileQuery.isError) {
    return (
      <AppShell header={<PageHeader title="Profile" />}>
        <ErrorState retry={() => void profileQuery.refetch()} />
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell header={<PageHeader title="Profile" />}>
        <EmptyState icon="🙈" title="User not found" description="This profile doesn't exist or was removed." />
      </AppShell>
    );
  }

  const nextLevel = 100 * profile.level * profile.level;
  const xpPct = nextLevel > 0 ? Math.min(100, (profile.xp / nextLevel) * 100) : 0;
  const isActiveHost = hostQuery.data?.status === "active";

  async function toggleFollow() {
    if (!user) return;
    const wasFollowing = Boolean(followQuery.data);
    queryClient.setQueryData(["public-profile-following", user.id, profile!.id], !wasFollowing);
    try {
      if (wasFollowing) {
        await unfollow(user.id, profile!.id);
        toast.success(`Unfollowed @${profile!.username}`);
      } else {
        await follow(user.id, profile!.id);
        toast.success(`Following @${profile!.username}`);
      }
      void queryClient.invalidateQueries({ queryKey: ["public-profile", username] });
      void queryClient.invalidateQueries({ queryKey: ["public-profile-following"] });
    } catch (e) {
      queryClient.setQueryData(["public-profile-following", user.id, profile!.id], wasFollowing);
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function toggleBlock() {
    if (!user) return;
    const wasBlocked = Boolean(blockQuery.data);
    try {
      if (wasBlocked) {
        await unblockUser(user.id, profile!.id);
        toast.success("Unblocked");
      } else {
        await blockUser(user.id, profile!.id);
        toast.success("Blocked");
      }
      void queryClient.invalidateQueries({ queryKey: ["public-profile-blocked"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function submitReport() {
    if (!user) return;
    try {
      await reportContent({
        reporterId: user.id,
        targetUserId: profile!.id,
        category: reportCategory,
        details: reportDetails,
      });
      toast.success("Report submitted");
      setReportOpen(false);
      setReportDetails("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit report");
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/u/${profile!.username}`;
    const result = await shareLink(url, profile!.display_name);
    if (result === "copied") toast.success("Link copied to clipboard");
  }

  return (
    <AppShell header={<PageHeader title={`@${profile.username}`} />}>
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 rounded-3xl glass p-6 text-center">
          <UserAvatar size="xl" src={profile.avatar_url} name={profile.display_name} ring />
          <div>
            <p className="text-lg font-bold">{profile.display_name}</p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>

          {profile.badges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1">
              {profile.badges.map((b) => (
                <span key={b} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold">
                  {b}
                </span>
              ))}
            </div>
          )}

          <div className="w-full space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Level {profile.level}</span>
              <span>{full(profile.xp)} / {full(nextLevel)} XP</span>
            </div>
            <Progress value={xpPct} className="h-1.5" />
          </div>

          <div className="grid w-full grid-cols-3 gap-2 text-sm">
            <Stat label="Followers" value={compact(profile.followers_count)} />
            <Stat label="Following" value={compact(profile.following_count)} />
            <Stat label="Country" value={profile.country || "—"} />
          </div>

          {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}

          {isActiveHost && (
            <span className="rounded-full bg-diamond/10 px-3 py-1 text-xs font-bold text-diamond">🎙️ Active host</span>
          )}
        </div>

        {!isSelf && (
          <div className="flex flex-wrap gap-2">
            {session ? (
              <>
                <Button onClick={() => void toggleFollow()} className="flex-1 gap-1.5 rounded-full">
                  {followQuery.data ? <UserMinus className="size-4" /> : <UserPlus className="size-4" />}
                  {followQuery.data ? "Unfollow" : "Follow"}
                </Button>
                <Button asChild variant="secondary" className="flex-1 gap-1.5 rounded-full">
                  <Link to="/messages">
                    <MessageCircle className="size-4" /> Message
                  </Link>
                </Button>
                <Button variant="secondary" size="icon" className="rounded-full" onClick={() => void handleShare()} aria-label="Share">
                  <Share2 className="size-4" />
                </Button>
                <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full" aria-label="Report">
                      <ShieldAlert className="size-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm rounded-3xl">
                    <DialogHeader>
                      <DialogTitle>Report @{profile.username}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Select value={reportCategory} onValueChange={setReportCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REPORT_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Add details (optional)"
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button onClick={() => void submitReport()} className="w-full rounded-full">
                        Submit report
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <ConfirmDialog
                  trigger={
                    <Button variant="secondary" size="icon" className="rounded-full" aria-label="Block">
                      <ShieldOff className="size-4" />
                    </Button>
                  }
                  title={blockQuery.data ? `Unblock @${profile.username}?` : `Block @${profile.username}?`}
                  description={
                    blockQuery.data
                      ? "You will start seeing their content again."
                      : "You won't see their content and they won't be able to message you."
                  }
                  confirmLabel={blockQuery.data ? "Unblock" : "Block"}
                  destructive={!blockQuery.data}
                  onConfirm={() => void toggleBlock()}
                />
              </>
            ) : (
              <Button asChild className="w-full rounded-full">
                <Link to="/auth">Sign in to interact</Link>
              </Button>
            )}
          </div>
        )}

        {roomsQuery.data?.live && (
          <section>
            <p className="mb-2 text-sm font-bold text-live">🔴 Live now</p>
            <div className="grid grid-cols-2 gap-3">
              <LiveRoomCard room={roomsQuery.data.live} />
            </div>
          </section>
        )}

        {roomsQuery.data && roomsQuery.data.ended.length > 0 && (
          <section>
            <p className="mb-2 text-sm font-bold">Recent streams</p>
            <div className="space-y-2">
              {roomsQuery.data.ended.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-2xl glass p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{compact(r.diamonds_earned)} 💎</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-2 py-3">
      <p className="font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
