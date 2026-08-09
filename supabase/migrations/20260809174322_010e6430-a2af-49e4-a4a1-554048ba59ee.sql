
-- COIN PACKAGES
CREATE TABLE public.coin_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  coins bigint NOT NULL CHECK (coins > 0),
  display_price text NOT NULL DEFAULT '$0.00',
  bonus_coins bigint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coin_packages TO authenticated, anon;
GRANT ALL ON public.coin_packages TO service_role;
ALTER TABLE public.coin_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages_read" ON public.coin_packages FOR SELECT USING (true);
CREATE POLICY "packages_admin" ON public.coin_packages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.coin_packages (name, coins, display_price, bonus_coins, sort_order) VALUES
 ('Starter', 1000, '$0.99', 0, 1),
 ('Popular', 5000, '$4.99', 250, 2),
 ('Pro', 10000, '$9.99', 800, 3),
 ('Elite', 50000, '$49.99', 5000, 4),
 ('Legend', 100000, '$99.99', 15000, 5);

-- LEDGER
CREATE TYPE public.coin_tx_type AS ENUM ('purchase','gift_sent','admin_credit','admin_debit','signup_bonus','refund');
CREATE TABLE public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.coin_tx_type NOT NULL,
  amount bigint NOT NULL,
  balance_after bigint NOT NULL,
  description text NOT NULL DEFAULT '',
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.coin_transactions (user_id, created_at DESC);
GRANT SELECT ON public.coin_transactions TO authenticated;
GRANT ALL ON public.coin_transactions TO service_role;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ledger_read" ON public.coin_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE TYPE public.request_status AS ENUM ('pending','approved','rejected');
CREATE TABLE public.coin_purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid REFERENCES public.coin_packages(id) ON DELETE SET NULL,
  coins bigint NOT NULL CHECK (coins > 0),
  display_price text NOT NULL DEFAULT '',
  payment_reference text NOT NULL,
  screenshot_url text,
  status public.request_status NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, payment_reference)
);
CREATE INDEX ON public.coin_purchase_requests (status, created_at DESC);
GRANT SELECT, INSERT ON public.coin_purchase_requests TO authenticated;
GRANT ALL ON public.coin_purchase_requests TO service_role;
ALTER TABLE public.coin_purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cpr_read" ON public.coin_purchase_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "cpr_insert" ON public.coin_purchase_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- GIFTS
CREATE TABLE public.gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL DEFAULT '🎁',
  icon_url text,
  animation_url text,
  animation_key text NOT NULL DEFAULT 'float',
  tier text NOT NULL DEFAULT 'small',
  coin_price bigint NOT NULL CHECK (coin_price > 0),
  diamond_reward bigint NOT NULL CHECK (diamond_reward >= 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gifts TO authenticated, anon;
GRANT ALL ON public.gifts TO service_role;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gifts_read" ON public.gifts FOR SELECT USING (true);
CREATE POLICY "gifts_admin" ON public.gifts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.gifts (name, icon, coin_price, diamond_reward, tier, animation_key, sort_order) VALUES
 ('Rose','🌹',10,5,'small','float',1),
 ('Heart','💖',20,10,'small','pulse',2),
 ('Kiss','💋',50,25,'small','float',3),
 ('Star','⭐',100,50,'medium','sparkle',4),
 ('Fire','🔥',300,150,'medium','flame',5),
 ('Crown','👑',1000,550,'large','crown',6),
 ('Rocket','🚀',3000,1700,'large','rocket',7),
 ('Diamond','💎',5000,2900,'large','sparkle',8),
 ('Sports Car','🏎️',10000,6000,'premium','drive',9),
 ('Galaxy Castle','🏰',50000,32000,'premium','galaxy',10);

CREATE TABLE public.gift_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id uuid NOT NULL REFERENCES public.gifts(id) ON DELETE RESTRICT,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.live_rooms(id) ON DELETE SET NULL,
  battle_id uuid,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  coins_spent bigint NOT NULL,
  diamonds_earned bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.gift_transactions (receiver_id, created_at DESC);
CREATE INDEX ON public.gift_transactions (sender_id, created_at DESC);
CREATE INDEX ON public.gift_transactions (room_id);
GRANT SELECT ON public.gift_transactions TO authenticated;
GRANT SELECT ON public.gift_transactions TO anon;
GRANT ALL ON public.gift_transactions TO service_role;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gifttx_read" ON public.gift_transactions FOR SELECT USING (true);

CREATE TABLE public.host_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diamonds bigint NOT NULL,
  source text NOT NULL DEFAULT 'gift',
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.host_earnings (host_id, created_at DESC);
GRANT SELECT ON public.host_earnings TO authenticated;
GRANT ALL ON public.host_earnings TO service_role;
ALTER TABLE public.host_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "earnings_read" ON public.host_earnings FOR SELECT TO authenticated USING (host_id = auth.uid() OR public.is_admin());

CREATE TYPE public.withdrawal_status AS ENUM ('pending','approved','processing','completed','rejected');
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diamonds bigint NOT NULL CHECK (diamonds > 0),
  payout_method text NOT NULL,
  payout_details text NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wd_read" ON public.withdrawals FOR SELECT TO authenticated USING (host_id = auth.uid() OR public.is_admin());

-- PK BATTLES
CREATE TYPE public.battle_status AS ENUM ('invited','declined','active','finished','cancelled');
CREATE TABLE public.pk_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_a uuid REFERENCES public.live_rooms(id) ON DELETE SET NULL,
  room_b uuid REFERENCES public.live_rooms(id) ON DELETE SET NULL,
  score_a bigint NOT NULL DEFAULT 0,
  score_b bigint NOT NULL DEFAULT 0,
  status public.battle_status NOT NULL DEFAULT 'invited',
  duration_seconds int NOT NULL DEFAULT 300,
  winner_id uuid,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (host_a <> host_b)
);
GRANT SELECT, INSERT, UPDATE ON public.pk_battles TO authenticated;
GRANT SELECT ON public.pk_battles TO anon;
GRANT ALL ON public.pk_battles TO service_role;
ALTER TABLE public.pk_battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pk_read" ON public.pk_battles FOR SELECT USING (true);
CREATE POLICY "pk_insert" ON public.pk_battles FOR INSERT TO authenticated WITH CHECK (host_a = auth.uid());
CREATE POLICY "pk_update" ON public.pk_battles FOR UPDATE TO authenticated USING (auth.uid() IN (host_a, host_b) OR public.is_admin()) WITH CHECK (auth.uid() IN (host_a, host_b) OR public.is_admin());

-- AGENCIES
CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  commission_percent numeric NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.agencies TO authenticated;
GRANT ALL ON public.agencies TO service_role;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agencies_read" ON public.agencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "agencies_insert" ON public.agencies FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "agencies_admin" ON public.agencies FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, host_id)
);
GRANT SELECT, INSERT, DELETE ON public.agency_members TO authenticated;
GRANT ALL ON public.agency_members TO service_role;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agmem_read" ON public.agency_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "agmem_write" ON public.agency_members FOR ALL TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid()))
  WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid()));

-- REPORTS / BANS / AUDIT
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_room_id uuid REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  category text NOT NULL,
  details text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_read" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.is_admin());
CREATE POLICY "reports_insert" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_admin" ON public.reports FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '',
  is_permanent boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bans TO authenticated;
GRANT ALL ON public.bans TO service_role;
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bans_read" ON public.bans FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "bans_admin" ON public.bans FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text NOT NULL DEFAULT '',
  target_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_admin_read" ON public.admin_actions FOR SELECT TO authenticated USING (public.is_admin());

-- ============ SECURE FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.add_xp(_user_id uuid, _amount int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_xp int; new_level int;
BEGIN
  UPDATE public.profiles SET xp = xp + _amount WHERE id = _user_id RETURNING xp INTO new_xp;
  IF new_xp IS NULL THEN RETURN; END IF;
  new_level := greatest(1, floor(sqrt(new_xp::numeric / 100))::int + 1);
  UPDATE public.profiles SET level = new_level WHERE id = _user_id AND level <> new_level;
END; $$;
REVOKE EXECUTE ON FUNCTION public.add_xp(uuid, int) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.send_gift(_gift_id uuid, _receiver_id uuid, _room_id uuid, _quantity int DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  g public.gifts;
  cost bigint; reward bigint; new_balance bigint; tx_id uuid;
  sender_name text; sender_avatar text; battle public.pk_battles;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _quantity IS NULL OR _quantity < 1 OR _quantity > 99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  IF uid = _receiver_id THEN RAISE EXCEPTION 'You cannot send gifts to yourself'; END IF;
  SELECT * INTO g FROM public.gifts WHERE id = _gift_id AND is_active;
  IF g.id IS NULL THEN RAISE EXCEPTION 'Gift unavailable'; END IF;

  cost := g.coin_price * _quantity;
  reward := g.diamond_reward * _quantity;

  UPDATE public.wallets SET coins = coins - cost, total_coins_spent = total_coins_spent + cost, updated_at = now()
    WHERE user_id = uid AND coins >= cost RETURNING coins INTO new_balance;
  IF new_balance IS NULL THEN RAISE EXCEPTION 'Not enough coins'; END IF;

  INSERT INTO public.wallets (user_id, diamonds, total_diamonds_earned)
    VALUES (_receiver_id, reward, reward)
    ON CONFLICT (user_id) DO UPDATE SET diamonds = public.wallets.diamonds + reward,
      total_diamonds_earned = public.wallets.total_diamonds_earned + reward, updated_at = now();

  INSERT INTO public.gift_transactions (gift_id, sender_id, receiver_id, room_id, quantity, coins_spent, diamonds_earned)
    VALUES (_gift_id, uid, _receiver_id, _room_id, _quantity, cost, reward) RETURNING id INTO tx_id;

  INSERT INTO public.coin_transactions (user_id, type, amount, balance_after, description, reference_id)
    VALUES (uid, 'gift_sent', -cost, new_balance, 'Sent ' || _quantity || 'x ' || g.name, tx_id);

  INSERT INTO public.host_earnings (host_id, diamonds, source, reference_id)
    VALUES (_receiver_id, reward, 'gift', tx_id);

  UPDATE public.hosts SET total_diamonds = total_diamonds + reward, total_gifts_received = total_gifts_received + _quantity
    WHERE user_id = _receiver_id;

  SELECT display_name, avatar_url INTO sender_name, sender_avatar FROM public.profiles WHERE id = uid;

  IF _room_id IS NOT NULL THEN
    UPDATE public.live_rooms SET diamonds_earned = diamonds_earned + reward WHERE id = _room_id;
    INSERT INTO public.live_messages (room_id, user_id, username, avatar_url, body, kind, meta)
      VALUES (_room_id, uid, coalesce(sender_name,'Someone'), sender_avatar,
        'sent ' || _quantity || 'x ' || g.name || ' ' || g.icon, 'gift',
        jsonb_build_object('gift_id', g.id, 'gift_name', g.name, 'icon', g.icon,
          'animation_key', g.animation_key, 'animation_url', g.animation_url,
          'tier', g.tier, 'quantity', _quantity, 'coins', cost, 'receiver_id', _receiver_id));

    SELECT * INTO battle FROM public.pk_battles
      WHERE status = 'active' AND (room_a = _room_id OR room_b = _room_id) LIMIT 1;
    IF battle.id IS NOT NULL THEN
      IF battle.host_a = _receiver_id THEN
        UPDATE public.pk_battles SET score_a = score_a + reward WHERE id = battle.id;
      ELSIF battle.host_b = _receiver_id THEN
        UPDATE public.pk_battles SET score_b = score_b + reward WHERE id = battle.id;
      END IF;
      UPDATE public.gift_transactions SET battle_id = battle.id WHERE id = tx_id;
    END IF;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (_receiver_id, 'gift_received', 'Gift received ' || g.icon,
      coalesce(sender_name,'Someone') || ' sent you ' || _quantity || 'x ' || g.name,
      jsonb_build_object('diamonds', reward, 'gift_tx', tx_id));

  PERFORM public.add_xp(uid, greatest(1, (cost / 10)::int));
  PERFORM public.add_xp(_receiver_id, greatest(1, (reward / 20)::int));

  RETURN jsonb_build_object('ok', true, 'balance', new_balance, 'gift', g.name, 'diamonds', reward, 'tx', tx_id);
END; $$;
REVOKE EXECUTE ON FUNCTION public.send_gift(uuid, uuid, uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_gift(uuid, uuid, uuid, int) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_coin_request(_request_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.coin_purchase_requests; new_balance bigint;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO r FROM public.coin_purchase_requests WHERE id = _request_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Already reviewed'; END IF;

  UPDATE public.coin_purchase_requests
    SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END::public.request_status,
        admin_note = _note, reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = _request_id;

  IF _approve THEN
    UPDATE public.wallets SET coins = coins + r.coins, total_coins_purchased = total_coins_purchased + r.coins, updated_at = now()
      WHERE user_id = r.user_id RETURNING coins INTO new_balance;
    INSERT INTO public.coin_transactions (user_id, type, amount, balance_after, description, reference_id)
      VALUES (r.user_id, 'purchase', r.coins, new_balance, 'Coin purchase approved (' || r.payment_reference || ')', r.id);
    INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (r.user_id, 'coins_approved', 'Coins added 💰', r.coins || ' test coins were added to your wallet.', jsonb_build_object('coins', r.coins));
  ELSE
    INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (r.user_id, 'coins_rejected', 'Coin request rejected', coalesce(_note,'Your coin purchase request was rejected.'), jsonb_build_object('request', r.id));
  END IF;

  INSERT INTO public.admin_actions (admin_id, action, target_type, target_id, details)
    VALUES (auth.uid(), CASE WHEN _approve THEN 'approve_coin_request' ELSE 'reject_coin_request' END, 'coin_purchase_request', r.id, jsonb_build_object('coins', r.coins));

  RETURN jsonb_build_object('ok', true);
END; $$;
REVOKE EXECUTE ON FUNCTION public.review_coin_request(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_coin_request(uuid, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_adjust_coins(_user_id uuid, _amount bigint, _reason text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_balance bigint;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF _amount = 0 THEN RAISE EXCEPTION 'Amount must be non-zero'; END IF;
  UPDATE public.wallets SET coins = coins + _amount, updated_at = now()
    WHERE user_id = _user_id AND coins + _amount >= 0 RETURNING coins INTO new_balance;
  IF new_balance IS NULL THEN RAISE EXCEPTION 'Adjustment would make the balance negative'; END IF;
  INSERT INTO public.coin_transactions (user_id, type, amount, balance_after, description)
    VALUES (_user_id, CASE WHEN _amount > 0 THEN 'admin_credit' ELSE 'admin_debit' END, _amount, new_balance, coalesce(_reason,'Admin adjustment'));
  INSERT INTO public.admin_actions (admin_id, action, target_type, target_id, details)
    VALUES (auth.uid(), 'adjust_coins', 'user', _user_id, jsonb_build_object('amount', _amount, 'reason', _reason));
  INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (_user_id, 'admin_coins', CASE WHEN _amount > 0 THEN 'Coins added 💰' ELSE 'Coins removed' END, coalesce(_reason,'Balance adjusted by admin'), jsonb_build_object('amount', _amount));
  RETURN jsonb_build_object('ok', true, 'balance', new_balance);
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_coins(uuid, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_coins(uuid, bigint, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_host_application(_app_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.host_applications;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO a FROM public.host_applications WHERE id = _app_id FOR UPDATE;
  IF a.id IS NULL OR a.status <> 'pending' THEN RAISE EXCEPTION 'Application not pending'; END IF;
  UPDATE public.host_applications SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END::public.application_status,
    admin_note = _note, reviewed_by = auth.uid(), reviewed_at = now() WHERE id = _app_id;
  IF _approve THEN
    INSERT INTO public.hosts (user_id, status) VALUES (a.user_id, 'active')
      ON CONFLICT (user_id) DO UPDATE SET status = 'active';
  END IF;
  INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (a.user_id, 'host_application', CASE WHEN _approve THEN 'You are now a VIVA host! 🎉' ELSE 'Host application rejected' END, coalesce(_note,''));
  INSERT INTO public.admin_actions (admin_id, action, target_type, target_id) VALUES (auth.uid(), 'review_host_application', 'host_application', _app_id);
  RETURN jsonb_build_object('ok', true);
END; $$;
REVOKE EXECUTE ON FUNCTION public.review_host_application(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_host_application(uuid, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_withdrawal(_diamonds bigint, _method text, _details text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); minimum bigint; new_balance bigint; wid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT coalesce((value->>'withdrawal_minimum')::bigint, 10000) INTO minimum FROM public.app_settings WHERE key = 'economy';
  IF _diamonds < minimum THEN RAISE EXCEPTION 'Minimum withdrawal is % diamonds', minimum; END IF;
  UPDATE public.wallets SET diamonds = diamonds - _diamonds, updated_at = now()
    WHERE user_id = uid AND diamonds >= _diamonds RETURNING diamonds INTO new_balance;
  IF new_balance IS NULL THEN RAISE EXCEPTION 'Not enough diamonds'; END IF;
  INSERT INTO public.withdrawals (host_id, diamonds, payout_method, payout_details)
    VALUES (uid, _diamonds, _method, _details) RETURNING id INTO wid;
  RETURN jsonb_build_object('ok', true, 'id', wid, 'diamonds', new_balance);
END; $$;
REVOKE EXECUTE ON FUNCTION public.request_withdrawal(bigint, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(bigint, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_withdrawal(_id uuid, _status public.withdrawal_status, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.withdrawals;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO w FROM public.withdrawals WHERE id = _id FOR UPDATE;
  IF w.id IS NULL THEN RAISE EXCEPTION 'Not found'; END IF;
  UPDATE public.withdrawals SET status = _status, admin_note = _note, reviewed_by = auth.uid(), reviewed_at = now() WHERE id = _id;
  IF _status = 'rejected' AND w.status <> 'rejected' THEN
    UPDATE public.wallets SET diamonds = diamonds + w.diamonds, updated_at = now() WHERE user_id = w.host_id;
  END IF;
  IF _status = 'completed' THEN
    UPDATE public.wallets SET total_withdrawn = total_withdrawn + w.diamonds WHERE user_id = w.host_id;
  END IF;
  INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (w.host_id, 'withdrawal_' || _status::text, 'Test withdrawal ' || _status::text, coalesce(_note, 'No real money is transferred in TEST MODE.'));
  INSERT INTO public.admin_actions (admin_id, action, target_type, target_id, details)
    VALUES (auth.uid(), 'review_withdrawal', 'withdrawal', _id, jsonb_build_object('status', _status));
  RETURN jsonb_build_object('ok', true);
END; $$;
REVOKE EXECUTE ON FUNCTION public.review_withdrawal(uuid, public.withdrawal_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_withdrawal(uuid, public.withdrawal_status, text) TO authenticated;

-- rankings
CREATE OR REPLACE FUNCTION public.get_rankings(_kind text, _period text, _country text DEFAULT NULL, _limit int DEFAULT 50)
RETURNS TABLE (user_id uuid, username text, display_name text, avatar_url text, country text, level int, score bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE since timestamptz;
BEGIN
  since := CASE _period WHEN 'daily' THEN now() - interval '1 day'
                        WHEN 'weekly' THEN now() - interval '7 days'
                        WHEN 'monthly' THEN now() - interval '30 days'
                        ELSE '-infinity'::timestamptz END;
  IF _kind = 'gifters' THEN
    RETURN QUERY
      SELECT p.id, p.username, p.display_name, p.avatar_url, p.country, p.level, coalesce(sum(t.coins_spent),0)::bigint AS score
      FROM public.gift_transactions t JOIN public.profiles p ON p.id = t.sender_id
      WHERE t.created_at >= since AND (_country IS NULL OR p.country = _country)
      GROUP BY p.id ORDER BY score DESC LIMIT _limit;
  ELSE
    RETURN QUERY
      SELECT p.id, p.username, p.display_name, p.avatar_url, p.country, p.level, coalesce(sum(t.diamonds_earned),0)::bigint AS score
      FROM public.gift_transactions t JOIN public.profiles p ON p.id = t.receiver_id
      WHERE t.created_at >= since AND (_country IS NULL OR p.country = _country)
      GROUP BY p.id ORDER BY score DESC LIMIT _limit;
  END IF;
END; $$;
REVOKE EXECUTE ON FUNCTION public.get_rankings(text, text, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rankings(text, text, text, int) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  RETURN jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'online_users', (SELECT count(*) FROM public.profiles WHERE last_seen_at > now() - interval '5 minutes'),
    'live_rooms', (SELECT count(*) FROM public.live_rooms WHERE status = 'live'),
    'hosts', (SELECT count(*) FROM public.hosts WHERE status = 'active'),
    'pending_host_applications', (SELECT count(*) FROM public.host_applications WHERE status = 'pending'),
    'pending_coin_requests', (SELECT count(*) FROM public.coin_purchase_requests WHERE status = 'pending'),
    'coins_issued', (SELECT coalesce(sum(amount),0) FROM public.coin_transactions WHERE amount > 0),
    'gifts_sent', (SELECT count(*) FROM public.gift_transactions),
    'diamonds', (SELECT coalesce(sum(diamonds),0) FROM public.wallets),
    'pending_withdrawals', (SELECT count(*) FROM public.withdrawals WHERE status = 'pending'),
    'open_reports', (SELECT count(*) FROM public.reports WHERE status = 'open')
  );
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;

-- follow notification
CREATE OR REPLACE FUNCTION public.notify_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nm text;
BEGIN
  SELECT display_name INTO nm FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (NEW.following_id, 'new_follower', 'New follower', coalesce(nm,'Someone') || ' started following you', jsonb_build_object('user_id', NEW.follower_id));
  PERFORM public.add_xp(NEW.follower_id, 5);
  RETURN NULL;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_follow() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER follows_notify AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.notify_follow();

-- notify followers when a host goes live
CREATE OR REPLACE FUNCTION public.notify_go_live()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nm text;
BEGIN
  SELECT display_name INTO nm FROM public.profiles WHERE id = NEW.host_id;
  INSERT INTO public.notifications (user_id, type, title, body, data)
    SELECT f.follower_id, 'host_live', coalesce(nm,'A host') || ' is live now 🔴', NEW.title, jsonb_build_object('room_id', NEW.id)
    FROM public.follows f WHERE f.following_id = NEW.host_id;
  RETURN NULL;
END; $$;
REVOKE EXECUTE ON FUNCTION public.notify_go_live() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER rooms_notify_live AFTER INSERT ON public.live_rooms FOR EACH ROW EXECUTE FUNCTION public.notify_go_live();

ALTER PUBLICATION supabase_realtime ADD TABLE public.pk_battles;
ALTER TABLE public.pk_battles REPLICA IDENTITY FULL;
