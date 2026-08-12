import type { Tables } from "@/integrations/supabase/types";

export type LiveRoom = Tables<"live_rooms">;
export type LiveMessage = Tables<"live_messages">;
export type LiveParticipant = Tables<"live_participants">;
export type Gift = Tables<"gifts">;
export type PkBattle = Tables<"pk_battles">;

export interface HostProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  followers_count: number;
}

export interface GiftMeta {
  gift_id?: string;
  gift_name?: string;
  icon?: string;
  animation_key?: string;
  animation_url?: string | null;
  sound_key?: string | null;
  sound_url?: string | null;
  duration_ms?: number | null;
  sender_avatar?: string | null;
  tier?: string;
  quantity?: number;
  coins?: number;
  receiver_id?: string;
}

export function readGiftMeta(meta: unknown): GiftMeta {
  if (!meta || typeof meta !== "object") return {};
  return meta as GiftMeta;
}
