import { __resetEngineForTests, unlock } from './context'
import { music } from './music'
import { __resetSpeechForTests, CHARACTERS, speech } from './speech'
import { installMockSpeech, VOICES, type MockSynth, type MockUtterance } from './testing/mockSpeech'

let synth: MockSynth
let uninstall: () => void

function setup(voices = [VOICES.samantha, VOICES.paulina, VOICES.monica, VOICES.eddy]) {
  ;({ synth, uninstall } = installMockSpeech(voices))
}

const last = (): MockUtterance => synth.spoken[synth.spoken.length - 1]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
  __resetSpeechForTests()
  __resetEngineForTests()
})

afterEach(() => {
  __resetSpeechForTests()
  vi.useRealTimers()
  vi.restoreAllMocks()
  uninstall?.()
})

describe('voice selection', () => {
  it('prefers a real es-ES voice (Mónica) over es-MX, English or novelty voices', () => {
    setup()
    expect(speech.voiceInfo()).toMatchObject({ name: 'Mónica', lang: 'es-ES' })
  })

  it('handles Android underscore locales', () => {
    setup([VOICES.samantha, VOICES.androidEs])
    expect(speech.voiceInfo()?.name).toBe('español España')
  })

  it('picks voices that load late (voiceschanged)', () => {
    setup([])
    expect(speech.voiceInfo()).toBeNull()
    expect(speech.available()).toBe(true) // unknown yet: optimistic
    synth.setVoices([VOICES.samantha, VOICES.monica])
    expect(speech.voiceInfo()?.name).toBe('Mónica')
  })

  it('polls for voices on platforms that never fire voiceschanged (iOS)', () => {
    setup([])
    speech.available()
    synth.voices = [VOICES.paulina]
    vi.advanceTimersByTime(300)
    expect(speech.voiceInfo()?.name).toBe('Paulina')
  })

  it('stops waiting for voices after a few seconds (no voices at all)', () => {
    setup([])
    expect(speech.available()).toBe(true)
    vi.advanceTimersByTime(6000)
    expect(speech.available()).toBe(false)
  })

  it('is unavailable when the platform has no Spanish voice', () => {
    setup([VOICES.samantha])
    expect(speech.available()).toBe(false)
  })

  it('is unavailable without the Web Speech API', () => {
    expect(speech.available()).toBe(false)
  })
})

describe('say()', () => {
  it('speaks cleaned, verbalised Spanish with the right voice and resolves on end', async () => {
    setup()
    let done = false
    const p = speech.say('¡Muy bien! 🎉 6 × 7 = 42').then(() => { done = true })
    const u = last()
    expect(u.text).toBe('¡Muy bien! seis por siete son cuarenta y dos')
    expect(u.lang).toBe('es-ES')
    expect(u.voice?.name).toBe('Mónica')
    await Promise.resolve()
    expect(done).toBe(false)
    synth.finish()
    await p
    expect(done).toBe(true)
  })

  it('gives each character its own pitch and pace', () => {
    setup()
    void speech.say('Hola', { voice: 'lumi' })
    expect(last().pitch).toBeCloseTo(CHARACTERS.lumi.pitch)
    synth.finish()
    void speech.say('Hola', { voice: 'guardian' })
    expect(last().pitch).toBeLessThan(1)
    expect(last().rate).toBeLessThan(CHARACTERS.lumi.rate)
    synth.finish()
    void speech.say('Hola', { voice: 'companion', rate: 1.2 })
    expect(last().pitch).toBeGreaterThan(CHARACTERS.lumi.pitch)
    expect(last().rate).toBeCloseTo(CHARACTERS.companion.rate * 1.2)
  })

  it('queues by default', async () => {
    setup()
    const order: string[] = []
    const a = speech.say('Uno').then(() => order.push('a'))
    const b = speech.say('Dos').then(() => order.push('b'))
    expect(synth.spoken.map((u) => u.text)).toEqual(['Uno'])
    synth.finish()
    await a
    expect(synth.spoken.map((u) => u.text)).toEqual(['Uno', 'Dos'])
    synth.finish()
    await b
    expect(order).toEqual(['a', 'b'])
  })

  it('interrupts when asked (and resolves the interrupted line)', async () => {
    setup()
    const a = speech.say('Una frase larga que no termina')
    void speech.say('En cola')
    const b = speech.say('¡Ahora!', { interrupt: true })
    await a
    expect(synth.cancels).toBeGreaterThan(0)
    // iOS drops an utterance spoken right after cancel(): we wait a beat.
    expect(last().text).toBe('Una frase larga que no termina')
    vi.advanceTimersByTime(150)
    expect(last().text).toBe('¡Ahora!')
    synth.finish()
    await b
  })

  it('caps the queue so stale lines do not pile up', async () => {
    setup()
    const ps = Array.from({ length: 8 }, (_, i) => speech.say(`Frase ${i + 1}`))
    // The oldest queued lines were dropped (resolved) — the first one is still speaking.
    await Promise.all(ps.slice(1, 4))
    expect(synth.spoken).toHaveLength(1)
    for (let i = 0; i < 6; i++) synth.finish()
    await Promise.all(ps)
    expect(synth.spoken.map((u) => u.text)).toEqual(['Frase uno', 'Frase cinco', 'Frase seis', 'Frase siete', 'Frase ocho'])
  })

  it('splits long text into sentence chunks', async () => {
    setup()
    const long = Array.from({ length: 12 }, (_, i) => `Esta es la frase número ${i + 1} de una historia muy bonita.`).join(' ')
    const p = speech.say(long)
    let guard = 0
    while (synth.speaking && guard++ < 20) synth.finish()
    await p
    expect(synth.spoken.length).toBeGreaterThan(2)
    for (const u of synth.spoken) expect(u.text.length).toBeLessThanOrEqual(220)
  })

  it('ducks the music while speaking', async () => {
    setup()
    const duck = vi.spyOn(music, 'duck')
    const p = speech.say('Hola')
    expect(duck).toHaveBeenLastCalledWith(true)
    synth.finish()
    await p
    vi.advanceTimersByTime(300)
    expect(duck).toHaveBeenLastCalledWith(false)
  })

  it('resolves immediately when disabled, for empty text and for emoji-only text', async () => {
    setup()
    speech.setEnabled(false)
    await speech.say('Hola')
    speech.setEnabled(true)
    await speech.say('')
    await speech.say('🎉✨⭐')
    expect(synth.spoken).toHaveLength(0)
  })

  it('stop() resolves everything', async () => {
    setup()
    const ps = [speech.say('Uno'), speech.say('Dos'), speech.say('Tres')]
    speech.stop()
    await Promise.all(ps)
    expect(speech.speaking()).toBe(false)
  })

  it('resolves via the watchdog when the engine never reports the end', async () => {
    setup()
    let done = false
    const p = speech.say('Hola, ¿qué tal?').then(() => { done = true })
    vi.advanceTimersByTime(60_000)
    await p
    expect(done).toBe(true)
  })

  it('resolves quickly when speech never starts (iOS before a gesture)', async () => {
    setup()
    synth.works = false
    let done = false
    const p = speech.say('Hola').then(() => { done = true })
    vi.advanceTimersByTime(2600)
    await p
    expect(done).toBe(true)
  })

  it('falls back to another voice when a cloud voice fails (offline)', async () => {
    setup([VOICES.elvira, VOICES.helena])
    expect(speech.voiceInfo()?.name).toMatch(/Elvira/)
    const p = speech.say('Hola')
    synth.fail('network')
    expect(last().voice?.name).toMatch(/Helena/)
    synth.finish()
    await p
    expect(speech.voiceInfo()?.name).toMatch(/Helena/)
  })

  it('avoids cloud voices while offline', () => {
    setup([VOICES.googleEs, VOICES.androidEs])
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(speech.voiceInfo()?.name).toBe('español España')
    online.mockReturnValue(true)
    expect(speech.voiceInfo()?.name).toBe('Google español')
  })

  it('stops speaking when the page is hidden', async () => {
    setup()
    const p = speech.say('Hola')
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    unlock() // installs the shared visibility listener
    document.dispatchEvent(new Event('visibilitychange'))
    await p
    expect(synth.cancels).toBeGreaterThan(0)
    hidden.mockRestore()
  })

  it('warms up speech inside the first gesture on iPad', () => {
    setup()
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1')
    speech.available() // wires the gesture hook
    unlock()
    unlock()
    const warm = synth.spoken.filter((u) => u.volume === 0)
    expect(warm).toHaveLength(1)
  })
})
