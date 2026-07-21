function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function generateBracket(supabase, tournamentId) {
  // Safety check: has round 1 already been generated for this tournament?
  const { data: existingMatches, error: checkError } = await supabase
    .from('matches')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('round', 1)
    .limit(1);

  if (checkError) throw checkError;
  if (existingMatches && existingMatches.length > 0) {
    return { alreadyGenerated: true };
  }

  // Get all entries for this tournament
  const { data: entries, error: entriesError } = await supabase
    .from('tournament_entries')
    .select('player_id')
    .eq('tournament_id', tournamentId);

  if (entriesError) throw entriesError;
  if (!entries || entries.length !== 12) {
    throw new Error(`Expected 12 entries, found ${entries?.length ?? 0}`);
  }

  const playerIds = shuffleArray(entries.map(e => e.player_id));
  const byePlayers = playerIds.slice(0, 4);
  const pairedPlayers = playerIds.slice(4);
  const matchRows = [];

  for (const playerId of byePlayers) {
    matchRows.push({
      tournament_id: tournamentId,
      round: 1,
      player1_id: playerId,
      player2_id: null,
      status: 'completed',
      winner_id: playerId,
    });
  }

  for (let i = 0; i < pairedPlayers.length; i += 2) {
    matchRows.push({
      tournament_id: tournamentId,
      round: 1,
      player1_id: pairedPlayers[i],
      player2_id: pairedPlayers[i + 1],
      status: 'pending',
      winner_id: null,
    });
  }

  const { data: inserted, error: insertError } = await supabase
    .from('matches')
    .insert(matchRows)
    .select();

  if (insertError) throw insertError;
  return { alreadyGenerated: false, matches: inserted };
}