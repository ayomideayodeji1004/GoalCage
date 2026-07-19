import Link from "next/link";
import { TIERS } from "@/lib/tiers";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16">
        <p className="font-mono text-xs uppercase tracking-widest text-green mb-4">
          Bronze to Optimus · Real Cage Coins on the line
        </p>
        <h1 className="font-display text-5xl sm:text-6xl leading-[0.95] mb-6">
          YOUR SQUAD.
          <br />
          YOUR SKILL.
          <br />
          <span className="text-green">YOUR STAKE.</span>
        </h1>
        <p className="text-text-muted text-base sm:text-lg max-w-xl mb-8">
          GoalCage is a real-stakes eFootball tournament ladder. Put your
          Cage Coins down, prove it on the pitch, and climb from Bronze to
          Optimus.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/signup"
            className="rounded-sm bg-green text-pitch px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-green-dim transition-colors"
          >
            Start with 100 coins
          </Link>
          <Link
            href="/login"
            className="font-mono text-xs uppercase tracking-widest text-text-muted hover:text-text transition-colors"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="max-w-4xl mx-auto px-4 py-14">
          <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted mb-6">
            The ladder
          </p>
          <div className="flex items-stretch gap-[3px] h-16 rounded-sm overflow-hidden border border-line mb-3">
            {TIERS.map((tier) => (
              <div
                key={tier.key}
                className="flex-1 flex items-center justify-center"
                style={{ background: tier.color }}
              >
                <span className="font-mono text-[10px] uppercase tracking-widest font-semibold text-pitch">
                  {tier.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-text-muted text-sm max-w-lg">
            Every win moves you up. Every entry fee is real coins, real
            stakes. Dual-screenshot verification keeps every result honest.
          </p>
        </div>
      </section>
    </main>
  );
}
