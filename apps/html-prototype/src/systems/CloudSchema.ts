export const privateCloudSchemaSql = `
create table if not exists public.diary_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry jsonb not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.journey_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.chapter_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id text not null,
  progress jsonb not null,
  last_played_content_version integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);

create table if not exists public.reflection_notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  note jsonb not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.muji_room_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.music_tracks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  metadata jsonb not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.diary_entries enable row level security;
alter table public.journey_states enable row level security;
alter table public.chapter_progress enable row level security;
alter table public.reflection_notes enable row level security;
alter table public.muji_room_states enable row level security;
alter table public.music_tracks enable row level security;

create policy "diary owner access" on public.diary_entries for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "journey owner access" on public.journey_states for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "chapter progress owner access" on public.chapter_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reflection owner access" on public.reflection_notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "room owner access" on public.muji_room_states for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "music owner access" on public.music_tracks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
`;

export const privateStoragePolicySql = `
insert into storage.buckets (id, name, public)
values ('walk-private-media', 'walk-private-media', false)
on conflict (id) do update set public = false;

create policy "private media owner read" on storage.objects
for select using (
  bucket_id = 'walk-private-media'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "private media owner write" on storage.objects
for insert with check (
  bucket_id = 'walk-private-media'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "private media owner update" on storage.objects
for update using (
  bucket_id = 'walk-private-media'
  and split_part(name, '/', 1) = auth.uid()::text
) with check (
  bucket_id = 'walk-private-media'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "private media owner delete" on storage.objects
for delete using (
  bucket_id = 'walk-private-media'
  and split_part(name, '/', 1) = auth.uid()::text
);
`;
