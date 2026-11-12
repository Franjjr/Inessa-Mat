/* The tricks (trucos), the first hints and the wrong-answer messages of the multiplication facts. They are checked on every
   fact 1..10 × 1..10: a trick or a message must never give the result of its fact, a worked step must end where the
   child writes the answer, and the messages about «me llevo una», the zero and the division must be the right ones.
   Facts with a factor 1 are left out of the product checks: «por 1, el número se queda igual» names the product only as
   the other factor, which the child reads in the question. */
import { describe, expect, it } from 'vitest'
import { TABLE_METHODS, check, createRng, generate, hintsFor, makeColumnSub, makeFactMul, makeMissingFactor, strategyDetail, strategyForFact, toDigits } from '@/engine'
import { FEEDBACK, praise, praiseFact } from '../feedback'
import type { Answer } from '@/types'

const num = (value: number | null): Answer => ({ type: 'number', value })

/** The neutral praises (feedback.ts PRAISE): a trick's praise is only named when the child used that trick. */
const PRAISE_OPTIONS = ['¡Bien hecho, {child}!', '¡Toma ya!', '¡Lo has clavado!', '¡Genial, {child}!', '¡Eso es!', '¡Fenomenal!', '¡Perfecto!']

/** Whole number as a token: 49 is in «49 es 7 × 7», but not in «149» or «4,9». */
const hasNumber = (text: string, n: number) => new RegExp(`(?<![\\d.,])${n}(?![\\d.,])`).test(text)

/** Every fact of the tables 1..10 × 1..10 without a factor 1 (see the header). */
const FACTS: [number, number][] = []
for (let a = 2; a <= 10; a++) for (let b = 2; b <= 10; b++) FACTS.push([a, b])

/** Every fact 1..10 × 1..10 (the worked steps and the strategy text exist for all of them). */
const ALL_FACTS: [number, number][] = []
for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) ALL_FACTS.push([a, b])

describe('tricks: the first hint never gives the result of its fact', () => {
  it.each(FACTS)('%i × %i: the strategy and every favourite trick leave the product out', (a, b) => {
    const product = a * b
    const texts = [strategyForFact(a, b).text, hintsFor(makeFactMul(a, b))[0].text]
    for (const t of TABLE_METHODS.filter((m) => m.applies(a, b))) {
      texts.push(hintsFor(makeFactMul(a, b), undefined, { tableMethod: t.id })[0].text)
    }
    for (const text of texts) expect(hasNumber(text, product), `${a} × ${b} → ${product}: «${text}»`).toBe(false)
  })
})

describe('tricks: the wrong-answer messages never give the result of their fact', () => {
  it.each(FACTS)('%i × %i: every wrong answer near the fact gets a message without the product', (a, b) => {
    const product = a * b
    const ex = makeFactMul(a, b)
    const messages = new Set<string>([FEEDBACK.factWrong(strategyForFact(a, b))])
    for (let v = 0; v <= 100; v++) {
      if (v === product) continue
      const r = check(ex, num(v))
      if (r.feedback) messages.add(r.feedback)
    }
    for (const text of messages) expect(hasNumber(text, product), `${a} × ${b} → ${product}: «${text}»`).toBe(false)
  })

  it('a neighbour fact names its table, and the trick of the asked fact never gives its result', () => {
    // 7 × 8 = 56: the child writes 49, the product of 7 × 7. The message names that table and then the trick, which is a
    // question («¿qué dos de estos números forman el resultado: 5, 6, 7, 8?»), never 56.
    const r = check(makeFactMul(7, 8), num(49))
    expect(r.feedback).toContain('49 es 7 × 7: ese resultado es de la tabla del 7')
    expect(r.feedback).toContain('Prueba el truco. Parte el 8 en 5 y 3')
    expect(r.feedback).not.toMatch(/\b56\b/)
    // Both factors differ: the message names both tables (48 = 6 × 8, a neighbour of 7 × 8).
    expect(check(makeFactMul(7, 8), num(48)).feedback).toContain('48 es 6 × 8: ese resultado es de la tabla del 6 y del 8')
  })
})

describe('tricks: the worked step ends where the child writes the answer', () => {
  it.each(ALL_FACTS)('%i × %i: the worked step ends in «= ?», and the answer fills it', (a, b) => {
    const worked = strategyDetail(a, b).workedText
    expect(worked).toMatch(/= \?$/)
    // FactView replaces the final «?» with the answer: the text must then read «= 35» or «→ 35».
    const filled = worked.replace(/\?\s*$/, String(a * b))
    expect(filled).toMatch(new RegExp(`= ${a * b}$`))
  })

  it('a factor 1 never writes its product in the worked step, only the expression with «= ?»', () => {
    for (let b = 2; b <= 10; b++) {
      for (const [x, y] of [[1, b], [b, 1]]) {
        const worked = strategyDetail(x, y).workedText.replace(`${x} × ${y} = ?`, '')
        expect(hasNumber(worked, x * y), `${x} × ${y}: «${strategyDetail(x, y).workedText}»`).toBe(false)
      }
    }
    expect(strategyDetail(1, 7).workedText).toBe('Por 1, el número se queda igual: 1 × 7 = ?')
  })

  it('the 6 table and the doubling chains show the product only as the answer', () => {
    expect(strategyDetail(6, 8).workedText).toBe('La mitad de 8 es 4. Pon el 4 delante del 8: 6 × 8 = ?')
    expect(strategyDetail(8, 3).workedText).toBe('3 → 6 → 12. Y el doble de 12: 12 + 12 = ?')
    expect(strategyDetail(4, 3).workedText).toBe('El doble de 3 es 6. Y el doble de 6: 6 + 6 = ?')
    expect(strategyDetail(7, 5).workedText).toBe('7 saltos de 5: 5, 10, 15, 20, 25, 30… y uno más: 30 + 5 = ?')
  })
})

describe('tricks: the visuals never draw the answer', () => {
  it('the 5 table says what each jump is worth, in the singular', () => {
    expect(strategyDetail(5, 7).visualText).toBe('Cuenta de 5 en 5: cada salto vale 5.')
  })

  it('the doubling chains stop one doubling before the product, and the 5 table draws one jump less', () => {
    expect(hintsFor(makeFactMul(4, 7))[1].params).toEqual({ start: 7, steps: 1 })
    expect(hintsFor(makeFactMul(8, 3))[1].params).toEqual({ start: 3, steps: 2 })
    expect(hintsFor(makeFactMul(5, 7))[1].params).toEqual({ step: 5, count: 6 })
  })
})

describe('tricks: the rewritten tricks', () => {
  it('the 6 with an even number says the half and the number, not the result', () => {
    expect(strategyForFact(6, 8).text).toBe('Con el 6 y un número par: la mitad de 8 va delante y el 8 detrás.')
  })
  it('7 × 7 and 7 × 8 split the 7 or the 8 instead of giving the rhyme', () => {
    expect(strategyForFact(7, 7).text).toBe('Piensa en 7 × 5 y en 7 × 2, y súmalos.')
    expect(strategyForFact(7, 8).text).toBe('Parte el 8 en 5 y 3: piensa en 7 × 5 y en 7 × 3, y súmalos.')
  })
  it('3 × 3 and 8 × 8 have their own trick', () => {
    expect(strategyForFact(3, 3).text).toBe('El doble de 3, y otro 3 más.')
    expect(strategyForFact(8, 8).text).toBe('Diez veces el 8, y quita dos veces el 8.')
    expect(strategyDetail(8, 8).workedText).toBe('8 × 10 = 80, y 8 × 2 = 16. 80 − 16 = ?')
  })
  it('the favourite trick of 6 and 7 says how many times each factor counts, and the mirror names the smaller table', () => {
    const five = TABLE_METHODS.find((t) => t.id === 'five-plus-one')!
    const mirror = TABLE_METHODS.find((t) => t.id === 'mirror')!
    const hint = (t: typeof five, a: number, b: number) => (typeof t.hint === 'function' ? t.hint(a, b) : t.hint)
    expect(hint(five, 6, 7)).toBe('Cinco veces el 7, y una vez más el 7.')
    expect(hint(five, 7, 6)).toBe('Cinco veces el 7, y una vez más el 7.')
    expect(hint(five, 7, 8)).toBe('Cinco veces el 8, y dos veces más el 8.')
    expect(hint(mirror, 7, 6)).toContain('6 × 7 da lo mismo')
    expect(hint(mirror, 7, 6)).toContain('la tabla del número más pequeño, el 6')
  })
})

describe('messages: praise, the mirror, the zero, carrying and the division', () => {
  it('the praise names a trick only when the child used it', () => {
    for (const [a, b] of ALL_FACTS) {
      for (const seed of ['fact-1', 'fact-2', 'fact-3']) {
        expect(praiseFact(seed, strategyForFact(a, b))).toBe(praise(seed))
      }
    }
    // Once the trick was asked, its praise may name it: every praise is a neutral one or the trick's own, and the trick's
    // own praise does come out for some seeds.
    const seeds = Array.from({ length: 20 }, (_, i) => `fact-${i}`)
    const trick = '¡El 5 y uno más funciona de maravilla!'
    const outs = seeds.map((seed) => praiseFact(seed, strategyForFact(6, 7), true))
    for (const out of outs) expect([...PRAISE_OPTIONS, trick]).toContain(out)
    expect(outs).toContain(trick)
    const trick88 = '¡Diez veces el 8 menos dos veces el 8! ¡Qué buena idea!'
    const outs88 = seeds.map((seed) => praiseFact(seed, strategyForFact(8, 8), true))
    for (const out of outs88) expect([...PRAISE_OPTIONS, trick88]).toContain(out)
    expect(outs88).toContain(trick88)
  })

  it('the praise names the trick only after a hint showed it (check passes hintsUsed)', () => {
    const seeds = Array.from({ length: 20 }, (_, i) => `fact-${i}`)
    const trick = '¡El 5 y uno más funciona de maravilla!'
    // Without a hint the child never hears the trick's praise.
    for (const seed of seeds) {
      const ex = { ...makeFactMul(6, 7), id: seed }
      expect(PRAISE_OPTIONS).toContain(check(ex, num(42), { hintsUsed: 0 }).feedback)
    }
    // With a hint it may: the trick's own praise comes out for some seeds.
    const withHint = seeds.map((seed) => check({ ...makeFactMul(6, 7), id: seed }, num(42), { hintsUsed: 1 }).feedback)
    expect(withHint).toContain(trick)
  })

  it('the carry method says «me llevo una» for the forgotten carry, and the borrow method keeps the borrow message', () => {
    // 734 − 459: the child writes 385 (the borrow not paid back, see check.test).
    const ex = makeColumnSub(734, 459)
    const answer: Answer = { type: 'digits', digits: toDigits(385) }
    expect(check(ex, answer, { method: 'carry' })).toMatchObject({ errorType: 'borrow-forgot', feedback: FEEDBACK.carryForgotSub })
    // The borrow message names the column that lends (the tens here), so the child knows where to look.
    const borrow = check(ex, answer, { method: 'borrow' })
    expect(borrow.errorType).toBe('borrow-forgot')
    expect(borrow.feedback).toMatch(/vecina de las decenas te presta 1 decena/)
  })

  it('the mirror message says that the result stays the same', () => {
    expect(FEEDBACK.familyRepeated).toBe('Has escrito dos veces la misma. Usa el espejo: escribe la cuenta con los números al revés. El resultado es el mismo.')
  })

  it('the zero borrow says who lends: the first house that is not 0, and each 0 on the way becomes 9', () => {
    expect(FEEDBACK.zeroBorrow).toContain('pide a la primera casa que no sea 0')
    expect(FEEDBACK.zeroBorrow).toContain('Cada 0 que pases se convierte en 9')
  })

  it('«me llevo una» has its own message, apart from «pedir prestado»', () => {
    expect(FEEDBACK.carryForgotSub).toBe('Te has olvidado de sumar 1 a la cifra de abajo de la casa de al lado. ¡Me llevo una!')
    expect(FEEDBACK.borrowForgot).toContain('Táchala')
    expect(FEEDBACK.carryForgotSub).not.toContain('Táchala')
  })

  it('the wrong-answer messages say the trick after «Prueba el truco.» with no label in front of it', () => {
    expect(FEEDBACK.factWrong(strategyForFact(3, 3))).toBe('¡Casi! Prueba el truco. El doble de 3, y otro 3 más.')
    expect(FEEDBACK.factNeighbour(49, 7, 7, strategyForFact(7, 8))).not.toMatch(/: [^ ]+: /)
    expect(FEEDBACK.factNeighbour(49, 7, 7, strategyForFact(7, 8))).toContain('de la tabla del 7. Prueba el truco. Parte el 8 en 5 y 3')
  })

  it('the division messages explain «el resto» and do not use «cociente» unexplained', () => {
    expect(FEEDBACK.remainderTooBig(5)).toBe('Lo que sobra (el resto) tiene que ser más pequeño que 5. ¡Cabe una vez más!')
    expect(FEEDBACK.divisionOther).not.toMatch(/cociente|divisor/)
    expect(FEEDBACK.remainderWrong(17, 15)).not.toMatch(/cociente/)
    expect(FEEDBACK.divisionReversed).not.toMatch(/cociente/)
    expect(FEEDBACK.quotientTooSmall).not.toMatch(/cociente/)
    expect(FEEDBACK.quotientTooSmall).toBe('¡Todavía cabe una vez más! Prueba con uno más en lo que sale en cada grupo.')
  })
})

describe('hints: the word problems and the missing factor', () => {
  it('the second hint of a word problem asks about the story and does not name the operation', () => {
    let checked = 0
    for (let seed = 1; seed <= 30; seed++) {
      for (const ex of generate({ kinds: ['word-problem'] }, 8, { rng: createRng(seed) })) {
        const h2 = hintsFor(ex)[1].text
        expect(h2, h2).toMatch(/\?$/)
        expect(h2, h2).not.toMatch(/hay que (sumar|restar|multiplicar|dividir)|dividir entre|se juntan|se quitan/i)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(20)
  })

  it.each(FACTS)('missing factor %i × ? : the hints draw and name at most two jumps, never the count of jumps', (a, b) => {
    for (const missing of ['a', 'b'] as const) {
      const ex = makeMissingFactor(a, b, missing)
      const known = missing === 'a' ? b : a
      const answer = missing === 'a' ? a : b
      const [, drawn, worked] = hintsFor(ex)
      // The chips drawn are at most two, and none of them is the answer (the count of jumps), even when the known factor is the answer.
      const count = drawn.params?.count as number
      expect(count).toBeLessThanOrEqual(2)
      for (let i = 1; i <= count; i++) expect(known * i, `${a} × ${b}, falta ${missing}`).not.toBe(answer)
      // The worked step says at most two multiples, and then asks how many numbers the child says.
      expect(worked.text).toMatch(/¿Cuántos números dices\?$/)
      // The answer is not written in the hints, not even when it is the known factor (2 × ? = 4 would name the 2 as the answer).
      if (answer !== known) expect(hasNumber(worked.text, answer), worked.text).toBe(false)
    }
  })
})
