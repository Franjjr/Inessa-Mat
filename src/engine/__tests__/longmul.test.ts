/* 4.º: multiplicar en columna de menos a más (2 × 2, 3 × 2, 3 × 3). Each item is checked with plain arithmetic: the
   partial rows add up to the answer, the check grades the total, and the hints never give the answer or a whole row. */
import { describe, expect, it } from 'vitest'
import { check, createRng, genLongMul, hintsFor, isValidSkill, makeLongMul, mentalSkill, parseSkill, statementOf } from '@/engine'
import { checkLongMul, hintsLongMul } from '@/engine/longmul'
import { toDigits } from '@/engine/arith'
import { buildMental } from '@/engine/calc'
import { mulColSkill } from '@/engine/skills'
import type { Answer, LongMulExercise } from '@/types'

const SIZES: [2 | 3, 2 | 3][] = [[2, 2], [3, 2], [3, 3]]

const totalAnswer = (ex: LongMulExercise): Answer => ({
  type: 'long-mul',
  rows: ex.partials.map(() => Array.from({ length: toDigits(ex.answer).length }, () => null)),
  total: toDigits(ex.answer),
})

describe('genLongMul', () => {
  it.each(SIZES)('top with %i digits × bottom with %i digits: 200 seeds', (top, bottom) => {
    for (let seed = 1; seed <= 200; seed++) {
      const ex = genLongMul(createRng(seed), top, bottom)
      expect(ex.kind).toBe('long-mul')
      expect(String(ex.top).length).toBe(top)
      expect(String(ex.bottom).length).toBe(bottom)
      expect(ex.bottom).toBeGreaterThan(0)
      expect(String(ex.bottom)).not.toContain('0')
      expect(ex.answer).toBe(ex.top * ex.bottom)
      expect(ex.partials.reduce((s, p) => s + p, 0)).toBe(ex.answer)
      expect(ex.partials).toHaveLength(bottom)
      expect(ex.skill).toBe(mulColSkill(top, bottom))
      expect(isValidSkill(ex.skill)).toBe(true)
      expect(parseSkill(ex.skill)).toEqual({ type: 'mulCol', top, bottom })
    }
  })

  it('partials are the top times each digit of the bottom, units first, already shifted (23 × 14 → [92, 230])', () => {
    const ex = makeLongMul(23, 14)
    expect(ex.partials).toEqual([92, 230])
    expect(ex.answer).toBe(322)
  })

  it('never produces a negative number', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const ex = genLongMul(createRng(seed), 3, 3)
      expect(ex.partials.every((p) => p >= 0)).toBe(true)
    }
  })
})

describe('checkLongMul', () => {
  const ex = makeLongMul(23, 14)

  it('accepts the total even when the partial rows are empty', () => {
    const res = checkLongMul(ex, totalAnswer(ex))
    expect(res.correct).toBe(true)
  })

  it('fails a wrong total, and the partial rows do not rescue it', () => {
    const wrong: Answer = { type: 'long-mul', rows: [[2, 9, null], [null, 3, 2]], total: [2, 2, 2] }
    const res = checkLongMul(ex, wrong)
    expect(res.correct).toBe(false)
    expect(res.expected).toBe('322')
  })

  it('an empty total is incomplete, not wrong', () => {
    const empty: Answer = { type: 'long-mul', rows: [[null, null, null], [null, null, null]], total: [null, null, null] }
    expect(checkLongMul(ex, empty).correct).toBe(false)
    expect(checkLongMul(ex, empty).errorType).toBe('incomplete')
  })

  it('check() routes the long-mul answer through the dispatcher', () => {
    expect(check(ex, totalAnswer(ex)).correct).toBe(true)
    expect(check(ex, { type: 'number', value: 322 }).correct).toBe(false)
  })
})

describe('hintsLongMul', () => {
  it.each(SIZES)('%i × %i: no hint contains the answer or a whole partial row', (top, bottom) => {
    for (let seed = 1; seed <= 120; seed++) {
      const ex = genLongMul(createRng(seed), top, bottom)
      const hints = hintsLongMul(ex)
      expect(hints).toHaveLength(3)
      expect(hints.map((h) => h.level)).toEqual([1, 2, 3])
      for (const h of hints) {
        expect(h.text).not.toContain(String(ex.answer))
        for (const p of ex.partials) expect(h.text).not.toContain(String(p))
      }
    }
  })

  it('is reached through hintsFor', () => {
    const ex = makeLongMul(23, 14)
    expect(hintsFor(ex)).toEqual(hintsLongMul(ex))
  })
})

describe('statement and skills', () => {
  it('the statement names the multiplication, never the answer', () => {
    const ex = makeLongMul(23, 14)
    expect(statementOf(ex)).toBe('23 × 14 = ?')
  })

  it('the three keys are valid skills', () => {
    for (const k of ['mul:col:2x2', 'mul:col:3x2', 'mul:col:3x3']) expect(isValidSkill(k)).toBe(true)
    expect(isValidSkill('mul:col:4x2')).toBe(false)
  })
})

describe('mental:triples', () => {
  it('answer is 3 × a, never above 270, and the item is valid', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const ex = buildMental('triples', createRng(seed), new Set())
      expect(ex.answer).toBe(3 * ex.a)
      expect(ex.answer).toBeLessThanOrEqual(270)
      expect(ex.a).toBeGreaterThanOrEqual(2)
      expect(ex.skill).toBe(mentalSkill('triples'))
    }
  })
})
