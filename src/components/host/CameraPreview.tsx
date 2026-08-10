import { useEffect, useRef, useState } from "react";
import { Camera, Mic, MicOff, VideoOff, SwitchCamera } from "lucide-react";
import { streamingService } from "@/lib/streaming";
import type { StreamSession } from "@/lib/streaming";
import { TestModeBanner } from "@/components/common/States";

export function useCameraPreview(channelId: string) {
  const sessionRef = useRef<StreamSession | null>(null);
  const [session, setSession] = useState<StreamSession | null>(null);

  useEffect(() => {
    let alive = true;
    void streamingService.connect(channelId, "host").then((s) => {
      if (!alive) return;
      sessionRef.current = s;
      setSession(s);
    });
    return () => {
      alive = false;
      void streamingService.disconnect(sessionRef.current);
      sessionRef.current = null;
    };
  }, [channelId]);

  return { session, setSession, sessionRef };
}

export function CameraPreview({
  session,
  onSessionChange,
}: {
  session: StreamSession | null;
  onSessionChange: (s: StreamSession | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = session?.localStream ?? null;
    }
  }, [session]);

  return (
    <div className="space-y-3">
      <TestModeBanner label="TEST STREAM — LOCAL PREVIEW ONLY" />
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-3xl bg-surface-2">
        {session?.localStream ? (
          <video ref={videoRef} autoPlay muted playsInline className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-sm text-muted-foreground">
            Waiting for camera permission…
          </div>
        )}
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full glass-strong tap"
            onClick={() => {
              const next = !camOn;
              setCamOn(next);
              void streamingService.setCameraEnabled(session, next);
            }}
            aria-label="Toggle camera"
          >
            {camOn ? <Camera className="size-5" /> : <VideoOff className="size-5" />}
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full glass-strong tap"
            onClick={() => {
              const next = !micOn;
              setMicOn(next);
              void streamingService.setMicrophoneEnabled(session, next);
            }}
            aria-label="Toggle microphone"
          >
            {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full glass-strong tap"
            onClick={() => {
              void streamingService.switchCamera(session).then((next) => onSessionChange(next));
            }}
            aria-label="Switch camera"
          >
            <SwitchCamera className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
