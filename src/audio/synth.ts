/* Synthesis primitives: a Voice owns every node of one sound (or one music note) and cleans them up when the
   last source ends. Instruments are small functions that add oscillators/filters/envelopes to a Voice.
   Rules that keep this safe on every browser (Safari included):
   - exponential ramps never target 0 (we use SILENT), and every envelope ends with an explicit 0;
   - all automation times are monotonic and >= the voice start;
   - no cancelAndHoldAtTime (Safari lacks it); frequencies are clamped below Nyquist. */
import { clamp } from './notes'

export const SILENT = 0.0001

export interface VoiceInit {
  name: string
  /** Peak multiplier of the voice output (0..1). */
  gain: number
  dest: AudioNode
  /** Shared white-noise buffer (engine-owned). */
  noise: AudioBuffer | null
  /** Optional reverb send (amount 0..1). */
  send?: { node: AudioNode; amount: number }
}

export class Voice {
  readonly ctx: BaseAudioContext
  readonly out: GainNode
  readonly name: string
  readonly noise: AudioBuffer | null
  readonly createdAt: number
  /** Latest scheduled stop time of any source (context time). */
  end = 0
  disposed = false
  onDispose: ((v: Voice) => void) | null = null
  private nodes: AudioNode[] = []
  private sources: AudioScheduledSourceNode[] = []
  private live = 0
  private fallback: ReturnType<typeof setTimeout> | undefined

  constructor(ctx: BaseAudioContext, init: VoiceInit) {
    this.ctx = ctx
    this.name = init.name
    this.noise = init.noise
    this.createdAt = ctx.currentTime
    this.out = this.track(ctx.createGain())
    this.out.gain.value = clamp(init.gain, 0, 1)
    this.out.connect(init.dest)
    if (init.send && init.send.amount > 0) {
      const s = this.track(ctx.createGain())
      s.gain.value = clamp(init.send.amount, 0, 1)
      this.out.connect(s)
      s.connect(init.send.node)
    }
  }

  track<T extends AudioNode>(n: T): T {
    this.nodes.push(n)
    return n
  }

  get nyquist(): number {
    return this.ctx.sampleRate / 2
  }

  /** Clamp a frequency into the audible, alias-free range. */
  hz(f: number): number {
    return clamp(f, 20, this.nyquist * 0.92)
  }

  gainNode(value = 1): GainNode {
    const g = this.track(this.ctx.createGain())
    g.gain.value = value
    return g
  }

  filter(type: BiquadFilterType, freq: number, q = 0.707): BiquadFilterNode {
    const f = this.track(this.ctx.createBiquadFilter())
    f.type = type
    f.frequency.value = this.hz(freq)
    f.Q.value = q
    return f
  }

  /** Stereo pan (-1..1) when supported; otherwise a pass-through gain. */
  pan(x: number): AudioNode {
    const c = this.ctx as BaseAudioContext & { createStereoPanner?: () => StereoPannerNode }
    if (typeof c.createStereoPanner === 'function') {
      const p = this.track(c.createStereoPanner())
      p.pan.value = clamp(x, -1, 1)
      return p
    }
    return this.gainNode(1)
  }

  osc(type: OscillatorType, freq: number, t0: number, t1: number, detune = 0): OscillatorNode {
    const o = this.track(this.ctx.createOscillator())
    o.type = type
    o.frequency.setValueAtTime(this.hz(freq), t0)
    if (detune) o.detune.value = detune
    this.schedule(o, t0, t1)
    return o
  }

  noiseSource(t0: number, t1: number): AudioBufferSourceNode | null {
    if (!this.noise) return null
    const s = this.track(this.ctx.createBufferSource())
    s.buffer = this.noise
    s.loop = true
    const offset = Math.random() * Math.max(0, this.noise.duration - 0.1)
    this.schedule(s, t0, t1, offset)
    return s
  }

  private schedule(s: AudioScheduledSourceNode, t0: number, t1: number, offset?: number): void {
    const start = Math.max(0, t0)
    const stop = Math.max(start + 0.01, t1)
    if (offset !== undefined) (s as AudioBufferSourceNode).start(start, offset)
    else s.start(start)
    s.stop(stop)
    this.sources.push(s)
    this.end = Math.max(this.end, stop)
  }

  /** Call once every source is scheduled: cleans up on the last 'ended' (with a timer fallback). */
  finish(): this {
    this.live = this.sources.length
    if (this.live === 0) {
      this.dispose()
      return this
    }
    for (const s of this.sources) {
      s.onended = () => {
        this.live -= 1
        if (this.live <= 0) this.dispose()
      }
    }
    this.armFallback(this.end - this.ctx.currentTime + 0.6)
    return this
  }

  private armFallback(seconds: number): void {
    clearTimeout(this.fallback)
    this.fallback = setTimeout(() => this.dispose(), Math.max(50, seconds * 1000))
  }

  /** Quickly fade out and stop (voice stealing, theme changes). */
  stop(fade = 0.03): void {
    if (this.disposed) return
    const now = this.ctx.currentTime
    const g = this.out.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(clamp(g.value, 0, 1), now)
    g.linearRampToValueAtTime(0, now + fade)
    for (const s of this.sources) {
      try { s.stop(now + fade + 0.01) } catch { /* already stopped (older Safari throws on a 2nd stop) */ }
    }
    this.end = Math.min(this.end, now + fade + 0.01)
    this.armFallback(fade + 0.15)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    clearTimeout(this.fallback)
    for (const s of this.sources) s.onended = null
    for (const n of this.nodes) {
      try { n.disconnect() } catch { /* ignore */ }
    }
    this.nodes = []
    this.sources = []
    this.onDispose?.(this)
  }
}

// ---- Envelopes ------------------------------------------------------------------------------------

/** Percussive envelope: 0 → peak (linear attack) → SILENT (exponential decay) → 0. Returns the end time. */
export function perc(param: AudioParam, t: number, peak: number, attack: number, decay: number): number {
  const p = clamp(peak, SILENT * 2, 1)
  const a = Math.max(0.001, attack)
  const end = t + a + Math.max(0.005, decay)
  param.setValueAtTime(0, t)
  param.linearRampToValueAtTime(p, t + a)
  param.exponentialRampToValueAtTime(SILENT, end)
  param.setValueAtTime(0, end + 0.002)
  return end + 0.002
}

/** Sustained envelope: attack → hold at peak → exponential release. Returns the end time. */
export function sustain(param: AudioParam, t: number, peak: number, attack: number, hold: number, release: number): number {
  const p = clamp(peak, SILENT * 2, 1)
  const a = Math.max(0.002, attack)
  const h = Math.max(0, hold)
  const r = Math.max(0.01, release)
  param.setValueAtTime(0, t)
  param.linearRampToValueAtTime(p, t + a)
  param.setValueAtTime(p, t + a + h)
  param.exponentialRampToValueAtTime(SILENT, t + a + h + r)
  param.setValueAtTime(0, t + a + h + r + 0.002)
  return t + a + h + r + 0.002
}

// ---- Instruments ----------------------------------------------------------------------------------

export interface ToneOpts {
  type?: OscillatorType
  freq: number
  t: number
  /** Decay time after the attack. */
  dur: number
  peak: number
  attack?: number
  /** Pitch glide target (ratio of freq) reached at t + glideTime. */
  glide?: { ratio: number; time: number }
  detune?: number
  dest?: AudioNode
}

/** A single enveloped oscillator. */
export function tone(v: Voice, o: ToneOpts): number {
  const g = v.gainNode(0)
  const end = perc(g.gain, o.t, o.peak, o.attack ?? 0.004, o.dur)
  const osc = v.osc(o.type ?? 'sine', o.freq, o.t, end + 0.02, o.detune ?? 0)
  if (o.glide) {
    const target = v.hz(o.freq * o.glide.ratio)
    osc.frequency.exponentialRampToValueAtTime(target, o.t + Math.max(0.005, o.glide.time))
  }
  osc.connect(g)
  g.connect(o.dest ?? v.out)
  return end
}

type Partial = readonly [ratio: number, gain: number, decayMul: number]

const CHIME: readonly Partial[] = [[1, 1, 1], [2, 0.3, 0.6], [3, 0.1, 0.4], [4.07, 0.045, 0.25]]
const GLOCK: readonly Partial[] = [[1, 1, 1], [2.76, 0.2, 0.45], [5.4, 0.07, 0.22]]
const MARIMBA: readonly Partial[] = [[1, 1, 1], [3.93, 0.14, 0.2], [9.7, 0.025, 0.06]]

function additive(v: Voice, partials: readonly Partial[], freq: number, t: number, dur: number, peak: number, attack: number, dest?: AudioNode): number {
  let end = t
  const sum = partials.reduce((s, p) => s + p[1], 0)
  for (const [ratio, g, dm] of partials) {
    const f = freq * ratio
    if (f > v.nyquist * 0.9) continue
    end = Math.max(end, tone(v, { freq: f, t, dur: dur * dm, peak: (peak * g) / sum, attack, dest }))
  }
  return end
}

/** Bright harmonic chime (feedback sounds). */
export function chime(v: Voice, freq: number, t: number, dur: number, peak: number, dest?: AudioNode): number {
  return additive(v, CHIME, freq, t, dur, peak, 0.003, dest)
}

/** Glockenspiel / celesta-like bar (sparkles, music bells). */
export function glock(v: Voice, freq: number, t: number, dur: number, peak: number, dest?: AudioNode): number {
  return additive(v, GLOCK, freq, t, dur, peak, 0.002, dest)
}

/** Soft wooden marimba. */
export function marimba(v: Voice, freq: number, t: number, dur: number, peak: number, dest?: AudioNode): number {
  return additive(v, MARIMBA, freq, t, dur, peak, 0.004, dest)
}

/** Kalimba-ish pluck: triangle through a closing low-pass. */
export function pluck(v: Voice, freq: number, t: number, dur: number, peak: number, dest?: AudioNode): number {
  const f = v.filter('lowpass', Math.min(freq * 8, 12000), 0.9)
  f.frequency.setValueAtTime(v.hz(Math.min(freq * 8, 12000)), t)
  f.frequency.exponentialRampToValueAtTime(v.hz(freq * 1.6), t + Math.max(0.03, dur * 0.6))
  const end = tone(v, { type: 'triangle', freq, t, dur, peak, attack: 0.003, dest: f })
  f.connect(dest ?? v.out)
  return end
}

/** Warm pad chord: detuned triangle+sine pairs through a gentle low-pass, slow attack/release. */
export function pad(v: Voice, freqs: number[], t: number, hold: number, peak: number, attack = 0.6, release = 1.2, cutoff = 1400, dest?: AudioNode): number {
  const f = v.filter('lowpass', cutoff, 0.5)
  const g = v.gainNode(0)
  const end = sustain(g.gain, t, peak, attack, hold, release)
  const each = 1 / Math.max(1, freqs.length * 2)
  for (const fr of freqs) {
    const mix = v.gainNode(each)
    v.osc('triangle', fr, t, end + 0.02, -6).connect(mix)
    v.osc('sine', fr, t, end + 0.02, 6).connect(mix)
    mix.connect(f)
  }
  f.connect(g)
  g.connect(dest ?? v.out)
  return end
}

export interface NoiseOpts {
  t: number
  dur: number
  peak: number
  type?: BiquadFilterType
  freq: number
  freqTo?: number
  q?: number
  attack?: number
  dest?: AudioNode
}

/** Filtered noise burst (pencil, page, whoosh, shaker, sparkle air). */
export function noiseHit(v: Voice, o: NoiseOpts): number {
  const f = v.filter(o.type ?? 'bandpass', o.freq, o.q ?? 1)
  f.frequency.setValueAtTime(v.hz(o.freq), o.t)
  if (o.freqTo) f.frequency.exponentialRampToValueAtTime(v.hz(o.freqTo), o.t + o.dur)
  const g = v.gainNode(0)
  const end = perc(g.gain, o.t, o.peak, o.attack ?? 0.002, o.dur)
  const src = v.noiseSource(o.t, end + 0.02)
  if (!src) return o.t
  src.connect(f)
  f.connect(g)
  g.connect(o.dest ?? v.out)
  return end
}

/** Soft brass-like note for fanfares: two detuned saws through an enveloped low-pass. */
export function brass(v: Voice, freq: number, t: number, hold: number, peak: number, dest?: AudioNode): number {
  const f = v.filter('lowpass', freq * 1.5, 0.8)
  f.frequency.setValueAtTime(v.hz(freq * 1.5), t)
  f.frequency.linearRampToValueAtTime(v.hz(Math.min(freq * 5, 7000)), t + 0.05)
  f.frequency.exponentialRampToValueAtTime(v.hz(freq * 2.4), t + 0.05 + hold + 0.15)
  const g = v.gainNode(0)
  const end = sustain(g.gain, t, peak, 0.03, hold, 0.16)
  const mix = v.gainNode(0.5)
  for (const d of [-8, 8]) v.osc('sawtooth', freq, t, end + 0.02, d).connect(mix)
  mix.connect(f)
  f.connect(g)
  g.connect(dest ?? v.out)
  return end
}
