import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/common/UserAvatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { blockUser } from "@/lib/social";
import { supabase } from "@/integrations/supabase/client";
import type { LiveParticipant } from "./live-types";

interface ViewerRow extends LiveParticipant {
  profile: { username: string; display_name: string; avatar_url: string | null } | null;
}

export function ViewerListSheet({
  open,
  onOpenChange,
  roomId,
  isHost,
  hostUserId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roomId: string;
  isHost: boolean;
  hostUserId: string;
}) {
  const [rows, setRows] = useState<ViewerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: participants } = await supabase
      .from("live_participants")
      .select("*")
      .eq("room_id", roomId)
      .is("left_at", null)
      .order("joined_at", { ascending: false });
    const list = participants ?? [];
    const ids = list.map((p) => p.user_id);
    let profileMap = new Map<string, { username: string; display_name: string; avatar_url: string | null }>();
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", ids);
      profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    }
    setRows(list.map((p) => ({ ...p, profile: profileMap.get(p.user_id) ?? null })));
    setLoading(false);
  };

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, roomId]);

  const mute = async (row: ViewerRow) => {
    const { error } = await supabase
      .from("live_participants")
      .update({ is_muted: !row.is_muted })
      .eq("id", row.id);
    if (error) toast.error("Could not update viewer");
    else {
      toast.success(row.is_muted ? "Viewer unmuted" : "Viewer muted");
      void load();
    }
  };

  const remove = async (row: ViewerRow) => {
    const { error } = await supabase
      .from("live_participants")
      .update({ is_banned: true, left_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) toast.error("Could not remove viewer");
    else {
      toast.success("Viewer removed");
      void load();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[75vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Viewers · {rows.length}</SheetTitle>
        </SheetHeader>
        <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No one is watching yet.</p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-2xl glass px-3 py-2">
                <UserAvatar src={r.profile?.avatar_url} name={r.profile?.display_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.profile?.display_name ?? "Viewer"}</p>
                  <p className="truncate text-xs text-muted-foreground">@{r.profile?.username}</p>
                </div>
                {isHost && r.user_id !== hostUserId && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void mute(r)}
                      className="rounded-full glass px-2.5 py-1 text-[11px] font-bold tap"
                    >
                      {r.is_muted ? "Unmute" : "Mute"}
                    </button>
                    <ConfirmDialog
                      trigger={
                        <button type="button" className="rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-bold text-destructive tap">
                          Remove
                        </button>
                      }
                      title="Remove viewer?"
                      description="They'll be banned from this room."
                      confirmLabel="Remove"
                      destructive
                      onConfirm={() => void remove(r)}
                    />
                    <button
                      type="button"
                      onClick={() => void blockUser(hostUserId, r.user_id).then(() => toast.success("User blocked"))}
                      className="rounded-full glass px-2.5 py-1 text-[11px] font-bold tap"
                    >
                      Block
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
