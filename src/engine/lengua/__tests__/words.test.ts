/* The word banks of Lengua de 3.º: sizes, regular forms, one class per form, sentences of 5 to 10 words whose verbs are
   all in the sentence's tense, and every word of a sentence known to the banks. */
import { describe, expect, it } from 'vitest'
import { ADJECTIVES, ambiguousForms, ARTICLES, NOUNS, OTHER_WORDS, PROPER_NAMES, SENTENCES, VERBS, wordClass } from '../words'

const unaccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const isVowel = (c: string) => 'aeiouáéíóú'.includes(c)
/** The regular plural of a word: +s after a vowel, +es after a consonant (accents ignored, they move with the rule). */
const regularPlural = (sg: string) => unaccent(sg) + (isVowel(unaccent(sg).slice(-1)) ? 's' : 'es')

describe('Lengua word banks', () => {
  it('have the sizes of the plan: nouns, adjectives, regular verbs and sentences', () => {
    expect(NOUNS.length).toBeGreaterThanOrEqual(60)
    expect(ADJECTIVES.length).toBeGreaterThanOrEqual(40)
    expect(VERBS.length).toBeGreaterThanOrEqual(40)
    expect(SENTENCES.length).toBeGreaterThanOrEqual(30)
  })

  it('nouns: the plural is regular and the feminine of a pair is the masculine with -a', () => {
    for (const n of NOUNS) {
      expect(unaccent(n.pl), n.sg).toBe(regularPlural(n.sg))
      if (n.f) {
        expect(n.f.sg, n.sg).toBe(n.sg.slice(0, -1) + 'a')
        expect(unaccent(n.f.pl), n.sg).toBe(regularPlural(n.f.sg))
      }
    }
  })

  it('adjectives: the feminine of the -o adjectives and the regular plurals', () => {
    for (const a of ADJECTIVES) {
      if (a.m.endsWith('o')) expect(a.f, a.m).toBe(a.m.slice(0, -1) + 'a')
      else expect(a.f, a.m).toBe(a.m)
      expect(unaccent(a.mPl), a.m).toBe(regularPlural(a.m))
      expect(unaccent(a.fPl), a.m).toBe(regularPlural(a.f))
    }
  })

  it('verbs: the regular endings of the 3.ª persona in presente, pretérito (pasado) and futuro', () => {
    for (const v of VERBS) {
      const stem = v.inf.slice(0, -2)
      const ending = v.inf.slice(-2)
      expect(unaccent(v.fut), v.inf).toBe(unaccent(v.inf) + 'a')
      if (ending === 'ar') {
        expect(v.pres, v.inf).toBe(stem + 'a')
        expect(unaccent(v.pas), v.inf).toBe(stem + 'o')
      } else {
        expect(v.pres, v.inf).toBe(stem + 'e')
        expect(unaccent(v.pas), v.inf).toBe(stem + 'io')
      }
    }
  })

  it('one class per form: no word is a noun and a verb, or any other two classes at once', () => {
    expect(ambiguousForms()).toEqual([])
  })

  it('the articles and the function words are not nouns, adjectives or verbs', () => {
    for (const w of [...ARTICLES, ...OTHER_WORDS]) expect(wordClass(w).cls, w).toBe(ARTICLES.includes(w as never) ? 'articulo' : 'otra')
  })

  it('a proper name is a noun, and a name is never the form of another class', () => {
    for (const name of PROPER_NAMES) expect(wordClass(name).cls, name).toBe('sustantivo')
  })
})

describe('Lengua sentences', () => {
  it('have 5 to 10 words, a subject and a predicate with a verb', () => {
    for (const s of SENTENCES) {
      expect(s.words.length, s.words.join(' ')).toBeGreaterThanOrEqual(5)
      expect(s.words.length, s.words.join(' ')).toBeLessThanOrEqual(10)
      expect(s.subject, s.words.join(' ')).toBeGreaterThanOrEqual(1)
      expect(s.subject, s.words.join(' ')).toBeLessThan(s.words.length)
      expect(s.words.slice(s.subject).some((w) => wordClass(w).cls === 'verbo'), s.words.join(' ')).toBe(true)
    }
  })

  it('every word is known: an article, a noun, an adjective, a verb, or a function word of the list', () => {
    for (const s of SENTENCES) {
      for (const w of s.words) {
        const known = wordClass(w).cls !== 'otra' || (OTHER_WORDS as readonly string[]).includes(w.toLocaleLowerCase('es'))
        expect(known, `${w} in «${s.words.join(' ')}»`).toBe(true)
      }
    }
  })

  it('every verb of a sentence is in the tense of the sentence', () => {
    for (const s of SENTENCES) {
      for (const w of s.words) {
        const c = wordClass(w)
        if (c.cls === 'verbo') expect(c.tense, `${w} in «${s.words.join(' ')}»`).toBe(s.tense)
      }
    }
  })

  it('each tense has at least 10 sentences, and each class appears in the sentences', () => {
    for (const t of ['presente', 'pasado', 'futuro'] as const) expect(SENTENCES.filter((s) => s.tense === t).length, t).toBeGreaterThanOrEqual(10)
    const classes = new Set(SENTENCES.flatMap((s) => s.words.map((w) => wordClass(w).cls)))
    for (const c of ['articulo', 'sustantivo', 'adjetivo', 'verbo']) expect(classes.has(c as never), c).toBe(true)
  })
})
