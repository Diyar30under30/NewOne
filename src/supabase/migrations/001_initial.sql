-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  city TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'contrast')),
  is_pro BOOLEAN DEFAULT false,
  pro_expires_at TIMESTAMPTZ,
  coins INTEGER DEFAULT 0,
  skin_id TEXT DEFAULT 'classic',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stats
CREATE TABLE IF NOT EXISTS public.stats (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  best_time_easy INTEGER,
  best_time_medium INTEGER,
  best_time_hard INTEGER,
  longest_win_streak INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  elo INTEGER DEFAULT 1000
);

-- Game history
CREATE TABLE IF NOT EXISTS public.game_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'blitz', 'custom')),
  seed BIGINT,
  result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
  time_ms INTEGER NOT NULL,
  accuracy FLOAT,
  played_at TIMESTAMPTZ DEFAULT now(),
  board_snapshot TEXT
);
CREATE INDEX IF NOT EXISTS game_history_user_id_idx ON public.game_history(user_id);
CREATE INDEX IF NOT EXISTS game_history_played_at_idx ON public.game_history(played_at DESC);

-- Daily challenge
CREATE TABLE IF NOT EXISTS public.daily_challenge (
  date DATE PRIMARY KEY,
  seed BIGINT NOT NULL,
  width INTEGER DEFAULT 12,
  height INTEGER DEFAULT 12,
  mines INTEGER DEFAULT 25
);

-- Daily results
CREATE TABLE IF NOT EXISTS public.daily_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_ms INTEGER NOT NULL,
  accuracy FLOAT,
  finished_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS daily_results_date_idx ON public.daily_results(date);

-- Skins
CREATE TABLE IF NOT EXISTS public.skins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cell', 'flag', 'mine', 'number', 'complete')),
  price_coins INTEGER DEFAULT 0,
  price_usd FLOAT,
  css_class TEXT NOT NULL,
  preview_url TEXT,
  emoji TEXT,
  description TEXT,
  is_premium BOOLEAN DEFAULT false
);

-- User skins
CREATE TABLE IF NOT EXISTS public.user_skins (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skin_id TEXT REFERENCES public.skins(id),
  equipped BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, skin_id)
);

-- Multiplayer rooms
CREATE TABLE IF NOT EXISTS public.multiplayer_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  mode TEXT NOT NULL CHECK (mode IN ('duel', 'coop', 'battle', 'league')),
  difficulty TEXT NOT NULL DEFAULT 'medium',
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  seed BIGINT NOT NULL,
  players JSONB DEFAULT '[]'::jsonb,
  is_private BOOLEAN DEFAULT false,
  password TEXT,
  max_players INTEGER DEFAULT 2,
  league_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rooms_status_idx ON public.multiplayer_rooms(status);

-- Clans
CREATE TABLE IF NOT EXISTS public.clans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  members JSONB DEFAULT '[]'::jsonb,
  weekly_wins INTEGER DEFAULT 0,
  emoji TEXT DEFAULT '🛡️',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT DEFAULT '🏅',
  reward_coins INTEGER DEFAULT 20,
  reward_skin_id TEXT,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL
);

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES public.achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

-- ======== ROW LEVEL SECURITY ========

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenge ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Stats policies
CREATE POLICY "Stats are viewable by everyone" ON public.stats FOR SELECT USING (true);
CREATE POLICY "Users can upsert own stats" ON public.stats FOR ALL USING (auth.uid() = user_id);

-- Game history policies
CREATE POLICY "Users can view own history" ON public.game_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.game_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily results policies
CREATE POLICY "Daily results are viewable by everyone" ON public.daily_results FOR SELECT USING (true);
CREATE POLICY "Users can insert own daily results" ON public.daily_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User skins policies
CREATE POLICY "Users can view own skins" ON public.user_skins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own skins" ON public.user_skins FOR ALL USING (auth.uid() = user_id);

-- Multiplayer rooms policies
CREATE POLICY "Rooms are viewable by everyone" ON public.multiplayer_rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON public.multiplayer_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update rooms" ON public.multiplayer_rooms FOR UPDATE USING (auth.uid() = host_id);

-- Skins and achievements are public read
CREATE POLICY "Skins are viewable by everyone" ON public.skins FOR SELECT USING (true);
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Daily challenge viewable by everyone" ON public.daily_challenge FOR SELECT USING (true);

-- User achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Clans
CREATE POLICY "Clans are viewable by everyone" ON public.clans FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create clans" ON public.clans FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Clan owners can update" ON public.clans FOR UPDATE USING (auth.uid() = owner_id);

-- ======== FUNCTIONS & TRIGGERS ========

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, coins)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    50
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ======== SEED DATA ========

INSERT INTO public.skins (id, name, type, price_coins, css_class, emoji, description) VALUES
  ('classic', 'Классика', 'complete', 0, 'skin-classic', '🎮', 'Оригинальный стиль Windows'),
  ('cyberpunk', 'Киберпанк', 'complete', 200, 'skin-cyberpunk', '⚡', 'Неоновый стиль будущего'),
  ('space', 'Космос', 'complete', 250, 'skin-space', '🚀', 'Галактические поля'),
  ('pixel', 'Пиксель Арт', 'complete', 150, 'skin-pixel', '👾', '8-битная ностальгия'),
  ('xmas', 'Новогодний', 'complete', 100, 'skin-xmas', '🎄', 'Праздничные мины'),
  ('cute', 'Милый', 'complete', 175, 'skin-cute', '🌸', 'Розовый и уютный')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.achievements (id, name, description, emoji, reward_coins, condition_type, condition_value) VALUES
  ('first_win', 'Первая победа', 'Выиграйте первую партию', '🎯', 20, 'wins', 1),
  ('win_10', '10 побед', 'Выиграйте 10 партий', '🏆', 50, 'wins', 10),
  ('win_100', '100 побед', 'Выиграйте 100 партий', '👑', 200, 'wins', 100),
  ('streak_5', 'Серия 5', '5 побед подряд', '🔥', 75, 'streak', 5),
  ('streak_10', 'Неостановимый', '10 побед подряд', '⚡', 150, 'streak', 10),
  ('daily_1', 'Daily player', 'Пройдите Daily Challenge', '📅', 40, 'daily', 1),
  ('hard_win', 'Мастер сапёр', 'Выиграйте на сложном уровне', '💎', 100, 'wins', 1)
ON CONFLICT (id) DO NOTHING;
