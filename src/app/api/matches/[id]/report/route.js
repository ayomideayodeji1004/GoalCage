import { createClient } from '@/lib/supabase/server';
import { reportMatchResult } from '@/utils/reportMatchResult';

export async function POST(request, { params }) {
  const { id: matchId } = await params;
  const supabase = await createClient(); // your createClient is async, so we await it

  try {
    const body = await request.json();
    const { winnerId } = body;

    if (!winnerId) {
      return Response.json({ error: 'winnerId is required' }, { status: 400 });
    }

    const result = await reportMatchResult(supabase, matchId, winnerId);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}