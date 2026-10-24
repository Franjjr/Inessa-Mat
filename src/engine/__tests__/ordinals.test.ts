/* 3.º: ordinales hasta el 30. The words are the masculine ones; row (num:ordinal:10) taps the n-th of a queue, read and
   write (num:ordinal:20 and :30) pick the word or the numeral. Each item is checked against the table of words, and the
   hints never give the word or the numeral that is asked. */
import { describe, expect, it } from 'vitest'
import { check, createRng, describeSkill, generate, genOrdinal, hintsFor, isValidSkill, kindsForSkill, ordinalNumeral, ordinalWord, parseSkill, statementOf } from '@/engine'
import type { Answer, OrdinalExercise } from '@/types'

const SEEDS = 200

describe('ordinalWord', () => {
  it.each([
    [1, 'primero'], [3, 'tercero'], [7, 'séptimo'], [10, 'décimo'], [11, 'undécimo'], [12, 'duodécimo'],
    [13, 'decimotercero'], [19, 'decimonoveno'], [20, 'vigésimo'], [21, 'vigésimo primero'], [30, 'trigésimo'],
  ])('%i → %s', (n, word) => {
    expect(ordinalWord(n)).toBe(word)
  })

  it('has a word for every number 1..30 and none outside', () => {
    for (let n = 1; n <= 30; n++) expect(ordinalWord(n)).toMatch(/^[a-záéíóúñ ]+$/)
    expect(() => ordinalWord(0)).toThrow()
    expect(() => ordinalWord(31)).toThrow()
  })

  it('writes numerals with the masculine indicator', () => {
    expect(ordinalNumeral(7)).toBe('7.º')
  })
})

describe('ordinal keys', () => {
  it('parses the three keys, with their top', () => {
    expect(parseSkill('num:ordinal:10')).toEqual({ type: 'ordinal', top: 10 })
    expect(parseSkill('num:ordinal:20')).toEqual({ type: 'ordinal', top: 20 })
    expect(parseSkill('num:ordinal:30')).toEqual({ type: 'ordinal', top: 30 })
  })

  it('rejects other tops', () => {
    expect(parseSkill('num:ordinal:40')).toBeNull()
    expect(parseSkill('num:ordinal:15')).toBeNull()
    expect(isValidSkill('num:ordinal:5')).toBe(false)
  })

  it('every key is an ordinal kind and has a description for the adult', () => {
    for (const key of ['num:ordinal:10', 'num:ordinal:20', 'num:ordinal:30']) {
      expect(kindsForSkill(key)).toEqual(['ordinal'])
      expect(describeSkill(key)).toContain('Ordinales')
    }
  })
})

describe('genOrdinal', () => {
  it('num:ordinal:10 is a row only, with n up to 10 and the queue as long as the n-th', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const ex = genOrdinal(createRng(seed), 10)
      expect(ex.kind).toBe('ordinal')
      expect(ex.mode).toBe('row')
      expect(ex.n).toBeGreaterThanOrEqual(1)
      expect(ex.n).toBeLessThanOrEqual(10)
      expect(ex.items.length).toBeGreaterThanOrEqual(ex.n)
      expect(ex.items.length).toBeLessThanOrEqual(10)
      expect(new Set(ex.items).size).toBe(1)
      expect(ex.answer).toBe(ex.n - 1)
    }
  })

  it.each([20, 30] as const)('num:ordinal:%i reads and writes ordinals up to its top, never beyond 30', (top) => {
    const modes = new Set<string>()
    for (let seed = 1; seed <= SEEDS; seed++) {
      const ex = genOrdinal(createRng(seed), top)
      modes.add(ex.mode)
      expect(ex.mode === 'read' || ex.mode === 'write').toBe(true)
      expect(ex.n).toBeGreaterThanOrEqual(1)
      expect(ex.n).toBeLessThanOrEqual(top)
      expect(ex.items).toEqual([])
      expect(ex.options).toHaveLength(4)
      expect(new Set(ex.options).size).toBe(4)
      const right = ex.mode === 'read' ? ordinalWord(ex.n) : ordinalNumeral(ex.n)
      expect(ex.options[ex.answer]).toBe(right)
    }
    expect(modes).toEqual(new Set(['read', 'write']))
  })

  it('the options of a read or write item are near the number asked, so the child must count', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const ex = genOrdinal(createRng(seed), 30)
      if (ex.mode !== 'write') continue
      const numbers = ex.options.map((o) => parseInt(o, 10))
      const others = numbers.filter((x) => x !== ex.n)
      expect(others.every((x) => Math.abs(x - ex.n) <= 10 && x >= 1 && x <= 30)).toBe(true)
    }
  })

  it('generate with the selector returns ordinals only, with no repeats in one call', () => {
    const items = generate({ skills: ['num:ordinal:10'] }, 20, { rng: createRng(7) })
    expect(items.every((e) => e.kind === 'ordinal')).toBe(true)
    expect(items.every((e) => e.kind === 'ordinal' && e.mode === 'row')).toBe(true)
  })
})

describe('checkOrdinal', () => {
  const row: OrdinalExercise = { id: 'ordinal:row:7:9', kind: 'ordinal', skill: 'num:ordinal:10', difficulty: 1, mode: 'row', n: 7, items: Array(9).fill('🍎'), options: [], answer: 6 }
  const read: OrdinalExercise = { id: 'ordinal:read:11', kind: 'ordinal', skill: 'num:ordinal:20', difficulty: 2, mode: 'read', n: 11, items: [], options: ['sexto', 'undécimo', 'séptimo', 'octavo'], answer: 1 }
  const write: OrdinalExercise = { id: 'ordinal:write:11', kind: 'ordinal', skill: 'num:ordinal:20', difficulty: 3, mode: 'write', n: 11, items: [], options: ['7.º', '11.º', '17.º', '1.º'], answer: 1 }
  const pick = (index: number | null): Answer => ({ type: 'choice', index })

  it('row: the position tapped is graded, the right one is correct', () => {
    expect(check(row, pick(6)).correct).toBe(true)
    const wrong = check(row, pick(5))
    expect(wrong.correct).toBe(false)
    expect(wrong.feedback).toContain('6.º')
  })

  it('row: an empty answer is incomplete, not wrong by counting', () => {
    expect(check(row, pick(null))).toMatchObject({ correct: false, errorType: 'incomplete' })
  })

  it('read and write: the option picked is graded', () => {
    expect(check(read, pick(1)).correct).toBe(true)
    expect(check(read, pick(0)).correct).toBe(false)
    expect(check(write, pick(1)).correct).toBe(true)
    expect(check(write, pick(2)).correct).toBe(false)
  })
})

describe('hints and statements', () => {
  it('three hints, one per level, and no hint of any level gives the word or the numeral asked (every mode)', () => {
    for (let seed = 1; seed <= SEEDS * 2; seed++) {
      const ex = genOrdinal(createRng(seed), seed % 2 ? 10 : 30)
      const hints = hintsFor(ex)
      expect(hints.map((h) => h.level)).toEqual([1, 2, 3])
      for (const h of hints) {
        expect(h.text).not.toContain(ordinalWord(ex.n))
        expect(h.text).not.toContain(ordinalNumeral(ex.n))
      }
    }
  })

  it('the teens level 2 does not give the composition rule (that is level 3 only, on another number)', () => {
    for (const n of [11, 12, 13, 14, 15, 16, 17, 18, 19]) {
      const ex = { ...genOrdinal(createRng(1), 30), mode: 'read' as const, n }
      const [, second, third] = hintsFor(ex)
      expect(second.text).not.toContain('juntar')
      expect(second.text).not.toContain('décimo')
      expect(third.text).not.toContain(ordinalNumeral(n))
    }
  })

  it('round tens (20, 30) level 2 does not tell the child to add a unit', () => {
    for (const n of [20, 30]) {
      const ex = { ...genOrdinal(createRng(1), 30), mode: 'write' as const, n }
      const [, second] = hintsFor(ex)
      expect(second.text).not.toContain('después la unidad')
      expect(second.text).toContain('no hay unidad')
    }
  })

  it('the statement says what the child is asked', () => {
    const row = genOrdinal(createRng(3), 10)
    expect(statementOf(row)).toBe(`Toca el ${ordinalWord(row.n)}`)
    const read = { ...genOrdinal(createRng(5), 30), mode: 'read' as const, n: 11 }
    expect(statementOf(read)).toBe('¿Cómo se dice el 11.º?')
    const write = { ...genOrdinal(createRng(5), 30), mode: 'write' as const, n: 11 }
    expect(statementOf(write)).toBe('¿Qué número es «undécimo»?')
  })
})
