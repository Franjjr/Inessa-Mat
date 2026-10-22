/* Sound effects, all synthesised (no files). Short, soft and musical: everything sits in C major / A minor
   pentatonic so effects never clash with each other or with the music. Errors are a friendly "boop", never a buzzer.

   Player features: master/sfx volume, enable flag, per-sound rate limits (pencil ticks!), per-sound and global
   polyphony caps with voice stealing, tiny random detune so repeats don't sound robotic, and a short grace queue
   so the very first tap (which also unlocks the context) is still heard. */
import type { SfxName } from '@/types'
import { getEngine, isRunning, onStateChange, setLevel, type AudioEngine } from './context'
import { cents, clamp, mtof, N, pick, PENTA_MAJOR, rand, scaleNotes } from './notes'
import { brass, chime, glock, marimba, noiseHit, pad, pluck, tone, Voice } from './synth'

export type Recipe = (v: Voice, t: number, p: number) => void

interface Meta {
  /** Voice output peak (0..1) before the caller's volume. */
  gain: number
  /** Minimum ms between two plays of this sound. */
  gap: number
  /** Max simultaneous voices of this sound. */
  max: number
  /** Reverb send 0..1. */
  send: number
  /** Random detune range in cents (±). */
  detune: number
}

export const SFX_META: Record<SfxName, Meta> = {
  tap: { gain: 0.98, gap: 35, max: 3, send: 0, detune: 30 },
  select: { gain: 0.9, gap: 45, max: 3, send: 0.08, detune: 20 },
  write: { gain: 0.6, gap: 70, max: 2, send: 0, detune: 120 },
  erase: { gain: 0.77, gap: 70, max: 2, send: 0, detune: 60 },
  correct: { gain: 0.73, gap: 120, max: 2, send: 0.22, detune: 12 },
  wrong: { gain: 0.41, gap: 220, max: 1, send: 0.12, detune: 10 },
  streak: { gain: 0.74, gap: 200, max: 2, send: 0.28, detune: 10 },
  hint: { gain: 0.84, gap: 220, max: 1, send: 0.32, detune: 10 },
  star: { gain: 0.72, gap: 90, max: 4, send: 0.28, detune: 15 },
  crystal: { gain: 0.93, gap: 400, max: 1, send: 0.42, detune: 0 },
  levelup: { gain: 0.62, gap: 400, max: 1, send: 0.28, detune: 0 },
  unlock: { gain: 0.64, gap: 300, max: 1, send: 0.28, detune: 0 },
  rescue: { gain: 0.52, gap: 500, max: 1, send: 0.32, detune: 0 },
  whoosh: { gain: 0.7, gap: 120, max: 2, send: 0.1, detune: 40 },
  pop: { gain: 0.8, gap: 40, max: 4, send: 0.05, detune: 80 },
  sparkle: { gain: 0.7, gap: 80, max: 3, send: 0.38, detune: 0 },
  page: { gain: 0.62, gap: 150, max: 2, send: 0.05, detune: 40 },
  dice: { gain: 0.58, gap: 250, max: 1, send: 0.05, detune: 30 },
  step: { gain: 0.86, gap: 60, max: 3, send: 0.05, detune: 50 },
  'chest-open': { gain: 0.68, gap: 800, max: 1, send: 0.4, detune: 0 },
  fanfare: { gain: 0.72, gap: 800, max: 1, send: 0.28, detune: 0 },
  tick: { gain: 0.77, gap: 80, max: 2, send: 0, detune: 0 },
  timeup: { gain: 0.6, gap: 600, max: 1, send: 0.28, detune: 0 },
  coin: { gain: 0.58, gap: 50, max: 4, send: 0.15, detune: 15 },
}

export const SFX_NAMES = Object.keys(SFX_META) as SfxName[]

const HIGH_PENTA = scaleNotes(N.C6, PENTA_MAJOR, N.C6, N.C8)
const TOP_PENTA = scaleNotes(N.C7, PENTA_MAJOR, N.C7, N.C8)

let tickTock = false
let stepSide = false

/** Frequency of a MIDI note shifted by the pitch ratio. */
const f = (note: number, p: number) => mtof(note) * p

/** Air: a breath of high noise that makes bells feel magical. */
function air(v: Voice, t: number, dur: number, peak: number, from = 6000, to = 9500, attack = 0.08): void {
  noiseHit(v, { t, dur, peak, type: 'highpass', freq: from, freqTo: to, q: 0.5, attack })
}

export const RECIPES: Record<SfxName, Recipe> = {
  tap: (v, t, p) => {
    tone(v, { freq: 1050 * p, t, dur: 0.05, peak: 0.6, attack: 0.002, glide: { ratio: 0.72, time: 0.04 } })
    tone(v, { type: 'triangle', freq: 2100 * p, t, dur: 0.018, peak: 0.12, attack: 0.001 })
  },
  select: (v, t, p) => {
    marimba(v, f(N.G5, p), t, 0.24, 0.75)
    glock(v, f(N.G6, p), t + 0.005, 0.08, 0.12)
  },
  write: (v, t, p) => {
    // A graphite tick: tiny band of high noise, barely there.
    noiseHit(v, { t, dur: 0.014, peak: 0.55, type: 'bandpass', freq: 3800 * p, q: 1.3, attack: 0.001 })
  },
  erase: (v, t, p) => {
    noiseHit(v, { t, dur: 0.11, peak: 0.5, type: 'bandpass', freq: 2600 * p, freqTo: 700 * p, q: 0.8, attack: 0.02 })
  },
  correct: (v, t, p) => {
    chime(v, f(N.A5, p), t, 0.45, 0.62)
    chime(v, f(N.E6, p), t + 0.09, 0.85, 0.68)
    noiseHit(v, { t: t + 0.09, dur: 0.02, peak: 0.07, type: 'highpass', freq: 7000, q: 0.5 })
  },
  wrong: (v, t, p) => {
    // Soft, friendly "boo-boop" going down a major third: rounded sines through a low-pass. Never a buzzer.
    const lp = v.filter('lowpass', 1800, 0.5)
    lp.connect(v.out)
    tone(v, { freq: f(N.E5, p), t, dur: 0.15, peak: 0.55, attack: 0.014, glide: { ratio: 0.97, time: 0.14 }, dest: lp })
    tone(v, { type: 'triangle', freq: f(N.E5, p), t, dur: 0.1, peak: 0.08, attack: 0.014, dest: lp })
    tone(v, { freq: f(N.C5, p), t: t + 0.16, dur: 0.26, peak: 0.55, attack: 0.016, glide: { ratio: 0.95, time: 0.24 }, dest: lp })
    tone(v, { type: 'triangle', freq: f(N.C5, p), t: t + 0.16, dur: 0.16, peak: 0.07, attack: 0.016, dest: lp })
  },
  streak: (v, t, p) => {
    const notes = [N.C6, N.E6, N.G6, N.C7]
    notes.forEach((n, i) => glock(v, f(n, p), t + i * 0.06, i === notes.length - 1 ? 0.8 : 0.3, 0.45))
    air(v, t + 0.18, 0.3, 0.05)
  },
  hint: (v, t, p) => {
    tone(v, { freq: 520 * p, t, dur: 0.12, peak: 0.22, attack: 0.02, glide: { ratio: 1.9, time: 0.11 } })
    glock(v, f(N.D6, p), t + 0.1, 0.5, 0.32)
    glock(v, f(N.A6, p), t + 0.22, 0.7, 0.3)
  },
  star: (v, t, p) => {
    glock(v, f(N.G6, p), t, 0.3, 0.45)
    glock(v, f(N.C7, p), t + 0.05, 0.3, 0.42)
    glock(v, f(N.E7, p), t + 0.1, 0.7, 0.48)
    air(v, t + 0.05, 0.35, 0.045)
  },
  crystal: (v, t, p) => {
    pad(v, [f(N.C5, p), f(N.G5, p), f(N.E6, p)], t, 0.45, 0.2, 0.22, 1.1, 3200)
    const count = 12
    for (let i = 0; i < count; i++) {
      const idx = clamp(Math.round((i / count) * (HIGH_PENTA.length - 1) + rand(-1.5, 1.5)), 0, HIGH_PENTA.length - 1)
      const tt = t + 0.05 + i * 0.085 + rand(0, 0.025)
      const pan = v.pan(rand(-0.6, 0.6))
      pan.connect(v.out)
      glock(v, f(HIGH_PENTA[idx], p), tt, 0.55, 0.27 * (1 - i / 24), pan)
    }
    air(v, t, 1.2, 0.05, 4000, 9000, 0.35)
  },
  levelup: (v, t, p) => {
    const run = [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6]
    run.forEach((n, i) => marimba(v, f(n, p), t + i * 0.055, 0.22, 0.5))
    const tc = t + run.length * 0.055 + 0.03
    for (const n of [N.C6, N.E6, N.G6]) chime(v, f(n, p), tc, 0.95, 0.24)
    pad(v, [f(N.C4, p), f(N.G4, p), f(N.C5, p)], tc - 0.05, 0.3, 0.12, 0.08, 0.8)
    air(v, tc, 0.5, 0.04)
  },
  unlock: (v, t, p) => {
    noiseHit(v, { t, dur: 0.02, peak: 0.45, type: 'bandpass', freq: 1900, q: 3 })
    noiseHit(v, { t: t + 0.06, dur: 0.025, peak: 0.4, type: 'bandpass', freq: 1250, q: 3 })
    tone(v, { freq: 700 * p, t: t + 0.06, dur: 0.04, peak: 0.2 })
    chime(v, f(N.G5, p), t + 0.15, 0.4, 0.5)
    chime(v, f(N.C6, p), t + 0.26, 0.85, 0.58)
    air(v, t + 0.26, 0.4, 0.04)
  },
  rescue: (v, t, p) => {
    const mel: [number, number, number][] = [[N.C5, 0, 0.25], [N.E5, 0.12, 0.25], [N.G5, 0.24, 0.25], [N.A5, 0.36, 0.2], [N.G5, 0.48, 0.2], [N.C6, 0.6, 0.9]]
    for (const [n, dt, d] of mel) pluck(v, f(n, p), t + dt, d, 0.42)
    pad(v, [f(N.C4, p), f(N.E4, p), f(N.G4, p), f(N.C5, p)], t, 0.9, 0.15, 0.15, 0.9)
    chime(v, f(N.E6, p), t + 0.6, 0.9, 0.22)
    chime(v, f(N.C6, p), t + 0.6, 0.9, 0.2)
    air(v, t + 0.6, 0.6, 0.04)
  },
  whoosh: (v, t, p) => {
    noiseHit(v, { t, dur: 0.2, peak: 0.6, type: 'bandpass', freq: 300 * p, freqTo: 2600 * p, q: 0.9, attack: 0.12 })
  },
  pop: (v, t, p) => {
    tone(v, { freq: 280 * p, t, dur: 0.06, peak: 0.8, attack: 0.002, glide: { ratio: 3.9, time: 0.045 } })
    noiseHit(v, { t, dur: 0.008, peak: 0.1, type: 'highpass', freq: 3000, q: 0.5 })
  },
  sparkle: (v, t, p) => {
    for (let i = 0; i < 5; i++) {
      const pan = v.pan(rand(-0.7, 0.7))
      pan.connect(v.out)
      glock(v, f(pick(TOP_PENTA), p), t + i * 0.055 + rand(0, 0.02), 0.25, 0.3, pan)
    }
    air(v, t, 0.25, 0.04, 7000, 9800, 0.04)
  },
  page: (v, t, p) => {
    noiseHit(v, { t, dur: 0.14, peak: 0.45, type: 'bandpass', freq: 1200 * p, freqTo: 3200 * p, q: 0.8, attack: 0.05 })
    noiseHit(v, { t: t + 0.17, dur: 0.012, peak: 0.14, type: 'highpass', freq: 5000, q: 0.5 })
  },
  dice: (v, t, p) => {
    let tt = t
    for (let i = 0; i < 6; i++) {
      noiseHit(v, { t: tt, dur: 0.012, peak: 0.45, type: 'bandpass', freq: rand(1800, 3200) * p, q: 4 })
      tone(v, { freq: rand(600, 900) * p, t: tt, dur: 0.03, peak: 0.22 })
      tt += rand(0.035, 0.07)
    }
    tone(v, { freq: 420 * p, t: tt + 0.02, dur: 0.08, peak: 0.4, glide: { ratio: 0.8, time: 0.06 } })
  },
  step: (v, t, p) => {
    stepSide = !stepSide
    const q = p * (stepSide ? 1 : 0.94)
    tone(v, { freq: 210 * q, t, dur: 0.09, peak: 0.7, attack: 0.004, glide: { ratio: 0.62, time: 0.07 } })
    noiseHit(v, { t, dur: 0.03, peak: 0.12, type: 'lowpass', freq: 900, q: 0.5 })
  },
  'chest-open': (v, t, p) => {
    // Wooden creak (mellow, low-passed) → lid pop → cascade of bells and a warm chord.
    const lp = v.filter('lowpass', 900, 2)
    lp.connect(v.out)
    tone(v, { type: 'triangle', freq: 140 * p, t, dur: 0.32, attack: 0.06, peak: 0.35, glide: { ratio: 1.45, time: 0.32 }, dest: lp })
    tone(v, { type: 'sawtooth', freq: 143 * p, t, dur: 0.28, attack: 0.06, peak: 0.07, glide: { ratio: 1.4, time: 0.28 }, dest: lp })
    tone(v, { freq: 300 * p, t: t + 0.38, dur: 0.1, peak: 0.4, glide: { ratio: 0.4, time: 0.09 } })
    const t1 = t + 0.42
    HIGH_PENTA.slice(0, 10).forEach((n, i) => {
      const pan = v.pan(rand(-0.6, 0.6))
      pan.connect(v.out)
      glock(v, f(n, p), t1 + i * 0.065, 0.5, 0.2, pan)
    })
    for (const n of [N.C6, N.E6, N.G6, N.C7]) chime(v, f(n, p), t1 + 0.1, 1.4, 0.18)
    pad(v, [f(N.C4, p), f(N.G4, p), f(N.E5, p)], t1, 0.8, 0.16, 0.2, 1.2)
    air(v, t1, 1.2, 0.055, 5000, 10000, 0.4)
  },
  fanfare: (v, t, p) => {
    const s = 0.13
    brass(v, f(N.G4, p), t, 0.06, 0.32)
    brass(v, f(N.G4, p), t + s, 0.06, 0.32)
    brass(v, f(N.G4, p), t + 2 * s, 0.06, 0.32)
    const tl = t + 3 * s
    brass(v, f(N.C5, p), tl, 0.55, 0.34)
    brass(v, f(N.G4, p), tl, 0.55, 0.2)
    brass(v, f(N.E4, p), tl, 0.55, 0.2)
    glock(v, f(N.C7, p), tl, 0.9, 0.24)
    glock(v, f(N.G6, p), tl + 0.06, 0.8, 0.18)
    air(v, tl, 0.7, 0.05)
  },
  tick: (v, t) => {
    tickTock = !tickTock
    tone(v, { freq: tickTock ? 1600 : 1250, t, dur: 0.025, peak: 0.6, attack: 0.001 })
    noiseHit(v, { t, dur: 0.01, peak: 0.25, type: 'bandpass', freq: 2500, q: 5 })
  },
  timeup: (v, t, p) => {
    chime(v, f(N.G5, p), t, 0.9, 0.5)
    chime(v, f(N.E5, p), t + 0.32, 1.2, 0.5)
  },
  coin: (v, t, p) => {
    tone(v, { type: 'triangle', freq: f(N.B5, p), t, dur: 0.06, peak: 0.42, attack: 0.002 })
    tone(v, { type: 'triangle', freq: f(N.E6, p), t: t + 0.07, dur: 0.38, peak: 0.42, attack: 0.002 })
    tone(v, { freq: f(N.E6, p), t: t + 0.07, dur: 0.38, peak: 0.24, attack: 0.002 })
  },
}

// ---- Player -----------------------------------------------------------------------------------------

const MAX_VOICES = 14
/** How long a sound requested while the context was still waking up may be delayed (ms). */
const GRACE_MS = 350

let enabled = true
const active: Voice[] = []
const lastPlayed = new Map<SfxName, number>()
let pending: { name: SfxName; opts?: SfxOptions; at: number }[] = []
let wired = false

export interface SfxOptions {
  /** 0..1, multiplies the sound's own level. */
  volume?: number
  /** Frequency ratio (1 = normal, 2 = an octave up). Clamped to 0.25..4. */
  pitch?: number
}

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

function wire(): void {
  if (wired) return
  wired = true
  onStateChange((state) => {
    if (state === 'running') flushPending()
  })
}

function flushPending(): void {
  const now = nowMs()
  const list = pending
  pending = []
  for (const p of list) if (now - p.at <= GRACE_MS) start(p.name, p.opts)
}

function steal(v: Voice): void {
  v.stop(0.02)
  const i = active.indexOf(v)
  if (i >= 0) active.splice(i, 1)
}

function start(name: SfxName, opts?: SfxOptions): Voice | null {
  const e = getEngine()
  if (!e || e.ctx.state !== 'running') return null
  const meta = SFX_META[name]
  const recipe = RECIPES[name]
  if (!meta || !recipe) return null

  const same = active.filter((v) => v.name === name)
  if (same.length >= meta.max) steal(same[0])
  if (active.length >= MAX_VOICES) steal(active[0])

  const volume = clamp(opts?.volume ?? 1, 0, 1)
  if (volume <= 0) return null
  const pitch = clamp(opts?.pitch ?? 1, 0.25, 4) * cents(meta.detune ? rand(-meta.detune, meta.detune) : 0)
  return build(e, name, recipe, meta, volume, pitch)
}

function build(e: AudioEngine, name: SfxName, recipe: Recipe, meta: Meta, volume: number, pitch: number): Voice {
  const v = new Voice(e.ctx, { name, gain: meta.gain * volume, dest: e.sfxBus, noise: e.noise, send: { node: e.reverbIn, amount: meta.send } })
  const t = e.ctx.currentTime + 0.004
  recipe(v, t, pitch)
  v.onDispose = (done) => {
    const i = active.indexOf(done)
    if (i >= 0) active.splice(i, 1)
  }
  active.push(v)
  v.finish()
  return v
}

export function playSfx(name: SfxName, opts?: SfxOptions): void {
  if (!enabled) return
  if (typeof document !== 'undefined' && document.hidden) return
  const meta = SFX_META[name]
  if (!meta) return
  const now = nowMs()
  const last = lastPlayed.get(name)
  if (last !== undefined && now - last < meta.gap) return
  lastPlayed.set(name, now)
  wire()
  const e = getEngine()
  if (!e) return
  if (!isRunning()) {
    // Probably the very first tap: the gesture listener is resuming the context right now.
    pending = pending.filter((p) => p.name !== name && now - p.at <= GRACE_MS)
    pending.push({ name, opts, at: now })
    if (e.ctx.state === 'suspended') {
      const r = e.ctx.resume()
      if (r && typeof r.catch === 'function') r.catch(() => {})
    }
    return
  }
  start(name, opts)
}

export function setSfxEnabled(on: boolean): void {
  enabled = on
  if (!on) {
    pending = []
    for (const v of [...active]) steal(v)
  }
}

export function sfxEnabled(): boolean {
  return enabled
}

export function activeSfxVoices(): number {
  return active.length
}

export const sfx = {
  play: playSfx,
  setEnabled: setSfxEnabled,
  /** Extra: effects volume 0..1 (default 0.85). */
  setVolume(v: number): void {
    setLevel('sfx', v)
  },
  /** Extra: whether effects are on. */
  isEnabled: sfxEnabled,
}

/** Test helper. */
export function __resetSfxForTests(): void {
  enabled = true
  for (const v of [...active]) v.dispose()
  active.length = 0
  lastPlayed.clear()
  pending = []
}
