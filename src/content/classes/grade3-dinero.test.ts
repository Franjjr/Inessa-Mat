import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import { syllabusForGrade } from '@/content/syllabus'
import { classForTopic } from './index'
import { DINERO_CLASSES } from './grade3-dinero'

const MONEY_TOPICS = ['monedas-billetes', 'pagar-cambio', 'sumar-precios', 'euros-centimos']

describe('clases de dinero (3.º)', () => {
  it('every money topic has its class', () => {
    for (const id of MONEY_TOPICS) {
      const cls = classForTopic(id, 3)
      expect(cls, id).toBeDefined()
      expect(cls!.topicId).toBe(id)
    }
  })

  it('each class has the five phases with 2 guided tries and 3–4 solo tries', () => {
    expect(DINERO_CLASSES).toHaveLength(MONEY_TOPICS.length)
    for (const cls of DINERO_CLASSES) {
      expect(cls.phases.guiada, cls.lesson.id).toBe(2)
      expect(cls.phases.sola, cls.lesson.id).toBeGreaterThanOrEqual(3)
      expect(cls.phases.sola, cls.lesson.id).toBeLessThanOrEqual(4)
      expect(cls.phases.cierre, cls.lesson.id).toBe(1)
      expect(cls.phases.para, cls.lesson.id).toBeGreaterThanOrEqual(1)
      expect(cls.phases.ejemplo, cls.lesson.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('every try generates an exercise of its topic, for every seed tried', () => {
    const topics = syllabusForGrade(3).blocks.flatMap((b) => b.topics)
    for (const cls of DINERO_CLASSES) {
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

  it('pagar-cambio: the ejemplo gives change with a note, and the money drawing shows the same change (3,80 €)', () => {
    const cls = DINERO_CLASSES.find((c) => c.topicId === 'pagar-cambio')!
    const ejemplo = cls.lesson.steps.slice(cls.phases.para, cls.phases.para + cls.phases.ejemplo)
    expect(ejemplo.map((st) => st.text).join(' ')).toContain('3,80 €')
    expect(ejemplo.some((st) => st.visual === 'money' && st.params?.price === 120 && st.params?.items === '500')).toBe(true)
  })
})
