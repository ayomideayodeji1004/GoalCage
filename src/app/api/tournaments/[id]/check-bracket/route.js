import { createClient } from '@/lib/supabase/server';
import { generateBracket } from '@/utils/generateBracket';

export async function POST(request, { params }) {
  const { id: tournamentId } = await params;
  const supabase = await createClient();

  try {
    const { count } = await supabase
      .from('tournament_entries')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId);

    if (count === 12) {
      const result = await generateBracket(supabase, tournamentId);
      return Response.json({ triggered: true, result });
    }

    return Response.json({ triggered: false, count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}