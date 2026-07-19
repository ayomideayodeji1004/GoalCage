# GoalCage

Real-stakes eFootball tournament ladder — Bronze to Optimus, Cage Coins wallet,
signup, and tournament join flow.

## What's built

- Email/password signup + login (Supabase Auth)
- New accounts start with 100 Cage Coins automatically (DB trigger)
- Dashboard: tier ladder, coin balance, list of open tournaments
- Join a tournament: coins deducted atomically (can't double-spend by double-clicking or joining from two tabs)
- Tier ladder visual (Bronze → Silver → Gold → Platinum → Diamond → Optimus)

## Not built yet (next steps)

- Dual-screenshot score verification / match results
- Actually moving players up tiers based on wins
- Real money in/out (this uses Cage Coins only, no payment processor)
- Social feed

## Setup (15 minutes)

### 1. Create a free Supabase project
Go to https://supabase.com → New project. Save your database password somewhere safe.

### 2. Run the database schema
In your Supabase project: **SQL Editor → New query** → paste the entire contents
of `supabase/schema.sql` → **Run**. This creates the tables, the auto-100-coins
trigger, the atomic join function, and seeds 7 starter tournaments.

### 3. Get your API keys
In Supabase: **Project Settings → API**. Copy the **Project URL** and the
**anon public** key.

### 4. Set environment variables
```
cp .env.local.example .env.local
```
Paste your URL and anon key into `.env.local`.

### 5. Install and run
```
npm install
npm run dev
```
Open http://localhost:3000 — sign up, and you should land on the dashboard
with 100 Cage Coins and the tournament list.

### 6. Deploy (free)
Push this folder to a GitHub repo, then import it at https://vercel.com/new.
Add the same two environment variables in Vercel's project settings. Done —
you get a live URL.

## Project structure

```
src/app/            pages (landing, signup, login, dashboard)
src/components/      TierLadder, CoinBalance, TournamentCard, Nav
src/lib/supabase/   browser + server Supabase clients
src/lib/tiers.ts     tier definitions and colors
src/proxy.ts         keeps auth session fresh on every request
supabase/schema.sql  full database schema + seed tournaments
```

## Design notes

Dark pitch-night background, electric green for primary actions, gold for
coins, orange for the top Optimus tier. Anton for headlines (condensed,
athletic), Inter for body text, JetBrains Mono for numbers — coin counts,
entry fees, prize pools — so they read like a scoreboard.
