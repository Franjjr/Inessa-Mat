import { describe, expect, it } from 'vitest'
import { initialProgress, season1 } from '@/content'
import { progressWithCrystals } from '@/world/rewards/testing'
import { tableDrill, unlockedGames, unlockedTables } from './logic'

describe('free play', () => {
  it('a new child has nothing to practise yet: the adventure unlocks it node by node', () => {
    expect(unlockedTables(initialProgress('c'))).toEqual([])
    expect(unlockedGames(initialProgress('c'))).toEqual([])
  })

  it('the first world brings its tables, sorted, and no later tables', () => {
    const tables = unlockedTables(progressWithCrystals(['w1']))
    expect(tables.length).toBeGreaterThan(0)
    expect(tables).toEqual([...tables].sort((a, b) => a - b))
    expect(tables).not.toContain(7)
    expect(tables).not.toContain(8)
  })

  it('tables open as worlds are won: the 6 table after the 5 crystals', () => {
    const tables = unlockedTables(progressWithCrystals(['w1', 'w2', 'w3', 'w4', 'w5']))
    expect(tables).toContain(6)
  })

  it('only unlocked minigames are offered, never review or story nodes', () => {
    const games = unlockedGames(progressWithCrystals(['w1']))
    expect(games.length).toBeGreaterThan(0)
    for (const g of games) {
      expect(g.worldId).toBe('w1')
      expect(g.config.kind).not.toBe('review')
    }
    const all = unlockedGames(progressWithCrystals(season1.worlds.map((w) => w.id)))
    expect(all.length).toBeGreaterThan(games.length)
  })

  it('a table drill asks only that table', () => {
    const drill = tableDrill(6)
    expect(drill.kind).toBe('facts')
    expect(drill.selector.tables).toEqual([6])
    expect(drill.selector.kinds).toEqual(['fact-mul'])
  })
})
