import { describe, expect, it } from 'vitest'
import type { Reward } from '@/types'
import { progressWithCrystals } from '@/world/rewards/testing'
import { chestReward, chestState } from './logic'

describe('chestState', () => {
  it('stays locked with 7 crystals and shows the letters won so far', () => {
    const state = chestState(progressWithCrystals(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7']))
    expect(state.open).toBe(false)
    expect(state.collected).toBe(7)
    expect(state.letters.filter(Boolean)).toHaveLength(7)
    expect(state.letters[7]).toBeNull()
  })

  it('opens with all 8 crystals and the letters assemble into VALIENTE', () => {
    const all = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8']
    const state = chestState(progressWithCrystals(all))
    expect(state.open).toBe(true)
    expect(state.collected).toBe(8)
    expect(state.letters.join('')).toBe('VALIENTE')
    expect(state.word).toBe('VALIENTE')
  })

  it('a fresh child has nothing in the chest yet', () => {
    const state = chestState(progressWithCrystals([]))
    expect(state.open).toBe(false)
    expect(state.collected).toBe(0)
    expect(state.letters.every((l) => l === null)).toBe(true)
  })
})

describe('chestReward', () => {
  it('finds the adult chest reward among the child rewards', () => {
    const rewards: Reward[] = [
      { id: 'a', childId: 'c', kind: 'world', worldId: 'w1', title: 'Cine', createdBy: null },
      { id: 'b', childId: 'c', kind: 'chest', title: 'Una tarde de cine contigo', createdBy: null },
    ]
    expect(chestReward(rewards)?.id).toBe('b')
    expect(chestReward([])).toBeNull()
  })
})
