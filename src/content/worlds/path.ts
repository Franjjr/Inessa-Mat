/* Map layout helper: places N nodes at equal arc-length steps along a smooth Catmull-Rom curve through a world's
   control points. Coordinates are 0..1 (x → right, y → down). Equal spacing along a non-self-crossing curve keeps
   nodes from overlapping; tests verify the minimum distance on tablet viewports. */
export type Point = { x: number; y: number }

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
}

/** Dense polyline of the Catmull-Rom spline through the control points (endpoints duplicated). */
export function samplePath(points: [number, number][], perSegment = 64): Point[] {
  const pts = points.map(([x, y]) => ({ x, y }))
  const out: Point[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment
      out.push({ x: catmull(p0.x, p1.x, p2.x, p3.x, t), y: catmull(p0.y, p1.y, p2.y, p3.y, t) })
    }
  }
  out.push(pts[pts.length - 1])
  return out
}

const round3 = (v: number) => Math.round(v * 1000) / 1000

/** `n` points spread evenly (by arc length) from the first to the last control point. */
export function layoutPath(points: [number, number][], n: number): Point[] {
  const dense = samplePath(points)
  const cum = [0]
  for (let i = 1; i < dense.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y))
  }
  const totalLen = cum[cum.length - 1]
  const out: Point[] = []
  let j = 0
  for (let k = 0; k < n; k++) {
    const target = n === 1 ? 0 : (totalLen * k) / (n - 1)
    while (j < cum.length - 2 && cum[j + 1] < target) j++
    const segLen = cum[j + 1] - cum[j] || 1
    const t = Math.min(1, Math.max(0, (target - cum[j]) / segLen))
    out.push({
      x: round3(dense[j].x + (dense[j + 1].x - dense[j].x) * t),
      y: round3(dense[j].y + (dense[j + 1].y - dense[j].y) * t),
    })
  }
  return out
}
