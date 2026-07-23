"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { extractScoreFromImage } from "@/lib/ocr";

type Stage = "idle" | "reading" | "ready" | "submitting" | "done";

export function ScreenshotUpload({ matchId }: { matchId: string }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [myScore, setMyScore] = useState<string>("");
  const [opponentScore, setOpponentScore] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setStage("reading");

    try {
      const ocr = await extractScoreFromImage(selected);
      setRawText(ocr.rawText);
      setMyScore(ocr.guessedMyScore !== null ? String(ocr.guessedMyScore) : "");
      setOpponentScore(
        ocr.guessedOpponentScore !== null ? String(ocr.guessedOpponentScore) : ""
      );
      setStage("ready");
    } catch {
      // OCR failing shouldn't block submission - the player can still type
      // the score in by hand.
      setStage("ready");
    }
  }

  async function handleSubmit() {
    if (!file) return;
    const my = parseInt(myScore, 10);
    const opp = parseInt(opponentScore, 10);

    if (Number.isNaN(my) || Number.isNaN(opp)) {
      setError("Enter both scores as numbers.");
      return;
    }

    setError(null);
    setStage("submitting");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in.");
      setStage("ready");
      return;
    }

    const path = `${user.id}/${matchId}-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("match-screenshots")
      .upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setStage("ready");
      return;
    }

    const { data, error: rpcError } = await supabase.rpc(
      "submit_match_screenshot",
      {
        p_match_id: matchId,
        p_storage_path: path,
        p_my_score: my,
        p_opponent_score: opp,
        p_raw_ocr_text: rawText || null,
      }
    );

    if (rpcError) {
      setError(rpcError.message.replace(/^.*: /, ""));
      setStage("ready");
      return;
    }

    if (data.status === "completed") {
      setResult("Match confirmed - both screenshots agreed.");
    } else if (data.status === "awaiting_opponent") {
      setResult("Submitted. Waiting on your opponent's screenshot.");
    } else if (data.status === "disputed") {
      setResult(
        "Your score doesn't match your opponent's submission. This match needs manual review."
      );
    }

    setStage("done");
    router.refresh();
  }

  if (stage === "done" && result) {
    return (
      <div className="rounded-sm border border-line bg-surface p-4">
        <p className="font-mono text-sm text-text">{result}</p>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-line bg-surface p-4 flex flex-col gap-4">
      <div>
        <label className="font-mono text-[11px] uppercase tracking-widest text-text-muted block mb-2">
          Upload final score screenshot
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="font-mono text-xs text-text-muted file:mr-3 file:rounded-sm file:border-0 file:bg-green file:text-pitch file:px-3 file:py-1.5 file:font-mono file:text-xs file:uppercase file:tracking-widest"
        />
      </div>

      {stage === "reading" && (
        <p className="font-mono text-xs text-text-muted">Reading screenshot…</p>
      )}

      {(stage === "ready" || stage === "submitting") && file && (
        <>
          <p className="font-mono text-[11px] text-text-muted">
            Confirm the score below - edit it if the reading looks wrong.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted block mb-1">
                Your score
              </label>
              <input
                type="number"
                min={0}
                value={myScore}
                onChange={(e) => setMyScore(e.target.value)}
                className="w-full rounded-sm border border-line bg-surface-2 px-3 py-2 text-text font-mono outline-none focus:border-green"
              />
            </div>
            <div className="flex-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted block mb-1">
                Opponent score
              </label>
              <input
                type="number"
                min={0}
                value={opponentScore}
                onChange={(e) => setOpponentScore(e.target.value)}
                className="w-full rounded-sm border border-line bg-surface-2 px-3 py-2 text-text font-mono outline-none focus:border-green"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={stage === "submitting"}
            className="w-full rounded-sm py-2 font-mono text-xs uppercase tracking-widest bg-green text-pitch hover:bg-green-dim transition-colors disabled:opacity-50"
          >
            {stage === "submitting" ? "Submitting…" : "Submit result"}
          </button>
        </>
      )}

      {error && <p className="font-mono text-[11px] text-optimus">{error}</p>}
    </div>
  );
}
