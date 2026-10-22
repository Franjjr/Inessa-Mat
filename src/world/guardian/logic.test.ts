import { describe, expect, it } from 'vitest'
import { SPELL_CODES, getGuardian, guardians, season1 } from '@/content'
import { createRng, check } from '@/engine'
import { buildRounds, buildSpell, decoyLetterFor, guardianCharacter, roundsPassed, roundsTotal, spellLetter } from './logic'

describe('guardian pass threshold', () => {
  it('passes with all but one right on the w1 owl (7 of 8)', () => {
    const owl = getGuardian('w1-guardian')!
    expect(roundsTotal(owl)).toBe(8)
    expect(roundsPassed(7, owl)).toBe(true)
    expect(roundsPassed(8, owl)).toBe(true)
    expect(roundsPassed(6, owl)).toBe(false)
  })

  it('uses each guardian passMin, never more than the rounds', () => {
    for (const g of guardians) {
      expect(g.passMin, g.id).toBeGreaterThan(0)
      expect(g.passMin, g.id).toBeLessThanOrEqual(roundsTotal(g))
      expect(roundsPassed(g.passMin - 1, g), g.id).toBe(false)
      expect(roundsPassed(g.passMin, g), g.id).toBe(true)
    }
  })
})

describe('guardian content and spell', () => {
  it('builds exactly the rounds the guardian defines', () => {
    const rng = createRng(7)
    for (const g of guardians) {
      const exercises = buildRounds(g, rng)
      expect(exercises.length, g.id).toBe(roundsTotal(g))
    }
  })

  it('the fixed spell answers to the code scroll of every guardian', () => {
    for (const g of guardians) {
      const spell = buildSpell(g, createRng(1))
      expect(spell, g.id).not.toBeNull()
      expect(spell!.kind === 'fact-mul' || spell!.kind === 'column-add' || spell!.kind === 'column-sub' || spell!.kind === 'column-mul' || spell!.kind === 'division').toBe(true)
      const code = SPELL_CODES[g.id]
      expect(code, g.id).toBeDefined()
      expect(check(spell!, { type: 'number', value: code.result }).correct, g.id).toBe(true)
      expect(spellLetter(g), g.id).toBe(code.letter)
    }
  })

  it('gives the letters of VALIENTE in season order', () => {
    const letters = season1.worlds.map((w) => spellLetter(getGuardian(`${w.id}-guardian`)!))
    expect(letters.join('')).toBe(season1.secretWord)
  })

  it('a wrong spell result that is a decoy gets a clue, other results none', () => {
    expect(decoyLetterFor('17')).toBe('R')
    expect(decoyLetterFor('35')).toBeUndefined()
    expect(decoyLetterFor('hola')).toBeUndefined()
  })

  it('maps guardian characters to drawable ids', () => {
    expect(guardianCharacter('owl')).toBe('owl')
    expect(guardianCharacter('companion')).toBe('lumi')
    expect(guardianCharacter('narrator')).toBe('lumi')
  })
})
