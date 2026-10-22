import { __resetEngineForTests } from './context'
import { __resetHapticsForTests } from './haptics'
import { applyAudioSettings, audioState, haptics, music, setMasterVolume, sfx, speech, unlockAudio } from './index'
import { __resetMusicForTests } from './music'
import { __resetSfxForTests } from './sfx'
import { __resetSpeechForTests } from './speech'
import { installMockAudio, lastContext, MockAudioContext } from './testing/mockAudio'

let uninstall: () => void

beforeEach(() => {
  uninstall = installMockAudio()
  __resetEngineForTests()
  __resetSfxForTests()
  __resetMusicForTests()
  __resetSpeechForTests()
  __resetHapticsForTests()
})

afterEach(() => {
  __resetMusicForTests()
  __resetEngineForTests()
  vi.restoreAllMocks()
  uninstall()
})

describe('public audio API', () => {
  it('exposes the contract', () => {
    expect(typeof sfx.play).toBe('function')
    expect(typeof sfx.setEnabled).toBe('function')
    expect(typeof music.play).toBe('function')
    expect(typeof music.stop).toBe('function')
    expect(typeof music.setEnabled).toBe('function')
    expect(typeof music.duck).toBe('function')
    expect(typeof speech.available).toBe('function')
    expect(typeof speech.say).toBe('function')
    expect(typeof speech.stop).toBe('function')
    expect(typeof speech.setEnabled).toBe('function')
    expect(typeof haptics.tap).toBe('function')
    expect(typeof haptics.success).toBe('function')
    expect(typeof haptics.error).toBe('function')
  })

  it('unlockAudio creates and resumes one context, idempotently', () => {
    expect(audioState()).toBe('locked')
    unlockAudio()
    unlockAudio()
    unlockAudio()
    expect(MockAudioContext.instances).toHaveLength(1)
    expect(lastContext().state).toBe('running')
    expect(audioState()).toBe('running')
  })

  it('kicks iOS with a silent one-sample buffer inside the gesture', () => {
    unlockAudio()
    const ctx = lastContext()
    const silent = ctx.sources().find((s) => s.outputs.has(ctx.destination))
    expect(silent).toBeDefined()
  })

  it('keeps resuming on later gestures (Chrome needs pointerup/touchend, iOS interrupts contexts)', () => {
    unlockAudio()
    const ctx = lastContext()
    void ctx.suspend()
    expect(audioState()).toBe('suspended')
    window.dispatchEvent(new Event('pointerup'))
    expect(ctx.state).toBe('running')
    void ctx.suspend()
    window.dispatchEvent(new Event('touchend'))
    expect(ctx.state).toBe('running')
  })

  it('reports "off" without Web Audio', () => {
    uninstall()
    const w = window as unknown as Record<string, unknown>
    const prev = w.AudioContext
    delete w.AudioContext
    delete (globalThis as unknown as Record<string, unknown>).AudioContext
    expect(audioState()).toBe('off')
    expect(() => { unlockAudio(); sfx.play('correct'); music.play('map') }).not.toThrow()
    w.AudioContext = prev
    uninstall = installMockAudio()
  })

  it('applyAudioSettings routes each flag (haptics follow sound)', () => {
    const v = vi.fn(() => true)
    Object.defineProperty(navigator, 'vibrate', { value: v, configurable: true, writable: true })
    unlockAudio()
    applyAudioSettings({ sound: false, music: false, voice: false })
    expect(sfx.isEnabled()).toBe(false)
    haptics.success()
    expect(v).not.toHaveBeenCalledWith([14, 70, 22])
    music.play('map')
    expect(music.isPlaying()).toBe(false)
    applyAudioSettings({ sound: true, music: true, voice: true })
    expect(sfx.isEnabled()).toBe(true)
    expect(music.isPlaying()).toBe(true)
    haptics.success()
    expect(v).toHaveBeenCalledWith([14, 70, 22])
    delete (navigator as unknown as Record<string, unknown>).vibrate
  })

  it('sleeps the context when effects and music are both off, and wakes it again', () => {
    vi.useFakeTimers()
    unlockAudio()
    const ctx = lastContext()
    applyAudioSettings({ sound: false, music: false, voice: true })
    vi.advanceTimersByTime(1000)
    expect(ctx.state).toBe('suspended')
    // Gestures no longer wake it while nothing needs audio.
    window.dispatchEvent(new Event('pointerup'))
    expect(ctx.state).toBe('suspended')
    applyAudioSettings({ sound: true, music: false, voice: true })
    expect(ctx.state).toBe('running')
    vi.useRealTimers()
  })

  it('does not create a context on gestures when all audio is off', () => {
    applyAudioSettings({ sound: false, music: false, voice: false })
    window.dispatchEvent(new Event('pointerup'))
    unlockAudio()
    expect(MockAudioContext.instances).toHaveLength(0)
  })

  it('setMasterVolume ramps the master bus', () => {
    unlockAudio()
    setMasterVolume(0.5)
    const ctx = lastContext()
    const ramps = ctx.gains().flatMap((g) => g.gain.events).filter((e) => e.type === 'linear' && e.value === 0.5)
    expect(ramps.length).toBe(1)
  })
})
