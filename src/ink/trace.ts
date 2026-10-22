/* Gentle scoring of a traced digit against its school model (coverage of the model + staying on the path +
   starting at the green dot). Pure, so it is unit-tested. */
import type { InkStroke } from '@/types'
import { DIGIT_MODELS, MODEL_H, MODEL_W, resample, type ModelPoint } from './digitModels'

/** Padding (model units) around the 100×140 model inside a tracing area. */
export const TRACE_PAD = { x: 16, y: 14 }

export interface ModelFit { scale: number; ox: number; oy: number }

/** Maps the model box (with padding) into an area, centred, preserving aspect ratio. */
export function fitModel(width: number, height: number): ModelFit {
  const vw = MODEL_W + TRACE_PAD.x * 2
  const vh = MODEL_H + TRACE_PAD.y * 2
  const scale = Math.min(width / vw, height / vh)
  return {
    scale,
    ox: (width - vw * scale) / 2 + TRACE_PAD.x * scale,
    oy: (height - vh * scale) / 2 + TRACE_PAD.y * scale,
  }
}

export interface TraceScore {
  coverage: number
  precision: number
  startOk: boolean
  score: number
  stars: 1 | 2 | 3
}

function nearest(p: ModelPoint, pts: readonly ModelPoint[]): number {
  let best = Infinity
  for (const q of pts) {
    const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2
    if (d < best) best = d
  }
  return Math.sqrt(best)
}

export function scoreTrace(digit: number, strokes: readonly InkStroke[], fit: ModelFit): TraceScore {
  const model = DIGIT_MODELS[digit] ?? []
  const modelPts = model.flatMap((st) => resample(st, 3))
  const child = strokes.flatMap((st) => st.points.map((p) => ({ x: (p.x - fit.ox) / fit.scale, y: (p.y - fit.oy) / fit.scale })))
  if (!modelPts.length || child.length < 2) return { coverage: 0, precision: 0, startOk: false, score: 0, stars: 1 }
  // thin out dense pen input so slow writing does not weigh more
  const thin: ModelPoint[] = []
  for (const p of child) {
    const last = thin[thin.length - 1]
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= 2.5) thin.push(p)
  }
  const tol = 13
  const coverage = modelPts.filter((p) => nearest(p, thin) <= tol).length / modelPts.length
  const precision = thin.filter((p) => nearest(p, modelPts) <= tol * 1.25).length / thin.length
  const start = model[0]?.[0]
  const startOk = !!start && Math.hypot(thin[0].x - start.x, thin[0].y - start.y) <= tol * 1.9
  const score = 0.65 * coverage + 0.35 * precision
  let stars: 1 | 2 | 3 = score >= 0.82 ? 3 : score >= 0.6 ? 2 : 1
  if (!startOk && stars === 3) stars = 2
  return { coverage, precision, startOk, score, stars }
}
