import { describe, expect, it } from 'vitest'
import { allTopics, INGLES3_SYLLABUS } from '@/content/syllabus'
import { createRng, generate } from '@/engine'
import { ENGLISH_WORDS, ENGLISH_LISTENING_KINDS, numberToEnglish } from '@/engine/ingles'
import { parseMixed, plainMixed } from '@/audio/sayMixed'
import { classForTopic } from './index'
import { INGLES_CLASSES } from './ingles3'
import type { LessonStep } from '@/types'

/** The text a step puts before the child’s ears: its Spanish parts (the English ones go through sayMixed). */
const spanishParts = (text: string) => (parseMixed(text) ?? [{ text, lang: 'es' as const }]).filter((p) => p.lang === 'es')
const stepsOf = (cls: (typeof INGLES_CLASSES)[number]) => cls.lesson.steps
const allSteps = () => INGLES_CLASSES.flatMap((cls) => stepsOf(cls).map((step) => ({ cls, step })))

/** An English word of the vocabulary, as it may be written in Spanish text. A word that is also Spanish (no, pizza) is not one. */
const englishWordsToCheck = ENGLISH_WORDS
  .map((w) => w.en.toLowerCase())
  .filter((en, i, all) => all.indexOf(en) === i)
  .filter((en) => en !== ENGLISH_WORDS.find((w) => w.en.toLowerCase() === en)!.es.toLowerCase())
const wordRe = (en: string) => new RegExp(`(^|[^\\p{L}])${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'iu')

describe('clases de Inglés de 3.º', () => {
  it('every English topic of the syllabus has its class, in syllabus order', () => {
    const topics = allTopics(INGLES3_SYLLABUS)
    expect(topics.length).toBe(INGLES_CLASSES.length)
    for (const t of topics) expect(classForTopic(t.id, 3, 'english'), t.id).toBeDefined()
    expect(INGLES_CLASSES.map((c) => c.topicId)).toEqual(topics.map((t) => t.id))
  })

  it('an English topic id gives no maths or Lengua class, and a maths topic gives no English class', () => {
    expect(classForTopic('eng-saludos', 3, 'math')).toBeUndefined()
    expect(classForTopic('eng-saludos', 3, 'language')).toBeUndefined()
    expect(classForTopic('suma-2d', 3, 'english')).toBeUndefined()
  })

  it('a child of another grade gets no English class', () => {
    expect(classForTopic('eng-saludos', 4, 'english')).toBeUndefined()
    expect(classForTopic('eng-saludos', undefined, 'english')?.topicId).toBe('eng-saludos')
  })

  it('no Spanish line says an English vocabulary word: English goes between asterisks, through sayMixed', () => {
    for (const { cls, step } of allSteps()) {
      for (const part of spanishParts(step.text)) {
        for (const en of englishWordsToCheck) {
          expect(wordRe(en).test(part.text), `${cls.lesson.id}: «${en}» in «${part.text}»`).toBe(false)
        }
      }
    }
  })

  it('every mark closes, and holds some English', () => {
    for (const { cls, step } of allSteps()) {
      expect(step.text.split('*').length % 2, `${cls.lesson.id}: ${step.text}`).toBe(1)
      for (const part of parseMixed(step.text) ?? []) {
        if (part.lang === 'en') expect(part.text.trim(), cls.lesson.id).not.toBe('')
      }
    }
  })

  it('the text on the screen has no marks, and every line fits the speech limit (400 characters)', () => {
    for (const { cls, step } of allSteps()) {
      const shown = plainMixed(step.text)
      expect(shown).not.toContain('*')
      expect(shown.length, cls.lesson.id).toBeLessThanOrEqual(400)
    }
  })

  it('the picture words and numbers are right: each eng-number says its number in English', () => {
    for (const { cls, step } of allSteps()) {
      if (step.visual === 'eng-number') {
        expect(step.params!.en, cls.lesson.id).toBe(numberToEnglish(Number(step.params!.n)))
      }
      if (step.visual === 'eng-word') {
        expect(String(step.params!.en), cls.lesson.id).not.toBe('')
        expect(String(step.params!.es), cls.lesson.id).not.toBe('')
      }
    }
  })

  it('teaches -teen (13 to 19) and -ty (the decades) explicitly, and equals in the operations', () => {
    const text = (id: string) => INGLES_CLASSES.find((c) => c.lesson.id === id)!.lesson.steps.map((s) => s.text).join(' ')
    expect(text('eng3-num-0-20')).toContain('*-teen*')
    expect(text('eng3-num-decenas')).toContain('*-ty*')
    expect(text('eng3-ops')).toContain('*equals*')
  })

  it('the two guiada tries use the topic’s first skill and keep their hints; the three sola tries have none', () => {
    const topics = allTopics(INGLES3_SYLLABUS)
    for (const cls of INGLES_CLASSES) {
      const topic = topics.find((t) => t.id === cls.topicId)!
      const tries = cls.lesson.steps.filter((st: LessonStep) => st.interaction === 'try')
      const guiada = tries.slice(0, 2)
      const sola = tries.slice(2)
      expect(tries.length, cls.lesson.id).toBe(5)
      expect(guiada.every((st) => st.trySelector!.skills![0] === topic.skills[0]), cls.lesson.id).toBe(true)
      expect(guiada.every((st) => st.hints !== false), cls.lesson.id).toBe(true)
      expect(sola.every((st) => st.hints === false), cls.lesson.id).toBe(true)
    }
  })

  it('the tries make English exercises of their own topic, and only the operations need the sound', () => {
    const topics = allTopics(INGLES3_SYLLABUS)
    for (const cls of INGLES_CLASSES) {
      const topic = topics.find((t) => t.id === cls.topicId)!
      for (const step of cls.lesson.steps.filter((st) => st.interaction === 'try')) {
        for (let seed = 1; seed <= 20; seed++) {
          const [exercise] = generate(step.trySelector!, 1, { rng: createRng(seed) })
          expect(topic.skills, `${cls.lesson.id}: ${exercise.skill}`).toContain(exercise.skill)
          if (cls.topicId === 'eng-ops') expect(exercise.kind, cls.lesson.id).toBe('eng-op-listen')
          else expect(ENGLISH_LISTENING_KINDS, `${cls.lesson.id}: ${exercise.kind}`).not.toContain(exercise.kind)
        }
      }
    }
  })
})
