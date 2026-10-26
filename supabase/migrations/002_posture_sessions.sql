alter table public.user_settings
  add column if not exists audio_volume real not null default 0.7
  check (audio_volume between 0 and 1);

create table if not exists public.posture_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  duration_seconds integer not null check (duration_seconds >= 0),
  average_score numeric(5, 2) not null check (average_score between 0 and 100),
  slump_count integer not null default 0 check (slump_count >= 0),
  created_at timestamptz not null default now()
);

create index if not exists posture_sessions_user_created_at_idx
  on public.posture_sessions (user_id, created_at desc);

alter table public.posture_sessions enable row level security;

drop policy if exists "Users can read own posture sessions" on public.posture_sessions;
create policy "Users can read own posture sessions"
  on public.posture_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own posture sessions" on public.posture_sessions;
create policy "Users can insert own posture sessions"
  on public.posture_sessions
  for insert
  with check (auth.uid() = user_id);

grant select, insert on public.posture_sessions to authenticated;
grant select, insert, update on public.user_settings to authenticated;
