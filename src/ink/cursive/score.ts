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
/** A baseline point is compared only with ink within this many model units sideways. */
const LINE_REACH = 12
/** Width of the column (beyond the nearest one) whose lowest point is the child's baseline there. */
const LINE_COLUMN = 1.5
/** The baseline band searched for the child's ink: above it and below it (descenders start below BASELINE + LINE_BELOW). */
const LINE_ABOVE = 15
const LINE_BELOW = 12
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

/** The model point nearest to p (null when there are none). */
function nearestPoint(p: Pt, pts: readonly Pt[]): Pt | null {
  let best: Pt | null = null
  let bd = Infinity
  for (const q of pts) {
    const d = hypot(p, q)
    if (d < bd) { bd = d; best = q }
  }
  return best
}

/** Vertical gap (child − model) at one model baseline point: the child's lowest point in the nearest column that has ink. */
function baselineGap(m: Pt, band: readonly Pt[]): number | null {
  let minDx = Infinity
  for (const c of band) minDx = Math.min(minDx, Math.abs(c.x - m.x))
  if (!Number.isFinite(minDx) || minDx > LINE_REACH) return null
  let low = -Infinity
  for (const c of band) if (Math.abs(c.x - m.x) <= minDx + LINE_COLUMN) low = Math.max(low, c.y)
  return low - m.y
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

/** The scale (0.6 … 1.6) about the child's centre that puts the child's points nearest to the model's (every third point). */
function bestScale(child: readonly Pt[], model: readonly Pt[], cc: Pt, cm: Pt): number {
  let best = 1
  let bestErr = Infinity
  for (let i = 0; i <= 40; i++) {
    const k = 0.6 + i * 0.025
    let err = 0
    let n = 0
    for (let j = 0; j < child.length; j += 3) {
      const c = child[j]
      const p = { x: (c.x - cc.x) * k + cm.x, y: (c.y - cc.y) * k + cm.y }
      const d = nearest(p, model)
      err += d * d
      n++
    }
    const e = n ? err / n : Infinity
    if (e < bestErr) { bestErr = e; best = k }
  }
  return best
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

  // Shape: the child's centre moved onto the model's and the child scaled to the best fit, so the form is judged apart
  // from size and position. Three checks: the mean distance, the share of points far off the line, and the width
  // against the height.
  const cm = centre(modelAll)
  const cc = centre(childDense)
  // The scale is the one that fits the child best to the model (least squares of the nearest distances over a grid). It
  // is unbiased by jitter, where the RMS spread grows with noise and shrinks the ends of a long word by several units.
  const k = bestScale(childDense, modelAll, cc, cm)
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
  // Line: each model point on the baseline is compared with the child's lowest point in the same column. Only child ink
  // that sits on the model's baseline band counts (a descender or a higher part of the letter is left out: its nearest
  // model point is not on the baseline). The child is moved sideways to the model's centre first, so a sideways shift
  // changes nothing. No pairing along the stroke, so a long word or a different sampling does not drift.
  const modelMain = target.strokes.filter((st) => !isMark(dense(st, 1)))
  const modelDense = modelMain.flatMap((st) => dense(st, 1))
  const childMain = child.filter((st) => !isMark(st))
  const dx = centre(modelDense).x - centre(childDense).x
  const modelBand = modelDense.filter((m) => Math.abs(m.y - BASELINE) <= BASELINE_BAND)
  const childBase = childMain.flatMap((st) => dense(st, 1))
    .map((c) => ({ x: c.x + dx, y: c.y }))
    .filter((c) => c.y >= BASELINE - LINE_ABOVE && c.y <= BASELINE + LINE_BELOW)
    .filter((c) => { const n = nearestPoint(c, modelDense); return n !== null && Math.abs(n.y - BASELINE) <= BASELINE_BAND })
  const lineOffsets = modelBand
    .map((m) => baselineGap(m, childBase))
    .filter((g): g is number => g !== null)
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
