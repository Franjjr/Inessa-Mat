/* 4.º: multiplicar en columna de menos a más (2 × 2, 3 × 2, 3 × 3). Each item is checked with plain arithmetic: the
   partial rows add up to the answer, the check grades the total, and the hints never give the answer or a whole row. */
import { describe, expect, it } from 'vitest'
import { check, createRng, generate, genLongMul, hintsFor, isValidSkill, makeLongMul, mentalSkill, parseSkill, statementOf } from '@/engine'
import { checkLongMul, hintsLongMul } from '@/engine/longmul'
import { toDigits } from '@/engine/arith'
import { buildMental, mentalHints } from '@/engine/calc'
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

  it('a row the child did not write is not blamed (the shift zeros are pre-filled, the row cells are empty)', () => {
    // Row 1 is 92 and row 2 is empty except for its shift zero; the total is wrong (323 for 322).
    const blank: Answer = { type: 'long-mul', rows: [[2, 9, null], [0, null, null]], total: [3, 2, 3] }
    const res = checkLongMul(ex, blank)
    expect(res.correct).toBe(false)
    expect(res.feedback).not.toMatch(/fila de las/)
    expect(res.feedback).toMatch(/suma de las filas/)
    expect(res.errorType).not.toBe('place-value')
  })

  it('a row the child did write wrongly is still named, even next to a blank row', () => {
    const wrongRow: Answer = { type: 'long-mul', rows: [[1, 1, null], [0, null, null]], total: [3, 2, 3] }
    const res = checkLongMul(ex, wrongRow)
    expect(res.correct).toBe(false)
    expect(res.feedback).toMatch(/fila de las unidades/)
  })

  it('check() routes the long-mul answer through the dispatcher', () => {
    expect(check(ex, totalAnswer(ex)).correct).toBe(true)
    expect(check(ex, { type: 'number', value: 322 }).correct).toBe(false)
  })
})

describe('hintsLongMul', () => {
  it('the carry hint matches the view: the rows and the total are written, no separate row of carries', () => {
    const ex = makeLongMul(23, 14)
    expect(hintsLongMul(ex)[2].text).not.toMatch(/llevad/)
  })

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

describe('mental:triples hints', () => {
  it('no hint contains the answer 3a nor the double 2a (300 seeds, all three levels)', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const ex = buildMental('triples', createRng(seed), new Set())
      const hints = mentalHints(ex)
      expect(hints.map((h) => h.level)).toEqual([1, 2, 3])
      for (const h of hints) {
        expect(h.text, `a=${ex.a}`).not.toContain(String(ex.answer))
        expect(h.text, `a=${ex.a}`).not.toContain(String(2 * ex.a))
      }
    }
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

/** Carries of one partial row: top × one digit, column by column (toDigits is units first). */
function rowCarries(top: number, d: number): number[] {
  const out: number[] = []
  let carry = 0
  for (const t of toDigits(top)) {
    const p = t * d + carry
    carry = Math.floor(p / 10)
    out.push(carry)
  }
  return out.slice(0, -1)
}

describe('the gentle entry of 3.º (mul:col:2x2:suave)', () => {
  it('is a valid skill of its own, parsed as a gentle 2 × 2 in columns', () => {
    expect(isValidSkill('mul:col:2x2:suave')).toBe(true)
    expect(parseSkill('mul:col:2x2:suave')).toEqual({ type: 'mulCol', top: 2, bottom: 2, gentle: true })
    expect(isValidSkill('mul:col:3x2:suave')).toBe(false)
  })

  it('the second factor has tens 1, or every carry of both rows is small (1 or 2); 400 seeds', () => {
    let tensOne = 0
    for (let seed = 1; seed <= 400; seed++) {
      const [ex] = generate({ skills: ['mul:col:2x2:suave'] }, 1, { rng: createRng(seed) }) as LongMulExercise[]
      expect(ex.kind).toBe('long-mul')
      expect(ex.skill).toBe('mul:col:2x2:suave')
      expect(String(ex.top)).toHaveLength(2)
      expect(String(ex.bottom)).toHaveLength(2)
      expect(String(ex.bottom)).not.toContain('0')
      expect(ex.top % 10).not.toBe(0)
      expect(ex.partials.reduce((s, p) => s + p, 0)).toBe(ex.answer)
      const [u, t] = toDigits(ex.bottom)
      for (const d of [u, t]) for (const c of rowCarries(ex.top, d)) expect(c, `${ex.top} × ${ex.bottom}`).toBeLessThanOrEqual(2)
      if (t === 1) tensOne++
    }
    // mostly the tens 1 (the row of the tens is the top itself), but not only
    expect(tensOne).toBeGreaterThan(200)
    expect(tensOne).toBeLessThan(400)
  })

  it('the 4.º keys keep the full range: 12-99 × 12-99, with carries in both rows somewhere', () => {
    let bigBoth = false
    let bigTens = false
    for (let seed = 1; seed <= 400; seed++) {
      const ex = genLongMul(createRng(seed), 2, 2)
      expect(ex.skill).toBe('mul:col:2x2')
      const [u, t] = toDigits(ex.bottom)
      if (t >= 5) bigTens = true
      if (Math.max(...rowCarries(ex.top, u)) >= 3 && Math.max(...rowCarries(ex.top, t)) >= 3) bigBoth = true
    }
    expect(bigTens).toBe(true)
    expect(bigBoth).toBe(true)
  })
})
