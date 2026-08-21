'use client'

import { useRouter, usePathname } from 'next/navigation'

const TIERS = ['bronze', 'silver', 'gold', 'platinum','diamond', 'optimus'] as const

export function TierFilterBar({ activeTier }: { activeTier: string | null }) {
  const router = useRouter()
  const pathname = usePathname()

  function setTier(tier: string | null) {
    const params = new URLSearchParams()
    if (tier) params.set('tier', tier)
    router.push(`${pathname}${params.toString() ? `?${params}` : ''}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto mb-4">
      <button
        onClick={() => setTier(null)}
        className={`px-3 py-1 rounded ${!activeTier ? 'bg-emerald-500' : 'bg-zinc-800'}`}
      >
        All
      </button>
      {TIERS.map((tier) => (
        <button
          key={tier}
          onClick={() => setTier(tier)}
          className={`px-3 py-1 rounded capitalize ${activeTier === tier ? 'bg-emerald-500' : 'bg-zinc-800'}`}
        >
          {tier}
        </button>
      ))}
    </div>
  )
}