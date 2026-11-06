import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetPronunciationLimitForTests, handler } from './pronunciation.ts'

const env = { AZURE_SPEECH_KEY: 'secret-key', AZURE_SPEECH_REGION: 'northeurope' }
const ORIGIN = { origin: 'https://repasitos.es', 'content-type': 'audio/wav' }

/** A minimal WAV header (44 bytes) plus a little PCM: enough for the shape check. */
function wav(bytes = 64): Uint8Array {
  const out = new Uint8Array(44 + bytes)
  out.set(new TextEncoder().encode('RIFF'), 0)
  out.set(new TextEncoder().encode('WAVE'), 8)
  return out
}

const call = (
  query: string,
  body: Uint8Array | string | null = wav(),
  headers: Record<string, string> = ORIGIN,
  e: Record<string, string | undefined> = env,
) => handler(new Request(`https://repasitos.es/api/pronunciation?${query}`, { method: 'POST', headers, body }), e)

const azureOk = (score = 87) => new Response(JSON.stringify({
  RecognitionStatus: 'Success', DisplayText: 'Apple.', NBest: [{ PronScore: score, AccuracyScore: 90 }],
}), { status: 200 })

beforeEach(() => __resetPronunciationLimitForTests())
afterEach(() => vi.unstubAllGlobals())

describe('/api/pronunciation', () => {
  it('refuses callers that are not our own pages, and other methods', async () => {
    expect((await call('text=apple', wav(), { 'content-type': 'audio/wav' })).status).toBe(403)
    expect((await call('text=apple', wav(), { ...ORIGIN, origin: 'https://evil.example' })).status).toBe(403)
    const get = await handler(new Request('https://repasitos.es/api/pronunciation?text=apple', { headers: ORIGIN }), env)
    expect(get.status).toBe(405)
  })

  it('rejects a missing or markup-like reference text', async () => {
    expect((await call('')).status).toBe(400)
    expect((await call(`text=${encodeURIComponent('<b>apple</b>')}`)).status).toBe(400)
    expect((await call(`text=${'a'.repeat(65)}`)).status).toBe(400)
  })

  it('rejects a body that is not WAV', async () => {
    vi.stubGlobal('fetch', vi.fn())
    expect((await call('text=apple', new Uint8Array(100))).status).toBe(400)
    expect((await call('text=apple', new TextEncoder().encode('hola, esto no es audio'))).status).toBe(400)
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('rejects a body over 400 KB before it reaches Azure', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect((await call('text=apple', wav(400 * 1024))).status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a chunked body over 400 KB without reading all of it (no content-length)', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const chunk = new Uint8Array(100 * 1024)
    let pulled = 0
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled++
        if (pulled > 50) controller.close()
        else controller.enqueue(chunk.slice())
      },
    })
    const req = new Request('https://repasitos.es/api/pronunciation?text=apple', {
      method: 'POST', headers: { ...ORIGIN }, body: stream, duplex: 'half',
    } as RequestInit)
    expect((await handler(req, env)).status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
    // Stopped soon after the limit (about 5 chunks of 100 KB), not after the 50 offered.
    expect(pulled).toBeLessThan(10)
  })

  it('answers noSpeech, not a score, when Azure heard nothing (NoMatch)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ RecognitionStatus: 'NoMatch' }), { status: 200 })))
    const res = await call('text=apple')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ noSpeech: true })
  })

  it('answers skipped when the key or the region is missing', async () => {
    const res = await call('text=apple', wav(), ORIGIN, {})
    expect(await res.json()).toEqual({ skipped: true })
  })

  it('scores the clip with Azure and returns only the score', async () => {
    const fetchMock = vi.fn(async () => azureOk(87))
    vi.stubGlobal('fetch', fetchMock)
    const res = await call('text=apple')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ score: 87 })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('https://northeurope.stt.speech.microsoft.com/')
    expect(url).toContain('language=en-GB')
    const h = init.headers as Record<string, string>
    expect(h['Ocp-Apim-Subscription-Key']).toBe('secret-key')
    expect(h['Content-Type']).toContain('audio/wav')
    const assessment = JSON.parse(atob(h['Pronunciation-Assessment']))
    expect(assessment).toMatchObject({ ReferenceText: 'apple', GradingSystem: 'HundredMark' })
    expect(assessment.Granularity).not.toBe('Phoneme')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('answers skipped when Azure refuses (quota 429 or 403), fails or stalls', async () => {
    for (const status of [429, 403, 500]) {
      vi.stubGlobal('fetch', vi.fn(async () => new Response('quota', { status })))
      expect(await (await call('text=apple')).json()).toEqual({ skipped: true })
    }
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('aborted', 'TimeoutError') }))
    expect(await (await call('text=apple')).json()).toEqual({ skipped: true })
  })

  it('never returns the key and never answers with the audio', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => azureOk(40)))
    const text = await (await call('text=apple')).text()
    expect(text).not.toContain('secret-key')
    expect(text).not.toContain('RIFF')
  })

  it('limits each client IP to 60 clips per window, then answers 429', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => azureOk()))
    const h = { ...ORIGIN, 'x-forwarded-for': '203.0.113.9' }
    for (let i = 0; i < 60; i++) expect((await call('text=apple', wav(), h)).status).toBe(200)
    expect((await call('text=apple', wav(), h)).status).toBe(429)
    expect((await call('text=apple', wav(), { ...h, 'x-forwarded-for': '198.51.100.4' })).status).toBe(200)
  })
})
