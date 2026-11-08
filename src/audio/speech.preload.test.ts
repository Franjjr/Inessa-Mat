/* speech.preload (a song's lines fetched before it starts) and deviceOnly (the whole song with the device voice). */
import { __resetSpeechForTests, speech } from './speech'
import { installMockSpeech, VOICES, type MockSynth } from './testing/mockSpeech'

const neural = vi.hoisted(() => ({
  available: true,
  fetchClip: vi.fn<(text: string, character: string) => Promise<string | null>>(),
}))
vi.mock('./neuralVoice', () => ({
  neuralAvailable: () => neural.available,
  fetchClip: neural.fetchClip,
  playClip: vi.fn(async () => true),
  stopClip: vi.fn(),
}))

let synth: MockSynth
let uninstall: () => void

beforeEach(() => {
  ;({ synth, uninstall } = installMockSpeech([VOICES.monica]))
  __resetSpeechForTests()
  neural.available = true
  neural.fetchClip.mockReset()
})
afterEach(() => {
  __resetSpeechForTests()
  uninstall()
})

describe('speech.preload', () => {
  it('is true when every clip arrives', async () => {
    neural.fetchClip.mockResolvedValue('blob:x')
    expect(await speech.preload(['Siete por ocho, cincuenta y seis', '¡Canta conmigo!'], { voice: 'lumi', timeoutMs: 500 })).toBe(true)
    expect(neural.fetchClip).toHaveBeenCalledTimes(2)
  })

  it('is false when one clip is missing or late', async () => {
    neural.fetchClip.mockResolvedValueOnce('blob:x').mockResolvedValueOnce(null)
    expect(await speech.preload(['uno', 'dos'], { voice: 'lumi', timeoutMs: 500 })).toBe(false)
    neural.fetchClip.mockReset()
    neural.fetchClip.mockResolvedValueOnce('blob:x').mockImplementationOnce(() => new Promise((r) => setTimeout(() => r('blob:y'), 200)))
    expect(await speech.preload(['uno', 'dos'], { voice: 'lumi', timeoutMs: 50 })).toBe(false)
  })

  it('is false without neural voice', async () => {
    neural.available = false
    expect(await speech.preload(['uno'], { voice: 'lumi', timeoutMs: 500 })).toBe(false)
    expect(neural.fetchClip).not.toHaveBeenCalled()
  })
})

describe('deviceOnly', () => {
  it('never asks for a clip', async () => {
    neural.fetchClip.mockResolvedValue('blob:x')
    const done = speech.say('Siete por ocho, cincuenta y seis', { voice: 'lumi', force: true, deviceOnly: true })
    await vi.waitFor(() => expect(synth.spoken.length).toBe(1))
    expect(neural.fetchClip).not.toHaveBeenCalled()
    synth.finish()
    void done
  })
})
