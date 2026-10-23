/* The four subtraction methods: the written steps each one expects, the grading of those steps, and the hints (which
   must lead to the answer without giving it). One block per method, as the child meets them. */
import { describe, expect, it } from 'vitest'
import {
  borrowMarks, check, compensationSteps, DEFAULT_METHOD, hintsFor, isSubMethod, lineStops, makeColumnSub, methodLabel,
  normaliseSubMethod, partsResults, subtrahendParts, SUB_METHODS,
} from '@/engine'
import type { Answer, SubMethod } from '@/types'

const digitsOf = (n: number) => String(n).split('').reverse().map(Number)
const digitsAnswer = (n: number, method: SubMethod, carries?: (number | null)[]): Answer => ({
  type: 'digits', digits: digitsOf(n), method, ...(carries ? { carries } : {}),
})

describe('method registry', () => {
  it('lists the four subtraction methods, borrow first, and the default is borrow', () => {
    expect(SUB_METHODS.map((m) => m.id)).toEqual(['borrow', 'carry', 'parts', 'line'])
    expect(DEFAULT_METHOD.sub).toBe('borrow')
  })

  it('names and validates methods; unknown stored values fall back to borrow', () => {
    expect(methodLabel('sub', 'carry')).toBe('Me llevo una abajo')
    expect(isSubMethod('line')).toBe(true)
    expect(isSubMethod('cross')).toBe(false)
    expect(normaliseSubMethod(undefined)).toBe('borrow')
    expect(normaliseSubMethod('parts')).toBe('parts')
  })
})

describe('pedir prestado arriba: the marks on the lenders', () => {
  it('352 − 127: the tens lend, 5 becomes 4', () => {
    expect(borrowMarks(352, 127)).toEqual([null, 4, null])
  })

  it('503 − 128: the zero becomes 9 after it lends to the units, and the hundreds become 4', () => {
    expect(borrowMarks(503, 128)).toEqual([null, 9, 4])
  })

  it('4352 − 1728: two lenders, each with its new value', () => {
    expect(borrowMarks(4352, 1728)).toEqual([null, 4, null, 3])
  })

  it('no borrow, no marks', () => {
    expect(borrowMarks(578, 143).every((m) => m === null)).toBe(true)
  })
})

describe('me llevo una abajo: the +1 on the next subtrahend digit', () => {
  it('352 − 127: the tens of 127 become 3 (2 + 1); the units take a ten', () => {
    const c = compensationSteps(352, 127)
    expect(c.marks).toEqual([null, 3, null])
    expect(c.borrows).toEqual([1, 0, 0])
  })

  it('503 − 128: 2 + 1 = 3 in the tens, which then takes a ten too; 1 + 1 = 2 in the hundreds', () => {
    const c = compensationSteps(503, 128)
    expect(c.marks).toEqual([null, 3, 2])
    expect(c.borrows).toEqual([1, 1, 0])
  })

  it('a 9 that receives the +1 becomes 0 (10 − 10) and the column still takes a ten: 1000 − 199 = 801', () => {
    const c = compensationSteps(1000, 199)
    expect(c.marks).toEqual([null, 0, 2, 1])
    expect(c.borrows).toEqual([1, 1, 1, 0])
  })

  it('the compensated steps give the same difference as the normal subtraction (any pair)', () => {
    for (let b = 1; b < 900; b += 37) {
      for (let a = b + 1; a < 1000; a += 53) {
        const { borrows, adjusted } = compensationSteps(a, b)
        const top = digitsOf(a)
        let value = 0
        for (let k = 0; k < top.length; k++) {
          const d = top[k] + 10 * borrows[k] - adjusted[k]
          expect(d).toBeGreaterThanOrEqual(0)
          expect(d).toBeLessThanOrEqual(9)
          value += d * 10 ** k
        }
        expect(value).toBe(a - b)
      }
    }
  })
})

describe('por partes: the parts and the results after each one', () => {
  it('127 is 100 + 20 + 7, taken largest first; zero parts are skipped', () => {
    expect(subtrahendParts(127)).toEqual([100, 20, 7])
    expect(subtrahendParts(105)).toEqual([100, 5])
    expect(subtrahendParts(300)).toEqual([300])
  })

  it('352 − 127 goes 252, 232, 225', () => {
    expect(partsResults(352, 127)).toEqual([252, 232, 225])
  })
})

describe('saltos en la recta: the stops from the subtrahend up to the minuend', () => {
  it('127 → 352 stops at 130 (next ten), 300 (hundred), 350 (ten); the last jump lands on 352', () => {
    expect(lineStops(127, 352)).toEqual([130, 300, 350])
  })

  it('no stop when the path is already round or too short', () => {
    expect(lineStops(350, 352)).toEqual([])
    expect(lineStops(348, 352)).toEqual([350])
    expect(lineStops(130, 352)).toEqual([300, 350])
  })

  it('every stop lies strictly between the two numbers, in increasing order', () => {
    for (let b = 1; b < 990; b += 61) {
      for (let a = b + 1; a < 1000; a += 47) {
        const stops = lineStops(b, a)
        let at = b
        for (const p of stops) {
          expect(p).toBeGreaterThan(at)
          expect(p).toBeLessThan(a)
          at = p
        }
      }
    }
  })
})

describe('grading: borrow and carry marks are checked where the child writes them', () => {
  const ex = makeColumnSub(352, 127)

  it('borrow: the right result and the right lender mark are correct', () => {
    expect(check(ex, digitsAnswer(225, 'borrow', [null, 4, null])).correct).toBe(true)
  })

  it('borrow: an empty mark is not wrong, a wrong written mark is, at its column', () => {
    expect(check(ex, digitsAnswer(225, 'borrow')).correct).toBe(true)
    const r = check(ex, digitsAnswer(225, 'borrow', [null, 3, null]))
    expect(r.correct).toBe(false)
    expect(r.wrongColumns).toEqual([1])
    expect(r.feedback).toContain('tachado')
  })

  it('carry: the right +1 mark is correct, a wrong one is graded', () => {
    expect(check(ex, digitsAnswer(225, 'carry', [null, 3, null])).correct).toBe(true)
    const r = check(ex, digitsAnswer(225, 'carry', [null, 4, null]))
    expect(r.correct).toBe(false)
    expect(r.wrongColumns).toEqual([1])
    expect(r.feedback).toContain('le sumas 1')
  })

  it('a wrong result is still a wrong result, whatever the marks say', () => {
    const r = check(ex, digitsAnswer(226, 'carry', [null, 3, null]))
    expect(r.correct).toBe(false)
  })
})

describe('grading: por partes and saltos answer with steps', () => {
  const ex = makeColumnSub(352, 127)
  const steps = (values: (number | null)[], method: 'parts' | 'line' = 'parts', total?: number | null): Answer =>
    method === 'parts' ? { type: 'steps', method, values } : { type: 'steps', method, values, total }

  it('parts: each result follows from the one before, the last one is the answer', () => {
    expect(check(ex, steps([252, 232, 225])).correct).toBe(true)
  })

  it('parts: a wrong step is named, and the rest is not judged against it', () => {
    const r = check(ex, steps([252, 230, 223]))
    expect(r.correct).toBe(false)
    expect(r.feedback).toContain('paso 2')
    expect(r.feedback).toContain('quitarle 20')
  })

  it('parts: missing steps are incomplete, not wrong', () => {
    const r = check(ex, steps([252, null, null]))
    expect(r.correct).toBe(false)
    expect(r.errorType).toBe('incomplete')
  })

  it('line: the stops rise from 127 to 352, and the total is the sum of the jumps', () => {
    expect(check(ex, steps([130, 300, 350], 'line', 225)).correct).toBe(true)
  })

  it('line: a stop that goes back is graded at its jump; a wrong total is graded at the total', () => {
    const back = check(ex, steps([130, 120, 350], 'line', 225))
    expect(back.correct).toBe(false)
    expect(back.feedback).toContain('salto 2')
    const total = check(ex, steps([130, 300, 350], 'line', 224))
    expect(total.correct).toBe(false)
    expect(total.feedback).toContain('Suma')
  })

  it('line: the total is required', () => {
    expect(check(ex, steps([130, 300, 350], 'line', null)).errorType).toBe('incomplete')
  })
})

describe('hints of each method lead to the answer without giving it', () => {
  const PAIRS: [number, number][] = [[352, 127], [503, 128], [4352, 1728], [845, 377], [600, 245], [742, 258]]
  const METHODS: SubMethod[] = ['borrow', 'carry', 'parts', 'line']

  it.each(METHODS)('%s: three levels, and no hint states the difference', (method) => {
    for (const [a, b] of PAIRS) {
      const ex = makeColumnSub(a, b)
      const hints = hintsFor(ex, method)
      expect(hints.map((h) => h.level)).toEqual([1, 2, 3])
      for (const h of hints) {
        expect(h.text.length).toBeGreaterThan(0)
        expect(h.text, `${method} ${a}−${b}`).not.toMatch(new RegExp(`(^|[^0-9])${ex.answer}([^0-9]|$)`))
      }
    }
  })

  it('the default hints (no method) are still the borrow ones', () => {
    const ex = makeColumnSub(352, 127)
    expect(hintsFor(ex)).toEqual(hintsFor(ex, 'borrow'))
  })

  it('parts names the parts and shows the first result only', () => {
    const hints = hintsFor(makeColumnSub(352, 127), 'parts')
    expect(hints[0].text).toContain('100 + 20 + 7')
    expect(hints[2].text).toContain('252')
    expect(hints[2].text).not.toContain('232')
  })
})
