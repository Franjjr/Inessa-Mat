/* Ortografía de Lengua de 3.º: the gap exercises (letter or capital missing), the sentences with their marks, and the
   dictation (the text the voice says: 400 characters at most, one word or one sentence). */
import { describe, expect, it } from 'vitest'
import { check, createRng, generate, hintsFor, kindsForSkill, lenguaStatement, statementOf } from '@/engine'
import type { LngDictationExercise, LngMissingLetterExercise, LngPunctuationExercise } from '@/types'
import { DICTATION_SENTENCES, DICTATION_WORDS, PUNCTUATION_SENTENCES, dictationRule } from '../spelling'

const GAP_SKILLS = ['lng:orto:c-qu', 'lng:orto:g-gu', 'lng:orto:r-rr', 'lng:orto:mp-mb', 'lng:orto:mayusculas']
const SIGN_SKILLS = ['lng:orto:signos:punto', 'lng:orto:signos:coma', 'lng:orto:signos:pregunta', 'lng:orto:signos:exclamacion']

function sample<K extends 'lng-missing-letter' | 'lng-punctuation' | 'lng-dictation'>(skill: string, kind: K, box = 0, n = 40) {
  const out: Extract<ReturnType<typeof generate>[number], { kind: K }>[] = []
  for (let seed = 1; seed <= n; seed++) {
    for (const ex of generate({ skills: [skill], kinds: [kind] }, 6, { rng: createRng(seed), mastery: { [skill]: { box } } as never })) {
      if (ex.kind === kind) out.push(ex as never)
    }
  }
  return out
}

describe('letter that is missing (c/qu, g/gu/gü, r/rr, mp/mb, mayúscula)', () => {
  it.each(GAP_SKILLS)('%s: every item shows its gap, and the right letters are the only right answer', (skill) => {
    const seen = new Set<string>()
    for (const ex of sample(skill, 'lng-missing-letter') as LngMissingLetterExercise[]) {
      seen.add(ex.word)
      expect(ex.shown, ex.id).toMatch(/_/)
      expect(ex.shown.replace(/_+/g, '').length, ex.id).toBe(ex.word.length - ex.answer.length)
      expect(ex.word.includes(ex.answer), ex.id).toBe(true)
      if (ex.mode === 'choose') {
        expect(new Set(ex.options).size, ex.id).toBe(ex.options.length)
        expect(ex.options, ex.id).toContain(ex.answer)
        const right = check(ex, { type: 'choice', index: ex.options.indexOf(ex.answer) })
        expect(right.correct, ex.id).toBe(true)
        for (const o of ex.options.filter((x) => x !== ex.answer)) {
          const wrong = check(ex, { type: 'choice', index: ex.options.indexOf(o) })
          expect(wrong.correct, `${ex.id} ${o}`).toBe(false)
          expect(wrong.errorType, ex.id).toBe(skill.endsWith('mayusculas') ? 'capital' : 'spelling')
        }
      } else {
        expect(ex.answer, ex.id).toBe(ex.word)
        expect(check(ex, { type: 'text', value: ex.word }).correct, ex.id).toBe(true)
        // R12: only the capital is graded; the letters of the other groups ignore case.
        expect(check(ex, { type: 'text', value: ex.word.toLowerCase() }).correct, ex.id).toBe(!skill.endsWith('mayusculas') || ex.word === ex.word.toLowerCase())
        expect(check(ex, { type: 'text', value: ex.word.replace(/[aeiou]/, (v) => ({ a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' } as Record<string, string>)[v] ?? v) }).correct, ex.id).toBe(false)
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(5)
  })

  it('from box 2 the child writes the whole word; below it the child chooses the letters', () => {
    expect(sample('lng:orto:c-qu', 'lng-missing-letter', 0).every((e) => (e as LngMissingLetterExercise).mode === 'choose')).toBe(true)
    expect(sample('lng:orto:c-qu', 'lng-missing-letter', 2).every((e) => (e as LngMissingLetterExercise).mode === 'type')).toBe(true)
  })

  it('a capital is graded as a capital, and the hints give three levels', () => {
    const ex = sample('lng:orto:mayusculas', 'lng-missing-letter', 2)[0] as LngMissingLetterExercise
    const r = check(ex, { type: 'text', value: ex.word.toLowerCase() })
    expect(r.correct).toBe(false)
    expect(r.errorType).toBe('capital')
    expect(hintsFor(ex).map((h) => h.level)).toEqual([1, 2, 3])
  })
})

describe('sentences with their marks', () => {
  it.each(SIGN_SKILLS)('%s: the sentence shown has no mark, and the written sentence is the only right answer', (skill) => {
    for (const ex of sample(skill, 'lng-punctuation') as LngPunctuationExercise[]) {
      expect(ex.bare, ex.id).not.toMatch(/[.,¿?¡!]/)
      expect(ex.answer.replace(/[.,¿?¡!]/g, '').replace(/\s+/g, ' ').trim(), ex.id).toBe(ex.bare.replace(/\s+/g, ' ').trim())
      expect(check(ex, { type: 'text', value: ex.answer }).correct, ex.id).toBe(true)
      expect(check(ex, { type: 'text', value: ex.bare }).correct, ex.id).toBe(false)
      expect(check(ex, { type: 'text', value: ex.bare }).errorType, ex.id).toBe('punctuation')
    }
  })

  it('a sentence missing its marks says so; the words stay right', () => {
    const r = check({ id: 'x', kind: 'lng-punctuation', skill: SIGN_SKILLS[0], difficulty: 1, bare: 'Hola cómo estás', answer: 'Hola, ¿cómo estás?' } as LngPunctuationExercise, { type: 'text', value: 'Hola cómo estás' })
    expect(r.feedback).toMatch(/signos/)
  })

  it('every sentence of the bank has its marks and a capital at its start', () => {
    for (const s of PUNCTUATION_SENTENCES) expect(s, s).toMatch(/^[¿¡]?\p{Lu}/u)
    expect(new Set(PUNCTUATION_SENTENCES).size).toBe(PUNCTUATION_SENTENCES.length)
    expect(PUNCTUATION_SENTENCES.length).toBeGreaterThanOrEqual(20)
  })
})

describe('dictation: what the voice says', () => {
  it('every text the voice may say is at most 400 characters (the /api/tts limit)', () => {
    for (const t of [...DICTATION_WORDS, ...DICTATION_SENTENCES]) expect(t.length, t).toBeLessThanOrEqual(400)
    expect(DICTATION_WORDS.length).toBeGreaterThanOrEqual(20)
    expect(DICTATION_SENTENCES.length).toBeGreaterThanOrEqual(12)
  })

  it('a word is graded ignoring its capital; a sentence is graded exactly (capitals and marks count)', () => {
    expect(dictationRule('vaca')).toBe('ignore-case')
    expect(dictationRule('El perro come pan.')).toBe('exact')
    const word = sample('lng:escr:dictado', 'lng-dictation', 0)[0] as LngDictationExercise
    expect(check(word, { type: 'text', value: word.answer[0].toUpperCase() + word.answer.slice(1) }).correct).toBe(true)
    const sentence = sample('lng:escr:dictado', 'lng-dictation', 2)[0] as LngDictationExercise
    expect(sentence.answer).toMatch(/\s/)
    expect(check(sentence, { type: 'text', value: sentence.answer.toLowerCase() }).correct).toBe(false)
    expect(check(sentence, { type: 'text', value: sentence.answer.replace(/[.!?]$/, '') }).correct).toBe(false)
  })

  it('the statement line never gives the text away', () => {
    for (const ex of sample('lng:escr:dictado', 'lng-dictation', 2, 3)) {
      expect(lenguaStatement(ex)).not.toContain(ex.answer)
      expect(statementOf(ex)).not.toContain(ex.answer)
    }
  })

  it('the skill has the dictation kind, and the hints come in three levels that never give the text', () => {
    expect(kindsForSkill('lng:escr:dictado')).toEqual(['lng-dictation'])
    for (const ex of sample('lng:escr:dictado', 'lng-dictation', 2, 10)) {
      const hs = hintsFor(ex)
      expect(hs.map((h) => h.level)).toEqual([1, 2, 3])
      for (const h of hs) expect(h.text).not.toContain(ex.answer)
    }
  })
})
