import { describe, expect, it } from 'vitest'
import { initialProgress, season1 } from '@/content'
import { allTopics, syllabusForGrade } from '@/content/syllabus'
import type { MasteryMap, SkillMastery } from '@/types'
import { progressWithCrystals } from '@/world/rewards/testing'
import { reachedClasses, tableDrill, unlockedGames, unlockedTables } from './logic'

const topicIds = (list: ReturnType<typeof reachedClasses>) => list.map((c) => c.topicId)

/** Mastery at the mastered box for every skill of a topic of 3.º. */
function masteredTopic(topicId: string): MasteryMap {
  const topic = allTopics(syllabusForGrade(3)).find((t) => t.id === topicId)!
  const map: MasteryMap = {}
  for (const skill of topic.skills) {
    map[skill] = { skill, box: 2, attempts: 3, correct: 3, streak: 2, avgMs: null, lastSeenAt: null, dueAt: null, updatedAt: '2026-10-01T10:00:00.000Z' } as SkillMastery
  }
  return map
}

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

  it('the classes to repeat from Jugar: the done ones, the mastered topics and today\'s topic, of the child\'s grade only', () => {
    const fresh = initialProgress('c')
    const done = { ...fresh, flags: { ...fresh.flags, 'clase:resta-3d-prestando': true } }
    expect(topicIds(reachedClasses({ grade: 3, mastery: {}, progress: done }))).toContain('resta-3d-prestando')
    expect(topicIds(reachedClasses({ grade: 3, mastery: {}, progress: fresh }))).not.toContain('div-exacta')

    const mastered = topicIds(reachedClasses({ grade: 3, mastery: masteredTopic('suma-2d'), progress: fresh }))
    expect(mastered).toContain('suma-2d')

    expect(reachedClasses({ grade: 2, mastery: masteredTopic('suma-2d'), progress: done })).toEqual([])
  })

  it('each reached class carries its topic title and the class definition', () => {
    const list = reachedClasses({ grade: 3, mastery: masteredTopic('suma-2d'), progress: initialProgress('c') })
    const item = list.find((c) => c.topicId === 'suma-2d')
    expect(item?.title).toBe('Suma de 2 cifras')
    expect(item?.cls.topicId).toBe('suma-2d')
  })
})
