import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TierLadder } from "@/components/TierLadder";
import { TournamentList } from "@/components/TournamentList";
import type { Tournament } from "@/components/TournamentCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, cage_coins, tier")
    .eq("id", user.id)
    .single();

  const { data: tournamentRows } = await supabase
    .from("tournaments")
    .select("id, name, tier, entry_fee, prize_pool, max_players, status")
    .order("entry_fee", { ascending: true });

  const { data: entryRows } = await supabase
    .from("tournament_entries")
    .select("tournament_id, user_id");

  const tournaments: Tournament[] = (tournamentRows ?? []).map((t) => {
    const entriesForThis = (entryRows ?? []).filter(
      (e) => e.tournament_id === t.id
    );
    return {
      ...t,
      players_joined: entriesForThis.length,
      already_joined: entriesForThis.some((e) => e.user_id === user.id),
    };
  });

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Welcome back
        </p>
        <h1 className="font-display text-4xl mt-1">
          {profile?.username ?? "Player"}
        </h1>
      </div>

      <div className="mb-10">
        <TierLadder currentTier={profile?.tier ?? "bronze"} />
      </div>

      <div className="mb-4 hidden sm:flex items-center justify-between">
        <h2 className="font-display text-2xl">Open cages</h2>
      </div>

      <TournamentList
        initialTournaments={tournaments}
        initialBalance={profile?.cage_coins ?? 0}
      />
    </main>
  );
}
