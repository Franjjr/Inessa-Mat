import type { SfxName } from '@/types'
import { __resetEngineForTests, getEngine, unlock } from './context'
import { __resetSfxForTests, activeSfxVoices, SFX_META, SFX_NAMES, sfx } from './sfx'
import { installMockAudio, lastContext, MockBiquad, MockGain, MockOscillator, MockSource, type MockAudioContext, type MockNode } from './testing/mockAudio'

const ALL: SfxName[] = [
  'tap', 'select', 'write', 'erase', 'correct', 'wrong', 'streak', 'hint', 'star', 'crystal', 'levelup', 'unlock', 'rescue',
  'whoosh', 'pop', 'sparkle', 'page', 'dice', 'step', 'chest-open', 'fanfare', 'tick', 'timeup', 'coin',
]

let uninstall: () => void
let clock = 1000

function advanceMs(ms: number) {
  clock += ms
}

function ready(): MockAudioContext {
  unlock()
  const ctx = lastContext()
  expect(ctx.state).toBe('running')
  return ctx
}

/** Play one sound and return the nodes it created. */
function playAndCapture(ctx: MockAudioContext, name: SfxName, opts?: { volume?: number; pitch?: number }): MockNode[] {
  const before = ctx.nodes.length
  sfx.play(name, opts)
  return ctx.nodes.slice(before)
}

beforeEach(() => {
  uninstall = installMockAudio()
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  __resetEngineForTests()
  __resetSfxForTests()
})

afterEach(() => {
  __resetSfxForTests()
  __resetEngineForTests()
  vi.restoreAllMocks()
  vi.useRealTimers()
  uninstall()
})

describe('sfx catalogue', () => {
  it('has a recipe and metadata for every SfxName', () => {
    expect([...SFX_NAMES].sort()).toEqual([...ALL].sort())
  })

  it.each(ALL)('%s schedules a safe, short, self-cleaning voice', (name) => {
    const ctx = ready()
    const t0 = ctx.currentTime
    const nodes = playAndCapture(ctx, name)
    expect(nodes.length).toBeGreaterThan(1)

    const sources = nodes.filter((n): n is MockSource => n instanceof MockSource)
    expect(sources.length).toBeGreaterThan(0)
    for (const s of sources) {
      expect(s.startTime).not.toBeNull()
      expect(s.stopTime).not.toBeNull()
      // Low latency: everything starts within a few ms of "now" or later in the phrase.
      expect(s.startTime!).toBeGreaterThanOrEqual(t0)
      expect(s.startTime! - t0).toBeLessThan(2)
      expect(s.stopTime!).toBeGreaterThan(s.startTime!)
      // Effects are short (the longest, chest-open, is ~2.5 s).
      expect(s.stopTime! - t0).toBeLessThan(3)
    }

    // Gains never exceed unity (no clipping/loud surprises for small ears).
    for (const g of nodes.filter((n): n is MockGain => n instanceof MockGain)) expect(g.gain.max()).toBeLessThanOrEqual(1)

    // Oscillators stay in the audible range and below Nyquist.
    for (const o of nodes.filter((n): n is MockOscillator => n instanceof MockOscillator)) {
      const freqs = [o.frequency.initial, ...o.frequency.events.map((e) => e.value)].filter((v) => !Number.isNaN(v))
      for (const f of freqs) {
        expect(f).toBeGreaterThanOrEqual(20)
        expect(f).toBeLessThan(ctx.sampleRate / 2)
      }
    }
    for (const b of nodes.filter((n): n is MockBiquad => n instanceof MockBiquad)) {
      for (const e of b.frequency.events) expect(e.value).toBeLessThan(ctx.sampleRate / 2)
    }

    // Every envelope ends at silence (no clicks, no stuck notes).
    const voiceGains = nodes.filter((n): n is MockGain => n instanceof MockGain).filter((g) => g.gain.events.some((e) => e.type === 'exp'))
    expect(voiceGains.length).toBeGreaterThan(0)
    for (const g of voiceGains) {
      const last = g.gain.events[g.gain.events.length - 1]
      expect(last.value).toBe(0)
    }

    expect(activeSfxVoices()).toBe(1)
    // Cleanup: once all sources ended, every node of the voice is disconnected.
    ctx.advance(5)
    expect(activeSfxVoices()).toBe(0)
    for (const n of nodes) expect(n.disconnects).toBeGreaterThan(0)
  })

  it('routes effects through the sfx bus, never straight to the speakers', () => {
    const ctx = ready()
    const e = getEngine()!
    const nodes = playAndCapture(ctx, 'correct')
    const out = nodes[0] as MockGain
    expect(out.outputs.has(e.sfxBus)).toBe(true)
    for (const n of nodes) expect(n.outputs.has(ctx.destination)).toBe(false)
  })
})

describe('sfx player', () => {
  it('does nothing before any user gesture (no context is created)', () => {
    sfx.play('correct')
    expect(getEngine()).toBeNull()
  })

  it('respects the enable flag', () => {
    const ctx = ready()
    sfx.setEnabled(false)
    expect(playAndCapture(ctx, 'tap')).toHaveLength(0)
    sfx.setEnabled(true)
    advanceMs(100)
    expect(playAndCapture(ctx, 'tap').length).toBeGreaterThan(0)
  })

  it('fades out playing voices when disabled', () => {
    const ctx = ready()
    const nodes = playAndCapture(ctx, 'fanfare')
    sfx.setEnabled(false)
    const out = nodes[0] as MockGain
    expect(out.gain.events.at(-1)).toMatchObject({ type: 'linear', value: 0 })
    expect(activeSfxVoices()).toBe(0)
  })

  it('rate-limits pencil ticks', () => {
    const ctx = ready()
    expect(playAndCapture(ctx, 'write').length).toBeGreaterThan(0)
    advanceMs(10)
    expect(playAndCapture(ctx, 'write')).toHaveLength(0)
    advanceMs(SFX_META.write.gap)
    expect(playAndCapture(ctx, 'write').length).toBeGreaterThan(0)
  })

  it('steals the oldest voice beyond the per-sound limit', () => {
    const ctx = ready()
    const first = playAndCapture(ctx, 'pop')
    for (let i = 0; i < SFX_META.pop.max; i++) {
      advanceMs(SFX_META.pop.gap + 1)
      sfx.play('pop')
    }
    expect(activeSfxVoices()).toBe(SFX_META.pop.max)
    const out = first[0] as MockGain
    expect(out.gain.events.at(-1)).toMatchObject({ type: 'linear', value: 0 })
  })

  it('caps total polyphony', () => {
    ready()
    for (let i = 0; i < 40; i++) {
      advanceMs(1000)
      sfx.play(ALL[i % ALL.length])
    }
    expect(activeSfxVoices()).toBeLessThanOrEqual(14)
  })

  it('applies volume and pitch options', () => {
    const ctx = ready()
    const loud = playAndCapture(ctx, 'select')
    advanceMs(1000)
    const soft = playAndCapture(ctx, 'select', { volume: 0.25 })
    expect((soft[0] as MockGain).gain.value).toBeCloseTo((loud[0] as MockGain).gain.value * 0.25, 5)
    advanceMs(1000)
    const nodes = playAndCapture(ctx, 'correct', { pitch: 2 })
    const firstOsc = nodes.find((n): n is MockOscillator => n instanceof MockOscillator)!
    const f = firstOsc.frequency.events[0].value
    expect(f / 880).toBeGreaterThan(1.95)
    expect(f / 880).toBeLessThan(2.05)
    advanceMs(1000)
    expect(playAndCapture(ctx, 'correct', { volume: 0 })).toHaveLength(0)
  })

  it('varies pitch slightly between repeats', () => {
    const ctx = ready()
    const freqs = new Set<number>()
    for (let i = 0; i < 6; i++) {
      advanceMs(1000)
      const nodes = playAndCapture(ctx, 'tap')
      const o = nodes.find((n): n is MockOscillator => n instanceof MockOscillator)!
      freqs.add(Math.round(o.frequency.events[0].value * 100))
    }
    expect(freqs.size).toBeGreaterThan(1)
  })

  it('plays the first tap once the context wakes up (grace queue)', () => {
    unlock()
    const ctx = lastContext()
    void ctx.suspend()
    ctx.allowResume = false
    const before = ctx.nodes.length
    sfx.play('tap')
    expect(ctx.nodes.length).toBe(before)
    ctx.allowResume = true
    void ctx.resume()
    expect(ctx.nodes.length).toBeGreaterThan(before)
  })

  it('drops stale queued sounds instead of firing them late', () => {
    unlock()
    const ctx = lastContext()
    void ctx.suspend()
    ctx.allowResume = false
    sfx.play('tap')
    advanceMs(2000)
    const before = ctx.nodes.length
    ctx.allowResume = true
    void ctx.resume()
    expect(ctx.nodes.length).toBe(before)
  })

  it('skips sounds while the page is hidden', () => {
    const ctx = ready()
    const spy = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    expect(playAndCapture(ctx, 'correct')).toHaveLength(0)
    spy.mockRestore()
  })

  it('never throws for unknown names', () => {
    ready()
    expect(() => sfx.play('nope' as SfxName)).not.toThrow()
  })
})
