/* Division methods and the 3-digit division: repartir por partes and multiplicar hacia arriba as pure arithmetic, their
   grading through check(), the 3-digit generator and its galera, and the hints that name the method without the result. */
import { describe, expect, it } from 'vitest'
import type { Answer, DivisionExercise, DivMethod } from '@/types'
import { check, climbProducts, climbQuotient, createRng, divisionParts, divisionPartsResult, hintsFor, makeDivision3, generate } from '@/engine'
import { galeraSteps, quotientOf, remainderOf } from '../../activities/division/galera'

const DIVIDENDS = Array.from({ length: 990 }, (_, i) => i + 10)
const DIVISORS = [2, 3, 4, 5, 6, 7, 8, 9]

describe('repartir por partes', () => {
  it('the parts add up to the dividend, and their quotients give the quotient and the remainder', () => {
    for (const n of DIVIDENDS) {
      for (const d of DIVISORS) {
        const r = divisionPartsResult(n, d)
        expect(r.quotient, `${n} ÷ ${d}`).toBe(Math.floor(n / d))
        expect(r.remainder, `${n} ÷ ${d}`).toBe(n % d)
        const steps = divisionParts(n, d)
        expect(steps.reduce((s, p) => s + p.part, 0), `${n} parts`).toBe(n)
      }
    }
  })

  it('84 ÷ 4 is 80 ÷ 4 plus 4 ÷ 4: the parts are 80 and 4, the quotients 20 and 1', () => {
    const steps = divisionParts(84, 4)
    expect(steps.map((s) => s.part)).toEqual([80, 4])
    expect(steps.map((s) => s.quotient)).toEqual([20, 1])
  })

  it('the remainder of one part joins the next part: 352 ÷ 3 gives 300, 50 and 2 + 2 (the 2 that was left over)', () => {
    const three = divisionParts(352, 3)
    expect(three.map((s) => s.part)).toEqual([300, 50, 2])
    expect(three.map((s) => s.quotient)).toEqual([100, 16, 1])
    expect(three[1].remainder).toBe(2)
    expect(three[2].carried).toBe(2)
    expect(three[2].partial).toBe(4)
    expect(divisionParts(85, 4)[1].carried).toBe(0)
  })
})

describe('multiplicar hacia arriba', () => {
  it('the climb stops at the first product that passes the dividend; the quotient is the count before it', () => {
    for (const n of DIVIDENDS.slice(0, 200)) {
      for (const d of DIVISORS) {
        const products = climbProducts(n, d)
        const last = products[products.length - 1]
        expect(last, `${n} by ${d}`).toBeGreaterThanOrEqual(n)
        expect(products[products.length - 2] ?? 0, `${n} by ${d}`).toBeLessThan(n)
        expect(climbQuotient(n, d)).toBe(Math.floor(n / d))
      }
    }
  })

  it('«¿qué número por 4 da 28?» climbs 4, 8, 12, 16, 20, 24, 28: seven fits', () => {
    expect(climbProducts(28, 4)).toEqual([4, 8, 12, 16, 20, 24, 28])
    expect(climbQuotient(28, 4)).toBe(7)
  })
})

describe('division methods graded by check()', () => {
  const ex = (n: number, d: number): DivisionExercise => makeDivision3(n, d)
  const parts = (n: number, d: number, overrides: Partial<{ parts: (number | null)[]; quotient: number | null; remainder: number | null }> = {}): Answer => {
    const steps = divisionParts(n, d)
    return {
      type: 'division-parts',
      parts: steps.map((s) => s.quotient),
      quotient: steps.reduce((s, p) => s + p.quotient, 0),
      remainder: n % d,
      ...overrides,
    }
  }

  it('repartir por partes: the right parts, total and remainder are correct', () => {
    expect(check(ex(84, 4), parts(84, 4)).correct).toBe(true)
    expect(check(ex(352, 3), parts(352, 3)).correct).toBe(true)
  })

  it('a wrong part is named by its step (fact), and a wrong total or remainder is wrong too', () => {
    const wrongPart = check(ex(84, 4), parts(84, 4, { parts: [19, 1] }))
    expect(wrongPart.correct).toBe(false)
    expect(wrongPart.errorType).toBe('fact')
    expect(wrongPart.feedback).toContain('paso 1')
    expect(check(ex(84, 4), parts(84, 4, { quotient: 20 })).correct).toBe(false)
    expect(check(ex(85, 4), parts(85, 4, { remainder: 0 })).correct).toBe(false)
  })

  it('an incomplete parts answer is incomplete, not wrong by a fact', () => {
    expect(check(ex(84, 4), parts(84, 4, { parts: [20, null] })).errorType).toBe('incomplete')
  })

  it('multiplicar hacia arriba: the rows up to the first one that passes, then the remainder', () => {
    const products = climbProducts(28, 4)
    const ok: Answer = { type: 'climb', products, remainder: 0 }
    expect(check(ex(28, 4), ok).correct).toBe(true)
    // Stopping too early is incomplete, going on past the passing row is wrong.
    expect(check(ex(28, 4), { type: 'climb', products: products.slice(0, 6), remainder: 0 }).errorType).toBe('incomplete')
    expect(check(ex(28, 4), { type: 'climb', products: [...products, 32], remainder: 0 }).correct).toBe(false)
    expect(check(ex(28, 4), { type: 'climb', products: [4, 8, 13], remainder: 0 }).correct).toBe(false)
  })

  it('a climb with a remainder: 29 ÷ 4 stops at 32 and the remainder is 1', () => {
    const products = climbProducts(29, 4)
    expect(products[products.length - 1]).toBe(32)
    expect(check(ex(29, 4), { type: 'climb', products, remainder: 1 }).correct).toBe(true)
    expect(check(ex(29, 4), { type: 'climb', products, remainder: 0 }).correct).toBe(false)
  })
})

describe('3-digit division ÷ 1 digit', () => {
  it('makeDivision3: exact divisions have no remainder, the others do; the dividend has 3 digits', () => {
    const rng = createRng(12)
    const list = generate({ skills: ['div:3x1:exact', 'div:3x1:rem'] }, 60, { rng })
    expect(list.length).toBe(60)
    for (const e of list) {
      expect(e.kind).toBe('division')
      if (e.kind !== 'division') continue
      expect(e.dividend).toBeGreaterThanOrEqual(100)
      expect(e.dividend).toBeLessThanOrEqual(999)
      expect(e.divisor).toBeGreaterThanOrEqual(2)
      expect(e.divisor).toBeLessThanOrEqual(9)
      expect(e.quotient).toBe(Math.floor(e.dividend / e.divisor))
      expect(e.remainder).toBe(e.dividend % e.divisor)
      expect(e.variant === 'exact' ? e.remainder === 0 : e.remainder > 0).toBe(true)
      expect(e.skill).toBe(e.remainder === 0 ? 'div:3x1:exact' : 'div:3x1:rem')
    }
  })

  it('the galera of a 3-digit dividend has one step per digit and ends with the same quotient and remainder', () => {
    for (const n of [384, 707, 999, 100, 205]) {
      for (const d of [2, 4, 7]) {
        const steps = galeraSteps(n, d)
        expect(quotientOf(steps), `${n} ÷ ${d}`).toBe(Math.floor(n / d))
        expect(remainderOf(steps), `${n} ÷ ${d}`).toBe(n % d)
      }
    }
  })
})

describe('the method hints name the method and never the result', () => {
  const methods: DivMethod[] = ['galera', 'galera-short', 'div-parts', 'climb']
  it('no hint of the division methods states the quotient', () => {
    for (const m of methods) {
      for (const [n, d] of [[84, 4], [352, 3], [28, 4], [29, 4], [385, 5]] as const) {
        const e = makeDivision3(n, d)
        const q = e.quotient
        for (const h of hintsFor(e, undefined, { divMethod: m })) {
          // The divisor and the dividend may appear in a hint; the quotient (when it is not one of them) must not.
          if ([n, d as number].includes(q)) continue
          expect(new RegExp(`(^|[^0-9])${q}([^0-9]|$)`).test(h.text), `${m} ${n}÷${d}: ${h.text}`).toBe(false)
        }
      }
    }
  })

  it('each method has three hints, the first being a strategy', () => {
    for (const m of methods) {
      const hs = hintsFor(makeDivision3(84, 4), undefined, { divMethod: m })
      expect(hs.map((h) => h.level)).toEqual([1, 2, 3])
    }
  })

  it('the climb is only a climb for a one-digit quotient; a bigger quotient falls back to the galera hints', () => {
    const big = makeDivision3(384, 4)
    expect(hintsFor(big, undefined, { divMethod: 'climb' })[0].text).toBe(hintsFor(big, undefined, { divMethod: 'galera' })[0].text)
    const small = makeDivision3(28, 4) as DivisionExercise
    expect(hintsFor(small, undefined, { divMethod: 'climb' })[0].text).toContain('pasa')
  })
})
