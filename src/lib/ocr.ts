import { createWorker } from "tesseract.js";

export type OcrResult = {
  rawText: string;
  guessedMyScore: number | null;
  guessedOpponentScore: number | null;
};

/**
 * Runs OCR on an image file and tries to guess a "X - Y" style scoreline
 * out of whatever text it finds. This is a starting point for the player
 * to confirm or correct, never trusted blindly - the database function
 * only auto-resolves a match when BOTH players' confirmed numbers agree.
 */
export async function extractScoreFromImage(file: File): Promise<OcrResult> {
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(file);

    const scoreline = guessScoreline(text);

    return {
      rawText: text,
      guessedMyScore: scoreline?.[0] ?? null,
      guessedOpponentScore: scoreline?.[1] ?? null,
    };
  } finally {
    await worker.terminate();
  }
}

function guessScoreline(text: string): [number, number] | null {
  const match = text.match(/(\d{1,2})\s*[-:]\s*(\d{1,2})/);
  if (!match) return null;

  const a = parseInt(match[1], 10);
  const b = parseInt(match[2], 10);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;

  return [a, b];
}
