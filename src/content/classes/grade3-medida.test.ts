import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import { syllabusForGrade } from '@/content/syllabus'
import { classForTopic } from './index'
import { MEDIDA_CLASSES } from './grade3-medida'

const MEASURE_TOPICS = ['unidades-longitud', 'regla', 'unidades-masa-capacidad', 'medir-problemas']

describe('clases de medida (3.º)', () => {
  it('every measure topic has its class', () => {
    for (const id of MEASURE_TOPICS) {
      const cls = classForTopic(id, 3)
      expect(cls, id).toBeDefined()
      expect(cls!.topicId).toBe(id)
    }
  })

  it('each class has the five phases with 2 guided tries and 3–4 solo tries', () => {
    expect(MEDIDA_CLASSES).toHaveLength(MEASURE_TOPICS.length)
    for (const cls of MEDIDA_CLASSES) {
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
    for (const cls of MEDIDA_CLASSES) {
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

  it('the conversions said are right: 1 m = 100 cm, 1 km = 1 000 m, 1 kg = 1 000 g, 1 l = 1 000 ml', () => {
    const said = JSON.stringify(MEDIDA_CLASSES.map((c) => c.lesson.steps))
    expect(said).toContain('1 m = 100 cm')
    expect(said).toContain('1 km = 1 000 m')
    expect(said).toContain('1 kg = 1 000 g')
    expect(said).toContain('1 l = 1 000 ml')
    const right: Record<string, string> = { 'm cm': '100', 'km m': '1 000', 'kg g': '1 000', 'l ml': '1 000' }
    for (const [, big, value, small] of said.matchAll(/1 (km|m|kg|l) = (\d[\d ]*\d|\d) (cm|m|g|ml)\b/g)) {
      expect(right[`${big} ${small}`], `1 ${big} = ${value} ${small}`).toBe(value)
    }
  })

  it('regla: teaches the object that does not start at 0 (from 2 to 7 → 5 cm) and every try says where it starts and ends', () => {
    const cls = MEDIDA_CLASSES.find((c) => c.topicId === 'regla')!
    const ejemplo = cls.lesson.steps.slice(cls.phases.para, cls.phases.para + cls.phases.ejemplo)
    const offZero = ejemplo.find((st) => st.visual === 'ruler' && Number(st.params!.from) === 2)
    expect(offZero, 'an example that starts at 2').toBeDefined()
    expect(Number(offZero!.params!.cm)).toBe(7)
    expect(offZero!.text).toContain('5 centímetros')
    const tries = cls.lesson.steps.filter((st) => st.interaction === 'try')
    expect(tries.length).toBe(cls.phases.guiada + cls.phases.sola)
    for (const t of tries) expect(t.text, t.text).toMatch(/mira dónde empieza y dónde acaba/i)
  })

  it('no conversion try says «cuántas partes tiene la unidad grande» (unclear for medio and un cuarto)', () => {
    for (const cls of MEDIDA_CLASSES) {
      for (const st of cls.lesson.steps) expect(st.text, `${cls.lesson.id}: ${st.text}`).not.toMatch(/cuántas partes tiene la unidad grande/)
    }
  })

  it('no lesson line says «cuatro pisos» for 15 m', () => {
    expect(JSON.stringify(MEDIDA_CLASSES)).not.toMatch(/cuatro pisos/)
  })
})
