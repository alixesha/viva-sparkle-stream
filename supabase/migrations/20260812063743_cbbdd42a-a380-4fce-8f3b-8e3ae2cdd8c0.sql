ALTER TABLE public.gifts
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'popular',
  ADD COLUMN IF NOT EXISTS sound_key TEXT,
  ADD COLUMN IF NOT EXISTS sound_url TEXT,
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER NOT NULL DEFAULT 3000;

CREATE UNIQUE INDEX IF NOT EXISTS gifts_animation_key_uidx ON public.gifts (animation_key);

-- deactivate legacy catalog rows; the canonical 20 are upserted below
UPDATE public.gifts SET is_active = false;

INSERT INTO public.gifts (name, icon, animation_key, sound_key, tier, category, coin_price, diamond_reward, duration_ms, sort_order, is_active) VALUES
  ('Rose',              '🌹', 'rose',      'rose',      'basic',     'popular', 10,     5,   2000, 1,  true),
  ('Heart',             '❤️', 'heart',     'heart',     'basic',     'popular', 20,     10,  2000, 2,  true),
  ('Star',              '⭐', 'star',      'star',      'basic',     'popular', 30,     15,  2200, 3,  true),
  ('Kiss',              '💋', 'kiss',      'kiss',      'basic',     'popular', 50,     25,  2200, 4,  true),
  ('Fire',              '🔥', 'fire',      'fire',      'basic',     'popular', 99,     50,  2600, 5,  true),
  ('Crown',             '👑', 'crown',     'crown',     'premium',   'premium', 499,    250, 4000, 6,  true),
  ('Diamond',           '💎', 'diamond',   'diamond',   'premium',   'premium', 999,    500, 4200, 7,  true),
  ('Rocket',            '🚀', 'rocket',    'rocket',    'premium',   'premium', 1499,   750, 4200, 8,  true),
  ('Supercar',          '🏎️', 'supercar',  'supercar',  'premium',   'premium', 1999,   1000,4500, 9,  true),
  ('Eagle',             '🦅', 'eagle',     'eagle',     'premium',   'premium', 2499,   1250,4500, 10, true),
  ('Tiger',             '🐯', 'tiger',     'tiger',     'premium',   'premium', 2999,   1500,4500, 11, true),
  ('Unicorn',           '🦄', 'unicorn',   'unicorn',   'premium',   'premium', 3499,   1750,4800, 12, true),
  ('Lion',              '🦁', 'lion',      'lion',      'legendary', 'legendary', 4999, 2500,6500, 13, true),
  ('Dragon',            '🐉', 'dragon',    'dragon',    'legendary', 'legendary', 6999, 3500,7000, 14, true),
  ('Phoenix',           '🕊️', 'phoenix',   'phoenix',   'legendary', 'legendary', 8999, 4500,7000, 15, true),
  ('Magic Castle',      '🏰', 'castle',    'castle',    'legendary', 'legendary', 11999,6000,7500, 16, true),
  ('Galaxy',            '🌌', 'galaxy',    'galaxy',    'legendary', 'legendary', 14999,7500,8000, 17, true),
  ('Thunder God',       '⚡', 'thunder',   'thunder',   'legendary', 'legendary', 17999,9000,7500, 18, true),
  ('Volcano',           '🌋', 'volcano',   'volcano',   'legendary', 'legendary', 21999,11000,8000,19, true),
  ('Legendary Universe','🪐', 'universe',  'universe',  'legendary', 'legendary', 29999,15000,9500,20, true)
ON CONFLICT (animation_key) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sound_key = EXCLUDED.sound_key,
  tier = EXCLUDED.tier,
  category = EXCLUDED.category,
  coin_price = EXCLUDED.coin_price,
  diamond_reward = EXCLUDED.diamond_reward,
  duration_ms = EXCLUDED.duration_ms,
  sort_order = EXCLUDED.sort_order,
  is_active = true;