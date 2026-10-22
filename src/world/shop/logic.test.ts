import { describe, expect, it } from 'vitest'
import { accessories, buyAccessory, getAccessory } from '@/content'
import { makeChild, progressWithCrystals } from '@/world/rewards/testing'
import { accessoryStatus, equipAccessory, lockedReason, previewEquipped, unequipAccessory } from './logic'

describe('shop rules', () => {
  it('a new child can buy the cheap starter accessories and sees the rest as locked', () => {
    const child = makeChild()
    const progress = { ...progressWithCrystals([]), stars: 30 }
    expect(accessoryStatus(progress, child.companion, 'lollipop')).toBe('buyable')
    expect(accessoryStatus(progress, child.companion, 'crown')).toBe('locked')
    expect(lockedReason(getAccessory('crown')!)).toMatch(/cristal violeta|cristal/)
  })

  it('says it is short of stars when the balance is too low', () => {
    const child = makeChild()
    const progress = { ...progressWithCrystals([]), stars: 9 }
    expect(accessoryStatus(progress, child.companion, 'sunglasses')).toBe('stars')
    expect(accessoryStatus(progress, child.companion, 'lollipop')).toBe('buyable')
  })

  it('spending stars takes them away from the balance and marks the item owned', () => {
    const child = makeChild()
    const before = { ...progressWithCrystals([]), stars: 20, starsSpent: 0 }
    const after = buyAccessory(before, 'bow')
    expect(after.starsSpent).toBe(6)
    expect(after.accessoriesOwned).toContain('bow')
    expect(accessoryStatus(after, child.companion, 'bow')).toBe('owned')
    // Buying twice is refused: the same state comes back.
    expect(buyAccessory(after, 'bow')).toBe(after)
  })

  it('one accessory per slot: a new hat replaces the old one, other slots stay', () => {
    expect(equipAccessory(['bow', 'lollipop'], 'cap')).toEqual(['lollipop', 'cap'])
    // bow and cap are both 'head': the bow goes off
    expect(equipAccessory(['bow'], 'cap')).toEqual(['cap'])
    expect(equipAccessory(['cap'], 'cap')).toEqual(['cap'])
  })

  it('takes an accessory off without touching the others', () => {
    expect(unequipAccessory(['bow', 'lollipop'], 'bow')).toEqual(['lollipop'])
    expect(unequipAccessory(['bow'], 'cape')).toEqual(['bow'])
  })

  it('previews an accessory on the companion without saving it', () => {
    const child = makeChild({ companion: { ...makeChild().companion, equipped: ['lollipop'] } })
    expect(previewEquipped(child.companion, null)).toEqual(['lollipop'])
    expect(previewEquipped(child.companion, 'cap')).toEqual(['lollipop', 'cap'])
    expect(child.companion.equipped).toEqual(['lollipop'])
  })

  it('every accessory has a price and a known slot', () => {
    for (const a of accessories) {
      expect(a.price).toBeGreaterThan(0)
      expect(['head', 'neck', 'face', 'back', 'held']).toContain(a.slot)
    }
  })
})
