/* Encuentra el error and comprobar: every injected error is genuinely wrong and of the tagged type, the engine's own
   diagnosis agrees where it can, grading follows the child's verdict, and the hints never state the right result. */
import { describe, expect, it } from 'vitest'
import type { ErrorHuntExercise } from '@/types'
import {
  addWithoutCarry, checkCheckCalc, checkErrorHunt, checkHints, firstDifferentColumn, genCheckCalc, genErrorHunt,
  huntHints, mulCarryForgot, nudgeDigit, subBorrowForgot, swapDigits,
} from '@/engine/bugs'
import { check, createRng, makeColumnAdd, makeColumnSub, toDigits } from '@/engine'
import { digitAt, digitCount } from '@/engine'

const hunts = (op: 'add' | 'sub' | 'mul', n: number, wrong: boolean, seed = 3) => {
  const rng = createRng(seed + op.length)
  return Array.from({ length: n }, () => genErrorHunt(op, rng, wrong))
}

describe('error injection: the bug models really produce the tagged error', () => {
  it('carry-forgot (addition): the shown result is the sum with no carries at all, and it is wrong', () => {
    const list = hunts('add', 200, true).filter((e) => e.errorType === 'carry-forgot')
    expect(list.length).toBeGreaterThan(10)
    for (const e of list) {
      expect(addWithoutCarry([e.top, e.bottom]), e.id).toBe(e.shown)
      expect(e.shown, e.id).not.toBe(e.answer)
    }
  })

  it('borrow-forgot (subtraction): the shown result is the subtraction that never pays the ten back', () => {
    const list = hunts('sub', 200, true).filter((e) => e.errorType === 'borrow-forgot')
    expect(list.length).toBeGreaterThan(10)
    for (const e of list) {
      expect(subBorrowForgot(e.top, e.bottom), e.id).toBe(e.shown)
      expect(e.shown, e.id).not.toBe(e.answer)
    }
  })

  it('carry-forgot (multiplication): the tens product without the carry of the units', () => {
    const list = hunts('mul', 200, true).filter((e) => e.errorType === 'carry-forgot')
    expect(list.length).toBeGreaterThan(5)
    for (const e of list) {
      expect(mulCarryForgot(e.top, e.bottom), e.id).toBe(e.shown)
      expect(e.shown, e.id).not.toBe(e.answer)
    }
  })

  it('fact: exactly one column is off by one, and place-value: two neighbouring digits are swapped', () => {
    const all = [...hunts('add', 150, true, 9), ...hunts('sub', 150, true, 11), ...hunts('mul', 150, true, 13)]
    const facts = all.filter((e) => e.errorType === 'fact')
    const places = all.filter((e) => e.errorType === 'place-value')
    expect(facts.length).toBeGreaterThan(10)
    expect(places.length).toBeGreaterThan(5)
    for (const e of facts) {
      const col = firstDifferentColumn(e.shown, e.answer)!
      expect(Math.abs(e.shown - e.answer), e.id).toBe(10 ** col)
      expect(nudgeDigit(e.answer, col, e.shown > e.answer ? 1 : -1), e.id).toBe(e.shown)
    }
    for (const e of places) {
      const i = firstDifferentColumn(e.shown, e.answer)!
      expect(swapDigits(e.answer, i, i + 1), e.id).toBe(e.shown)
    }
  })

  it('the wrong column is the first column that differs, counted from the units', () => {
    for (const e of [...hunts('add', 80, true), ...hunts('sub', 80, true, 5), ...hunts('mul', 80, true, 7)]) {
      expect(e.wrongColumn, e.id).toBe(firstDifferentColumn(e.shown, e.answer))
      expect(e.wrongColumn).not.toBeNull()
    }
  })

  it('the engine diagnoses the carry and borrow bugs as the same kind (agreement with check())', () => {
    for (const e of hunts('add', 120, true)) {
      if (e.errorType !== 'carry-forgot') continue
      // The child writes every column of the answer, the leading zeros included.
      const cols = digitCount(e.answer)
      const digits = Array.from({ length: cols }, (_, i) => digitAt(e.shown, i))
      const r = check(makeColumnAdd([e.top, e.bottom]), { type: 'digits', digits })
      expect(r.errorType, e.id).toBe('carry-forgot')
    }
    // A borrow that is never paid back can also look like «smaller from larger» for a column (the same wrong digit):
    // the engine then names that reading. Most cases agree; none gets an unrelated name.
    let agree = 0
    let total = 0
    for (const e of hunts('sub', 120, true)) {
      if (e.errorType !== 'borrow-forgot') continue
      total += 1
      const cols = digitCount(e.top)
      const digits = Array.from({ length: cols }, (_, i) => digitAt(e.shown, i))
      const r = check(makeColumnSub(e.top, e.bottom), { type: 'digits', digits })
      if (r.errorType === 'borrow-forgot') agree += 1
      else expect(['smaller-from-larger', 'fact'], e.id).toContain(r.errorType)
    }
    expect(total).toBeGreaterThan(10)
    expect(agree / total, `${agree} of ${total} agree`).toBeGreaterThan(0.6)
  })

  it('right calculations are right: nothing is wrong and no type is tagged', () => {
    for (const e of [...hunts('add', 40, false), ...hunts('sub', 40, false), ...hunts('mul', 40, false)]) {
      expect(e.shown).toBe(e.answer)
      expect(e.errorType).toBeNull()
      expect(e.wrongColumn).toBeNull()
    }
  })
})

describe('encuentra el error: grading', () => {
  const wrongOne = (): ErrorHuntExercise => hunts('add', 1, true, 21)[0]
  const rightOne = (): ErrorHuntExercise => hunts('add', 1, false, 21)[0]

  it('a right calculation: "está bien" is correct, "hay un error" is a false alarm', () => {
    const ex = rightOne()
    expect(checkErrorHunt(ex, { type: 'hunt', ok: true, column: null, value: null }).correct).toBe(true)
    const alarm = checkErrorHunt(ex, { type: 'hunt', ok: false, column: 0, value: 1 })
    expect(alarm.correct).toBe(false)
    expect(alarm.errorType).toBe('false-alarm')
  })

  it('a wrong calculation: saying it is right misses the error, tagged with the error it carries', () => {
    const ex = wrongOne()
    const res = checkErrorHunt(ex, { type: 'hunt', ok: true, column: null, value: null })
    expect(res.correct).toBe(false)
    expect(res.errorType).toBe(ex.errorType)
  })

  it('a wrong calculation found in the right column with the right result is correct', () => {
    const ex = wrongOne()
    const res = checkErrorHunt(ex, { type: 'hunt', ok: false, column: ex.wrongColumn, value: ex.answer })
    expect(res.correct).toBe(true)
  })

  it('the wrong column, or a wrong result, is wrong and keeps the error type', () => {
    const ex = wrongOne()
    const wrongCol = checkErrorHunt(ex, { type: 'hunt', ok: false, column: (ex.wrongColumn! + 1) % 3, value: ex.answer })
    expect(wrongCol.correct).toBe(false)
    expect(wrongCol.errorType).toBe(ex.errorType)
    const wrongVal = checkErrorHunt(ex, { type: 'hunt', ok: false, column: ex.wrongColumn, value: ex.shown })
    expect(wrongVal.correct).toBe(false)
    expect(wrongVal.errorType).toBe(ex.errorType)
  })

  it('an unanswered verdict is incomplete', () => {
    const res = checkErrorHunt(wrongOne(), { type: 'hunt', ok: null, column: null, value: null })
    expect(res.errorType).toBe('incomplete')
  })

  it('the check() dispatcher routes error-hunt exercises to the same grading', () => {
    const ex = wrongOne()
    expect(check(ex, { type: 'hunt', ok: false, column: ex.wrongColumn, value: ex.answer }).correct).toBe(true)
  })
})

describe('comprobar: claims and grading', () => {
  const claims = (op: 'add' | 'sub' | 'div', ok: boolean, n = 60) => {
    const rng = createRng(77 + op.length + (ok ? 1 : 0))
    return Array.from({ length: n }, () => genCheckCalc(op, rng, ok))
  }

  it('a true claim has the check that returns the left number; a false claim does not', () => {
    for (const ex of claims('add', true)) {
      expect(ex.claimed - ex.right, ex.id).toBe(ex.left)
      expect(ex.answer).toBe(ex.left)
    }
    for (const ex of claims('sub', true)) {
      expect(ex.claimed + ex.right, ex.id).toBe(ex.left)
    }
    for (const ex of claims('div', true)) {
      expect(ex.right * ex.claimed + (ex.remainder ?? 0), ex.id).toBe(ex.left)
      expect(ex.remainder ?? 0).toBeLessThan(ex.right)
    }
    for (const op of ['add', 'sub', 'div'] as const) {
      for (const ex of claims(op, false)) {
        expect(ex.ok, ex.id).toBe(false)
        expect(ex.errorType, ex.id).not.toBeNull()
        expect(ex.answer, ex.id).not.toBe(ex.left)
      }
    }
  })

  it('the wrong claims of a division carry quotient-off, remainder-too-big or place-value', () => {
    const types = new Set(claims('div', false, 120).map((e) => e.errorType))
    expect([...types].every((t) => t === 'quotient-off' || t === 'remainder-too-big' || t === 'place-value')).toBe(true)
  })

  it('verdict and check value: both right is correct; a wrong verdict keeps the claim error; a wrong value is a fact error', () => {
    const wrong = claims('sub', false, 1)[0]
    const right = claims('sub', true, 1)[0]
    expect(checkCheckCalc(right, { type: 'verdict', ok: true, value: right.answer }).correct).toBe(true)
    const miss = checkCheckCalc(wrong, { type: 'verdict', ok: true, value: wrong.answer })
    expect(miss.correct).toBe(false)
    expect(miss.errorType).toBe(wrong.errorType)
    const badValue = checkCheckCalc(right, { type: 'verdict', ok: true, value: right.answer + 1 })
    expect(badValue.errorType).toBe('fact')
    const alarm = checkCheckCalc(right, { type: 'verdict', ok: false, value: right.answer })
    expect(alarm.errorType).toBe('false-alarm')
  })

  it('a missing verdict or value is incomplete', () => {
    const ex = claims('add', true, 1)[0]
    expect(checkCheckCalc(ex, { type: 'verdict', ok: null, value: 3 }).errorType).toBe('incomplete')
    expect(checkCheckCalc(ex, { type: 'verdict', ok: true, value: null }).errorType).toBe('incomplete')
  })
})

describe('hints: never the right result', () => {
  it('hunt hints and check hints do not contain the right result as a number', () => {
    const rng = createRng(4)
    for (let i = 0; i < 80; i++) {
      const h = genErrorHunt(i % 3 === 0 ? 'add' : i % 3 === 1 ? 'sub' : 'mul', rng, i % 2 === 0)
      for (const hint of huntHints(h)) {
        // The operands may appear in a hint; the result must not.
        if ([h.top, h.bottom].includes(h.answer)) continue
        expect(new RegExp(`(^|[^0-9])${h.answer}([^0-9]|$)`).test(hint.text), `${h.id}: ${hint.text}`).toBe(false)
      }
    }
    for (const op of ['add', 'sub', 'div'] as const) {
      const rng2 = createRng(5)
      for (let i = 0; i < 40; i++) {
        const c = genCheckCalc(op, rng2, i % 2 === 0)
        for (const hint of checkHints(c)) {
          if ([c.left, c.right, c.claimed].includes(c.answer)) continue
          expect(new RegExp(`(^|[^0-9])${c.answer}([^0-9]|$)`).test(hint.text), `${c.id}: ${hint.text}`).toBe(false)
        }
      }
    }
  })

  it('toDigits is used by the checker: the digit helpers agree with the numbers', () => {
    expect(toDigits(352)).toEqual([2, 5, 3])
  })
})
