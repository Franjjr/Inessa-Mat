/* Gentle generative background music (Web Audio, no files).
   Each MusicTheme is a recipe: tempo, a pentatonic scale, a 4-chord loop and soft instruments (marimba, glock,
   kalimba-like pluck, warm pad, round bass, a whisper of shaker). Melodies are built from short motifs that repeat
   with variations, snapping to chord tones on strong beats, so the loop never feels random nor repetitive.
   Quiet by default, crossfades between themes, pauses while the tab is hidden and ducks under speech. */
import type { MusicTheme } from '@/types'
import { getEngine, onGesture, onStateChange, onVisibility, peekEngine, setLevel, type AudioEngine } from './context'
import { clamp, mtof, PENTA_MAJOR, PENTA_MINOR, pick, rand, scaleNotes } from './notes'
import { glock, marimba, noiseHit, pad, pluck, tone, Voice } from './synth'

type Inst = 'marimba' | 'glock' | 'pluck'

interface ThemeDef {
  bpm: number
  /** Delay of off-beat 8ths as a fraction of an 8th (0 = straight). */
  swing: number
  /** Theme gain (0..1) on top of the music bus. */
  level: number
  reverb: number
  root: number
  scale: number[]
  /** Chord loop; each chord is a MIDI voicing whose first note is the bass. */
  chords: number[][]
  barsPerChord: number
  melody: { inst: Inst; density: number; lo: number; hi: number; peak: number; everyOtherPhrase?: boolean }
  arp?: { inst: Inst; pattern: (number | null)[]; peak: number }
  bass?: { steps: number[]; peak: number; dur: number }
  pad: { peak: number; cutoff: number }
  shaker?: { steps: number[]; peak: number }
  thump?: { steps: number[]; peak: number }
  /** Probability per bar of a tiny glock flourish. */
  sparkle: number
}

const C = [48, 55, 60, 64]
const Am = [45, 57, 60, 64]
const F = [41, 57, 60, 65]
const G = [43, 55, 59, 62]

export const THEMES: Record<Exclude<MusicTheme, 'none'>, ThemeDef> = {
  map: {
    bpm: 84, swing: 0.12, level: 0.9, reverb: 0.3, root: 60, scale: PENTA_MAJOR,
    chords: [C, Am, F, G], barsPerChord: 1,
    melody: { inst: 'marimba', density: 0.42, lo: 67, hi: 88, peak: 0.32 },
    bass: { steps: [0, 4], peak: 0.3, dur: 0.5 },
    pad: { peak: 0.1, cutoff: 1500 },
    sparkle: 0.25,
  },
  calm: {
    bpm: 64, swing: 0, level: 0.85, reverb: 0.42, root: 65, scale: PENTA_MAJOR,
    chords: [[41, 57, 60, 65], [38, 57, 62, 65], [46, 58, 62, 65], [48, 55, 60, 64]], barsPerChord: 2,
    melody: { inst: 'glock', density: 0.16, lo: 72, hi: 93, peak: 0.2, everyOtherPhrase: true },
    bass: { steps: [0], peak: 0.22, dur: 1.4 },
    pad: { peak: 0.13, cutoff: 1200 },
    sparkle: 0.1,
  },
  play: {
    bpm: 92, swing: 0.08, level: 0.7, reverb: 0.3, root: 67, scale: PENTA_MAJOR,
    chords: [[43, 55, 59, 62], [48, 55, 60, 64], [40, 55, 59, 64], [38, 54, 57, 62]], barsPerChord: 1,
    melody: { inst: 'pluck', density: 0.22, lo: 67, hi: 86, peak: 0.24, everyOtherPhrase: true },
    arp: { inst: 'marimba', pattern: [0, null, 1, null, 2, null, 1, null], peak: 0.14 },
    bass: { steps: [0, 4], peak: 0.24, dur: 0.45 },
    pad: { peak: 0.08, cutoff: 1300 },
    shaker: { steps: [1, 3, 5, 7], peak: 0.02 },
    sparkle: 0.12,
  },
  guardian: {
    bpm: 100, swing: 0, level: 0.85, reverb: 0.28, root: 57, scale: PENTA_MINOR,
    chords: [Am, F, C, G], barsPerChord: 1,
    melody: { inst: 'marimba', density: 0.4, lo: 64, hi: 86, peak: 0.3 },
    bass: { steps: [0, 2, 4, 6], peak: 0.26, dur: 0.24 },
    pad: { peak: 0.1, cutoff: 1300 },
    shaker: { steps: [1, 3, 5, 7], peak: 0.025 },
    thump: { steps: [0, 4], peak: 0.2 },
    sparkle: 0.1,
  },
  celebration: {
    bpm: 116, swing: 0.06, level: 0.9, reverb: 0.3, root: 60, scale: PENTA_MAJOR,
    chords: [C, F, C, G], barsPerChord: 1,
    melody: { inst: 'glock', density: 0.55, lo: 72, hi: 93, peak: 0.26 },
    arp: { inst: 'marimba', pattern: [0, 1, 2, 1, 0, 1, 2, 1], peak: 0.13 },
    bass: { steps: [0, 3, 4, 7], peak: 0.28, dur: 0.3 },
    pad: { peak: 0.09, cutoff: 1800 },
    shaker: { steps: [0, 1, 2, 3, 4, 5, 6, 7], peak: 0.018 },
    thump: { steps: [0, 4], peak: 0.16 },
    sparkle: 0.4,
  },
}

const STEPS_PER_BAR = 8
const PHRASE_BARS = 4
const LOOKAHEAD = 0.22
const TICK_MS = 45

interface MotifNote { step: number; delta: number; len: number }

function play(inst: Inst, v: Voice, freq: number, t: number, dur: number, peak: number, dest?: AudioNode): void {
  if (inst === 'marimba') marimba(v, freq, t, dur, peak, dest)
  else if (inst === 'glock') glock(v, freq, t, dur, peak, dest)
  else pluck(v, freq, t, dur, peak, dest)
}

export class ThemePlayer {
  readonly theme: Exclude<MusicTheme, 'none'>
  readonly def: ThemeDef
  readonly out: GainNode
  stopping = false
  /** Optional note tracer (dev gallery piano roll). */
  trace: ((n: { t: number; midi: number; part: 'melody' | 'arp' | 'bass' | 'pad' | 'sparkle'; dur: number }) => void) | null = null
  private e: AudioEngine
  private rng: () => number
  private voices = new Set<Voice>()
  private timer: ReturnType<typeof setTimeout> | undefined
  private nextTime = 0
  private step = 0
  private motif: MotifNote[] = []
  private variant: MotifNote[] = []
  private melIdx = 0
  private melNotes: number[]
  private disposeTimer: ReturnType<typeof setTimeout> | undefined

  constructor(e: AudioEngine, theme: Exclude<MusicTheme, 'none'>, rng: () => number = Math.random) {
    this.e = e
    this.theme = theme
    this.def = THEMES[theme]
    this.rng = rng
    this.out = e.ctx.createGain()
    this.out.gain.value = 0
    this.out.connect(e.musicBus)
    this.melNotes = scaleNotes(this.def.root, this.def.scale, this.def.melody.lo, this.def.melody.hi)
    this.melIdx = Math.floor(this.melNotes.length / 2)
  }

  get stepDur(): number {
    return 60 / this.def.bpm / 2
  }

  get activeVoices(): number {
    return this.voices.size
  }

  start(fadeIn: number): void {
    const now = this.e.ctx.currentTime
    const g = this.out.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(0, now)
    g.linearRampToValueAtTime(clamp(this.def.level, 0, 1), now + Math.max(0.05, fadeIn))
    this.nextTime = now + 0.08
    this.tick()
  }

  stop(fadeOut: number): void {
    if (this.stopping) return
    this.stopping = true
    clearTimeout(this.timer)
    const now = this.e.ctx.currentTime
    const g = this.out.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(clamp(g.value, 0, 1), now)
    g.linearRampToValueAtTime(0, now + Math.max(0.02, fadeOut))
    this.disposeTimer = setTimeout(() => this.dispose(), (Math.max(0.02, fadeOut) + 0.08) * 1000)
  }

  dispose(): void {
    clearTimeout(this.timer)
    clearTimeout(this.disposeTimer)
    this.stopping = true
    for (const v of [...this.voices]) {
      v.stop(0.02)
      v.dispose()
    }
    this.voices.clear()
    try { this.out.disconnect() } catch { /* ignore */ }
  }

  /** Schedule every step up to `seconds` from now without timers (offline rendering, previews). */
  renderAhead(seconds: number): void {
    const end = this.e.ctx.currentTime + seconds
    while (this.nextTime < end) {
      this.scheduleStep(this.step, this.nextTime)
      this.step += 1
      this.nextTime += this.stepDur
    }
  }

  /** Start without the real-time scheduler (offline rendering). */
  startOffline(fadeIn: number): void {
    const g = this.out.gain
    g.setValueAtTime(0, 0)
    g.linearRampToValueAtTime(clamp(this.def.level, 0, 1), Math.max(0.05, fadeIn))
    this.nextTime = 0.05
  }

  private tick = (): void => {
    if (this.stopping) return
    const ctx = this.e.ctx
    const now = ctx.currentTime
    // After a stall (main thread busy, context resumed) jump ahead instead of firing a burst of late notes.
    if (this.nextTime < now - 0.05) this.nextTime = now + 0.05
    while (this.nextTime < now + LOOKAHEAD) {
      this.scheduleStep(this.step, this.nextTime)
      this.step += 1
      this.nextTime += this.stepDur
    }
    this.timer = setTimeout(this.tick, TICK_MS)
  }

  private voice(name: string): Voice {
    const v = new Voice(this.e.ctx, { name, gain: 1, dest: this.out, noise: this.e.noise, send: { node: this.e.reverbIn, amount: this.def.reverb } })
    this.voices.add(v)
    v.onDispose = (d) => this.voices.delete(d)
    return v
  }

  private chordAt(bar: number): number[] {
    const d = this.def
    return d.chords[Math.floor(bar / d.barsPerChord) % d.chords.length]
  }

  private newMotif(): MotifNote[] {
    const d = this.def.melody
    const out: MotifNote[] = []
    const steps = STEPS_PER_BAR * 2
    for (let s = 0; s < steps; s++) {
      const w = s % 4 === 0 ? 1.35 : s % 2 === 0 ? 1 : 0.55
      if (this.rng() < d.density * w) {
        const r = this.rng()
        const delta = r < 0.15 ? 0 : r < 0.7 ? (this.rng() < 0.5 ? -1 : 1) : this.rng() < 0.5 ? -2 : 2
        out.push({ step: s, delta, len: 1 })
      }
    }
    if (out.length < 3) {
      for (const s of [0, 6, 10]) if (!out.some((n) => n.step === s)) out.push({ step: s, delta: this.rng() < 0.5 ? 1 : -1, len: 1 })
      out.sort((a, b) => a.step - b.step)
    }
    for (let i = 0; i < out.length; i++) {
      const next = i + 1 < out.length ? out[i + 1].step : steps
      out[i].len = clamp(next - out[i].step, 1, 3)
    }
    return out
  }

  private vary(m: MotifNote[]): MotifNote[] {
    return m.map((n, i) => (i >= m.length - 2 ? { ...n, delta: n.delta + (this.rng() < 0.5 ? 1 : -1) } : { ...n }))
  }

  private nearestChordTone(idx: number, chord: number[]): number {
    const pcs = new Set(chord.map((n) => n % 12))
    for (let r = 0; r < this.melNotes.length; r++) {
      for (const cand of [idx - r, idx + r]) {
        if (cand >= 0 && cand < this.melNotes.length && pcs.has(this.melNotes[cand] % 12)) return cand
      }
    }
    return idx
  }

  private scheduleStep(step: number, t0: number): void {
    const d = this.def
    const sd = this.stepDur
    const inBar = step % STEPS_PER_BAR
    const bar = Math.floor(step / STEPS_PER_BAR)
    const phrase = Math.floor(bar / PHRASE_BARS)
    const barInPhrase = bar % PHRASE_BARS
    const t = t0 + (inBar % 2 === 1 ? d.swing * sd : 0)
    const chord = this.chordAt(bar)

    // Pad: one long chord per chord change, overlapping the next one for a seamless wash.
    if (inBar === 0 && bar % d.barsPerChord === 0) {
      const hold = Math.max(0.2, d.barsPerChord * STEPS_PER_BAR * sd - 0.5)
      const pv = this.voice('pad')
      pad(pv, chord.slice(1).map(mtof), t, hold, d.pad.peak, 0.5, 1.1, d.pad.cutoff)
      pv.finish()
      if (this.trace) for (const m of chord.slice(1)) this.trace({ t, midi: m, part: 'pad', dur: hold + 0.5 })
    }

    if (d.bass?.steps.includes(inBar)) {
      const v = this.voice('bass')
      const f = mtof(chord[0])
      const lp = v.filter('lowpass', 600, 0.6)
      lp.connect(v.out)
      tone(v, { freq: f, t, dur: d.bass.dur, peak: d.bass.peak, attack: 0.012, dest: lp })
      tone(v, { type: 'triangle', freq: f * 2, t, dur: d.bass.dur * 0.5, peak: d.bass.peak * 0.18, attack: 0.012, dest: lp })
      v.finish()
      this.trace?.({ t, midi: chord[0], part: 'bass', dur: d.bass.dur })
    }

    if (d.thump?.steps.includes(inBar)) {
      const v = this.voice('thump')
      tone(v, { freq: 110, t, dur: 0.14, peak: d.thump.peak, attack: 0.003, glide: { ratio: 0.5, time: 0.1 } })
      v.finish()
    }

    if (d.shaker?.steps.includes(inBar)) {
      const v = this.voice('shaker')
      noiseHit(v, { t, dur: 0.03, peak: d.shaker.peak * rand(0.7, 1.1, this.rng), type: 'highpass', freq: 7000, q: 0.5, attack: 0.004 })
      v.finish()
    }

    const arpIdx = d.arp?.pattern[inBar]
    if (d.arp && arpIdx !== null && arpIdx !== undefined) {
      const upper = chord.slice(1)
      const v = this.voice('arp')
      play(d.arp.inst, v, mtof(upper[arpIdx % upper.length] + 12), t, sd * 1.6, d.arp.peak)
      v.finish()
      this.trace?.({ t, midi: upper[arpIdx % upper.length] + 12, part: 'arp', dur: sd })
    }

    // Melody: motif A (2 bars), its variation (2 bars); a new motif every other phrase.
    if (barInPhrase === 0 && inBar === 0) {
      if (phrase % 2 === 0 || this.motif.length === 0) this.motif = this.newMotif()
      this.variant = this.vary(this.motif)
    }
    const melodyOn = !d.melody.everyOtherPhrase || phrase % 2 === 0
    if (melodyOn && this.motif.length) {
      const motif = barInPhrase < 2 ? this.motif : this.variant
      const s = (barInPhrase % 2) * STEPS_PER_BAR + inBar
      const n = motif.find((m) => m.step === s)
      if (n) {
        const last = this.melNotes.length - 1
        let next = this.melIdx + n.delta
        // Bounce off the edges of the range instead of sticking to them.
        if (next < 0 || next > last) next = this.melIdx - n.delta
        this.melIdx = clamp(next, 0, last)
        if (inBar % 4 === 0) this.melIdx = this.nearestChordTone(this.melIdx, chord)
        const v = this.voice('melody')
        play(d.melody.inst, v, mtof(this.melNotes[this.melIdx]), t, n.len * sd * 1.5 + 0.2, d.melody.peak * rand(0.85, 1.05, this.rng))
        v.finish()
        this.trace?.({ t, midi: this.melNotes[this.melIdx], part: 'melody', dur: n.len * sd })
      }
    }

    if (inBar === 0 && this.rng() < d.sparkle) {
      const v = this.voice('sparkle')
      const top = scaleNotes(d.root, d.scale, 88, 103)
      for (let i = 0; i < 3; i++) {
        const m = pick(top, this.rng)
        glock(v, mtof(m), t + sd * 2 + i * 0.07, 0.35, 0.09)
        this.trace?.({ t: t + sd * 2 + i * 0.07, midi: m, part: 'sparkle', dur: 0.07 })
      }
      v.finish()
    }
  }
}

// ---- Public controller --------------------------------------------------------------------------------

let enabled = true
let desired: MusicTheme = 'none'
let current: ThemePlayer | null = null
let hidden = false
let ducked = false
let wired = false

function wire(): void {
  if (wired) return
  wired = true
  onStateChange((s) => { if (s === 'running') maybeStart() })
  onGesture(() => maybeStart())
  onVisibility((visible) => {
    hidden = !visible
    if (hidden) stopCurrent(0.3)
    else maybeStart()
  })
}

function stopCurrent(fade: number): void {
  if (current) {
    current.stop(fade)
    current = null
  }
}

function maybeStart(): void {
  if (!enabled || hidden || desired === 'none') return
  if (current && current.theme === desired) return
  const e = getEngine()
  if (!e || e.ctx.state !== 'running') return
  const old = current
  current = new ThemePlayer(e, desired)
  current.start(old ? 2 : 1.5)
  old?.stop(1.2)
}

function applyDuck(): void {
  const e = peekEngine()
  if (!e) return
  const p = e.duck.gain
  const now = e.ctx.currentTime
  p.cancelScheduledValues(now)
  p.setValueAtTime(clamp(p.value, 0, 1), now)
  p.setTargetAtTime(ducked ? 0.3 : 1, now, ducked ? 0.08 : 0.4)
}

export const music = {
  play(theme: MusicTheme): void {
    wire()
    desired = theme
    if (theme === 'none') stopCurrent(1.2)
    else maybeStart()
  },
  stop(): void {
    wire()
    desired = 'none'
    stopCurrent(1)
  },
  setEnabled(on: boolean): void {
    wire()
    enabled = on
    if (!on) stopCurrent(0.6)
    else maybeStart()
  },
  /** Lower music volume while speech plays. */
  duck(on: boolean): void {
    if (ducked === on) return
    ducked = on
    applyDuck()
  },
  /** Extra: music volume 0..1 (default 0.3 — quiet). */
  setVolume(v: number): void {
    setLevel('music', v)
  },
  /** Extra: the theme currently requested (it may be waiting for a gesture, or paused while hidden). */
  current(): MusicTheme {
    return desired
  },
  /** Extra: whether a theme is actually sounding right now. */
  isPlaying(): boolean {
    return !!current && !current.stopping
  },
}

/** Test helpers. */
export function __musicPlayerForTests(): ThemePlayer | null {
  return current
}
export function __resetMusicForTests(): void {
  current?.dispose()
  current = null
  enabled = true
  desired = 'none'
  hidden = false
  ducked = false
}
