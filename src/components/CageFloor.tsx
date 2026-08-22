"use client";

import { useState } from "react";
import { TierLadder } from "./TierLadder";
import { TournamentList } from "./TournamentList";
import type { Tournament } from "./TournamentCard";

export function CageFloor({
  playerTier,
  initialTournaments,
  initialBalance,
}: {
  playerTier: string;
  initialTournaments: Tournament[];
  initialBalance: number;
}) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const filtered = selectedTier
    ? initialTournaments.filter((t) => t.tier === selectedTier)
    : initialTournaments;

  return (
    <div>
      <div className="mb-10">
        <TierLadder
          currentTier={playerTier}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
        />
      </div>
      <div className="mb-4 hidden sm:flex items-center justify-between">
        <h2 className="font-display text-2xl">Open cages</h2>
      </div>
      <TournamentList
        key={selectedTier ?? "all"}
        initialTournaments={filtered}
        initialBalance={initialBalance}
        playerTier={playerTier}
      />
    </div>
  );
}