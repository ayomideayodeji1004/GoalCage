import { createClient } from '@/lib/supabase/server'
import { TierFilterBar } from '@/components/TierFilterBar'
import { RosterGrid } from '@/components/RosterGrid'

const TIERS = ['bronze', 'silver', 'gold', 'platinum','diamond', 'optimus'] as const
type Tier = typeof TIERS[number]

export default async function RosterPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { tier?: string }
}) {
  const supabase = createClient()
  const activeTier = TIERS.includes(searchParams.tier as Tier)
    ? (searchParams.tier as Tier)
    : null

  let query = supabase
    .from('tournament_entries')
    .select(`
      id,
      joined_at,
      profiles!user_id (
        id,
        username,
        tier,
        cage_coins
      )
    `)
    .eq('tournament_id', params.id)
    .order('joined_at', { ascending: true })

  if (activeTier) {
    query = query.eq('profiles.tier', activeTier)
  }

  const { data: entries, error } = await query

  if (error) {
    console.error(error)
    return <div className="text-red-400">Failed to load roster</div>
  }

  return (
    <div className="p-4">
      <TierFilterBar activeTier={activeTier} />
      <RosterGrid entries={entries ?? []} />
    </div>
  )
}