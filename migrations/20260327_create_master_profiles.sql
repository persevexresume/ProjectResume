-- Create master_profiles table for AI-parsed profile JSON persistence.
create extension if not exists pgcrypto;

create table if not exists public.master_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_master_profiles_user_id
  on public.master_profiles(user_id);

create index if not exists idx_master_profiles_updated_at
  on public.master_profiles(updated_at desc);

create or replace function public.set_master_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_master_profiles_updated_at on public.master_profiles;
create trigger trg_master_profiles_updated_at
before update on public.master_profiles
for each row
execute function public.set_master_profiles_updated_at();
