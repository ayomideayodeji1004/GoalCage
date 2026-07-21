'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient(); // not async, unlike server.ts

  async function loadMatches() {
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select('id, tournament_id, round, player1_id, player2_id, status')
      .eq('status', 'pending')
      .order('round', { ascending: true });
    setMatches(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadMatches();
  }, []);

  async function pickWinner(matchId, winnerId) {
    const res = await fetch(`/api/matches/${matchId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerId }),
    });
    const result = await res.json();
    console.log(result);
    loadMatches();
  }

  if (loading) return <div>Loading matches...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Pending Matches (Admin Test)</h1>
      {matches.length === 0 && <p>No pending matches right now.</p>}
      {matches.map((m) => (
        <div key={m.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 10 }}>
          <p>Round {m.round} — Tournament {m.tournament_id}</p>
          <button onClick={() => pickWinner(m.id, m.player1_id)}>
            Player 1 wins ({m.player1_id})
          </button>
          <button onClick={() => pickWinner(m.id, m.player2_id)} style={{ marginLeft: 10 }}>
            Player 2 wins ({m.player2_id})
          </button>
        </div>
      ))}
    </div>
  );
}