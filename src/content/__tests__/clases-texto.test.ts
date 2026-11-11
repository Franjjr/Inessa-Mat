/* Wording rules of the maths classes (audit p3-clases H7, H10, H15, H17, H19, P6-13): words a child of 7-8 reads, one sign for
   dividing, no arrows in the sentences, and the rules the exercises repeat. */
import { describe, expect, it } from 'vitest'
import { CLASSES } from '@/content/classes'
import { GRADE3_STAGES, GRADE3_SYLLABUS } from '@/content/syllabus'

const textOf = (id: string) => CLASSES.find((c) => c.lesson.id === id)!.lesson.steps.map((s) => s.text).join(' ')
/** Everything a class writes: the sentences and the texts its drawings carry. */
const allWords = (cls: (typeof CLASSES)[number]) => JSON.stringify(cls.lesson.steps.map((s) => [s.text, s.params]))
const stageOf = (topicId: string) => GRADE3_STAGES.findIndex((st) => st.topics.includes(topicId)) + 1

describe('clases-texto', () => {
  it('no class divides with «÷»: the sign is «:»', () => {
    for (const cls of CLASSES) expect(allWords(cls), cls.lesson.id).not.toContain('÷')
  })

  it('no arrow is written in a sentence (the arrows are on the drawing)', () => {
    for (const cls of CLASSES) expect(cls.lesson.steps.map((s) => s.text).join(' '), cls.lesson.id).not.toMatch(/[→←↑↓]/)
  })

  it('no class says «puntaje», «etapa», «Las bandejas caben» or «Mira el truco»', () => {
    for (const cls of CLASSES) expect(allWords(cls), cls.lesson.id).not.toMatch(/puntaje|etapa|Las bandejas caben|Mira el truco/)
  })

  it('a class before the division stage writes «:» between numbers only for the hours or for dividing by 10, 100 or 1 000', () => {
    for (const cls of CLASSES) {
      if (stageOf(cls.topicId) >= 8) continue
      const found = cls.lesson.steps.map((s) => s.text).join(' ').match(/\d\s:\s\d/g) ?? []
      const text = cls.lesson.steps.map((s) => s.text).join(' ')
      const hours = /\d{1,2}:\d{2}/.test(text)
      if (found.length && !hours) expect(cls.topicId, `${cls.lesson.id}: ${found.join(' ')}`).toBe('mul-10-100')
    }
  })

  it('the syllabus writes the check of a division as the classes do', () => {
    const text = JSON.stringify(GRADE3_SYLLABUS)
    expect(text).not.toMatch(/divisor × cociente|cociente × divisor/)
  })

  it('descomponer says the same about the 0 as the exercise, and starts with the thousands', () => {
    const text = textOf('c3-descomponer')
    expect(text).toContain('Si una cifra es 0, puedes escribir 0 o dejar la casilla vacía.')
    expect(text.indexOf('millares')).toBeGreaterThanOrEqual(0)
    expect(text.indexOf('millares')).toBeLessThan(text.indexOf('centenas'))
    expect(text).not.toContain('no la escribimos')
  })

  it('comprobar shows a sum checked with a subtraction before the tries', () => {
    const cls = CLASSES.find((c) => c.lesson.id === 'c3-comprobar')!
    const ejemplo = cls.lesson.steps.slice(cls.phases.para, cls.phases.para + cls.phases.ejemplo).map((s) => s.text).join(' ')
    expect(ejemplo).toContain('47 + 35 = 82')
    expect(ejemplo).toContain('82 − 35 = 47')
  })

  it('the first step of a problem class asks without the answer on the drawing', () => {
    const answers: Record<string, string> = { 'c3-prob-sumar': '23', 'c3-prob-restar': '9', 'c3-prob-multiplicar': '12', 'c3-prob-dividir': '4' }
    for (const [id, answer] of Object.entries(answers)) {
      const first = CLASSES.find((c) => c.lesson.id === id)!.lesson.steps[0]
      expect(first.visual, id).not.toBe('bar-model')
      expect(JSON.stringify(first.params ?? {}), id).not.toMatch(new RegExp(`(^|\\D)${answer}(\\D|$)`))
    }
  })

  it('the classes of problems teach the buttons of the exercise (Juntar, Repetir)', () => {
    expect(textOf('c3-prob-sumar')).toContain('Juntar')
    expect(textOf('c3-prob-multiplicar')).toContain('Repetir')
  })

  it('the division classes say «divisor por cociente, más el resto, da el dividendo»', () => {
    expect(textOf('c3-comprobar')).toContain('el divisor por el cociente, más el resto, da el dividendo')
    expect(textOf('c3-div-3x1')).toContain('el divisor por el cociente, más el resto, da el dividendo')
  })
})
