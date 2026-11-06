/* The English placement test: ten items over saludos, números, colores, animales and comida, with no listening kind
   (it is the same with the sound off), the same items for the same seed and day. */
import { describe, expect, it } from 'vitest'
import { buildEnglishPlacement, ENGLISH_PLACEMENT_BLOCKS, ENGLISH_PLACEMENT_COUNT } from '../placement'
import { ENGLISH_LISTENING_KINDS } from '../exercises'

const NOW = new Date('2026-11-06T10:00:00.000Z')

describe('buildEnglishPlacement', () => {
  it('builds ten items in five blocks, in order', () => {
    const items = buildEnglishPlacement('child-1|2026-11-06', NOW)
    expect(items).toHaveLength(ENGLISH_PLACEMENT_COUNT)
    expect(ENGLISH_PLACEMENT_COUNT).toBe(10)
    expect(ENGLISH_PLACEMENT_BLOCKS.map((b) => b.id)).toEqual(['saludos', 'numeros', 'colores', 'animales', 'comida'])
    const order = items.map((i) => i.block)
    const sorted = [...order].sort((a, b) => ENGLISH_PLACEMENT_BLOCKS.findIndex((x) => x.id === a) - ENGLISH_PLACEMENT_BLOCKS.findIndex((x) => x.id === b))
    expect(order).toEqual(sorted)
    expect(new Set(order)).toEqual(new Set(ENGLISH_PLACEMENT_BLOCKS.map((b) => b.id)))
  })

  it('never plans a listening kind, whatever the seed', () => {
    for (const seed of ['a', 'b', 'c', 'd']) {
      const items = buildEnglishPlacement(seed, NOW)
      expect(items.some((i) => ENGLISH_LISTENING_KINDS.includes(i.exercise.kind))).toBe(false)
    }
  })

  it('the same seed gives the same items; another seed may give other ones', () => {
    const a = buildEnglishPlacement('child-1|2026-11-06', NOW).map((i) => i.exercise.id)
    const b = buildEnglishPlacement('child-1|2026-11-06', NOW).map((i) => i.exercise.id)
    expect(b).toEqual(a)
  })
})
