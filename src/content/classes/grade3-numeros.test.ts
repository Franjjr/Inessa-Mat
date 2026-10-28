import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import { syllabusForGrade } from '@/content/syllabus'
import { classForTopic } from './index'
import { NUMEROS_CLASSES } from './grade3-numeros'

const NUMBER_TOPICS = ['descomponer-9999', 'leer-escribir-9999', 'comparar-ordenar-9999', 'redondear', 'ordinales', 'numeros-5-cifras', 'igualdad']

describe('clases de números (3.º)', () => {
  it('every number topic has its class', () => {
    for (const id of NUMBER_TOPICS) {
      const cls = classForTopic(id, 3)
      expect(cls, id).toBeDefined()
      expect(cls!.topicId).toBe(id)
    }
  })

  it('each class has the five phases with 2 guided tries and 3–4 solo tries', () => {
    for (const cls of NUMEROS_CLASSES) {
      expect(cls.phases.guiada, cls.lesson.id).toBe(2)
      expect(cls.phases.sola, cls.lesson.id).toBeGreaterThanOrEqual(3)
      expect(cls.phases.sola, cls.lesson.id).toBeLessThanOrEqual(4)
      expect(cls.phases.cierre, cls.lesson.id).toBe(1)
      expect(cls.phases.para, cls.lesson.id).toBeGreaterThanOrEqual(1)
      expect(cls.phases.ejemplo, cls.lesson.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('every try generates an exercise of its topic', () => {
    const topics = syllabusForGrade(3).blocks.flatMap((b) => b.topics)
    for (const cls of NUMEROS_CLASSES) {
      const topic = topics.find((t) => t.id === cls.topicId)!
      const tries = cls.lesson.steps.filter((s) => s.interaction === 'try')
      for (const step of tries) {
        for (const seed of [1, 2, 3]) {
          const [exercise] = generate(step.trySelector!, 1, { rng: createRng(seed) })
          expect(exercise, cls.lesson.id).toBeDefined()
          expect(topic.skills, `${cls.lesson.id}: ${exercise.skill} (seed ${seed})`).toContain(exercise.skill)
        }
      }
    }
  })

  it('redondear: 3 456 rounds to 3 460 and 3 500', () => {
    const cls = classForTopic('redondear', 3)!
    const text = cls.lesson.steps.slice(cls.phases.para, cls.phases.para + cls.phases.ejemplo).map((s) => s.text).join(' ')
    expect(text).toContain('3 460')
    expect(text).toContain('3 500')
  })
})
