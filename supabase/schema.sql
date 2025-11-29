-- Supabase schema for Telegram Mini App posts with v0 projects
-- Run in the Supabase SQL editor.

-- Extensions
create extension if not exists "pgcrypto";

-- Telegram users
create table if not exists public.users (
  id bigint primary key,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  language_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generated posts with references to v0
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  prompt text not null,
  user_id bigint references public.users(id) on delete set null,
  v0_project_id text not null,
  v0_project_web_url text,
  v0_chat_id text not null,
  v0_demo_url text not null,
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Post likes
create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id bigint references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Keep updated_at in sync
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_users on public.users;
create trigger set_updated_at_users
before update on public.users
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_posts on public.posts;
create trigger set_updated_at_posts
before update on public.posts
for each row execute procedure public.set_updated_at();

-- Keep likes_count cached on posts
create or replace function public.sync_likes_count() returns trigger as $$
declare
  target uuid;
begin
  target := coalesce(new.post_id, old.post_id);
  update public.posts
  set likes_count = (
    select count(*) from public.post_likes where post_id = target
  )
  where id = target;
  return null;
end;
$$ language plpgsql;

drop trigger if exists sync_likes_count_insert on public.post_likes;
create trigger sync_likes_count_insert
after insert on public.post_likes
for each row execute procedure public.sync_likes_count();

drop trigger if exists sync_likes_count_delete on public.post_likes;
create trigger sync_likes_count_delete
after delete on public.post_likes
for each row execute procedure public.sync_likes_count();

-- Helpful indexes
create index if not exists idx_posts_user_created_at on public.posts (user_id, created_at desc);
create index if not exists idx_post_likes_user on public.post_likes (user_id);
