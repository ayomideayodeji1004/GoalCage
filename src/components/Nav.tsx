import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CoinBalance } from "./CoinBalance";
import { signOut } from "@/app/login/actions";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let balance: number | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("cage_coins")
      .eq("id", user.id)
      .single();
    balance = profile?.cage_coins ?? 0;
  }

  return (
    <header className="border-b border-line bg-pitch/95 backdrop-blur sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-tight">
          GOAL<span className="text-green">CAGE</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            {balance !== null && <CoinBalance amount={balance} />}
            <form action={signOut}>
              <button className="font-mono text-xs uppercase tracking-widest text-text-muted hover:text-text transition-colors">
                Log out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="font-mono text-xs uppercase tracking-widest text-text-muted hover:text-text transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="font-mono text-xs uppercase tracking-widest bg-green text-pitch px-4 py-2 rounded-sm hover:bg-green-dim transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
