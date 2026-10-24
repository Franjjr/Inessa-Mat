/* Geometría (block E): polygons, lines, angles, circle, solids, right angles and perimeter. */
import { describe, expect, it } from 'vitest'
import type { AngleTapExercise, Figure, GridFigure, PerimeterExercise, ShapeChoiceExercise, ShapeCountExercise } from '@/types'
import { check, createRng, generate, hintsFor, isValidSkill, kindsForSkill, parseSkill, blockSkillsOf, geoSkill, GEO_OPS } from '@/engine'
import {
  checkPerimeter, genAngleClass, genAngleTap, genAngleType, genCircle, genCircleParts, genGeometry, genLineKind, genLineRelation,
  genLineType, genPerimeter, genPolygonName, genPolygonSides, genQuadName, genSolidCount, genSolidFaces, genSolidName, genSolidRoll,
  genTranslate, genTriAngles, genTriSides, isConvex, polygonPoints, POLYGON_SIDES, POLYGON_WORD, rightCorners, sideLengths,
  SOLID_FLAT_FACES, SOLID_ROLLS,
} from '../geometry'
import { correctAnswer } from './helpers'
import type { PolygonName } from '../geometry'

const SEEDS = Array.from({ length: 24 }, (_, i) => i * 7 + 1)
const NAMES: PolygonName[] = ['triangle', 'square', 'rectangle', 'pentagon', 'hexagon']

describe('geometry skill keys', () => {
  it('every key parses to a geometry operation and maps to its kind', () => {
    for (const op of GEO_OPS) {
      const key = geoSkill(op)
      expect(parseSkill(key), key).toEqual({ type: 'geo', op })
      expect(isValidSkill(key)).toBe(true)
      expect(kindsForSkill(key).length, key).toBeGreaterThan(0)
    }
    expect(kindsForSkill('geo:poly:sides')).toEqual(['shape-count'])
    expect(kindsForSkill('geo:angle:tap')).toEqual(['angle-tap'])
    expect(kindsForSkill('geo:perimeter')).toEqual(['perimeter'])
    expect(parseSkill('geo:cube')).toBeNull()
  })

  it('the block skills of the geometry kinds are valid', () => {
    for (const kind of ['shape-choice', 'angle-tap', 'perimeter', 'shape-count'] as const) {
      for (const skill of blockSkillsOf(kind)) expect(isValidSkill(skill), skill).toBe(true)
    }
  })
})

describe('polygons', () => {
  it('every polygon is convex, with the right number of sides, in any orientation', () => {
    for (const name of NAMES) {
      for (const seed of SEEDS) {
        const pts = polygonPoints(name, createRng(seed))
        expect(pts).toHaveLength(POLYGON_SIDES[name])
        expect(isConvex(pts), `${name} ${seed}`).toBe(true)
      }
    }
  })

  it('a square has four equal sides, a rectangle two pairs of equal sides', () => {
    for (const seed of SEEDS) {
      const sq = sideLengths(polygonPoints('square', createRng(seed)))
      sq.forEach((l) => expect(Math.abs(l - sq[0])).toBeLessThan(0.1))
      const re = sideLengths(polygonPoints('rectangle', createRng(seed)))
      expect(Math.abs(re[0] - re[2])).toBeLessThan(0.1)
      expect(Math.abs(re[1] - re[3])).toBeLessThan(0.1)
      expect(Math.abs(re[0] - re[1])).toBeGreaterThan(1)
    }
  })

  it('the names are offered with the right one among them', () => {
    for (const seed of SEEDS) {
      const ex = genPolygonName(createRng(seed))
      expect(new Set(ex.options).size).toBe(4)
      expect(ex.options.every((o) => Object.values(POLYGON_WORD).includes(o))).toBe(true)
      expect(check(ex, correctAnswer(ex))).toMatchObject({ correct: true })
    }
  })

  it('sides and corners: the count is the number of points', () => {
    for (const seed of SEEDS) {
      const ex: ShapeCountExercise = genPolygonSides(createRng(seed))
      expect(ex.figure.points).toHaveLength(ex.answer)
      expect(check(ex, correctAnswer(ex))).toMatchObject({ correct: true })
      expect(check(ex, { type: 'number', value: ex.answer + 1 })).toMatchObject({ correct: false })
    }
  })
})

describe('right angles', () => {
  it('finds the right corners of simple figures on exact coordinates', () => {
    expect(rightCorners([[0, 0], [3, 0], [3, 2], [0, 2]])).toEqual([0, 1, 2, 3])
    expect(rightCorners([[0, 0], [3, 0], [0, 4]])).toEqual([0])
    expect(rightCorners([[0, 0], [5, 0], [5, 2], [2, 2], [2, 4], [0, 4]])).toEqual([0, 1, 2, 4, 5])
    expect(rightCorners([[0, 0], [4, 0], [1, 3]])).toEqual([])
  })

  it('the figures of the exercise have the right corners and the tap is graded', () => {
    for (const seed of SEEDS) {
      const ex: AngleTapExercise = genAngleTap(createRng(seed))
      expect(check(ex, correctAnswer(ex))).toMatchObject({ correct: true })
      const extra = ex.figure.points.map((_, i) => i).find((i) => !ex.rightCorners.includes(i))
      if (extra !== undefined) {
        expect(check(ex, { type: 'marks', marked: [...ex.rightCorners, extra] })).toMatchObject({ correct: false, errorType: 'geo-name' })
      }
      expect(check(ex, { type: 'marks', marked: [] }).correct).toBe(ex.rightCorners.length === 0)
    }
  })
})

describe('lines and angles', () => {
  it('a line type matches its figure: straight, curve or broken', () => {
    const counts = { straight: 2, curve: 3, broken: 4 } as const
    for (const seed of SEEDS) {
      const ex: ShapeChoiceExercise = genLineType(createRng(seed))
      const f = ex.figures[0]
      if (f.type !== 'line') throw new Error('expected a line')
      expect(f.points).toHaveLength(counts[f.kind as keyof typeof counts])
      const word = { straight: 'recta', curve: 'curva', broken: 'poligonal' }[f.kind as 'straight' | 'curve' | 'broken']
      expect(ex.options[ex.answer]).toBe(word)
    }
  })

  it('parallel, perpendicular or crossing segments are told apart by their directions', () => {
    for (const seed of SEEDS) {
      const ex = genLineRelation(createRng(seed))
      const f = ex.figures[0]
      if (f.type !== 'lines') throw new Error('expected two lines')
      const [[a0, a1], [b0, b1]] = f.segments
      const u = [a1[0] - a0[0], a1[1] - a0[1]]
      const v = [b1[0] - b0[0], b1[1] - b0[1]]
      const norm = Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1])
      const dot = Math.abs(u[0] * v[0] + u[1] * v[1]) / norm
      const cross = Math.abs(u[0] * v[1] - u[1] * v[0]) / norm
      const rel = ex.options[ex.answer]
      if (rel === 'perpendiculares') expect(dot).toBeLessThan(0.02)
      if (rel === 'paralelas') expect(cross).toBeLessThan(0.02)
      if (rel === 'se cruzan') {
        expect(cross).toBeGreaterThan(0.2)
        expect(dot).toBeGreaterThan(0.05)
      }
    }
  })

  it('an angle is recto, menor or mayor by its size', () => {
    for (const seed of SEEDS) {
      const ex = genAngleType(createRng(seed))
      const f = ex.figures[0]
      if (f.type !== 'angle') throw new Error('expected an angle')
      const expected = f.deg === 90 ? 'recto' : f.deg < 90 ? 'menor que un recto' : 'mayor que un recto'
      expect(ex.options[ex.answer]).toBe(expected)
    }
  })

  it('a circle is a círculo when filled and a circunferencia when only the line', () => {
    for (const seed of SEEDS) {
      const ex = genCircle(createRng(seed))
      const f = ex.figures[0]
      if (f.type !== 'circle') throw new Error('expected a circle')
      expect(ex.options[ex.answer]).toBe(f.filled ? 'círculo' : 'circunferencia')
    }
  })
})

describe('solids', () => {
  it('the names match the picture, the rolling and the flat faces', () => {
    for (const seed of SEEDS) {
      const name = genSolidName(createRng(seed))
      const solidName = name.figures[0]
      if (solidName.type !== 'solid') throw new Error('expected a solid')
      expect(check(name, correctAnswer(name))).toMatchObject({ correct: true })
      const roll = genSolidRoll(createRng(seed))
      const rf = roll.figures[0]
      if (rf.type !== 'solid') throw new Error('expected a solid')
      expect(roll.options[roll.answer]).toBe(SOLID_ROLLS[rf.name] ? 'Sí, rueda' : 'No, no rueda')
      const faces = genSolidFaces(createRng(seed))
      const ff = faces.figures[0]
      if (ff.type !== 'solid') throw new Error('expected a solid')
      expect(faces.options[faces.answer]).toBe(String(SOLID_FLAT_FACES[ff.name]))
    }
  })
})

describe('perimeter', () => {
  it('drawing: the perimeter is the sum of the labelled sides', () => {
    for (const seed of SEEDS) {
      const ex: PerimeterExercise = genPerimeter(createRng(seed), 'drawing')
      expect(ex.answer).toBe(ex.sides.reduce((s, l) => s + l, 0))
      expect(ex.figure.labels).toEqual(ex.sides.map((l) => `${l} ${ex.unit}`))
      expect(check(ex, correctAnswer(ex))).toMatchObject({ correct: true })
    }
  })

  it('story: a rectangle garden, the fence is twice the sum of its two sides', () => {
    for (const seed of SEEDS) {
      const ex = genPerimeter(createRng(seed), 'story')
      const [w, h] = ex.sides
      expect(ex.answer).toBe(2 * (w + h))
      expect(ex.text).toContain(`${w} metros`)
      expect(ex.text).toContain(`${h} metros`)
      expect(ex.figure.labels).toBeUndefined()
    }
  })

  it('leaving one side out is tagged as a perimeter mistake; other numbers are not', () => {
    const ex = genPerimeter(createRng(5), 'drawing')
    const left = ex.answer - ex.sides[0]
    expect(checkPerimeter(ex, { type: 'number', value: left })).toMatchObject({ correct: false, errorType: 'geo-perimeter' })
    expect(checkPerimeter(ex, { type: 'number', value: ex.answer + 3 })).toMatchObject({ correct: false, errorType: 'other' })
  })

  it('the generator uses the ladder: drawing first, the story once learnt', () => {
    expect(genGeometry('perimeter', createRng(3), 'drawing')).toMatchObject({ mode: 'drawing' })
    expect(genGeometry('perimeter', createRng(3), 'story')).toMatchObject({ mode: 'story' })
    const built = generate({ skills: ['geo:perimeter'] }, 6, { rng: createRng(4) })
    expect(built.every((e) => e.kind === 'perimeter')).toBe(true)
  })
})

describe('grading and hints of the geometry', () => {
  it('a wrong option is not accepted and is tagged as a geometry mistake', () => {
    const ex = genLineType(createRng(11))
    const wrong = (ex.answer + 1) % ex.options.length
    expect(check(ex, { type: 'choice', index: wrong })).toMatchObject({ correct: false, errorType: 'geo-name' })
    expect(check(ex, { type: 'choice', index: null })).toMatchObject({ correct: false, errorType: 'incomplete' })
  })

  it('every hint has three levels and the first one never repeats the right option', () => {
    const choices = [genPolygonName, genLineType, genLineRelation, genAngleType, genCircle, genSolidName, genSolidRoll, genSolidFaces]
    for (const make of choices) {
      for (const seed of SEEDS.slice(0, 8)) {
        const ex = make(createRng(seed))
        expect(hintsFor(ex).map((h) => h.level)).toEqual([1, 2, 3])
        expect(hintsFor(ex)[0].text.toLowerCase(), ex.id).not.toContain(ex.options[ex.answer].toLowerCase())
      }
    }
  })

  it('the perimeter hints never state the sum', () => {
    for (const seed of SEEDS.slice(0, 8)) {
      const ex = genPerimeter(createRng(seed), 'drawing')
      for (const h of hintsFor(ex).slice(0, 2)) expect(h.text).not.toMatch(new RegExp(`\\b${ex.answer}\\b`))
    }
  })


  it('a wrong count of sides is graded as a plain count mistake', () => {
    const ex: ShapeCountExercise = genPolygonSides(createRng(2))
    expect(check(ex, { type: 'number', value: ex.answer - 1 })).toMatchObject({ correct: false, errorType: 'other' })
    expect(hintsFor(ex)).toHaveLength(3)
  })
})

describe('the generators are reachable through the public selector', () => {
  it('generate() builds every geometry skill with its own exercise kind', () => {
    const skills = GEO_OPS.map(geoSkill)
    const items = generate({ skills }, skills.length * 2, { rng: createRng(21) })
    expect(items.length).toBe(skills.length * 2)
    const kinds = new Set(items.map((i) => i.kind))
    expect(kinds.has('shape-choice')).toBe(true)
    expect(kinds.has('angle-tap')).toBe(true)
    expect(kinds.has('perimeter')).toBe(true)
    expect(kinds.has('shape-count')).toBe(true)
  })

  it('the generators are deterministic for a seed', () => {
    expect(genAngleTap(createRng(77))).toEqual(genAngleTap(createRng(77)))
    expect(genPolygonName(createRng(77))).toEqual(genPolygonName(createRng(77)))
    expect(genGeometry('perimeter', createRng(2), 'story')).toMatchObject({ mode: 'story' })
  })
})

// ---------------------------------------------------------------- 3.º and 4.º: lines, angles, triangles, quadrilaterals, circle, translation, solids

const WIDE = Array.from({ length: 200 }, (_, i) => i * 13 + 5)
const NEW_MAKERS: [string, (rng: ReturnType<typeof createRng>) => ShapeChoiceExercise][] = [
  ['line:kind', genLineKind], ['angle:class', genAngleClass], ['tri:sides', genTriSides], ['tri:angles', genTriAngles],
  ['quad:name', genQuadName], ['circle:parts', genCircleParts], ['translate', genTranslate], ['solid:count', genSolidCount],
]

/** Words are checked as substrings (lowercased); numbers as whole numbers, so 8 is not found inside 18. */
function mentions(text: string, option: string): boolean {
  if (/^\d+$/.test(option)) return new RegExp(`(^|\\D)${option}(\\D|$)`).test(text)
  return text.toLowerCase().includes(option.toLowerCase())
}

const pts = (f: Figure): [number, number][] => {
  if (f.type !== 'polygon') throw new Error('expected a polygon')
  return f.points
}
/** Cosine-free corner test: the dot product of the two sides that meet at p (zero = right angle). */
const dot = (a: [number, number], p: [number, number], b: [number, number]) =>
  (a[0] - p[0]) * (b[0] - p[0]) + (a[1] - p[1]) * (b[1] - p[1])
/** Parallel directions: the normalised cross product of the two sides is about 0. */
function parallel(a0: [number, number], a1: [number, number], b0: [number, number], b1: [number, number]): boolean {
  const u = [a1[0] - a0[0], a1[1] - a0[1]]
  const v = [b1[0] - b0[0], b1[1] - b0[1]]
  return Math.abs(u[0] * v[1] - u[1] * v[0]) / (Math.hypot(...u) * Math.hypot(...v)) < 0.01
}

describe('new geometry operations (3.º and 4.º)', () => {
  it('every new operation answers with one of its options, grades it right and has three hints', () => {
    for (const [op, make] of NEW_MAKERS) {
      for (const seed of WIDE) {
        const ex = make(createRng(seed))
        expect(ex.kind, op).toBe('shape-choice')
        expect(new Set(ex.options).size, `${op} ${seed}`).toBe(ex.options.length)
        expect(ex.answer, `${op} ${seed}`).toBeGreaterThanOrEqual(0)
        expect(ex.answer, `${op} ${seed}`).toBeLessThan(ex.options.length)
        expect(check(ex, correctAnswer(ex)), `${op} ${seed}`).toMatchObject({ correct: true })
        expect(hintsFor(ex).map((h) => h.level), `${op} ${seed}`).toEqual([1, 2, 3])
      }
    }
  })

  it('no hint of a new operation contains the right option (Review Focus 3)', () => {
    for (const [op, make] of NEW_MAKERS) {
      for (const seed of WIDE) {
        const ex = make(createRng(seed))
        const right = ex.options[ex.answer]
        for (const h of hintsFor(ex)) expect(mentions(h.text, right), `${op} ${seed}: ${h.text}`).toBe(false)
      }
    }
  })

  it('line:kind: a recta has arrows at both ends, a semirrecta a dot and an arrow, a segmento two dots', () => {
    const word = { straight: 'recta', ray: 'semirrecta', segment: 'segmento' } as const
    const seen = new Set<string>()
    for (const seed of WIDE) {
      const ex = genLineKind(createRng(seed))
      const f = ex.figures[0]
      if (f.type !== 'line') throw new Error('expected a line')
      expect(f.points).toHaveLength(2)
      expect(ex.options[ex.answer]).toBe(word[f.kind as keyof typeof word])
      seen.add(f.kind)
    }
    expect(seen).toEqual(new Set(['straight', 'ray', 'segment']))
  })

  it('angle:class: agudo is under 90 degrees, recto is 90, obtuso is from 91 to 179', () => {
    const seen = new Set<string>()
    for (const seed of WIDE) {
      const ex = genAngleClass(createRng(seed))
      const f = ex.figures[0]
      if (f.type !== 'angle') throw new Error('expected an angle')
      const right = ex.options[ex.answer]
      if (right === 'agudo') expect(f.deg).toBeLessThan(90)
      if (right === 'recto') expect(f.deg).toBe(90)
      if (right === 'obtuso') {
        expect(f.deg).toBeGreaterThanOrEqual(91)
        expect(f.deg).toBeLessThanOrEqual(179)
      }
      seen.add(right)
    }
    expect(seen).toEqual(new Set(['agudo', 'recto', 'obtuso']))
  })

  it('tri:sides: the lengths written on the triangle obey the triangle inequality and match the name', () => {
    const seen = new Set<string>()
    for (const seed of WIDE) {
      const ex = genTriSides(createRng(seed))
      const f = ex.figures[0]
      if (f.type !== 'polygon' || !f.labels) throw new Error('expected a labelled triangle')
      const [a, b, c] = f.labels.map((l) => Number.parseFloat(l))
      expect(a + b, `${seed}`).toBeGreaterThan(c)
      expect(a + c).toBeGreaterThan(b)
      expect(b + c).toBeGreaterThan(a)
      const right = ex.options[ex.answer]
      const equal = [a === b, b === c, a === c].filter(Boolean).length
      if (right === 'equilátero') expect(equal).toBe(3)
      if (right === 'isósceles') expect(equal).toBe(1)
      if (right === 'escaleno') expect(equal).toBe(0)
      // The drawn sides are the labelled ones (label i sits on side i).
      sideLengths(pts(f)).forEach((l, i) => expect(Math.abs(l - [a, b, c][i])).toBeLessThan(0.05))
      seen.add(right)
    }
    expect(seen).toEqual(new Set(['equilátero', 'isósceles', 'escaleno']))
  })

  it('tri:angles: the answer is the kind of the drawn corners', () => {
    const seen = new Set<string>()
    for (const seed of WIDE) {
      const ex = genTriAngles(createRng(seed))
      const p = pts(ex.figures[0])
      const dots = p.map((v, i) => dot(p[(i + 1) % 3], v, p[(i + 2) % 3]))
      const right = ex.options[ex.answer]
      if (right === 'rectángulo') expect(dots.filter((d) => d === 0), `${seed}`).toHaveLength(1)
      if (right === 'acutángulo') expect(dots.every((d) => d > 0), `${seed}`).toBe(true)
      if (right === 'obtusángulo') expect(dots.some((d) => d < 0), `${seed}`).toBe(true)
      seen.add(right)
    }
    expect(seen).toEqual(new Set(['acutángulo', 'rectángulo', 'obtusángulo']))
  })

  it('quad:name: each name matches its sides (equal or parallel) and its corners', () => {
    const seen = new Set<string>()
    for (const seed of WIDE) {
      const ex = genQuadName(createRng(seed))
      const p = pts(ex.figures[0])
      const sides = sideLengths(p)
      const allEqual = sides.every((l) => Math.abs(l - sides[0]) < 0.05)
      const pairsEqual = Math.abs(sides[0] - sides[2]) < 0.05 && Math.abs(sides[1] - sides[3]) < 0.05
      const cosines = p.map((v, i) => Math.abs(dot(p[(i + 1) % 4], v, p[(i + 3) % 4])) / (sides[i] * sides[(i + 3) % 4]))
      const allRight = cosines.every((c) => c < 0.02)
      const par1 = parallel(p[0], p[1], p[2], p[3])
      const par2 = parallel(p[1], p[2], p[3], p[0])
      const right = ex.options[ex.answer]
      if (right === 'cuadrado') expect(allEqual && allRight, `${seed}`).toBe(true)
      if (right === 'rectángulo') expect(pairsEqual && allRight && !allEqual, `${seed}`).toBe(true)
      if (right === 'rombo') expect(allEqual && !allRight, `${seed}`).toBe(true)
      if (right === 'romboide') expect(par1 && par2 && pairsEqual && !allEqual && !allRight, `${seed}`).toBe(true)
      if (right === 'trapecio') expect(par1 !== par2, `${seed}`).toBe(true)
      seen.add(right)
    }
    expect(seen).toEqual(new Set(['cuadrado', 'rectángulo', 'rombo', 'romboide', 'trapecio']))
  })

  it('circle:parts: the highlighted part is the one named by the right option', () => {
    const seen = new Set<string>()
    const word = { radius: 'radio', diameter: 'diámetro', chord: 'cuerda', arc: 'arco' } as const
    for (const seed of WIDE) {
      const ex = genCircleParts(createRng(seed))
      const f = ex.figures[0]
      if (f.type !== 'circle' || !f.highlight) throw new Error('expected a highlighted circle')
      expect(ex.options[ex.answer]).toBe(word[f.highlight])
      seen.add(word[f.highlight])
    }
    expect(seen).toEqual(new Set(['radio', 'diámetro', 'cuerda', 'arco']))
  })

  it('translate: the moved copy is the outline shifted, and the answer names that move', () => {
    const seen = new Set<string>()
    for (const seed of WIDE) {
      const ex = genTranslate(createRng(seed))
      const f = ex.figures[0] as GridFigure
      if (f.type !== 'grid' || !f.ghost) throw new Error('expected a grid with an outline')
      const dr = Math.min(...f.filled.map((c) => c[0])) - Math.min(...f.ghost.map((c) => c[0]))
      const dc = Math.min(...f.filled.map((c) => c[1])) - Math.min(...f.ghost.map((c) => c[1]))
      const shifted = f.ghost.map(([r, c]) => `${r + dr},${c + dc}`).sort()
      expect(f.filled.map(([r, c]) => `${r},${c}`).sort(), `${seed}`).toEqual(shifted)
      expect(f.filled.every(([r, c]) => r >= 0 && r < f.rows && c >= 0 && c < f.cols), `${seed}`).toBe(true)
      const count = Math.abs(dr) + Math.abs(dc)
      const where = dr === 0 ? (dc > 0 ? 'a la derecha' : 'a la izquierda') : dr > 0 ? 'hacia abajo' : 'hacia arriba'
      expect(ex.options[ex.answer]).toBe(`${count} ${where}`)
      seen.add(where)
    }
    expect(seen).toEqual(new Set(['a la derecha', 'a la izquierda', 'hacia arriba', 'hacia abajo']))
  })

  it('solid:count: caras, vértices and aristas of the cube, the prism and the pyramid as drawn', () => {
    const table = {
      cubo: { caras: 6, vértices: 8, aristas: 12 }, prisma: { caras: 5, vértices: 6, aristas: 9 }, piramide: { caras: 5, vértices: 5, aristas: 8 },
    } as const
    const seen = new Set<string>()
    for (const seed of WIDE) {
      const ex = genSolidCount(createRng(seed))
      const f = ex.figures[0]
      if (f.type !== 'solid' || !(f.name in table)) throw new Error('expected a cube, a prism or a pyramid')
      const ask = (['caras', 'vértices', 'aristas'] as const).find((w) => ex.question.includes(w))
      if (!ask) throw new Error(`the question does not say what to count: ${ex.question}`)
      expect(ex.options[ex.answer]).toBe(String(table[f.name as keyof typeof table][ask]))
      seen.add(ask)
    }
    expect(seen).toEqual(new Set(['caras', 'vértices', 'aristas']))
  })
})
