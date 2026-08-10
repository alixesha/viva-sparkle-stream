import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreVertical, ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, RowSkeletonList } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MessageBubble, type ChatMessage } from "@/components/chat/MessageBubble";
import { ChatComposer } from "@/components/chat/ChatComposer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { REPORT_CATEGORIES } from "@/lib/format";
import { blockUser, isBlocked, reportContent } from "@/lib/social";

export const Route = createFileRoute("/messages/$conversationId")({
  head: () => ({
    meta: [
      { title: "Conversation — VIVA LIVE" },
      { name: "description", content: "A private conversation on VIVA LIVE." },
      { property: "og:title", content: "Conversation — VIVA LIVE" },
      { property: "og:description", content: "A private conversation on VIVA LIVE." },
    ],
  }),
  component: ConversationThreadPage,
});

function ConversationThreadPage() {
  const { conversationId } = useParams({ from: "/messages/$conversationId" });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<string>(REPORT_CATEGORIES[0] ?? "Other");
  const [reportDetails, setReportDetails] = useState("");

  const conversationQuery = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase.from("conversations").select("*").eq("id", conversationId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const conversation = conversationQuery.data;
  const belongsToMe = Boolean(
    conversation && user && (conversation.user_a === user.id || conversation.user_b === user.id),
  );
  const otherId = conversation && user
    ? conversation.user_a === user.id
      ? conversation.user_b
      : conversation.user_a
    : undefined;

  const otherProfileQuery = useQuery({
    queryKey: ["conversation-other-profile", otherId],
    enabled: Boolean(otherId),
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", otherId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", conversationId],
    enabled: belongsToMe,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const blockedByMeQuery = useQuery({
    queryKey: ["blocked-by-me", user?.id, otherId],
    enabled: Boolean(user?.id && otherId),
    queryFn: () => isBlocked(user!.id, otherId!),
  });
  const blockedMeQuery = useQuery({
    queryKey: ["blocked-me", user?.id, otherId],
    enabled: Boolean(user?.id && otherId),
    queryFn: () => isBlocked(otherId!, user!.id),
  });

  async function markRead() {
    if (!user) return;
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .is("read_at", null);
  }

  useEffect(() => {
    if (belongsToMe) void markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [belongsToMe, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data?.length]);

  useRealtime(
    `conversation-${conversationId}-messages`,
    "messages",
    `conversation_id=eq.${conversationId}`,
    (payload) => {
      if (payload.eventType === "INSERT") {
        queryClient.setQueryData<ChatMessage[]>(["conversation-messages", conversationId], (prev) => {
          const msg = payload.new as unknown as ChatMessage;
          if (prev?.some((m) => m.id === msg.id)) return prev;
          return [...(prev ?? []), msg];
        });
        const msg = payload.new as unknown as ChatMessage;
        if (msg.sender_id !== user?.id) void markRead();
      } else {
        void queryClient.invalidateQueries({ queryKey: ["conversation-messages", conversationId] });
      }
    },
    belongsToMe,
  );

  const isBlockedEitherWay = Boolean(blockedByMeQuery.data || blockedMeQuery.data);

  async function handleSend(input: { body: string; imageRef?: string }) {
    if (!user || !conversation) return;
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: input.body,
        image_url: input.imageRef ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    queryClient.setQueryData<ChatMessage[]>(["conversation-messages", conversationId], (prev) => [
      ...(prev ?? []),
      data,
    ]);
    const preview = input.imageRef ? (input.body ? input.body : "📷 Photo") : input.body;
    await supabase
      .from("conversations")
      .update({ last_message: preview.slice(0, 200), last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  async function handleBlock() {
    if (!user || !otherId) return;
    try {
      await blockUser(user.id, otherId);
      toast.success("User blocked");
      void queryClient.invalidateQueries({ queryKey: ["blocked-by-me"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to block");
    }
  }

  async function submitReport() {
    if (!user || !otherId) return;
    try {
      await reportContent({ reporterId: user.id, targetUserId: otherId, category: reportCategory, details: reportDetails });
      toast.success("Report submitted");
      setReportOpen(false);
      setReportDetails("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit report");
    }
  }

  if (conversationQuery.isLoading) {
    return (
      <AppShell header={<PageHeader title="Chat" />} nav={false}>
        <RowSkeletonList count={6} />
      </AppShell>
    );
  }

  if (conversationQuery.isError) {
    return (
      <AppShell header={<PageHeader title="Chat" />} nav={false}>
        <ErrorState retry={() => void conversationQuery.refetch()} />
      </AppShell>
    );
  }

  if (!conversation || !belongsToMe) {
    return (
      <AppShell header={<PageHeader title="Chat" />} nav={false}>
        <EmptyState icon="🙈" title="Conversation not available" description="This conversation doesn't exist or isn't yours." />
      </AppShell>
    );
  }

  const other = otherProfileQuery.data;

  return (
    <AppShell
      nav={false}
      header={
        <PageHeader
          title=""
          action={
            <div className="flex flex-1 items-center gap-3">
              <Link to="/u/$username" params={{ username: other?.username ?? "" }} className="flex min-w-0 flex-1 items-center gap-2">
                <UserAvatar src={other?.avatar_url} name={other?.display_name} size="sm" />
                <span className="truncate text-sm font-bold">{other?.display_name ?? "..."}</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="Menu" className="grid size-9 place-items-center rounded-full glass tap">
                    <MoreVertical className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <ConfirmDialog
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2">
                        <ShieldOff className="size-4" /> Block user
                      </DropdownMenuItem>
                    }
                    title="Block this user?"
                    description="They won't be able to message you anymore."
                    confirmLabel="Block"
                    destructive
                    onConfirm={handleBlock}
                  />
                  <DropdownMenuItem onSelect={() => setReportOpen(true)}>Report user</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />
      }
    >
      <div className="flex h-[calc(100vh-9rem)] flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto pb-2">
          {messagesQuery.isLoading ? (
            <RowSkeletonList count={5} />
          ) : (
            <>
              {(messagesQuery.data ?? []).map((m) => (
                <MessageBubble key={m.id} message={m} own={m.sender_id === user?.id} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>
        <div className="sticky bottom-0 pb-2 pt-1">
          <ChatComposer
            userId={user!.id}
            disabled={isBlockedEitherWay}
            disabledReason={
              blockedByMeQuery.data
                ? "You've blocked this user. Unblock them to send messages."
                : "You can't message this user."
            }
            onSend={handleSend}
          />
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Report user</DialogTitle>
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
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Add details (optional)"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => void submitReport()} className="w-full rounded-full">
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
