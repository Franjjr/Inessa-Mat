/* «Así se resuelve» (solution.ts): for every maths skill of 3.º and 4.º, the solution has its steps, an answer that is the
   corrector's own expected answer, and no step asks anything back («= ?») or leaves a template brace. */
import { describe, expect, it } from 'vitest'
import { check, createRng, generate, makeColumnSub, makeDivision, makeDivision3 } from '@/engine'
import { genBarProblem } from '@/engine/bars'
import { solutionFor } from '@/engine/solution'
import { GRADE3_SYLLABUS, GRADE4_SYLLABUS, availableSkills } from '@/content/syllabus'
import { isHandwritingSkill, subjectOfSkill } from '@/engine/subjects'
import type { BarProblemExercise, Exercise } from '@/types'
import { correctAnswer } from './helpers'

const MATH_SKILLS = [...new Set([...availableSkills(GRADE3_SYLLABUS), ...availableSkills(GRADE4_SYLLABUS)])]
  .filter((s) => subjectOfSkill(s) === 'math' && !isHandwritingSkill(s))
  .sort()

/** Numbers as tokens, with thousands written together («3 000» → 3000) and the decimal comma kept. */
const numbersIn = (text: string) => (text.replace(/(\d)[   ](?=\d{3}(?!\d))/g, '$1').match(/\d+(?:,\d+)?/g) ?? [])

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
