"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Player = {
  user_id: string;
  username: string;
  joined_at: string;
};

export function ParticipantsList({ tournamentId }: { tournamentId: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .rpc("get_tournament_players", { p_tournament_id: tournamentId })
      .then(({ data, error }) => {
        if (!error && data) setPlayers(data);
        setLoading(false);
      });
  }, [tournamentId]);

  if (loading) return <p className="text-text-muted text-xs">Loading players...</p>;
  if (players.length === 0) return <p className="text-text-muted text-xs">No players yet.</p>;

  return (
    <ul className="flex flex-col gap-1 mt-2">
      {players.map((p) => (
        <li key={p.user_id} className="font-mono text-xs text-text">
          {p.username}
        </li>
      ))}
    </ul>
  );
}