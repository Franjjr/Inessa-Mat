/* Regression tests for the column and method checkers: a right answer is never graded wrong, and each message matches
   the method the child used. One describe per point of the review (sección 3 del análisis). */
import { describe, expect, it } from 'vitest'
import { check, divisionParts, makeColumnMul, makeColumnSub, makeDivision } from '@/engine'
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
})

describe('resta en columna: el mensaje sigue al método que eligió el niño (3.9)', () => {
  const byCarry = (d: (number | null)[]): Answer => ({ type: 'digits', digits: d, method: 'carry' })
  it('«me llevo una» que olvida sumar 1 en la columna de al lado recibe el mensaje de esa llevada', () => {
    // 734 − 459 answered 385: the neighbour was not decreased (borrow-forgot pattern).
    const r = check(makeColumnSub(734, 459), byCarry([5, 8, 3]))
    expect(r).toMatchObject({ correct: false, errorType: 'borrow-forgot' })
    expect(r.feedback).toBe('¡Casi! Te has olvidado de sumar 1 a la cifra de abajo de la casa de al lado.')
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

describe('resta por saltos: cualquier cadena creciente de paradas (3.10)', () => {
  const line = (values: (number | null)[], total: number | null = 225): Answer => ({ type: 'steps', method: 'line', values, total })
  const ex = makeColumnSub(352, 127) // paradas canónicas 130, 300, 350; el total es 225
  it('acepta más o menos paradas que la ruta canónica, y ninguna', () => {
    expect(check(ex, line([130, 300, 350])).correct).toBe(true)
    expect(check(ex, line([300, 350])).correct).toBe(true)
    expect(check(ex, line([130, 140, 200, 300, 350])).correct).toBe(true)
    expect(check(ex, line([])).correct).toBe(true)
    expect(check(ex, line([null, null])).correct).toBe(true)
  })
  it('las paradas van hacia delante, estrictamente entre el sustraendo y el minuendo', () => {
    expect(check(ex, line([300, 200])).errorType).toBe('other')
    expect(check(ex, line([300, 300])).errorType).toBe('other')
    expect(check(ex, line([100, 300])).errorType).toBe('other')
    expect(check(ex, line([352])).errorType).toBe('other')
  })
  it('una casilla vacía entre dos paradas está incompleta; el total tiene que ser correcto', () => {
    expect(check(ex, line([130, null, 350])).errorType).toBe('incomplete')
    expect(check(ex, line([130, 300], null)).errorType).toBe('incomplete')
    expect(check(ex, line([130, 300], 226)).errorType).toBe('other')
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
