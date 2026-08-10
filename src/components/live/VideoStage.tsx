import { useEffect, useRef, useState } from "react";
import { resolveMedia } from "@/lib/media";
import { streamingService, type StreamSession } from "@/lib/streaming";
import { TestModeBanner } from "@/components/common/States";
import type { LiveRoom } from "./live-types";

/**
 * Host: shows real local camera preview (muted, not broadcast anywhere real).
 * Viewer: clearly-labelled TEST STREAM placeholder — never implies real video.
 */
export function VideoStage({
  room,
  isHost,
  onSession,
}: {
  room: LiveRoom;
  isHost: boolean;
  onSession?: (session: StreamSession | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [camError, setCamError] = useState(false);

  useEffect(() => {
    let alive = true;
    void resolveMedia(room.thumbnail_url).then((u) => alive && setThumb(u));
    return () => {
      alive = false;
    };
  }, [room.thumbnail_url]);

  useEffect(() => {
    if (!isHost) return;
    let session: StreamSession | null = null;
    let cancelled = false;
    void streamingService.connect(room.stream_channel_id, "host").then((s) => {
      if (cancelled) {
        void streamingService.disconnect(s);
        return;
      }
      session = s;
      onSession?.(s);
      if (videoRef.current) videoRef.current.srcObject = s.localStream;
      if (!s.localStream) setCamError(true);
    });
    return () => {
      cancelled = true;
      onSession?.(null);
      void streamingService.disconnect(session);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, room.stream_channel_id]);

  if (isHost) {
    return (
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-surface-2">
        <video ref={videoRef} autoPlay muted playsInline className="size-full object-cover" />
        {camError && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-2 p-6 text-center text-sm text-muted-foreground">
            Camera unavailable — allow camera access to preview your stream.
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-live/90 px-2 py-1 text-[10px] font-bold text-primary-foreground">
          YOUR CAMERA · LOCAL PREVIEW ONLY
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden bg-surface-2">
      {thumb ? (
        <img src={thumb} alt={room.title} className="size-full object-cover opacity-60" />
      ) : (
        <div className="size-full bg-gradient-to-b from-surface-2 to-background" />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/40 p-6 text-center">
        <span className="text-4xl">📡</span>
        <p className="font-display text-sm font-bold">Simulated live stage</p>
        <div className="absolute bottom-4 left-4 right-4">
          <TestModeBanner label="TEST STREAM — NO REAL BROADCAST" />
        </div>
      </div>
    </div>
  );
}
