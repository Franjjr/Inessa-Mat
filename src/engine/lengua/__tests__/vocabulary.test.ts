/* Vocabulario de Lengua de 3.º: the alphabet exercise (words in alphabetical order, ñ after n) and the pair questions. */
import { describe, expect, it } from 'vitest'
import { check, createRng, generate, hintsFor, kindsForSkill } from '@/engine'
import type { LngAlphabetExercise, LngPairWordsExercise } from '@/types'
import { ALPHABET_SETS, alphabetKey, inAlphabetOrder } from '../vocabulary'

const PAIR_SKILLS = ['lng:voc:sinonimos', 'lng:voc:antonimos', 'lng:voc:familias', 'lng:voc:diminutivos', 'lng:voc:aumentativos', 'lng:voc:compuestas']

function sample<K extends 'lng-alphabet' | 'lng-pair-words'>(skill: string, kind: K, n = 40) {
  const out: Extract<ReturnType<typeof generate>[number], { kind: K }>[] = []
  for (let seed = 1; seed <= n; seed++) {
    for (const ex of generate({ skills: [skill], kinds: [kind] }, 6, { rng: createRng(seed) })) if (ex.kind === kind) out.push(ex as never)
  }
  return out
}

describe('alphabet', () => {
  it('the words sort as the dictionary does: no accents, and ñ after every n', () => {
    expect(inAlphabetOrder(['oso', 'ñandú', 'nube'])).toEqual(['nube', 'ñandú', 'oso'])
    expect(inAlphabetOrder(['árbol', 'arco', 'azul'])).toEqual(['árbol', 'arco', 'azul'])
    expect(inAlphabetOrder(['casa', 'cabra', 'codo'])).toEqual(['cabra', 'casa', 'codo'])
    expect(alphabetKey('Ñu')).toBe('n{u')
  })

  it('every set has 3 to 4 different words', () => {
    for (const set of ALPHABET_SETS) {
      expect(set.length, set.join(',')).toBeGreaterThanOrEqual(3)
      expect(set.length, set.join(',')).toBeLessThanOrEqual(4)
      expect(new Set(set).size, set.join(',')).toBe(set.length)
    }
  })

  it('the targets are the shown words in alphabetical order, and the right order is the only right answer', () => {
    for (const ex of sample('lng:voc:abecedario', 'lng-alphabet') as LngAlphabetExercise[]) {
      expect(ex.targets.map((i) => ex.words[i]), ex.id).toEqual(inAlphabetOrder(ex.words))
      expect(check(ex, { type: 'marks', marked: [...ex.targets] }).correct, ex.id).toBe(true)
      const reversed = [...ex.targets].reverse()
      expect(check(ex, { type: 'marks', marked: reversed }).correct, ex.id).toBe(false)
      expect(check(ex, { type: 'marks', marked: [...ex.targets].slice(0, 1) }).errorType, ex.id).toBe('incomplete')
    }
  })

  it('the alphabet skill has its kind, and its hints give three levels', () => {
    expect(kindsForSkill('lng:voc:abecedario')).toEqual(['lng-alphabet'])
    for (const ex of sample('lng:voc:abecedario', 'lng-alphabet', 5)) expect(hintsFor(ex).map((h) => h.level)).toEqual([1, 2, 3])
  })
})

describe('pairs: synonyms, antonyms, families, diminutives, augmentatives, compounds', () => {
  it.each(PAIR_SKILLS)('%s: the right answer is accepted; no other option is right', (skill) => {
    for (const ex of sample(skill, 'lng-pair-words') as LngPairWordsExercise[]) {
      expect(ex.question, ex.id).toMatch(/«/)
      if (ex.mode === 'choice') {
        expect(ex.options, ex.id).toContain(ex.answer)
        expect(new Set(ex.options).size, ex.id).toBe(ex.options.length)
        expect(check(ex, { type: 'choice', index: ex.options.indexOf(ex.answer) }).correct, ex.id).toBe(true)
        for (const o of ex.options.filter((x) => x !== ex.answer)) {
          expect(check(ex, { type: 'choice', index: ex.options.indexOf(o) }).correct, `${ex.id} ${o}`).toBe(false)
        }
      } else {
        expect(ex.options, ex.id).toEqual([])
        expect(check(ex, { type: 'text', value: ex.answer }).correct, ex.id).toBe(true)
        expect(check(ex, { type: 'text', value: `${ex.answer}s` }).correct, ex.id).toBe(false)
      }
    }
  })

  it('the typed forms are written with their one usual spelling, and a missing accent is named', () => {
    const cases = sample('lng:voc:diminutivos', 'lng-pair-words').filter((e): e is LngPairWordsExercise => e.mode === 'text')
    expect(cases.length).toBeGreaterThan(0)
    for (const ex of cases) expect(ex.answer, ex.id).toMatch(/^[a-zñ]+$/)
    expect(check({ ...cases[0], answer: 'pájaro' }, { type: 'text', value: 'pajaro' }).feedback).toBe('¡Casi! Mira la tilde.')
  })

  it('the hints of a pair never name its answer, and come in three levels', () => {
    for (const skill of PAIR_SKILLS) {
      for (const ex of sample(skill, 'lng-pair-words', 8)) {
        const hs = hintsFor(ex)
        expect(hs.map((h) => h.level), ex.id).toEqual([1, 2, 3])
        for (const h of hs) expect(h.text.includes(ex.answer), `${ex.id}: ${h.text}`).toBe(false)
      }
    }
  })
})

describe('distractors: no family option starts like the word it is a family of, and the sets never come out sorted', () => {
  it('no option of a family question starts with the base word', () => {
    for (const ex of sample('lng:voc:familias', 'lng-pair-words') as LngPairWordsExercise[]) {
      const base = /«(.+?)»/.exec(ex.question)![1]
      for (const o of ex.options.filter((x) => x !== ex.answer)) expect(o.startsWith(base), `${ex.id} ${o}`).toBe(false)
    }
  })

  it('the shown words are never already in alphabetical order', () => {
    for (const ex of sample('lng:voc:abecedario', 'lng-alphabet') as LngAlphabetExercise[]) {
      expect(ex.words, ex.id).not.toEqual(inAlphabetOrder(ex.words))
    }
  })
})
