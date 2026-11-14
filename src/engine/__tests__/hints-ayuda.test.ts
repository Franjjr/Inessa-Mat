/* Pistas coherentes (auditoría P4): one trick for the three hints of a fact, the galera started with the number it really
   takes, the column multiplication worked house by house, the borrow named by its column, and no school jargon
   («dividendo», «cociente», «resto») nor fingers in the hints. */
import { describe, expect, it } from 'vitest'
import {
  TABLE_METHODS, createRng, generate, hintsFor, makeColumnMul, makeColumnSub, makeDivision, makeDivision3, makeDoubleChain,
  makeFactDiv, makeFactMul,
} from '@/engine'
import { trickDetail } from '@/engine/strategies'
import type { Exercise, ExerciseKind, TableMethod } from '@/types'

const texts = (ex: Exercise, opts: Parameters<typeof hintsFor>[2] = {}, method?: Parameters<typeof hintsFor>[1]) =>
  hintsFor(ex, method, opts).map((h) => h.text)

/** The words that name each favourite trick: each of the three hints must say one of them. */
const TRICK_WORDS: Record<TableMethod, (a: number, b: number) => RegExp> = {
  double: () => /doble/i,
  'double-double': () => /doble|Dobla/i,
  'half-ten': () => /mitad/i,
  'ten-minus-one': () => /× 10|veces 10/,
  'five-plus-one': () => /Cinco veces|5 filas|5 ×/,
  mirror: (a, b) => new RegExp(`${b} × ${a}`),
}

describe('fact hints: one trick for the three hints', () => {
  it('for every fact and every favourite trick that applies, the three hints name the same trick', () => {
    let checked = 0
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        for (const t of TABLE_METHODS.filter((m) => m.applies(a, b))) {
          // 2 × 5 with «la mitad del 10»: the 10 is the answer itself, so the engine's double explains it instead.
          if (!trickDetail(t.id, a, b)) continue
          const hs = texts(makeFactMul(a, b), { tableMethod: t.id })
          for (const h of hs) expect(h, `${a} × ${b} con «${t.id}»: ${hs.join(' | ')}`).toMatch(TRICK_WORDS[t.id](a, b))
          checked++
        }
      }
    }
    expect(checked).toBeGreaterThan(150)
  })

  it('8 × 9 with «doble y doble» does not switch to the trick of the 9', () => {
    for (const [a, b] of [[8, 9], [9, 8]]) {
      const hs = texts(makeFactMul(a, b), { tableMethod: 'double-double' })
      for (const h of hs) expect(h).not.toMatch(/uno menos/)
      expect(hs.join(' ')).toMatch(/doble/i)
    }
  })

  it('the 5 and one more of the lesson: 6 × 8 is five times 8, the dots of 5 + 1 rows and 40 + 8', () => {
    const hs = hintsFor(makeFactMul(6, 8), undefined, { tableMethod: 'five-plus-one' })
    expect(hs[0].text).toBe('Cinco veces el 8, y una vez más el 8.')
    expect(hs[1]).toMatchObject({ visual: 'dots-five-plus-one', params: { a: 6, b: 8 } })
    expect(hs[2].text).toBe('5 × 8 = 40. Y una fila más: 40 + 8 = ?')
  })

  it('without a favourite trick, the 5, the 9 and the mirror keep one trick too', () => {
    const five = texts(makeFactMul(5, 7))
    for (const h of five) expect(h).toMatch(/5 en 5|saltos de 5/)
    const nine = texts(makeFactMul(7, 9))
    for (const h of nine) expect(h).toMatch(/uno menos|suma 9|= 9/)
    const mirror = texts(makeFactMul(7, 6))
    for (const h of mirror) expect(h).toMatch(/6 × 7|5 × 7|5 filas/)
  })

  it('no hint of any fact speaks of fingers, nor ends in «→ ?»', () => {
    const methods: (TableMethod | null)[] = [null, ...TABLE_METHODS.map((t) => t.id)]
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        for (const m of methods) {
          for (const h of texts(makeFactMul(a, b), { tableMethod: m })) {
            expect(h, `${a} × ${b}`).not.toMatch(/dedo/i)
            expect(h, `${a} × ${b}`).not.toMatch(/→ \?/)
          }
        }
      }
    }
  })
})

describe('division hints', () => {
  it('the galera starts with the number it really takes', () => {
    expect(hintsFor(makeDivision3(5248, 8))[2].text).toContain('en 52')
    expect(hintsFor(makeDivision3(5248, 8))[2].text).toContain('Mira la primera cifra, 5: el 8 no cabe. Coge dos cifras: 52.')
    expect(hintsFor(makeDivision3(894, 3))[2].text).toContain('en el 8')
    expect(hintsFor(makeDivision3(8940, 3))[2].text).toContain('en el 8')
    expect(hintsFor(makeDivision3(894, 3))[0].text).toBe('Empieza por la izquierda: coge las cifras que hagan falta para que quepa el número entre el que repartes (el divisor).')
  })

  it('no division hint says «arriba» or «fila», and «galera sin restas» does not speak of subtracting', () => {
    const divs: Exercise[] = []
    for (let seed = 1; seed <= 30; seed++) divs.push(...generate({ kinds: ['division'] }, 6, { rng: createRng(seed) }))
    divs.push(makeDivision(22, 5), makeDivision(17, 5), makeDivision3(5248, 8), makeDivision3(2456, 23), makeDivision3(2400, 80))
    for (const ex of divs) {
      for (const m of [undefined, 'galera', 'galera-short', 'div-parts', 'climb'] as const) {
        const hs = texts(ex, { divMethod: m })
        for (const h of hs) expect(h, `${ex.id} ${m}: ${h}`).not.toMatch(/arriba|fila/)
        if (m === 'galera-short') for (const h of hs) expect(h, `${ex.id}: ${h}`).not.toMatch(/rest/)
      }
    }
    expect(hintsFor(makeDivision(22, 5))[2].text).toBe('Cuenta de 5 en 5 y para antes de pasarte de 22: ¿cuántas veces has contado?')
  })

  it('a two-digit divisor: the round divisor says which table to think of, with the division to think about', () => {
    const round = texts(makeDivision3(2400, 80)).join(' ')
    expect(round).toContain('El 80 ya es redondo: piensa en la tabla del 8 (24 : 8) y comprueba multiplicando por 80.')
    for (const ex of [makeDivision3(2400, 80), makeDivision3(2456, 23), makeDivision3(987, 41)]) {
      for (const h of texts(ex)) expect(h).not.toContain('y piensa con ese número')
    }
  })

  it('fact divisions share out, as in the lesson, with «:» and without «grupos de»', () => {
    for (let d = 2; d <= 10; d++) {
      for (let q = 1; q <= 10; q++) {
        const hs = texts(makeFactDiv(d * q, d))
        for (const h of hs) {
          expect(h).not.toMatch(/grupos de/)
          expect(h).not.toMatch(/÷/)
        }
      }
    }
    const hs = texts(makeFactDiv(15, 3))
    expect(hs[0]).toBe('Reparte 15 entre 3, de uno en uno: ¿cuántos le tocan a cada uno?')
    expect(hs[1]).toContain('¿3 por cuánto da 15?')
  })

  it('the worked example of a fact division never has the divisor equal to the result (no 4 : 2)', () => {
    for (let d = 2; d <= 10; d++) {
      for (let q = 1; q <= 10; q++) {
        const text = hintsFor(makeFactDiv(d * q, d))[2].text
        const m = /Ejemplo con otro caso: (\d+) : (\d+)\. .*Son (\d+) saltos/.exec(text)
        expect(m, text).not.toBeNull()
        expect(Number(m![2]), text).not.toBe(Number(m![3]))
        expect(Number(m![1])).toBe(Number(m![2]) * Number(m![3]))
      }
    }
  })

  it('no division hint uses «dividendo», «divisor», «cociente» or «resto» without explaining it in brackets', () => {
    const kinds: ExerciseKind[] = ['division', 'fact-div', 'word-problem']
    for (let seed = 1; seed <= 20; seed++) {
      for (const ex of generate({ kinds }, 6, { rng: createRng(seed) })) {
        for (const h of texts(ex)) {
          const bare = h.replace(/\([^)]*\)/g, '')
          expect(bare, `${ex.id}: ${h}`).not.toMatch(/dividendo|divisor|cociente|resto/i)
        }
      }
    }
  })
})

describe('column hints', () => {
  it('a borrow names the lending column: 841 − 390 borrows 1 centena, which is 10 decenas', () => {
    const hs = texts(makeColumnSub(841, 390))
    expect(hs[1]).toContain('centena')
    expect(hs[1]).toContain('La vecina de las centenas te presta 1 centena, que son 10 decenas')
  })

  it('«me llevo una» says what to write, without «no te quedes parado»', () => {
    const hs = texts(makeColumnSub(352, 127), {}, 'carry')
    expect(hs[1]).not.toContain('no te quedes parado')
    expect(hs[1]).toBe('Si arriba hay menos que abajo, pon un 1 delante del de arriba (suma 10) y escribe un 1 pequeño junto a la cifra de abajo de la casa siguiente.')
  })

  it('a column multiplication is worked house by house: 525 × 8 never says «52 × 8»', () => {
    const h3 = hintsFor(makeColumnMul(525, 8))[2].text
    expect(h3).not.toContain('52 × 8')
    expect(h3).toBe('Unidades: 5 × 8 = 40, escribo 0 y me llevo 4. Decenas: 2 × 8 = 16, más 4 = 20, escribo 0 y me llevo 2. Centenas: 5 × 8 = 40, más 2 = ?')
    expect(hintsFor(makeColumnMul(525, 8))[1].text).toBe('Parte el número: 525 = 500 + 20 + 5. Multiplica cada parte por 8.')
  })
})

describe('double chains', () => {
  it('the first hint and the drawing show only the first double, never the last answer', () => {
    const ex = makeDoubleChain(4, 3)
    const hs = hintsFor(ex)
    expect(hs[0].text).not.toContain('32')
    expect(hs[1].params).toMatchObject({ start: 4, steps: 1 })
    for (const h of hs) expect(h.text).not.toMatch(/\b32\b/)
  })
})
