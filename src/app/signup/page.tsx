import Link from "next/link";
import { signUp } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl mb-1">Enter the cage</h1>
        <p className="text-text-muted text-sm mb-8">
          New accounts start with{" "}
          <span className="text-gold font-mono">100 Cage Coins</span>.
        </p>

        <form action={signUp} className="flex flex-col gap-4">
          <div>
            <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
              Username
            </label>
            <input
              name="username"
              type="text"
              minLength={3}
              required
              className="mt-1 w-full rounded-sm border border-line bg-surface px-3 py-2 text-text outline-none focus:border-green"
            />
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-sm border border-line bg-surface px-3 py-2 text-text outline-none focus:border-green"
            />
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
              Password
            </label>
            <input
              name="password"
              type="password"
              minLength={6}
              required
              className="mt-1 w-full rounded-sm border border-line bg-surface px-3 py-2 text-text outline-none focus:border-green"
            />
          </div>

          {error && (
            <p className="font-mono text-[12px] text-optimus">{error}</p>
          )}

          <button
            type="submit"
            className="mt-2 rounded-sm bg-green text-pitch py-2.5 font-mono text-xs uppercase tracking-widest hover:bg-green-dim transition-colors"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-green hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
