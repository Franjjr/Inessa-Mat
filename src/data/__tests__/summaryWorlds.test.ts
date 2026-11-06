/* The dashboard summary counts and orders only the worlds of the child's season. The island of Inglés keeps its own progress
   (progress.worlds['isla-ingles']): its crystal is not a maths crystal («9 de 8») and the island is never the current world. */
import { describe, expect, it } from 'vitest'
import { initialProgress, ISLAND_ID, getSeason } from '@/content'
import type { ChildProfile, ProgressState } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { buildSummary } from '../summary'

const NOW = new Date('2026-11-06T10:00:00Z')
const child: ChildProfile = {
  id: 'c1', orgId: null, nickname: 'Lía', gender: 'f', companion: { species: 'cat', name: 'Bigotes', gender: 'm', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z',
}

/** A progress where the first `won` maths worlds have their crystal (the next one is open). */
function mathsProgress(won: number, seasonId = 's1'): ProgressState {
  const base = initialProgress(child.id, NOW, seasonId)
  const worlds = { ...base.worlds }
  getSeason(seasonId).worlds.forEach((w, i) => {
    worlds[w.id] = { unlocked: i <= won, nodes: {}, crystal: i < won }
  })
  return { ...base, worlds }
}

const withIsland = (p: ProgressState, crystal: boolean): ProgressState => ({
  ...p,
  worlds: { ...p.worlds, [ISLAND_ID]: { unlocked: true, nodes: {}, crystal } },
})

describe('the summary of a child with the island of Inglés', () => {
  it('counts the maths crystals only: the island crystal does not make it «9 de 8»', () => {
    const p = mathsProgress(8)
    const plain = buildSummary(child, p, {}, null)
    const withCrystal = buildSummary(child, withIsland(p, true), {}, null)
    expect(plain.worldsCompleted).toBe(8)
    expect(withCrystal.worldsCompleted).toBe(8)
  })

  it('does not change the count of a child with a few maths crystals', () => {
    const p = mathsProgress(2)
    expect(buildSummary(child, withIsland(p, true), {}, null).worldsCompleted).toBe(
      buildSummary(child, p, {}, null).worldsCompleted,
    )
    expect(buildSummary(child, withIsland(p, true), {}, null).worldsCompleted).toBe(2)
  })

  it('never names the island as the current world, even when it was the last node', () => {
    const p = { ...withIsland(mathsProgress(1), false), lastNode: { worldId: ISLAND_ID, nodeId: 's1-llegada' } }
    expect(buildSummary(child, p, {}, null).currentWorld).toBe('w2')
  })

  it('has no current world once all eight maths crystals are won, island or not', () => {
    expect(buildSummary(child, withIsland(mathsProgress(8), false), {}, null).currentWorld).toBeNull()
  })

  it('counts the 2.º adventure the same way', () => {
    const p = withIsland(mathsProgress(3, 'c2'), true)
    expect(buildSummary(child, p, {}, null).worldsCompleted).toBe(3)
  })
})
