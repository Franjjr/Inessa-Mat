import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import { syllabusForGrade } from '@/content/syllabus'
import { classForTopic } from './index'
import { PROBLEMAS_CLASSES } from './grade3-problemas'

const PROBLEM_TOPICS = ['prob-sumar', 'prob-restar', 'prob-multiplicar', 'prob-dividir', 'prob-dos-pasos', 'encuentra-error', 'comprobar-resultado']

describe('clases de problemas y comprobar (3.º)', () => {
  it('the 7 topics have their class', () => {
    for (const id of PROBLEM_TOPICS) {
      const cls = classForTopic(id, 3)
      expect(cls, id).toBeDefined()
      expect(cls!.topicId).toBe(id)
    }
    expect(PROBLEMAS_CLASSES.length).toBe(PROBLEM_TOPICS.length)
  })

  it('each class has the five phases with 2 guided tries and 3–4 solo tries', () => {
    for (const cls of PROBLEMAS_CLASSES) {
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
    for (const cls of PROBLEMAS_CLASSES) {
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

  it('two-step class solves its example in two lines', () => {
    const cls = classForTopic('prob-dos-pasos', 3)!
    const ejemplo = cls.lesson.steps.slice(cls.phases.para, cls.phases.para + cls.phases.ejemplo)
    const withOperation = ejemplo.filter((s) => /[+−×÷]/.test(s.text))
    expect(withOperation.length).toBeGreaterThanOrEqual(2)
  })
})
