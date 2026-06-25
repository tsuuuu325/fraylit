-- ============================================================================
-- Fraylit — Supabase schema, RLS policies, and signup trigger
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS guards.
-- ============================================================================

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'post_mode') then
    create type post_mode as enum ('opening_closing', 'plot_twist');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type notification_type as enum ('like', 'comment');
  end if;
end$$;

-- Tables --------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique,
  display_name text not null,
  avatar_url   text,
  bio          text,
  created_at   timestamptz not null default now(),
  constraint username_format check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  constraint bio_length check (bio is null or char_length(bio) <= 280),
  constraint display_name_length check (char_length(display_name) between 1 and 50)
);

create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  mode          post_mode not null,
  opening_lines text,
  closing_lines text,
  twist_lines   text,
  created_at    timestamptz not null default now(),
  constraint opening_len check (opening_lines is null or char_length(opening_lines) <= 300),
  constraint closing_len check (closing_lines is null or char_length(closing_lines) <= 300),
  constraint twist_len   check (twist_lines   is null or char_length(twist_lines)   <= 300),
  constraint mode_shape check (
    (mode = 'opening_closing'
       and (opening_lines is not null or closing_lines is not null)
       and twist_lines is null)
    or
    (mode = 'plot_twist'
       and twist_lines is not null
       and opening_lines is null
       and closing_lines is null)
  )
);

create table if not exists public.likes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  post_id    uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  post_id    uuid not null references public.posts (id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now(),
  constraint content_len check (char_length(content) between 1 and 500)
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  actor_id   uuid not null references public.profiles (id) on delete cascade,
  post_id    uuid not null references public.posts (id) on delete cascade,
  type       notification_type not null,
  comment_id uuid references public.comments (id) on delete cascade,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes -------------------------------------------------------------------
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists likes_post_id_idx on public.likes (post_id);
create index if not exists comments_post_id_idx on public.comments (post_id, created_at);
create index if not exists profiles_username_idx on public.profiles (lower(username));
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where read_at is null;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.likes    enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- posts ---------------------------------------------------------------------
drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts
  for select using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts
  for delete using (auth.uid() = user_id);

-- likes ---------------------------------------------------------------------
drop policy if exists "likes_select_all" on public.likes;
create policy "likes_select_all" on public.likes
  for select using (true);

drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own" on public.likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own" on public.likes
  for delete using (auth.uid() = user_id);

-- comments ------------------------------------------------------------------
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments
  for select using (true);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = user_id);

-- notifications -------------------------------------------------------------
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- Notification triggers
-- ============================================================================
create or replace function public.notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select p.user_id into owner_id from public.posts p where p.id = new.post_id;
  if owner_id is null or owner_id = new.user_id then
    return new;
  end if;
  insert into public.notifications (user_id, actor_id, post_id, type)
  values (owner_id, new.user_id, new.post_id, 'like');
  return new;
end;
$$;

create or replace function public.remove_like_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications n
  where n.type = 'like'
    and n.post_id = old.post_id
    and n.actor_id = old.user_id;
  return old;
end;
$$;

create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select p.user_id into owner_id from public.posts p where p.id = new.post_id;
  if owner_id is null or owner_id = new.user_id then
    return new;
  end if;
  insert into public.notifications (user_id, actor_id, post_id, type, comment_id)
  values (owner_id, new.user_id, new.post_id, 'comment', new.id);
  return new;
end;
$$;

drop trigger if exists on_like_notify on public.likes;
create trigger on_like_notify
  after insert on public.likes
  for each row execute function public.notify_on_like();

drop trigger if exists on_like_unnotify on public.likes;
create trigger on_like_unnotify
  after delete on public.likes
  for each row execute function public.remove_like_notification();

drop trigger if exists on_comment_notify on public.comments;
create trigger on_comment_notify
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- ============================================================================
-- Signup trigger: auto-create a profile row for every new auth user.
-- Reads username / display_name / avatar from user metadata when present
-- (email signup), and falls back to sensible values for OAuth (Google).
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  desired_username text;
  final_username text;
  base_name text;
  display text;
begin
  -- Preferred username from metadata, else derived from email local part.
  desired_username := nullif(meta->>'username', '');
  if desired_username is null then
    base_name := regexp_replace(split_part(coalesce(new.email, 'user'), '@', 1), '[^a-zA-Z0-9_]', '', 'g');
    if char_length(base_name) < 3 then
      base_name := 'user';
    end if;
    desired_username := left(base_name, 14);
  end if;

  -- Ensure uniqueness + format by appending a short random suffix if needed.
  final_username := left(regexp_replace(desired_username, '[^a-zA-Z0-9_]', '', 'g'), 20);
  if char_length(final_username) < 3 then
    final_username := 'user';
  end if;
  if exists (select 1 from public.profiles p where lower(p.username) = lower(final_username)) then
    final_username := left(final_username, 13) || '_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;

  display := coalesce(
    nullif(meta->>'display_name', ''),
    nullif(meta->>'full_name', ''),
    nullif(meta->>'name', ''),
    final_username
  );

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    final_username,
    left(display, 50),
    coalesce(nullif(meta->>'avatar_url', ''), nullif(meta->>'picture', ''))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Realtime: expose tables so the client can subscribe to changes.
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'likes'
  ) then
    alter publication supabase_realtime add table public.likes;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end$$;
