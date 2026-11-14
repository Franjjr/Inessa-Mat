/* Repaso de números y cálculo (noviembre de 2026): pruebas de regresión. Cada una reproduce un fallo que se encontró y se
   arregló; la expectativa es la de la niña y la de la maestra. */
import { describe, expect, it } from 'vitest'
import { check, hintsFor, makeColumnSub, makeDivision } from '@/engine'
import { makeLineJump } from '@/engine/numeric'
import { makeMental } from '@/engine/calc'

/** Cifras de las unidades a la izquierda, como las manda la cuenta en columna. */
const digits = (n: number) => String(n).split('').reverse().map(Number)

describe('Repaso números y cálculo: fallos confirmados', () => {
  /* Recta numérica, modo salto: cuando el salto pasa de una centena o de un millar a otra (95 + 10 = 105,
     2 010 − 100 = 1 910), la pista 2 y el mensaje de fallo dicen «Un salto de 10 cambia solo las decenas. El resto
     de cifras se queda igual». Es falso: también cambian las centenas (o los millares). Un niño que le hace caso
     escribe 95 → «5» con otras decenas, o 2 010 → 2 910, y vuelve a fallar. Pasa en cerca de 1 de cada 10 saltos. */
  it('recta: un salto que cruza la centena no dice «cambia solo las decenas»', () => {
    const ex = makeLineJump(10, [80, 90, 100, 110, 120], 95, 10, 999)
    expect(ex.answer).toBe(105)
    const texts = [...hintsFor(ex).map((h) => h.text), check(ex, { type: 'number', value: 95 }).feedback ?? '']
    for (const t of texts) {
      expect(t).not.toMatch(/cambia solo/)
      expect(t).not.toMatch(/se queda igual/)
    }
  })

  it('recta: 2 010 − 100 (cruza el millar) no dice «cambia solo las centenas»', () => {
    const ex = makeLineJump(100, [1800, 1900, 2000, 2100, 2200], 2010, -100)
    expect(ex.answer).toBe(1910)
    const texts = [...hintsFor(ex).map((h) => h.text), check(ex, { type: 'number', value: 2910 }).feedback ?? '']
    for (const t of texts) expect(t).not.toMatch(/cambia solo/)
  })

  /* Cálculo mental «decenas»: 190 + 30 = 220 (o 410 − 20 = 390) cruza la centena en casi la mitad de los
     ejercicios, pero la pista 2 dice «Cambia solo las decenas» y el mensaje de fallo «Cambian solo las decenas». Es
     falso: cambian también las centenas, y el niño que lo sigue escribe 120 o 490. */
  it('mental decenas: 190 + 30 no dice que «cambian solo las decenas»', () => {
    const ex = makeMental('decenas', 190, 30, 220, '190 + 30 = ?')
    const texts = [...hintsFor(ex).map((h) => h.text), check(ex, { type: 'number', value: 120 }).feedback ?? '']
    for (const t of texts) expect(t).not.toMatch(/[Cc]ambia(n)? solo las decenas/)
  })

  /* Resta en columna: 352 − 127 escrito 235. La niña pidió prestado bien en las unidades (12 − 7 = 5) pero no tachó
     el 5 de las decenas (5 − 2 = 3): es «se me olvidó que la vecina se queda con 1 menos». Como 7 − 2 también da 5,
     el valor coincide con el de «restar el pequeño del grande» y diagnose.ts:117 lo elige primero. Resultado: la app
     marca las DECENAS y dice «Arriba hay un número más pequeño: ¡pide ayuda a la vecina!», cuando arriba en las
     decenas hay un 5 y abajo un 2. Pasa siempre que en la columna que pide la diferencia es 5 (2/7, 3/8, 4/9, 0/5, 1/6). */
  it('resta: 352 − 127 = 235 (vecina sin tachar) no dice «arriba hay un número más pequeño»', () => {
    const ex = makeColumnSub(352, 127)
    const r = check(ex, { type: 'digits', digits: digits(235) })
    expect(r.correct).toBe(false)
    expect(r.wrongColumns).toEqual([1])
    expect(r.errorType).toBe('borrow-forgot')
    expect(r.feedback).not.toMatch(/más pequeño/)
  })

  /* Galera: las pistas llaman «el número que reparte» al DIVISOR («Escribe ese número debajo del número que reparte.
     Multiplícalo por el número que reparte»), mientras que la propia galera (leyenda de DivisionView y
     activities/division/index.tsx) llama «el número que (se) repartes» al DIVIDENDO. Solo cambia una letra: la niña
     entiende «escribe el cociente debajo del dividendo y multiplícalo por el dividendo», que es falso. */
  it('galera: la pista dice «divisor», no «el número que reparte» (que la niña lee como el dividendo)', () => {
    for (const ex of [makeDivision(85, 4), makeDivision(72, 3)]) {
      for (const h of hintsFor(ex)) expect(h.text).not.toMatch(/número que reparte/)
    }
  })
})
