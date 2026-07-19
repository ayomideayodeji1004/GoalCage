import { TIERS, tierIndex } from "@/lib/tiers";

export function TierLadder({ currentTier }: { currentTier: string }) {
  const activeIndex = tierIndex(currentTier);

  return (
    <div className="w-full">
      <div className="flex items-stretch gap-[3px] h-14 rounded-sm overflow-hidden border border-line">
        {TIERS.map((tier, i) => {
          const reached = i <= activeIndex;
          const isCurrent = i === activeIndex;
          return (
            <div
              key={tier.key}
              className="relative flex-1 flex items-center justify-center transition-colors"
              style={{
                background: reached ? tier.color : "var(--surface)",
                opacity: reached ? 1 : 0.4,
              }}
              title={tier.label}
            >
              {isCurrent && (
                <span
                  className="absolute -top-2 w-2 h-2 rotate-45"
                  style={{ background: tier.color }}
                  aria-hidden="true"
                />
              )}
              <span
                className="font-mono text-[10px] uppercase tracking-widest font-semibold"
                style={{ color: reached ? "#0b0f0d" : "var(--text-muted)" }}
              >
                {tier.label.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 font-mono text-[11px] text-text-muted uppercase tracking-wide">
        <span>Cage floor</span>
        <span style={{ color: TIERS[activeIndex].color }}>
          {TIERS[activeIndex].label} — you are here
        </span>
      </div>
    </div>
  );
}
