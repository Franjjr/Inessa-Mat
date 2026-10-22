import type { MusicTheme } from '@/types'
import { __resetEngineForTests, getEngine, unlock } from './context'
import { __musicPlayerForTests, __resetMusicForTests, music, THEMES } from './music'
import { installMockAudio, lastContext, MockGain, MockSource, type MockAudioContext } from './testing/mockAudio'

const THEME_NAMES = Object.keys(THEMES) as Exclude<MusicTheme, 'none'>[]

let uninstall: () => void

/** Advance wall clock and audio clock together in small steps (like a real browser). */
function run(ctx: MockAudioContext, seconds: number) {
  const step = 0.05
  for (let t = 0; t < seconds; t += step) {
    ctx.advance(step)
    vi.advanceTimersByTime(step * 1000)
  }
}

function ready(): MockAudioContext {
  unlock()
  return lastContext()
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
  uninstall = installMockAudio()
  __resetEngineForTests()
  __resetMusicForTests()
})

afterEach(() => {
  __resetMusicForTests()
  __resetEngineForTests()
  vi.useRealTimers()
  uninstall()
})

describe('music themes', () => {
  it.each(THEME_NAMES)('%s plays a gentle, safe generative loop', (theme) => {
    const ctx = ready()
    music.play(theme)
    const player = __musicPlayerForTests()!
    expect(player.theme).toBe(theme)
    const before = ctx.sources().length
    const nodesBefore = ctx.nodes.length
    run(ctx, 12)
    const sources = ctx.sources().slice(before)
    const created = ctx.nodes.slice(nodesBefore)
    // Several notes per bar, but not a wall of sound.
    expect(sources.length).toBeGreaterThan(20)
    expect(sources.length).toBeLessThan(1500)
    for (const g of created.filter((n): n is MockGain => n instanceof MockGain)) expect(g.gain.max()).toBeLessThanOrEqual(1)
    // Theme gain fades in to its (quiet) level.
    expect((player.out as unknown as MockGain).gain.max()).toBeCloseTo(THEMES[theme].level, 5)
    // Notes are scheduled slightly ahead, never in the past.
    for (const s of sources) expect(s.stopTime!).toBeGreaterThan(s.startTime!)
    // Finished notes get cleaned up: only the notes still ringing remain.
    expect(player.activeVoices).toBeLessThan(40)
  })

  it('is quiet by default: the music bus sits well below the effects', () => {
    ready()
    const e = getEngine()!
    expect((e.musicBus as unknown as MockGain).gain.value).toBeLessThanOrEqual(0.35)
    expect((e.musicBus as unknown as MockGain).gain.value).toBeLessThan((e.sfxBus as unknown as MockGain).gain.value)
  })
})

describe('music controller', () => {
  it('waits for the gesture before starting', () => {
    music.play('map')
    expect(__musicPlayerForTests()).toBeNull()
    const ctx = ready()
    expect(__musicPlayerForTests()?.theme).toBe('map')
    run(ctx, 1)
    expect(music.isPlaying()).toBe(true)
  })

  it('crossfades between themes and disposes the old one', () => {
    const ctx = ready()
    music.play('map')
    run(ctx, 3)
    const old = __musicPlayerForTests()!
    music.play('guardian')
    const next = __musicPlayerForTests()!
    expect(next).not.toBe(old)
    expect(next.theme).toBe('guardian')
    expect(old.stopping).toBe(true)
    expect((old.out as unknown as MockGain).gain.events.at(-1)).toMatchObject({ type: 'linear', value: 0 })
    run(ctx, 3)
    expect(old.activeVoices).toBe(0)
    expect((old.out as unknown as MockGain).disconnects).toBeGreaterThan(0)
  })

  it('ignores a repeated play of the same theme', () => {
    ready()
    music.play('calm')
    const p = __musicPlayerForTests()
    music.play('calm')
    expect(__musicPlayerForTests()).toBe(p)
  })

  it("stops with 'none' and stop()", () => {
    const ctx = ready()
    music.play('play')
    run(ctx, 1)
    music.play('none')
    expect(music.isPlaying()).toBe(false)
    music.play('map')
    expect(music.isPlaying()).toBe(true)
    music.stop()
    expect(music.isPlaying()).toBe(false)
    expect(music.current()).toBe('none')
  })

  it('pauses while the tab is hidden and resumes when visible', () => {
    const ctx = ready()
    music.play('map')
    run(ctx, 1)
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(music.isPlaying()).toBe(false)
    const count = ctx.sources().length
    run(ctx, 3)
    // No new notes while hidden (the context is even suspended to save battery).
    expect(ctx.sources().length).toBe(count)
    expect(ctx.state).toBe('suspended')
    hidden.mockReturnValue(false)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(ctx.state).toBe('running')
    expect(music.isPlaying()).toBe(true)
    expect(music.current()).toBe('map')
    hidden.mockRestore()
  })

  it('remembers the theme while disabled', () => {
    const ctx = ready()
    music.setEnabled(false)
    music.play('celebration')
    expect(music.isPlaying()).toBe(false)
    music.setEnabled(true)
    expect(__musicPlayerForTests()?.theme).toBe('celebration')
    run(ctx, 1)
  })

  it('ducks under speech and comes back', () => {
    ready()
    const duck = getEngine()!.duck as unknown as MockGain
    music.duck(true)
    expect(duck.gain.events.at(-1)).toMatchObject({ type: 'target', value: 0.3 })
    music.duck(false)
    expect(duck.gain.events.at(-1)).toMatchObject({ type: 'target', value: 1 })
  })

  it('never schedules late bursts after a stall', () => {
    const ctx = ready()
    music.play('celebration')
    run(ctx, 1)
    // The audio clock jumps 5 s while timers were frozen (busy main thread).
    ctx.advance(5)
    const before = ctx.sources().filter((s: MockSource) => s.startTime !== null).length
    vi.advanceTimersByTime(50)
    const added = ctx.sources().slice(before)
    for (const s of added) expect(s.startTime!).toBeGreaterThanOrEqual(ctx.currentTime)
    expect(added.length).toBeLessThan(40)
  })
})
