/* Vercel Function (Node runtime): POST /api/pronunciation?text=<reference> with the child's clip (audio/wav, 16 kHz, mono,
   at most 10 s and 400 KB) → { score: 0–100 } from Azure Pronunciation Assessment (short audio REST, northeurope).

   Only the score leaves this function: the audio is sent to Azure and dropped, never logged, never stored. Every failure
   (no key, a bad clip, Azure refusing with its quota 429/403, another error, or a 5 s timeout) answers { skipped: true }
   with HTTP 200, so the app moves on without penalty and does not retry that day. The guards are the same as /api/tts:
   the Origin/Referer check (allowedCaller) and a per-IP limit in this instance's memory (a partial brake; the real brake
   is the Azure F0 quota, shared with nothing else). Keep the Azure resource on F0 and set a budget alert. */
import { allowedCaller } from './tts.ts'

/** A 10-second clip at 16 kHz, 16-bit mono is 320 KB plus its header; the limit leaves a little room. */
export const MAX_BYTES = 400 * 1024
/** The reference is one English word or a short phrase: letters, spaces, apostrophes and hyphens only. */
const REFERENCE = /^[A-Za-z][A-Za-z' -]{0,63}$/
/** Per-IP budget in this instance's memory: 60 clips per 10 minutes (a child may speak at most 10 times a day). */
const RATE_LIMIT = 60
const RATE_WINDOW_MS = 10 * 60_000
const MAX_TRACKED_IPS = 10_000
const AZURE_TIMEOUT_MS = 5000

interface Env {
  AZURE_SPEECH_KEY?: string
  AZURE_SPEECH_REGION?: string
}

const SKIPPED = () => Response.json({ skipped: true }, { headers: { 'Cache-Control': 'no-store' } })

function fail(status: number, message: string): Response {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
}

const hits = new Map<string, { start: number; count: number }>()

/** Counts a clip for this client IP. False when the IP is over RATE_LIMIT in the current window. */
function withinRateLimit(req: Request, now = Date.now()): boolean {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  if (hits.size >= MAX_TRACKED_IPS) {
    for (const [k, v] of hits) if (now - v.start >= RATE_WINDOW_MS) hits.delete(k)
  }
  const cur = hits.get(ip)
  if (!cur || now - cur.start >= RATE_WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 })
    return true
  }
  cur.count++
  return cur.count <= RATE_LIMIT
}

/** Tests only. */
export function __resetPronunciationLimitForTests(): void {
  hits.clear()
}

/** The whole body, or null as soon as it passes `max` bytes (the rest is not read). */
async function readUpTo(req: Request, max: number): Promise<Uint8Array | null> {
  if (!req.body) return new Uint8Array(0)
  const reader = req.body.getReader()
  const parts: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > max) {
      await reader.cancel().catch(() => undefined)
      return null
    }
    parts.push(value)
  }
  const out = new Uint8Array(total)
  let at = 0
  for (const p of parts) { out.set(p, at); at += p.byteLength }
  return out
}

/** A RIFF/WAVE container: the only audio this endpoint takes. */
function isWav(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 44) return false
  const at = (from: number) => String.fromCharCode(...bytes.subarray(from, from + 4))
  return at(0) === 'RIFF' && at(8) === 'WAVE'
}

/** Vercel entry point. Reads the variables by name so the platform always provides them at run time. */
export function POST(req: Request): Promise<Response> {
  return handler(req, { AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY, AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION })
}

/** Shared by the Vercel entry point and the tests. */
export async function handler(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'POST') return fail(405, 'Method not allowed')
  if (!allowedCaller(req)) return fail(403, 'Forbidden')
  if (!withinRateLimit(req)) return fail(429, 'Too many requests')

  const url = new URL(req.url)
  const text = (url.searchParams.get('text') ?? '').trim()
  if (!REFERENCE.test(text)) return fail(400, 'Bad reference')
  if ((req.headers.get('content-type') ?? '').split(';')[0].trim() !== 'audio/wav') return fail(400, 'Bad audio')
  const declared = Number(req.headers.get('content-length') ?? '0')
  if (declared > MAX_BYTES) return fail(413, 'Clip too large')

  // Counted while it streams: a body without content-length (chunked) is cut at the limit, never read whole.
  const body = await readUpTo(req, MAX_BYTES)
  if (!body) return fail(413, 'Clip too large')
  if (!isWav(body)) return fail(400, 'Bad audio')

  const key = env.AZURE_SPEECH_KEY
  const region = env.AZURE_SPEECH_REGION
  if (!key || !region) return SKIPPED()

  // Pronunciation Assessment: the reference text and the grading, as one base64 JSON header (the text is ASCII here).
  const assessment = btoa(JSON.stringify({ ReferenceText: text, GradingSystem: 'HundredMark', Granularity: 'Word', Dimension: 'Basic' }))
  const azure = await fetch(
    `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-GB&format=detailed`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        Accept: 'application/json',
        'Pronunciation-Assessment': assessment,
        'User-Agent': 'repasitos',
      },
      body,
      signal: AbortSignal.timeout(AZURE_TIMEOUT_MS),
    },
  ).catch(() => null)

  // Quota reached (F0 answers 429 or 403), a transient error, or a stall: the app skips the speaking item.
  if (!azure || !azure.ok) return SKIPPED()
  const data = (await azure.json().catch(() => null)) as { RecognitionStatus?: string; NBest?: { PronScore?: number }[] } | null
  if (!data) return SKIPPED()
  // Silence or nothing recognised is not a score: the app asks the child to try again (no record, no attempt counted).
  if (data.RecognitionStatus === 'NoMatch' || data.RecognitionStatus === 'InitialSilenceTimeout') {
    return Response.json({ noSpeech: true }, { headers: { 'Cache-Control': 'no-store' } })
  }
  // Any other status (Error, a service fault): not a result either, so the item is skipped, as when Azure fails.
  if (data.RecognitionStatus !== 'Success') return SKIPPED()
  const pron = data.NBest?.[0]?.PronScore
  if (typeof pron !== 'number' || !Number.isFinite(pron)) return SKIPPED()
  return Response.json({ score: Math.min(100, Math.max(0, Math.round(pron))) }, { headers: { 'Cache-Control': 'no-store' } })
}
