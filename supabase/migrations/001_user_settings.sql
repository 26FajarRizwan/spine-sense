-- SpineSense: per-user posture / alert preferences
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_reports_enabled boolean not null default true,
  report_frequency text not null default 'weekly'
    check (report_frequency in ('weekly', 'monthly')),
  slouch_sensitivity integer not null default 20
    check (slouch_sensitivity between 15 and 30),
  grace_period_seconds integer not null default 3
    check (grace_period_seconds in (3, 5, 10)),
  audio_alerts_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_user_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row
  execute function public.set_user_settings_updated_at();

-- Auto-create defaults when a new auth user is created (covers email-confirm flows).
create or replace function public.handle_new_user_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (
    user_id,
    email_reports_enabled,
    report_frequency,
    slouch_sensitivity,
    grace_period_seconds,
    audio_alerts_enabled
  )
  values (new.id, true, 'weekly', 20, 3, true)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_settings on auth.users;
create trigger on_auth_user_created_settings
  after insert on auth.users
  for each row
  execute function public.handle_new_user_settings();

alter table public.user_settings enable row level security;

drop policy if exists "Users can read own settings" on public.user_settings;
create policy "Users can read own settings"
  on public.user_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings"
  on public.user_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
  on public.user_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.user_settings to authenticated;
grant select, insert, update on public.user_settings to service_role;
