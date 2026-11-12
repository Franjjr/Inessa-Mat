/* The classes draw what they talk about (P3): the rhombus, the circumference and the circle, the pizza in unequal pieces
   and the bars of «cuántos más» are drawings (the params of src/activities/lesson/visuals), not a big text in their place. */
import { describe, expect, it } from 'vitest'
import { CLASSES } from '@/content/classes'
import { lessons } from '../lessons'

const stepsOf = (id: string) => CLASSES.find((c) => c.lesson.id === id)!.lesson.steps
const shown = (id: string) => stepsOf(id).filter((s) => s.interaction !== 'try')

describe('the classes draw what they explain', () => {
  it('the rhombus of the polygons is drawn', () => {
    const step = shown('c3-geo-poligonos').find((s) => /rombo/.test(s.text))!
    expect(step.visual).toBe('polygon')
    expect(step.params).toEqual({ shape: 'rombo' })
  })

  it('the circumference is only the line and the circle is painted: two drawings', () => {
    const steps = shown('c3-geo-circulo-cuerpos')
    expect(steps.find((s) => /circunferencia es solo el aro/.test(s.text))?.params).toEqual({ shape: 'circunferencia' })
    expect(steps.find((s) => /círculo es el aro y todo lo de dentro/.test(s.text))?.params).toEqual({ shape: 'circulo' })
  })

  it('the pizza in four unequal pieces is drawn', () => {
    const step = shown('c3-fracciones-mitad-cuarto').find((s) => /no son cuartos/.test(s.text))!
    expect(step.visual).toBe('fraction-shape')
    expect(step.params).toEqual({ parts: 4, unequal: 1 })
  })

  it('«cuántos más» of the table is two bars to compare', () => {
    const step = shown('c3-datos-tablas').find((s) => /cuántos más/.test(s.text))!
    expect(step.visual).toBe('bar-model')
    expect(step.params).toEqual({ a: 5, b: 2, compare: 1 })
  })

  it('the bars of «Dibujar la historia»: the whole is «?» in the sum, and the part that goes away is struck', () => {
    const bars = lessons.find((l) => l.id === 'w4-bars')!.steps
    expect(bars.find((s) => /entre los dos/.test(s.text))?.params).toMatchObject({ ask: 'total' })
    expect(bars.find((s) => /regala 4/.test(s.text))?.params).toMatchObject({ b: 0, total: 13, cross: 1 })
  })

  it('no big text stands for a drawing that exists', () => {
    for (const c of CLASSES) {
      for (const s of c.lesson.steps.filter((x) => x.visual === 'big-text' && x.interaction !== 'try')) {
        const said = `${s.params?.text ?? ''} ${s.params?.sub ?? ''}`
        expect(said, `${c.lesson.id}: ${said}`).not.toMatch(/^Rombo|Circunferencia: solo la línea|uno enorme y otro muy pequeño|niños más prefieren/)
      }
    }
  })
})
