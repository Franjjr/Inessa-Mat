import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import { syllabusForGrade } from '@/content/syllabus'
import { classForTopic } from './index'
import { TIEMPO_CLASSES } from './grade3-tiempo'

const TIME_TOPICS = ['reloj-en-punto-media-cuarto', 'reloj-5-minutos', 'reloj-digital', 'duraciones', 'calendario']

describe('clases de tiempo (3.º)', () => {
  it('every time topic has its class', () => {
    for (const id of TIME_TOPICS) {
      const cls = classForTopic(id, 3)
      expect(cls, id).toBeDefined()
      expect(cls!.topicId).toBe(id)
    }
  })

  it('each class has the five phases with 2 guided tries and 3–4 solo tries', () => {
    expect(TIEMPO_CLASSES).toHaveLength(TIME_TOPICS.length)
    for (const cls of TIEMPO_CLASSES) {
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
    for (const cls of TIEMPO_CLASSES) {
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

  it('the calendar class names the weekdays and the months with big text', () => {
    const cls = TIEMPO_CLASSES.find((c) => c.topicId === 'calendario')!
    const texts = cls.lesson.steps.filter((st) => st.visual === 'big-text').map((st) => st.text)
    expect(texts.some((t) => t.includes('lunes'))).toBe(true)
    expect(texts.some((t) => t.includes('nudillos'))).toBe(true)
  })

  it('the duration class draws its examples as time lines with the duration in them', () => {
    const cls = TIEMPO_CLASSES.find((c) => c.topicId === 'duraciones')!
    const lines = cls.lesson.steps.filter((st) => st.visual === 'timeline')
    expect(lines.length).toBeGreaterThanOrEqual(3)
    for (const line of lines) {
      expect(Number(line.params!.end)).toBeGreaterThan(Number(line.params!.start))
    }
  })
})
