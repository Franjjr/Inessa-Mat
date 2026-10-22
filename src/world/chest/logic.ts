/* Gran Cofre state (pure): the chest opens when all 8 crystals are won; the letters of VALIENTE come from the
   worlds' letters. The reward itself belongs to the adult (Reward kind 'chest'). */
import { crystalsOf, lettersOf, season1 } from '@/content'
import type { ProgressState, Reward } from '@/types'

export interface ChestState {
  collected: number
  total: number
  open: boolean
  /** One entry per world, in order: the letter won there, or null. */
  letters: (string | null)[]
  word: string
}

export function chestState(progress: ProgressState): ChestState {
  const flags = crystalsOf(progress)
  const total = season1.worlds.length
  const collected = flags.filter(Boolean).length
  return {
    collected,
    total,
    open: total > 0 && collected === total,
    letters: lettersOf(progress),
    word: season1.secretWord.toUpperCase(),
  }
}

/** The adult's chest reward, if one was set (one per child). */
export function chestReward(rewards: Reward[]): Reward | null {
  return rewards.find((r) => r.kind === 'chest') ?? null
}
