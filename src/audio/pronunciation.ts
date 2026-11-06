/* Inglés: sends the child's clip to /api/pronunciation and returns the score (0–100), or { skipped: true } for anything that
   is not a score (a refusal, the quota, a network error, a timeout). The clip is sent once and never kept here. */
export type PronunciationResult = { score: number } | { skipped: true }

export async function scoreSpeech(word: string, clip: Blob): Promise<PronunciationResult> {
  try {
    const res = await fetch(`/api/pronunciation?text=${encodeURIComponent(word)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/wav' },
      body: clip,
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { skipped: true }
    const data = (await res.json()) as { score?: unknown; skipped?: unknown }
    return typeof data.score === 'number' && data.skipped !== true ? { score: data.score } : { skipped: true }
  } catch {
    return { skipped: true }
  }
}
