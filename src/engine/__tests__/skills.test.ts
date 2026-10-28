/* Skill keys: the cal: (handwriting) grammar is valid for isValidSkill, and malformed cal: keys are not. */
import { describe, expect, it } from 'vitest'
import { isValidSkill } from '../skills'

describe('isValidSkill for cal: keys', () => {
  it('accepts the handwriting grammar', () => {
    for (const key of ['cal:letra:a', 'cal:letra:ñ', 'cal:mayus:A', 'cal:mayus:Ñ', 'cal:enlace:ab', 'cal:palabra:casa', 'cal:palabra:árbol', 'cal:frase:1']) {
      expect(isValidSkill(key), key).toBe(true)
    }
  })

  it('rejects malformed cal: keys', () => {
    for (const key of ['cal:', 'cal:letra:', 'cal:letra:ab', 'cal:mayus:a', 'cal:enlace:a', 'cal:palabra:', 'cal:foo:a', 'cal:letra:a:b']) {
      expect(isValidSkill(key), key).toBe(false)
    }
  })
})
