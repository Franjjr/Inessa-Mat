/* Vercel Edge Function: GET /api/tts?v=<character>&t=<text> → MP3 spoken by an Azure neural voice.
   The Azure key stays on the server (AZURE_SPEECH_KEY / AZURE_SPEECH_REGION); the app falls back to the device voice
   whenever this fails. Responses are immutable for a given text and character, so the CDN and the service worker
   cache them and each sentence is synthesised once. The F0 (free) Azure tier never bills: at its quota it refuses. */
export const config = { runtime: 'edge' }

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
const ALLOWED_HOSTS = /^(localhost|127\.0\.0\.1|(www\.)?repasitos\.es|(www\.)?wopr\.es|[a-z0-9-]+\.vercel\.app)$/
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
  const from = req.headers.get('origin') ?? req.headers.get('referer')
  if (!from) return false
  try {
    return ALLOWED_HOSTS.test(new URL(from).hostname)
  } catch {
    return false
  }
}

export function ssml(text: string, character: Character): string {
  const v = VOICES[character]
  // Multilingual voices guess the language from the text: <lang> pins Spanish from Spain (accent and numbers).
  const body = `<prosody pitch="${v.pitch}" rate="${v.rate}">${escapeXml(text)}</prosody>`
  const spoken = v.name.includes('Multilingual') ? `<lang xml:lang="es-ES">${body}</lang>` : body
  return `<speak version="1.0" xml:lang="es-ES" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts">` +
    `<voice name="${v.name}">${spoken}</voice></speak>`
}

export default async function handler(req: Request, env: Env = process.env as Env): Promise<Response> {
  if (req.method !== 'GET') return fail(405, 'Method not allowed')
  if (!allowedCaller(req)) return fail(403, 'Forbidden')
  const key = env.AZURE_SPEECH_KEY
  const region = env.AZURE_SPEECH_REGION
  if (!key || !region) return fail(503, 'Voice not configured')

  const url = new URL(req.url)
  const text = (url.searchParams.get('t') ?? '').trim()
  const character = (url.searchParams.get('v') ?? 'lumi') as Character
  if (!text || text.length > MAX_CHARS || !SAFE_TEXT.test(text)) return fail(400, 'Bad text')
  if (!(character in VOICES)) return fail(400, 'Bad voice')

  const azure = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'repasitos',
    },
    body: ssml(text, character),
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
