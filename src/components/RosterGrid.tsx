const TIER_COLORS: Record<string, string> = {
  bronze: 'text-amber-600',
  silver: 'text-zinc-400',
  gold: 'text-yellow-400',
  platinum: 'text-cyan-300',
    diamond: 'text-blue-300',
  optimus: 'text-orange-500',
}

export function RosterGrid({ entries }: { entries: any[] }) {
  if (entries.length === 0) {
    return <p className="text-zinc-500">No players in this tier yet.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {entries.map((entry) => (
        <div key={entry.id} className="bg-zinc-900 p-3 rounded-lg">
          <p className="font-medium">{entry.profiles.username}</p>
          <p className={`text-sm capitalize ${TIER_COLORS[entry.profiles.tier]}`}>
            {entry.profiles.tier}
          </p>
          <p className="text-xs text-zinc-500">{entry.profiles.cage_coins} coins</p>
        </div>
      ))}
    </div>
  )
}