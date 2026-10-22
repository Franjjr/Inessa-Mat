import { describe, expect, it } from 'vitest'
import {
  check, createRng, generate, makeArray, makeColumnAdd, makeColumnMul, makeColumnSub, makeDivision, makeDoubleChain,
  makeFactDiv, makeFactFamily, makeFactMul, makeGroups, makeMissingFactor, makeSkipCount, makeWordProblem, parseFact,
} from '@/engine'
import type { Answer, ExerciseKind } from '@/types'
import { correctAnswer, digits } from './helpers'

const num = (value: number | null): Answer => ({ type: 'number', value })
const dig = (n: number | (number | null)[], carries?: (number | null)[]): Answer =>
  ({ type: 'digits', digits: Array.isArray(n) ? n : digits(n), ...(carries ? { carries } : {}) })
const div = (quotient: number | null, remainder: number | null): Answer => ({ type: 'division', quotient, remainder })

const ALL_KINDS: ExerciseKind[] = [
  'fact-mul', 'fact-div', 'missing-factor', 'skip-count', 'groups', 'array', 'double-chain', 'fact-family',
  'column-add', 'column-sub', 'column-mul', 'division', 'word-problem',
]

describe('check — correct answers are always accepted', () => {
  it.each(ALL_KINDS)('%s (1500 generated exercises)', (kind) => {
    for (let seed = 1; seed <= 150; seed++) {
      for (const ex of generate({ kinds: [kind] }, 10, { rng: createRng(seed) })) {
        const r = check(ex, correctAnswer(ex))
        expect(r.correct, `${ex.id} ${JSON.stringify(r)}`).toBe(true)
        expect(r.errorType).toBeUndefined()
        expect(r.given).toBe(r.expected)
        expect(r.feedback && r.feedback.length > 0).toBe(true)
        expect(r.feedback).not.toMatch(/\{(?!child\}|pet\})/)
      }
    }
  })

  it('column answers may arrive as plain numbers; facts as digits; is deterministic', () => {
    const add = makeColumnAdd([368, 257])
    expect(check(add, num(625)).correct).toBe(true)
    expect(check(makeFactMul(6, 7), dig(42)).correct).toBe(true)
    expect(check(makeFactMul(6, 7), { type: 'numbers', values: [42] }).correct).toBe(true)
    expect(check(add, dig(515))).toEqual(check(add, dig(515)))
  })

  it('leading empty cells and zeros are fine; leading carry written in the carry row is accepted', () => {
    const sub = makeColumnSub(1250, 475)
    expect(check(sub, dig([5, 7, 7, 0])).correct).toBe(true)
    expect(check(sub, dig([5, 7, 7, null])).correct).toBe(true)
    const add = makeColumnAdd([768, 457])
    expect(check(add, dig([5, 2, 2, null], [0, 1, 1, 1])).correct).toBe(true)
    expect(check(add, dig([5, 2, 2, 1, null, null])).correct).toBe(true)
    expect(check(add, dig([5, 2, 2, 1, 3])).correct).toBe(false)
  })

  it('subtraction accepts the correct result whatever the borrowing method (scratch cells never graded)', () => {
    const ex = makeColumnSub(503, 128)
    // Regrouping scratch, compensation ("llevando") scratch, or none at all: all correct.
    expect(check(ex, dig([5, 7, 3], [13, 9, 4])).correct).toBe(true)
    expect(check(ex, dig([5, 7, 3], [1, 1, 0])).correct).toBe(true)
    expect(check(ex, dig([5, 7, 3])).correct).toBe(true)
  })
})

describe('check — facts', () => {
  const ex = makeFactMul(6, 7)
  it('wrong fact names the strategy', () => {
    const r = check(ex, num(41))
    expect(r).toMatchObject({ correct: false, given: '41', expected: '42', errorType: 'fact' })
    expect(r.feedback).toContain('5 × 7 + 7')
    expect(r.feedback).toMatch(/^¡Casi! Prueba el truco/)
  })
  it('neighbour fact is recognised', () => {
    const r = check(ex, num(48))
    expect(r.errorType).toBe('fact')
    expect(r.feedback).toContain('48 es 6 × 8')
  })
  it('added instead of multiplied → operation', () => {
    expect(check(ex, num(13)).errorType).toBe('operation')
  })
  it('empty → incomplete; wrong shape → other', () => {
    expect(check(ex, num(null))).toMatchObject({ correct: false, errorType: 'incomplete', given: '?' })
    expect(check(ex, { type: 'digits', digits: [null, null] }).errorType).toBe('incomplete')
    expect(check(ex, { type: 'digits', digits: [2, null, 1] }).errorType).toBe('incomplete')
    expect(check(ex, { type: 'facts', facts: [] }).errorType).toBe('other')
    expect(check(ex, { type: 'numbers', values: [4, 2] }).errorType).toBe('other')
    expect(check(ex, null as unknown as Answer).errorType).toBe('other')
  })
  it('the 7 × 6 mirror uses the Cave trick', () => {
    expect(check(makeFactMul(7, 6), num(40)).feedback).toContain('espejo')
  })
  it('fact-div', () => {
    const d = makeFactDiv(42, 6)
    expect(check(d, num(7)).correct).toBe(true)
    expect(check(d, num(36)).errorType).toBe('operation')
    expect(check(d, num(252)).errorType).toBe('operation')
    const r = check(d, num(8))
    expect(r.errorType).toBe('fact')
    expect(r.feedback).toContain('tabla del 6')
    expect(check(d, num(null)).errorType).toBe('incomplete')
    expect(check(d, { type: 'facts', facts: [] }).errorType).toBe('other')
  })
  it('missing factor', () => {
    const m = makeMissingFactor(6, 7, 'b')
    expect(check(m, num(7)).correct).toBe(true)
    expect(check(m, num(42)).errorType).toBe('other')
    expect(check(m, num(36)).errorType).toBe('operation')
    expect(check(m, num(8)).errorType).toBe('fact')
    expect(check(m, num(null)).errorType).toBe('incomplete')
    expect(check(m, { type: 'facts', facts: [] }).errorType).toBe('other')
    expect(check(makeMissingFactor(6, 7, 'a'), num(6)).correct).toBe(true)
  })
  it('skip-count and double-chain mark the wrong positions', () => {
    const s = makeSkipCount(6, 1, 10, [2, 5, 8])
    expect(check(s, { type: 'numbers', values: [18, 36, 54] }).correct).toBe(true)
    const r = check(s, { type: 'numbers', values: [18, 35, 54] })
    expect(r).toMatchObject({ correct: false, errorType: 'fact', wrongColumns: [1], given: '18, 35, 54', expected: '18, 36, 54' })
    expect(r.feedback).toContain('de 6 en 6')
    expect(check(s, { type: 'numbers', values: [18, null, 54] })).toMatchObject({ errorType: 'incomplete', wrongColumns: [1] })
    expect(check(s, { type: 'numbers', values: [] }).errorType).toBe('incomplete')
    expect(check(s, num(18)).errorType).toBe('other')
    const one = makeSkipCount(3, 1, 10, [4])
    expect(check(one, num(15)).correct).toBe(true)
    const c = makeDoubleChain(7, 3)
    expect(check(c, { type: 'numbers', values: [14, 28, 56] }).correct).toBe(true)
    expect(check(c, { type: 'numbers', values: [14, 28, 54] })).toMatchObject({ errorType: 'fact', wrongColumns: [2] })
  })
  it('groups and arrays', () => {
    const g = makeGroups(3, 4, '🍄')
    expect(check(g, num(12)).correct).toBe(true)
    expect(check(g, num(7)).errorType).toBe('operation')
    expect(check(g, num(11)).feedback).toContain('3 grupos de 4')
    expect(check(g, num(null)).errorType).toBe('incomplete')
    expect(check(g, { type: 'facts', facts: [] }).errorType).toBe('other')
    const a = makeArray(3, 5, '🌸')
    expect(check(a, num(15)).correct).toBe(true)
    expect(check(a, num(14)).feedback).toContain('3 filas de 5')
  })
})

describe('check — fact families', () => {
  const fam = makeFactFamily(6, 7)
  const facts = (...f: string[]): Answer => ({ type: 'facts', facts: f })
  it('accepts any order and ×/x/*, ÷/:/ symbols, spaces and mirrored equalities', () => {
    expect(check(fam, facts('42 ÷ 7 = 6', '7 × 6 = 42', '42:6=7', '6*7=42')).correct).toBe(true)
    expect(check(fam, facts('42 = 6 x 7', '7X6=42', '42/6=7', '6 = 42 : 7')).correct).toBe(true)
    expect(check(fam, facts('6·7=42', '7⋅6=42', '42÷6=7', '42÷7=6')).correct).toBe(true)
  })
  it('wrong arithmetic → fact with the wrong index', () => {
    expect(check(fam, facts('6x7=42', '7x6=48', '42/6=7', '42/7=6'))).toMatchObject({ correct: false, errorType: 'fact', wrongColumns: [1] })
  })
  it('missing facts → incomplete; duplicates → other; reversed division / foreign facts → other', () => {
    expect(check(fam, facts('6x7=42', '7x6=42', '42/6=7', ''))).toMatchObject({ errorType: 'incomplete' })
    expect(check(fam, facts('', '', '', '')).errorType).toBe('incomplete')
    expect(check(fam, facts('6x7=42', '6x7=42', '42/6=7', '42/7=6'))).toMatchObject({ errorType: 'other', wrongColumns: [1] })
    const rev = check(fam, facts('6x7=42', '7x6=42', '6/42=7', '42/7=6'))
    expect(rev).toMatchObject({ errorType: 'other', wrongColumns: [2] })
    expect(rev.feedback).toContain('número grande va primero')
    expect(check(fam, facts('6x7=42', '7x6=42', '42/6=7', '6x8=48')).errorType).toBe('other')
    expect(check(fam, facts('seis por siete', '7x6=42', '42/6=7', '42/7=6')).errorType).toBe('other')
    expect(check(fam, num(42)).errorType).toBe('other')
  })
  it('parseFact', () => {
    expect(parseFact('6 × 7 = 42')).toEqual({ op: 'x', l: 6, r: 7, res: 42 })
    expect(parseFact('42 : 6 = 7')).toEqual({ op: '/', l: 42, r: 6, res: 7 })
    expect(parseFact('42 = 6 × 7')).toEqual({ op: 'x', l: 6, r: 7, res: 42 })
    expect(parseFact('6 + 7 = 13')).toBeNull()
  })
})

describe('check — column addition diagnosis', () => {
  const ex = makeColumnAdd([368, 257])
  it('368 + 257 answered 515 → carry-forgot in tens and hundreds', () => {
    const r = check(ex, dig(515))
    expect(r).toMatchObject({ correct: false, given: '515', expected: '625', errorType: 'carry-forgot', wrongColumns: [1, 2] })
    expect(r.feedback).toBe('¡Ojo con la mochila! Te has dejado la llevada en las decenas y las centenas.')
  })
  it('forgot one carry → carry-forgot in that column only', () => {
    expect(check(ex, dig(615))).toMatchObject({ errorType: 'carry-forgot', wrongColumns: [1] })
  })
  it('forgot the final carry (new thousands column) → carry-forgot', () => {
    expect(check(makeColumnAdd([768, 457]), dig([5, 2, 2, 0]))).toMatchObject({ errorType: 'carry-forgot', wrongColumns: [3] })
    expect(check(makeColumnAdd([768, 457]), dig([5, 2, 2, 2]))).toMatchObject({ errorType: 'carry-wrong', wrongColumns: [3] })
    // Leaving the new leading cell blank is the same mistake, not an incomplete answer.
    expect(check(makeColumnAdd([768, 457]), dig([5, 2, 2, null]))).toMatchObject({ errorType: 'carry-forgot', wrongColumns: [3], given: '225' })
    expect(check(makeColumnMul(47, 6), dig([2, 8, null]))).toMatchObject({ errorType: 'carry-forgot', wrongColumns: [2] })
  })
  it('wrote the carry instead of the units / a whole sum in one cell → carry-wrong', () => {
    // 245 + 137: units 5 + 7 = 12 → writes 1, "carries" 2 → tens 2 + 4 + 3 = 9.
    expect(check(makeColumnAdd([245, 137]), dig([1, 9, 3]))).toMatchObject({ errorType: 'carry-wrong' })
    expect(check(makeColumnAdd([245, 137]), dig([12, 8, 3]))).toMatchObject({ errorType: 'carry-wrong', wrongColumns: [0] })
    // Wrote a carry where there was none (seen in the carry row) and added it.
    expect(check(makeColumnAdd([243, 524]), dig([7, 7, 7], [0, 1, 0]))).toMatchObject({ errorType: 'carry-wrong', wrongColumns: [1] })
  })
  it('misaligned operands (3456 + 278 written as 3456 + 2780) → misaligned', () => {
    const r = check(makeColumnAdd([3456, 278]), dig(6236))
    expect(r).toMatchObject({ errorType: 'misaligned' })
    expect(r.feedback).toContain('empezando por la derecha')
    expect(check(makeColumnAdd([243, 524]), dig([0, 7, 6, 7])).errorType).toBe('misaligned')
  })
  it('a wrong single-digit sum → fact', () => {
    expect(check(makeColumnAdd([243, 524]), dig(768))).toMatchObject({ errorType: 'fact', wrongColumns: [0] })
  })
  it('blank cells → incomplete with the empty columns', () => {
    expect(check(ex, dig([5, null, 6]))).toMatchObject({ errorType: 'incomplete', wrongColumns: [1] })
    expect(check(ex, dig([null, null, null]))).toMatchObject({ errorType: 'incomplete', given: '?' })
    expect(check(ex, { type: 'facts', facts: [] }).errorType).toBe('other')
  })
})

describe('check — column subtraction diagnosis', () => {
  it('52 − 17 answered 45 → smaller-from-larger', () => {
    const r = check(makeColumnSub(52, 17), dig(45))
    expect(r).toMatchObject({ correct: false, errorType: 'smaller-from-larger', wrongColumns: [1] })
    expect(r.feedback).toBe('Arriba hay un número más pequeño: ¡pide ayuda a la vecina!')
  })
  it('734 − 459: 385 → borrow-forgot (no decrement); 325 → smaller-from-larger', () => {
    expect(check(makeColumnSub(734, 459), dig(385))).toMatchObject({ errorType: 'borrow-forgot' })
    expect(check(makeColumnSub(734, 459), dig(325))).toMatchObject({ errorType: 'smaller-from-larger' })
  })
  it('smaller-from-larger in just one column', () => {
    // 652 − 271 = 381: tens 5 < 7 → child writes 2 (7 − 5) but handles the rest.
    expect(check(makeColumnSub(652, 271), dig(421)).errorType).toBe('smaller-from-larger')
  })
  it('borrowed but answered 0 in the borrowing column → borrow-forgot', () => {
    expect(check(makeColumnSub(734, 459), dig([0, 7, 2])).errorType).toBe('borrow-forgot')
  })
  it('borrowing across a zero: 503 − 128', () => {
    const ex = makeColumnSub(503, 128) // 375
    expect(check(ex, dig(485))).toMatchObject({ errorType: 'zero-borrow', wrongColumns: [1, 2] })
    expect(check(ex, dig(585)).errorType).toBe('zero-borrow')
    expect(check(ex, dig(325)).errorType).toBe('zero-borrow')
    expect(check(ex, dig(425)).errorType).toBe('smaller-from-larger')
    expect(check(ex, dig(485)).feedback).toContain('cero')
    expect(check(makeColumnSub(600, 245), dig(455)).errorType).toBe('zero-borrow')
    expect(check(makeColumnSub(5004, 1238), dig(4876)).errorType).toBe('zero-borrow')
  })
  it('misaligned subtrahend (5876 − 341 as 5876 − 3410)', () => {
    expect(check(makeColumnSub(5876, 341), dig(2466)).errorType).toBe('misaligned')
    expect(check(makeColumnSub(586, 243), dig([0, 3, 4, 3])).errorType).toBe('misaligned')
  })
  it('plain digit mistakes → fact; adding instead → other', () => {
    expect(check(makeColumnSub(586, 243), dig(353))).toMatchObject({ errorType: 'fact', wrongColumns: [1] })
    expect(check(makeColumnSub(586, 243), dig(829)).errorType).toBe('other')
    expect(check(makeColumnSub(586, 243), dig([3, 14, 3])).errorType).toBe('other')
  })
  it('incomplete and wrong shapes', () => {
    expect(check(makeColumnSub(586, 243), dig([3, null, 3]))).toMatchObject({ errorType: 'incomplete', wrongColumns: [1] })
    expect(check(makeColumnSub(586, 243), dig([null, null, null])).given).toBe('?')
    expect(check(makeColumnSub(586, 243), div(1, 2)).errorType).toBe('other')
  })
})

describe('check — 2-digit × 1-digit diagnosis', () => {
  const ex = makeColumnMul(47, 6) // 282
  it('forgot the carry → carry-forgot', () => {
    const r = check(ex, dig(242))
    expect(r).toMatchObject({ errorType: 'carry-forgot', wrongColumns: [1] })
    expect(r.feedback).toContain('decenas')
  })
  it('multiplied the carry, concatenated, or swapped digits → carry-wrong', () => {
    expect(check(ex, dig(482)).errorType).toBe('carry-wrong')
    expect(check(ex, dig(2442)).errorType).toBe('carry-wrong')
    expect(check(ex, dig(264)).errorType).toBe('carry-wrong')
    expect(check(ex, dig([2, 4, 2, null], [0, 4])).errorType).toBe('carry-forgot')
    expect(check(ex, dig([42, 4])).errorType).toBe('carry-wrong')
  })
  it('tens fact without adding carry but different hundreds → carry-forgot; units wrong → fact', () => {
    expect(check(ex, dig(342)).errorType).toBe('carry-forgot')
    expect(check(ex, dig(283))).toMatchObject({ errorType: 'fact', wrongColumns: [0] })
  })
  it('added instead of multiplied → operation; correct c0 product', () => {
    expect(check(makeColumnMul(21, 4), dig(25)).errorType).toBe('operation')
    expect(check(makeColumnMul(23, 3), dig(69)).correct).toBe(true)
    expect(check(makeColumnMul(23, 3), dig(68)).errorType).toBe('fact')
  })
  it('incomplete', () => {
    expect(check(ex, dig([2, null, 2])).errorType).toBe('incomplete')
    expect(check(ex, dig([null, null, null])).errorType).toBe('incomplete')
    expect(check(ex, { type: 'facts', facts: [] }).errorType).toBe('other')
  })
})

describe('check — division (galera)', () => {
  const ex = makeDivision(17, 5) // 3 r 2
  it('correct and normalised strings', () => {
    expect(check(ex, div(3, 2))).toMatchObject({ correct: true, given: '3 resto 2', expected: '3 resto 2' })
  })
  it('remainder too big', () => {
    const r = check(ex, div(2, 7))
    expect(r.errorType).toBe('remainder-too-big')
    expect(r.feedback).toBe('El resto tiene que ser más pequeño que 5. ¡Cabe una vez más!')
  })
  it('quotient off by one (too big / too small)', () => {
    const big = check(ex, div(4, 0))
    expect(big.errorType).toBe('quotient-off')
    expect(big.feedback).toContain('4 × 5 = 20')
    expect(check(ex, div(2, 2)).errorType).toBe('quotient-off')
  })
  it('quotient right, remainder wrong → fact', () => {
    const r = check(ex, div(3, 1))
    expect(r.errorType).toBe('fact')
    expect(r.feedback).toContain('17 − 15')
  })
  it('exact division with an empty remainder box or as a plain number', () => {
    const e = makeDivision(84, 4)
    expect(check(e, div(21, null)).correct).toBe(true)
    expect(check(e, num(21)).correct).toBe(true)
    expect(check(e, div(12, 0))).toMatchObject({ errorType: 'misaligned' }) // digits swapped (21 → 12)
    expect(check(e, div(22, 0))).toMatchObject({ errorType: 'quotient-off' })
    expect(check(e, div(31, 0))).toMatchObject({ errorType: 'fact' })
    expect(check(makeDivision(96, 3), div(12, 0)).errorType).toBe('fact')
    expect(check(makeDivision(96, 3), div(41, 0)).errorType).toBe('other')
  })
  it('long division: forgetting to bring down the leftover ten', () => {
    const r = check(makeDivision(72, 3), div(20, 2))
    expect(r.errorType).toBe('other')
    expect(r.feedback).toContain('bájalo')
  })
  it('incomplete / invalid', () => {
    expect(check(ex, div(null, null)).errorType).toBe('incomplete')
    expect(check(ex, div(3, null)).errorType).toBe('incomplete')
    expect(check(ex, div(null, 2)).errorType).toBe('incomplete')
    expect(check(ex, div(-3, 2)).errorType).toBe('other')
    expect(check(ex, { type: 'facts', facts: [] }).errorType).toBe('other')
    expect(check(makeDivision(38, 6), div(9, 0)).errorType).toBe('fact')
  })
})

describe('check — word problems', () => {
  const add = makeWordProblem('add-peces', 'En el río nadan 1245 peces dorados y 2368 peces azules. ¿Cuántos peces hay en total?', 'add', 1245, 2368, 'peces')
  it('correct answers mention the unit', () => {
    expect(check(add, num(3613))).toMatchObject({ correct: true, feedback: '¡Muy bien! Son 3613 peces.' })
  })
  it('the answer of another operation on the same numbers → operation', () => {
    const r = check(add, num(1123))
    expect(r.errorType).toBe('operation')
    expect(r.feedback).toContain('juntan')
    const d = makeWordProblem('div-hadas', 'x', 'div', 48, 4, 'estrellas')
    expect(check(d, num(52)).errorType).toBe('operation')
    expect(check(d, num(192)).errorType).toBe('operation')
    expect(check(d, num(44)).errorType).toBe('operation')
    expect(check(d, num(12)).correct).toBe(true)
    const m = makeWordProblem('mul-setas', 'x', 'mul', 6, 7, 'setas')
    expect(check(m, num(13)).errorType).toBe('operation')
    const s = makeWordProblem('sub-tazas', 'x', 'sub', 1250, 475, 'tazas')
    expect(check(s, num(1725)).errorType).toBe('operation')
  })
  it('right idea, wrong calculation → fact', () => {
    expect(check(add, num(3603))).toMatchObject({ errorType: 'fact' })
    expect(check(add, num(null)).errorType).toBe('incomplete')
    expect(check(add, { type: 'facts', facts: [] }).errorType).toBe('other')
  })
  it('division problems with a remainder', () => {
    const d = makeWordProblem('div-hadas', 'x', 'div', 49, 4, 'estrellas')
    expect(d.remainder).toBe(1)
    expect(check(d, div(12, 1))).toMatchObject({ correct: true, expected: '12 resto 1' })
    expect(check(d, num(12)).correct).toBe(true)
    expect(check(d, div(12, 5)).errorType).toBe('remainder-too-big')
    expect(check(d, div(12, 2)).errorType).toBe('fact')
    const exact = makeWordProblem('div-hadas', 'x', 'div', 48, 4, 'estrellas')
    expect(check(exact, div(12, null)).correct).toBe(true)
    expect(check(exact, div(12, 0)).correct).toBe(true)
    expect(check(exact, div(12, 3)).correct).toBe(false)
  })
})

describe('check — fuzzing with random answers', () => {
  it('never throws; every wrong answer has an error type and feedback; wrongColumns are valid', () => {
    const rng = createRng(77)
    const rnd = (n: number) => Math.floor(rng() * n)
    const answers = (): Answer[] => [
      num(rnd(200)), num(null), { type: 'digits', digits: Array.from({ length: rnd(6) }, () => (rng() < 0.15 ? null : rnd(10))) },
      { type: 'digits', digits: [rnd(30), rnd(10)], carries: [rnd(3), null] }, div(rnd(30), rng() < 0.2 ? null : rnd(12)),
      { type: 'numbers', values: Array.from({ length: rnd(5) }, () => (rng() < 0.1 ? null : rnd(120))) },
      { type: 'facts', facts: ['6x7=42', `${rnd(50)}/${rnd(9) + 1}=${rnd(10)}`, '', 'hola'] },
    ]
    for (let seed = 1; seed <= 40; seed++) {
      for (const ex of generate({ kinds: ALL_KINDS }, 13, { rng: createRng(seed) })) {
        for (const a of answers()) {
          const r = check(ex, a)
          if (!r.correct) {
            expect(r.errorType, `${ex.id} ${JSON.stringify(a)}`).toBeDefined()
            expect(r.feedback && r.feedback.length > 0).toBe(true)
          }
          expect(r.feedback).not.toMatch(/undefined|NaN|\{(?!child\}|pet\})/)
          for (const c of r.wrongColumns ?? []) expect(Number.isInteger(c) && c >= 0).toBe(true)
        }
      }
    }
  })
})
