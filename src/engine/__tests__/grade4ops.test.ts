/* 4.º: multiplicar 3 × 1 y por dos cifras por partes, dividir 4 cifras, por 10/100/1 000, números romanos, redondear a
   millares, área y simetría. Each item is checked with independent arithmetic; the hints never give the answer. */
import { describe, expect, it } from 'vitest'
import { check, createRng, describeSkill, generate, hintsFor, isValidSkill, makeMulParts, parseSkill, statementOf } from '@/engine'
import type { Answer, Exercise } from '@/types'

const SKILLS = [
  'mul:3x1:c0', 'mul:3x1:c1', 'div:4x1:exact', 'div:4x1:rem', 'mul:2dx2d', 'mul:3dx2d',
  'mental:por10', 'mental:romanos', 'num:round:1000', 'geo:area', 'geo:symmetry',
]

/** Roman numeral read back with the subtraction rule, independently of the engine. */
function fromRoman(r: string): number {
  const v: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 }
  let total = 0
  for (let i = 0; i < r.length; i++) total += v[r[i]] < (v[r[i + 1]] ?? 0) ? -v[r[i]] : v[r[i]]
  return total
}

function rightAnswer(ex: Exercise): Answer {
  switch (ex.kind) {
    case 'column-mul': return { type: 'number', value: ex.answer }
    case 'division': return { type: 'division', quotient: ex.quotient, remainder: ex.remainder }
    case 'mul-parts': return { type: 'numbers', values: [...ex.partials, ex.answer] }
    case 'shape-choice': return { type: 'choice', index: ex.answer }
    default: return { type: 'number', value: (ex as { answer: number }).answer }
  }
}

function verify(ex: Exercise): void {
  switch (ex.kind) {
    case 'column-mul': {
      expect(ex.answer).toBe(ex.top * ex.bottom)
      expect(String(ex.top)).toHaveLength(3)
      const carries = String(ex.top).split('').some((d) => Number(d) * ex.bottom >= 10)
      expect(carries, ex.id).toBe(ex.skill === 'mul:3x1:c1')
      break
    }
    case 'division':
      expect(ex.dividend).toBeGreaterThanOrEqual(1000)
      expect(ex.dividend).toBeLessThanOrEqual(9999)
      expect(ex.quotient * ex.divisor + ex.remainder).toBe(ex.dividend)
      expect(ex.remainder).toBeLessThan(ex.divisor)
      expect(ex.remainder === 0).toBe(ex.skill === 'div:4x1:exact')
      break
    case 'mul-parts':
      expect(ex.units + ex.tens).toBe(ex.bottom)
      expect(ex.units).toBeGreaterThan(0)
      expect(ex.partials).toEqual([ex.top * ex.units, ex.top * ex.tens])
      expect(ex.answer).toBe(ex.top * ex.bottom)
      break
    case 'mental':
      if (ex.family === 'romanos') expect(fromRoman(ex.prompt.match(/es ([IVXLC]+)\?/)![1])).toBe(ex.answer)
      if (ex.family === 'por10') {
        const [, x, op, y] = ex.prompt.replace(/ /g, '').match(/^(\d+)([×:])(\d+)=\?$/)!
        expect(op === '×' ? Number(x) * Number(y) : Number(x) / Number(y)).toBe(ex.answer)
        expect([10, 100, 1000]).toContain(Number(y))
      }
      break
    case 'round':
      expect(ex.answer).toBe(Math.round(ex.value / 1000) * 1000)
      expect(ex.answer).toBeLessThanOrEqual(9000)
      break
    case 'area':
      expect(ex.answer).toBe(ex.figure.filled.length)
      expect(new Set(ex.figure.filled.map(([r, c]) => `${r},${c}`)).size).toBe(ex.answer)
      break
    case 'shape-choice': {
      const f = ex.figures[0]
      if (f.type !== 'grid' || !f.axis) throw new Error('no grid')
      const set = new Set(f.filled.map(([r, c]) => `${r},${c}`))
      const mirrored = f.filled.every(([r, c]) => set.has(f.axis!.dir === 'v' ? `${r},${2 * f.axis!.at - 1 - c}` : `${2 * f.axis!.at - 1 - r},${c}`))
      expect(ex.options[ex.answer]).toBe(mirrored ? 'Sí' : 'No')
      break
    }
    default:
      throw new Error(`unexpected ${ex.kind}`)
  }
}

describe('4.º: operations, numbers and geometry', () => {
  it.each(SKILLS)('%s: verified, the right answer passes and no hint gives it away', (skill) => {
    expect(isValidSkill(skill)).toBe(true)
    expect(describeSkill(skill)).not.toBe(skill)
    for (let seed = 1; seed <= 50; seed++) {
      for (const ex of generate({ skills: [skill] }, 4, { rng: createRng(seed) })) {
        expect(ex.skill, ex.id).toBe(skill)
        verify(ex)
        expect(check(ex, rightAnswer(ex)).correct, ex.id).toBe(true)
        const hints = hintsFor(ex)
        expect(hints).toHaveLength(3)
        if (ex.kind !== 'shape-choice') {
          const answer = String((ex as { answer: number }).answer)
          for (const h of hints) expect(h.text.replace(/(\d) (\d)/g, '$1$2').split(/\D+/), `${ex.id}: ${h.text}`).not.toContain(answer)
        }
        expect(statementOf(ex).length).toBeGreaterThan(0)
      }
    }
  })

  it('the fact skills 2×2 and 3×2 are still facts: the new keys do not clash', () => {
    expect(parseSkill('mul:2x2')).toEqual({ type: 'mul', a: 2, b: 2 })
    expect(parseSkill('mul:2dx2d')).toEqual({ type: 'mulParts', digits: 2 })
  })

  it('multiplying by parts names the forgotten zero and a wrong partial', () => {
    const ex = makeMulParts(23, 14)
    expect(ex.partials).toEqual([92, 230])
    expect(check(ex, { type: 'numbers', values: [92, 23, 115] })).toMatchObject({ correct: false, errorType: 'place-value' })
    expect(check(ex, { type: 'numbers', values: [82, 230, 312] })).toMatchObject({ correct: false, errorType: 'fact' })
    expect(check(ex, { type: 'numbers', values: [92, 230, null] })).toMatchObject({ correct: false, errorType: 'incomplete' })
    expect(check(ex, { type: 'numbers', values: [92, 230, 322] }).correct).toBe(true)
  })
})
