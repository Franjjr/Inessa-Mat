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

  it('reloj-digital: one example of each period, and the night hours 0–5 keep their number (03:00 is not 15:00)', () => {
    const digitalSteps = TIEMPO_CLASSES.find((c) => c.topicId === 'reloj-digital')!.lesson.steps
    const hours = digitalSteps.filter((st) => st.visual === 'clock').map((st) => st.params!.h)
    for (const h of [9, 12, 14, 18, 21, 3]) expect(hours, `example at ${h} h`).toContain(h)
    const all = digitalSteps.map((st) => st.text).join(' ')
    expect(all).toContain('03:00 son las tres de la noche')
    expect(all).not.toMatch(/03:00[^.]*(15:00|15 h)/)
    expect(all).not.toMatch(/de la noche se cuentan con 12 más/)
    expect(all).not.toMatch(/de 21 a 5\b/)
  })

  it('reloj-digital: no try names one direction of the conversion (write or pick a phrase)', () => {
    const tries = TIEMPO_CLASSES.find((c) => c.topicId === 'reloj-digital')!.lesson.steps.filter((st) => st.interaction === 'try')
    for (const t of tries) expect(t.text, t.text).not.toMatch(/Escribe|Pasa la hora de la frase/)
  })

  it('reading tries never say «di» (a write-mode try asks for numbers) and set tries never say «Lee la hora»', () => {
    for (const cls of TIEMPO_CLASSES) {
      for (const st of cls.lesson.steps.filter((x) => x.interaction === 'try')) {
        const skills = st.trySelector!.skills ?? []
        if (skills.some((k) => k.startsWith('clock:read'))) expect(st.text, `${cls.lesson.id}: ${st.text}`).not.toMatch(/\bdi\b/)
        if (skills.some((k) => k.startsWith('clock:set'))) expect(st.text, `${cls.lesson.id}: ${st.text}`).not.toMatch(/\bLee la hora\b/)
      }
    }
  })

  it('duraciones: «horas enteras» only as a condition («si hay»), since some durations are under an hour', () => {
    const tries = TIEMPO_CLASSES.find((c) => c.topicId === 'duraciones')!.lesson.steps.filter((st) => st.interaction === 'try')
    for (const t of tries) if (t.text.includes('horas enteras')) expect(t.text, t.text).toMatch(/si hay/)
  })
})
