import { describe, expect, it } from 'vitest'
import { allTopics, INGLES3_SYLLABUS } from '@/content/syllabus'
import { createRng, generate } from '@/engine'
import { ENGLISH_WORDS, ENGLISH_LISTENING_KINDS, numberPool, numberToEnglish } from '@/engine/ingles'
import { parseMixed, plainMixed } from '@/audio/sayMixed'
import { classForTopic } from './index'
import { INGLES_CLASSES } from './ingles3'
import type { LessonStep } from '@/types'

type EnglishClass = (typeof INGLES_CLASSES)[number]

/** The Spanish parts of a step: what Lumi reads. The English parts go through sayMixed. */
const spanishParts = (text: string) => (parseMixed(text) ?? [{ text, lang: 'es' as const }]).filter((p) => p.lang === 'es')
const allSteps = () => INGLES_CLASSES.flatMap((cls) => cls.lesson.steps.map((step) => ({ cls, step })))
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** The word or phrase as a whole, case-insensitive: not inside another word. */
const wholeRe = (en: string) => new RegExp(`(^|[^\\p{L}])${escapeRe(en)}($|[^\\p{L}])`, 'iu')
/** The ejemplo phase of a class: its steps after the para phase, before the guiada tries. */
const ejemploOf = (cls: EnglishClass) => cls.lesson.steps.slice(cls.phases.para, cls.phases.para + cls.phases.ejemplo)

/** An English vocabulary word, as it may be written in Spanish text. A word that is also Spanish (no, pizza) is not one. */
const englishWordsToCheck = ENGLISH_WORDS
  .map((w) => w.en.toLowerCase())
  .filter((en, i, all) => all.indexOf(en) === i)
  .filter((en) => en !== ENGLISH_WORDS.find((w) => w.en.toLowerCase() === en)!.es.toLowerCase())

/** The English phrases the classes use: marked parts with a space or an apostrophe (good morning, It's big…). */
const englishPhrases = [...new Set(allSteps().flatMap(({ step }) =>
  (parseMixed(step.text) ?? []).filter((p) => p.lang === 'en').map((p) => p.text.replace(/[.?!,]+$/, '').trim()),
).filter((p) => /[\s']/.test(p)))]

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

  it('the saludos class has the syllabus title «Saludos y yo»', () => {
    const topic = allTopics(INGLES3_SYLLABUS).find((t) => t.id === 'eng-saludos')!
    expect(INGLES_CLASSES.find((c) => c.topicId === 'eng-saludos')!.lesson.title).toBe(topic.name)
  })

  it('every class starts with its companion, so the intro is theirs', () => {
    for (const cls of INGLES_CLASSES) expect(cls.lesson.steps[0].text, cls.lesson.id).toContain('{pet}')
  })

  it('no Spanish line says an English vocabulary word: English goes between asterisks, through sayMixed', () => {
    for (const { cls, step } of allSteps()) {
      for (const part of spanishParts(step.text)) {
        for (const en of englishWordsToCheck) {
          expect(wholeRe(en).test(part.text), `${cls.lesson.id}: «${en}» in «${part.text}»`).toBe(false)
        }
      }
    }
  })

  it('no Spanish line says an English phrase of the classes either (good morning, It’s big…)', () => {
    expect(englishPhrases).toContain('good morning')
    expect(englishPhrases).toContain('It\'s big')
    for (const { cls, step } of allSteps()) {
      for (const part of spanishParts(step.text)) {
        for (const phrase of englishPhrases) {
          expect(wholeRe(phrase).test(part.text), `${cls.lesson.id}: «${phrase}» in «${part.text}»`).toBe(false)
        }
      }
    }
  })

  it('every mark closes and holds some English; the hyphen of an ending stays outside the mark', () => {
    for (const { cls, step } of allSteps()) {
      expect(step.text.split('*').length % 2, `${cls.lesson.id}: ${step.text}`).toBe(1)
      for (const part of parseMixed(step.text) ?? []) {
        if (part.lang === 'en') {
          expect(part.text.trim(), cls.lesson.id).not.toBe('')
          expect(part.text.startsWith('-'), `${cls.lesson.id}: «${part.text}»`).toBe(false)
        }
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

  it('teaches the ending teen (13 to 19) and ty (the decades) explicitly, and equals in the operations', () => {
    const text = (id: string) => INGLES_CLASSES.find((c) => c.lesson.id === id)!.lesson.steps.map((s) => s.text).join(' ')
    expect(text('eng3-num-0-20')).toContain('*teen*')
    expect(text('eng3-num-decenas')).toContain('*ty*')
    expect(text('eng3-ops')).toContain('*equals*')
  })

  it('every vocabulary class shows every word its tries practise: an eng-words grid of that theme in the ejemplo phase', () => {
    const topics = allTopics(INGLES3_SYLLABUS)
    for (const cls of INGLES_CLASSES) {
      const topic = topics.find((t) => t.id === cls.topicId)!
      const themes = topic.skills.filter((s) => s.startsWith('eng:voc:')).map((s) => s.split(':')[2])
      for (const theme of themes) {
        const grid = ejemploOf(cls).find((st) => st.visual === 'eng-words' && st.params?.theme === theme)
        expect(grid, `${cls.lesson.id}: the grid of «${theme}»`).toBeDefined()
        expect(grid!.text).toBe('Estas son las palabras de hoy. Toca cada una para oírla.')
      }
    }
  })

  it('the number classes show the whole pool the engine draws from (0 to 20, 30 to 100), and for 21 to 100 the tens and the rule', () => {
    const shownBy = (cls: EnglishClass) => new Set(cls.lesson.steps.flatMap((st) => {
      if (st.visual === 'eng-number-list') {
        const from = Number(st.params!.from)
        const to = Number(st.params!.to)
        const step = Number(st.params!.step ?? 1)
        return Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step)
      }
      return st.visual === 'eng-number' ? [Number(st.params!.n)] : []
    }))
    // The values the tries can draw, from the engine itself (not a copy of the pools here).
    const expected: Record<string, number[]> = {
      'eng-num-0-20': numberPool('0-20'),
      'eng-num-decenas': numberPool('decenas'),
      'eng-num-21-100': numberPool('21-100').filter((n) => n % 10 === 0),
    }
    for (const [topicId, values] of Object.entries(expected)) {
      const cls = INGLES_CLASSES.find((c) => c.topicId === topicId)!
      const shown = shownBy(cls)
      for (const v of values) expect(shown.has(v), `${topicId}: ${v}`).toBe(true)
    }
    const teensAndRule = INGLES_CLASSES.find((c) => c.topicId === 'eng-num-21-100')!
    expect(teensAndRule.lesson.steps.map((s) => s.text).join(' ')).toContain('guion')
  })

  it('the tens class has the syllabus title and explains one hundred, the top of its pool', () => {
    const topic = allTopics(INGLES3_SYLLABUS).find((t) => t.id === 'eng-num-decenas')!
    const cls = INGLES_CLASSES.find((c) => c.topicId === 'eng-num-decenas')!
    expect(cls.lesson.title).toBe(topic.name)
    expect(numberPool('decenas')).toContain(100)
    expect(cls.lesson.steps.map((s) => s.text).join(' ')).toContain('one hundred')
  })

  it('every phrase topic explains the pattern its items use (the keyword of each item family appears in its class)', () => {
    // The pattern keyword of each phrase topic: the words its eng-complete items build on.
    const PATTERNS: Record<string, string[]> = {
      'saludos': ['good morning', 'how are you', 'nice to meet', 'see you'],
      'its-a': ['bigger than', 'says', 'it can'],
      'this-is-my': ['this is my'],
      'i-like': ['i like', 'do you like', 'i don\'t like', 'likes'],
      'can-i-have': ['can i have'],
      'im-wearing': ['i\'m wearing'],
      'classroom': ['sit down', 'open your'],
      'where-is': ['where is'],
      'ive-got': ['i\'ve got'],
      'weather': ['what\'s the weather like'],
      'what-day': ['what day', 'comes after'],
    }
    const topics = allTopics(INGLES3_SYLLABUS)
    const phraseIds = topics.flatMap((t) => t.skills.filter((s) => s.startsWith('eng:frase:')).map((s) => s.split(':')[2]))
    expect([...new Set(phraseIds)].sort()).toEqual(Object.keys(PATTERNS).sort())
    for (const cls of INGLES_CLASSES) {
      const topic = topics.find((t) => t.id === cls.topicId)!
      const text = cls.lesson.steps.map((st) => st.text).join(' ').replace(/’/g, '\'').toLowerCase()
      for (const skill of topic.skills.filter((s) => s.startsWith('eng:frase:'))) {
        const id = skill.split(':')[2]
        for (const keyword of PATTERNS[id]) expect(text, `${cls.lesson.id} (${id}): «${keyword}»`).toContain(keyword)
      }
    }
  })

  it('the tries of the number classes practise the numbers the lists show', () => {
    const topics = allTopics(INGLES3_SYLLABUS)
    for (const cls of INGLES_CLASSES.filter((c) => c.topicId.startsWith('eng-num-'))) {
      const topic = topics.find((t) => t.id === cls.topicId)!
      expect(topic.skills.every((s) => s.startsWith('eng:num:')), cls.lesson.id).toBe(true)
      expect(cls.lesson.steps.some((st) => st.visual === 'eng-number-list' || st.visual === 'eng-number'), cls.lesson.id).toBe(true)
    }
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
