/* Stroke fixtures for the scorer tests, built at test time from the letra ligada models (never copied glyph
   points). Every fixture is expressed in model units and then mapped to screen ink with the pauta fit of its
   target, the same way a child's pen would arrive. */
import type { InkStroke } from '@/types'
import { resample, type ModelStroke } from '../digitModels'
import { BASELINE } from './models'
import { joinWord } from './join'
import { fitPauta, type PautaFit } from './score'

export const PAUTA_W = 400
export const PAUTA_H = 300

export interface Target { strokes: ModelStroke[]; width: number }

export const targetOf = (text: string): Target => joinWord(text)
export const fitOf = (text: string): PautaFit => fitPauta(PAUTA_W, PAUTA_H, joinWord(text).width)

/** Model-space strokes to screen ink with a pauta fit (one sample every 16 ms). */
export function toInk(strokes: ModelStroke[], fit: PautaFit): InkStroke[] {
  return strokes.map((st) => ({
    pointerType: 'pen' as const,
    points: st.map((p, i) => ({ x: p.x * fit.scale + fit.ox, y: p.y * fit.scale + fit.oy, t: i * 16 })),
  }))
}

/** Deterministic PRNG (mulberry32), so noisy fixtures are the same on every run. */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const mapStrokes = (strokes: ModelStroke[], fn: (p: { x: number; y: number }, i: number) => { x: number; y: number }): ModelStroke[] =>
  strokes.map((st) => st.map((p, i) => fn(p, i)))

/** The exact model: what a perfect child would draw. */
export const exactStrokes = (text: string): ModelStroke[] => targetOf(text).strokes

/** Each coordinate jittered by up to ±amp model units. */
export function noisyStrokes(strokes: ModelStroke[], amp = 1.5, seed = 7): ModelStroke[] {
  const rand = rng(seed)
  return strokes.map((st) => st.map((p) => ({ x: p.x + (rand() * 2 - 1) * amp, y: p.y + (rand() * 2 - 1) * amp })))
}

/** Enlarged by k around the centre of the word, anchored on the baseline (so only the size changes). */
export function scaledStrokes(text: string, k: number): ModelStroke[] {
  const strokes = exactStrokes(text)
  const xs = strokes.flat().map((p) => p.x)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  return mapStrokes(strokes, (p) => ({ x: cx + (p.x - cx) * k, y: BASELINE + (p.y - BASELINE) * k }))
}

export const shiftedStrokes = (strokes: ModelStroke[], dy: number): ModelStroke[] =>
  mapStrokes(strokes, (p) => ({ x: p.x, y: p.y + dy }))

/** Drawn the other way round from the same start point (for o: clockwise instead of counter-clockwise). */
export function mirroredAtStart(strokes: ModelStroke[]): ModelStroke[] {
  const x0 = strokes[0][0].x
  return mapStrokes(strokes, (p) => ({ x: 2 * x0 - p.x, y: p.y }))
}

/** Starts `units` model units further along the first stroke (the rest of the path is drawn as in the model). */
export function lateStartStrokes(strokes: ModelStroke[], units: number): ModelStroke[] {
  const first = resample(strokes[0], 1).slice(units)
  return [first, ...strokes.slice(1)]
}

/** A fatter hand: the letter swells sideways in the middle (symmetric about its centre), top, bottom and height
    stay where the model has them, so only the shape is off. amp is the extra half-width at mid-height, in units. */
export function bulgedStrokes(strokes: ModelStroke[], amp: number): ModelStroke[] {
  const all = strokes.flat()
  const xs = all.map((p) => p.x)
  const ys = all.map((p) => p.y)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const halfW = (Math.max(...xs) - Math.min(...xs)) / 2
  const top = Math.min(...ys)
  const bottom = Math.max(...ys)
  return mapStrokes(strokes, (p) => {
    const swell = amp * Math.sin((Math.PI * (p.y - top)) / (bottom - top))
    return { x: cx + (p.x - cx) * (1 + swell / halfW), y: p.y }
  })
}
