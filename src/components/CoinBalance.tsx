export function CoinBalance({ amount }: { amount: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: "var(--gold)" }}
        aria-hidden="true"
      />
      <span className="font-mono text-sm tabular-nums text-gold">
        {amount.toLocaleString()}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
        Cage Coins
      </span>
    </div>
  );
}
