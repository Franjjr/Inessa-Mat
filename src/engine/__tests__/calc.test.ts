/* Cálculo mental de 4.º (combinadas, jerarquía, paréntesis, asociativa, distributiva, estimar) and signo igual o distinto
   (eq:same): the answers follow the right order of operations, the estimate is the rounded one, and no hint leaks. */
import { describe, expect, it } from 'vitest'
import type { EquationExercise, Exercise, MentalExercise } from '@/types'
import { check, createRng, fmt, generate, hintsFor } from '@/engine'
import { mentalSkill } from '../skills'

const now = new Date('2026-10-24T10:00:00.000Z')
const SEEDS = 300

const NEW_FAMILIES = ['combinadas', 'jerarquia', 'parentesis', 'asociativa', 'distributiva', 'estimar'] as const

function mentalItems(family: string, count = SEEDS, seed = 7): MentalExercise[] {
  return generate({ skills: [mentalSkill(family as never)] }, count, { rng: createRng(seed), now }).map((ex) => {
    if (ex.kind !== 'mental') throw new Error('expected mental')
    return ex
  })
}

/** Evaluates a child-facing expression with the school order: brackets, then × and :, then + and −, left to right. */
function evaluate(text: string): number {
  const src = text.replace(/\s/g, '')
  let i = 0
  const expr = (): number => {
    let v = term()
    while (src[i] === '+' || src[i] === '−') {
      const op = src[i++]
      const r = term()
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  const term = (): number => {
    let v = factor()
    while (src[i] === '×' || src[i] === ':') {
      const op = src[i++]
      const r = factor()
      if (op === ':') {
        expect(v % r, `division of ${text} is exact`).toBe(0)
        v /= r
      } else v *= r
    }
    return v
  }
  const factor = (): number => {
    if (src[i] === '(') {
      i++
      const v = expr()
      expect(src[i++], `closing bracket in ${text}`).toBe(')')
      return v
    }
    const start = i
    while (i < src.length && /\d/.test(src[i])) i++
    return Number(src.slice(start, i))
  }
  const v = expr()
  expect(i, `whole expression read: ${text}`).toBe(src.length)
  return v
}

/** The statement without its trailing « = ? ». */
const sum = (ex: MentalExercise) => ex.prompt.replace(/ = \?$/, '')

/** Whole-number mention of `n` in `text` (15 is not 5, and digits with thousands spaces are the same number). */
const mentions = (text: string, n: number) => new RegExp(`(^|[^\\d])${String(n).split('').join('\\s?')}(?!\\d)`).test(text)

describe('cálculo mental de 4.º: the answer follows the order of operations', () => {
  it('combinadas: left to right, the sum up to 1 000 and never negative', () => {
    for (const ex of mentalItems('combinadas')) {
      expect(evaluate(sum(ex)), ex.prompt).toBe(ex.answer)
      expect(ex.answer).toBeGreaterThanOrEqual(0)
      expect(ex.a + ex.b).toBeLessThanOrEqual(1000)
    }
  })

  it('jerarquia: × and : before + and −, results up to 200 and exact divisions', () => {
    const items = mentalItems('jerarquia')
    expect(items.some((ex) => ex.prompt.includes('×'))).toBe(true)
    expect(items.some((ex) => ex.prompt.includes(':'))).toBe(true)
    for (const ex of items) {
      expect(evaluate(sum(ex)), ex.prompt).toBe(ex.answer)
      expect(ex.answer).toBeGreaterThanOrEqual(0)
      expect(ex.answer).toBeLessThanOrEqual(200)
    }
  })

  it('parentesis: the brackets first, results up to 200', () => {
    for (const ex of mentalItems('parentesis')) {
      expect(evaluate(sum(ex)), ex.prompt).toBe(ex.answer)
      expect(ex.answer).toBeLessThanOrEqual(200)
    }
  })

  it('asociativa: the product of the three factors, never negative', () => {
    for (const ex of mentalItems('asociativa')) {
      const [f1, f2, f3] = sum(ex).split(' × ').map(Number)
      expect(f1 * f2 * f3, ex.prompt).toBe(ex.answer)
      expect(ex.answer).toBeGreaterThan(0)
    }
  })

  it('distributiva: a × b = a × t + a × __, and the blank is the units part of b', () => {
    for (const ex of mentalItems('distributiva')) {
      const m = ex.prompt.match(/^(\d+) × (\d+) = (\d+) × (\d+) \+ (\d+) × __$/)
      expect(m, ex.prompt).not.toBeNull()
      const [, a, b, a2, t, a3] = m!.map(Number)
      expect(a2).toBe(a)
      expect(a3).toBe(a)
      expect(a * b).toBe(a * t + a * ex.answer)
      expect(ex.answer).toBeGreaterThanOrEqual(1)
      expect(ex.answer).toBeLessThanOrEqual(9)
    }
  })

  it('estimar: the answer is the estimate of the two numbers rounded to the stated place, never negative', () => {
    for (const ex of mentalItems('estimar')) {
      const m = ex.prompt.match(/^Estima redondeando a las (decenas|centenas): (\d[\d ]*) ([+−]) (\d[\d ]*) = \?$/)
      expect(m, ex.prompt).not.toBeNull()
      const place = m![1] === 'decenas' ? 10 : 100
      const x = Number(m![2].replace(/\s/g, ''))
      const y = Number(m![4].replace(/\s/g, ''))
      const rx = Math.round(x / place) * place
      const ry = Math.round(y / place) * place
      expect(ex.answer, ex.prompt).toBe(m![3] === '+' ? rx + ry : rx - ry)
      expect(ex.answer).toBeGreaterThanOrEqual(0)
      expect(ex.place).toBe(place)
    }
  })

  it('estimar accepts the estimate only, not the exact result', () => {
    let differs = 0
    for (const ex of mentalItems('estimar', 120, 11)) {
      const [, x, op, y] = ex.prompt.match(/(\d+) ([+−]) (\d+) = \?$/)!
      const exact = op === '+' ? Number(x) + Number(y) : Number(x) - Number(y)
      if (exact === ex.answer) continue
      differs++
      expect(check(ex, { type: 'number', value: ex.answer }).correct).toBe(true)
      expect(check(ex, { type: 'number', value: exact }).correct, ex.prompt).toBe(false)
    }
    expect(differs).toBeGreaterThan(20)
  })

  it('every new family is three levels long and generates its own skill', () => {
    for (const family of NEW_FAMILIES) {
      for (const ex of mentalItems(family, 40, 3)) {
        expect(ex.skill).toBe(mentalSkill(family))
        expect(hintsFor(ex).map((h) => h.level)).toEqual([1, 2, 3])
      }
    }
  })
})

describe('cálculo mental de 4.º: hints never leak the answer or an intermediate result', () => {
  /** The results one trivial step before the answer, for each family (never written in a hint). */
  const intermediates = (ex: MentalExercise): number[] => {
    const { a, b } = ex
    const c = ex.c ?? 0
    switch (ex.family) {
      case 'combinadas': case 'parentesis': return [a + b]
      case 'jerarquia': return ex.prompt.includes('×') ? [b * c] : [b / c]
      case 'asociativa': {
        const [f1, f2, f3] = sum(ex).split(' × ').map(Number)
        return [f1 * f2, f1 * f3, f2 * f3]
      }
      case 'distributiva': return [a * (b - ex.answer), a * ex.answer]
      case 'estimar': {
        const place = ex.place ?? 10
        return [Math.round(a / place) * place, Math.round(b / place) * place]
      }
      default: return []
    }
  }

  for (const family of NEW_FAMILIES) {
    it(`${family}: no level mentions the answer or an intermediate result (300 seeds)`, () => {
      for (const ex of mentalItems(family)) {
        const hints = hintsFor(ex)
        const statement = ex.prompt
        for (const n of [ex.answer, ...intermediates(ex)]) {
          if (mentions(statement, n)) continue
          for (const h of hints) expect(mentions(h.text, n), `${ex.id} L${h.level} mentions ${n}: ${h.text}`).toBe(false)
        }
      }
    })
  }
})

describe('signo igual o distinto (eq:same)', () => {
  const items = (count = SEEDS, seed = 5): EquationExercise[] =>
    generate({ skills: ['eq:same'] }, count, { rng: createRng(seed), now }).map((ex) => {
      if (ex.kind !== 'equation') throw new Error('expected equation')
      return ex
    })

  it('has no blank, answers = or ≠, and the = case really has equal sides', () => {
    for (const ex of items()) {
      expect(ex.mode).toBe('same')
      expect([...ex.left, ...ex.right].every((t) => t !== null)).toBe(true)
      expect(['=', '≠']).toContain(ex.answer)
      const value = (side: typeof ex.left) => evaluate(side.map((t) => String(t)).join(' ').replace(/−/g, '−'))
      const same = value(ex.left) === value(ex.right)
      expect(ex.answer, ex.id).toBe(same ? '=' : '≠')
    }
  })

  it('the answer is ≠ about half of the time', () => {
    const all = items(SEEDS, 9)
    const apart = all.filter((ex) => ex.answer === '≠').length
    expect(apart / all.length).toBeGreaterThan(0.35)
    expect(apart / all.length).toBeLessThan(0.65)
  })

  it('check: the tapped sign is judged; an empty sign is incomplete; the feedback never names the right sign', () => {
    const ex = items(1, 21)[0]
    const right = ex.answer as '=' | '≠'
    const other = right === '=' ? '≠' : '='
    expect(check(ex, { type: 'sign', sign: right }).correct).toBe(true)
    expect(check(ex, { type: 'sign', sign: other }).correct).toBe(false)
    expect(check(ex, { type: 'sign', sign: null }).errorType).toBe('incomplete')
    for (const sign of ['=', '≠'] as const) {
      const r = check(ex, { type: 'sign', sign })
      if (!r.correct) expect(r.feedback).not.toMatch(/[=≠]/)
    }
  })

  it('hints: three levels that never name = or ≠, nor say whether the sides agree, nor give a side value (300 seeds)', () => {
    for (const ex of items(SEEDS, 13)) {
      const hints = hintsFor(ex)
      expect(hints.map((h) => h.level), ex.id).toEqual([1, 2, 3])
      const statement = [...ex.left, ...ex.right].map(String).join(' ')
      const values = [evaluate(ex.left.map(String).join(' ')), evaluate(ex.right.map(String).join(' '))]
      for (const h of hints) {
        expect(h.text, `${ex.id} L${h.level}`).not.toMatch(/[=≠]/)
        expect(h.text, `${ex.id} L${h.level}`).not.toMatch(/\b(iguales?|distint[oa]s?|mismo número)\b/i)
        for (const v of values) if (!mentions(statement, v)) expect(mentions(h.text, v), `${ex.id} L${h.level}: ${h.text}`).toBe(false)
      }
    }
  })
})

/** Keeps the import of Exercise used for type narrowing in the helpers above. */
export type _Exercise = Exercise
export const _fmt = fmt
