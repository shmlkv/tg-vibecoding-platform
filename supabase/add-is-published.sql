-- Migration: Add is_published field to posts
-- Posts are private by default and need to be published by the author

-- Add is_published column (default false)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN is_published boolean NOT NULL DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_posts_is_published ON public.posts (is_published);
  END IF;
END $$;

COMMENT ON COLUMN public.posts.is_published IS 'Whether the post is published and visible to others';
