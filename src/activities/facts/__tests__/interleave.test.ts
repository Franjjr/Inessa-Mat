/* Interleaving: a one-table activity swaps its last fact for a review fact of another table (seen, not yet secured). */
import { describe, expect, it } from 'vitest'
import { generate, makeFactMul, newMastery } from '@/engine'
import type { MasteryMap, SkillMastery } from '@/types'
import { adaptiveSelector, interleaveReview, KNOWN_BOX } from '../shared/items'

const seen = (skill: string, box: number): SkillMastery => ({ ...newMastery(skill as never), box: box as never, attempts: 3 })
const counter = (start: number) => () => {
  start = (start * 16807) % 2147483647
  return start / 2147483647
}

describe('interleaveReview', () => {
  const sixes = [1, 2, 3, 4, 5, 6, 7].map((b) => makeFactMul(6, b))

  it('swaps the last fact for a seen, weak fact of another table', () => {
    const mastery: MasteryMap = { 'mul:3x7': seen('mul:3x7', 1), 'mul:6x6': seen('mul:6x6', 0) }
    const out = interleaveReview(sixes.slice(0, 5), { kinds: ['fact-mul'], tables: [6] }, mastery, counter(3))
    expect(out).toHaveLength(5)
    expect(out.slice(0, 4)).toEqual(sixes.slice(0, 4))
    expect(out[4]).toMatchObject({ kind: 'fact-mul', a: 3, b: 7 })
  })

  it('leaves the items alone when no other table has a weak fact', () => {
    const mastery: MasteryMap = { 'mul:3x7': seen('mul:3x7', KNOWN_BOX), 'mul:6x6': seen('mul:6x6', 0) }
    const items = sixes.slice(0, 5)
    expect(interleaveReview(items, { kinds: ['fact-mul'], tables: [6] }, mastery, counter(3))).toBe(items)
  })

  it('only reviews facts whose factors are inside the selector range', () => {
    // 1 × 7 is outside the [2, 9] range of this activity: it must not come back as a review.
    const mastery: MasteryMap = { 'mul:1x7': seen('mul:1x7', 0) }
    const items = sixes.slice(0, 5)
    expect(interleaveReview(items, { kinds: ['fact-mul'], tables: [6], factorRange: [2, 9] }, mastery, counter(3))).toBe(items)
    const inside: MasteryMap = { 'mul:3x7': seen('mul:3x7', 0) }
    expect(interleaveReview(items, { kinds: ['fact-mul'], tables: [6], factorRange: [2, 9] }, inside, counter(3))[4])
      .toMatchObject({ a: 3, b: 7 })
  })

  it('does nothing for activities with more than one table or too few items', () => {
    const mastery: MasteryMap = { 'mul:3x7': seen('mul:3x7', 0) }
    const items = sixes.slice(0, 5)
    expect(interleaveReview(items, { kinds: ['fact-mul'], tables: [6, 7] }, mastery, counter(3))).toBe(items)
    expect(interleaveReview(sixes.slice(0, 3), { kinds: ['fact-mul'], tables: [6] }, mastery, counter(3))).toHaveLength(3)
  })
})

describe('adaptiveSelector', () => {
  it('turns the adaptive draw on unless the selector turns it off', () => {
    expect(adaptiveSelector({ kinds: ['array'] }).adaptive).toBe(true)
    expect(adaptiveSelector({ kinds: ['array'], adaptive: false }).adaptive).toBe(false)
  })

  it('an adaptive operations draw still gives only skills of the selected kind', () => {
    const mastery: MasteryMap = { 'mul:6x7': seen('mul:6x7', 0) }
    const rounds = generate(adaptiveSelector({ kinds: ['array'] }), 4, { rng: counter(5), mastery })
    expect(rounds.every((e) => e.kind === 'array')).toBe(true)
  })
})
