"use client";

import { useState } from "react";
import { TournamentCard, type Tournament } from "./TournamentCard";
import { CoinBalance } from "./CoinBalance";

export function TournamentList({
  initialTournaments,
  initialBalance,
}: {
  initialTournaments: Tournament[];
  initialBalance: number;
}) {
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [balance, setBalance] = useState(initialBalance);

  function handleJoined(tournamentId: string, newBalance: number) {
    setBalance(newBalance);
    setTournaments((prev) =>
      prev.map((t) =>
        t.id === tournamentId
          ? {
              ...t,
              already_joined: true,
              players_joined: t.players_joined + 1,
            }
          : t
      )
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:hidden">
        <h2 className="font-display text-xl">Open cages</h2>
        <CoinBalance amount={balance} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tournaments.map((t) => (
          <TournamentCard
            key={t.id}
            tournament={t}
            balance={balance}
            onJoined={(newBalance) => handleJoined(t.id, newBalance)}
          />
        ))}
      </div>
    </div>
  );
}
