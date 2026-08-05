create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Fictional Visitor',
  created_at timestamptz not null default now()
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  title text not null,
  body_ciphertext_or_body text not null,
  weather text,
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid references public.diary_entries(id) on delete cascade,
  kind text not null,
  storage_path text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.scrapbook_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.diary_entries(id) on delete cascade,
  canvas_json jsonb not null default '{}'::jsonb,
  preview_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memory_graphs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.diary_entries(id) on delete cascade,
  graph_json jsonb not null,
  schema_version text not null,
  generation_status text not null default 'fixture',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null references public.diary_entries(id) on delete cascade,
  graph_id uuid references public.memory_graphs(id) on delete set null,
  portal_state text not null default 'imported',
  completion_state text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.character_aliases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  canonical_id text not null,
  alias text not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.diary_entries enable row level security;
alter table public.media_assets enable row level security;
alter table public.scrapbook_pages enable row level security;
alter table public.memory_graphs enable row level security;
alter table public.chapters enable row level security;
alter table public.character_aliases enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "diary_entries_all_own" on public.diary_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "media_assets_all_own" on public.media_assets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "scrapbook_pages_all_own" on public.scrapbook_pages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memory_graphs_all_own" on public.memory_graphs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "chapters_all_own" on public.chapters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "character_aliases_all_own" on public.character_aliases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
