/* Geometría (3.º de Primaria, block E; docs/curriculum/PLAN_DOCENTE.md §1.10 and §5.11). Polygons (names, sides and
   corners, in any orientation and irregular), lines (recta, curva, poligonal; paralelas, perpendiculares), angles
   (recto, menor, mayor; the right angles tapped in a figure), circle vs circunferencia, simple solids (names, rolling,
   flat faces) and perimeter by adding the sides (drawing first, then a garden problem).
   Figures are data (src/types/exercise.ts); src/activities/views/FigureSvg.tsx draws them. Hints never state the answer.
   Pure: no React. */
import type {
  AngleTapExercise, Answer, AngleFigure, AreaExercise, GridFigure, CheckResult, CircleFigure, ErrorType, Hint, LineFigure, LinesFigure, PerimeterExercise,
  PolygonFigure, Rng, ShapeChoiceExercise, ShapeCountExercise, SolidFigure, SolidName,
} from '@/types'
import { pick, randInt, shuffle } from './rng'
import { geoSkill, type GeoOp } from './skills'

// ---------------------------------------------------------------- polygons

export type PolygonName = 'triangle' | 'square' | 'rectangle' | 'pentagon' | 'hexagon'
export const POLYGON_NAMES: PolygonName[] = ['triangle', 'square', 'rectangle', 'pentagon', 'hexagon']
export const POLYGON_WORD: Record<PolygonName, string> = {
  triangle: 'triángulo', square: 'cuadrado', rectangle: 'rectángulo', pentagon: 'pentágono', hexagon: 'hexágono',
}
export const POLYGON_SIDES: Record<PolygonName, number> = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 }

const round2 = (n: number) => Math.round(n * 100) / 100

/** Turns the points around the origin by deg (rounded to hundredths). */
export function rotatePoints(points: [number, number][], deg: number): [number, number][] {
  const t = (deg * Math.PI) / 180
  const c = Math.cos(t)
  const s = Math.sin(t)
  return points.map(([x, y]) => [round2(x * c - y * s), round2(x * s + y * c)])
}

/** Length of each side: side i joins point i and point i + 1. */
export function sideLengths(points: readonly [number, number][]): number[] {
  return points.map((p, i) => {
    const q = points[(i + 1) % points.length]
    return Math.hypot(q[0] - p[0], q[1] - p[1])
  })
}

/** True when every turn goes the same way (a convex polygon with no straight corners). */
export function isConvex(points: readonly [number, number][]): boolean {
  const n = points.length
  let sign = 0
  for (let i = 0; i < n; i++) {
    const a = points[i]
    const b = points[(i + 1) % n]
    const c = points[(i + 2) % n]
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
    if (Math.abs(cross) < 1e-9) return false
    const s = Math.sign(cross)
    if (sign === 0) sign = s
    else if (s !== sign) return false
  }
  return sign !== 0
}

/** The dot product of the two sides that meet at corner p, from a to p and from p to b (zero = right angle). */
export const cornerDot = (a: [number, number], p: [number, number], b: [number, number]) =>
  (a[0] - p[0]) * (b[0] - p[0]) + (a[1] - p[1]) * (b[1] - p[1])

/** Indexes of the corners whose inside angle is exactly a right angle: the two sides are perpendicular (dot product 0)
    and the corner turns the way the polygon turns (a concave corner of 270° is not a right angle). Exact coordinates. */
export function rightCorners(points: readonly [number, number][]): number[] {
  const out: number[] = []
  const n = points.length
  let area = 0
  for (let i = 0; i < n; i++) {
    const a = points[i]
    const b = points[(i + 1) % n]
    area += a[0] * b[1] - b[0] * a[1]
  }
  const orientation = Math.sign(area)
  for (let i = 0; i < n; i++) {
    const p = points[i]
    const prev = points[(i - 1 + n) % n]
    const next = points[(i + 1) % n]
    const dot = cornerDot(prev, p, next)
    const turn = (p[0] - prev[0]) * (next[1] - p[1]) - (p[1] - prev[1]) * (next[0] - p[0])
    if (dot === 0 && Math.sign(turn) === orientation) out.push(i)
  }
  return out
}

/** A polygon of the given kind: random size, random orientation, and irregular when it can be (the child must not learn
    only the textbook pose). Always convex. */
export function polygonPoints(name: PolygonName, rng: Rng): [number, number][] {
  const n = POLYGON_SIDES[name]
  for (let attempt = 0; attempt < 300; attempt++) {
    let pts: [number, number][]
    if (name === 'triangle') {
      const a = 50 + rng() * 110
      const b = 50 + rng() * 110
      if (360 - a - b < 50) continue
      const angles = [0, a, a + b]
      pts = angles.map((t) => {
        const r = 0.7 + rng() * 0.3
        return [Math.cos((t * Math.PI) / 180) * r, Math.sin((t * Math.PI) / 180) * r] as [number, number]
      })
    } else if (name === 'square') {
      pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    } else if (name === 'rectangle') {
      // width 2 and a height of 0.5 to 0.7: always clearly longer one way (never a square).
      const h = pick(rng, [0.5, 0.6, 0.7])
      pts = [[-1, -h / 2], [1, -h / 2], [1, h / 2], [-1, h / 2]]
    } else {
      const step = 360 / n
      pts = Array.from({ length: n }, (_, i) => {
        const t = ((i * step + (rng() - 0.5) * step * 0.3) * Math.PI) / 180
        const r = 0.85 + rng() * 0.15
        return [Math.cos(t) * r, Math.sin(t) * r] as [number, number]
      })
    }
    const scaled = pts.map(([x, y]) => [x * 40, y * 40] as [number, number])
    const turned = rotatePoints(scaled, rng() * 360)
    if (turned.length === n && isConvex(turned)) return turned
  }
  throw new Error(`geometry: no convex ${name} could be built`)
}

/** The polygon figure of a kind, drawn in free coordinates. */
export function polygonFigure(name: PolygonName, rng: Rng): PolygonFigure {
  return { type: 'polygon', points: polygonPoints(name, rng) }
}

// ---------------------------------------------------------------- shared helpers

const DIFFICULTY_GEO = 2
const wrongShape = (expected: string): CheckResult => ({ correct: false, given: '', expected, errorType: 'other', feedback: '¿Me lo escribes otra vez?' })
const hint = (level: 1 | 2 | 3, text: string): Hint => ({ level, text, visual: 'none' })

/** Options: the right answer and three others, shuffled. Returns the options and the index of the right one. */
function optionsWith(rng: Rng, right: string, others: string[]): { options: string[]; answer: number } {
  const distinct = [...new Set(others.filter((o) => o !== right))].slice(0, 3)
  const options = shuffle(rng, [right, ...distinct])
  return { options, answer: options.indexOf(right) }
}

// ---------------------------------------------------------------- polygon names and counts

/** «¿Qué figura es?»: the name of a polygon (triángulo, cuadrado, rectángulo, pentágono, hexágono). */
export function genPolygonName(rng: Rng): ShapeChoiceExercise {
  const name = pick(rng, POLYGON_NAMES)
  const figure = polygonFigure(name, rng)
  const right = POLYGON_WORD[name]
  const others = shuffle(rng, POLYGON_NAMES.filter((x) => x !== name)).map((x) => POLYGON_WORD[x])
  const { options, answer } = optionsWith(rng, right, others)
  const quad = POLYGON_SIDES[name] === 4
  return {
    id: `shape-choice:poly-name:${name}:${figure.points.map((p) => p.join(',')).join(';')}`,
    kind: 'shape-choice', skill: geoSkill('poly:name'), difficulty: DIFFICULTY_GEO,
    question: '¿Qué figura es?', figures: [figure], options, answer,
    hints: [
      'Cuenta los lados tocándolos con el dedo, uno a uno.',
      quad
        ? 'Con cuatro lados, mira si son todos iguales o si dos son más largos que los otros dos.'
        : 'Mira si todos los lados son iguales o si alguno es más largo que los demás.',
      'Triángulo: 3 lados. Cuadrado y rectángulo: 4. Pentágono: 5. Hexágono: 6. Con 4 lados, el cuadrado tiene los cuatro iguales.',
    ],
  }
}

/** «¿Cuántos lados tiene?» (or esquinas: the same number). */
export function genPolygonSides(rng: Rng): ShapeCountExercise {
  const name = pick(rng, POLYGON_NAMES)
  const figure = polygonFigure(name, rng)
  return {
    id: `shape-count:${name}:${figure.points.map((p) => p.join(',')).join(';')}`,
    kind: 'shape-count', skill: geoSkill('poly:sides'), difficulty: DIFFICULTY_GEO,
    figure, ask: pick(rng, ['sides', 'vertices'] as const), answer: POLYGON_SIDES[name],
  }
}

// ---------------------------------------------------------------- lines and angles

/** «¿Qué tipo de línea es?»: recta, curva or poligonal. */
export function genLineType(rng: Rng): ShapeChoiceExercise {
  const kind = pick(rng, ['straight', 'curve', 'broken'] as const)
  let points: [number, number][]
  if (kind === 'straight') {
    points = [[randInt(rng, 6, 14), randInt(rng, 15, 85)], [randInt(rng, 86, 94), randInt(rng, 15, 85)]]
  } else if (kind === 'curve') {
    points = [[randInt(rng, 6, 12), randInt(rng, 70, 90)], [randInt(rng, 44, 56), randInt(rng, 0, 8)], [randInt(rng, 88, 94), randInt(rng, 70, 90)]]
  } else {
    points = [[randInt(rng, 6, 12), randInt(rng, 60, 80)], [randInt(rng, 26, 34), randInt(rng, 10, 25)], [randInt(rng, 50, 60), randInt(rng, 70, 85)], [randInt(rng, 86, 94), randInt(rng, 10, 30)]]
  }
  const figure: LineFigure = { type: 'line', kind, points }
  const right = { straight: 'recta', curve: 'curva', broken: 'poligonal' }[kind]
  const { options, answer } = optionsWith(rng, right, ['recta', 'curva', 'poligonal'])
  return {
    id: `shape-choice:line-type:${kind}:${points.map((p) => p.join(',')).join(';')}`,
    kind: 'shape-choice', skill: geoSkill('line:type'), difficulty: DIFFICULTY_GEO,
    question: '¿Qué tipo de línea es?', figures: [figure], options, answer,
    hints: [
      'Mira si la línea tiene esquinas, si se dobla o si va siempre derecha.',
      'Una línea poligonal está hecha de rectas unidas: se ven las esquinas.',
      'Una recta no se dobla. Una curva se dobla sin esquinas. Una poligonal tiene esquinas y trozos rectos.',
    ],
  }
}

/** «¿Cómo son estas dos rectas?»: paralelas (never meet), perpendiculares (a right-angle cross) or they cross otherwise. */
export function genLineRelation(rng: Rng): ShapeChoiceExercise {
  const rel = pick(rng, ['paralelas', 'perpendiculares', 'se cruzan'] as const)
  let segments: [[number, number], [number, number]][]
  if (rel === 'paralelas') {
    const y = randInt(rng, 22, 36)
    const gap = randInt(rng, 24, 34)
    segments = [[[10, y], [90, y]], [[10, y + gap], [90, y + gap]]]
  } else if (rel === 'perpendiculares') {
    const x = randInt(rng, 40, 60)
    segments = [[[10, 50], [90, 50]], [[x, 14], [x, 86]]]
  } else {
    const x1 = randInt(rng, 20, 40)
    const x2 = randInt(rng, 60, 80)
    segments = [[[10, 50], [90, 50]], [[x1, 14], [x2, 86]]]
  }
  const theta = randInt(rng, 0, 359)
  const turned = segments.map((seg) => rotatePoints(seg, theta) as [[number, number], [number, number]]) as [[number, number], [number, number]][]
  const figure: LinesFigure = { type: 'lines', segments: turned }
  const { options, answer } = optionsWith(rng, rel, ['paralelas', 'perpendiculares', 'se cruzan'])
  return {
    id: `shape-choice:line-rel:${rel}:${theta}:${segments.map((s) => s.flat().join(',')).join(';')}`,
    kind: 'shape-choice', skill: geoSkill('line:rel'), difficulty: DIFFICULTY_GEO + 1,
    question: '¿Cómo son estas dos rectas?', figures: [figure], options, answer,
    hints: [
      'Imagina que las dos rectas se alargan sin fin: ¿llegan a tocarse en algún punto?',
      'Si se cruzan formando una esquina recta, como la cruz de sumar, son perpendiculares.',
      'Si nunca se cruzan y siempre están a la misma distancia, son paralelas. Si se cruzan de otra forma, se cruzan.',
    ],
  }
}

/** «¿Este ángulo es recto, menor o mayor que un recto?» */
export function genAngleType(rng: Rng): ShapeChoiceExercise {
  const cls = pick(rng, ['recto', 'menor', 'mayor'] as const)
  const deg = cls === 'recto' ? 90 : cls === 'menor' ? randInt(rng, 25, 75) : randInt(rng, 105, 155)
  const figure: AngleFigure = { type: 'angle', deg, rotation: randInt(rng, 0, 359) }
  const words = { recto: 'recto', menor: 'menor que un recto', mayor: 'mayor que un recto' } as const
  const { options, answer } = optionsWith(rng, words[cls], ['recto', 'menor que un recto', 'mayor que un recto'])
  return {
    id: `shape-choice:angle-type:${deg}:${figure.rotation}`,
    kind: 'shape-choice', skill: geoSkill('angle:type'), difficulty: DIFFICULTY_GEO,
    question: '¿Este ángulo es recto, menor o mayor que un recto?', figures: [figure], options, answer,
    hints: [
      'Compara el ángulo con la esquina de una hoja de papel: ¿encaja justo, o se abre más, o se abre menos?',
      'Si las dos líneas se abren más que la esquina del papel, el ángulo se abre más que ella.',
      'Si se abren menos que la esquina del papel, el ángulo se cierra más que ella.',
    ],
  }
}

/** «Toca las esquinas que son ángulos rectos»: rectangles, right triangles, L-shapes and oblique triangles. */
export function genAngleTap(rng: Rng): AngleTapExercise {
  for (let attempt = 0; attempt < 100; attempt++) {
    const kind = pick(rng, ['rect', 'right-triangle', 'l-shape', 'oblique'] as const)
    let pts: [number, number][]
    if (kind === 'rect') {
      const a = randInt(rng, 3, 9)
      const b = randInt(rng, 2, 8)
      if (a === b) continue
      pts = [[0, 0], [a, 0], [a, b], [0, b]]
    } else if (kind === 'right-triangle') {
      pts = [[0, 0], [randInt(rng, 3, 9), 0], [0, randInt(rng, 3, 8)]]
    } else if (kind === 'l-shape') {
      const W = randInt(rng, 4, 10)
      const H = randInt(rng, 4, 10)
      const cw = randInt(rng, 1, W - 2)
      const ch = randInt(rng, 1, H - 2)
      pts = [[0, 0], [W, 0], [W, H - ch], [W - cw, H - ch], [W - cw, H], [0, H]]
    } else {
      const a = randInt(rng, 4, 9)
      const x = randInt(rng, 1, a - 1)
      pts = [[0, 0], [a, 0], [x, randInt(rng, 3, 8)]]
    }
    const right = rightCorners(pts)
    if (kind === 'oblique' && right.length > 0) continue
    const turned = rotatePoints(pts.map(([x, y]) => [x * 12, y * 12] as [number, number]), randInt(rng, 0, 359))
    return {
      id: `angle-tap:${kind}:${turned.map((p) => p.join(',')).join(';')}`,
      kind: 'angle-tap', skill: geoSkill('angle:tap'), difficulty: DIFFICULTY_GEO + 1,
      figure: { type: 'polygon', points: turned }, rightCorners: right,
    }
  }
  throw new Error('geometry: no angle figure could be built')
}

// ---------------------------------------------------------------- circle and solids

/** «¿Es un círculo o una circunferencia?»: the line that goes round (circunferencia) or the whole surface (círculo). */
export function genCircle(rng: Rng): ShapeChoiceExercise {
  const filled = rng() < 0.5
  const figure: CircleFigure = { type: 'circle', filled }
  const right = filled ? 'círculo' : 'circunferencia'
  const { options, answer } = optionsWith(rng, right, ['círculo', 'circunferencia'])
  return {
    id: `shape-choice:circle:${filled ? 'd' : 'l'}`,
    kind: 'shape-choice', skill: geoSkill('circle'), difficulty: DIFFICULTY_GEO,
    question: '¿Es un círculo o una circunferencia?', figures: [figure], options, answer,
    hints: [
      'Mira si la figura está pintada por dentro o si solo tiene la línea del borde.',
      'Piensa en dos cosas distintas: la línea que rodea, sin relleno, y toda la superficie de dentro.',
      'La circunferencia es solo la línea que rodea la figura. El círculo es toda la superficie de dentro, con su borde.',
    ],
  }
}

export const SOLID_WORD: Record<SolidName, string> = {
  cubo: 'cubo', prisma: 'prisma', piramide: 'pirámide', cilindro: 'cilindro', cono: 'cono', esfera: 'esfera',
}
/** Flat faces («caras planas») of the solids a 3.º child meets; null = not asked (curved surfaces). */
export const SOLID_FLAT_FACES: Partial<Record<SolidName, number>> = { cubo: 6, prisma: 5, piramide: 5 }
/** Whether the solid rolls on a flat table (its curved part lets it roll). */
export const SOLID_ROLLS: Record<SolidName, boolean> = { cubo: false, prisma: false, piramide: false, cilindro: true, cono: true, esfera: true }

const SOLID_HINT_NAME = [
  'Mira si tiene caras planas, partes redondas o las dos cosas.',
  'Una esfera no tiene caras ni esquinas: es como una pelota.',
  'Cubo: caras cuadradas. Prisma: dos caras iguales y caras de lados. Pirámide: una punta y caras triangulares. Cilindro: dos tapas redondas. Cono: una punta y una base redonda.',
]

/** «¿Qué cuerpo es?» */
export function genSolidName(rng: Rng): ShapeChoiceExercise {
  const solid = pick(rng, ['cubo', 'prisma', 'piramide', 'cilindro', 'cono', 'esfera'] as SolidName[])
  const figure: SolidFigure = { type: 'solid', name: solid }
  const { options, answer } = optionsWith(rng, SOLID_WORD[solid], shuffle(rng, Object.values(SOLID_WORD)))
  return {
    id: `shape-choice:solid-name:${solid}`,
    kind: 'shape-choice', skill: geoSkill('solid:name'), difficulty: DIFFICULTY_GEO,
    question: '¿Qué cuerpo es?', figures: [figure], options, answer, hints: [...SOLID_HINT_NAME] as [string, string, string],
  }
}

/** «¿Rueda?»: a sphere and a cylinder roll; a cube, a prism and a pyramid do not. */
export function genSolidRoll(rng: Rng): ShapeChoiceExercise {
  const solid = pick(rng, ['cubo', 'prisma', 'piramide', 'cilindro', 'esfera'] as SolidName[])
  const figure: SolidFigure = { type: 'solid', name: solid }
  const right = SOLID_ROLLS[solid] ? 'Sí, rueda' : 'No, no rueda'
  const { options, answer } = optionsWith(rng, right, ['Sí, rueda', 'No, no rueda'])
  return {
    id: `shape-choice:solid-roll:${solid}`,
    kind: 'shape-choice', skill: geoSkill('solid:roll'), difficulty: DIFFICULTY_GEO,
    question: '¿Rueda este cuerpo si lo empujas?', figures: [figure], options, answer,
    hints: [
      'Imagina que lo pones en una mesa inclinada: ¿se queda quieto o se va rodando?',
      'Las partes redondas ruedan. Las caras planas se quedan quietas sobre la mesa.',
      'Si tiene una superficie curva por donde se desliza, rueda. Si solo tiene caras planas y esquinas, no.',
    ],
  }
}

/** «¿Cuántas caras planas tiene?» for the solids with flat faces only. */
export function genSolidFaces(rng: Rng): ShapeChoiceExercise {
  const solid = pick(rng, Object.keys(SOLID_FLAT_FACES) as SolidName[])
  const count = SOLID_FLAT_FACES[solid] as number
  const figure: SolidFigure = { type: 'solid', name: solid }
  const others = shuffle(rng, [4, 5, 6, 7, 8].filter((x) => x !== count)).map(String)
  const { options, answer } = optionsWith(rng, String(count), others)
  return {
    id: `shape-choice:solid-faces:${solid}`,
    kind: 'shape-choice', skill: geoSkill('solid:faces'), difficulty: DIFFICULTY_GEO + 1,
    question: '¿Cuántas caras planas tiene?', figures: [figure], options, answer,
    hints: [
      'Cuenta las caras una a una: la de arriba, la de abajo y las de los lados.',
      'Imagina que el cuerpo está apoyado sobre una cara: ¿cuántas caras planas ves en total?',
      'Un cubo tiene caras cuadradas por todas partes. Un prisma tiene dos bases iguales y caras de lado. Una pirámide tiene su base y las caras que llegan a la punta.',
    ],
  }
}

// ---------------------------------------------------------------- rectas, ángulos, triángulos, cuadriláteros, circunferencia, traslación, cuerpos (3.º y 4.º)
// Level-3 hints never reuse the asked case: they show a worked example of another one, without naming the right option.

/** «¿Qué es esta línea?»: a recta has arrows at both ends, a semirrecta a dot and an arrow, a segmento a dot at each end. */
export function genLineKind(rng: Rng): ShapeChoiceExercise {
  const kind = pick(rng, ['straight', 'ray', 'segment'] as const)
  const points: [number, number][] = [[randInt(rng, 10, 26), randInt(rng, 25, 75)], [randInt(rng, 74, 90), randInt(rng, 25, 75)]]
  const figure: LineFigure = { type: 'line', kind, points }
  const right = { straight: 'recta', ray: 'semirrecta', segment: 'segmento' }[kind]
  const { options, answer } = optionsWith(rng, right, ['recta', 'semirrecta', 'segmento'])
  const example = {
    straight: 'Ejemplo: un punto en un extremo y una flecha en el otro: la línea empieza en el punto y sigue sin fin por ese lado.',
    ray: 'Ejemplo: dos puntos, uno en cada extremo: la línea se acaba en los dos lados.',
    segment: 'Ejemplo: dos flechas, una en cada extremo: la línea sigue sin fin por los dos lados.',
  }[kind]
  return {
    id: `shape-choice:line-kind:${kind}:${points.map((p) => p.join(',')).join(';')}`,
    kind: 'shape-choice', skill: geoSkill('line:kind'), difficulty: DIFFICULTY_GEO,
    question: '¿Qué es esta línea?', figures: [figure], options, answer,
    hints: [
      'Mira los dos extremos de la línea: ¿acaban en un punto, en una flecha o en las dos cosas?',
      'Un punto marca dónde se acaba la línea. Una flecha dice que sigue sin fin por ese lado.',
      example,
    ],
  }
}

/** «¿Este ángulo es agudo, recto u obtuso?»: agudo is under 90°, recto is 90°, obtuso is from 91° to 179°. */
export function genAngleClass(rng: Rng): ShapeChoiceExercise {
  const cls = pick(rng, ['agudo', 'recto', 'obtuso'] as const)
  const deg = cls === 'recto' ? 90 : cls === 'agudo' ? randInt(rng, 20, 80) : randInt(rng, 100, 160)
  const figure: AngleFigure = { type: 'angle', deg, rotation: randInt(rng, 0, 359) }
  const { options, answer } = optionsWith(rng, cls, ['agudo', 'recto', 'obtuso'])
  const example = {
    agudo: 'Ejemplo: si encaja justo en la esquina del papel, sin que sobre ni falte, no se abre ni se cierra.',
    recto: 'Ejemplo: si se abre mucho más que la esquina del papel, se queda muy abierto.',
    obtuso: 'Ejemplo: si se cierra más que la esquina del papel, parece la punta de un lápiz.',
  }[cls]
  return {
    id: `shape-choice:angle-class:${deg}:${figure.rotation}`,
    kind: 'shape-choice', skill: geoSkill('angle:class'), difficulty: DIFFICULTY_GEO + 1,
    question: '¿Este ángulo es agudo, recto u obtuso?', figures: [figure], options, answer,
    hints: [
      'Compara el ángulo con la esquina de una hoja de papel: ¿encaja justo, se abre más o se cierra más?',
      'Si se abre más que la esquina del papel, es de los muy abiertos; si se cierra más, es de los que apenas se abren.',
      example,
    ],
  }
}


/** «¿Cómo son los lados de este triángulo?»: equilátero (3 equal), isósceles (2 equal), escaleno (none), with the lengths written. */
export function genTriSides(rng: Rng): ShapeChoiceExercise {
  const kind = pick(rng, ['equilátero', 'isósceles', 'escaleno'] as const)
  let sides: [number, number, number] | null = null
  for (let attempt = 0; attempt < 500 && !sides; attempt++) {
    if (kind === 'equilátero') {
      const s = randInt(rng, 3, 9)
      sides = [s, s, s]
    } else if (kind === 'isósceles') {
      const e = randInt(rng, 3, 9)
      const base = randInt(rng, 2, 12)
      if (base !== e && base < 2 * e) sides = [e, e, base]
    } else {
      const x = randInt(rng, 3, 12)
      const y = randInt(rng, 3, 12)
      const z = randInt(rng, 3, 12)
      const longest = Math.max(x, y, z)
      if (x !== y && y !== z && x !== z && longest < x + y + z - longest) sides = [x, y, z]
    }
  }
  if (!sides) throw new Error('geometry: no triangle could be built')
  // Corners A (0,0), B (c,0) and C; a = BC, b = CA, c = AB. Side i of the drawing joins point i and i + 1.
  const [a, b, c] = shuffle(rng, sides)
  const x = (b * b + c * c - a * a) / (2 * c)
  const y = Math.sqrt(b * b - x * x)
  const points = rotatePoints([[0, 0], [c, 0], [x, y]], randInt(rng, 0, 359))
  const figure: PolygonFigure = { type: 'polygon', points, labels: [`${c} cm`, `${a} cm`, `${b} cm`] }
  const { options, answer } = optionsWith(rng, kind, ['equilátero', 'isósceles', 'escaleno'])
  return {
    id: `shape-choice:tri-sides:${kind}:${a},${b},${c}`,
    kind: 'shape-choice', skill: geoSkill('tri:sides'), difficulty: DIFFICULTY_GEO + 1,
    question: '¿Cómo son los lados de este triángulo?', figures: [figure], options, answer,
    hints: [
      'Lee las tres medidas escritas en el triángulo, una a una.',
      'Compara las medidas de dos en dos y anota cuántos pares son iguales.',
      kind === 'equilátero' ? 'Ejemplo: 3 cm, 5 cm y 6 cm: ninguna medida se repite.' : 'Ejemplo: 4 cm, 4 cm y 4 cm: las tres medidas coinciden.',
    ],
  }
}

/** «¿Cómo son los ángulos de este triángulo?»: acutángulo (three corners narrower than a paper corner), rectángulo (one
    exactly that corner), obtusángulo (one wider). Whole-number corners, so the kind is exact. */
export function genTriAngles(rng: Rng): ShapeChoiceExercise {
  const kind = pick(rng, ['acutángulo', 'rectángulo', 'obtusángulo'] as const)
  for (let attempt = 0; attempt < 5000; attempt++) {
    const p = Array.from({ length: 3 }, () => [randInt(rng, 0, 10), randInt(rng, 0, 8)] as [number, number])
    const cross = (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[1][1] - p[0][1]) * (p[2][0] - p[0][0])
    if (cross === 0) continue
    const dots = p.map((v, i) => cornerDot(p[(i + 1) % 3], v, p[(i + 2) % 3]))
    const lens = sideLengths(p)
    if (lens.some((l) => l < 3)) continue
    // A corner close to a right angle but not one would be read by eye as one: keep the others well away from 90°.
    const cosines = p.map((_, i) => dots[i] / (lens[i] * lens[(i + 2) % 3]))
    if (cosines.some((c) => c !== 0 && Math.abs(c) < 0.2)) continue
    const actual = dots.some((d) => d < 0) ? 'obtusángulo' : dots.filter((d) => d === 0).length === 1 ? 'rectángulo' : 'acutángulo'
    if (actual !== kind) continue
    const figure: PolygonFigure = { type: 'polygon', points: p }
    const { options, answer } = optionsWith(rng, kind, ['acutángulo', 'rectángulo', 'obtusángulo'])
    const example = {
      acutángulo: 'Ejemplo: un triángulo con una esquina que se abre mucho más que la del papel: esa sola esquina decide.',
      rectángulo: 'Ejemplo: si las tres esquinas se cierran más que la del papel, ninguna encaja con ella.',
      obtusángulo: 'Ejemplo: una esquina que encaja justo en la del papel y otras dos que se cierran más.',
    }[kind]
    return {
      id: `shape-choice:tri-angles:${kind}:${p.map((v) => v.join(',')).join(';')}`,
      kind: 'shape-choice', skill: geoSkill('tri:angles'), difficulty: DIFFICULTY_GEO + 1,
      question: '¿Cómo son los ángulos de este triángulo?', figures: [figure], options, answer,
      hints: [
        'Compara cada esquina con la esquina de una hoja de papel: ¿encaja justo, se abre más o se cierra más?',
        'Busca primero las esquinas que encajan justo en la del papel. Luego mira si alguna se abre más que la del papel: eso cambia la clase.',
        example,
      ],
    }
  }
  throw new Error('geometry: no triangle of the angle kind could be built')
}

/** Level-3 example per asked quadrilateral: it describes another one, never the asked one's defining feature. */
const QUAD_EXAMPLE: Record<'cuadrado' | 'rectángulo' | 'rombo' | 'romboide' | 'trapecio', string> = {
  cuadrado: 'Ejemplo: solo un par de lados va en la misma dirección y los otros dos no.',
  rectángulo: 'Ejemplo: cuatro lados iguales, pero ninguna esquina como la del papel.',
  rombo: 'Ejemplo: cuatro esquinas como la del papel, y dos lados más largos que los otros dos.',
  romboide: 'Ejemplo: cuatro lados iguales y cuatro esquinas como la del papel.',
  trapecio: 'Ejemplo: cuatro lados iguales y cuatro esquinas como la del papel.',
}

/** «¿Qué cuadrilátero es?»: cuadrado, rectángulo, rombo, romboide or trapecio, by its sides and its corners. */
export function genQuadName(rng: Rng): ShapeChoiceExercise {
  const kind = pick(rng, ['cuadrado', 'rectángulo', 'rombo', 'romboide', 'trapecio'] as const)
  let base: [number, number][] = []
  if (kind === 'cuadrado') {
    const s = randInt(rng, 3, 7)
    base = [[0, 0], [s, 0], [s, s], [0, s]]
  } else if (kind === 'rectángulo') {
    // Two different sides: the lengths never match (5 to 9 against 2 to 4).
    const a = randInt(rng, 5, 9)
    const b = randInt(rng, 2, 4)
    base = [[0, 0], [a, 0], [a, b], [0, b]]
  } else if (kind === 'rombo') {
    // Equal sides from diagonals of different length: no right corner.
    const p = randInt(rng, 2, 6)
    let q = randInt(rng, 2, 6)
    if (q === p) q = p === 6 ? 5 : p + 1
    base = [[-p, 0], [0, -q], [p, 0], [0, q]]
  } else if (kind === 'romboide') {
    // A slanted parallelogram: the sides differ and no corner is square.
    let a = 0
    let h = 0
    let d = 0
    do {
      a = randInt(rng, 5, 9)
      h = randInt(rng, 2, 4)
      d = randInt(rng, 1, 3)
    } while (d * d + h * h === a * a)
    base = [[0, 0], [a, 0], [a + d, h], [d, h]]
  } else {
    // One pair of parallel sides (the bases differ) and two slanted sides.
    const a = randInt(rng, 6, 10)
    const t = randInt(rng, 3, a - 3)
    const d = randInt(rng, 1, a - t - 1)
    const h = randInt(rng, 2, 4)
    base = [[0, 0], [a, 0], [d + t, h], [d, h]]
  }
  const figure: PolygonFigure = { type: 'polygon', points: rotatePoints(base, randInt(rng, 0, 359)) }
  const { options, answer } = optionsWith(rng, kind, ['cuadrado', 'rectángulo', 'rombo', 'romboide', 'trapecio'])
  return {
    id: `shape-choice:quad-name:${kind}:${figure.points.map((p) => p.join(',')).join(';')}`,
    kind: 'shape-choice', skill: geoSkill('quad:name'), difficulty: DIFFICULTY_GEO + 1,
    question: '¿Qué cuadrilátero es?', figures: [figure], options, answer,
    hints: [
      'Mira los lados: ¿son todos iguales? ¿Hay dos pares de lados que van en la misma dirección?',
      'Fíjate en las esquinas: ¿son todas como la del papel? Y cuenta cuántos pares de lados nunca se cruzan.',
      QUAD_EXAMPLE[kind],
    ],
  }
}

/** «¿Qué es la línea roja?»: the radio, diámetro, cuerda or arco of a circunferencia, drawn in red. */
export function genCircleParts(rng: Rng): ShapeChoiceExercise {
  const part = pick(rng, ['radius', 'diameter', 'chord', 'arc'] as const)
  const figure: CircleFigure = { type: 'circle', filled: false, highlight: part, turn: randInt(rng, 0, 359) }
  const right = { radius: 'radio', diameter: 'diámetro', chord: 'cuerda', arc: 'arco' }[part]
  const { options, answer } = optionsWith(rng, right, ['radio', 'diámetro', 'cuerda', 'arco'])
  const example = {
    radius: 'Ejemplo: una línea de borde a borde que pasa por el centro: está hecha de dos trozos iguales.',
    diameter: 'Ejemplo: una línea que sale del centro y llega al borde.',
    chord: 'Ejemplo: un trozo de la línea que rodea el círculo, sin salirse de él.',
    arc: 'Ejemplo: una línea recta que une dos puntos del borde sin pasar por el centro.',
  }[part]
  return {
    id: `shape-choice:circle-parts:${part}:${figure.turn}`,
    kind: 'shape-choice', skill: geoSkill('circle:parts'), difficulty: DIFFICULTY_GEO + 1,
    question: '¿Qué es la línea roja?', figures: [figure], options, answer,
    hints: [
      'Busca el centro del círculo, el punto del medio. ¿La línea roja llega hasta él?',
      'Mira dónde acaban los extremos de la línea roja: en el borde, en el centro o en los dos. Y comprueba si la línea pasa por el centro.',
      example,
    ],
  }
}

const SHIFT_WORDS = { right: 'a la derecha', left: 'a la izquierda', up: 'hacia arriba', down: 'hacia abajo' } as const

/** «¿Cuántas casillas y hacia dónde se ha movido la figura de color?»: an outline and its copy, moved straight up, down,
    left or right by 1 to 4 squares (the copy is not turned). */
export function genTranslate(rng: Rng): ShapeChoiceExercise {
  const rows = 6
  const cols = 8
  for (let attempt = 0; attempt < 500; attempt++) {
    // A connected shape of 3 to 5 squares in a box of at most 3 × 3, from the top-left corner.
    const size = randInt(rng, 3, 5)
    const cells = new Set<string>(['0,0'])
    for (let tries = 0; cells.size < size && tries < 60; tries++) {
      const [r, c] = pick(rng, [...cells]).split(',').map(Number)
      const [dr, dc] = pick(rng, [[0, 1], [0, -1], [1, 0], [-1, 0]] as const)
      if (r + dr < 0 || c + dc < 0 || r + dr > 2 || c + dc > 2) continue
      cells.add(`${r + dr},${c + dc}`)
    }
    const shape = [...cells].map((s) => s.split(',').map(Number) as [number, number])
    const bh = Math.max(...shape.map((p) => p[0])) + 1
    const bw = Math.max(...shape.map((p) => p[1])) + 1
    const dir = pick(rng, ['right', 'left', 'up', 'down'] as const)
    const count = randInt(rng, 1, 4)
    const [dr, dc] = { right: [0, count], left: [0, -count], up: [-count, 0], down: [count, 0] }[dir]
    // The outline's top-left corner, so that both the outline and the copy stay on the grid.
    const r0Lo = Math.max(0, -dr)
    const r0Hi = Math.min(rows - bh, rows - bh - dr)
    const c0Lo = Math.max(0, -dc)
    const c0Hi = Math.min(cols - bw, cols - bw - dc)
    if (r0Lo > r0Hi || c0Lo > c0Hi) continue
    const r0 = randInt(rng, r0Lo, r0Hi)
    const c0 = randInt(rng, c0Lo, c0Hi)
    const ghost = shape.map(([r, c]) => [r0 + r, c0 + c] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1])
    const filled = shape.map(([r, c]) => [r0 + r + dr, c0 + c + dc] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1])
    const outline = new Set(ghost.map((p) => p.join(',')))
    if (filled.some((p) => outline.has(p.join(',')))) continue
    const figure: GridFigure = { type: 'grid', rows, cols, filled, ghost }
    const right = `${count} ${SHIFT_WORDS[dir]}`
    const all = (Object.keys(SHIFT_WORDS) as (keyof typeof SHIFT_WORDS)[]).flatMap((d) => [1, 2, 3, 4].map((n) => `${n} ${SHIFT_WORDS[d]}`))
    const { options, answer } = optionsWith(rng, right, shuffle(rng, all.filter((o) => o !== right)))
    // The worked example moves in the other direction of the pair (vertical when the asked move is horizontal).
    const example = dir === 'left' || dir === 'right'
      ? 'Ejemplo: si la copia está 2 filas más arriba que la figura de contorno, se ha movido 2 hacia arriba.'
      : 'Ejemplo: si la copia está 2 columnas a la izquierda de la figura de contorno, se ha movido 2 a la izquierda.'
    return {
      id: `shape-choice:translate:${dir}:${count}:${filled.map((p) => p.join(',')).join(';')}`,
      kind: 'shape-choice', skill: geoSkill('translate'), difficulty: DIFFICULTY_GEO + 2,
      question: '¿Cuántas casillas se ha movido la figura de color, y hacia dónde?', figures: [figure], options, answer,
      hints: [
        'Compara la figura de color con la de contorno: ¿hacia qué lado se ha desplazado, sin girar?',
        'Elige un cuadradito de la figura y cuenta cuántas casillas hay hasta su copia de color, en la misma fila o en la misma columna.',
        example,
      ],
    }
  }
  throw new Error('geometry: no translation could be built')
}

/** The faces, vertices and edges of the solids that carry them as drawn (triangular prism, square pyramid, cube). */
export const SOLID_TOTALS = {
  cubo: { caras: 6, vértices: 8, aristas: 12 },
  prisma: { caras: 5, vértices: 6, aristas: 9 },
  piramide: { caras: 5, vértices: 5, aristas: 8 },
} as const
type SolidAsk = 'caras' | 'vértices' | 'aristas'
const SOLID_ASK_QUESTION: Record<SolidAsk, string> = {
  caras: '¿Cuántas caras tiene este cuerpo?', vértices: '¿Cuántos vértices tiene este cuerpo?', aristas: '¿Cuántas aristas tiene este cuerpo?',
}
const SOLID_ASK_STEP: Record<SolidAsk, string> = {
  caras: 'Cuenta las caras una a una: arriba, abajo y las de los lados, sin repetir ninguna.',
  vértices: 'Cuenta las esquinas una a una, tocándolas con el dedo: cada punto donde se juntan tres bordes o más.',
  aristas: 'Cuenta los bordes uno a uno: cada línea donde se juntan dos caras.',
}

/** «¿Cuántas caras (vértices, aristas) tiene este cuerpo?» with numeric options. */
export function genSolidCount(rng: Rng): ShapeChoiceExercise {
  const solid = pick(rng, ['cubo', 'prisma', 'piramide'] as const)
  const ask = pick(rng, ['caras', 'vértices', 'aristas'] as const)
  const answer = SOLID_TOTALS[solid][ask]
  const figure: SolidFigure = { type: 'solid', name: solid }
  const { options, answer: index } = optionsWith(rng, String(answer), shuffle(rng, [4, 5, 6, 8, 9, 12].filter((n) => n !== answer)).map(String))
  // The worked example counts another solid, and its number is not the answer.
  const other = (['cubo', 'prisma', 'piramide'] as const).find((s) => s !== solid && SOLID_TOTALS[s][ask] !== answer)!
  return {
    id: `shape-choice:solid-count:${solid}:${ask}`,
    kind: 'shape-choice', skill: geoSkill('solid:count'), difficulty: DIFFICULTY_GEO + 1,
    question: SOLID_ASK_QUESTION[ask], figures: [figure], options, answer: index,
    hints: [
      'Mira qué te piden contar: caras (superficies planas), vértices (esquinas) o aristas (bordes), y cuenta solo eso.',
      SOLID_ASK_STEP[ask],
      `Ejemplo: el ${SOLID_WORD[other]} tiene ${SOLID_TOTALS[other][ask]} ${ask}.`,
    ],
  }
}

// ---------------------------------------------------------------- perimeter

/** The perimeter by adding the sides: a rectilinear figure with its lengths written on it (drawing), or a rectangle garden
    in a sentence (story). */
export function genPerimeter(rng: Rng, mode: 'drawing' | 'story'): PerimeterExercise {
  if (mode === 'story') {
    const w = randInt(rng, 4, 20)
    let h = randInt(rng, 3, 15)
    if (h === w) h = w > 3 ? w - 1 : w + 1
    const points: [number, number][] = [[0, 0], [w, 0], [w, h], [0, h]]
    const sides = [w, h, w, h]
    return {
      id: `perimeter:story:${w}x${h}`,
      kind: 'perimeter', skill: geoSkill('perimeter'), difficulty: 3,
      mode, figure: { type: 'polygon', points }, sides, unit: 'm',
      text: `Un jardín tiene forma de rectángulo. Mide ${w} metros de largo y ${h} metros de ancho. ¿Cuántos metros de valla hacen falta para rodearlo?`,
      answer: 2 * (w + h),
    }
  }
  const unit = pick(rng, ['cm', 'm'])
  let points: [number, number][]
  if (rng() < 0.5) {
    const w = randInt(rng, 3, 14)
    const h = randInt(rng, 2, 10)
    points = [[0, 0], [w, 0], [w, h], [0, h]]
  } else {
    const W = randInt(rng, 5, 12)
    const H = randInt(rng, 5, 12)
    const cw = randInt(rng, 2, W - 2)
    const ch = randInt(rng, 2, H - 2)
    points = [[0, 0], [W, 0], [W, H - ch], [W - cw, H - ch], [W - cw, H], [0, H]]
  }
  const sides = sideLengths(points)
  return {
    id: `perimeter:drawing:${points.map((p) => p.join(',')).join(';')}:${unit}`,
    kind: 'perimeter', skill: geoSkill('perimeter'), difficulty: 2,
    mode, figure: { type: 'polygon', points, labels: sides.map((l) => `${l} ${unit}`) }, sides, unit, text: null,
    answer: sides.reduce((s, l) => s + l, 0),
  }
}

// ---------------------------------------------------------------- dispatch

/** A geometry exercise for one skill (the perimeter mode comes from the ladder: drawing first, then the story). */
export function genGeometry(op: GeoOp, rng: Rng, perimeterMode: 'drawing' | 'story' = 'drawing'): ShapeChoiceExercise | ShapeCountExercise | AngleTapExercise | PerimeterExercise | AreaExercise {
  switch (op) {
    case 'poly:name': return genPolygonName(rng)
    case 'poly:sides': return genPolygonSides(rng)
    case 'line:type': return genLineType(rng)
    case 'line:rel': return genLineRelation(rng)
    case 'angle:type': return genAngleType(rng)
    case 'angle:tap': return genAngleTap(rng)
    case 'circle': return genCircle(rng)
    case 'solid:name': return genSolidName(rng)
    case 'solid:roll': return genSolidRoll(rng)
    case 'solid:faces': return genSolidFaces(rng)
    case 'line:kind': return genLineKind(rng)
    case 'angle:class': return genAngleClass(rng)
    case 'tri:sides': return genTriSides(rng)
    case 'tri:angles': return genTriAngles(rng)
    case 'quad:name': return genQuadName(rng)
    case 'circle:parts': return genCircleParts(rng)
    case 'translate': return genTranslate(rng)
    case 'solid:count': return genSolidCount(rng)
    case 'perimeter': return genPerimeter(rng, perimeterMode)
    case 'area': return genArea(rng)
    case 'symmetry': return genSymmetry(rng)
  }
}

// ---------------------------------------------------------------- área y simetría (4.º)

const key = (r: number, c: number) => `${r},${c}`

/** A connected figure of 6 to 16 squares on a 5 × 7 grid: a rectangle with a few squares added beside it. */
export function genArea(rng: Rng): AreaExercise {
  const rows = 5
  const cols = 7
  const w = randInt(rng, 2, 4)
  const h = randInt(rng, 2, 3)
  const r0 = randInt(rng, 0, rows - h)
  const c0 = randInt(rng, 0, cols - w)
  const cells = new Set<string>()
  for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) cells.add(key(r, c))
  const extra = randInt(rng, 0, 3)
  for (let k = 0, tries = 0; k < extra && tries < 50; tries++) {
    const [r, c] = pick(rng, [...cells]).split(',').map(Number)
    const [dr, dc] = pick(rng, [[0, 1], [0, -1], [1, 0], [-1, 0]] as const)
    const nr = r + dr
    const nc = c + dc
    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || cells.has(key(nr, nc))) continue
    cells.add(key(nr, nc))
    k++
  }
  const filled = [...cells].map((s) => s.split(',').map(Number) as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1])
  return {
    id: `area:${filled.map(([r, c]) => `${r}${c}`).join('.')}`, kind: 'area', skill: geoSkill('area'), difficulty: 2,
    figure: { type: 'grid', rows, cols, filled }, answer: filled.length,
  }
}

/** True when the squares are the same on both sides of the axis. */
export function isSymmetric(f: GridFigure): boolean {
  if (!f.axis) return false
  const set = new Set(f.filled.map(([r, c]) => key(r, c)))
  const at = f.axis.at
  return f.filled.every(([r, c]) => (f.axis!.dir === 'v' ? set.has(key(r, 2 * at - 1 - c)) : set.has(key(2 * at - 1 - r, c))))
}

/** «¿La línea roja es un eje de simetría?»: half a figure mirrored across the line, or mirrored with one slip. */
export function genSymmetry(rng: Rng): ShapeChoiceExercise {
  for (let attempt = 0; attempt < 100; attempt++) {
    const dir = rng() < 0.6 ? 'v' : 'h'
    const rows = dir === 'v' ? 5 : 6
    const cols = dir === 'v' ? 6 : 5
    const at = dir === 'v' ? cols / 2 : rows / 2
    const half = new Set<string>()
    // A connected half that touches the axis.
    let r = dir === 'v' ? randInt(rng, 0, rows - 1) : at - 1
    let c = dir === 'v' ? at - 1 : randInt(rng, 0, cols - 1)
    half.add(key(r, c))
    const size = randInt(rng, 3, 6)
    for (let tries = 0; half.size < size && tries < 60; tries++) {
      const [dr, dc] = pick(rng, [[0, 1], [0, -1], [1, 0], [-1, 0]] as const)
      const nr = r + dr
      const nc = c + dc
      const inHalf = dir === 'v' ? nc >= 0 && nc < at && nr >= 0 && nr < rows : nr >= 0 && nr < at && nc >= 0 && nc < cols
      if (!inHalf) continue
      r = nr
      c = nc
      half.add(key(r, c))
    }
    const cells = [...half].map((s) => s.split(',').map(Number) as [number, number])
    const mirror = cells.map(([y, x]) => (dir === 'v' ? [y, 2 * at - 1 - x] : [2 * at - 1 - y, x]) as [number, number])
    const yes = rng() < 0.5
    let other = mirror
    if (!yes) {
      // One square of the mirrored half moves one step along the axis: the figure stops matching.
      const i = randInt(rng, 0, mirror.length - 1)
      const [y, x] = mirror[i]
      const moved: [number, number] = dir === 'v' ? [y + (y + 1 < rows ? 1 : -1), x] : [y, x + (x + 1 < cols ? 1 : -1)]
      other = mirror.map((p, k) => (k === i ? moved : p))
    }
    const filled = [...new Map([...cells, ...other].map((p) => [key(p[0], p[1]), p])).values()]
      .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    const figure: GridFigure = { type: 'grid', rows, cols, filled, axis: { dir, at } }
    if (isSymmetric(figure) !== yes) continue
    const options = ['Sí', 'No']
    return {
      id: `shape-choice:symmetry:${dir}:${filled.map(([y, x]) => `${y}${x}`).join('.')}`,
      kind: 'shape-choice', skill: geoSkill('symmetry'), difficulty: 3,
      question: '¿La línea roja es un eje de simetría? Si doblas por ella, ¿las dos mitades coinciden?',
      figures: [figure], options, answer: yes ? 0 : 1,
      hints: [
        'Imagina que doblas la hoja por la línea roja.',
        'Compara cada cuadradito con el que le toca al otro lado, a la misma distancia de la línea.',
        'Si todos los cuadraditos tienen pareja al otro lado, la línea es un eje; si alguno se queda solo, no lo es.',
      ],
    }
  }
  throw new Error('geometry: no symmetry exercise could be built')
}

/** Grades the área: the squares counted. */
export function checkArea(ex: AreaExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  const v = answer.type === 'number' ? answer.value : answer.type === 'numbers' && answer.values.length === 1 ? answer.values[0] : undefined
  if (v === undefined) return wrongShape(expected)
  if (v === null || !Number.isFinite(v)) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: 'Escribe cuántos cuadraditos ocupa.' }
  if (v === ex.answer) return { correct: true, given: String(v), expected, feedback: '¡Muy bien! Has medido la superficie.' }
  return { correct: false, given: String(v), expected, errorType: 'other', feedback: '¡Casi! Cuenta fila a fila y ve tachando con el dedo los que ya has contado.' }
}

export const AREA_HINTS = [
  'El área es lo que ocupa la figura por dentro: cuenta los cuadraditos de color.',
  'Cuenta fila a fila, de izquierda a derecha.',
  'Suma lo que hay en cada fila.',
]

// ---------------------------------------------------------------- grading

const MISS = {
  right: '¡Muy bien! Lo has visto en la figura.',
  incomplete: 'Elige una respuesta antes de comprobar.',
  name: 'Mira otra vez la figura con calma.',
  cornerNotRight: 'Esa esquina no encaja con la de un papel: mírala otra vez.',
  cornerMissed: 'Te falta alguna esquina recta: compara cada esquina con la de un papel.',
  count: 'Cuenta las esquinas una a una, sin repetir ninguna.',
  perimeterOne: 'Te falta sumar un lado: suma todos los lados, uno a uno.',
  perimeter: 'Suma la medida de cada lado, uno detrás de otro.',
  perimeterStory: 'En un rectángulo hay dos lados largos y dos cortos: súmalos todos.',
}

/** Grades a shape-choice: the option tapped against the right one. */
export function checkShapeChoice(ex: ShapeChoiceExercise, answer: Answer): CheckResult {
  const expected = ex.options[ex.answer]
  if (answer.type !== 'choice') return wrongShape(expected)
  if (answer.index === null || answer.index === undefined) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: MISS.incomplete }
  const given = ex.options[answer.index] ?? '?'
  if (answer.index === ex.answer) return { correct: true, given, expected, feedback: MISS.right }
  const errorType: ErrorType = ex.skill.startsWith('frac:') ? 'fraction-count' : 'geo-name'
  return { correct: false, given, expected, errorType, feedback: `${MISS.name} ${ex.hints[0]}` }
}

/** Grades angle-tap: the corners tapped against the right-angle corners (none may be tapped by mistake). */
export function checkAngleTap(ex: AngleTapExercise, answer: Answer): CheckResult {
  const expected = ex.rightCorners.length ? ex.rightCorners.map((i) => i + 1).join(', ') : 'ninguna'
  if (answer.type !== 'marks') return wrongShape(expected)
  const marked = [...new Set(answer.marked)].filter((i) => Number.isInteger(i) && i >= 0 && i < ex.figure.points.length).sort((a, b) => a - b)
  const given = marked.length ? marked.map((i) => i + 1).join(', ') : 'ninguna'
  const same = marked.length === ex.rightCorners.length && marked.every((v, i) => v === ex.rightCorners[i])
  if (same) return { correct: true, given, expected, feedback: MISS.right }
  const wrongTap = marked.some((i) => !ex.rightCorners.includes(i))
  return { correct: false, given, expected, errorType: 'geo-name', feedback: wrongTap ? MISS.cornerNotRight : MISS.cornerMissed }
}

/** Grades a count of sides or corners. */
export function checkShapeCount(ex: ShapeCountExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  if (answer.type !== 'number') return wrongShape(expected)
  if (answer.value === null || answer.value === undefined) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: MISS.incomplete }
  const given = String(answer.value)
  if (answer.value === ex.answer) return { correct: true, given, expected, feedback: MISS.right }
  return { correct: false, given, expected, errorType: 'other', feedback: MISS.count }
}

/** Grades a perimeter: the sum of the sides. A sum that left one side out is tagged geo-perimeter. */
export function checkPerimeter(ex: PerimeterExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  if (answer.type !== 'number') return wrongShape(expected)
  if (answer.value === null || answer.value === undefined) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: MISS.incomplete }
  const given = `${answer.value} ${ex.unit}`
  if (answer.value === ex.answer) return { correct: true, given, expected, feedback: MISS.right }
  const leftOut = ex.sides.some((s) => ex.answer - s === answer.value)
  const feedback = leftOut ? MISS.perimeterOne : ex.mode === 'story' ? MISS.perimeterStory : MISS.perimeter
  return { correct: false, given, expected, errorType: leftOut ? 'geo-perimeter' : 'other', feedback }
}

// ---------------------------------------------------------------- hints

const ANGLE_TAP_HINTS: [string, string, string] = [
  'Un ángulo recto es como la esquina de una hoja de papel.',
  'Mira cada esquina: ¿entra justo en la esquina de un papel, sin que sobre ni falte?',
  'Compara cada esquina con la de un papel y toca solo las que encajan.',
]
const SIDES_HINTS: [string, string, string] = [
  'Cuenta las esquinas una a una, sin repetir ninguna.',
  'Cada esquina une dos lados: uno entra y otro sale.',
  'Un polígono tiene tantos lados como esquinas. Cuenta marcando con el dedo.',
]

/** Hints of the geometry exercises: the strategy, then the step; never the answer. */
export function geometryHints(ex: ShapeChoiceExercise | ShapeCountExercise | AngleTapExercise | PerimeterExercise | AreaExercise): Hint[] {
  switch (ex.kind) {
    case 'area': return AREA_HINTS.map((text, i) => hint((i + 1) as 1 | 2 | 3, text))
    case 'shape-choice': return ex.hints.map((text, i) => hint((i + 1) as 1 | 2 | 3, text))
    case 'shape-count': return SIDES_HINTS.map((text, i) => hint((i + 1) as 1 | 2 | 3, text))
    case 'angle-tap': return ANGLE_TAP_HINTS.map((text, i) => hint((i + 1) as 1 | 2 | 3, text))
    case 'perimeter':
      if (ex.mode === 'story') {
        return [
          hint(1, 'Dar una vuelta entera al jardín es el perímetro: suma los lados que lo rodean.'),
          hint(2, 'Un rectángulo tiene dos lados largos y dos cortos: los iguales van por parejas.'),
          hint(3, `Suma largo, ancho, largo y ancho: ${ex.sides[0]} + ${ex.sides[1]} + ${ex.sides[2]} + ${ex.sides[3]} = ?`),
        ]
      }
      return [
        hint(1, 'El contorno es el camino alrededor de la figura: hay que sumar todos sus lados.'),
        hint(2, 'Lee la medida de cada lado y ve sumándolas de una en una.'),
        hint(3, `Suma así: ${ex.sides.join(' + ')} = ?`),
      ]
  }
}
