import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import { syllabusForGrade } from '@/content/syllabus'
import { classForTopic } from './index'
import { MENTAL_CLASSES } from './grade3-mental'

const MENTAL_TOPICS = ['dobles-mitades', 'doble-triple', 'completar', 'decenas-centenas', 'compensar']

/* What a step shows: the Lumi line plus the visual's own text (the big sum or rule on screen). */
const shown = (step: { text: string; params?: Record<string, number | string> }) => [step.text, step.params?.text, step.params?.sub].filter(Boolean).join(' ')

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

  it('completar tries name only the target their generator asks', () => {
    const cls = classForTopic('completar', 3)!
    const tries = cls.lesson.steps.filter((s) => s.interaction === 'try')
    for (const step of tries) {
      const skill = step.trySelector!.skills![0]
      if (skill === 'mental:completar10') expect(step.text).not.toMatch(/\b(10|100|700|1 000)\b/)
      if (skill === 'mental:completar100') {
        expect(step.text).toContain('100')
        expect(step.text).not.toContain('700')
      }
    }
  })

  it('doble-triple: the doubling try does not ask for a triple', () => {
    const cls = classForTopic('doble-triple', 3)!
    const doubling = cls.lesson.steps.filter((s) => s.interaction === 'try' && s.trySelector!.skills?.length === 1 && s.trySelector!.skills[0] === 'mental:dobles')
    expect(doubling.length).toBeGreaterThan(0)
    for (const step of doubling) expect(step.text).not.toMatch(/otra vez|triple/i)
  })

  it('decenas: the rule covers a sum that crosses a hundred', () => {
    const cls = classForTopic('decenas-centenas', 3)!
    const ejemplo = cls.lesson.steps.slice(cls.phases.para, cls.phases.para + cls.phases.ejemplo).map(shown).join(' ')
    expect(ejemplo).toContain('430')
    expect(shown(cls.lesson.steps[cls.lesson.steps.length - 1])).toMatch(/centena sube/)
  })

  it('compensar shows +10 − 1 and also −10 + 1 for subtracting 9', () => {
    const cls = classForTopic('compensar', 3)!
    const all = cls.lesson.steps.map(shown).join(' ')
    expect(all).toContain('− 10 + 1')
    expect(all).toContain('+ 10 − 1')
    const restar = cls.lesson.steps.slice(cls.phases.para, cls.phases.para + cls.phases.ejemplo).map(shown).join(' ')
    expect(restar).toContain('− 9')
  })

  it('compensar number lines land where their text says', () => {
    const cls = classForTopic('compensar', 3)!
    const lines = cls.lesson.steps.filter((s) => s.visual === 'number-line' && s.interaction !== 'try' && s.params?.jump !== undefined)
    expect(lines.length).toBeGreaterThan(0)
    for (const step of lines) expect(shown(step)).toContain(String(Number(step.params!.mark) + Number(step.params!.jump)))
  })

  it('compensar shows +10 − 1', () => {
    const cls = classForTopic('compensar', 3)!
    const text = cls.lesson.steps.slice(cls.phases.para, cls.phases.para + cls.phases.ejemplo).map(shown).join(' ')
    expect(text).toContain('+ 10')
    expect(text).toContain('− 1')
  })
})
