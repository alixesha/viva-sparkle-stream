import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { UserAvatar } from "@/components/common/UserAvatar";
import { cn } from "@/lib/utils";
import { readGiftMeta, type LiveMessage } from "./live-types";

export function RoomChat({
  messages,
  canChat,
  disabledReason,
  onSend,
}: {
  messages: LiveMessage[];
  canChat: boolean;
  disabledReason?: string;
  onSend: (body: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setBody("");
    try {
      await onSend(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
        {messages.map((m) => {
          if (m.kind === "gift") {
            const meta = readGiftMeta(m.meta);
            return (
              <div key={m.id} className="flex items-center gap-1.5 rounded-full bg-coin/10 px-3 py-1 text-xs">
                <span className="font-bold text-coin">{m.username}</span>
                <span className="text-muted-foreground">sent</span>
                <span>{meta.icon ?? "🎁"}</span>
                <span className="font-bold">
                  {meta.gift_name} ×{meta.quantity ?? 1}
                </span>
              </div>
            );
          }
          if (m.kind === "system" || m.kind === "join") {
            return (
              <p key={m.id} className="text-center text-[11px] text-muted-foreground">
                {m.body}
              </p>
            );
          }
          return (
            <div key={m.id} className="flex items-start gap-2">
              <UserAvatar src={m.avatar_url} name={m.username} size="xs" />
              <p className="min-w-0 rounded-2xl glass px-2.5 py-1 text-xs">
                <span className={cn("mr-1 font-bold", m.is_host && "brand-text")}>{m.username}</span>
                <span className="break-words text-foreground/90">{m.body}</span>
              </p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-border/40 px-3 py-2">
        {canChat ? (
          <>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
              maxLength={300}
              placeholder="Say something…"
              className="h-10 flex-1 rounded-full bg-surface-2 px-4 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => void submit()}
              disabled={sending || !body.trim()}
              className="grid size-10 shrink-0 place-items-center rounded-full brand-gradient text-primary-foreground tap disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </>
        ) : (
          <p className="w-full py-1 text-center text-xs text-muted-foreground">
            {disabledReason ?? "Sign in to chat"}
          </p>
        )}
      </div>
    </div>
  );
}
