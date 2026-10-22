/* Pure stroke geometry: bounding boxes, gestures (tap, scribble-out), noise and digit segmentation.
   No DOM access here so everything is unit-testable. */
import type { InkPoint, InkStroke } from '@/types'
import { TAP_MS, TAP_SLOP_PX } from './constants'

export interface BBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
  cx: number
  cy: number
}

export interface Size { width: number; height: number }

function box(minX: number, minY: number, maxX: number, maxY: number): BBox {
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
}

export function pointsBBox(points: readonly InkPoint[]): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  if (minX === Infinity) return box(0, 0, 0, 0)
  return box(minX, minY, maxX, maxY)
}

export function strokeBBox(s: InkStroke): BBox {
  return pointsBBox(s.points)
}

export function unionBBox(boxes: readonly BBox[]): BBox | null {
  if (!boxes.length) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const b of boxes) {
    minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY)
    maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY)
  }
  return box(minX, minY, maxX, maxY)
}

export function strokesBBox(strokes: readonly InkStroke[]): BBox | null {
  return unionBBox(strokes.filter((s) => s.points.length).map(strokeBBox))
}

export function pathLength(points: readonly InkPoint[]): number {
  let len = 0
  for (let i = 1; i < points.length; i++) len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  return len
}

export function strokeDuration(s: InkStroke): number {
  const n = s.points.length
  return n < 2 ? 0 : s.points[n - 1].t - s.points[0].t
}

/** Slop (px) under which a press counts as a tap, scaled with the writing zone. */
export function tapSlop(zone: Size): number {
  return Math.max(TAP_SLOP_PX, Math.min(zone.width, zone.height) * 0.08)
}

/** A quick press that barely moved: used for focus, alternatives and "tap to rewrite". */
export function isTap(stroke: InkStroke, zone: Size): boolean {
  if (!stroke.points.length) return true
  const b = strokeBBox(stroke)
  return strokeDuration(stroke) <= TAP_MS && Math.hypot(b.width, b.height) <= tapSlop(zone)
}

/** Tiny marks (accidental dots) that should not reach the recogniser. */
export function isNoise(stroke: InkStroke, zoneHeight: number): boolean {
  const b = strokeBBox(stroke)
  return Math.hypot(b.width, b.height) < Math.max(3, zoneHeight * 0.05)
}

/** Counts direction reversals along one axis, with hysteresis so that hand tremor is ignored. */
export function countReversals(values: readonly number[], amplitude: number): number {
  if (values.length < 3) return 0
  let dir = 0 // +1 increasing, -1 decreasing, 0 not decided yet
  let lo = values[0]
  let hi = values[0]
  let extreme = values[0]
  let reversals = 0
  for (let i = 1; i < values.length; i++) {
    const v = values[i]
    if (dir === 0) {
      lo = Math.min(lo, v)
      hi = Math.max(hi, v)
      if (v - lo >= amplitude) { dir = 1; extreme = v }
      else if (hi - v >= amplitude) { dir = -1; extreme = v }
    } else if (dir === 1) {
      if (v > extreme) extreme = v
      else if (extreme - v >= amplitude) { reversals++; dir = -1; extreme = v }
    } else {
      if (v < extreme) extreme = v
      else if (v - extreme >= amplitude) { reversals++; dir = 1; extreme = v }
    }
  }
  return reversals
}

/**
 * Scribble-out gesture: a dense back-and-forth zig-zag. Thresholds keep real digits (3, 8, a 0 traced twice) safe:
 * those have at most ~4 reversals on either axis.
 */
export function isScribble(stroke: InkStroke, zone: Size): boolean {
  const pts = stroke.points
  if (pts.length < 12) return false
  const b = strokeBBox(stroke)
  const diag = Math.hypot(b.width, b.height)
  if (diag < Math.min(zone.width, zone.height) * 0.25) return false
  const ratio = pathLength(pts) / Math.max(diag, 1)
  if (ratio < 3.5) return false
  const ampX = Math.max(3, b.width * 0.22)
  const ampY = Math.max(3, b.height * 0.22)
  const rx = countReversals(pts.map((p) => p.x), ampX)
  const ry = countReversals(pts.map((p) => p.y), ampY)
  return rx >= 6 || ry >= 6
}

export function translateStrokes(strokes: readonly InkStroke[], dx: number, dy: number): InkStroke[] {
  return strokes.map((s) => ({ pointerType: s.pointerType, points: s.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })) }))
}

/** Strokes with any point within `radius` of (x, y) — used by the pen eraser. */
export function strokesNear(strokes: readonly InkStroke[], x: number, y: number, radius: number): InkStroke[] {
  const r2 = radius * radius
  return strokes.filter((s) => s.points.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 <= r2))
}

/** Fraction of `a` covered by `b` (0..1), with optional padding on b. */
export function overlapFraction(a: BBox, b: BBox, pad = 0): number {
  const w = Math.min(a.maxX, b.maxX + pad) - Math.max(a.minX, b.minX - pad)
  const h = Math.min(a.maxY, b.maxY + pad) - Math.max(a.minY, b.minY - pad)
  if (w <= 0 || h <= 0) return 0
  const area = Math.max(a.width, 1) * Math.max(a.height, 1)
  return Math.min(1, (w * h) / area)
}

// ------------------------------------------------------------------------------------------ segmentation

export interface Segment {
  strokes: InkStroke[]
  bbox: BBox
}

interface Cluster { strokes: InkStroke[]; boxes: BBox[]; b: BBox }

function clusterOf(strokes: InkStroke[], boxes: BBox[]): Cluster {
  return { strokes, boxes, b: unionBBox(boxes)! }
}

/** Smallest distance between two polylines' points (subsampled; strokes are short). */
export function minPointDistance(a: readonly InkPoint[], b: readonly InkPoint[]): number {
  let best = Infinity
  const stepA = a.length > 80 ? 2 : 1
  const stepB = b.length > 80 ? 2 : 1
  for (let i = 0; i < a.length; i += stepA) {
    for (let j = 0; j < b.length; j += stepB) {
      const d = (a[i].x - b[j].x) ** 2 + (a[i].y - b[j].y) ** 2
      if (d < best) best = d
    }
  }
  return Math.sqrt(best)
}

/**
 * How strongly a stroke (or cluster) belongs with another one, based on horizontal overlap (0..1+).
 * A narrow mark whose centre lies inside a wider one joins it when it is short (a bar, a hat) or when it
 * actually touches/crosses it (the second stroke of a 4).
 */
function affinity(a: Cluster, b: Cluster, minW: number, touch: number): number {
  const ov = Math.min(a.b.maxX, b.b.maxX) - Math.max(a.b.minX, b.b.minX)
  const wa = Math.max(a.b.width, minW)
  const wb = Math.max(b.b.width, minW)
  const ratio = ov / Math.min(wa, wb)
  const narrow = a.b.width <= b.b.width ? a : b
  const wide = narrow === a ? b : a
  let inside = 0
  if (narrow.b.cx >= wide.b.minX && narrow.b.cx <= wide.b.maxX && narrow.b.width < wide.b.width * 0.9) {
    const short = narrow.b.height < wide.b.height * 0.6
    const touches = !short && narrow.strokes.some((s) => wide.strokes.some((w) => minPointDistance(s.points, w.points) <= touch))
    if (short || touches) inside = 0.6
  }
  return Math.max(ratio, inside)
}

/**
 * Splits a written number into digits by clustering stroke bounding boxes along x.
 * Robust to multi-stroke digits (4, 5, 7: the bar/hat/second stroke overlaps the main stroke horizontally),
 * to strokes written out of order, and to slightly touching neighbours. Tiny dots are dropped; detached
 * fragments (a 5's hat or 7's bar drawn a bit apart) are merged into the nearest digit.
 */
export function segmentStrokes(strokes: readonly InkStroke[], opts: { zoneHeight: number }): Segment[] {
  const H = Math.max(opts.zoneHeight, 1)
  const minW = H * 0.15
  const items = strokes
    .filter((s) => s.points.length > 0 && !isNoise(s, H))
    .map((s) => ({ s, b: strokeBBox(s) }))
    .sort((a, b) => a.b.minX - b.b.minX)

  // 1) greedy assignment, widest strokes first so that bars/hats find their digit
  const byWidth = [...items].sort((a, b) => b.b.height + b.b.width * 0.2 - (a.b.height + a.b.width * 0.2))
  const touch = H * 0.06
  let clusters: Cluster[] = []
  for (const it of byWidth) {
    const single = clusterOf([it.s], [it.b])
    let best = -1
    let bestScore = 0.5
    clusters.forEach((c, i) => {
      const score = affinity(single, c, minW, touch)
      if (score >= bestScore) { best = i; bestScore = score }
    })
    if (best >= 0) {
      const c = clusters[best]
      clusters[best] = clusterOf([...c.strokes, it.s], [...c.boxes, it.b])
    } else {
      clusters.push(single)
    }
  }

  // 2) merge clusters that grew into each other
  let merged = true
  while (merged && clusters.length > 1) {
    merged = false
    outer: for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        if (affinity(clusters[i], clusters[j], minW, touch) >= 0.5) {
          const a = clusters[i], b = clusters[j]
          clusters = clusters.filter((_, k) => k !== i && k !== j)
          clusters.push(clusterOf([...a.strokes, ...b.strokes], [...a.boxes, ...b.boxes]))
          merged = true
          break outer
        }
      }
    }
  }

  // 3) fragments (short marks such as a detached hat or bar) join the nearest digit
  const heights = clusters.map((c) => c.b.height).sort((a, b) => a - b)
  const median = heights.length ? heights[Math.floor(heights.length / 2)] : 0
  const fragLimit = Math.max(median, H * 0.5) * 0.33
  let changed = true
  while (changed && clusters.length > 1) {
    changed = false
    const idx = clusters.findIndex((c) => c.b.height < fragLimit)
    if (idx < 0) break
    const frag = clusters[idx]
    let nearest = -1
    let dist = Infinity
    clusters.forEach((c, i) => {
      if (i === idx || c.b.height < fragLimit) return
      const gap = Math.max(0, Math.max(c.b.minX - frag.b.maxX, frag.b.minX - c.b.maxX))
      const d = gap + Math.abs(c.b.cx - frag.b.cx) * 0.25
      if (d < dist) { dist = d; nearest = i }
    })
    if (nearest < 0) break
    const target = clusters[nearest]
    clusters = clusters.filter((_, k) => k !== idx && k !== nearest)
    clusters.push(clusterOf([...target.strokes, ...frag.strokes], [...target.boxes, ...frag.boxes]))
    changed = true
  }

  const order = new Map(strokes.map((s, i) => [s, i] as const))
  return clusters
    .sort((a, b) => a.b.cx - b.b.cx)
    .map((c) => ({ strokes: [...c.strokes].sort((x, y) => (order.get(x) ?? 0) - (order.get(y) ?? 0)), bbox: c.b }))
}

/**
 * Re-centres one segment into a square-ish zone the size of a single digit cell, so the recogniser sees the
 * same geometry as in a DigitCell.
 */
export function segmentZone(seg: Segment, zoneHeight: number): { strokes: InkStroke[]; zone: Size } {
  const width = Math.max(zoneHeight * 0.85, seg.bbox.width + zoneHeight * 0.2)
  const dx = width / 2 - seg.bbox.cx
  return { strokes: translateStrokes(seg.strokes, dx, 0), zone: { width, height: zoneHeight } }
}

/** Spreads typeset digit centres so they never overlap, keeping them inside [0, width]. */
export function spreadCentres(centres: readonly number[], minGap: number, width: number): number[] {
  const out = [...centres]
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + minGap)
  const overflow = out.length ? out[out.length - 1] - (width - minGap / 2) : 0
  if (overflow > 0) for (let i = 0; i < out.length; i++) out[i] -= overflow
  for (let i = out.length - 2; i >= 0; i--) out[i] = Math.min(out[i], out[i + 1] - minGap)
  const under = out.length ? minGap / 2 - out[0] : 0
  if (under > 0) for (let i = 0; i < out.length; i++) out[i] += under
  return out
}
