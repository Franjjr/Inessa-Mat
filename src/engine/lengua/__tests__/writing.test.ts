/* Escritura de Lengua de 3.º: copiar una frase (lng-copy) y la escritura guiada (lng-guided). The copy is graded as a dictation
   is (the exact sentence); the guided text is completion only (graded: false). */
import { describe, expect, it } from 'vitest'
import { check, createRng, generate, hintsFor, kindsForSkill } from '@/engine'
import type { LngCopyExercise, LngGuidedExercise } from '@/types'
import { COPY_SENTENCES, GUIDED_ITEMS, buildCopy, buildGuided, hintsWriting, isCompletionOnly, statementWriting } from '../writing'

const copyOf = (seed: number): LngCopyExercise => buildCopy('lng:escr:copia', createRng(seed))
const guidedOf = (seed: number): LngGuidedExercise => buildGuided('lng:escr:guiada', createRng(seed))

describe('copia (lng-copy)', () => {
  it('the skill has its kind, and the sentences are the bank of the copy', () => {
    expect(kindsForSkill('lng:escr:copia')).toEqual(['lng-copy'])
    for (let seed = 1; seed <= 40; seed++) {
      const ex = copyOf(seed)
      expect(COPY_SENTENCES, ex.id).toContain(ex.answer)
      expect(ex.kind).toBe('lng-copy')
    }
  })

  it('the generator makes copies for the skill', () => {
    const made = generate({ skills: ['lng:escr:copia'], kinds: ['lng-copy'] }, 3, { rng: createRng(5) })
    expect(made.map((e) => e.kind)).toEqual(['lng-copy', 'lng-copy', 'lng-copy'])
  })

  it('the exact sentence is right; capitals and accents count', () => {
    const ex = copyOf(3)
    expect(check(ex, { type: 'text', value: ex.answer }).correct).toBe(true)
    expect(check(ex, { type: 'text', value: `  ${ex.answer}  ` }).correct, 'spaces at the ends do not count').toBe(true)
    const lower = ex.answer.charAt(0).toLowerCase() + ex.answer.slice(1)
    if (lower !== ex.answer) expect(check(ex, { type: 'text', value: lower }).errorType).toBe('capital')
    const unaccented = ex.answer.normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (unaccented !== ex.answer) {
      const r = check(ex, { type: 'text', value: unaccented })
      expect(r.correct).toBe(false)
      expect(r.errorType).toBe('spelling')
    }
  })

  it('an empty copy is incomplete, and a choice is not an answer to it', () => {
    const ex = copyOf(4)
    expect(check(ex, { type: 'text', value: '   ' }).errorType).toBe('incomplete')
    expect(check(ex, { type: 'choice', index: 0 }).correct).toBe(false)
  })

  it('the hints never give the sentence, and there are three levels', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const ex = copyOf(seed)
      const hs = hintsFor(ex)
      expect(hs.map((h) => h.level)).toEqual([1, 2, 3])
      expect(JSON.stringify(hs), ex.id).not.toContain(ex.answer)
      expect(hintsWriting(ex).length).toBe(3)
    }
  })

  it('the daily plan line does not show the sentence', () => {
    const ex = copyOf(6)
    expect(statementWriting(ex)).not.toContain(ex.answer)
  })
})

describe('escritura guiada (lng-guided)', () => {
  it('the skill has its kind; each text has one more fixed piece than blanks, and the blanks have a question', () => {
    expect(kindsForSkill('lng:escr:guiada')).toEqual(['lng-guided'])
    for (const item of GUIDED_ITEMS) {
      expect(item.parts.length, item.task).toBe(item.prompts.length + 1)
      expect(item.prompts.length, item.task).toBeGreaterThanOrEqual(3)
    }
    for (let seed = 1; seed <= 30; seed++) {
      const ex = guidedOf(seed)
      expect(ex.parts.length).toBe(ex.prompts.length + 1)
    }
  })

  it('a finished text is right, and an empty one is incomplete: nothing is marked wrong', () => {
    const ex = guidedOf(2)
    expect(check(ex, { type: 'text', value: ex.parts.join('Pablo') }).correct).toBe(true)
    expect(check(ex, { type: 'text', value: '' }).errorType).toBe('incomplete')
  })

  it('it is completion only: not graded, and the copy is graded', () => {
    expect(isCompletionOnly('lng-guided')).toBe(true)
    expect(isCompletionOnly('lng-copy')).toBe(false)
    expect(isCompletionOnly('lng-dictation')).toBe(false)
  })

  it('the hints give three levels and nothing to copy', () => {
    const ex = guidedOf(7)
    expect(hintsFor(ex).map((h) => h.level)).toEqual([1, 2, 3])
    expect(statementWriting(ex)).toMatch(/^Escritura guiada: /)
  })
})
