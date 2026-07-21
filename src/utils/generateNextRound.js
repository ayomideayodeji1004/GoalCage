function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function generateNextRound(supabase, tournamentId, completedRound) {
  const nextRound = completedRound + 1;

  // Safety check: has the next round already been generated?
  const { data: existingNext, error: checkError } = await supabase
    .from('matches')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('round', nextRound)
    .limit(1);

  if (checkError) throw checkError;
  if (existingNext && existingNext.length > 0) {
    return { alreadyGenerated: true };
  }

  // Pull every match from the round that just finished
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id, status, winner_id')
    .eq('tournament_id', tournamentId)
    .eq('round', completedRound);

  if (matchesError) throw matchesError;

  // Guard: every match in this round must be completed before we advance
  const unfinished = matches.filter(m => m.status !== 'completed');
  if (unfinished.length > 0) {
    return { notReady: true, unfinishedCount: unfinished.length };
  }

  const winners = matches.map(m => m.winner_id);

  // If only one winner remains, the tournament is over — no next round needed
  if (winners.length === 1) {
    return { tournamentComplete: true, championId: winners[0] };
  }

  const shuffledWinners = shuffleArray(winners);
  const matchRows = [];

  for (let i = 0; i < shuffledWinners.length; i += 2) {
    // If odd number of winners, the last player gets a bye into next round
    if (i + 1 === shuffledWinners.length) {
      matchRows.push({
        tournament_id: tournamentId,
        round: nextRound,
        player1_id: shuffledWinners[i],
        player2_id: null,
        status: 'completed',
        winner_id: shuffledWinners[i],
      });
    } else {
      matchRows.push({
        tournament_id: tournamentId,
        round: nextRound,
        player1_id: shuffledWinners[i],
        player2_id: shuffledWinners[i + 1],
        status: 'pending',
        winner_id: null,
      });
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('matches')
    .insert(matchRows)
    .select();

  if (insertError) throw insertError;
  return { alreadyGenerated: false, matches: inserted };
}