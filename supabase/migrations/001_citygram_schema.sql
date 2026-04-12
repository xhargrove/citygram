-- CITYGRAM core schema — run in Supabase SQL editor or via CLI
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ——— Cities & neighborhoods ———
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  region TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  tagline TEXT,
  hero_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (city_id, slug)
);

CREATE INDEX idx_neighborhoods_city ON public.neighborhoods(city_id);

-- ——— Interests ———
CREATE TABLE public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL
);

CREATE TABLE public.profile_interests (
  profile_id UUID NOT NULL,
  interest_id UUID NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, interest_id)
);

-- ——— Profiles (1:1 auth.users) ———
CREATE TYPE public.account_type AS ENUM ('standard', 'creator', 'business');
CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'admin');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  username_lower TEXT GENERATED ALWAYS AS (lower(username)) STORED,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  home_city_id UUID REFERENCES public.cities(id),
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  account_type public.account_type NOT NULL DEFAULT 'standard',
  role public.app_role NOT NULL DEFAULT 'user',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profiles_onboarding_city CHECK (
    onboarding_completed = false OR home_city_id IS NOT NULL
  )
);

CREATE INDEX idx_profiles_home_city ON public.profiles(home_city_id);
CREATE INDEX idx_profiles_username_lower ON public.profiles(username_lower);

-- FK after profiles exist
ALTER TABLE public.profile_interests
  ADD CONSTRAINT profile_interests_profile_fk
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ——— Creator / business extensions ———
CREATE TABLE public.creator_profiles (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline TEXT,
  verified_tastemaker_placeholder BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.business_profiles (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT,
  website TEXT,
  verified_local_placeholder BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ——— Posts ———
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
  neighborhood_id UUID REFERENCES public.neighborhoods(id) ON DELETE SET NULL,
  caption TEXT,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  is_sponsored_placeholder BOOLEAN NOT NULL DEFAULT false,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  is_removed BOOLEAN NOT NULL DEFAULT false,
  like_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  save_count INT NOT NULL DEFAULT 0,
  share_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_city_created ON public.posts(city_id, created_at DESC);
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_not_removed ON public.posts(city_id) WHERE is_removed = false;

CREATE TABLE public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  sort_order INT NOT NULL DEFAULT 0,
  width INT,
  height INT,
  duration_seconds INT
);

CREATE INDEX idx_post_media_post ON public.post_media(post_id, sort_order);

CREATE TABLE public.post_tagged_profiles (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tagged_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tagged_profile_id)
);

-- ——— Social ———
CREATE TABLE public.likes (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, profile_id)
);

CREATE TABLE public.saved_posts (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, profile_id)
);

CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_no_self CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_following ON public.follows(following_id);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_post ON public.comments(post_id, created_at);

CREATE TYPE public.notification_type AS ENUM ('follow', 'like', 'comment', 'mention');

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type public.notification_type NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);

-- ——— Events ———
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  organizer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  venue_name TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_city ON public.events(city_id, starts_at);

-- ——— Moderation ———
CREATE TYPE public.report_status AS ENUM ('open', 'reviewed', 'dismissed');

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  reported_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status public.report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reports_target CHECK (
    post_id IS NOT NULL OR reported_profile_id IS NOT NULL
  )
);

-- ——— Triggers ———
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Denormalized counts (kept in sync from app; optional: triggers later)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  base_name TEXT;
  final_username TEXT;
BEGIN
  base_name := COALESCE(split_part(NEW.email, '@', 1), 'voice');
  base_name := regexp_replace(base_name, '[^a-zA-Z0-9_]', '', 'g');
  IF base_name = '' OR base_name IS NULL THEN
    base_name := 'voice';
  END IF;
  final_username := base_name || '_' || substr(replace(NEW.id::text, '-', ''), 1, 10);

  INSERT INTO public.profiles (id, username, display_name, onboarding_completed)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', initcap(base_name)),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- Keep aggregate counts aligned with row tables
CREATE OR REPLACE FUNCTION public.sync_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE PROCEDURE public.sync_like_count();

CREATE OR REPLACE FUNCTION public.sync_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.sync_comment_count();

CREATE OR REPLACE FUNCTION public.sync_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET save_count = save_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_saves_count
  AFTER INSERT OR DELETE ON public.saved_posts
  FOR EACH ROW EXECUTE PROCEDURE public.sync_save_count();

CREATE OR REPLACE FUNCTION public.increment_post_share(p_post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET share_count = share_count + 1
  WHERE id = p_post_id AND NOT is_removed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.increment_post_share(UUID) TO authenticated;

-- ——— RLS ———
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tagged_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Cities: public read
CREATE POLICY cities_select ON public.cities FOR SELECT TO authenticated, anon USING (true);

-- Neighborhoods: public read
CREATE POLICY neighborhoods_select ON public.neighborhoods FOR SELECT TO authenticated, anon USING (true);

-- Interests: public read
CREATE POLICY interests_select ON public.interests FOR SELECT TO authenticated, anon USING (true);

-- Profiles
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Profile interests
CREATE POLICY pi_select ON public.profile_interests FOR SELECT TO authenticated USING (true);
CREATE POLICY pi_write_own ON public.profile_interests FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Creator / business
CREATE POLICY cp_select ON public.creator_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY cp_own ON public.creator_profiles FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

CREATE POLICY bp_select ON public.business_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY bp_own ON public.business_profiles FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Posts: readable if not removed (moderators later: extend policy)
CREATE POLICY posts_select ON public.posts FOR SELECT TO authenticated
  USING (NOT is_removed OR author_id = auth.uid());

CREATE POLICY posts_insert ON public.posts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY posts_update_own ON public.posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

CREATE POLICY posts_admin_update ON public.posts FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin'))
  );

-- Post media
CREATE POLICY pm_select ON public.post_media FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts po WHERE po.id = post_id AND (NOT po.is_removed OR po.author_id = auth.uid())));

CREATE POLICY pm_write ON public.post_media FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts po WHERE po.id = post_id AND po.author_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts po WHERE po.id = post_id AND po.author_id = auth.uid()));

-- Tagged
CREATE POLICY ptp_select ON public.post_tagged_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY ptp_write ON public.post_tagged_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts po WHERE po.id = post_id AND po.author_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts po WHERE po.id = post_id AND po.author_id = auth.uid()));

-- Likes
CREATE POLICY likes_select ON public.likes FOR SELECT TO authenticated USING (true);
CREATE POLICY likes_write ON public.likes FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY likes_delete ON public.likes FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Saves
CREATE POLICY saves_select ON public.saved_posts FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY saves_write ON public.saved_posts FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY saves_delete ON public.saved_posts FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Follows
CREATE POLICY follows_select ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY follows_write ON public.follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY follows_delete ON public.follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- Comments
CREATE POLICY comments_select ON public.comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts po WHERE po.id = post_id AND NOT po.is_removed));
CREATE POLICY comments_insert ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY comments_delete_own ON public.comments FOR DELETE TO authenticated USING (author_id = auth.uid());

-- Notifications
CREATE POLICY notif_select ON public.notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY notif_update ON public.notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid());
CREATE POLICY notif_insert ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Events
CREATE POLICY events_select ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY events_insert ON public.events FOR INSERT TO authenticated WITH CHECK (organizer_profile_id = auth.uid());

-- Reports
CREATE POLICY reports_insert ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY reports_select ON public.reports FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin'))
  );
