import { createClient } from '@/lib/supabase/server'
import { TierFilterBar } from '@/components/TierFilterBar'
import { RosterGrid } from '@/components/RosterGrid'

const TIERS = ['bronze', 'silver', 'gold', 'platinum','diamond', 'optimus'] as const
type Tier = typeof TIERS[number]

export default async function RosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tier?: string }>
}) {
  const { id } = await params
  const { tier } = await searchParams

  const supabase = await createClient()
  const activeTier = TIERS.includes(tier as Tier) ? (tier as Tier) : null
  let query = supabase
  .from('tournament_entries')
  .select(`
    id,
    joined_at,
    profiles!user_id${activeTier ? '!inner' : ''} (
      id,
      username,
      tier,
      cage_coins
    )
  `)
  .eq('tournament_id', id)
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