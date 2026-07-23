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
  ('Bronze Cage', 'bronze', 20, 200, 12),
  ('Bronze Cage', 'bronze', 20, 200, 12),
  ('Silver Cage', 'silver', 50, 500, 12),
  ('Gold Cage', 'gold', 100, 1000, 12),
  ('Platinum Cage', 'platinum', 200, 2000, 16),
  ('Diamond Cage', 'diamond', 400, 4000, 16),
  ('Optimus Championship', 'optimus', 1000, 12000, 16)
on conflict do nothing;

-- ======================================================================
-- MIGRATION 2: Matches, dual-screenshot verification, tier promotion
-- Run this in the SQL Editor after the section above already exists.
-- ======================================================================

alter table public.profiles add column if not exists wins integer not null default 0;
alter table public.profiles add column if not exists losses integer not null default 0;
alter table public.profiles add column if not exists tier_wins integer not null default 0;

-- ============ MATCHES ============
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round integer not null default 1,
  player1_id uuid references public.profiles(id) on delete cascade,
  player2_id uuid references public.profiles(id) on delete cascade,
  player1_score integer,
  player2_score integer,
  winner_id uuid references public.profiles(id),
  status text not null default 'pending'
    check (status in ('pending','awaiting_opponent','disputed','completed','bye')),
  created_at timestamptz not null default now()
);

alter table public.matches enable row level security;

create policy "Matches are viewable by everyone"
  on public.matches for select
  using (true);

create index if not exists matches_tournament_round_idx
  on public.matches (tournament_id, round);

-- ============ MATCH SCREENSHOTS ============
create table if not exists public.match_screenshots (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  claimed_my_score integer not null,
  claimed_opponent_score integer not null,
  raw_ocr_text text,
  submitted_at timestamptz not null default now(),
  unique (match_id, user_id)
);

alter table public.match_screenshots enable row level security;

create policy "Screenshots viewable by match participants"
  on public.match_screenshots for select
  using (
    auth.uid() = user_id
    or auth.uid() in (
      select player1_id from public.matches where id = match_id
      union
      select player2_id from public.matches where id = match_id
    )
  );

-- ============ STORAGE BUCKET FOR SCREENSHOTS ============
insert into storage.buckets (id, name, public)
values ('match-screenshots', 'match-screenshots', false)
on conflict (id) do nothing;

create policy "Users can upload their own match screenshots"
  on storage.objects for insert
  with check (
    bucket_id = 'match-screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view screenshots from their own matches"
  on storage.objects for select
  using (
    bucket_id = 'match-screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============ START TOURNAMENT (build round 1 bracket) ============
create or replace function public.start_tournament(p_tournament_id uuid)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_status text;
  v_entrant uuid;
  v_entrants uuid[];
  v_prev uuid;
  v_i integer := 0;
begin
  select status into v_status from public.tournaments where id = p_tournament_id for update;

  if v_status is null then
    raise exception 'Tournament not found';
  end if;

  if v_status <> 'full' then
    raise exception 'Tournament is not full yet';
  end if;

  if exists (select 1 from public.matches where tournament_id = p_tournament_id) then
    return json_build_object('success', true, 'already_started', true);
  end if;

  select array_agg(user_id order by random()) into v_entrants
  from public.tournament_entries
  where tournament_id = p_tournament_id;

  foreach v_entrant in array v_entrants loop
    v_i := v_i + 1;
    if v_i % 2 = 1 then
      v_prev := v_entrant;
    else
      insert into public.matches (tournament_id, round, player1_id, player2_id, status)
      values (p_tournament_id, 1, v_prev, v_entrant, 'pending');
    end if;
  end loop;

  if array_length(v_entrants, 1) % 2 = 1 then
    insert into public.matches (tournament_id, round, player1_id, player2_id, winner_id, status)
    values (p_tournament_id, 1, v_prev, null, v_prev, 'bye');
  end if;

  update public.tournaments set status = 'in_progress' where id = p_tournament_id;

  return json_build_object('success', true, 'already_started', false);
end;
$$;

-- ============ ADVANCE ROUND (internal helper) ============
create or replace function public.advance_round_if_ready(p_tournament_id uuid, p_round integer)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_pending_count integer;
  v_winners uuid[];
  v_winner uuid;
  v_prev uuid;
  v_i integer := 0;
  v_prize integer;
begin
  select count(*) into v_pending_count
  from public.matches
  where tournament_id = p_tournament_id
    and round = p_round
    and status not in ('completed','bye');

  if v_pending_count > 0 then
    return;
  end if;

  select array_agg(winner_id order by random()) into v_winners
  from public.matches
  where tournament_id = p_tournament_id and round = p_round;

  if array_length(v_winners, 1) = 1 then
    select prize_pool into v_prize from public.tournaments where id = p_tournament_id;

    update public.profiles
    set cage_coins = cage_coins + v_prize
    where id = v_winners[1];

    update public.tournaments set status = 'completed' where id = p_tournament_id;
    return;
  end if;

  foreach v_winner in array v_winners loop
    v_i := v_i + 1;
    if v_i % 2 = 1 then
      v_prev := v_winner;
    else
      insert into public.matches (tournament_id, round, player1_id, player2_id, status)
      values (p_tournament_id, p_round + 1, v_prev, v_winner, 'pending');
    end if;
  end loop;

  if array_length(v_winners, 1) % 2 = 1 then
    insert into public.matches (tournament_id, round, player1_id, player2_id, winner_id, status)
    values (p_tournament_id, p_round + 1, v_prev, null, v_prev, 'bye');
  end if;
end;
$$;

-- ============ TIER PROMOTION (internal helper) ============
create or replace function public.maybe_promote(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_tier text;
  v_tier_wins integer;
  v_next_tier text;
begin
  select tier, tier_wins into v_tier, v_tier_wins
  from public.profiles where id = p_user_id for update;

  if v_tier_wins < 3 or v_tier = 'optimus' then
    return;
  end if;

  v_next_tier := case v_tier
    when 'bronze' then 'silver'
    when 'silver' then 'gold'
    when 'gold' then 'platinum'
    when 'platinum' then 'diamond'
    when 'diamond' then 'optimus'
  end;

  update public.profiles
  set tier = v_next_tier, tier_wins = 0
  where id = p_user_id;
end;
$$;

-- ============ SUBMIT MATCH SCREENSHOT ============
create or replace function public.submit_match_screenshot(
  p_match_id uuid,
  p_storage_path text,
  p_my_score integer,
  p_opponent_score integer,
  p_raw_ocr_text text default null
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_match record;
  v_other_submission record;
  v_winner uuid;
  v_p1_score integer;
  v_p2_score integer;
begin
  if v_user_id is null then
    raise exception 'Not signed in';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;

  if v_match is null then
    raise exception 'Match not found';
  end if;

  if v_user_id not in (v_match.player1_id, v_match.player2_id) then
    raise exception 'You are not in this match';
  end if;

  if v_match.status = 'completed' then
    raise exception 'Match already decided';
  end if;

  insert into public.match_screenshots
    (match_id, user_id, storage_path, claimed_my_score, claimed_opponent_score, raw_ocr_text)
  values (p_match_id, v_user_id, p_storage_path, p_my_score, p_opponent_score, p_raw_ocr_text)
  on conflict (match_id, user_id) do update
    set storage_path = excluded.storage_path,
        claimed_my_score = excluded.claimed_my_score,
        claimed_opponent_score = excluded.claimed_opponent_score,
        raw_ocr_text = excluded.raw_ocr_text,
        submitted_at = now();

  select * into v_other_submission
  from public.match_screenshots
  where match_id = p_match_id and user_id <> v_user_id;

  if v_other_submission is null then
    update public.matches set status = 'awaiting_opponent' where id = p_match_id;
    return json_build_object('success', true, 'status', 'awaiting_opponent');
  end if;

  if p_my_score = v_other_submission.claimed_opponent_score
     and p_opponent_score = v_other_submission.claimed_my_score then

    if v_user_id = v_match.player1_id then
      v_p1_score := p_my_score;
      v_p2_score := p_opponent_score;
    else
      v_p1_score := p_opponent_score;
      v_p2_score := p_my_score;
    end if;

    if v_p1_score > v_p2_score then
      v_winner := v_match.player1_id;
    elsif v_p2_score > v_p1_score then
      v_winner := v_match.player2_id;
    else
      update public.matches set status = 'disputed' where id = p_match_id;
      return json_build_object('success', true, 'status', 'disputed', 'reason', 'draw not supported');
    end if;

    update public.matches
    set player1_score = v_p1_score,
        player2_score = v_p2_score,
        winner_id = v_winner,
        status = 'completed'
    where id = p_match_id;

    update public.profiles set wins = wins + 1, tier_wins = tier_wins + 1
    where id = v_winner;
    update public.profiles set losses = losses + 1
    where id = (case when v_winner = v_match.player1_id then v_match.player2_id else v_match.player1_id end);

    perform public.maybe_promote(v_winner);
    perform public.advance_round_if_ready(v_match.tournament_id, v_match.round);

    return json_build_object('success', true, 'status', 'completed', 'winner_id', v_winner);
  else
    update public.matches set status = 'disputed' where id = p_match_id;
    return json_build_object('success', true, 'status', 'disputed', 'reason', 'scores do not match');
  end if;
end;
$$;
