/* Stroke preprocessing: ink strokes (zone px) -> 28x28 MNIST-style image (0..1, row-major).

   MUST stay numerically identical to ml/preprocess.py (the training pipeline). Parity is checked by
   preprocess.test.ts against reference images exported by ml/make_fixtures.py. If you change anything here,
   change the Python twin, re-export fixtures and retrain.

   0. drop stray taps: tiny strokes far from the rest of the ink (a child often taps the cell first)
   1. bbox of all points; no ink / ink extent below the "tiny" threshold -> null
   2. uniform scale (aspect ratio preserved: a thin "1" stays thin) so ink + pen width fits a BOX×BOX square,
      centred on the bbox centre
   3. anti-aliased distance rasteriser, round caps/joins: coverage = clamp(r + 0.5 - dist, 0, 1), union = max
      (pure Float64Array maths: no DOM canvas, runs in tests and workers)
   4. second pass shifted so that the centre of mass lands on the image centre (sub-pixel)
*/

export const PREPROCESS = {
  size: 28,
  box: 20,
  /** Pen width in output pixels. Uniform, i.e. proportional to the digit size (never the on-screen width). */
  lineWidth: 2.6,
  minInkPx: 3,
  minInkFrac: 0.06,
  maxComShift: 4,
  /** A stroke smaller than this fraction of all ink... */
  strayMaxFrac: 0.12,
  /** ...and farther than this fraction of the rest's extent from it is a stray tap and is ignored. */
  strayGapFrac: 0.2,
} as const

const SIZE: number = PREPROCESS.size
const N = SIZE * SIZE

export interface PointLike { x: number; y: number }
export interface StrokeLike { points: ReadonlyArray<PointLike> }

export type PreprocessReason = 'ok' | 'empty' | 'tiny'

export interface PreprocessResult {
  /** 28×28 image, row-major, 0..1 (null when there is nothing digit-sized to recognise). */
  image: Float32Array | null
  reason: PreprocessReason
  /** Largest side of the ink bounding box, zone px (0 when empty). */
  inkExtent: number
  bbox: { x: number; y: number; width: number; height: number } | null
}

export interface PreprocessOptions {
  lineWidth?: number
  /** Disable the "too tiny" check (fixtures / tooling). Default true. */
  checkTiny?: boolean
}

/** Minimum ink extent (zone px) for something to count as a digit attempt. */
export function minInkExtent(zone?: { width: number; height: number } | null): number {
  const w = zone?.width
  const h = zone?.height
  if (w && h && w > 0 && h > 0 && Number.isFinite(w) && Number.isFinite(h)) {
    return Math.max(PREPROCESS.minInkPx, PREPROCESS.minInkFrac * Math.min(w, h))
  }
  return PREPROCESS.minInkPx
}

/** Polylines -> flat segment list [ax, ay, bx, by, ...]. A single-point stroke becomes a dot. */
export function strokesToSegments(strokes: ReadonlyArray<StrokeLike>): Float64Array {
  let n = 0
  for (const s of strokes) {
    const len = s.points.length
    if (len === 1) n += 1
    else if (len > 1) n += len - 1
  }
  const segs = new Float64Array(n * 4)
  let k = 0
  for (const s of strokes) {
    const p = s.points
    if (p.length === 1) {
      segs[k++] = p[0].x; segs[k++] = p[0].y; segs[k++] = p[0].x; segs[k++] = p[0].y
    } else {
      for (let i = 1; i < p.length; i++) {
        segs[k++] = p[i - 1].x; segs[k++] = p[i - 1].y; segs[k++] = p[i].x; segs[k++] = p[i].y
      }
    }
  }
  return segs
}

/** Distance-based anti-aliased rasteriser into `out` (length 784), segments in output pixel coordinates. */
export function rasterizeSegments(segs: Float64Array, lineWidth: number, out: Float64Array): void {
  out.fill(0)
  const r = lineWidth / 2
  const reach = r + 1
  const n = segs.length / 4
  for (let s = 0; s < n; s++) {
    const ax = segs[s * 4], ay = segs[s * 4 + 1], bx = segs[s * 4 + 2], by = segs[s * 4 + 3]
    const vx = bx - ax
    const vy = by - ay
    const l2 = vx * vx + vy * vy
    const j0 = Math.max(0, Math.floor(Math.min(ax, bx) - reach))
    const j1 = Math.min(SIZE - 1, Math.ceil(Math.max(ax, bx) + reach))
    const i0 = Math.max(0, Math.floor(Math.min(ay, by) - reach))
    const i1 = Math.min(SIZE - 1, Math.ceil(Math.max(ay, by) + reach))
    for (let i = i0; i <= i1; i++) {
      const py = i + 0.5
      const wy = py - ay
      for (let j = j0; j <= j1; j++) {
        const px = j + 0.5
        const wx = px - ax
        let t = l2 > 0 ? (wx * vx + wy * vy) / l2 : 0
        if (t < 0) t = 0
        else if (t > 1) t = 1
        const dx = px - (ax + t * vx)
        const dy = py - (ay + t * vy)
        const d = Math.sqrt(dx * dx + dy * dy)
        let c = r + 0.5 - d
        if (c <= 0) continue
        if (c > 1) c = 1
        const idx = i * SIZE + j
        if (c > out[idx]) out[idx] = c
      }
    }
  }
}

/** Core preprocessing on a segment list (zone px). */
export function preprocessSegments(
  segs: Float64Array,
  zone?: { width: number; height: number } | null,
  options: PreprocessOptions = {},
): PreprocessResult {
  const lineWidth = options.lineWidth ?? PREPROCESS.lineWidth
  const checkTiny = options.checkTiny ?? true
  const n = segs.length / 4
  if (n === 0) return { image: null, reason: 'empty', inkExtent: 0, bbox: null }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (let k = 0; k < segs.length; k += 2) {
    const x = segs[k], y = segs[k + 1]
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  if (!Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(x1) || !Number.isFinite(y1)) {
    return { image: null, reason: 'empty', inkExtent: 0, bbox: null }
  }
  const w = x1 - x0
  const h = y1 - y0
  let ext = Math.max(w, h)
  const bbox = { x: x0, y: y0, width: w, height: h }
  if (checkTiny && ext < minInkExtent(zone)) return { image: null, reason: 'tiny', inkExtent: ext, bbox }
  const inkExtent = ext
  if (ext <= 0) ext = 1
  const scale = (PREPROCESS.box - lineWidth) / ext
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const half = SIZE / 2
  const t = new Float64Array(segs.length)
  for (let k = 0; k < segs.length; k += 2) {
    t[k] = (segs[k] - cx) * scale + half
    t[k + 1] = (segs[k + 1] - cy) * scale + half
  }
  const img = new Float64Array(N)
  rasterizeSegments(t, lineWidth, img)
  let mass = 0, sx = 0, sy = 0
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const v = img[i * SIZE + j]
      mass += v
      sx += v * (j + 0.5)
      sy += v * (i + 0.5)
    }
  }
  if (mass > 0) {
    const m = PREPROCESS.maxComShift
    const dx = Math.min(m, Math.max(-m, half - sx / mass))
    const dy = Math.min(m, Math.max(-m, half - sy / mass))
    for (let k = 0; k < t.length; k += 2) {
      t[k] += dx
      t[k + 1] += dy
    }
    rasterizeSegments(t, lineWidth, img)
  }
  return { image: Float32Array.from(img), reason: 'ok', inkExtent, bbox }
}

type Box = { x0: number; y0: number; x1: number; y1: number }

function boxOf(strokes: ReadonlyArray<StrokeLike>): Box {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const s of strokes) {
    for (const p of s.points) {
      if (p.x < x0) x0 = p.x
      if (p.x > x1) x1 = p.x
      if (p.y < y0) y0 = p.y
      if (p.y > y1) y1 = p.y
    }
  }
  return { x0, y0, x1, y1 }
}

/** Removes tiny strokes far away from the rest of the ink (e.g. a tap on the cell before writing). */
export function dropStrayStrokes<S extends StrokeLike>(strokes: ReadonlyArray<S>): S[] {
  const arr = strokes.filter((s) => s.points.length > 0)
  if (arr.length < 2) return arr
  const boxes = arr.map((s) => boxOf([s]))
  const all = boxOf(arr)
  const extAll = Math.max(all.x1 - all.x0, all.y1 - all.y0)
  const small = boxes.map((b) => Math.max(b.x1 - b.x0, b.y1 - b.y0) < PREPROCESS.strayMaxFrac * extAll)
  const main = arr.filter((_, i) => !small[i])
  if (!main.length) return arr
  const m = boxOf(main)
  const extMain = Math.max(m.x1 - m.x0, m.y1 - m.y0)
  return arr.filter((_, i) => {
    if (!small[i]) return true
    const b = boxes[i]
    const gx = Math.max(0, m.x0 - b.x1, b.x0 - m.x1)
    const gy = Math.max(0, m.y0 - b.y1, b.y0 - m.y1)
    return !(Math.max(gx, gy) > PREPROCESS.strayGapFrac * extMain)
  })
}

/** Strokes (zone px) -> 28×28 image, or null + reason when empty / too tiny. Stray taps are ignored. */
export function preprocessStrokes(
  strokes: ReadonlyArray<StrokeLike>,
  zone?: { width: number; height: number } | null,
  options?: PreprocessOptions,
): PreprocessResult {
  return preprocessSegments(strokesToSegments(dropStrayStrokes(strokes)), zone, options)
}

/** Centre of mass (x, y) of a 28×28 image in pixel units (pixel centres at i + 0.5). */
export function centerOfMass(img: ArrayLike<number>): { x: number; y: number; mass: number } {
  let mass = 0, sx = 0, sy = 0
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const v = img[i * SIZE + j]
      mass += v
      sx += v * (j + 0.5)
      sy += v * (i + 0.5)
    }
  }
  return mass > 0 ? { x: sx / mass, y: sy / mass, mass } : { x: SIZE / 2, y: SIZE / 2, mass: 0 }
}

/** Ink bounding box of a 28×28 image (pixels above `threshold`). */
export function imageBBox(img: ArrayLike<number>, threshold = 0.1): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = SIZE, y0 = SIZE, x1 = -1, y1 = -1
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (img[i * SIZE + j] > threshold) {
        if (j < x0) x0 = j
        if (j > x1) x1 = j
        if (i < y0) y0 = i
        if (i > y1) y1 = i
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 }
}

/** Encode a 28×28 0..1 image as base64 of 784 bytes (0..255) — the InkSample.image28 storage format. */
export function encodeImage28(img: ArrayLike<number>): string {
  const bytes = new Uint8Array(N)
  for (let i = 0; i < N; i++) bytes[i] = Math.max(0, Math.min(255, Math.round((img[i] ?? 0) * 255)))
  let bin = ''
  for (let i = 0; i < N; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

/** Decode InkSample.image28 (base64, 784 bytes) back to a 0..1 Float32Array; null if malformed. */
export function decodeImage28(b64: string): Float32Array | null {
  try {
    const bin = atob(b64)
    if (bin.length !== N) return null
    const out = new Float32Array(N)
    for (let i = 0; i < N; i++) out[i] = bin.charCodeAt(i) / 255
    return out
  } catch {
    return null
  }
}
