import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import { syllabusForGrade } from '@/content/syllabus'
import { classForTopic } from './index'
import { TABLAS_CLASSES } from './grade3-tablas'

const TABLE_TOPICS = ['tabla-2', 'tabla-5', 'tabla-10', 'tabla-3', 'tabla-4', 'tabla-6', 'tabla-8', 'tabla-7', 'tabla-9']

describe('clases de las tablas (3.º)', () => {
  it('every times-table topic has its class', () => {
    for (const id of TABLE_TOPICS) {
      const cls = classForTopic(id, 3)
      expect(cls, id).toBeDefined()
      expect(cls!.topicId).toBe(id)
    }
    expect(TABLAS_CLASSES.length).toBe(TABLE_TOPICS.length)
  })

  it('each class has the five phases with 2 guided tries and 3–4 solo tries', () => {
    for (const cls of TABLAS_CLASSES) {
      expect(cls.phases.guiada, cls.lesson.id).toBe(2)
      expect(cls.phases.sola, cls.lesson.id).toBeGreaterThanOrEqual(3)
      expect(cls.phases.sola, cls.lesson.id).toBeLessThanOrEqual(4)
      expect(cls.phases.cierre, cls.lesson.id).toBe(1)
      expect(cls.phases.para, cls.lesson.id).toBeGreaterThanOrEqual(1)
      expect(cls.phases.ejemplo, cls.lesson.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('every try generates an exercise of its topic', () => {
    const topics = syllabusForGrade(3).blocks.flatMap((b) => b.topics)
    for (const cls of TABLAS_CLASSES) {
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

  it('only tabla-6/7/8/9 link a map lesson', () => {
    const linked = Object.fromEntries(TABLAS_CLASSES.map((c) => [c.topicId, c.mapLessonId]))
    expect(linked).toEqual({
      'tabla-2': undefined,
      'tabla-5': undefined,
      'tabla-10': undefined,
      'tabla-3': undefined,
      'tabla-4': undefined,
      'tabla-6': 'w3-five',
      'tabla-8': 'w5-pattern',
      'tabla-7': 'w6-seven',
      'tabla-9': 'w6-nine',
    })
  })
})
