import { supabase } from "@/integrations/supabase/client";

/** Follow / unfollow. Counters are kept in sync by database triggers. */
export async function follow(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollow(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}

export async function isFollowing(followerId: string, followingId: string) {
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return Boolean(data);
}

export async function blockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error && error.code !== "23505") throw error;
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}

export async function isBlocked(blockerId: string, blockedId: string) {
  const { data } = await supabase
    .from("blocks")
    .select("id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();
  return Boolean(data);
}

export async function reportContent(input: {
  reporterId: string;
  targetUserId?: string | null;
  targetRoomId?: string | null;
  category: string;
  details: string;
}) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: input.reporterId,
    target_user_id: input.targetUserId ?? null,
    target_room_id: input.targetRoomId ?? null,
    category: input.category,
    details: input.details.trim().slice(0, 1000),
  });
  if (error) throw error;
}

/** Share helper: native share sheet with clipboard fallback. */
export async function shareLink(url: string, title: string) {
  const nav = navigator as Navigator & { share?: (d: { url: string; title: string }) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ url, title });
      return "shared" as const;
    } catch {
      /* user cancelled */
      return "cancelled" as const;
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied" as const;
}
