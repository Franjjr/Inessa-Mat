/* Model digits in Spanish school stroke order ("grafía escolar"), as polylines in a 100 × 140 box.
   Used by TraceDigit (dotted guide, start dots, arrows, scoring), CalibrationFlow (model to copy) and the
   gallery/test fixtures (synthetic handwriting). */

export interface ModelPoint { x: number; y: number }
export type ModelStroke = ModelPoint[]

export const MODEL_W = 100
export const MODEL_H = 140

const rad = (deg: number) => (deg * Math.PI) / 180

function line(x1: number, y1: number, x2: number, y2: number, n = 14): ModelPoint[] {
  return Array.from({ length: n + 1 }, (_, i) => ({ x: x1 + ((x2 - x1) * i) / n, y: y1 + ((y2 - y1) * i) / n }))
}

/** Elliptical arc; angles in degrees, 0 = east, increasing = clockwise on screen (y grows downwards). */
function arc(cx: number, cy: number, rx: number, ry: number, fromDeg: number, toDeg: number, n?: number): ModelPoint[] {
  const steps = n ?? Math.max(8, Math.round(Math.abs(toDeg - fromDeg) / 9))
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = rad(fromDeg + ((toDeg - fromDeg) * i) / steps)
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }
  })
}

function quad(p0: ModelPoint, c: ModelPoint, p1: ModelPoint, n = 16): ModelPoint[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    const u = 1 - t
    return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y }
  })
}

/** Joins pieces into one stroke, dropping duplicated joints. */
function join(...parts: ModelPoint[][]): ModelStroke {
  const out: ModelPoint[] = []
  for (const part of parts) {
    for (const p of part) {
      const last = out[out.length - 1]
      if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 0.5) out.push(p)
    }
  }
  return out
}

export const DIGIT_MODELS: Record<number, ModelStroke[]> = {
  // Empieza arriba y da la vuelta hacia la izquierda.
  0: [arc(50, 70, 31, 56, -90, -450, 44)],
  // Sube en diagonal y baja recto.
  1: [join(line(30, 44, 60, 12, 10), line(60, 12, 60, 130, 18))],
  // Curva hacia la derecha, baja en diagonal y raya recta.
  2: [join(arc(50, 45, 29, 30, 200, 382, 22), line(77.4, 55.3, 20, 128, 16), line(20, 128, 84, 128, 12))],
  // Dos barriguitas hacia la derecha.
  3: [join(arc(48, 39, 26, 25, 205, 472, 28), arc(48, 97, 31, 31, 250, 500, 26))],
  // Baja en diagonal y ve a la derecha; luego un palito de arriba abajo.
  4: [join(line(58, 12, 18, 92, 16), line(18, 92, 86, 92, 12)), line(66, 40, 66, 130, 16)],
  // Palito hacia abajo, barriguita y, al final, el sombrero.
  5: [join(line(31, 14, 27, 64, 10), quad({ x: 27, y: 64 }, { x: 40, y: 56 }, { x: 52, y: 61 }, 6), arc(50, 94, 30, 33, 268, 495, 26)), line(31, 14, 80, 14, 10)],
  // Baja con una curva y cierra el círculo.
  6: [join(quad({ x: 74, y: 16 }, { x: 24, y: 30 }, { x: 22, y: 100 }, 18), arc(50, 100, 28, 29, 180, -175, 40))],
  // Raya hacia la derecha y baja en diagonal; después, la rayita del medio.
  7: [join(line(18, 16, 84, 16, 12), line(84, 16, 40, 130, 18)), line(46, 74, 80, 74, 8)],
  // Haz una S y sube para cerrar.
  8: [join(arc(50, 40, 23, 26, -40, -270, 24), arc(50, 97, 29, 31, -90, 270, 40), arc(50, 40, 23, 26, 90, -40, 14))],
  // Un círculo hacia la izquierda y un palito hacia abajo.
  9: [join(arc(50, 43, 26, 29, -12, -360, 36), line(76, 43, 73, 130, 16))],
}

/** Spanish instructions (child-facing) for each model digit. */
export const DIGIT_TIPS: Record<number, string> = {
  0: 'Empieza arriba y da la vuelta hacia la izquierda.',
  1: 'Sube en diagonal y baja recto.',
  2: 'Curva hacia la derecha, baja en diagonal y haz una raya.',
  3: 'Dos barriguitas hacia la derecha.',
  4: 'Baja en diagonal y ve a la derecha. Luego, un palito hacia abajo.',
  5: 'Palito hacia abajo, barriguita y, al final, el sombrero.',
  6: 'Baja con una curva y cierra el círculo.',
  7: 'Raya hacia la derecha y baja en diagonal. Después, la rayita.',
  8: 'Haz una S y sube para cerrarla.',
  9: 'Un círculo hacia la izquierda y un palito hacia abajo.',
}

export function modelPathLength(stroke: ModelStroke): number {
  let len = 0
  for (let i = 1; i < stroke.length; i++) len += Math.hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y)
  return len
}

/** Point and direction (unit vector) at a fraction of a stroke's length. */
export function pointAt(stroke: ModelStroke, frac: number): { x: number; y: number; dx: number; dy: number } {
  const total = modelPathLength(stroke)
  let target = Math.max(0, Math.min(1, frac)) * total
  for (let i = 1; i < stroke.length; i++) {
    const a = stroke[i - 1]
    const b = stroke[i]
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (target <= seg || i === stroke.length - 1) {
      const t = seg ? Math.min(1, target / seg) : 0
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: seg ? (b.x - a.x) / seg : 1, dy: seg ? (b.y - a.y) / seg : 0 }
    }
    target -= seg
  }
  const p = stroke[0]
  return { x: p.x, y: p.y, dx: 1, dy: 0 }
}

/** Resamples a stroke to points every `spacing` units (for scoring). */
export function resample(stroke: ModelStroke, spacing: number): ModelPoint[] {
  const total = modelPathLength(stroke)
  const n = Math.max(2, Math.ceil(total / spacing))
  return Array.from({ length: n + 1 }, (_, i) => { const p = pointAt(stroke, i / n); return { x: p.x, y: p.y } })
}

/** Smooth SVG path (quadratic midpoints, like the canvas renderer). */
export function svgPath(stroke: ModelStroke, scale = 1, dx = 0, dy = 0): string {
  const pts = stroke.map((p) => ({ x: p.x * scale + dx, y: p.y * scale + dy }))
  if (!pts.length) return ''
  const f = (n: number) => n.toFixed(1)
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2
    const my = (pts[i].y + pts[i + 1].y) / 2
    d += ` Q${f(pts[i].x)} ${f(pts[i].y)} ${f(mx)} ${f(my)}`
  }
  const last = pts[pts.length - 1]
  d += ` L${f(last.x)} ${f(last.y)}`
  return d
}
