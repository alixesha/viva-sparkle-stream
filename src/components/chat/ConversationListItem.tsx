import { Link } from "@tanstack/react-router";
import { UserAvatar } from "@/components/common/UserAvatar";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ConversationListItemData {
  id: string;
  last_message: string;
  last_message_at: string;
  otherUser: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  unread: boolean;
}

export function ConversationListItem({ conversation }: { conversation: ConversationListItemData }) {
  const other = conversation.otherUser;
  return (
    <Link
      to="/messages/$conversationId"
      params={{ conversationId: conversation.id }}
      className="flex items-center gap-3 rounded-2xl px-2 py-2.5 tap hover:bg-surface-2"
    >
      <div className="relative shrink-0">
        <UserAvatar src={other?.avatar_url} name={other?.display_name ?? "?"} size="md" />
        {conversation.unread && (
          <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-live ring-2 ring-background" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", conversation.unread ? "font-bold" : "font-semibold")}>
          {other?.display_name ?? "Unknown user"}
        </p>
        <p className={cn("truncate text-xs", conversation.unread ? "text-foreground" : "text-muted-foreground")}>
          {conversation.last_message || "Say hi 👋"}
        </p>
      </div>
      <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(conversation.last_message_at)}</span>
    </Link>
  );
}
