/* Inglés: sends the child's clip to /api/pronunciation. Returns the score (0–100); { noSpeech: true } when the service heard
   nothing (the child is asked to try again: not a result); or { skipped: true } for anything else (a refusal, the quota, a
   network error, a timeout). The clip is sent once and never kept here. The wait is bounded a little above the server's own
   5 s limit for Azure, so a slow answer is not cut short by the client. */
export type PronunciationResult = { score: number } | { noSpeech: true } | { skipped: true }

const CLIENT_TIMEOUT_MS = 6000

export async function scoreSpeech(word: string, clip: Blob): Promise<PronunciationResult> {
  try {
    const res = await fetch(`/api/pronunciation?text=${encodeURIComponent(word)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/wav' },
      body: clip,
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    })
    if (!res.ok) return { skipped: true }
    const data = (await res.json()) as { score?: unknown; noSpeech?: unknown; skipped?: unknown }
    if (data.skipped === true) return { skipped: true }
    if (data.noSpeech === true) return { noSpeech: true }
    return typeof data.score === 'number' ? { score: data.score } : { skipped: true }
  } catch {
    return { skipped: true }
  }
}
