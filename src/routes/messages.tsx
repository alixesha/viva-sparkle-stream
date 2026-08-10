import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, RowSkeletonList } from "@/components/common/States";
import { ConversationListItem, type ConversationListItemData } from "@/components/chat/ConversationListItem";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { Button } from "@/components/ui/button";

interface MessagesSearch {
  to?: string;
}

export const Route = createFileRoute("/messages")({
  validateSearch: (search: Record<string, unknown>): MessagesSearch => ({
    to: typeof search.to === "string" ? search.to : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Messages — VIVA LIVE" },
      { name: "description", content: "Your private conversations with hosts and friends on VIVA LIVE." },
      { property: "og:title", content: "Messages — VIVA LIVE" },
      { property: "og:description", content: "Private conversations with hosts and friends." },
    ],
  }),
  component: MessagesListPage,
});

async function findOrCreateConversation(meId: string, otherId: string) {
  const existing = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(user_a.eq.${meId},user_b.eq.${otherId}),and(user_a.eq.${otherId},user_b.eq.${meId})`,
    )
    .maybeSingle();
  if (existing.data?.id) return existing.data.id;
  const inserted = await supabase
    .from("conversations")
    .insert({ user_a: meId, user_b: otherId })
    .select("id")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data.id as string;
}

function MessagesListPage() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !search.to || search.to === user.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const id = await findOrCreateConversation(user.id, search.to!);
        if (!cancelled) {
          void navigate({ to: "/messages/$conversationId", params: { conversationId: id }, replace: true });
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not start conversation");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, search.to, navigate]);

  const conversationsQuery = useQuery({
    queryKey: ["conversations-list", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ConversationListItemData[]> => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const conversations = data ?? [];
      if (conversations.length === 0) return [];

      const otherIds = Array.from(
        new Set(conversations.map((c) => (c.user_a === user!.id ? c.user_b : c.user_a))),
      );
      const [profilesRes, messagesRes] = await Promise.all([
        supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", otherIds),
        supabase
          .from("messages")
          .select("conversation_id, sender_id, read_at, created_at")
          .in("conversation_id", conversations.map((c) => c.id))
          .order("created_at", { ascending: false }),
      ]);

      const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
      const latestByConversation = new Map<string, { sender_id: string; read_at: string | null }>();
      for (const m of messagesRes.data ?? []) {
        if (!latestByConversation.has(m.conversation_id)) {
          latestByConversation.set(m.conversation_id, { sender_id: m.sender_id, read_at: m.read_at });
        }
      }

      return conversations.map((c) => {
        const otherId = c.user_a === user!.id ? c.user_b : c.user_a;
        const latest = latestByConversation.get(c.id);
        const unread = Boolean(latest && latest.sender_id !== user!.id && !latest.read_at);
        return {
          id: c.id,
          last_message: c.last_message,
          last_message_at: c.last_message_at,
          otherUser: profileMap.get(otherId) ?? null,
          unread,
        };
      });
    },
  });

  useRealtime(
    "conversations-list-conversations",
    "conversations",
    undefined,
    () => void queryClient.invalidateQueries({ queryKey: ["conversations-list", user?.id] }),
    Boolean(user?.id),
  );
  useRealtime(
    "conversations-list-messages",
    "messages",
    undefined,
    () => void queryClient.invalidateQueries({ queryKey: ["conversations-list", user?.id] }),
    Boolean(user?.id),
  );

  if (!loading && !session) {
    return (
      <AppShell header={<PageHeader title="Messages" back={false} />}>
        <EmptyState
          icon="💬"
          title="Sign in to message"
          description="Sign in to chat with hosts and friends on VIVA LIVE."
          action={
            <Button asChild className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell header={<PageHeader title="Messages" back={false} />}>
      {conversationsQuery.isLoading ? (
        <RowSkeletonList count={6} />
      ) : conversationsQuery.isError ? (
        <ErrorState retry={() => void conversationsQuery.refetch()} />
      ) : !conversationsQuery.data || conversationsQuery.data.length === 0 ? (
        <EmptyState icon="💬" title="No conversations yet" description="Message a host or friend to start chatting." />
      ) : (
        <div className="space-y-1">
          {conversationsQuery.data.map((c) => (
            <ConversationListItem key={c.id} conversation={c} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
