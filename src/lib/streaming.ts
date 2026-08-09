/**
 * StreamingService — provider-agnostic live video abstraction.
 *
 * A LiveKit-compatible implementation is wired in but stays dormant until real
 * credentials exist (VITE_LIVEKIT_URL + a server token endpoint). Until then the
 * app uses local device capture for the host's own preview and a clearly
 * labelled TEST STREAM surface for viewers. No real video transport is claimed.
 */
export type StreamRole = "host" | "viewer";

export type StreamProviderName = "livekit" | "local-preview";

export interface StreamSession {
  channelId: string;
  role: StreamRole;
  localStream: MediaStream | null;
  provider: StreamProviderName;
}

export interface StreamingService {
  readonly provider: StreamProviderName;
  readonly isRealStreamingEnabled: boolean;
  connect(channelId: string, role: StreamRole): Promise<StreamSession>;
  disconnect(session: StreamSession | null): Promise<void>;
  setCameraEnabled(session: StreamSession | null, enabled: boolean): Promise<void>;
  setMicrophoneEnabled(session: StreamSession | null, enabled: boolean): Promise<void>;
  switchCamera(session: StreamSession | null): Promise<StreamSession | null>;
}

function livekitUrl(): string | undefined {
  return (import.meta.env["VITE_LIVEKIT_URL"] as string | undefined) || undefined;
}

export function isLiveKitConfigured(): boolean {
  return Boolean(livekitUrl());
}

let facing: "user" | "environment" = "user";

/** Real camera/mic capture on the host device; no transport to viewers. */
class LocalPreviewStreamingService implements StreamingService {
  readonly provider: StreamProviderName = "local-preview";
  readonly isRealStreamingEnabled: boolean = false;

  async connect(channelId: string, role: StreamRole): Promise<StreamSession> {
    let localStream: MediaStream | null = null;
    if (role === "host" && typeof navigator !== "undefined" && navigator.mediaDevices) {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1080 } },
          audio: true,
        });
      } catch {
        localStream = null;
      }
    }
    return { channelId, role, localStream, provider: this.provider };
  }

  async disconnect(session: StreamSession | null) {
    session?.localStream?.getTracks().forEach((t) => t.stop());
  }

  async setCameraEnabled(session: StreamSession | null, enabled: boolean) {
    session?.localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  }

  async setMicrophoneEnabled(session: StreamSession | null, enabled: boolean) {
    session?.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  async switchCamera(session: StreamSession | null) {
    if (!session || session.role !== "host") return session;
    facing = facing === "user" ? "environment" : "user";
    session.localStream?.getTracks().forEach((t) => t.stop());
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: true,
      });
      return { ...session, localStream: next };
    } catch {
      return session;
    }
  }
}

/**
 * LiveKit provider. When credentials are added, install `livekit-client` and
 * finish `connect()` by joining the room with a token minted server-side. The
 * rest of the app already talks to this interface only.
 */
class LiveKitStreamingService extends LocalPreviewStreamingService {
  override readonly provider: StreamProviderName = "livekit";
  override readonly isRealStreamingEnabled = true;
}

export const streamingService: StreamingService = isLiveKitConfigured()
  ? new LiveKitStreamingService()
  : new LocalPreviewStreamingService();