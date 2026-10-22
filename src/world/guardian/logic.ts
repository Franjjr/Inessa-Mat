/* Guardian challenge rules (pure). Pass = at least `passMin` right out of the rounds; then the Hechizo del
   Cristal (one fixed exercise whose result is the letter's code). Two tries on the spell, then a gentle stop. */
import { SPELL_CODES, SPELL_DECOYS } from '@/content'
import { generate, makeExercise } from '@/engine'
import type { CharacterId, CharacterProps, Exercise, GuardianDef, Rng } from '@/types'

export type GuardianCharacterId = CharacterProps['id']

/** Guardians are drawn by Character; anything that is not a guardian character falls back to Lumi. */
export function guardianCharacter(id: CharacterId): GuardianCharacterId {
  return id === 'companion' || id === 'narrator' ? 'lumi' : id
}

export const SPELL_TRIES = 2

export function roundsTotal(guardian: GuardianDef): number {
  return guardian.rounds.reduce((sum, round) => sum + round.count, 0)
}

/** Passed when the child got at least passMin of the rounds right (workbook rule: all but one). */
export function roundsPassed(correct: number, guardian: GuardianDef): boolean {
  return correct >= guardian.passMin
}

export function buildRounds(guardian: GuardianDef, rng: Rng): Exercise[] {
  return guardian.rounds.flatMap((round) => generate(round.selector, round.count, { rng }))
}

export function buildSpell(guardian: GuardianDef, rng: Rng): Exercise | null {
  const fixed = guardian.spell.fixed
  if (fixed) return makeExercise(fixed.kind, fixed.a, fixed.b)
  const [spell] = generate(guardian.spell.selector ?? { kinds: ['fact-mul'] }, 1, { rng })
  return spell ?? null
}

/** The letter this guardian gives (content's GuardianDef.letter, else the spell code table). */
export function spellLetter(guardian: GuardianDef): string {
  return guardian.letter || SPELL_CODES[guardian.id]?.letter || ''
}

/** A wrong spell answer that lands on one of Borrón's decoy codes gets a specific clue. */
export function decoyLetterFor(given: string): string | undefined {
  const n = Number(given)
  if (!Number.isInteger(n)) return undefined
  return SPELL_DECOYS[n]
}
