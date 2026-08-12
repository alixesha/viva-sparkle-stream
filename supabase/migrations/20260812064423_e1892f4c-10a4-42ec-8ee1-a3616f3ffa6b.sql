CREATE OR REPLACE FUNCTION public.send_gift(_gift_id uuid, _receiver_id uuid, _room_id uuid, _quantity integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  g public.gifts;
  cost bigint; reward bigint; new_balance bigint; tx_id uuid;
  sender_name text; sender_avatar text; battle public.pk_battles;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _quantity IS NULL OR _quantity < 1 OR _quantity > 100 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
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
          'sound_key', g.sound_key, 'sound_url', g.sound_url, 'duration_ms', g.duration_ms,
          'sender_avatar', sender_avatar,
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
END; $function$;