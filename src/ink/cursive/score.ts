/* Strict scorer of a child's letra ligada, in model units: shape, line, size and start. Pure and deterministic,
   so it is unit-tested. Limits live in thresholds.ts; tips in tips.ts. */
import type { InkStroke } from '@/types'
import { resample, type ModelPoint, type ModelStroke } from '../digitModels'
import { ASCENDER, BASELINE, DESCENDER, XHEIGHT } from './models'
import { CURSIVE_THRESHOLDS, type Criterion } from './thresholds'
import { tipFor } from './tips'

export type { Criterion }

export interface PautaFit { scale: number; ox: number; oy: number }

export interface CursiveScore {
  /** Shape error in x-heights (lower is better). */
  shape: number
  /** Baseline offset in x-heights (lower is better). */
  line: number
  /** Child height / model height (1 is perfect). */
  size: number
  /** Start error (lower is better): the larger of start-point distance (x-heights) and direction error (1 - cos, so 1 = a right angle off). */
  start: number
  passed: Record<Criterion, boolean>
  stars: 1 | 2 | 3
  /** The criterion furthest from its pass value. */
  worst: Criterion
  tip: string
}

const CRITERIA: Criterion[] = ['shape', 'line', 'size', 'start']
/** How far (model units, up or down) the child's ink may lie from a baseline point and still be matched to it. */
const LINE_REACH = XHEIGHT / 2
/** How far sideways a child point may lie from a baseline point and still be in the same column. */
const COLUMN_REACH = 2
const BASELINE_BAND = 1.5
/** Strokes shorter than this (model units tall) are dots or crossbars, not the joined pen path. */
const MARK_HEIGHT = 6
const START_SAMPLES = 24

/** Maps the pauta (the whole two-line writing area, ascender room to descender room) into a width × height area. */
export function fitPauta(width: number, height: number, modelWidth: number): PautaFit {
  const span = DESCENDER - ASCENDER
  const scale = Math.min(width / Math.max(modelWidth, 1), height / span)
  return {
    scale,
    ox: (width - modelWidth * scale) / 2,
    oy: (height - span * scale) / 2 - ASCENDER * scale,
  }
}

const toModel = (p: { x: number; y: number }, fit: PautaFit): ModelPoint => ({ x: (p.x - fit.ox) / fit.scale, y: (p.y - fit.oy) / fit.scale })
const heightOf = (pts: readonly ModelPoint[]) => Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y))
const isMark = (pts: readonly ModelPoint[]) => heightOf(pts) < MARK_HEIGHT
const dense = (st: ModelStroke, spacing: number): ModelPoint[] => (st.length < 2 ? st.slice() : resample(st, spacing))
const hypot = (a: ModelPoint, b: ModelPoint) => Math.hypot(a.x - b.x, a.y - b.y)

function nearest(p: ModelPoint, pts: readonly ModelPoint[]): number {
  let best = Infinity
  for (const q of pts) {
    const d = hypot(p, q)
    if (d < best) best = d
  }
  return best
}

/** Mean nearest-neighbour distance from `from` to `to`. */
const meanNearest = (from: readonly ModelPoint[], to: readonly ModelPoint[]) =>
  from.reduce((sum, p) => sum + nearest(p, to), 0) / from.length

/** N points spaced evenly by arc length along a stroke. */
function sampleEvenly(st: ModelStroke, n: number): ModelPoint[] {
  const total = lengthOf(st)
  if (total < 1e-9) return Array.from({ length: n }, () => ({ ...st[0] }))
  return resample(st, total / (n - 1)).slice(0, n)
}

function lengthOf(st: ModelStroke): number {
  let len = 0
  for (let i = 1; i < st.length; i++) len += hypot(st[i], st[i - 1])
  return len
}

/** Unit vector from the first sample to the sample a quarter of the way along: the direction the stroke sets off in. */
function setOff(pts: readonly ModelPoint[]): ModelPoint {
  const to = pts[Math.round((pts.length - 1) / 4)]
  const len = hypot(to, pts[0]) || 1
  return { x: (to.x - pts[0].x) / len, y: (to.y - pts[0].y) / len }
}

export function scoreCursive(target: { strokes: ModelStroke[]; width: number }, ink: readonly InkStroke[], fit: PautaFit, text: string): CursiveScore {
  const child = ink
    .filter((s) => s.points.length > 0)
    .map((s) => s.points.map((p) => toModel(p, fit)))
  const childAll = child.flat()
  if (childAll.length < 2) {
    const passed = { shape: false, line: false, size: false, start: false }
    return { shape: 1, line: 1, size: 0, start: 1, passed, stars: 1, worst: 'start', tip: tipFor('start', text) }
  }

  // Shape: both sides resampled, the child's centre moved onto the model's and the child scaled to the model's height,
  // so the form (width, curves, closure) is judged apart from size and position.
  const modelDense = target.strokes.flatMap((st) => dense(st, 2))
  const childDense = child.flatMap((st) => dense(st, 1.5))
  const centre = (pts: readonly ModelPoint[]) => ({ x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length })
  const cm = centre(modelDense)
  const cc = centre(childDense)
  const childH = heightOf(childAll)
  const k = childH > 1e-6 ? heightOf(target.strokes.flat()) / childH : 1
  const toAligned = (p: ModelPoint): ModelPoint => ({ x: (p.x - cc.x) * k + cm.x, y: (p.y - cc.y) * k + cm.y })
  const aligned = childDense.map(toAligned)
  const shape = (meanNearest(aligned, modelDense) + meanNearest(modelDense, aligned)) / 2 / XHEIGHT

  // Line: for each model point on the baseline, the child's point in the same column that lies closest to it in y,
  // measured from BASELINE (unaligned: the position on the pauta is what counts here).
  const baselinePts = modelDense.filter((p) => Math.abs(p.y - BASELINE) <= BASELINE_BAND)
  let offsetSum = 0
  let offsetCount = 0
  for (const b of baselinePts) {
    let best: ModelPoint | null = null
    for (const c of childDense) {
      if (Math.abs(c.x - b.x) > COLUMN_REACH || Math.abs(c.y - b.y) > LINE_REACH) continue
      if (!best || Math.abs(c.y - b.y) < Math.abs(best.y - b.y)) best = c
    }
    if (best) { offsetSum += best.y - BASELINE; offsetCount++ }
  }
  const line = offsetCount ? Math.abs(offsetSum / offsetCount) / XHEIGHT : 1

  // Size: stroke height over the model's.
  const size = heightOf(childAll) / heightOf(target.strokes.flat())

  // Start: the first pen path (marks skipped), in the aligned frame: its start point and the way it sets off
  // (a chord, not index-paired tangents, so a mirror-image loop drawn the other way round is not averaged away).
  const modelMain = target.strokes.filter((st) => !isMark(st))
  const childMain = child.filter((st) => !isMark(st))
  let start = 1
  if (modelMain.length && childMain.length === modelMain.length) {
    const cs = sampleEvenly(childMain[0].map(toAligned), START_SAMPLES)
    const ms = sampleEvenly(modelMain[0], START_SAMPLES)
    const startDist = hypot(cs[0], ms[0]) / XHEIGHT
    const a = setOff(cs)
    const b = setOff(ms)
    start = Math.max(startDist, 1 - (a.x * b.x + a.y * b.y))
  }

  const T = CURSIVE_THRESHOLDS
  const passed: Record<Criterion, boolean> = {
    shape: shape <= T.shape,
    line: line <= T.line,
    size: size >= T.size.min && size <= T.size.max,
    start: start <= T.start,
  }
  const ratio: Record<Criterion, number> = {
    shape: shape / T.shape,
    line: line / T.line,
    size: Math.max(size / T.size.max, T.size.min / size),
    start: start / T.start,
  }
  const worst = CRITERIA.reduce((w, c) => (ratio[c] > ratio[w] ? c : w), CRITERIA[0])
  const failed = CRITERIA.filter((c) => !passed[c]).length
  const stars: 1 | 2 | 3 = failed <= T.stars.threeMaxFailed ? 3 : failed <= T.stars.twoMaxFailed && passed.shape ? 2 : 1

  return {
    shape,
    line,
    size,
    start,
    passed,
    stars,
    worst,
    tip: tipFor(worst, text, { tooBig: size > 1 }),
  }
}
