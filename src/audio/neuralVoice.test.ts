import { __resetEngineForTests } from './context'
import { __resetNeuralForTests } from './neuralVoice'
import { __resetSpeechForTests, speech } from './speech'
import { installMockSpeech, VOICES, type MockSynth } from './testing/mockSpeech'

/** <audio> stand-in: play() succeeds and the clip "ends" on the next tick, or fails when `failPlay` is set. */
class FakeAudio {
  static played: string[] = []
  static failPlay = false
  src = ''
  preload = ''
  playbackRate = 1
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  play(): Promise<void> {
    if (FakeAudio.failPlay) return Promise.reject(new Error('NotAllowed'))
    FakeAudio.played.push(this.src)
    setTimeout(() => this.onended?.(), 0)
    return Promise.resolve()
  }
  pause(): void {}
}

let synth: MockSynth
let uninstall: () => void
const flush = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  __resetSpeechForTests()
  __resetEngineForTests()
  __resetNeuralForTests(true)
  FakeAudio.played = []
  FakeAudio.failPlay = false
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: (b: Blob) => `blob:${b.size}` }))
  ;({ synth, uninstall } = installMockSpeech([VOICES.monica]))
})

afterEach(() => {
  __resetNeuralForTests()
  __resetSpeechForTests()
  vi.unstubAllGlobals()
  uninstall?.()
})

describe('natural voice', () => {
  it('plays the clip from /api/tts and does not use the device voice', async () => {
    const fetchMock = vi.fn(async (_url: string) => new Response(new Blob([new Uint8Array(5)]), { headers: { "content-type": "audio/mpeg" } }))
    vi.stubGlobal('fetch', fetchMock)
    await speech.say('6 × 7 = 42', { voice: 'companion' })
    expect(String(fetchMock.mock.calls[0][0])).toBe(`/api/tts?v=companion&r=1&t=${encodeURIComponent('seis por siete son cuarenta y dos')}`)
    expect(FakeAudio.played).toHaveLength(1)
    expect(FakeAudio.played[0]).toMatch(/^blob:/)
    expect(synth.spoken).toHaveLength(0)
  })

  it('falls back to the device voice when the server has no voice (503), and stops asking', async () => {
    const fetchMock = vi.fn(async () => new Response('no', { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)
    void speech.say('Hola')
    await flush()
    await flush()
    expect(synth.spoken.map((u) => u.text)).toEqual(['Hola'])
    synth.finish()
    await flush()
    void speech.say('Adiós')
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to the device voice when the clip cannot play', async () => {
    FakeAudio.failPlay = true
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob([new Uint8Array(3)]), { headers: { 'content-type': 'audio/mpeg' } })))
    void speech.say('Hola')
    await flush()
    await flush()
    expect(synth.spoken.map((u) => u.text)).toEqual(['Hola'])
  })

  it('uses the device voice the adult picked instead of the natural one', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    speech.setPreferredVoice(speech.voices()[0].id)
    void speech.say('Hola')
    await flush()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(synth.spoken).toHaveLength(1)
    speech.setPreferredVoice(null)
  })
})
