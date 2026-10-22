import { afterEach, describe, expect, it, vi } from 'vitest'
import { handler, ssml } from './tts.ts'

const env = { AZURE_SPEECH_KEY: 'secret-key', AZURE_SPEECH_REGION: 'westeurope' }
const call = (query: string, headers: Record<string, string> = { referer: 'https://repasitos.es/play' }, e: Record<string, string | undefined> = env) =>
  handler(new Request(`https://repasitos.es/api/tts?${query}`, { headers }), e)

afterEach(() => vi.unstubAllGlobals())

describe('/api/tts', () => {
  it('refuses callers that are not our own pages', async () => {
    expect((await call('t=Hola', {})).status).toBe(403)
    expect((await call('t=Hola', { referer: 'https://evil.example/x' })).status).toBe(403)
  })

  it('refuses empty, long or markup-like text and unknown voices', async () => {
    expect((await call('t=')).status).toBe(400)
    expect((await call(`t=${'a'.repeat(401)}`)).status).toBe(400)
    expect((await call(`t=${encodeURIComponent('<break/>')}`)).status).toBe(400)
    expect((await call('t=Hola&v=robot')).status).toBe(400)
  })

  it('answers 503 without a key, so the app uses the device voice', async () => {
    expect((await call('t=Hola', undefined, {})).status).toBe(503)
  })

  it('returns cacheable MP3 from Azure and never exposes the key', async () => {
    const fetchMock = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await call(`t=${encodeURIComponent('¡Hola, Lía! Seis por siete son cuarenta y dos.')}&v=lumi`)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('audio/mpeg')
    expect(res.headers.get('cache-control')).toContain('immutable')
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1')
    expect((init.headers as Record<string, string>)['Ocp-Apim-Subscription-Key']).toBe('secret-key')
    expect(String(init.body)).toContain('es-ES-XimenaMultilingualNeural')
    expect(String(init.body)).toContain('<lang xml:lang="es-ES">')
    expect(await res.text()).not.toContain('secret-key')
  })

  it('maps an Azure refusal (quota) to 503', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('quota', { status: 429 })))
    expect((await call('t=Hola')).status).toBe(503)
  })

  it('escapes the text inside SSML', () => {
    expect(ssml(`Tom & "Jerry"`, 'narrator')).toContain('Tom &amp; &quot;Jerry&quot;')
  })
})
