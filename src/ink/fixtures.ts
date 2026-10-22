/* Synthetic handwriting built from the school models (with slant, wobble and per-point timing/pressure).
   Used by the gallery previews and by unit tests; never by production code paths. */
import type { InkPoint, InkStroke } from '@/types'
import { DIGIT_MODELS, MODEL_H, MODEL_W } from './digitModels'

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface HandwriteOptions {
  seed?: number
  /** Wobble amplitude in model units (0 = perfect). */
  wobble?: number
  /** Italic slant (x shift per model unit of height). */
  slant?: number
  /** Fraction of the box height the digit occupies. */
  fill?: number
  pointerType?: InkStroke['pointerType']
  t0?: number
  /** Horizontal squash/stretch. */
  aspect?: number
}

export function handwrite(digit: number, box: { x: number; y: number; w: number; h: number }, opts: HandwriteOptions = {}): InkStroke[] {
  const { seed = digit + 1, wobble = 2.2, slant = 0.08, fill = 0.74, pointerType = 'pen', aspect = 1 } = opts
  const rnd = mulberry32(seed)
  const scale = Math.min(box.w / (MODEL_W * aspect), box.h / MODEL_H) * fill
  const ox = box.x + box.w / 2
  const oy = box.y + box.h / 2
  let t = opts.t0 ?? 1000
  return (DIGIT_MODELS[digit] ?? []).map((stroke) => {
    const phase = rnd() * Math.PI * 2
    const freq = 0.08 + rnd() * 0.05
    const points = stroke.map((p, i) => {
      const mx = (p.x - MODEL_W / 2) * aspect + (MODEL_H / 2 - p.y) * slant + Math.sin(phase + i * freq * 6) * wobble
      const my = p.y - MODEL_H / 2 + Math.cos(phase * 1.3 + i * freq * 5) * wobble
      t += 7 + rnd() * 3
      return { x: ox + mx * scale, y: oy + my * scale, t, p: 0.35 + 0.3 * Math.abs(Math.sin(phase + i * 0.15)) }
    })
    t += 160 + rnd() * 120
    return { pointerType, points }
  })
}

/** Writes a whole number left to right inside a box (each digit gets an equal slot, with jitter). */
export function handwriteNumber(n: string, box: { x: number; y: number; w: number; h: number }, opts: HandwriteOptions & { gap?: number } = {}): InkStroke[] {
  const digits = n.split('').map(Number)
  const slot = box.w / Math.max(1, digits.length)
  const rnd = mulberry32(opts.seed ?? 7)
  let t = opts.t0 ?? 1000
  return digits.flatMap((d, i) => {
    const jitterY = (rnd() - 0.5) * box.h * 0.08
    const strokes = handwrite(d, { x: box.x + i * slot - (opts.gap ?? 0) * i, y: box.y + jitterY, w: slot, h: box.h }, { ...opts, seed: (opts.seed ?? 7) * 31 + i, t0: t })
    const last = strokes[strokes.length - 1]?.points
    t = (last?.[last.length - 1]?.t ?? t) + 300
    return strokes
  })
}

/** A zig-zag scribble-out gesture across a box. */
export function scribble(box: { x: number; y: number; w: number; h: number }, passes = 5): InkStroke {
  const points: InkPoint[] = []
  let t = 5000
  for (let i = 0; i <= passes * 2; i++) {
    const x = i % 2 === 0 ? box.x : box.x + box.w
    const y = box.y + (box.h * i) / (passes * 2)
    const prev = points[points.length - 1]
    if (prev) {
      for (let k = 1; k <= 6; k++) points.push({ x: prev.x + ((x - prev.x) * k) / 6, y: prev.y + ((y - prev.y) * k) / 6, t: (t += 6) })
    } else points.push({ x, y, t })
  }
  return { pointerType: 'pen', points }
}
