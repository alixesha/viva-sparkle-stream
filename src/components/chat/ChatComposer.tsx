import { useRef, useState } from "react";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadUserFile, mediaRef } from "@/lib/media";

export function ChatComposer({
  userId,
  disabled,
  disabledReason,
  onSend,
}: {
  userId: string;
  disabled?: boolean;
  disabledReason?: string;
  onSend: (input: { body: string; imageRef?: string }) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSend() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await onSend({ body });
      setText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSending(true);
    try {
      const path = await uploadUserFile("chat-images", userId, file);
      await onSend({ body: text.trim(), imageRef: mediaRef("chat-images", path) });
      setText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send image");
    } finally {
      setSending(false);
    }
  }

  if (disabled) {
    return (
      <div className="rounded-2xl glass px-4 py-3 text-center text-xs text-muted-foreground">
        {disabledReason ?? "You can't message this user."}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full glass-strong px-2 py-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFile(e)} />
      <button
        type="button"
        aria-label="Attach image"
        onClick={() => fileRef.current?.click()}
        disabled={sending}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 tap disabled:opacity-50"
      >
        <ImagePlus className="size-4" />
      </button>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
          }
        }}
        placeholder="Message..."
        disabled={sending}
        className="h-9 flex-1 rounded-full border-none bg-transparent focus-visible:ring-0"
      />
      <Button
        type="button"
        size="icon"
        onClick={() => void handleSend()}
        disabled={sending || !text.trim()}
        className="size-9 shrink-0 rounded-full"
        aria-label="Send"
      >
        {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      </Button>
    </div>
  );
}
