/* Letra ligada (Spanish school cursive) as centreline stroke models, in a 100-unit em box.
   y grows downwards. Each glyph is written as control points that are smoothed with a centripetal
   Catmull-Rom spline and resampled every 2 units, so the strokes are data, not hand-typed point lists.
   Stroke order and direction follow the Spanish escuela: "o" starts at the top right and goes
   counter-clockwise (on screen). Consumed by join.ts (words) and CursiveModel.tsx (drawing). */

import type { ModelPoint, ModelStroke } from '../digitModels'

export type { ModelPoint, ModelStroke }

/** Em box: the model box for one letter height. */
export const CURSIVE_EM = 100
/** Guide lines of the two-line pauta (y grows downwards). */
export const BASELINE = 70
export const XHEIGHT = 40
export const ASCENDER = 5
export const DESCENDER = 100

/** Gap between words, in units. */
export const WORD_SPACE = 28

export interface CursiveGlyph {
  /** Strokes in writing order, in glyph coordinates. The first `main` strokes are the joined pen path; the rest are extras. */
  strokes: ModelStroke[]
  /** How many leading strokes form the joined pen path. */
  main: number
  /** Advance width: the horizontal extent of the letter body (strokes taller than a mark). */
  width: number
  /** Where the pen joins from the previous letter (first point of the first stroke). */
  entry: ModelPoint
  /** Where the pen leaves towards the next letter (last point of the last joined stroke). */
  exit: ModelPoint
}

type P = [number, number]

const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** Centripetal Catmull-Rom through the control points, sampled `per` times per segment. */
function smooth(ctrl: P[], per = 12): P[] {
  const pts: P[] = []
  for (const p of ctrl) if (!pts.length || dist(pts[pts.length - 1], p) > 1e-6) pts.push(p)
  if (pts.length < 2) return pts
  const at = (i: number): P => {
    if (i < 0) return [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]]
    if (i >= pts.length) {
      const n = pts.length
      return [2 * pts[n - 1][0] - pts[n - 2][0], 2 * pts[n - 1][1] - pts[n - 2][1]]
    }
    return pts[i]
  }
  const out: P[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    const t0 = 0
    const t1 = t0 + Math.pow(Math.max(dist(p0, p1), 1e-3), 0.5)
    const t2 = t1 + Math.pow(Math.max(dist(p1, p2), 1e-3), 0.5)
    const t3 = t2 + Math.pow(Math.max(dist(p2, p3), 1e-3), 0.5)
    for (let k = 0; k < per; k++) {
      const t = t1 + ((t2 - t1) * k) / per
      const lerp = (a: P, b: P, ta: number, tb: number): P => {
        const u = tb === ta ? 0 : (t - ta) / (tb - ta)
        return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
      }
      const a1 = lerp(p0, p1, t0, t1), a2 = lerp(p1, p2, t1, t2), a3 = lerp(p2, p3, t2, t3)
      const b1 = lerp(a1, a2, t0, t2), b2 = lerp(a2, a3, t1, t3)
      out.push(lerp(b1, b2, t1, t2))
    }
  }
  out.push(pts[pts.length - 1])
  return out
}

/** Resamples a polyline every `step` units of arc length (last point kept). */
function resample(pts: P[], step = 2): ModelStroke {
  if (pts.length < 2) return pts.map(([x, y]) => ({ x, y }))
  const out: ModelPoint[] = [{ x: pts[0][0], y: pts[0][1] }]
  let carry = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    const len = dist(a, b)
    let d = step - carry
    while (d <= len) {
      const u = d / len
      out.push({ x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u })
      d += step
    }
    carry = len - (d - step)
  }
  const last = pts[pts.length - 1]
  const end = out[out.length - 1]
  if (Math.hypot(end.x - last[0], end.y - last[1]) > 0.2) out.push({ x: last[0], y: last[1] })
  return out
}

/** One stroke from control points (smoothed, resampled to 2-unit spacing). */
const S = (...ctrl: P[]): ModelStroke => resample(smooth(ctrl))

/** Points of an ellipse arc in degrees (0 = east, decreasing = counter-clockwise on screen). */
function ell(cx: number, cy: number, rx: number, ry: number, from: number, to: number, n = 16): P[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / n) * Math.PI) / 180
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as P
  })
}

/** Stroke along an ellipse arc (see `ell`), resampled. */
const A = (cx: number, cy: number, rx: number, ry: number, from: number, to: number): ModelStroke =>
  resample(ell(cx, cy, rx, ry, from, to, 24), 2)

/** An arch from the baseline up to the x-height and down to the baseline (cursive n, m, h shoulders). */
const hump = (x0: number, w: number): P[] => [
  [x0, BASELINE],
  [x0 + w * 0.22, XHEIGHT + 6],
  [x0 + w * 0.5, XHEIGHT],
  [x0 + w * 0.78, XHEIGHT + 6],
  [x0 + w, BASELINE],
]

/** A small mark (dot or tilde): not a pen-down stroke of the letter. */
const MARK = (...ctrl: P[]): ModelStroke => resample(smooth(ctrl), 2)

/** A dot is the only stroke too small to count for the letter's width. */
const isDot = (st: ModelStroke) => {
  const xs = st.map((p) => p.x), ys = st.map((p) => p.y)
  return Math.max(...xs) - Math.min(...xs) < 3 && Math.max(...ys) - Math.min(...ys) < 3
}

/**
 * Builds a glyph. `main` is the pen path that joins the neighbours (entry = its first point, exit = its last);
 * `extras` are pen lifts drawn after it (dots, tildes, crossbars, the second stroke of x, capital bars).
 * x is shifted so the letter body starts at 0; `width` is the extent of the strokes tall enough to be body.
 */
function glyph(main: ModelStroke[], extras: ModelStroke[] = []): CursiveGlyph {
  const body = [...main, ...extras].filter((st) => !isDot(st))
  const xs = body.flat().map((p) => p.x)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const shift = (st: ModelStroke) => st.map((p) => ({ x: round1(p.x - minX), y: round1(p.y) }))
  const joined = main.map(shift)
  const rest = extras.map(shift)
  const last = joined[joined.length - 1]
  return {
    strokes: [...joined, ...rest],
    main: joined.length,
    width: round1(maxX - minX),
    entry: joined[0][0],
    exit: last[last.length - 1],
  }
}
const round1 = (n: number) => Math.round(n * 10) / 10

const DOT = (x: number, y: number) => MARK([x, y], [x + 0.6, y + 0.2], [x + 1.2, y])
const TILDE = (x: number, y: number) => MARK([x, y + 2], [x + 4, y - 2], [x + 8, y + 2], [x + 12, y - 2], [x + 16, y + 2])

/** Lowercase letters a–z and ñ. */
export const CURSIVE_LOWER: Record<string, CursiveGlyph> = {
  // Ccw bowl from the top right, closed, then the stem down to the baseline.
  a: glyph([S([31, 46], [24, 41], [15, 40], [6, 45], [2, 55], [6, 66], [15, 70], [25, 66], [31, 56], [31, 46], [31, 70], [36, 70])]),
  // Tall stem from the baseline, ccw bowl on the right.
  b: glyph([S([3, 70], [6, 46], [10, 16], [15, 6], [17, 12], [15, 40], [14, 62], [19, 70], [29, 69], [36, 60], [35, 49], [27, 41], [18, 44], [13, 53])]),
  // Open ccw curve from the top right to the lower left.
  c: glyph([S([30, 46], [24, 41], [14, 40], [5, 46], [2, 56], [6, 66], [16, 70], [26, 67], [33, 60])]),
  // Round bowl (clockwise after the stem) and tall stem on the right.
  d: glyph([S([31, 6], [31, 30], [31, 56], [28, 67], [18, 70], [7, 65], [2, 55], [6, 45], [15, 40], [25, 42], [31, 48])]),
  // Bar from the middle left, then up and over counter-clockwise, out at the baseline.
  e: glyph([S([2, 56], [14, 54], [27, 52], [34, 49], [34, 43], [26, 40], [14, 41], [5, 49], [3, 60], [10, 68], [22, 70], [32, 66], [37, 62])]),
  // Top hook, stem through the baseline into the descender loop; crossbar on its own.
  f: glyph([S([24, 9], [17, 5], [12, 14], [10, 40], [9, 70], [6, 86], [10, 95], [20, 94], [27, 88])], [S([3, 46], [26, 44])]),
  // Bowl as in a, stem into a descender loop.
  g: glyph([S([31, 46], [24, 41], [15, 40], [6, 45], [2, 55], [6, 66], [15, 70], [25, 66], [31, 56], [31, 46], [32, 70], [31, 84], [24, 94], [12, 92], [5, 86])]),
  // Tall stem, then a shoulder hump on the right.
  h: glyph([S([2, 70], [6, 46], [10, 14], [14, 6], [17, 12], [17, 40], [18, 58], [24, 64], [29, 58], [31, 46], [33, 58], [37, 68], [40, 70])]),
  // Stem with a dot above (the dot is a mark).
  i: glyph([S([2, 70], [5, 46], [9, 40], [12, 44], [12, 62], [14, 70], [20, 70])], [DOT(9, 27)]),
  // Like i, with a descender loop and a dot.
  j: glyph([S([2, 70], [5, 46], [9, 40], [12, 44], [12, 62], [12, 84], [8, 95], [2, 92])], [DOT(10, 27)]),
  // Tall stem, a loop back at the x-height, leg to the right.
  k: glyph([S([2, 70], [6, 46], [10, 14], [14, 6], [17, 12], [15, 40], [15, 56], [18, 60], [24, 62], [32, 70])]),
  // Tall stem with a hook top and a small loop at the bottom.
  l: glyph([S([2, 70], [6, 46], [10, 14], [14, 6], [17, 12], [14, 40], [10, 64], [14, 70], [22, 68])]),
  // Three humps.
  m: glyph([S(...hump(2, 18), ...hump(20, 18).slice(1), ...hump(38, 18).slice(1))]),
  // Two humps.
  n: glyph([S(...hump(2, 20), ...hump(22, 20).slice(1))]),
  // Two humps and a tilde.
  ñ: glyph([S(...hump(2, 20), ...hump(22, 20).slice(1))], [TILDE(14, 24)]),
  // Counter-clockwise oval from the top right, closed back to the start.
  o: glyph([A(20, 55, 17, 15, -25, -385)]),
  // Like a, with the stem into the descender.
  p: glyph([S([4, 40], [4, 70], [5, 94])]),
  // Bowl and tall-down stem on the right with a tail.
  q: glyph([S([36, 40], [36, 70], [35, 94], [40, 96])]),
  // Stem with a hump, and a shoulder to the right.
  r: glyph([S([2, 70], [6, 46], [12, 40], [18, 46], [19, 60], [19, 70], [21, 56], [25, 44], [30, 40], [34, 42])]),
  // S shape: top right, over to the left, down, out to the lower left.
  s: glyph([S([27, 44], [20, 40], [10, 41], [5, 48], [10, 55], [22, 59], [29, 64], [26, 70], [14, 70], [5, 64])]),
  // Tall stem with a short cross-bar and a tail.
  t: glyph([S([4, 70], [8, 46], [12, 14], [14, 8], [17, 14], [15, 40], [16, 62], [22, 70], [30, 66])], [S([6, 40], [24, 38])]),
  // Down-up-down-up with two bowls.
  u: glyph([S([2, 40], [4, 58], [10, 70], [16, 68], [18, 56], [19, 40], [20, 58], [26, 70], [32, 68], [34, 56], [35, 40], [36, 58], [40, 70], [42, 70])]),
  // Two V shapes joined.
  v: glyph([S([2, 40], [7, 64], [12, 70], [17, 58], [22, 40], [26, 58], [30, 70], [38, 68])]),
  // Three V shapes joined.
  w: glyph([S([2, 40], [7, 64], [12, 70], [17, 58], [22, 40], [27, 58], [32, 70], [37, 64], [42, 40], [48, 58], [54, 70], [58, 68])]),
  // Two crossing strokes.
  x: glyph([S([2, 40], [12, 56], [22, 70])], [S([42, 40], [30, 56], [20, 70])]),
  // V shape with the descender.
  y: glyph([S([2, 40], [7, 64], [12, 70], [17, 58], [22, 40], [24, 58], [30, 70], [33, 80], [27, 94], [16, 96], [10, 90])]),
  // Top bar, diagonal down, bottom bar.
  z: glyph([S([4, 41], [18, 40], [30, 40], [24, 50], [10, 62], [4, 70], [16, 70], [26, 70], [38, 70])]),
}

/** Uppercase letters A–Z and Ñ (simple, clear shapes; capitals join to the next letter at their exit). */
export const CURSIVE_UPPER: Record<string, CursiveGlyph> = {
  A: glyph([S([2, 70], [14, 34], [22, 8], [30, 34], [42, 70])], [S([8, 50], [36, 50])]),
  B: glyph([S([4, 70], [4, 8], [26, 8], [36, 20], [26, 38], [4, 38], [28, 40], [40, 50], [36, 66], [24, 70], [4, 70])]),
  C: glyph([S([46, 22], [36, 10], [24, 8], [10, 14], [4, 40], [10, 64], [24, 70], [38, 64], [48, 58])]),
  D: glyph([S([4, 8], [4, 70], [24, 70], [40, 60], [48, 40], [42, 18], [26, 8], [4, 8])]),
  E: glyph([S([40, 8], [4, 8], [4, 70], [42, 70])], [S([4, 40], [32, 40])]),
  F: glyph([S([40, 8], [4, 8], [4, 70])], [S([4, 40], [32, 40])]),
  G: glyph([S([46, 22], [36, 10], [24, 8], [10, 14], [4, 40], [10, 64], [24, 70], [42, 66], [48, 52], [48, 40], [30, 40])]),
  H: glyph([S([4, 8], [4, 70])], [S([4, 40], [44, 40]), S([44, 8], [44, 70])]),
  I: glyph([S([8, 8], [30, 8])], [S([18, 8], [18, 70]), S([8, 70], [30, 70])]),
  J: glyph([S([16, 8], [30, 8], [30, 50], [24, 68], [10, 70], [4, 58])]),
  K: glyph([S([6, 8], [6, 70])], [S([42, 8], [10, 44], [44, 70])]),
  L: glyph([S([6, 8], [6, 70], [40, 70])]),
  M: glyph([S([2, 70], [8, 8], [26, 56], [44, 8], [50, 70])]),
  N: glyph([S([4, 70], [4, 8], [44, 70], [44, 8])]),
  O: glyph([A(26, 39, 22, 31, -25, -385)]),
  P: glyph([S([4, 70], [4, 8], [30, 8], [40, 20], [30, 40], [4, 40])]),
  Q: glyph([A(26, 39, 22, 31, -25, -385)], [S([30, 60], [46, 76])]),
  R: glyph([S([4, 70], [4, 8], [30, 8], [40, 20], [30, 40], [4, 40])], [S([24, 40], [44, 70])]),
  S: glyph([S([38, 22], [28, 10], [14, 10], [6, 22], [12, 36], [30, 42], [42, 52], [38, 66], [26, 70], [10, 66], [4, 56])]),
  T: glyph([S([4, 8], [40, 8])], [S([22, 8], [22, 70])]),
  U: glyph([S([4, 8], [6, 50], [16, 68], [28, 68], [38, 50], [40, 8])]),
  V: glyph([S([2, 8], [20, 70], [38, 8])]),
  W: glyph([S([2, 8], [14, 70], [26, 20], [38, 70], [50, 8])]),
  X: glyph([S([4, 8], [40, 70])], [S([40, 8], [4, 70])]),
  Y: glyph([S([4, 8], [20, 40], [20, 70])], [S([38, 8], [20, 40])]),
  Z: glyph([S([4, 8], [40, 8], [4, 70], [42, 70])]),
  Ñ: glyph([S([4, 70], [4, 8], [44, 70], [44, 8])], [TILDE(14, 14)]),
}
