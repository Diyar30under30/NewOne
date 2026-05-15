-- ============================================================
-- Migration 002: Bug fixes and missing features
-- Run this in Supabase SQL Editor after 001_initial.sql
-- ============================================================

-- 1. Add missing best_time_blitz column to stats
ALTER TABLE public.stats ADD COLUMN IF NOT EXISTS best_time_blitz INTEGER;

-- 2. Fix stats RLS: FOR ALL with only USING doesn't guarantee WITH CHECK on INSERT
DROP POLICY IF EXISTS "Users can upsert own stats" ON public.stats;
CREATE POLICY "Stats are readable by everyone"   ON public.stats FOR SELECT USING (true);
CREATE POLICY "Users can insert own stats"        ON public.stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats"        ON public.stats FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Fix multiplayer rooms: non-host players also need to update the players array
DROP POLICY IF EXISTS "Host can update rooms" ON public.multiplayer_rooms;
CREATE POLICY "Authenticated users can update rooms" ON public.multiplayer_rooms
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Host can delete own rooms" ON public.multiplayer_rooms
  FOR DELETE USING (auth.uid() = host_id);

-- 4. Atomic skin purchase — prevents the race condition where coins are deducted
--    without the skin being recorded (or vice-versa)
CREATE OR REPLACE FUNCTION public.purchase_skin(p_skin_id TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price   INTEGER;
  v_coins   INTEGER;
  v_owned   BOOLEAN;
BEGIN
  SELECT price_coins INTO v_price FROM public.skins WHERE id = p_skin_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Skin not found');
  END IF;

  SELECT coins INTO v_coins FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_skins WHERE user_id = p_user_id AND skin_id = p_skin_id
  ) INTO v_owned;
  IF v_owned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already owned');
  END IF;

  IF v_coins < v_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
  END IF;

  INSERT INTO public.user_skins (user_id, skin_id, equipped, purchased_at)
    VALUES (p_user_id, p_skin_id, false, now());

  UPDATE public.profiles SET coins = coins - v_price WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'new_coins', v_coins - v_price);
END;
$$;

-- 5. Save daily result (idempotent — ignores duplicate attempts)
CREATE OR REPLACE FUNCTION public.save_daily_result(
  p_user_id  UUID,
  p_date     DATE,
  p_time_ms  INTEGER,
  p_accuracy FLOAT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.daily_results (user_id, date, time_ms, accuracy, finished_at)
    VALUES (p_user_id, p_date, p_time_ms, p_accuracy, now())
    ON CONFLICT (user_id, date) DO NOTHING;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 6. Fix handle_new_user trigger to support OAuth providers (Google/GitHub)
--    that may send name/full_name instead of username, or have no email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_suffix   INT := 0;
  v_base     TEXT;
BEGIN
  -- Prefer explicit username, then OAuth name fields, then email prefix, then ID fragment
  v_base := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(split_part(COALESCE(NEW.email, ''), '@', 1)), ''),
    'user_' || substr(NEW.id::text, 1, 8)
  );

  -- Strip characters that are not alphanumeric/underscore
  v_base := regexp_replace(v_base, '[^a-zA-Z0-9_]', '_', 'g');
  v_username := v_base;

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_suffix := v_suffix + 1;
    v_username := v_base || '_' || v_suffix;
  END LOOP;

  INSERT INTO public.profiles (id, username, email, coins)
    VALUES (NEW.id, v_username, NEW.email, 50)
    ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.stats (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger (in case it was previously created without OR REPLACE support)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Grant execute permissions on new functions to authenticated users
GRANT EXECUTE ON FUNCTION public.purchase_skin(TEXT, UUID)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_daily_result(UUID, DATE, INTEGER, FLOAT) TO authenticated;
