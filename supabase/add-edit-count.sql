-- Add edit_count to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS edit_count integer NOT NULL DEFAULT 0;
