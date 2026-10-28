/* Skill keys: the calig: (handwriting) grammar is valid for isValidSkill, and malformed calig: keys are not. */
import { describe, expect, it } from 'vitest'
import { isValidSkill } from '../skills'

describe('isValidSkill for calig: keys', () => {
  it('accepts the handwriting grammar', () => {
    for (const key of ['calig:letra:a', 'calig:letra:ñ', 'calig:mayus:A', 'calig:mayus:Ñ', 'calig:enlace:ab', 'calig:palabra:casa', 'calig:palabra:árbol', 'calig:frase:1']) {
      expect(isValidSkill(key), key).toBe(true)
    }
  })

  it('rejects malformed calig: keys and the old cal: handwriting names', () => {
    for (const key of ['calig:', 'calig:letra:', 'calig:letra:ab', 'calig:mayus:a', 'calig:enlace:a', 'calig:palabra:', 'calig:foo:a', 'calig:letra:a:b', 'cal:letra:a']) {
      expect(isValidSkill(key), key).toBe(false)
    }
  })
})
