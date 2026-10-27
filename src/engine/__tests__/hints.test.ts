import { describe, expect, it } from 'vitest'
import {
  createRng, generate, hintsFor, makeArray, makeColumnAdd, makeColumnMul, makeColumnSub, makeDivision, makeFactDiv,
  makeDivision3, makeFactMul, makeSkipCount, strategyDetail, strategyForFact,
} from '@/engine'
import type { ExerciseKind, FactStrategy, HintVisual } from '@/types'

const VISUALS: HintVisual[] = [
  'groups', 'array', 'dots-five-plus-one', 'double-chain', 'mirror', 'nine-trick', 'skip-count', 'place-value', 'carry',
  'borrow', 'times-ten-minus', 'share', 'family', 'none',
]

const ALL_KINDS: ExerciseKind[] = [
  'fact-mul', 'fact-div', 'missing-factor', 'skip-count', 'groups', 'array', 'double-chain', 'fact-family',
  'column-add', 'column-sub', 'column-mul', 'division', 'word-problem',
]

describe('strategyForFact — all 100 facts', () => {
  it('returns a Spanish strategy with text and a valid visual for every a × b in 1..10', () => {
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        const s = strategyForFact(a, b)
        expect(s.text.length, `${a}x${b}`).toBeGreaterThan(10)
        expect(VISUALS).toContain(s.visual)
        // The strategy reminder never gives the product away directly (except the rhymes that ARE the fact).
        if (!['square-rhyme', 'five-six-seven-eight', 'weeks', 'easy-one', 'even-six-rhyme'].includes(s.id)) {
          expect(s.text, `${a}x${b}: ${s.text}`).not.toMatch(new RegExp(`(^|\\D)${a * b}(\\D|$)`))
        }
      }
    }
  })

  it('matches the workbook tricks (magic cards)', () => {
    const expectId = (a: number, b: number, id: FactStrategy['id']) => expect(strategyForFact(a, b).id, `${a}x${b}`).toBe(id)
    expectId(7, 1, 'easy-one'); expectId(1, 1, 'easy-one')
    expectId(2, 8, 'double'); expectId(8, 2, 'double')
    expectId(6, 5, 'five'); expectId(7, 5, 'five'); expectId(5, 9, 'five')
    expectId(10, 6, 'ten'); expectId(6, 10, 'ten')
    expectId(6, 3, 'five-plus-one'); expectId(6, 7, 'five-plus-one'); expectId(6, 9, 'nine-trick')
    expectId(6, 4, 'even-six-rhyme'); expectId(6, 6, 'even-six-rhyme'); expectId(6, 8, 'even-six-rhyme')
    expectId(7, 3, 'weeks'); expectId(3, 7, 'weeks')
    expectId(7, 4, 'double-double'); expectId(4, 6, 'double-double'); expectId(4, 8, 'double-double'); expectId(3, 4, 'double-double')
    expectId(7, 7, 'square-rhyme'); expectId(7, 8, 'five-six-seven-eight'); expectId(8, 7, 'five-six-seven-eight')
    expectId(7, 9, 'nine-trick'); expectId(9, 9, 'nine-trick')
    expectId(8, 3, 'double-double-double'); expectId(8, 4, 'double-double-double'); expectId(8, 8, 'double-double-double'); expectId(3, 8, 'double-double-double')
    expectId(7, 6, 'mirror'); expectId(8, 6, 'mirror'); expectId(3, 6, 'mirror')
    expectId(3, 3, 'known')
    expect(strategyForFact(6, 7).text).toBe('El 5 y uno más: 5 × 7 + 7.')
    expect(strategyForFact(7, 7).text).toContain('arcoíris llueve')
    expect(strategyForFact(7, 6).text).toContain('6 × 7')
    expect(strategyForFact(9, 7).text).toContain('el 6')
    expect(strategyForFact(8, 7).text).toContain('5, 6, 7, 8')
  })

  it('out-of-range factors fall back gracefully', () => {
    expect(strategyForFact(12, 3).id).toBe('known')
    expect(strategyDetail(0, 4).workedText).toContain('?')
  })

  it('worked steps never reveal the final product', () => {
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        const d = strategyDetail(a, b)
        expect(d.workedText, `${a}x${b}`).toMatch(/\?/)
        if (a * b >= 10) expect(d.workedText.replace(/\(.*\)/, ''), `${a}x${b}: ${d.workedText}`).not.toMatch(new RegExp(`(= |→ )${a * b}(\\D|$)`))
      }
    }
  })
})

describe('hintsFor', () => {
  it.each(ALL_KINDS)('%s: exactly 3 progressive hints (strategy → visual → worked step)', (kind) => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const ex of generate({ kinds: [kind] }, 5, { rng: createRng(seed) })) {
        const hs = hintsFor(ex)
        expect(hs.map((h) => h.level)).toEqual([1, 2, 3])
        expect(hs[0].visual).toBe('none')
        expect(hs[1].visual).not.toBe('none')
        for (const h of hs) {
          expect(VISUALS).toContain(h.visual)
          expect(h.text.length).toBeGreaterThan(5)
          expect(h.text).not.toMatch(/undefined|NaN/)
          expect(h.text).not.toMatch(/\{(?!child\}|pet\})/)
        }
        expect(hs[1].params && Object.keys(hs[1].params).length).toBeGreaterThan(0)
        expect(hs[2].text).toMatch(/\?/)
      }
    }
  })

  it('fact hints carry the strategy visual and its parameters', () => {
    const hs = hintsFor(makeFactMul(6, 7))
    expect(hs[0].text).toBe(strategyForFact(6, 7).text)
    expect(hs[1]).toMatchObject({ visual: 'dots-five-plus-one', params: { a: 6, b: 7 } })
    expect(hs[2].text).toBe('5 × 7 = 35. Y una fila más: 35 + 7 = ?')
    expect(hintsFor(makeFactMul(8, 7))[1].visual).toBe('array')
    expect(hintsFor(makeFactMul(8, 3))[1]).toMatchObject({ visual: 'double-chain', params: { start: 3, steps: 3 } })
    expect(hintsFor(makeFactMul(9, 7))[2].visual).toBe('times-ten-minus')
    expect(hintsFor(makeFactMul(7, 6))[1].visual).toBe('mirror')
  })

  it('column hints work the first carry / borrow column', () => {
    expect(hintsFor(makeColumnAdd([368, 257]))[2].text).toContain('Unidades: 8 + 7 = 15. Escribe 5 y me llevo 1 a las decenas')
    expect(hintsFor(makeColumnAdd([243, 524]))[2].text).toContain('Unidades: 3 + 4 = 7')
    expect(hintsFor(makeColumnAdd([412, 395]))[2].text).toContain('Decenas: 1 + 9 = 10')
    expect(hintsFor(makeColumnAdd([512, 703]))[2].text).toContain('baja directo al resultado')
    expect(hintsFor(makeColumnAdd([2749, 3586]))[1].params).toMatchObject({ operands: [2749, 3586], digits: 4 })
    const sub = hintsFor(makeColumnSub(352, 127))
    expect(sub[2].text).toContain('2 es menos que 7')
    expect(sub[2].text).toContain('12 − 7 = ?')
    expect(sub[1].visual).toBe('borrow')
    const zero = hintsFor(makeColumnSub(503, 128))
    expect(zero[1].text).toContain('0')
    expect(zero[2].text).toContain('Pide a las centenas')
    expect(hintsFor(makeColumnSub(586, 243))[2].text).toContain('6 − 3 = 3')
    expect(hintsFor(makeColumnMul(47, 6))[2].text).toContain('me llevo 4')
    expect(hintsFor(makeColumnMul(23, 3))[2].text).toBe('Unidades: 3 × 3 = 9. Decenas: 2 × 3 = ?')
  })

  it('division hints adapt to the variant', () => {
    expect(hintsFor(makeDivision(17, 5))[0].text).toContain('tabla del 5')
    // The worked step names the table to count in, not the product (5 × 3 = 15 would give the quotient away).
    expect(hintsFor(makeDivision(17, 5))[2].text).toContain('Cuenta de 5 en 5')
    expect(hintsFor(makeDivision(17, 5))[2].text).not.toContain('15')
    expect(hintsFor(makeDivision(84, 4))[2].text).toContain('8 ÷ 4 = 2')
    expect(hintsFor(makeDivision(72, 3))[2].text).toContain('sobra 1')
    expect(hintsFor(makeDivision(72, 3))[2].text).toContain('12 ÷ 3 = ?')
    // The worked step works another case: it never lists this item's jumps (6, 12… 42 would show the quotient 7).
    expect(hintsFor(makeFactDiv(42, 6))[2].text).toContain('Ahora cuenta tú de 6 en 6 hasta 42')
    expect(hintsFor(makeFactDiv(42, 6))[2].text).not.toMatch(/(^|\D)7(\D|$)/)
    // The share visual draws one group of the divisor: the number of groups (the quotient) is never in its params.
    expect(hintsFor(makeFactDiv(42, 6))[1].params).toMatchObject({ groups: 1, perGroup: 6 })
    // The skip count of a ten-fact stops one jump before the product, the last chip is blank.
    expect(hintsFor(makeFactMul(3, 10))[1].params).toMatchObject({ count: 3, index: 2, blank: 1 })
  })

  it('an exact division of three digits brings the third digit down, it does not divide the units alone', () => {
    // 584 ÷ 4: the tens give 14 with nothing left over (58 − 56 = 2), so the next partial is 24, not the units 4.
    expect(hintsFor(makeDivision3(584, 4))[2].text).toBe('Decenas: 58 ÷ 4 = 14 y sobra 2. Júntalo con el 4: 24 ÷ 4 = ?')
  })

  it('the worked division of the level-3 hint never shows the child\'s own dividend, divisor or answer', () => {
    for (let d = 2; d <= 10; d++) {
      for (let q = 1; q <= 10; q++) {
        const p = d * q
        const text = hintsFor(makeFactDiv(p, d))[2].text
        const example = /Ejemplo con otro caso: (.*?)\. Ahora/.exec(text)![1]
        const shown = (example.match(/\d+/g) ?? []).map(Number)
        expect(shown.length, `${p} : ${d}`).toBeGreaterThan(0)
        for (const n of [p, d, q]) expect(shown, `${p} : ${d} = ${q} shows ${n}: ${example}`).not.toContain(n)
        expect(text).toContain(`Ahora cuenta tú de ${d} en ${d} hasta ${p}`)
      }
    }
  })

  it('skip-count and array hints', () => {
    expect(hintsFor(makeSkipCount(6, 1, 10, [2, 5]))[2].text).toBe('Después del 12 viene 12 + 6 = ?')
    expect(hintsFor(makeArray(7, 7, '⭐'))[2].text).toContain('35 + 14')
  })
})
