import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import { syllabusForGrade } from '@/content/syllabus'
import { classForTopic } from './index'
import { DATOS_CLASSES } from './grade3-datos'

const DATA_TOPICS = ['graficos', 'graficos-tablas', 'probabilidad']

/** The rows of a pictogram or bar-chart step: «Gatos:3,Perros:5» → [label, value] pairs. */
function rowsOf(params: Record<string, string | number> | undefined): [string, number][] {
  return String(params!.rows).split(',').map((part) => {
    const [label, value] = part.split(':')
    return [label, Number(value)]
  })
}

describe('clases de gráficos y probabilidad (3.º)', () => {
  it('every data topic has its class', () => {
    for (const id of DATA_TOPICS) {
      const cls = classForTopic(id, 3)
      expect(cls, id).toBeDefined()
      expect(cls!.topicId).toBe(id)
    }
    expect(DATOS_CLASSES).toHaveLength(DATA_TOPICS.length)
  })

  it('each class has the five phases with 2 guided tries and 3–4 solo tries', () => {
    for (const cls of DATOS_CLASSES) {
      expect(cls.phases.guiada, cls.lesson.id).toBe(2)
      expect(cls.phases.sola, cls.lesson.id).toBeGreaterThanOrEqual(3)
      expect(cls.phases.sola, cls.lesson.id).toBeLessThanOrEqual(4)
      expect(cls.phases.cierre, cls.lesson.id).toBe(1)
      expect(cls.phases.para, cls.lesson.id).toBeGreaterThanOrEqual(1)
      expect(cls.phases.ejemplo, cls.lesson.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('every try generates an exercise of its own topic, for every seed tried', () => {
    const topics = syllabusForGrade(3).blocks.flatMap((b) => b.topics)
    for (const cls of DATOS_CLASSES) {
      const topic = topics.find((t) => t.id === cls.topicId)!
      const tries = cls.lesson.steps.filter((s) => s.interaction === 'try')
      expect(tries.length, cls.lesson.id).toBe(cls.phases.guiada + cls.phases.sola)
      for (const step of tries) {
        for (let seed = 1; seed <= 20; seed++) {
          const [exercise] = generate(step.trySelector!, 1, { rng: createRng(seed) })
          expect(exercise, cls.lesson.id).toBeDefined()
          expect(topic.skills, `${cls.lesson.id}: ${exercise.skill} (seed ${seed})`).toContain(exercise.skill)
        }
      }
    }
  })

  it('no try names a number in its text: the generator picks the numbers, and the variants differ', () => {
    for (const cls of DATOS_CLASSES) {
      for (const step of cls.lesson.steps.filter((s) => s.interaction === 'try')) {
        expect(step.text, cls.lesson.id).not.toMatch(/\d/)
      }
    }
  })

  it('probabilidad uses seguro, posible and imposible', () => {
    const cls = DATOS_CLASSES.find((c) => c.topicId === 'probabilidad')!
    const said = JSON.stringify(cls.lesson.steps)
    expect(said).toContain('seguro')
    expect(said).toContain('posible')
    expect(said).toContain('imposible')
  })

  it('pictograms: every row is a whole number of icons, between 1 and 8 (the exercise draws 1 to 8 values of each)', () => {
    for (const cls of DATOS_CLASSES) {
      for (const step of cls.lesson.steps.filter((s) => s.visual === 'pictogram')) {
        const unit = Number(step.params?.unit ?? 1)
        for (const [label, value] of rowsOf(step.params)) {
          expect(value % unit, `${cls.lesson.id}: ${label} ${value} in units of ${unit}`).toBe(0)
          expect(value / unit, `${cls.lesson.id}: ${label}`).toBeGreaterThanOrEqual(1)
          expect(value / unit, `${cls.lesson.id}: ${label}`).toBeLessThanOrEqual(8)
        }
      }
    }
  })

  it('bar charts read against a scale of 0 to 10, as the exercise does', () => {
    for (const cls of DATOS_CLASSES) {
      for (const step of cls.lesson.steps.filter((s) => s.visual === 'bar-chart')) {
        for (const [label, value] of rowsOf(step.params)) {
          expect(value, `${cls.lesson.id}: ${label}`).toBeGreaterThanOrEqual(1)
          expect(value, `${cls.lesson.id}: ${label}`).toBeLessThanOrEqual(10)
        }
      }
    }
  })

  it('the explanation names the units right: the pictogram says what one icon is worth', () => {
    const cls = DATOS_CLASSES.find((c) => c.topicId === 'graficos')!
    const pictos = cls.lesson.steps.filter((s) => s.visual === 'pictogram' && s.params?.unit !== undefined)
    expect(pictos.length).toBeGreaterThanOrEqual(1)
    for (const step of pictos) expect(step.text, cls.lesson.id).toMatch(/cada dibujo vale|cuenta de/i)
  })

  it('no class says «Sin pistas»', () => {
    expect(JSON.stringify(DATOS_CLASSES)).not.toMatch(/Sin pistas/)
  })
})
