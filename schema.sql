-- FacelessReels-clone schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Assumes auth.users already exists (Supabase Auth).

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'inactive',
  timezone text default 'UTC',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Connected social accounts (OAuth tokens)
-- ---------------------------------------------------------------
create table if not exists public.connected_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('youtube', 'instagram', 'tiktok')),
  platform_account_id text not null,
  display_name text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  connected_at timestamptz not null default now(),
  unique (user_id, platform, platform_account_id)
);

-- ---------------------------------------------------------------
-- Niches: the content topic/persona driving script generation
-- ---------------------------------------------------------------
create table if not exists public.niches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  tone text default 'engaging, punchy, short sentences',
  target_length_seconds int default 45,
  posting_time text default '09:00', -- local HH:MM, interpreted via profiles.timezone
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Videos: one row per generated video, tracks the full pipeline
-- ---------------------------------------------------------------
create table if not exists public.videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  niche_id uuid references public.niches(id) on delete set null,
  title text,
  script text,
  scenes jsonb, -- [{ narration, imagePrompt, imageUrl }], populated as the pipeline progresses
  voiceover_url text,
  image_urls text[],
  subtitle_srt text,
  video_url text,
  thumbnail_url text,
  status text not null default 'queued' check (
    status in (
      'queued', 'script_ready', 'voice_ready', 'images_ready',
      'rendering', 'ready', 'scheduled', 'publishing', 'published', 'failed'
    )
  ),
  error_message text,
  duration_seconds int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Schedule: which video goes to which platform(s) at what time
-- ---------------------------------------------------------------
create table if not exists public.schedule_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  connected_account_id uuid not null references public.connected_accounts(id) on delete cascade,
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (
    status in ('pending', 'publishing', 'published', 'failed', 'cancelled')
  ),
  platform_post_id text,
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Analytics snapshots pulled back from each platform
-- ---------------------------------------------------------------
create table if not exists public.video_analytics (
  id uuid primary key default uuid_generate_v4(),
  schedule_item_id uuid not null references public.schedule_items(id) on delete cascade,
  platform text not null,
  views bigint default 0,
  likes bigint default 0,
  comments bigint default 0,
  shares bigint default 0,
  watch_time_seconds bigint default 0,
  captured_at timestamptz not null default now()
);

create index if not exists idx_videos_user on public.videos(user_id);
create index if not exists idx_schedule_pending on public.schedule_items(status, scheduled_for);
create index if not exists idx_connected_user on public.connected_accounts(user_id);
create index if not exists idx_analytics_schedule on public.video_analytics(schedule_item_id);

-- ---------------------------------------------------------------
-- Row Level Security: every table scoped to the owning user
-- ---------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.niches enable row level security;
alter table public.videos enable row level security;
alter table public.schedule_items enable row level security;
alter table public.video_analytics enable row level security;

create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "connected_accounts_owner" on public.connected_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "niches_owner" on public.niches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "videos_owner" on public.videos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "schedule_owner" on public.schedule_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "analytics_owner" on public.video_analytics
  for select using (
    exists (
      select 1 from public.schedule_items si
      where si.id = video_analytics.schedule_item_id
      and si.user_id = auth.uid()
    )
  );

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
