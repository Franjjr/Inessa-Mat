/* Geometría (block E): polygons, lines, angles, circle, solids, right angles and perimeter. */
import { describe, expect, it } from 'vitest'
import type { AngleTapExercise, PerimeterExercise, ShapeChoiceExercise, ShapeCountExercise } from '@/types'
import { check, createRng, generate, hintsFor, isValidSkill, kindsForSkill, parseSkill, blockSkillsOf, geoSkill, GEO_OPS } from '@/engine'
import {
  checkPerimeter, genAngleTap, genAngleType, genCircle, genGeometry, genLineRelation, genLineType, genPerimeter,
  genPolygonName, genPolygonSides, genSolidFaces, genSolidName, genSolidRoll, isConvex, polygonPoints, POLYGON_SIDES, POLYGON_WORD,
  rightCorners, sideLengths, SOLID_FLAT_FACES, SOLID_ROLLS,
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
      expect(f.points).toHaveLength(counts[f.kind])
      const word = { straight: 'recta', curve: 'curva', broken: 'poligonal' }[f.kind]
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
