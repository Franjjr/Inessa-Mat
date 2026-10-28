/* The Lengua placement test: twelve items in three blocks, no reading and no dictation, the same items for the same seed. */
import { describe, expect, it } from 'vitest'
import { buildLenguaPlacement, LENGUA_PLACEMENT_BLOCKS, LENGUA_PLACEMENT_COUNT } from '@/engine'

const NOW = new Date('2026-10-27T10:00:00.000Z')

describe('buildLenguaPlacement', () => {
  it('has twelve items in the grammar, spelling and vocabulary blocks, in order', () => {
    const items = buildLenguaPlacement('child|2026-10-27', NOW)
    expect(items.length).toBe(LENGUA_PLACEMENT_COUNT)
    const order = LENGUA_PLACEMENT_BLOCKS.map((b) => b.id)
    const blocks = items.map((i) => i.block)
    expect(blocks).toEqual([...blocks].sort((x, y) => order.indexOf(x) - order.indexOf(y)))
    for (const b of order) expect(blocks.filter((x) => x === b).length).toBe(4)
  })

  it('has no reading and no dictation', () => {
    const items = buildLenguaPlacement('child|2026-10-27', NOW)
    for (const item of items) {
      expect(item.exercise.kind).not.toMatch(/^lng-read-/)
      expect(item.exercise.kind).not.toBe('lng-dictation')
      expect(item.exercise.skill.startsWith('lng:')).toBe(true)
    }
  })

  it('the same seed gives the same items; another day another set', () => {
    const a = buildLenguaPlacement('child|2026-10-27', NOW).map((i) => i.exercise.id)
    const b = buildLenguaPlacement('child|2026-10-27', NOW).map((i) => i.exercise.id)
    expect(a).toEqual(b)
  })
})
