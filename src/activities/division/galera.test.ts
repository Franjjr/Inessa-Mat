import { describe, expect, it } from 'vitest'
import { galeraSteps, quotientOf, remainderOf } from './galera'

describe('galeraSteps', () => {
  it('divides 84 by 4 digit by digit (Decenas: 8 ÷ 4 = 2, Unidades: 4 ÷ 4 = 1)', () => {
    const steps = galeraSteps(84, 4)
    expect(steps).toEqual([
      { startIndex: 0, endIndex: 0, partial: 8, quotientDigit: 2, product: 8, remainder: 0 },
      { startIndex: 1, endIndex: 1, partial: 4, quotientDigit: 1, product: 4, remainder: 0 },
    ])
    expect(quotientOf(steps)).toBe(21)
    expect(remainderOf(steps)).toBe(0)
  })

  it('uses one step with a remainder for 17 ÷ 5 (5 × 3 = 15, resto 2)', () => {
    const steps = galeraSteps(17, 5)
    expect(steps).toHaveLength(1)
    expect(steps[0]).toMatchObject({ partial: 17, quotientDigit: 3, product: 15, remainder: 2 })
    expect(quotientOf(steps)).toBe(3)
    expect(remainderOf(steps)).toBe(2)
  })

  it('brings digits down when the first digit is too small (72 ÷ 3 = 24)', () => {
    const steps = galeraSteps(72, 3)
    expect(steps.map((s) => s.partial)).toEqual([7, 12])
    expect(steps.map((s) => s.quotientDigit)).toEqual([2, 4])
    expect(quotientOf(steps)).toBe(24)
  })

  it('writes a zero quotient digit when the brought-down digit is too small (41 ÷ 4)', () => {
    // 41 ÷ 4: the first digit 4 already holds one 4, then the 1 is brought down: 1 ÷ 4 gives 0 with remainder 1
    const steps = galeraSteps(41, 4)
    expect(steps.map((s) => s.partial)).toEqual([4, 1])
    expect(steps.map((s) => s.quotientDigit)).toEqual([1, 0])
    expect(quotientOf(steps)).toBe(10)
    expect(remainderOf(steps)).toBe(1)
    const steps2 = galeraSteps(105, 5)
    expect(steps2.map((s) => s.quotientDigit)).toEqual([2, 1])
    expect(quotientOf(steps2)).toBe(21)
    expect(remainderOf(steps2)).toBe(0)
  })

  it('agrees with integer division for every 2-digit dividend and 1-digit divisor', () => {
    for (let d = 2; d <= 9; d++) {
      for (let n = 10; n <= 99; n++) {
        const steps = galeraSteps(n, d)
        expect(quotientOf(steps)).toBe(Math.floor(n / d))
        expect(remainderOf(steps)).toBe(n % d)
        for (const s of steps) expect(s.remainder).toBeLessThan(d)
      }
    }
  })

  it('rejects impossible input', () => {
    expect(() => galeraSteps(10, 0)).toThrow(RangeError)
    expect(() => galeraSteps(-1, 2)).toThrow(RangeError)
  })
})
