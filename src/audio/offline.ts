/* Dev tool (not part of the public API): render effects and music themes through the browser's real Web Audio
   engine with an OfflineAudioContext, then measure them. Used by the dev gallery to draw waveforms and by
   tools/QA scripts to check levels without listening (peak, RMS, clipping, NaN, tail length). */
import type { MusicTheme, SfxName } from '@/types'
import { buildGraph } from './context'
import { ThemePlayer } from './music'
import { RECIPES, SFX_META } from './sfx'
import { Voice } from './synth'

export interface AudioStats {
  name: string
  seconds: number
  peak: number
  rms: number
  /** Samples beyond ±1 after the limiter. */
  clipped: number
  nan: number
  /** Seconds until the signal drops below -60 dB for good. */
  tail: number
}

function offlineCtor(): (new (channels: number, length: number, rate: number) => OfflineAudioContext) | null {
  const w = window as unknown as { OfflineAudioContext?: typeof OfflineAudioContext; webkitOfflineAudioContext?: typeof OfflineAudioContext }
  return w.OfflineAudioContext ?? w.webkitOfflineAudioContext ?? null
}

export function offlineSupported(): boolean {
  return offlineCtor() !== null
}

function makeCtx(seconds: number, rate: number): OfflineAudioContext {
  const C = offlineCtor()
  if (!C) throw new Error('OfflineAudioContext unavailable')
  return new C(2, Math.ceil(seconds * rate), rate)
}

/** Render one effect exactly as the player would (same buses, reverb and limiter). */
export async function renderSfx(name: SfxName, seconds = 3, rate = 32000): Promise<AudioBuffer> {
  const ctx = makeCtx(seconds, rate)
  const e = buildGraph(ctx as unknown as AudioContext)
  const meta = SFX_META[name]
  const v = new Voice(ctx, { name, gain: meta.gain, dest: e.sfxBus, noise: e.noise, send: { node: e.reverbIn, amount: meta.send } })
  RECIPES[name](v, 0.01, 1)
  return ctx.startRendering()
}

export type NoteTrace = Parameters<NonNullable<ThemePlayer['trace']>>[0]

/** Render `seconds` of a music theme (deterministic when rng is given); `trace` receives every note. */
export async function renderTheme(theme: Exclude<MusicTheme, 'none'>, seconds = 12, rate = 32000, rng?: () => number, trace?: (n: NoteTrace) => void): Promise<AudioBuffer> {
  const ctx = makeCtx(seconds, rate)
  const e = buildGraph(ctx as unknown as AudioContext)
  const p = new ThemePlayer(e, theme, rng)
  if (trace) p.trace = trace
  p.startOffline(1.5)
  p.renderAhead(seconds - 0.5)
  return ctx.startRendering()
}

export function analyse(name: string, buf: AudioBuffer): AudioStats {
  let peak = 0
  let sum = 0
  let clipped = 0
  let nan = 0
  let lastLoud = 0
  const n = buf.length
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c)
    for (let i = 0; i < n; i++) {
      const x = d[i]
      if (Number.isNaN(x)) {
        nan++
        continue
      }
      const a = Math.abs(x)
      if (a > peak) peak = a
      if (a > 1) clipped++
      if (a > 0.001 && i > lastLoud) lastLoud = i
      sum += x * x
    }
  }
  return {
    name,
    seconds: buf.duration,
    peak,
    rms: Math.sqrt(sum / (n * buf.numberOfChannels)),
    clipped,
    nan,
    tail: lastLoud / buf.sampleRate,
  }
}

/** Min/max pairs per bucket for drawing a waveform. */
export function peaks(buf: AudioBuffer, buckets: number, until = buf.duration): { min: number; max: number }[] {
  const d = buf.getChannelData(0)
  const len = Math.min(d.length, Math.floor(until * buf.sampleRate))
  const size = Math.max(1, Math.floor(len / buckets))
  const out: { min: number; max: number }[] = []
  for (let b = 0; b < buckets; b++) {
    let mn = 0
    let mx = 0
    for (let i = b * size; i < Math.min(len, (b + 1) * size); i++) {
      const x = d[i]
      if (x < mn) mn = x
      if (x > mx) mx = x
    }
    out.push({ min: mn, max: mx })
  }
  return out
}

/** Notes a theme would play in its first `seconds` (no audio rendered; for piano-roll previews). */
export function traceTheme(theme: Exclude<MusicTheme, 'none'>, seconds = 10, rng?: () => number): NoteTrace[] {
  const ctx = makeCtx(0.1, 8000)
  const e = buildGraph(ctx as unknown as AudioContext)
  const p = new ThemePlayer(e, theme, rng)
  const notes: NoteTrace[] = []
  p.trace = (n) => notes.push(n)
  p.startOffline(0.1)
  p.renderAhead(seconds)
  return notes
}

/** Small deterministic RNG for repeatable previews. */
export function seeded(seed: number): () => number {
  let s = seed % 2147483647 || 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
