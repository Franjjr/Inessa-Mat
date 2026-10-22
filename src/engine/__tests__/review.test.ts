/* Regression tests for the issues found in the senior review of the engine (each block names the defect). */
import { describe, expect, it } from 'vitest'
import {
  check, createRng, generate, hintsFor, makeArray, makeColumnAdd, makeColumnMul, makeColumnSub, makeDivision,
  makeFactDiv, makeFactFamily, makeFactMul, makeMissingFactor, makeWordProblem, newMastery, strategyForFact,
} from '@/engine'
import { genDivision } from '@/engine/numbers'
import type { Answer, DivisionExercise, GroupsExercise, ArrayExercise, MasteryMap } from '@/types'
import { digits } from './helpers'

const dig = (n: number | (number | null)[]): Answer => ({ type: 'digits', digits: Array.isArray(n) ? n : digits(n) })
const div = (quotient: number | null, remainder: number | null): Answer => ({ type: 'division', quotient, remainder })

describe('groups / arrays honour factorRange even without tables', () => {
  it('w1 selectors: { kinds: [groups], factorRange: [2, 5] } never shows 6 groups', () => {
    for (let seed = 1; seed <= 300; seed++) {
      for (const e of generate({ kinds: ['groups'], factorRange: [2, 5] }, 6, { rng: createRng(seed) }) as GroupsExercise[]) {
        expect(e.groups, e.id).toBeGreaterThanOrEqual(2)
        expect(e.groups, e.id).toBeLessThanOrEqual(5)
        expect(e.perGroup, e.id).toBeGreaterThanOrEqual(2)
        expect(e.perGroup, e.id).toBeLessThanOrEqual(5)
      }
      for (const e of generate({ kinds: ['array'], factorRange: [2, 6] }, 6, { rng: createRng(seed) }) as ArrayExercise[]) {
        expect(Math.max(e.rows, e.cols), e.id).toBeLessThanOrEqual(6)
        expect(Math.min(e.rows, e.cols), e.id).toBeGreaterThanOrEqual(2)
      }
    }
  })
  it('with tables, the table is the size of each group and factorRange bounds the number of groups', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const e of generate({ kinds: ['groups'], tables: [6], factorRange: [2, 4] }, 3, { rng: createRng(seed) }) as GroupsExercise[]) {
        expect(e.perGroup).toBe(6)
        expect(e.groups >= 2 && e.groups <= 4).toBe(true)
      }
    }
  })
})

describe('feedback names only the columns that show the diagnosed error', () => {
  it('368 + 257 written 5115: only the tens forgot the carry', () => {
    const r = check(makeColumnAdd([368, 257]), dig([5, 1, 1, 5]))
    expect(r.errorType).toBe('carry-forgot')
    expect(r.wrongColumns).toEqual([1, 2, 3])
    expect(r.feedback).toBe('¡Ojo con la mochila! Te has dejado la llevada en las decenas.')
  })
  it('a cascade of forgotten carries still names every column whose carry was dropped', () => {
    expect(check(makeColumnAdd([368, 257]), dig(515)).feedback).toContain('las decenas y las centenas')
  })
})

describe('subtraction and multiplication feedback speaks about the right operation', () => {
  it('a two-digit cell in a subtraction does not talk about carrying to the next house', () => {
    const r = check(makeColumnSub(734, 459), dig([15, 7, 2]))
    expect(r.errorType).toBe('other')
    expect(r.wrongColumns).toEqual([0])
    expect(r.feedback).toContain('solo cabe una cifra')
    expect(r.feedback).not.toMatch(/llevada|salta/)
  })
  it('23 × 3 answered 26 (added) → operation with multiplication feedback', () => {
    const r = check(makeColumnMul(23, 3), dig(26))
    expect(r.errorType).toBe('operation')
    expect(r.feedback).toContain('Has sumado')
    expect(r.feedback).toContain('multiplicar cada cifra por 3')
  })
  it('fact division answered with another operation explains division without naming a wrong op', () => {
    const r = check(makeFactDiv(42, 6), { type: 'number', value: 252 })
    expect(r.errorType).toBe('operation')
    expect(r.feedback).toBe('¡Ojo! Aquí hay que dividir: ¿cuántas veces cabe el 6 en el 42?')
  })
})

describe('division (galera): more precise diagnoses', () => {
  it('stopping after the tens (84 ÷ 4 → 2) or forgetting the 0 (70 ÷ 7 → 1) → incomplete', () => {
    for (const [ex, q] of [[makeDivision(84, 4), 2], [makeDivision(70, 7), 1], [makeDivision(72, 3), 2]] as const) {
      const r = check(ex, div(q, ex.dividend === 72 ? 1 : 0))
      expect(r.errorType, ex.id).toBe('incomplete')
      expect(r.feedback).toContain('No te pares')
    }
    expect(check(makeDivision(70, 7), div(1, 0)).feedback).toContain('escribe un 0')
  })
  it('swapped quotient digits (84 ÷ 4 → 12) → misaligned', () => {
    const r = check(makeDivision(84, 4), div(12, 0))
    expect(r.errorType).toBe('misaligned')
    expect(r.feedback).toContain('primero la de las decenas')
  })
  it('subtracting / adding / multiplying instead of dividing → operation', () => {
    for (const q of [80, 88, 336]) expect(check(makeDivision(84, 4), div(q, 0)).errorType).toBe('operation')
    expect(check(makeDivision(84, 4), div(80, 0)).feedback).toBe('¡Ojo! Aquí hay que dividir: repartir 84 entre 4.')
  })
  it('one-digit quotients far off point to the nearest multiple, not to "cifra a cifra"', () => {
    const r = check(makeDivision(29, 4), div(5, 1))
    expect(r.errorType).toBe('fact')
    expect(r.feedback).toBe('¡Casi! Busca en la tabla del 4 el número que más se acerca a 29 sin pasarse.')
    expect(check(makeDivision(96, 3), div(42, 0)).feedback).toContain('cifra a cifra') // one quotient digit wrong
  })
  it('the previous diagnoses are unchanged', () => {
    expect(check(makeDivision(17, 5), div(2, 7)).errorType).toBe('remainder-too-big')
    expect(check(makeDivision(17, 5), div(4, 0)).errorType).toBe('quotient-off')
    expect(check(makeDivision(72, 3), div(20, 2)).feedback).toContain('bájalo')
  })
})

describe('division generation looks like the workbook (48 ÷ 2, 69 ÷ 3, 84 ÷ 4), not like 70 ÷ 7', () => {
  it("'exact': trivial quotient-10 items are rare and ÷2/÷3/÷4 dominate", () => {
    let total = 0
    let tens = 0
    let small = 0
    for (let seed = 1; seed <= 400; seed++) {
      for (const e of generate({ kinds: ['division'], divisionVariants: ['exact'] }, 3, { rng: createRng(seed) }) as DivisionExercise[]) {
        total++
        if (e.dividend % 10 === 0) tens++
        if (e.divisor <= 4) small++
        expect(e.variant).toBe('exact')
        expect(e.remainder).toBe(0)
      }
    }
    expect(tens / total).toBeLessThan(0.15)
    expect(small / total).toBeGreaterThan(0.6)
  })
  it("'rem' still visits every divisor 2..9 roughly evenly; tables restrict the divisor", () => {
    const counts = new Map<number, number>()
    const rng = createRng(11)
    for (let i = 0; i < 1600; i++) {
      const [, d] = genDivision(rng, 'rem')
      counts.set(d, (counts.get(d) ?? 0) + 1)
    }
    for (let d = 2; d <= 9; d++) expect(counts.get(d)!, `÷${d}`).toBeGreaterThan(130)
    for (let i = 0; i < 50; i++) expect([6, 7]).toContain(genDivision(rng, 'exact', [6, 7])[1])
  })
})

describe('adaptive plans spread repeats between known and new items', () => {
  const now = new Date('2026-10-21T10:00:00Z')
  const put = (m: MasteryMap, skill: string, box: number, dueDays: number) => {
    m[skill] = { ...newMastery(skill, now), box: box as 0, attempts: 5, correct: 4, dueAt: new Date(now.getTime() + dueDays * 864e5).toISOString(), lastSeenAt: now.toISOString() }
  }
  it('2 known facts of the 7 + new ones: the known ones are not hammered, new hard facts come back', () => {
    const mastery: MasteryMap = {}
    put(mastery, 'mul:2x7', 3, 2)
    put(mastery, 'mul:5x7', 3, 1)
    for (let seed = 1; seed <= 100; seed++) {
      const exs = generate({ kinds: ['fact-mul'], tables: [7], factorRange: [2, 9], adaptive: true }, 8, { rng: createRng(seed), mastery, now })
      const counts = new Map<string, number>()
      for (const e of exs) counts.set(e.skill, (counts.get(e.skill) ?? 0) + 1)
      expect(Math.max(...counts.values()), JSON.stringify([...counts])).toBeLessThanOrEqual(2)
      const known = exs.filter((e) => mastery[e.skill]).length
      expect(known).toBeLessThanOrEqual(4)
      const fresh = [...counts.keys()].filter((s) => !mastery[s])
      expect(fresh.length).toBeLessThanOrEqual(3)
      expect(fresh.some((s) => counts.get(s)! >= 2)).toBe(true)
    }
  })
  it('a brand-new child repeats the hard new facts before the trivial ×1 / ×10 ones', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const exs = generate({ kinds: ['fact-mul'], tables: [6], adaptive: true }, 10, { rng: createRng(seed), mastery: {}, now })
      const counts = new Map<string, number>()
      for (const e of exs) counts.set(e.skill, (counts.get(e.skill) ?? 0) + 1)
      expect(counts.get('mul:1x6') ?? 0).toBeLessThanOrEqual(1)
      expect(counts.get('mul:6x10') ?? 0).toBeLessThanOrEqual(1)
      for (let i = 1; i < exs.length; i++) expect(exs[i].skill).not.toBe(exs[i - 1].skill)
    }
  })
})

describe('robustness and hint consistency', () => {
  it('fact families tolerate non-string entries from a view', () => {
    const fam = makeFactFamily(6, 7)
    const r = check(fam, { type: 'facts', facts: ['6x7=42', null, 42, '42/6=7'] as unknown as string[] })
    expect(r.correct).toBe(false)
    expect(r.errorType).toBe('other')
    expect(check(fam, { type: 'facts', facts: undefined as unknown as string[] }).errorType).toBe('incomplete')
  })
  it('small arrays: worked step adds row by row with the array visual', () => {
    const hs = hintsFor(makeArray(4, 2, '⭐'))
    expect(hs[2]).toMatchObject({ text: 'Fila a fila: 2 + 2 + 2 + 2 = ?', visual: 'array', params: { rows: 4, cols: 2 } })
  })
  it('missing factor: the counting worked step uses the skip-count visual', () => {
    expect(hintsFor(makeMissingFactor(4, 4, 'b'))[2]).toMatchObject({ visual: 'skip-count', params: { step: 4, count: 4, index: 3 } })
  })
  it('word-problem hints use the same visual params as the column / division exercises', () => {
    const add = hintsFor(makeWordProblem('add-peces', 'x', 'add', 368, 257, 'peces'))
    expect(add[1]).toMatchObject({ visual: 'place-value', params: { operands: [368, 257], a: 368, b: 257, digits: 3 } })
    expect(add[2]).toMatchObject({ visual: 'carry', params: { column: 0, carry: 1 } })
    const sub = hintsFor(makeWordProblem('sub-tazas', 'x', 'sub', 503, 128, 'tazas'))
    expect(sub[1]).toMatchObject({ visual: 'borrow', params: { a: 503, b: 128, digits: 3, column: 0 } })
    // "9 filas de 55 flores": a column scaffold, not 495 objects in a groups picture.
    const big = hintsFor(makeWordProblem('mul-flores', 'x', 'mul', 9, 55, 'flores'))
    expect(big[1]).toMatchObject({ visual: 'place-value', params: { top: 55, bottom: 9, tens: 50, units: 5 } })
    expect(big[2]).toMatchObject({ visual: 'carry', text: 'Escribe la operación con el 55 arriba: 55 × 9 = ?', params: { carry: 4 } })
    expect(hintsFor(makeWordProblem('mul-setas', 'x', 'mul', 4, 6, 'setas'))[1]).toMatchObject({ visual: 'groups', params: { groups: 4, perGroup: 6 } })
    expect(hintsFor(makeWordProblem('div-hadas', 'x', 'div', 48, 4, 'estrellas'))[2].params).toEqual({ total: 48, groups: 4, dividend: 48, divisor: 4 })
  })
  it('a cell holding two digits is shown in brackets in `given`', () => {
    expect(check(makeColumnSub(734, 459), dig([15, 7, 2])).given).toBe('27[15]')
    expect(check(makeColumnAdd([245, 137]), dig([12, 8, 3])).given).toBe('38[12]')
  })
  it('long division hint when nothing is left over in the tens (fixed spells like 85 ÷ 4)', () => {
    const t = hintsFor(makeDivision(85, 4))[2].text
    expect(t).toBe('Decenas: 8 ÷ 4 = 2 y no sobra nada. Ahora baja el 5: 5 ÷ 4 = ?')
  })
})

describe('senior review, round 2', () => {
  it('the mirror of a Cave fact (7 × 6) shows the Cave visual with the table orientation (6, 7) at the worked step', () => {
    const h = hintsFor(makeFactMul(7, 6))
    expect(h[1]).toMatchObject({ visual: 'mirror', params: { a: 7, b: 6 } })
    expect(h[2]).toMatchObject({ visual: 'dots-five-plus-one', params: { a: 6, b: 7 } })
    expect(h[2].text).toBe('5 × 7 = 35. Y una fila más: 35 + 7 = ?')
  })

  it('the 5 trick is worded as a calculation, not as an equality', () => {
    expect(strategyForFact(5, 6).text).toBe('La del 5 acaba en 0 o en 5: calcula 6 × 10 = 60 y toma la mitad.')
  })

  it('a missing or malformed answer still reports the real expected answer in the log', () => {
    expect(check(makeFactMul(7, 6), null as unknown as Answer).expected).toBe('42')
    expect(check(makeFactMul(7, 6), { type: 'facts', facts: [] }).expected).toBe('42')
    expect(check(makeDivision(84, 4), null as unknown as Answer).expected).toBe('21 resto 0')
    expect(check(makeFactFamily(6, 7), null as unknown as Answer).expected).toBe('6×7=42; 7×6=42; 42÷6=7; 42÷7=6')
  })
})
