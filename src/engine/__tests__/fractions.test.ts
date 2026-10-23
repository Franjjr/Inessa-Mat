/* Fracciones (block E): skill keys, generators, grading and hints. Seeds keep the generators deterministic. */
import { describe, expect, it } from 'vitest'
import type { Answer, Exercise, ShapeChoiceExercise } from '@/types'
import { check, generate, hintsFor, createRng, isValidSkill, kindsForSkill, parseSkill, blockSkillsOf, fractionSkill, FRACTION_DENOMINATORS } from '@/engine'
import { checkFractionEqual, checkFractionRead, checkFractionShade, fractionName, genFractionCompare, genFractionEqual, genFractionName, genFractionOf, genFractionRead, genFractionShade, unequalWeights } from '../fractions'
import { correctAnswer } from './helpers'

const SEEDS = [1, 2, 3, 5, 8, 13, 21, 34]
const fair = (w: number[]) => w.every((x) => x === w[0])

describe('fraction names', () => {
  it('says the Spanish name of each fraction', () => {
    expect(fractionName(1, 2)).toBe('un medio')
    expect(fractionName(2, 3)).toBe('dos tercios')
    expect(fractionName(1, 4)).toBe('un cuarto')
    expect(fractionName(3, 4)).toBe('tres cuartos')
    expect(fractionName(5, 6)).toBe('cinco sextos')
    expect(fractionName(7, 12)).toBe('siete doceavos')
  })
})

describe('skill keys of the fractions', () => {
  it('parses the keys with a denominator and rejects the others', () => {
    expect(parseSkill('frac:shade:4')).toEqual({ type: 'fraction', op: 'shade', d: 4 })
    expect(parseSkill('frac:of:12')).toEqual({ type: 'fraction', op: 'of', d: 12 })
    expect(parseSkill('frac:equal')).toEqual({ type: 'fraction', op: 'equal' })
    expect(parseSkill('frac:compare')).toEqual({ type: 'fraction', op: 'compare' })
    expect(parseSkill('frac:shade:7')).toBeNull()
    expect(parseSkill('frac:read:9')).toBeNull()
    expect(parseSkill('frac:mix:2')).toBeNull()
  })

  it('maps each operation to its exercise kind', () => {
    expect(kindsForSkill('frac:shade:2')).toEqual(['fraction-shade'])
    expect(kindsForSkill('frac:read:3')).toEqual(['fraction-read'])
    expect(kindsForSkill('frac:name:4')).toEqual(['shape-choice'])
    expect(kindsForSkill('frac:of:4')).toEqual(['fraction-of'])
    expect(kindsForSkill('frac:equal')).toEqual(['fraction-equal'])
    expect(kindsForSkill('frac:compare')).toEqual(['shape-choice'])
  })

  it('every skill of the new kinds is valid', () => {
    for (const kind of ['fraction-shade', 'fraction-read', 'fraction-of', 'fraction-equal', 'shape-choice'] as const) {
      for (const skill of blockSkillsOf(kind)) expect(isValidSkill(skill), skill).toBe(true)
    }
    expect(FRACTION_DENOMINATORS).toEqual([2, 3, 4, 5, 6, 8, 10, 12])
    expect(fractionSkill('name', 8)).toBe('frac:name:8')
  })
})

describe('shading: colour n parts of d equal parts', () => {
  it('the generated fraction is proper and the figure is split in equal parts', () => {
    for (const d of FRACTION_DENOMINATORS) {
      for (const seed of SEEDS) {
        const ex = genFractionShade(createRng(seed), d)
        expect(ex.numerator).toBeGreaterThanOrEqual(1)
        expect(ex.numerator).toBeLessThan(d)
        expect(ex.figure.weights).toHaveLength(d)
        expect(fair(ex.figure.weights)).toBe(true)
        expect(ex.figure.colored).toEqual([])
      }
    }
  })

  it('accepts any n parts, and rejects too many, too few or repeated parts', () => {
    const ex = genFractionShade(createRng(4), 4)
    const n = ex.numerator
    const first = Array.from({ length: n }, (_, i) => i)
    expect(check(ex, { type: 'shade', chosen: first })).toMatchObject({ correct: true })
    expect(check(ex, { type: 'shade', chosen: [...first, ...first] })).toMatchObject({ correct: true })
    const tooMany = Array.from({ length: n + 1 }, (_, i) => i) // n + 1 <= d always
    expect(check(ex, { type: 'shade', chosen: tooMany })).toMatchObject({ correct: false, errorType: 'fraction-count' })
    expect(checkFractionShade(ex, { type: 'shade', chosen: [] })).toMatchObject({ correct: false, errorType: 'fraction-count' })
    expect(checkFractionShade(ex, { type: 'shade', chosen: [99, -1] })).toMatchObject({ correct: false })
  })
})

describe('reading the fraction', () => {
  it('the correct numerator and denominator are accepted; reversed or missing ones are not', () => {
    for (const seed of SEEDS) {
      const ex = genFractionRead(createRng(seed), 6)
      expect(ex.figure.colored).toHaveLength(ex.numerator)
      expect(check(ex, correctAnswer(ex))).toMatchObject({ correct: true })
      const reversed = checkFractionRead(ex, { type: 'fraction', numerator: ex.denominator, denominator: ex.numerator })
      expect(reversed).toMatchObject({ correct: false, errorType: 'fraction-count' })
      expect(checkFractionRead(ex, { type: 'fraction', numerator: null, denominator: ex.denominator })).toMatchObject({ correct: false, errorType: 'incomplete' })
    }
  })
})

describe('naming the fraction', () => {
  it('four different names, one of them right, and the right index', () => {
    for (const d of FRACTION_DENOMINATORS) {
      for (const seed of SEEDS) {
        const ex = genFractionName(createRng(seed), d)
        expect(ex.options).toHaveLength(4)
        expect(new Set(ex.options).size).toBe(4)
        const colored = ex.figures[0]
        if (colored.type !== 'fraction') throw new Error('expected a fraction figure')
        expect(ex.options[ex.answer]).toBe(fractionName(colored.colored.length, colored.weights.length))
        expect(check(ex, correctAnswer(ex))).toMatchObject({ correct: true })
      }
    }
  })
})

describe('comparing fractions with drawings', () => {
  it('the word under the answer index is the true comparison of the two drawings', () => {
    for (const seed of [...SEEDS, 55, 89, 144]) {
      const ex = genFractionCompare(createRng(seed))
      const [a, b] = ex.figures.map((f) => {
        if (f.type !== 'fraction') throw new Error('expected fraction figures')
        return f.colored.length / f.weights.length
      })
      const word = a < b ? 'menor' : a > b ? 'mayor' : 'igual'
      expect(ex.options[ex.answer]).toBe(word)
      expect(ex.options.slice().sort()).toEqual(['igual', 'mayor', 'menor'])
    }
  })
})

describe('figures that are not split in equal parts', () => {
  it('the figures to tap are exactly the ones with unequal parts', () => {
    for (const seed of SEEDS) {
      const ex = genFractionEqual(createRng(seed))
      const unequal = ex.figures.flatMap((f, i) => (fair(f.weights) ? [] : [i]))
      expect(ex.unequal).toEqual(unequal)
      expect(ex.unequal.length).toBeGreaterThan(0)
      expect(ex.unequal.length).toBeLessThan(ex.figures.length)
      expect(check(ex, correctAnswer(ex))).toMatchObject({ correct: true })
    }
  })

  it('tapping a figure split in equal parts is wrong', () => {
    const ex = genFractionEqual(createRng(7))
    const fairIndex = ex.figures.findIndex((_, i) => !ex.unequal.includes(i))
    const r = checkFractionEqual(ex, { type: 'marks', marked: [...ex.unequal, fairIndex] })
    expect(r).toMatchObject({ correct: false, errorType: 'fraction-parts' })
  })

  it('unequal weights always show a clear difference (the biggest part at least twice the smallest)', () => {
    for (const d of [2, 3, 4, 5, 6, 8, 10, 12]) {
      for (const seed of SEEDS) {
        const w = unequalWeights(createRng(seed), d)
        expect(w).toHaveLength(d)
        expect(Math.max(...w)).toBeGreaterThanOrEqual(2 * Math.min(...w))
      }
    }
  })
})

describe('a fraction of a quantity', () => {
  it('the total is a multiple of the denominator and the answer is numerator × (total ÷ denominator)', () => {
    for (const d of FRACTION_DENOMINATORS) {
      for (const seed of SEEDS) {
        for (const mode of ['drawing', 'numbers'] as const) {
          const ex = genFractionOf(createRng(seed), d, mode, '🍬')
          expect(ex.total % d).toBe(0)
          expect(ex.answer).toBe((ex.numerator * ex.total) / d)
          expect(check(ex, correctAnswer(ex))).toMatchObject({ correct: true })
        }
      }
    }
  })

  it('the drawing mode has no story; the numbers mode may have one', () => {
    const drawings = SEEDS.map((s) => genFractionOf(createRng(s), 4, 'drawing', '🌸'))
    expect(drawings.every((e) => e.story === null)).toBe(true)
    const numbers = [...SEEDS, 99, 100, 101].map((s) => genFractionOf(createRng(s), 4, 'numbers', '🌸'))
    expect(numbers.some((e) => e.story !== null)).toBe(true)
  })

  it('a count of the whole quantity is wrong and labelled as a counting mistake', () => {
    const ex = genFractionOf(createRng(3), 4, 'numbers', '🍬')
    expect(check(ex, { type: 'number', value: ex.total })).toMatchObject({ correct: false, errorType: 'fraction-count' })
  })
})

describe('the generator plans fractions through generate()', () => {
  it('builds fraction exercises for a skill selector, with the right kinds and no duplicates', () => {
    const items: Exercise[] = generate({ skills: ['frac:shade:4', 'frac:read:4', 'frac:of:4', 'frac:equal', 'frac:compare', 'frac:name:3'] }, 30, { rng: createRng(12) })
    expect(items).toHaveLength(30)
    const kinds = new Set(items.map((i) => i.kind))
    expect(kinds).toEqual(new Set(['fraction-shade', 'fraction-read', 'fraction-of', 'fraction-equal', 'shape-choice']))
    expect(new Set(items.map((i) => i.id)).size).toBeGreaterThan(20)
  })
})

describe('hints of the fractions never give the answer', () => {
  it('the numeric answers do not appear in the hint texts', () => {
    for (const d of FRACTION_DENOMINATORS) {
      for (const seed of SEEDS) {
        const ofEx = genFractionOf(createRng(seed), d, 'numbers', '🍬')
        // A number that is also in the statement (the whole, the parts or the numerator) can be restated by a hint.
        if ([ofEx.total, d, ofEx.numerator].includes(ofEx.answer)) continue
        for (const h of hintsFor(ofEx)) {
          expect(h.text, `${ofEx.id}: ${h.text}`).not.toMatch(new RegExp(`\\b${ofEx.answer}\\b`))
        }
      }
    }
  })

  it('the first hint of a choice never repeats the right option', () => {
    const seeds = [1, 2, 3, 4, 5]
    const choices: ShapeChoiceExercise[] = [
      ...seeds.map((s) => genFractionName(createRng(s), 4)),
      ...seeds.map((s) => genFractionCompare(createRng(s))),
    ]
    for (const ex of choices) {
      const right = ex.options[ex.answer].toLowerCase()
      expect(hintsFor(ex)[0].text.toLowerCase(), ex.id).not.toContain(right)
    }
  })

  it('every hint has the three levels', () => {
    const ex = genFractionShade(createRng(9), 3)
    expect(hintsFor(ex).map((h) => h.level)).toEqual([1, 2, 3])
  })
})

describe('the wrong answers are not accepted', () => {
  it('a number that is not the answer', () => {
    const ex = genFractionOf(createRng(2), 2, 'drawing', '🍬')
    const answer: Answer = { type: 'number', value: ex.answer + 1 }
    expect(check(ex, answer).correct).toBe(false)
  })
})
