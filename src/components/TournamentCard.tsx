"use client";

import { useState, useTransition } from "react";
import { tierInfo } from "@/lib/tiers";
import { createClient } from "@/lib/supabase/client";

export type Tournament = {
  id: string;
  name: string;
  tier: string;
  entry_fee: number;
  prize_pool: number;
  max_players: number;
  status: string;
  players_joined: number;
  already_joined: boolean;
};

export function TournamentCard({
  tournament,
  balance,
  onJoined,
}: {
  tournament: Tournament;
  balance: number;
  onJoined: (newBalance: number) => void;
}) {
  const tier = tierInfo(tournament.tier);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const full = tournament.players_joined >= tournament.max_players;
  const canAfford = balance >= tournament.entry_fee;
  const disabled =
    tournament.already_joined || full || !canAfford || tournament.status !== "open";

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("join_tournament", {
        p_tournament_id: tournament.id,
      });
      if (rpcError) {
        setError(rpcError.message.replace(/^.*: /, ""));
        return;
      }
      onJoined(data.new_balance);
      fetch(`/api/tournaments/${tournament.id}/check-bracket`, { method: 'POST' });
    });
  }

  let buttonLabel = "Join cage";
  if (tournament.already_joined) buttonLabel = "Entered";
  else if (full) buttonLabel = "Full";
  else if (!canAfford) buttonLabel = "Not enough coins";
  else if (isPending) buttonLabel = "Joining…";

  return (
    <div className="rounded-sm border border-line bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: tier.color }}
          >
            {tier.label}
          </span>
          <h3 className="font-display text-xl leading-tight mt-0.5">
            {tournament.name}
          </h3>
        </div>
        <span className="font-mono text-[11px] text-text-muted whitespace-nowrap pt-1">
          {tournament.players_joined}/{tournament.max_players} in
        </span>
      </div>

      <div className="flex items-center justify-between font-mono text-sm">
        <span className="text-text-muted">
          Entry <span className="text-text">{tournament.entry_fee}</span>
        </span>
        <span className="text-text-muted">
          Prize <span className="text-gold">{tournament.prize_pool}</span>
        </span>
      </div>

      <button
        onClick={handleJoin}
        disabled={disabled || isPending}
        className="w-full rounded-sm py-2 font-mono text-xs uppercase tracking-widest transition-colors disabled:cursor-not-allowed"
        style={{
          background: disabled ? "var(--surface-2)" : "var(--green)",
          color: disabled ? "var(--text-muted)" : "#0b0f0d",
        }}
      >
        {buttonLabel}
      </button>

      {error && (
        <p className="font-mono text-[11px] text-optimus">{error}</p>
      )}
    </div>
  );
}
