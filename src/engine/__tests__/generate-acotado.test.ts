/* Bounded selectors: a fixed list of operations (SkillSelector.operands, e.g. the subtractions of a lesson, like its
   worked example) and divisions without a dividend that ends in 0 (SkillSelector.noZeroUnitsDividend). */
import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import type { ColumnAddExercise, ColumnSubExercise, DivisionExercise } from '@/types'

const seeds = Array.from({ length: 40 }, (_, i) => i)

describe('SkillSelector.operands', () => {
  const pool: [number, number][] = [[463, 128], [574, 236], [382, 145]]

  it('a subtraction is always one of the list, minuend on top', () => {
    const seen = new Set<string>()
    for (const seed of seeds) {
      const [ex] = generate({ kinds: ['column-sub'], digits: 3, regroup: 'one', zeros: false, operands: pool }, 1, { rng: createRng(seed) }) as ColumnSubExercise[]
      expect(ex.kind).toBe('column-sub')
      expect(pool.map(([a, b]) => `${a}-${b}`)).toContain(`${ex.minuend}-${ex.subtrahend}`)
      seen.add(`${ex.minuend}-${ex.subtrahend}`)
    }
    // every pair of the list comes out
    expect(seen.size).toBe(3)
  })

  it('a session of three gives the three, without repeating', () => {
    const exs = generate({ kinds: ['column-sub'], operands: pool }, 3, { rng: createRng(7) }) as ColumnSubExercise[]
    expect(new Set(exs.map((e) => e.minuend))).toEqual(new Set([463, 574, 382]))
  })

  it('works for a column sum too', () => {
    for (const seed of seeds.slice(0, 10)) {
      const [ex] = generate({ kinds: ['column-add'], operands: [[247, 135]] }, 1, { rng: createRng(seed) }) as ColumnAddExercise[]
      expect([...ex.operands].sort()).toEqual([135, 247])
    }
  })
})

describe('SkillSelector.noZeroUnitsDividend', () => {
  it('an exact galera never asks for 40 : 4 or 80 : 2', () => {
    for (const seed of Array.from({ length: 200 }, (_, i) => i)) {
      const [ex] = generate({ kinds: ['division'], divisionVariants: ['exact'], noZeroUnitsDividend: true }, 1, { rng: createRng(seed) }) as DivisionExercise[]
      expect(ex.remainder).toBe(0)
      expect(ex.dividend % 10, `${ex.dividend} : ${ex.divisor}`).not.toBe(0)
    }
  })

  it('holds for 3-digit dividends and with a remainder', () => {
    for (const seed of seeds) {
      for (const variant of ['exact', 'rem'] as const) {
        const [ex] = generate({ kinds: ['division'], digits: 3, divisionVariants: [variant], noZeroUnitsDividend: true }, 1, { rng: createRng(seed) }) as DivisionExercise[]
        expect(ex.dividend % 10, `${ex.dividend} : ${ex.divisor}`).not.toBe(0)
      }
    }
  })

  it('without it, the exact divisions may still end in 0 (nothing changes for the other stops)', () => {
    const ends = Array.from({ length: 300 }, (_, seed) => (generate({ kinds: ['division'], divisionVariants: ['exact'] }, 1, { rng: createRng(seed) })[0] as DivisionExercise).dividend % 10)
    expect(ends).toContain(0)
  })
})
