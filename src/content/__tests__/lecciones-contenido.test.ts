/* What the lessons teach and ask: the ways of working are shown, not chosen in a lesson; every try is of the shape of
   the worked example before it; the optional lessons sit at the end of their world; the worked examples come before
   the exercise (P3: «antes de pedir algo, se explica con un ejemplo resuelto»). */
import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import type { ColumnSubExercise, DivisionExercise, FactMulExercise, LessonDef, LessonStep } from '@/types'
import { c2Lessons } from '../c2/lessons'
import { lessons } from '../lessons'
import { season1, seasonC2 } from '../season'

const ALL: LessonDef[] = [...lessons, ...c2Lessons]
const lessonOf = (id: string) => ALL.find((l) => l.id === id)!
const triesOf = (l: LessonDef) => l.steps.filter((s) => s.interaction === 'try')

/** The exercise of a try step for seeds 0..20. */
function samples(step: LessonStep) {
  return Array.from({ length: 21 }, (_, seed) => generate(step.trySelector!, 1, { rng: createRng(seed) })[0])
}

describe('the ways of working are shown, not chosen', () => {
  it('no lesson has a «choose» step of the way of subtracting or dividing', () => {
    for (const l of ALL) {
      for (const [i, s] of l.steps.entries()) {
        if (s.interaction === 'choose') expect(s.preference === 'subMethod' || s.preference === 'divMethod', `${l.id}#${i}`).toBe(false)
      }
    }
  })

  it('no try asks for the number line, the parts or the climb', () => {
    for (const l of ALL) {
      for (const [i, s] of l.steps.entries()) {
        expect(['line', 'parts']).not.toContain(s.method)
        expect(['div-parts', 'climb']).not.toContain(s.divMethod)
        expect(['sub-line', 'sub-parts', 'div-parts', 'div-climb'], `${l.id}#${i}`).not.toContain(s.visual)
      }
    }
  })

  it('the tricks of Lumi are a review, with no step that saves a favourite', () => {
    const tricks = lessonOf('w3-tricks')
    expect(tricks.steps.some((s) => s.interaction === 'choose')).toBe(false)
  })
})

describe('«Dos formas de restar del cole»', () => {
  const l = lessonOf('w4-four-ways')

  it('shows the two ways with the same example, 352 − 127, and a try of each', () => {
    expect(l.steps[0].text).toContain('352 − 127')
    expect(triesOf(l).map((s) => s.method)).toEqual(['borrow', 'carry'])
    expect(l.steps.some((s) => s.visual === 'sub-carry' && s.text.includes('Ponemos un 1 delante del 2'))).toBe(true)
  })

  it('every try is a 3-digit subtraction with one borrowing and no borrowing across a zero', () => {
    for (const step of triesOf(l)) {
      expect(step.trySelector).toEqual({ kinds: ['column-sub'], digits: 3, regroup: 'one', zeros: false })
      for (const ex of samples(step) as ColumnSubExercise[]) {
        expect(String(ex.minuend).length).toBe(3)
        expect(ex.borrowed.filter(Boolean), `${ex.minuend} − ${ex.subtrahend}`).toHaveLength(1)
        // the digit that lends is never a zero
        const lender = ex.borrowed.findIndex(Boolean) + 1
        expect(String(ex.minuend).split('').reverse()[lender], `${ex.minuend} − ${ex.subtrahend}`).not.toBe('0')
      }
    }
  })

  it('is the last stop before the guardian of world 4 (the child can skip it)', () => {
    const w4 = season1.worlds.find((w) => w.id === 'w4')!
    const ids = w4.nodes.map((n) => n.id)
    expect(ids[ids.length - 2]).toBe('lesson-four-ways')
    expect(w4.nodes[ids.length - 2].title).toBe('Dos formas de restar del cole')
  })
})

describe('the galera', () => {
  it('«Dos formas de hacer la galera» is the last stop before the guardian of world 8, with no choice', () => {
    const w8 = season1.worlds.find((w) => w.id === 'w8')!
    const ids = w8.nodes.map((n) => n.id)
    expect(ids[ids.length - 2]).toBe('lesson-div-ways')
    const l = lessonOf('w8-div-ways')
    expect(l.title).toBe('Dos formas de hacer la galera')
    expect(l.steps.some((s) => s.interaction === 'choose')).toBe(false)
    expect(triesOf(l).map((s) => s.divMethod)).toEqual(['galera', 'galera-short'])
  })

  it('«La casita de la división» has the written galera, the 17 : 5 with remainder and the check', () => {
    const l = lessonOf('w8-galera')
    expect(l.steps.filter((s) => s.visual === 'galera').every((s) => s.params?.written === 1)).toBe(true)
    expect(l.steps.some((s) => s.visual === 'division-check')).toBe(true)
    expect(l.steps.some((s) => s.text.includes('72'))).toBe(false)
  })

  it('the exact try of the lesson asks for an exact division', () => {
    const exact = triesOf(lessonOf('w8-galera')).filter((s) => s.trySelector?.divisionVariants?.[0] === 'exact')
    expect(exact).toHaveLength(1)
    for (const ex of samples(exact[0]) as DivisionExercise[]) expect(ex.remainder).toBe(0)
  })

  // The generator (src/engine/generate.ts) can still draw 80 : 2 or 60 : 3, whose units are 0: the selector has no way to
  // leave them out yet (see the notes of the integration).
  it.todo('the exact tries of the lesson never ask for a dividend that ends in 0')
})

describe('the tricks of the tables', () => {
  it('the try of «el 5 y uno más» never asks for the 9 and names its trick', () => {
    const step = triesOf(lessonOf('w3-five'))[0] as LessonStep & { tableMethod?: string }
    expect(step.tableMethod).toBe('five-plus-one')
    for (const ex of samples(step) as FactMulExercise[]) expect([ex.a, ex.b], `${ex.a} × ${ex.b}`).not.toContain(9)
  })

  it('the try of «los secretos del 8» works with the double of the double', () => {
    const step = triesOf(lessonOf('w5-pattern'))[0] as LessonStep & { tableMethod?: string }
    expect(step.tableMethod).toBe('double-double')
  })

  it('«Los trucos de Lumi» come after the two tricks of the 6 in world 3', () => {
    const ids = season1.worlds.find((w) => w.id === 'w3')!.nodes.map((n) => n.id)
    expect(ids.indexOf('lesson-tricks')).toBe(ids.indexOf('lesson-rhyme') + 1)
    expect(lessonOf('w3-tricks').steps[0].text).toBe('Ya conoces varios trucos para las tablas. Vamos a repasarlos uno a uno.')
  })

  it('the nine: the lesson of the 9 does not talk about the table of 7', () => {
    for (const s of lessonOf('w6-nine').steps) expect(s.text, s.text).not.toMatch(/tabla del 7/)
  })

  it('no node of world 1 asks for the tables of 3 or 4', () => {
    const w1 = season1.worlds.find((w) => w.id === 'w1')!
    for (const n of w1.nodes) {
      const tables = n.activity?.selector.tables ?? []
      expect(tables, n.id).not.toContain(3)
      expect(tables, n.id).not.toContain(4)
    }
  })
})

describe('worked examples before the exercise', () => {
  it('«Cada número en su casa» shows an addition in columns before the child writes one', () => {
    const l = lessonOf('w2-placevalue')
    const firstTry = l.steps.findIndex((s) => s.interaction === 'try')
    expect(l.steps.slice(0, firstTry).some((s) => s.visual === 'carry' && /243 más 125/.test(s.text))).toBe(true)
  })

  it('«Grupos de diez» draws the blocks before the exercise of the blocks and explains breaking a number apart', () => {
    const l = lessonOf('c2-w1-tens')
    const tryAt = l.steps.findIndex((s) => s.interaction === 'try' && s.trySelector?.skills?.includes('num:place:blocks:999'))
    expect(l.steps.slice(0, tryAt).some((s) => s.visual === 'place-value' && s.params?.blocks === 1)).toBe(true)
    const second = l.steps.findIndex((s) => s.interaction === 'try' && s.trySelector?.skills?.includes('num:place:expanded:999'))
    expect(l.steps.slice(tryAt, second).some((s) => s.text.includes('Descomponer es decir cuánto vale cada cifra'))).toBe(true)
  })

  it('«Las tablas fáciles» tells the trick of each easy table before the first exercise', () => {
    const l = lessonOf('w1-easy')
    expect(l.steps.slice(0, 5).map((s) => s.text.slice(0, 6))).toEqual(['Hay cu', 'Por 1,', 'Por 2 ', 'Por 5,', 'Por 10'])
  })

  it('the lesson of the multiplying by pieces writes the 41 × 3 case with the 12 in front', () => {
    expect(lessonOf('w7-split').steps.some((s) => s.text.includes('escribo el 12 entero delante: 123'))).toBe(true)
  })

  it('the subtraction lessons do not show the compensation panel and finish with the check', () => {
    for (const id of ['w4-borrow', 'c2-w4-borrow']) {
      const l = lessonOf(id)
      expect(l.steps.some((s) => /Llevando: sumamos 10/.test(s.text) || /restáis «llevando»/.test(s.text)), id).toBe(false)
      expect(l.steps[l.steps.length - 1].text, id).toContain('Para saber si está bien, sumamos el resultado y el número de abajo')
    }
  })
})

describe('the stops of the lessons exist in both adventures', () => {
  it('every lesson node of every world points to a lesson that exists', () => {
    const known = new Set(ALL.map((l) => l.id))
    for (const season of [season1, seasonC2]) {
      for (const w of season.worlds) for (const n of w.nodes) if (n.kind === 'lesson') expect(known.has(n.ref!), `${season.id}/${w.id}/${n.id}`).toBe(true)
    }
  })
})
