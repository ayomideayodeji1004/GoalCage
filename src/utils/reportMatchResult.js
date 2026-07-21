import { generateNextRound } from './generateNextRound';

export async function reportMatchResult(supabase, matchId, winnerId) {
  const { data: match, error: fetchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (fetchError) throw fetchError;
  if (match.status === 'completed') {
    return { alreadyReported: true };
  }
  if (winnerId !== match.player1_id && winnerId !== match.player2_id) {
    throw new Error('Winner must be one of the two players in this match');
  }

  const { error: updateError } = await supabase
    .from('matches')
    .update({ status: 'completed', winner_id: winnerId })
    .eq('id', matchId);

  if (updateError) throw updateError;

  // Check if this was the last pending match in the round
  const { data: remaining, error: remainingError } = await supabase
    .from('matches')
    .select('id')
    .eq('tournament_id', match.tournament_id)
    .eq('round', match.round)
    .eq('status', 'pending');

  if (remainingError) throw remainingError;

  if (remaining.length === 0) {
    const roundResult = await generateNextRound(supabase, match.tournament_id, match.round);
    return { matchUpdated: true, roundResult };
  }

  return { matchUpdated: true, roundStillInProgress: true };
}