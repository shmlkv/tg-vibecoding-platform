-- Migration: Add user settings and update posts to link with projects
-- Run this in Supabase SQL Editor

-- 1. Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id bigint primary key references public.users(id) on delete cascade,
  openrouter_api_key text,
  selected_model text default 'x-ai/grok-4.1-fast:free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for user_settings
DROP TRIGGER IF EXISTS set_updated_at_user_settings ON public.user_settings;
CREATE TRIGGER set_updated_at_user_settings
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (user_id = current_setting('request.jwt.claim.sub', true)::bigint OR true);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can upsert their own settings" ON public.user_settings;
CREATE POLICY "Users can upsert their own settings"
  ON public.user_settings FOR UPDATE
  USING (true);

-- 2. Add project_id to posts table (nullable, references projects)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN project_id bigint references public.projects(id) on delete set null;
    CREATE INDEX IF NOT EXISTS idx_posts_project_id ON public.posts (project_id);
  END IF;
END $$;

-- 3. Make v0 fields nullable since we're moving to OpenRouter
DO $$
BEGIN
  -- Make v0_project_id nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'v0_project_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.posts ALTER COLUMN v0_project_id DROP NOT NULL;
  END IF;

  -- Make v0_chat_id nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'v0_chat_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.posts ALTER COLUMN v0_chat_id DROP NOT NULL;
  END IF;

  -- Make v0_demo_url nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'v0_demo_url' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.posts ALTER COLUMN v0_demo_url DROP NOT NULL;
  END IF;
END $$;

COMMENT ON TABLE public.user_settings IS 'User settings including OpenRouter API keys and model preferences';
COMMENT ON COLUMN public.posts.project_id IS 'Reference to the generated HTML project in projects table';
