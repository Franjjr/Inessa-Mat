/* Regression tests for the column and method checkers: a right answer is never graded wrong, and each message matches
   the method the child used. One describe per point of the review (sección 3 del análisis). */
import { describe, expect, it } from 'vitest'
import { check, climbProducts, divisionParts, generate, createRng, hintsFor, makeColumnMul, makeColumnSub, makeDivision, makeLongMul } from '@/engine'
import { FEEDBACK } from '@/engine/feedback'
import { makeDivision3 } from '@/engine/make'
import { genDivision2d } from '@/engine/bigops'
import type { Answer } from '@/types'
import { digits } from './helpers'

const dig = (n: number | (number | null)[], carries?: (number | null)[]): Answer =>
  ({ type: 'digits', digits: Array.isArray(n) ? n : digits(n), ...(carries ? { carries } : {}) })

describe('multiplicación en columna: la llevada final escrita en su fila (3.1)', () => {
  it('12 × 9 = 108 acepta el 1 escrito solo en la fila de llevadas, encima de las centenas', () => {
    const ex = makeColumnMul(12, 9)
    expect(check(ex, dig([8, 0, null], [null, null, 1]))).toMatchObject({ correct: true, given: '108' })
    expect(check(ex, dig([8, 0, 1])).correct).toBe(true)
    expect(check(ex, dig([8, 0, 1], [null, null, 1])).correct).toBe(true)
  })
  it('igual que en la suma: una llevada final que no se escribe en ningún sitio sigue olvidada', () => {
    expect(check(makeColumnMul(12, 9), dig([8, 0, null])).errorType).toBe('carry-forgot')
  })
  it('99 × 9 = 891: la llevada final de la fila de llevadas vale también con dos llevadas seguidas', () => {
    const ex = makeColumnMul(99, 9)
    expect(check(ex, dig([1, 9, null], [null, 8, 8]))).toMatchObject({ correct: true, given: '891' })
    expect(check(ex, dig([1, 9, null], [null, 8, null])).errorType).toBe('carry-forgot')
  })
})

describe('resta en columna: el mensaje sigue al método que eligió el niño (3.9)', () => {
  const byCarry = (d: (number | null)[]): Answer => ({ type: 'digits', digits: d, method: 'carry' })
  it('«me llevo una» que olvida sumar 1 en la columna de al lado recibe el mensaje de esa llevada', () => {
    // 734 − 459 answered 385: the neighbour was not decreased (borrow-forgot pattern).
    const r = check(makeColumnSub(734, 459), byCarry([5, 8, 3]))
    expect(r).toMatchObject({ correct: false, errorType: 'borrow-forgot' })
    expect(r.feedback).toContain('Te has olvidado de sumar 1 a la cifra de abajo de la casa de al lado')
    expect(r.feedback).not.toMatch(/Táchala|réstale/)
  })
  it('el método de pedir prestado conserva su mensaje', () => {
    const r = check(makeColumnSub(734, 459), { type: 'digits', digits: [5, 8, 3], method: 'borrow' })
    expect(r.feedback).toContain('Táchala')
  })
  it('un resultado correcto es correcto con cualquier método', () => {
    expect(check(makeColumnSub(734, 459), { type: 'digits', digits: [5, 7, 2], method: 'carry' }).correct).toBe(true)
  })
})

describe('resta por saltos: el total decide; las paradas solo orientan (3.10)', () => {
  const line = (values: (number | null)[], total: number | null = 225): Answer => ({ type: 'steps', method: 'line', values, total })
  const ex = makeColumnSub(352, 127) // paradas canónicas 130, 300, 350; el total es 225
  it('acepta más o menos paradas que la ruta canónica, y ninguna', () => {
    expect(check(ex, line([130, 300, 350])).correct).toBe(true)
    expect(check(ex, line([300, 350])).correct).toBe(true)
    expect(check(ex, line([130, 140, 200, 300, 350])).correct).toBe(true)
    expect(check(ex, line([])).correct).toBe(true)
    expect(check(ex, line([null, null])).correct).toBe(true)
  })
  it('con el total bien, unas paradas fuera de orden no suspenden: solo una nota detrás del acierto', () => {
    for (const stops of [[300, 200], [300, 300], [100, 300], [352], [130, null, 350]]) {
      const r = check(ex, line(stops))
      expect(r.correct, JSON.stringify(stops)).toBe(true)
      expect(r.feedback).not.toMatch(/Casi|falta/)
    }
    expect(check(ex, line([300, 200])).feedback).toBe('¡Muy bien, 225! Los saltos van de menor a mayor: 127, 130, 300, 350 y 352.')
  })
  it('con el total mal, las paradas van hacia delante, estrictamente entre el sustraendo y el minuendo', () => {
    expect(check(ex, line([300, 200], 226)).errorType).toBe('other')
    expect(check(ex, line([300, 300], 226)).errorType).toBe('other')
    expect(check(ex, line([100, 300], 226)).errorType).toBe('other')
    expect(check(ex, line([352], 226)).errorType).toBe('other')
  })
  it('sin total, se pide el total', () => {
    expect(check(ex, line([130, 300], null))).toMatchObject({ errorType: 'incomplete', feedback: 'Escribe cuánto has saltado en total.' })
    expect(check(ex, line([130, 300], 226)).errorType).toBe('other')
  })
  it('el mensaje de un salto fuera de rango dice dónde tiene que caer, sin señalar un destino falso', () => {
    expect(check(ex, line([300, 200], 226)).feedback).toContain('El salto 2 tiene que caer después de 300 y antes de 352')
    expect(check(ex, line([352], 226)).feedback).toContain('El salto 1 tiene que caer después de 127 y antes de 352')
    expect(check(ex, line([300, 200], 226)).feedback).not.toMatch(/hacia 352/)
  })
  it('sin ningún salto escrito, un total equivocado no habla de saltos ya colocados', () => {
    const r = check(ex, line([], 200))
    expect(r.errorType).toBe('other')
    expect(r.feedback).not.toMatch(/saltos/)
  })
  it('con saltos bien colocados, un total equivocado sí puede decir que los saltos están bien', () => {
    expect(check(ex, line([130, 300, 350], 226)).feedback).toContain('bien colocados')
  })
})

describe('división por partes y de subir: el resto vacío es 0 cuando no sobra nada (3.11)', () => {
  it('84 ÷ 4 por partes: una división exacta puede dejar el resto vacío', () => {
    const ex = makeDivision(84, 4)
    const parts = divisionParts(84, 4).map((s) => s.quotient)
    expect(check(ex, { type: 'division-parts', parts, quotient: 21, remainder: null })).toMatchObject({ correct: true })
    expect(check(ex, { type: 'division-parts', parts, quotient: 21, remainder: 0 }).correct).toBe(true)
  })
  it('una división con resto sigue necesitando el resto escrito', () => {
    const ex = makeDivision(85, 4)
    const parts = divisionParts(85, 4).map((s) => s.quotient)
    expect(check(ex, { type: 'division-parts', parts, quotient: 21, remainder: null }).errorType).toBe('incomplete')
    expect(check(ex, { type: 'division-parts', parts, quotient: 21, remainder: 1 }).correct).toBe(true)
  })
  it('28 ÷ 4 subiendo: el resto puede quedar vacío si es 0', () => {
    expect(check(makeDivision(28, 4), { type: 'climb', products: [4, 8, 12, 16, 20, 24, 28], remainder: null }).correct).toBe(true)
    expect(check(makeDivision(29, 4), { type: 'climb', products: [4, 8, 12, 16, 20, 24, 28, 32], remainder: null }).errorType).toBe('incomplete')
  })
})

// ---------------------------------------------------------------- mensajes concretos (auditoría p4-pistas-mensajes)

describe('resta: una casilla que tenía que pedir prestado y se dejó en 0 (P4-09)', () => {
  it.each([
    [981, 314, 660, 'En las unidades, 1 es menos que 4: pide prestado a la vecina. 11 − 4 = ?'],
    [945, 146, 790, 'En las unidades, 5 es menos que 6: pide prestado a la vecina. 15 − 6 = ?'],
    [627, 498, 120, 'En las unidades, 7 es menos que 8: pide prestado a la vecina. 17 − 8 = ?'],
  ])('%i − %i escrito %i: la vecina sí prestó, así que no es «borrow-forgot»', (m, s, given, text) => {
    const r = check(makeColumnSub(m, s), dig(given))
    expect(r.correct).toBe(false)
    expect(r.errorType).not.toBe('borrow-forgot')
    expect(r.feedback).toBe(text)
  })
  it('con «me llevo una», el mismo fallo se explica con su método', () => {
    const r = check(makeColumnSub(981, 314), { type: 'digits', digits: digits(660), method: 'carry' })
    expect(r.feedback).toBe('En las unidades, 1 es menos que 4: pon un 1 delante (11) y me llevo una abajo.')
  })
})

describe('resta: la vecina que presta se nombra con lo que presta (P4-10)', () => {
  it('841 − 390 con la centena sin tachar: habla de la centena, no de «una decena»', () => {
    const r = check(makeColumnSub(841, 390), dig(541))
    expect(r.errorType).toBe('borrow-forgot')
    expect(r.feedback).toContain('centena')
    expect(r.feedback).not.toContain('te presta una decena')
    expect(r.feedback).toBe('La vecina de las centenas te presta 1 centena, que son 10 decenas: tú ganas 10 decenas y ella se queda con 1 menos. ¡Táchala y réstale 1!')
  })
  it('la decena que presta a las unidades usa el mensaje sencillo', () => {
    expect(check(makeColumnSub(734, 459), dig(385)).feedback).toBe(FEEDBACK.borrowForgot)
    expect(FEEDBACK.borrowForgot).toBe('Si la vecina te presta, ella se queda con 1 menos. ¡Táchala y réstale 1!')
  })
})

describe('«me llevo una»: restar el pequeño del grande (P1-SR-6, P4-11)', () => {
  it('52 − 27 = 35 con «me llevo una»: dice «Me llevo una» y no habla de la vecina', () => {
    const r = check(makeColumnSub(52, 27), dig(35), { method: 'carry' })
    expect(r.feedback).toContain('Me llevo una')
    expect(r.feedback).not.toContain('vecina')
  })
})

describe('multiplicar: una casilla con dos cifras (P4-12) y la llevada de las centenas (P4-07)', () => {
  it('14 × 5 con 10 en las unidades: «solo cabe una cifra», con las cifras reales', () => {
    const r = check(makeColumnMul(14, 5), dig([10, 6]))
    expect(r.feedback).toBe('En cada casa solo cabe una cifra: escribe el 0 y llévate el 1 a la casa de al lado.')
  })
  it('525 × 8 = 4200 sin la llevada de las centenas (4000): nombra las centenas', () => {
    const r = check(makeColumnMul(525, 8), dig(4000))
    expect(r.errorType).toBe('carry-forgot')
    expect(r.feedback).toContain('centenas')
  })
  it('las llevadas olvidadas de 2 cifras siguen igual: 47 × 3 = 141 escrito 121', () => {
    expect(check(makeColumnMul(47, 3), dig(121))).toMatchObject({ errorType: 'carry-forgot' })
    expect(check(makeColumnMul(47, 3), dig(121)).feedback).toContain('decenas')
  })
})

describe('división: mensajes que no inventan (P4-14, P4-23, P4-25)', () => {
  it('341 : 36 con el cociente mal no habla de «la tabla del 36»', () => {
    const ex = makeDivision3(341, 36)
    for (const [q, r] of [[0, 17], [8, 17], [19, 17], [25, 0]]) {
      const res = check(ex, { type: 'division', quotient: q, remainder: r })
      expect(res.correct).toBe(false)
      expect(res.feedback).not.toContain('tabla del 36')
    }
    expect(check(ex, { type: 'division', quotient: 0, remainder: 17 }).feedback).toBe('¡Casi! Prueba un número: multiplícalo por 36. ¿Te pasas de 341? Prueba uno menos.')
  })
  it('88 : 8 resto 1: «Aquí no sobra nada: el resto es 0.»', () => {
    expect(check(makeDivision(88, 8), { type: 'division', quotient: 11, remainder: 1 }).feedback).toBe('Aquí no sobra nada: el resto es 0.')
  })
  it('resto 11 al dividir entre 5: «todavía puedes dar más»', () => {
    const r = check(makeDivision(21, 5), { type: 'division', quotient: 2, remainder: 11 })
    expect(r.errorType).toBe('remainder-too-big')
    expect(r.feedback).toBe('Lo que sobra (11) es más que 5: todavía puedes dar más a cada grupo.')
  })
  it('5248 : 8 parado tras las centenas: «baja las decenas», no «baja las unidades»', () => {
    const ex = makeDivision3(5248, 8)
    const r = check(ex, { type: 'division', quotient: 6, remainder: 0 })
    expect(r.feedback).toContain('baja las decenas')
    expect(r.feedback).not.toContain('baja las unidades')
    expect(check(ex, { type: 'division', quotient: 65, remainder: 0 }).feedback).toContain('Después de las decenas, baja las unidades')
  })
  it('cada palabra de la división se explica la primera vez que sale en un mensaje', () => {
    const EXPLAINED: Record<string, string> = {
      cociente: ' (lo que le toca a cada uno)', divisor: ' (entre cuántos repartes)', dividendo: ' (el número que repartes)',
    }
    const messages = new Set<string>()
    const exs = [makeDivision(84, 4), makeDivision(85, 4), makeDivision(28, 4), makeDivision(29, 4), makeDivision3(341, 36)]
    for (let seed = 1; seed <= 30; seed++) exs.push(...generate({ kinds: ['division'] }, 3, { rng: createRng(seed) }) as typeof exs, genDivision2d(createRng(seed), true))
    for (const ex of exs) {
      const st = divisionParts(ex.dividend, ex.divisor)
      const products = climbProducts(ex.dividend, ex.divisor)
      const answers: Answer[] = [
        ...[-1, 1].flatMap((d) => [{ type: 'division', quotient: ex.quotient + d, remainder: ex.remainder } as Answer]),
        { type: 'division', quotient: ex.quotient, remainder: ex.remainder + 1 },
        { type: 'division-parts', parts: st.map((s) => s.quotient + 1), quotient: ex.quotient + 1, remainder: ex.remainder },
        { type: 'division-parts', parts: st.map((s) => s.quotient), quotient: ex.quotient + 1, remainder: ex.remainder },
        { type: 'division-parts', parts: st.map((s) => s.quotient), quotient: ex.quotient, remainder: ex.remainder + 1 },
        { type: 'division-parts', parts: st.map((s) => s.quotient), quotient: null, remainder: null },
        { type: 'climb', products: products.slice(0, 1), remainder: null },
        { type: 'climb', products: [...products, products[products.length - 1] + ex.divisor], remainder: ex.remainder },
        { type: 'climb', products, remainder: ex.remainder + 1 },
      ]
      for (const a of answers) messages.add(check(ex, a).feedback ?? '')
    }
    expect(messages.size).toBeGreaterThan(8)
    for (const text of messages) {
      for (const [word, note] of Object.entries(EXPLAINED)) {
        const at = text.search(new RegExp(`\\b${word}\\b`))
        if (at >= 0) expect(text.slice(at + word.length, at + word.length + note.length), text).toBe(note)
      }
      const rest = text.search(/\bresto\b/)
      if (rest >= 0) expect(text.slice(0, rest + 20), text).toMatch(/sobra/)
    }
  })
})

describe('multiplicar en columna: la pista 3 usa los números del ejercicio (P4-24)', () => {
  it('34 × 12: «Primera fila: 34 × 2 = ?»', () => {
    expect(hintsFor(makeLongMul(34, 12))[2].text).toContain('34 × 2')
  })
  it('por 1 no enseña la fila entera', () => {
    const text = hintsFor(makeLongMul(34, 21))[2].text
    expect(text).toContain('por 1')
    expect(text).not.toContain('34')
  })
})

describe('juegos de tocar: mensaje neutro (MD-8)', () => {
  it('FEEDBACK.tapWrong no acusa de haber sumado', () => {
    expect(FEEDBACK.tapWrong(3, 3)).toBe('Ese no es. Piensa en 3 grupos de 3.')
    expect(FEEDBACK.tapWrong(3, 3)).not.toContain('Has sumado')
  })
})
