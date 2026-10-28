/* Strict scorer of a child's letra ligada, in model units: shape, line, size and start. Pure and deterministic,
   so it is unit-tested. Limits live in thresholds.ts; tips in tips.ts.
   `target.width` is accepted for the planned interface but not used: the pauta fit already carries the position. */
import type { InkStroke } from '@/types'
import { resample, type ModelPoint, type ModelStroke } from '../digitModels'
import { ASCENDER, BASELINE, DESCENDER, XHEIGHT } from './models'
import { CURSIVE_THRESHOLDS, type Criterion } from './thresholds'
import { praiseFor, tipFor } from './tips'

export type { Criterion }

export interface PautaFit { scale: number; ox: number; oy: number }

export interface CursiveScore {
  /** Mean shape error in x-heights (lower is better). The worst-part and width checks are in `passed`. */
  shape: number
  /** Baseline offset in x-heights (lower is better). */
  line: number
  /** Child body height / model body height (1 is perfect). */
  size: number
  /** Start error (lower is better): the larger of start-point distance (x-heights) and direction error (1 − cos). */
  start: number
  passed: Record<Criterion, boolean>
  stars: 1 | 2 | 3
  /** The failed criterion furthest from its limit; null when every criterion passes (3 stars). */
  worst: Criterion | null
  tip: string
}

const CRITERIA: Criterion[] = ['shape', 'line', 'size', 'start']
const BASELINE_BAND = 1.5
/** Strokes shorter than this (model units tall) are dots or crossbars, not the joined pen path. */
const MARK_HEIGHT = 6
const START_SAMPLES = 24
const LINE_SAMPLES = 40
/** Points averaged at each end of the ink when measuring its height or width (one stray point cannot move it). */
const EXTREME_COUNT = 10

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

type Pt = ModelPoint

const toModel = (p: { x: number; y: number }, fit: PautaFit): Pt => ({ x: (p.x - fit.ox) / fit.scale, y: (p.y - fit.oy) / fit.scale })
const hypot = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)
const dense = (st: ModelStroke, spacing: number): Pt[] => (st.length < 2 ? st.slice() : resample(st, spacing))
const isMark = (pts: readonly Pt[]) => extent(pts, 'y') < MARK_HEIGHT

/** Mean of the lowest and of the highest EXTREME_COUNT values on an axis: the ink's top and bottom (or left and right). */
function ends(pts: readonly Pt[], axis: 'x' | 'y'): { lo: number; hi: number } {
  const v = pts.map((p) => p[axis]).sort((a, b) => a - b)
  const n = Math.min(EXTREME_COUNT, v.length)
  return {
    lo: v.slice(0, n).reduce((s, x) => s + x, 0) / n,
    hi: v.slice(v.length - n).reduce((s, x) => s + x, 0) / n,
  }
}
const extent = (pts: readonly Pt[], axis: 'x' | 'y') => {
  const e = ends(pts, axis)
  return e.hi - e.lo
}
const centre = (pts: readonly Pt[]) => {
  const e = ends(pts, 'x')
  const f = ends(pts, 'y')
  return { x: (e.lo + e.hi) / 2, y: (f.lo + f.hi) / 2 }
}

function spread(pts: readonly Pt[], c: Pt): number {
  return Math.sqrt(pts.reduce((s, p) => s + (p.x - c.x) ** 2 + (p.y - c.y) ** 2, 0) / pts.length)
}

function nearest(p: Pt, pts: readonly Pt[]): number {
  let best = Infinity
  for (const q of pts) {
    const d = hypot(p, q)
    if (d < best) best = d
  }
  return best
}

/** N points spaced evenly by arc length along a stroke. */
function sampleEvenly(st: ModelStroke, n: number): Pt[] {
  let total = 0
  for (let i = 1; i < st.length; i++) total += hypot(st[i], st[i - 1])
  if (total < 1e-9) return Array.from({ length: n }, () => ({ ...st[0] }))
  return resample(st, total / (n - 1)).slice(0, n)
}

/** Unit vector from the first sample to the sample a quarter of the way along: the direction the stroke sets off in. */
function setOff(pts: readonly Pt[]): Pt {
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

  const T = CURSIVE_THRESHOLDS
  const modelAll = target.strokes.flatMap((st) => dense(st, 1))
  const childDense = child.flatMap((st) => dense(st, 1))
  const modelBody = extent(modelAll, 'y')
  const childBody = extent(childDense, 'y')

  // Size: body height (top to bottom of the ink, end points averaged) against the model's.
  const size = childBody / modelBody

  // Shape: the child's centre moved onto the model's and the child scaled to the model's spread, so the form is judged
  // apart from size and position. Scaled by the RMS spread (it hardly moves with jitter, so noise does not shift the
  // far ends of a wide word). Three checks: the mean distance, the share of points far off the line, and the width
  // against the height.
  const cm = centre(modelAll)
  const cc = centre(childDense)
  const k = spread(childDense, cc) > 1e-6 ? spread(modelAll, cm) / spread(childDense, cc) : 1
  const place = (p: Pt): Pt => ({ x: (p.x - cc.x) * k + cm.x, y: (p.y - cc.y) * k + cm.y })
  const aligned = childDense.map(place)
  // Child → model uses the child's own samples: a sparse stroke interpolated onto a grid would cut its chords across
  // curves and read as error. Model → child (coverage) uses the interpolated child.
  const dAB = childAll.map((p) => nearest(place(p), modelAll))
  const dBA = modelAll.map((p) => nearest(p, aligned))
  const shape = (mean(dAB) + mean(dBA)) / 2 / XHEIGHT
  const all = [...dAB, ...dBA]
  const shapeOff = all.filter((d) => d > T.shapeTolerance).length / all.length
  // Width against height, from the raw ink (not the aligned one, which the scale above would have partly absorbed).
  const shapeAspect = Math.abs((extent(childDense, 'x') / childBody) / (extent(modelAll, 'x') / modelBody) - 1)
  const shapeRatio = Math.max(shape / T.shape, shapeOff / T.shapeOff, shapeAspect / T.shapeAspect)

  // Line: the child's pen path and the model's are sampled evenly by arc length and paired point by point; the
  // model points on the baseline give the mean vertical offset. Scaling about the baseline keeps them on it, a
  // descender is never used, and a sideways shift changes nothing.
  const modelMain = target.strokes.filter((st) => !isMark(dense(st, 1)))
  const childMain = child.filter((st) => !isMark(st))
  const lineOffsets: number[] = []
  for (let st = 0; st < Math.min(modelMain.length, childMain.length); st++) {
    const cs = sampleEvenly(childMain[st], LINE_SAMPLES)
    const ms = sampleEvenly(modelMain[st], LINE_SAMPLES)
    ms.forEach((m, i) => { if (Math.abs(m.y - BASELINE) <= BASELINE_BAND) lineOffsets.push(cs[i].y - m.y) })
  }
  const line = lineOffsets.length ? Math.abs(mean(lineOffsets)) / XHEIGHT : 1

  // Start: the first pen path (marks skipped), in the aligned frame: its start point and the way it sets off
  // (a chord, not index-paired tangents, so a mirror-image loop drawn the other way round is not averaged away).
  let start = 1
  if (modelMain.length && childMain.length === modelMain.length) {
    const cs = sampleEvenly(childMain[0].map((p) => ({ x: (p.x - cc.x) * k + cm.x, y: (p.y - cc.y) * k + cm.y })), START_SAMPLES)
    const ms = sampleEvenly(modelMain[0], START_SAMPLES)
    const startDist = hypot(cs[0], ms[0]) / XHEIGHT
    const a = setOff(cs)
    const b = setOff(ms)
    start = Math.max(startDist, 1 - (a.x * b.x + a.y * b.y))
  }

  const passed: Record<Criterion, boolean> = {
    shape: shapeRatio <= 1,
    line: line <= T.line,
    size: size >= T.size.min && size <= T.size.max,
    start: start <= T.start,
  }
  const ratio: Record<Criterion, number> = {
    shape: shapeRatio,
    line: line / T.line,
    size: Math.max(size / T.size.max, T.size.min / size),
    start: start / T.start,
  }
  const failedList = CRITERIA.filter((c) => !passed[c])
  const worst = failedList.length ? failedList.reduce((w, c) => (ratio[c] > ratio[w] ? c : w)) : null
  const failed = failedList.length
  const stars: 1 | 2 | 3 = failed <= T.stars.threeMaxFailed ? 3 : failed <= T.stars.twoMaxFailed && passed.shape ? 2 : 1

  return {
    shape,
    line,
    size,
    start,
    passed,
    stars,
    worst,
    tip: worst ? tipFor(worst, text, { tooBig: size > 1 }) : praiseFor(text),
  }
}

function mean(xs: readonly number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length
}
