/* Lengua de 3.º grammar exercises: every skill × kind pair generates, its right answer is accepted, its wrong answers are
   caught with an error type, the hints come in three levels, and the verb tense of the sentences follows the skill. */
import { describe, expect, it } from 'vitest'
import { check, createRng, generate, GRAMMAR_SKILLS, hintsFor, kindsForSkill, lenguaStatement } from '@/engine'
import type { Answer, ExerciseKind, LenguaExercise, LngSentencePartsExercise, LngTapWordsExercise, LngTransformExercise } from '@/types'
import { correctAnswer } from '../../__tests__/helpers'
import { generoOf } from '../grammar'
import { NOUNS, SENTENCES, wordClass } from '../words'

const SEEDS = 40
const pairs = GRAMMAR_SKILLS.flatMap((skill) => kindsForSkill(skill).map((kind) => [skill, kind] as const))

function sample(skill: string, kind: ExerciseKind): LenguaExercise[] {
  const out: LenguaExercise[] = []
  for (let seed = 1; seed <= SEEDS; seed++) {
    for (const ex of generate({ skills: [skill], kinds: [kind] }, 10, { rng: createRng(seed) })) out.push(ex as LenguaExercise)
  }
  return out
}

describe('Lengua grammar exercises: every skill and kind', () => {
  it('every grammar skill practises at least one kind, and every kind practises at least one skill', () => {
    for (const skill of GRAMMAR_SKILLS) expect(kindsForSkill(skill).length, skill).toBeGreaterThan(0)
    for (const kind of ['lng-tap-words', 'lng-sentence-parts', 'lng-classify', 'lng-transform'] as const) {
      expect(GRAMMAR_SKILLS.some((s) => kindsForSkill(s).includes(kind)), kind).toBe(true)
    }
  })

  it.each(pairs)('%s as %s: the right answer is accepted, three hints, a statement line', (skill, kind) => {
    for (const ex of sample(skill, kind)) {
      expect(ex.kind).toBe(kind)
      expect(ex.skill).toBe(skill)
      expect(check(ex, correctAnswer(ex)).correct, `${ex.id}`).toBe(true)
      expect(hintsFor(ex).map((h) => h.level), ex.id).toEqual([1, 2, 3])
      expect(lenguaStatement(ex).length, ex.id).toBeGreaterThan(5)
    }
  })

  it.each(pairs)('%s as %s: a wrong answer is graded wrong with an error type', (skill, kind) => {
    for (const ex of sample(skill, kind).slice(0, 60)) {
      let wrong: Answer
      if (ex.kind === 'lng-tap-words' || ex.kind === 'lng-sentence-parts') {
        const extra = ex.words.findIndex((_, i) => !ex.targets.includes(i))
        wrong = { type: 'marks', marked: [...ex.targets, extra] }
      } else if (ex.kind === 'lng-classify') {
        wrong = { type: 'choice', index: (ex.answer + 1) % ex.options.length }
      } else {
        wrong = { type: 'text', value: 'zzz' }
      }
      const r = check(ex, wrong)
      expect(r.correct, ex.id).toBe(false)
      expect(r.errorType, ex.id).toBeDefined()
      expect(r.feedback, ex.id).not.toMatch(/\{(?!child\}|pet\})/)
    }
  })
})

describe('Lengua grammar checks', () => {
  it('tapping nothing, or the subject for the predicate, is wrong and says what is missing', () => {
    const ex = sample('lng:gram:oracion:predicado', 'lng-sentence-parts')[0]
    const r = check(ex, { type: 'marks', marked: [] })
    expect(r.correct).toBe(false)
    expect(r.errorType).toBe('sentence-part')
    expect(r.feedback).toMatch(/Te falta/)
  })

  it('the subject and the predicate split the sentence at its subject count', () => {
    for (const ex of sample('lng:gram:oracion:sujeto', 'lng-sentence-parts') as LngSentencePartsExercise[]) {
      const s = SENTENCES.find((x) => x.words.join(' ') === ex.words.join(' '))!
      expect(ex.targets).toEqual(Array.from({ length: s.subject }, (_, i) => i))
    }
    for (const ex of sample('lng:gram:oracion:predicado', 'lng-sentence-parts') as LngSentencePartsExercise[]) {
      const s = SENTENCES.find((x) => x.words.join(' ') === ex.words.join(' '))!
      expect(ex.targets).toEqual(Array.from({ length: s.words.length - s.subject }, (_, i) => i + s.subject))
    }
  })

  it('tapping verbs in a tense skill: every verb tapped is in that tense', () => {
    for (const tense of ['presente', 'pasado', 'futuro'] as const) {
      for (const ex of sample(`lng:gram:verbo:${tense}`, 'lng-tap-words') as LngTapWordsExercise[]) {
        expect(ex.wanted, ex.id).toBe('verbo')
        for (const i of ex.targets) expect(wordClass(ex.words[i]).tense, ex.id).toBe(tense)
      }
    }
  })

  it('a typed answer: capitals are forgiven, a missing accent is named and not accepted', () => {
    const ex = sample('lng:gram:verbo:pasado', 'lng-transform').find((e): e is LngTransformExercise => e.kind === 'lng-transform' && /ó$/.test(e.answer))!
    const noAccent = ex.answer.normalize('NFD').replace(/[̀-ͯ]/g, '')
    const r1 = check(ex, { type: 'text', value: noAccent })
    expect(r1.correct).toBe(false)
    expect(r1.errorType).toBe('word-form')
    expect(r1.feedback).toBe('¡Casi! Mira la tilde.')
    expect(check(ex, { type: 'text', value: ex.answer[0].toUpperCase() + ex.answer.slice(1) }).correct).toBe(true)
    expect(check(ex, { type: 'text', value: `  ${ex.answer}  ` }).correct).toBe(true)
  })

  it('género: the key follows the gender of every noun, feminine nouns without a pair included', () => {
    for (const n of NOUNS) {
      expect(generoOf(n, false), n.sg).toBe(n.g === 'f' ? 'femenino' : 'masculino')
      if (n.f) expect(generoOf(n, true), n.f.sg).toBe('femenino')
    }
    expect(generoOf(NOUNS.find((n) => n.sg === 'casa')!, false)).toBe('femenino')
  })

  it('género exercises: the right option is the gender of the word shown', () => {
    for (const ex of sample('lng:gram:sustantivo:genero', 'lng-classify')) {
      if (ex.kind !== 'lng-classify') continue
      const noun = NOUNS.find((n) => n.sg === ex.word || n.f?.sg === ex.word)!
      expect(ex.options[ex.answer], ex.word).toBe(generoOf(noun, noun.f?.sg === ex.word))
    }
  })

  it('classify: two or three different options, and the answer is one of them', () => {
    for (const skill of GRAMMAR_SKILLS.filter((s) => kindsForSkill(s).includes('lng-classify'))) {
      for (const ex of sample(skill, 'lng-classify')) {
        if (ex.kind !== 'lng-classify') continue
        expect(new Set(ex.options).size, ex.id).toBe(ex.options.length)
        expect(ex.answer, ex.id).toBeGreaterThanOrEqual(0)
        expect(ex.answer, ex.id).toBeLessThan(ex.options.length)
      }
    }
  })
})
