
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;

-- FOLLOWS
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX ON public.follows (following_id);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT ON public.follows TO anon;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_read" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_self_insert" ON public.follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows_self_delete" ON public.follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

CREATE OR REPLACE FUNCTION public.sync_follow_counts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSE
    UPDATE public.profiles SET followers_count = greatest(followers_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE public.profiles SET following_count = greatest(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END; $$;
REVOKE EXECUTE ON FUNCTION public.sync_follow_counts() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER follows_counts AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.sync_follow_counts();

-- BLOCKS
CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_own" ON public.blocks FOR ALL TO authenticated USING (blocker_id = auth.uid() OR public.is_admin()) WITH CHECK (blocker_id = auth.uid());

-- HOSTS
CREATE TYPE public.host_status AS ENUM ('active','suspended','pending');
CREATE TABLE public.hosts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.host_status NOT NULL DEFAULT 'active',
  host_level int NOT NULL DEFAULT 1,
  total_live_seconds bigint NOT NULL DEFAULT 0,
  total_gifts_received bigint NOT NULL DEFAULT 0,
  total_diamonds bigint NOT NULL DEFAULT 0,
  approved_at timestamptz NOT NULL DEFAULT now(),
  agency_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hosts TO authenticated, anon;
GRANT ALL ON public.hosts TO service_role;
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hosts_read" ON public.hosts FOR SELECT USING (true);
CREATE POLICY "hosts_admin_write" ON public.hosts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TYPE public.application_status AS ENUM ('pending','approved','rejected');
CREATE TABLE public.host_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  real_name text NOT NULL DEFAULT '',
  age int,
  country text NOT NULL DEFAULT '',
  experience text NOT NULL DEFAULT '',
  social_link text,
  status public.application_status NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX host_app_one_pending ON public.host_applications (user_id) WHERE status = 'pending';
GRANT SELECT, INSERT ON public.host_applications TO authenticated;
GRANT ALL ON public.host_applications TO service_role;
ALTER TABLE public.host_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hostapp_own_read" ON public.host_applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "hostapp_own_insert" ON public.host_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "hostapp_admin_update" ON public.host_applications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- LIVE ROOMS
CREATE TYPE public.room_status AS ENUM ('live','ended');
CREATE TABLE public.live_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Live now',
  category text NOT NULL DEFAULT 'chat',
  thumbnail_url text,
  status public.room_status NOT NULL DEFAULT 'live',
  viewer_count int NOT NULL DEFAULT 0,
  peak_viewers int NOT NULL DEFAULT 0,
  likes_count int NOT NULL DEFAULT 0,
  diamonds_earned bigint NOT NULL DEFAULT 0,
  country text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'en',
  stream_channel_id text NOT NULL DEFAULT gen_random_uuid()::text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.live_rooms (status, viewer_count DESC);
CREATE INDEX ON public.live_rooms (host_id);
CREATE UNIQUE INDEX live_rooms_one_live_per_host ON public.live_rooms (host_id) WHERE status = 'live';
GRANT SELECT, INSERT, UPDATE ON public.live_rooms TO authenticated;
GRANT SELECT ON public.live_rooms TO anon;
GRANT ALL ON public.live_rooms TO service_role;
ALTER TABLE public.live_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_read" ON public.live_rooms FOR SELECT USING (true);
CREATE POLICY "rooms_host_insert" ON public.live_rooms FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "rooms_host_update" ON public.live_rooms FOR UPDATE TO authenticated USING (host_id = auth.uid() OR public.is_admin()) WITH CHECK (host_id = auth.uid() OR public.is_admin());

CREATE TABLE public.live_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_muted boolean NOT NULL DEFAULT false,
  is_banned boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  UNIQUE (room_id, user_id)
);
CREATE INDEX ON public.live_participants (room_id);
GRANT SELECT, INSERT, UPDATE ON public.live_participants TO authenticated;
GRANT SELECT ON public.live_participants TO anon;
GRANT ALL ON public.live_participants TO service_role;
ALTER TABLE public.live_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_read" ON public.live_participants FOR SELECT USING (true);
CREATE POLICY "participants_self_insert" ON public.live_participants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "participants_update" ON public.live_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin() OR EXISTS (SELECT 1 FROM public.live_rooms r WHERE r.id = room_id AND r.host_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_admin() OR EXISTS (SELECT 1 FROM public.live_rooms r WHERE r.id = room_id AND r.host_id = auth.uid()));

CREATE TYPE public.live_message_kind AS ENUM ('chat','system','gift','join');
CREATE TABLE public.live_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username text NOT NULL DEFAULT '',
  avatar_url text,
  body text NOT NULL DEFAULT '',
  kind public.live_message_kind NOT NULL DEFAULT 'chat',
  is_host boolean NOT NULL DEFAULT false,
  is_moderator boolean NOT NULL DEFAULT false,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.live_messages (room_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.live_messages TO authenticated;
GRANT SELECT ON public.live_messages TO anon;
GRANT ALL ON public.live_messages TO service_role;
ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "livemsg_read" ON public.live_messages FOR SELECT USING (true);
CREATE POLICY "livemsg_insert" ON public.live_messages FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM public.live_participants p WHERE p.room_id = room_id AND p.user_id = auth.uid() AND (p.is_muted OR p.is_banned))
);
CREATE POLICY "livemsg_delete" ON public.live_messages FOR DELETE TO authenticated USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.live_rooms r WHERE r.id = room_id AND r.host_id = auth.uid())
);

-- PRIVATE MESSAGING
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message text NOT NULL DEFAULT '',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_participants" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() IN (user_a, user_b));
CREATE POLICY "conv_insert" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (user_a, user_b));
CREATE POLICY "conv_update" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() IN (user_a, user_b)) WITH CHECK (auth.uid() IN (user_a, user_b));

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  image_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.messages (conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_read" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() IN (c.user_a, c.user_b))
);
CREATE POLICY "msg_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() IN (c.user_a, c.user_b))
  AND NOT EXISTS (
    SELECT 1 FROM public.conversations c JOIN public.blocks b
      ON (b.blocker_id = CASE WHEN c.user_a = auth.uid() THEN c.user_b ELSE c.user_a END AND b.blocked_id = auth.uid())
    WHERE c.id = conversation_id
  )
);
CREATE POLICY "msg_update_read" ON public.messages FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND auth.uid() IN (c.user_a, c.user_b))
) WITH CHECK (true);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.notifications (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_own_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif_own_delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR user_id <> auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.live_messages REPLICA IDENTITY FULL;
ALTER TABLE public.live_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.live_participants REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
