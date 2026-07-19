-- GoalCage database schema
-- Run this once in Supabase: Project -> SQL Editor -> New Query -> paste -> Run

-- ============ PROFILES ============
-- One row per user, created automatically when they sign up.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  cage_coins integer not null default 100,
  tier text not null default 'bronze' check (tier in ('bronze','silver','gold','platinum','diamond','optimus')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile (with starter 100 Cage Coins) whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, cage_coins)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    100
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ TOURNAMENTS ============
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tier text not null check (tier in ('bronze','silver','gold','platinum','diamond','optimus')),
  entry_fee integer not null,
  prize_pool integer not null,
  max_players integer not null default 12,
  status text not null default 'open' check (status in ('open','full','in_progress','completed','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.tournaments enable row level security;

create policy "Tournaments are viewable by everyone"
  on public.tournaments for select
  using (true);

-- ============ TOURNAMENT ENTRIES ============
create table if not exists public.tournament_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);

alter table public.tournament_entries enable row level security;

create policy "Entries are viewable by everyone"
  on public.tournament_entries for select
  using (true);

-- ============ JOIN TOURNAMENT (atomic) ============
-- Deducts the entry fee and creates the entry in a single transaction so two
-- rapid clicks (or two tabs) can't double-spend the same coins.
create or replace function public.join_tournament(p_tournament_id uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_fee integer;
  v_max integer;
  v_current_players integer;
  v_balance integer;
begin
  if v_user_id is null then
    raise exception 'Not signed in';
  end if;

  select entry_fee, max_players into v_fee, v_max
  from public.tournaments
  where id = p_tournament_id and status = 'open'
  for update;

  if v_fee is null then
    raise exception 'Tournament not found or not open';
  end if;

  select count(*) into v_current_players
  from public.tournament_entries
  where tournament_id = p_tournament_id;

  if v_current_players >= v_max then
    update public.tournaments set status = 'full' where id = p_tournament_id;
    raise exception 'Tournament is full';
  end if;

  select cage_coins into v_balance
  from public.profiles
  where id = v_user_id
  for update;

  if v_balance < v_fee then
    raise exception 'Not enough Cage Coins';
  end if;

  insert into public.tournament_entries (tournament_id, user_id)
  values (p_tournament_id, v_user_id);

  update public.profiles
  set cage_coins = cage_coins - v_fee
  where id = v_user_id;

  if v_current_players + 1 >= v_max then
    update public.tournaments set status = 'full' where id = p_tournament_id;
  end if;

  return json_build_object('success', true, 'new_balance', v_balance - v_fee);
end;
$$;

-- ============ SEED DATA ============
insert into public.tournaments (name, tier, entry_fee, prize_pool, max_players) values
  ('Lagos Bronze Cage', 'bronze', 20, 200, 12),
  ('Ketu Bronze Cage', 'bronze', 20, 200, 12),
  ('Ogun Silver Cage', 'silver', 50, 500, 12),
  ('Ikeja Gold Cage', 'gold', 100, 1000, 12),
  ('Lagos Platinum Cage', 'platinum', 200, 2000, 16),
  ('Naija Diamond Cage', 'diamond', 400, 4000, 16),
  ('Optimus Championship', 'optimus', 1000, 12000, 16)
on conflict do nothing;
