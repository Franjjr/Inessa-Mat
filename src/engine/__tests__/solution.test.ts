/* «Así se resuelve» (solution.ts): for every maths skill of 3.º and 4.º, the solution has its steps, an answer that is the
   corrector's own expected answer, and no step asks anything back («= ?») or leaves a template brace. */
import { describe, expect, it } from 'vitest'
import { check, createRng, generate, makeColumnSub, makeDivision, makeDivision3 } from '@/engine'
import { genBarProblem } from '@/engine/bars'
import { makeMental } from '@/engine/calc'
import { makeBudget } from '@/engine/money'
import { solutionFor } from '@/engine/solution'
import { GRADE3_SYLLABUS, GRADE4_SYLLABUS, availableSkills } from '@/content/syllabus'
import { isHandwritingSkill, subjectOfSkill } from '@/engine/subjects'
import type { BarProblemExercise, Exercise } from '@/types'
import { correctAnswer } from './helpers'

const MATH_SKILLS = [...new Set([...availableSkills(GRADE3_SYLLABUS), ...availableSkills(GRADE4_SYLLABUS)])]
  .filter((s) => subjectOfSkill(s) === 'math' && !isHandwritingSkill(s))
  .sort()

/** Numbers as tokens, with thousands written together («3 000» → 3000) and the decimal comma kept. */
const numbersIn = (text: string): string[] => [...(text.replace(/(\d)[ \u00a0\u202f](?=\d{3}(?!\d))/g, '$1').match(/\d+(?:,\d+)?/g) ?? [])]

/** The answer holds the corrector's expected answer: its numbers (the column of «encuentra el error» is the column's name in
    the solution, and «resto 0» is «no sobra nada»), or its words when it has no number. */
function matches(expected: string, answer: string): boolean {
  // A negative check number (a claimed sum smaller than its addend) is never shown to the child: the verdict is.
  const exp = expected.replace(/columna \d+:\s*/g, '').replace(/resto 0\b/g, '').replace(/-\d+/g, '')
  const want = numbersIn(exp)
  if (want.length) {
    const have = numbersIn(answer)
    return want.every((n) => have.includes(n))
  }
  const low = answer.toLocaleLowerCase('es')
  const words = exp.toLocaleLowerCase('es').match(/\p{L}+/gu)
  return words ? words.every((w) => low.includes(w)) : low.includes(exp.trim())
}

describe('solutionFor: every maths skill (5 seeds)', () => {
  it('has the skills of both years', () => {
    expect(MATH_SKILLS.length).toBeGreaterThan(80)
  })

  it.each(MATH_SKILLS)('%s', (skill) => {
    let seen = 0
    for (let seed = 1; seed <= 5; seed++) {
      for (const ex of generate({ skills: [skill] }, 2, { rng: createRng(seed * 97 + 11) })) {
        seen++
        const sol = solutionFor(ex)
        const expected = check(ex, correctAnswer(ex)).expected
        expect(sol.steps.length, ex.id).toBeGreaterThanOrEqual(1)
        expect(sol.answer.trim().length, ex.id).toBeGreaterThan(0)
        expect(matches(expected, sol.answer), `${ex.id}: «${sol.answer}» vs «${expected}»`).toBe(true)
        for (const text of [...sol.steps, sol.answer]) {
          expect(text, ex.id).not.toMatch(/=\s*\?/)
          expect(text, ex.id).not.toMatch(/undefined|NaN|\[object/)
          expect(text.replace(/\{(child|pet)\}/g, ''), ex.id).not.toMatch(/[{}]/)
        }
      }
    }
    expect(seen).toBeGreaterThan(0)
  })
})

describe('solutionFor: the worked examples of the audit', () => {
  it('841 − 390: the borrow, step by step, and 451', () => {
    const sol = solutionFor(makeColumnSub(841, 390))
    expect(sol.steps).toEqual([
      'Unidades: 1 − 0 = 1.',
      'Decenas: 4 es menos que 9, pido 1 centena a la vecina: 14 − 9 = 5, y el 8 se queda en 7.',
      'Centenas: 7 − 3 = 4.',
      'Resultado: 451.',
    ])
    expect(sol.answer).toBe('451')
  })

  it('the zero trap: 503 − 128 asks the centenas and every 0 becomes 9', () => {
    const steps = solutionFor(makeColumnSub(503, 128)).steps
    expect(steps[0]).toBe('Unidades: 3 es menos que 8 y la vecina es un 0. Pido a las centenas: el 5 se queda en 4 y cada 0 se convierte en 9. Ahora 13 − 8 = 5.')
    expect(steps[1]).toBe('Decenas: 9 − 2 = 7.')
    expect(steps[2]).toBe('Centenas: 4 − 1 = 3.')
  })

  it('the other subtraction methods solve with their own steps and the same answer', () => {
    const ex = makeColumnSub(841, 390)
    expect(solutionFor(ex, { subMethod: 'carry' }).steps[1]).toContain('me llevo 1 a la cifra de abajo de las centenas')
    expect(solutionFor(ex, { subMethod: 'parts' }).steps).toContain('841 − 300 = 541.')
    expect(solutionFor(ex, { subMethod: 'line' }).steps.at(-2)).toContain('= 451')
    for (const m of ['borrow', 'carry', 'parts', 'line'] as const) expect(solutionFor(ex, { subMethod: m }).answer).toBe('451')
  })

  it('a bar problem: the pieces, the whole bar and the operation, with the unit', () => {
    let found: BarProblemExercise | null = null
    for (let seed = 1; seed < 400 && !found; seed++) {
      const ex = genBarProblem('add', createRng(seed))
      if (ex.steps.length === 1) found = ex
    }
    const ex = found!
    const [st] = ex.steps
    const sol = solutionFor(ex)
    expect(sol.steps[0]).toContain('son los trozos de la barra')
    expect(sol.steps[0]).toContain('Para la barra entera se juntan los trozos')
    expect(sol.steps[0]).toContain(`${st.a} + ${st.b} = ${st.result}`)
    expect(sol.answer).toBe(`${ex.answer} ${ex.unit}`)
  })

  it('a division: the galera step by step, with what is left over and the check', () => {
    const sol = solutionFor(makeDivision3(5248, 8))
    expect(sol.steps[0]).toBe('Cojo 52, porque el 8 no cabe en el 5. El 8 cabe 6 veces en 52: 6 × 8 = 48, y sobran 4.')
    expect(sol.steps[1]).toBe('Bajo el 4: tengo 44. El 8 cabe 5 veces en 44: 5 × 8 = 40, y sobran 4.')
    expect(sol.steps[2]).toBe('Bajo el 8: tengo 48. El 8 cabe 6 veces en 48: 6 × 8 = 48, y no sobra nada.')
    expect(sol.steps.at(-1)).toBe('Resultado: 656. Compruebo: 656 × 8 = 5248.')
    expect(solutionFor(makeDivision(22, 5)).answer).toBe('4, y sobran 2')
    // A 0 brought down: «el 3 no cabe en 0», and a 0 in the result.
    expect(solutionFor(makeDivision3(8940, 3)).steps.at(-2)).toBe('Bajo el 0: tengo 0. El 3 no cabe en 0: escribo 0 en el resultado.')
  })

  it('a multiplication fact uses the favourite trick when it applies, worked to the end', () => {
    const ex = generate({ kinds: ['fact-mul'], tables: [6], factorRange: [8, 8] }, 1, { rng: createRng(1) })[0] as Exercise & { kind: 'fact-mul' }
    const sol = solutionFor(ex, { tableMethod: 'five-plus-one' })
    expect(sol.steps.join(' ')).toContain(`= ${ex.answer}`)
    expect(sol.answer).toBe(`${ex.a} × ${ex.b} = ${ex.answer}`)
  })
})

// ---------------------------------------------------------------- every «a op b = c» of a solution is true

const NUM = String.raw`\d{1,3}(?: \d{3})+(?![\d/]|,\d)|\d+(?:,\d+)?(?![\d/]|,\d)`
const SIDE = String.raw`\(?(?:${NUM})\)?(?: [+−×:] \(?(?:${NUM})\)?)*`
/** Chains like «8 × 43 = 8 × 40 + 8 × 3», not preceded by a digit, a comma or a slash (fractions and clock times stay out). */
const CHAIN = new RegExp(String.raw`(?<![\d,/])(${SIDE})((?: = ${SIDE})+)`, 'g')

/** The value of one side: brackets, then × and :, then + and − from the left (thousands with a space, decimal comma). */
function valueOf(side: string): number {
  const js = side.replace(/(\d) (?=\d{3})/g, '$1').replace(/,/g, '.').replace(/−/g, '-').replace(/×/g, '*').replace(/ : /g, ' / ')
  if (!/^[\d.+\-*/() ]+$/.test(js)) throw new Error(`not arithmetic: ${side}`)
  return Function(`"use strict"; return (${js})`)() as number
}

/** Every equality chain of a text, with the values of its sides. */
function equalities(text: string): { chain: string; values: number[] }[] {
  return [...text.matchAll(CHAIN)].map((m) => ({ chain: m[0], values: m[0].split(' = ').map(valueOf) }))
}

describe('solutionFor: the arithmetic of every step is true', () => {
  it('the checker finds chains and catches a false one', () => {
    expect(equalities('8 × 43 = 8 × 40 + 8 × 3, y 10 000 + 7000 = 17 000.').map((e) => e.values)).toEqual([[344, 344], [17000, 17000]])
    expect(equalities('Unidades: 5 × 8 = 41.')[0].values).toEqual([40, 41])
    expect(equalities('3/8 + 2/8 = 5/8 y las 12:40')).toEqual([])
  })

  const OPTS = [{}, { subMethod: 'carry' as const }, { subMethod: 'parts' as const }, { subMethod: 'line' as const },
    { tableMethod: 'double-double' as const }, { tableMethod: 'five-plus-one' as const }]

  it.each(MATH_SKILLS)('%s', (skill) => {
    for (let seed = 1; seed <= 5; seed++) {
      for (const ex of generate({ skills: [skill] }, 2, { rng: createRng(seed * 53 + 3) })) {
        for (const opts of OPTS) {
          for (const text of solutionFor(ex, opts).steps) {
            const where = `${ex.id}: «${text}»`
            for (const eq of equalities(text)) {
              expect(new Set(eq.values.map((v) => Math.round(v * 1000))).size, `${where} (${eq.chain})`).toBe(1)
            }
            // A step states: no arrow, no blank, no question, no trailing «…», and it ends with its full stop.
            expect(text, where).not.toMatch(/→|__|\?/)
            // (A shape hint lists words: «se dice «un», con varias, «dos», «tres»…».)
            if (ex.kind !== 'shape-choice') expect(text, where).not.toMatch(/…/)
            expect(text.trim(), where).toMatch(ex.kind === 'shape-choice' ? /[.!»)…]$/ : /[.!»)]$/)
            expect(text, where).not.toMatch(/\.»|\.\.$/)
          }
        }
      }
    }
  })
})

describe('solutionFor: the texts the review pointed at', () => {
  const pv = (value: number) => ({
    id: `place-value:blocks:${value}`, kind: 'place-value', skill: 'place:blocks', difficulty: 2, mode: 'blocks', value, parts: [], answer: value,
  }) as unknown as Exercise

  it('place value of 17 511: every column, the decena de millar too, and the singular for a 1', () => {
    expect(solutionFor(pv(17511)).steps).toEqual([
      'Hay 1 decena de millar, 7 millares, 5 centenas, 1 decena y 1 unidad.',
      '10 000 + 7000 + 500 + 10 + 1 = 17 511.',
    ])
  })

  it('place value of 77 606 has the 70 000 and leaves out the columns worth 0', () => {
    expect(solutionFor(pv(77606)).steps).toEqual([
      'Hay 7 decenas de millar, 7 millares, 6 centenas y 6 unidades.',
      '70 000 + 7000 + 600 + 6 = 77 606.',
    ])
  })

  it('cálculo mental: each family worked with its own steps, never the prompt copied back', () => {
    const steps = (family: Parameters<typeof makeMental>[0], a: number, b: number, answer: number, prompt: string, extra = {}) =>
      solutionFor(makeMental(family, a, b, answer, prompt, extra)).steps
    expect(steps('dobles', 51, 0, 102, '¿Cuánto es el doble de 51?')).toEqual(['Parto el 51 en 50 y 1, y doblo cada parte.', '50 + 50 = 100.', '1 + 1 = 2.', 'Junto las dos partes: 100 + 2 = 102.'])
    expect(steps('mitades', 74, 0, 37, '¿Cuánto es la mitad de 74?')).toContain('La mitad de 70 es 35, porque 35 + 35 = 70.')
    expect(steps('triples', 26, 0, 78, '¿Cuánto es el triple de 26?')).toEqual(['Parto el 26 en 20 y 6, y triplico cada parte.', '20 + 20 + 20 = 60.', '6 + 6 + 6 = 18.', 'Junto las dos partes: 60 + 18 = 78.'])
    const dist = steps('distributiva', 8, 43, 24, '8 × 43 = 8 × 40 + __')
    expect(dist).toContain('8 × 40 = 320.')
    expect(dist).toContain('8 × 3 = 24: ese es el número que falta.')
    expect(steps('romanos', 87, 0, 87, '¿Qué número es LXXXVII?').at(-1)).toBe('Sumo los trozos: 50 + 10 + 10 + 10 + 5 + 1 + 1 = 87.')
    expect(steps('estimar', 288, 124, 200, 'Estima redondeando a las centenas: 288 − 124 = ?', { place: 100 })).toEqual([
      'Redondeo cada número a las centenas: 288 se queda en 300 y 124, en 100.',
      '300 − 100 = 200.',
    ])
  })

  it('measures: the conversion before the sum, units in words, the claim without a double full stop', () => {
    const add = generate({ skills: ['measure:add'] }, 30, { rng: createRng(5) }).find((e) => e.id.startsWith('measure:add:capacity'))
    expect(add).toBeDefined()
    const sol = solutionFor(add!)
    expect(sol.steps.join(' ')).toMatch(/litros? son 1000 mililitros/)
    expect(sol.steps.at(-1)).toMatch(/^Sumo: \d+ \+ \d+ = \d+ mililitros\.$/)
    expect(sol.answer).toMatch(/mililitros$/)
    for (const ex of generate({ skills: ['measure:unit'] }, 20, { rng: createRng(2) })) {
      expect(solutionFor(ex).steps.join(' ')).not.toMatch(/en (l|ml|g|kg|m|cm|km)\./)
    }
  })

  it('money budget: the prices added, and no «La respuesta es Sí» in the middle of a sentence', () => {
    const items = [{ name: 'un helado', emoji: '', price: 120 }, { name: 'un pincel', emoji: '', price: 75 }]
    const sol = solutionFor(makeBudget('enough', 200, items))
    expect(sol.steps).toContain('Sumo los precios: 1,20 € + 0,75 € = 1,95 €.')
    expect(sol.steps.join(' ')).not.toContain('La respuesta es Sí')
  })

  it('shape count: «las esquinas una a una»', () => {
    const all = [1, 2, 3, 4, 5, 6].flatMap((s) => generate({ kinds: ['shape-count'] }, 4, { rng: createRng(s) }))
    const ex = all.find((e) => e.kind === 'shape-count' && e.ask === 'vertices')
    expect(ex).toBeDefined()
    expect(solutionFor(ex!).steps[0]).toContain('las esquinas una a una')
  })

  it('fact 4 × 3 with doble y doble: each doubling a sentence, no arrow, no «…»', () => {
    const ex = generate({ kinds: ['fact-mul'], tables: [4], factorRange: [3, 3] }, 1, { rng: createRng(1) })[0]
    const text = solutionFor(ex).steps.join(' ')
    expect(text).not.toMatch(/→|…/)
    expect(text).toContain('= 12.')
  })
})
