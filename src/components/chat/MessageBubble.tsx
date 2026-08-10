import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveMedia } from "@/lib/media";
import { clock } from "@/lib/format";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  image_url: string | null;
  read_at: string | null;
  created_at: string;
}

export function MessageBubble({ message, own }: { message: ChatMessage; own: boolean }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (message.image_url) {
      void resolveMedia(message.image_url).then((u) => {
        if (alive) setImageUrl(u);
      });
    }
    return () => {
      alive = false;
    };
  }, [message.image_url]);

  const time = new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={cn("flex w-full animate-fade-in", own ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-3xl px-3.5 py-2.5 text-sm",
          own
            ? "brand-gradient rounded-br-md text-primary-foreground"
            : "glass rounded-bl-md",
        )}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Attachment"
            className="mb-1.5 max-h-64 w-full rounded-2xl object-cover"
            loading="lazy"
          />
        )}
        {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
        <p className={cn("mt-1 text-right text-[10px]", own ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {time}
        </p>
      </div>
    </div>
  );
}

export { clock };
