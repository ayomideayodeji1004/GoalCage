"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function StartTournamentButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("start_tournament", {
        p_tournament_id: tournamentId,
      });
      if (rpcError) {
        setError(rpcError.message.replace(/^.*: /, ""));
        return;
      }
      router.push("/matches");
    });
  }

  return (
    <div>
      <button
        onClick={handleStart}
        disabled={isPending}
        className="w-full rounded-sm py-2 font-mono text-xs uppercase tracking-widest bg-gold text-pitch hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isPending ? "Starting…" : "Start bracket"}
      </button>
      {error && <p className="font-mono text-[11px] text-optimus mt-2">{error}</p>}
    </div>
  );
}
