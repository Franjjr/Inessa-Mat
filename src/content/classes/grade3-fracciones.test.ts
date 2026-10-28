import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import { syllabusForGrade } from '@/content/syllabus'
import { classForTopic } from './index'
import { FRACCIONES_CLASSES } from './grade3-fracciones'

const FRACTION_TOPICS = ['fracciones-mitad-cuarto', 'fraccion-cantidad', 'fracciones-comparar', 'fracciones-mas-partes']

describe('clases de fracciones (3.º)', () => {
  it('every fraction topic has its class', () => {
    for (const id of FRACTION_TOPICS) {
      const cls = classForTopic(id, 3)
      expect(cls, id).toBeDefined()
      expect(cls!.topicId).toBe(id)
    }
  })

  it('each class has the five phases with 2 guided tries and 3–4 solo tries', () => {
    expect(FRACCIONES_CLASSES).toHaveLength(FRACTION_TOPICS.length)
    for (const cls of FRACCIONES_CLASSES) {
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
    for (const cls of FRACCIONES_CLASSES) {
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

  it('fraccion-cantidad: the ejemplo teaches a numerator of 2 or more (3/4 of 12 is 9), and no try asks for one group', () => {
    const cls = FRACCIONES_CLASSES.find((c) => c.topicId === 'fraccion-cantidad')!
    const ejemplo = cls.lesson.steps.slice(cls.phases.para, cls.phases.para + cls.phases.ejemplo)
    expect(ejemplo.some((st) => st.visual === 'fraction-groups' && Number(st.params?.take) >= 2)).toBe(true)
    expect(ejemplo.map((st) => st.text).join(' ')).toContain('Tres cuartos de 12 son 9')
    const tries = cls.lesson.steps.filter((st) => st.interaction === 'try')
    for (const st of tries) expect(st.text, st.text).not.toMatch(/un grupo|en uno|reparte/i)
  })

  it('fracciones-comparar: the ejemplo teaches equal fractions and the solo try allows «igual»', () => {
    const cls = FRACCIONES_CLASSES.find((c) => c.topicId === 'fracciones-comparar')!
    const ejemplo = cls.lesson.steps.slice(cls.phases.para, cls.phases.para + cls.phases.ejemplo)
    expect(ejemplo.map((st) => st.text).join(' ')).toMatch(/2\/4 es igual a 1\/2/)
    const firstSola = cls.lesson.steps.filter((st) => st.interaction === 'try')[cls.phases.guiada]
    expect(firstSola.text).toContain('o si ocupan lo mismo')
  })
})
