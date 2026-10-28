import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import { syllabusForGrade } from '@/content/syllabus'
import { classForTopic } from './index'
import { MENTAL_CLASSES } from './grade3-mental'

const MENTAL_TOPICS = ['dobles-mitades', 'doble-triple', 'completar', 'decenas-centenas', 'compensar']

describe('clases de cálculo mental (3.º)', () => {
  it('the 5 topics have their class', () => {
    for (const id of MENTAL_TOPICS) {
      const cls = classForTopic(id, 3)
      expect(cls, id).toBeDefined()
      expect(cls!.topicId).toBe(id)
    }
    expect(MENTAL_CLASSES.length).toBe(MENTAL_TOPICS.length)
  })

  it('each class has the five phases with 2 guided tries and 3–4 solo tries', () => {
    for (const cls of MENTAL_CLASSES) {
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
    for (const cls of MENTAL_CLASSES) {
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

  it('compensar shows +10 − 1', () => {
    const cls = classForTopic('compensar', 3)!
    const text = cls.lesson.steps.slice(cls.phases.para, cls.phases.para + cls.phases.ejemplo).map((s) => s.text).join(' ')
    expect(text).toContain('+ 10')
    expect(text).toContain('− 1')
  })
})
