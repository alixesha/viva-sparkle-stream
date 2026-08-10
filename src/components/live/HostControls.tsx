import { Camera, CameraOff, Mic, MicOff, RefreshCw, Users, Swords, PhoneOff } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { cn } from "@/lib/utils";

export function HostControls({
  cameraOn,
  micOn,
  onToggleCamera,
  onToggleMic,
  onSwitchCamera,
  onOpenViewers,
  onOpenPk,
  onEndLive,
}: {
  cameraOn: boolean;
  micOn: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onSwitchCamera: () => void;
  onOpenViewers: () => void;
  onOpenPk: () => void;
  onEndLive: () => void;
}) {
  const btn = "grid size-10 place-items-center rounded-full glass-strong tap";
  return (
    <div className="flex items-center justify-between gap-2 px-3 pb-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onToggleCamera} className={cn(btn, !cameraOn && "bg-destructive/30")} aria-label="Toggle camera">
          {cameraOn ? <Camera className="size-4" /> : <CameraOff className="size-4" />}
        </button>
        <button type="button" onClick={onToggleMic} className={cn(btn, !micOn && "bg-destructive/30")} aria-label="Toggle mic">
          {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
        </button>
        <button type="button" onClick={onSwitchCamera} className={btn} aria-label="Switch camera">
          <RefreshCw className="size-4" />
        </button>
        <button type="button" onClick={onOpenViewers} className={btn} aria-label="Viewers">
          <Users className="size-4" />
        </button>
        <button type="button" onClick={onOpenPk} className={btn} aria-label="PK battle">
          <Swords className="size-4" />
        </button>
      </div>
      <ConfirmDialog
        trigger={
          <button type="button" className="flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2.5 text-xs font-bold text-destructive-foreground tap">
            <PhoneOff className="size-4" /> End
          </button>
        }
        title="End live stream?"
        description="Your room will close for all viewers."
        confirmLabel="End live"
        destructive
        onConfirm={onEndLive}
      />
    </div>
  );
}
