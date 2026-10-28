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

/** Widened by k about the centre of the letter, sideways only (height unchanged): a fatter o or l. */
export function widenedStrokes(strokes: ModelStroke[], k: number): ModelStroke[] {
  const xs = strokes.flat().map((p) => p.x)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  return mapStrokes(strokes, (p) => ({ x: cx + (p.x - cx) * k, y: p.y }))
}

/** Stretched vertically by k about the baseline (the body and the ascender grow together). */
export function tallStrokes(strokes: ModelStroke[], k: number): ModelStroke[] {
  return mapStrokes(strokes, (p) => ({ x: p.x, y: BASELINE - (BASELINE - p.y) * k }))
}

/** The top moved down by `units` with the baseline kept: an ascender that stops short. */
export function shortTopStrokes(strokes: ModelStroke[], units: number): ModelStroke[] {
  const top = Math.min(...strokes.flat().map((p) => p.y))
  const h = BASELINE - top
  return mapStrokes(strokes, (p) => ({ x: p.x, y: BASELINE - (BASELINE - p.y) * ((h - units) / h) }))
}

/** A spike: `count` consecutive points near the middle of the first stroke pushed sideways by up to amp units. */
export function spikedStrokes(strokes: ModelStroke[], amp = 6, count = 5): ModelStroke[] {
  // A true spike: the points around the middle are pushed along the local normal (not sideways), so a stroke that runs
  // horizontally is spiked too; the push tapers from `amp` at the middle to 0 at the ends of the window.
  const first = strokes[0]
  // The spike goes where the stroke is open: the point near the middle that is farthest from the rest of the stroke
  // (a tight loop would put the spike back on its own other side, which is not a spike).
  const half = (count - 1) / 2
  const n = first.length
  let mid = Math.floor(n / 2)
  let bestIso = -1
  for (let j = Math.floor(n * 0.3); j <= Math.floor(n * 0.7); j++) {
    let minD = Infinity
    for (let i = 0; i < n; i++) {
      if (Math.abs(i - j) < 12) continue
      minD = Math.min(minD, Math.hypot(first[i].x - first[j].x, first[i].y - first[j].y))
    }
    if (minD > bestIso) { bestIso = minD; mid = j }
  }
  const at = (j: number) => first[Math.max(0, Math.min(first.length - 1, j))]
  const spiked = first.map((p, j) => {
    const d = Math.abs(j - mid)
    if (d > half) return p
    const a = at(j - 1), b = at(j + 1)
    const tx = b.x - a.x, ty = b.y - a.y
    const L = Math.hypot(tx, ty) || 1
    const push = amp * (1 - d / (half + 1))
    return { x: p.x - (ty / L) * push, y: p.y + (tx / L) * push }
  })
  return [spiked, ...strokes.slice(1)]
}

export const shiftedX = (strokes: ModelStroke[], dx: number): ModelStroke[] =>
  mapStrokes(strokes, (p) => ({ x: p.x + dx, y: p.y }))

/** A wobbly hand: each point pushed sideways by a fixed, index-based offset of up to amp units (height unchanged). */
export function wobbledStrokes(strokes: ModelStroke[], amp: number): ModelStroke[] {
  let i = 0
  return mapStrokes(strokes, (p) => ({ x: p.x + amp * Math.sin((i++) * 1.3), y: p.y }))
}
