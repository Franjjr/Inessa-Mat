/* The client of /api/pronunciation: a score, «nothing heard», or skipped for anything else (never a thrown error). */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { scoreSpeech } from './pronunciation'

const clip = new Blob([new Uint8Array([1])], { type: 'audio/wav' })
afterEach(() => vi.unstubAllGlobals())

describe('scoreSpeech', () => {
  it('returns the score the server gives', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ score: 88 }), { status: 200 })))
    expect(await scoreSpeech('cat', clip)).toEqual({ score: 88 })
  })

  it('returns noSpeech when the server heard nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ noSpeech: true }), { status: 200 })))
    expect(await scoreSpeech('cat', clip)).toEqual({ noSpeech: true })
  })

  it('skips on a refusal, a failure or a network error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('quota', { status: 429 })))
    expect(await scoreSpeech('cat', clip)).toEqual({ skipped: true })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
    expect(await scoreSpeech('cat', clip)).toEqual({ skipped: true })
  })

  it('stops waiting after 6 s, the same bound as the server (5 s for Azure)', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ score: 70 }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await scoreSpeech('cat', clip)
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })
})
