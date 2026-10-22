/* Vercel Function (Node runtime): GET /api/tts?v=<character>&t=<text> → MP3 spoken by an Azure neural voice.
   The Azure key stays on the server (AZURE_SPEECH_KEY / AZURE_SPEECH_REGION); the app falls back to the device voice
   whenever this fails. Responses are immutable for a given text and character, so the CDN and the service worker
   cache them and each sentence is synthesised once.

   Defences, from cheapest to strongest:
   - Origin/Referer and Sec-Fetch-Site: only our own pages get audio. They are request headers any HTTP client can
     forge, so they stop embedding by other sites and casual use, not a determined attacker.
   - A per-IP limit in this instance's memory (RATE_LIMIT per RATE_WINDOW_MS). Each Vercel instance counts on its
     own and restarts often, so it is only a partial brake.
   - The real brake is the Azure F0 (free) quota: the F0 tier never bills, and at its quota Azure refuses (429/403),
     which the app treats as "use the device voice". Keep the Azure resource on F0 and set a budget alert.
   - Still to configure by the owner in the Vercel Firewall dashboard (not in this repo): a rate-limit rule on
     /api/tts per IP. The coordinator proposes it; until it exists, the limits above are all there is. */

type Character = 'lumi' | 'companion' | 'narrator' | 'guardian'

/** Spanish (Spain) neural voices per character, chosen by the owner by ear (Ximena Multilingual for Lumi and the
    narrator, Irene for the companion). Small prosody changes only: big ones sound artificial. When a voice changes,
    bump VOICE_REVISION in src/audio/neuralVoice.ts so devices fetch the new clips instead of their cached ones. */
export const VOICES: Record<Character, { name: string; pitch: string; rate: string }> = {
  lumi: { name: 'es-ES-XimenaMultilingualNeural', pitch: '0%', rate: '-4%' },
  companion: { name: 'es-ES-IreneNeural', pitch: '0%', rate: '0%' },
  narrator: { name: 'es-ES-XimenaMultilingualNeural', pitch: '0%', rate: '-6%' },
  guardian: { name: 'es-ES-AlvaroNeural', pitch: '-3%', rate: '-8%' },
}

const MAX_CHARS = 400
/** Only our own pages may use the key: same-origin requests from these hosts. */
const ALLOWED_HOSTS = /^(localhost|127\.0\.0\.1|(www\.)?repasitos\.es)$/
/** Per-IP budget kept in this instance's memory: 120 requests per 10 minutes. A partial brake only (see above). */
const RATE_LIMIT = 120
const RATE_WINDOW_MS = 10 * 60_000
const MAX_TRACKED_IPS = 10_000
/** Letters (with Spanish accents), digits, spaces and ordinary punctuation. Nothing that could become markup. */
const SAFE_TEXT = /^[\p{L}\p{N}\s.,;:¡!¿?'"«»()\-–—…%+×÷=/]+$/u

interface Env {
  AZURE_SPEECH_KEY?: string
  AZURE_SPEECH_REGION?: string
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function fail(status: number, message: string): Response {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
}

function allowedCaller(req: Request): boolean {
  // Sec-Fetch-Site is sent by browsers on every request; when present it must say same-origin.
  const fetchSite = req.headers.get('sec-fetch-site')
  if (fetchSite !== null && fetchSite !== 'same-origin') return false
  const from = req.headers.get('origin') ?? req.headers.get('referer')
  if (!from) return false
  try {
    return ALLOWED_HOSTS.test(new URL(from).hostname)
  } catch {
    return false
  }
}

const hits = new Map<string, { start: number; count: number }>()

/** Counts a request for this client IP. False when the IP is over RATE_LIMIT in the current window. */
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
export function __resetRateLimitForTests(): void {
  hits.clear()
}

export function ssml(text: string, character: Character): string {
  const v = VOICES[character]
  // Multilingual voices guess the language from the text: <lang> pins Spanish from Spain (accent and numbers).
  const body = `<prosody pitch="${v.pitch}" rate="${v.rate}">${escapeXml(text)}</prosody>`
  const spoken = v.name.includes('Multilingual') ? `<lang xml:lang="es-ES">${body}</lang>` : body
  return `<speak version="1.0" xml:lang="es-ES" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts">` +
    `<voice name="${v.name}">${spoken}</voice></speak>`
}

/** Vercel entry point. Reads the variables by name so the platform always provides them at run time. */
export function GET(req: Request): Promise<Response> {
  return handler(req, { AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY, AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION })
}

/** Shared by the Vercel entry point, the Vite dev server and the tests. */
export async function handler(req: Request, env: Env): Promise<Response> {
  if (req.method !== 'GET') return fail(405, 'Method not allowed')
  if (!allowedCaller(req)) return fail(403, 'Forbidden')
  if (!withinRateLimit(req)) return fail(429, 'Too many requests')
  const key = env.AZURE_SPEECH_KEY
  const region = env.AZURE_SPEECH_REGION
  if (!key || !region) return fail(503, 'Voice not configured')

  const url = new URL(req.url)
  const text = (url.searchParams.get('t') ?? '').trim()
  const character = (url.searchParams.get('v') ?? 'lumi') as Character
  if (!text || text.length > MAX_CHARS || !SAFE_TEXT.test(text)) return fail(400, 'Bad text')
  if (!Object.hasOwn(VOICES, character)) return fail(400, 'Bad voice')

  const azure = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'repasitos',
    },
    body: ssml(text, character),
    // A stalled Azure connection must not hold the function until the platform limit.
    signal: AbortSignal.timeout(8000),
  }).catch(() => null)

  // Quota reached (F0) or a transient error: the app uses the device voice instead.
  if (!azure || !azure.ok) return fail(503, `Voice unavailable (${azure?.status ?? 'network'})`)
  return new Response(azure.body, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
    },
  })
}
