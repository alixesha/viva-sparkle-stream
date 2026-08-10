import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Handler = (payload: { eventType: string; new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => void;

/**
 * Subscribes to postgres changes for a table with an optional filter.
 * The channel is torn down on unmount so we never leak subscriptions.
 */
export function useRealtime(
  channelName: string,
  table: string,
  filter: string | undefined,
  handler: Handler,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel(channelName)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          handler({
            eventType: payload.eventType as string,
            new: (payload.new ?? null) as Record<string, unknown> | null,
            old: (payload.old ?? null) as Record<string, unknown> | null,
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, table, filter, enabled]);
}
