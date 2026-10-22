import { describe, expect, it } from 'vitest'
import type { ProgressState } from '@/types'
import {
  ACCESSORY_IDS, applyNodeResult, buyAccessory, canBuyAccessory, COMPLETION_STARS, crystalsOf, getAccessory, initialProgress,
  getSticker, isNodeUnlocked, isWorldUnlocked, lettersOf, localDay, newStickers, nextNode, season1, spendableStars,
  startingWorldForGrade, unlockThroughWorld,
} from '@/content'

const T0 = new Date(2026, 9, 1, 17, 0, 0) // local time: 1 Oct 2026, 17:00
const day = (n: number) => new Date(T0.getTime() + n * 86_400_000)

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object') {
    Object.freeze(o)
    for (const v of Object.values(o as object)) deepFreeze(v)
  }
  return o
}

/** Finish a node the way the game would (3 stars, guardians passed). */
function finish(p: ProgressState, worldId: string, nodeId: string, stars = 3, now = T0): ProgressState {
  const node = season1.worlds.find((w) => w.id === worldId)!.nodes.find((n) => n.id === nodeId)!
  return applyNodeResult(p, worldId, nodeId, node.kind === 'guardian' ? { stars, passed: true } : { stars, ms: 60_000 }, now)
}

function playWorld(p: ProgressState, worldId: string, now = T0): ProgressState {
  for (const n of season1.worlds.find((w) => w.id === worldId)!.nodes) p = finish(p, worldId, n.id, 3, now)
  return p
}

describe('initial state and unlocking', () => {
  it('starts with world 1 open', () => {
    const p = initialProgress('kid', T0)
    expect(p.childId).toBe('kid')
    expect(p.seasonId).toBe('s1')
    expect(p.worlds.w1.unlocked).toBe(true)
    expect(p.stars).toBe(0)
    expect(p.updatedAt).toBe(T0.toISOString())
    expect(isWorldUnlocked(p, 'w1')).toBe(true)
    expect(isWorldUnlocked(p, 'w2')).toBe(false)
    expect(isWorldUnlocked(p, 'w99')).toBe(false)
  })

  it('opens nodes one after another inside a world', () => {
    let p = initialProgress('kid', T0)
    const [n0, n1, n2] = season1.worlds[0].nodes
    expect(isNodeUnlocked(p, 'w1', n0.id)).toBe(true)
    expect(isNodeUnlocked(p, 'w1', n1.id)).toBe(false)
    p = finish(p, 'w1', n0.id)
    expect(isNodeUnlocked(p, 'w1', n1.id)).toBe(true)
    expect(isNodeUnlocked(p, 'w1', n2.id)).toBe(false)
    expect(isNodeUnlocked(p, 'w1', 'nope')).toBe(false)
    expect(isNodeUnlocked(p, 'w2', 'arrival')).toBe(false)
  })

  it('a node with 0 stars stays closed for the next one; passed:true lets the host move on', () => {
    let p = finish(initialProgress('kid', T0), 'w1', 'arrival')
    p = finish(p, 'w1', 'lesson-groups')
    const q = applyNodeResult(p, 'w1', 'groups', { stars: 0 }, T0)
    expect(q.worlds.w1.nodes.groups.done).toBe(false)
    expect(isNodeUnlocked(q, 'w1', 'array')).toBe(false)
    expect(q.stars).toBe(p.stars)
    const r = applyNodeResult(q, 'w1', 'groups', { stars: 0, passed: true }, T0)
    expect(r.worlds.w1.nodes.groups.done).toBe(true)
    expect(isNodeUnlocked(r, 'w1', 'array')).toBe(true)
  })

  it('the next world opens with the crystal, and then every node of the beaten world is open', () => {
    let p = initialProgress('kid', T0)
    p = playWorld(p, 'w1')
    expect(p.worlds.w1.crystal).toBe(true)
    expect(p.worlds.w1.letter).toBe('V')
    expect(p.worlds.w1.completedAt).toBe(T0.toISOString())
    expect(p.worlds.w2.unlocked).toBe(true)
    expect(isWorldUnlocked(p, 'w2')).toBe(true)
    expect(isNodeUnlocked(p, 'w2', 'arrival')).toBe(true)
    expect(isWorldUnlocked(p, 'w3')).toBe(false)
    for (const n of season1.worlds[0].nodes) expect(isNodeUnlocked(p, 'w1', n.id)).toBe(true)
  })
})

describe('applyNodeResult', () => {
  it('is pure', () => {
    const p = deepFreeze(initialProgress('kid', T0))
    const before = JSON.stringify(p)
    const q = applyNodeResult(p, 'w1', 'arrival', { stars: 0 }, T0)
    expect(JSON.stringify(p)).toBe(before)
    expect(q).not.toBe(p)
  })

  it('stories and lessons are worth the completion stars', () => {
    let p = applyNodeResult(initialProgress('kid', T0), 'w1', 'arrival', { stars: 0 }, T0)
    expect(p.worlds.w1.nodes.arrival).toMatchObject({ done: true, stars: COMPLETION_STARS })
    expect(p.stars).toBe(COMPLETION_STARS)
    p = applyNodeResult(p, 'w1', 'lesson-groups', { stars: 1 }, T0)
    expect(p.worlds.w1.nodes['lesson-groups'].stars).toBe(COMPLETION_STARS)
    expect(p.stars).toBe(2 * COMPLETION_STARS)
  })

  it('keeps the best stars and pays only for NEW stars (no farming)', () => {
    let p = finish(finish(initialProgress('kid', T0), 'w1', 'arrival'), 'w1', 'lesson-groups')
    const base = p.stars
    p = applyNodeResult(p, 'w1', 'groups', { stars: 2, ms: 90_000 }, T0)
    expect(p.stars).toBe(base + 2)
    p = applyNodeResult(p, 'w1', 'groups', { stars: 1, ms: 50_000 }, T0)
    expect(p.worlds.w1.nodes.groups.stars).toBe(2)
    expect(p.stars).toBe(base + 2)
    expect(p.worlds.w1.nodes.groups.bestMs).toBe(50_000)
    p = applyNodeResult(p, 'w1', 'groups', { stars: 3 }, T0)
    expect(p.stars).toBe(base + 3)
    for (let i = 0; i < 5; i++) p = applyNodeResult(p, 'w1', 'groups', { stars: 3 }, T0)
    expect(p.stars).toBe(base + 3)
    // stories cannot be farmed either
    const s = p.stars
    p = finish(p, 'w1', 'arrival')
    expect(p.stars).toBe(s)
  })

  it('clamps odd star values', () => {
    let p = finish(finish(initialProgress('kid', T0), 'w1', 'arrival'), 'w1', 'lesson-groups')
    const base = p.stars
    p = applyNodeResult(p, 'w1', 'groups', { stars: 7 }, T0)
    expect(p.worlds.w1.nodes.groups.stars).toBe(3)
    p = applyNodeResult(p, 'w1', 'array', { stars: Number.NaN }, T0)
    expect(p.worlds.w1.nodes.array.done).toBe(false)
    expect(p.stars).toBe(base + 3)
  })

  it('records completion time once, lastNode and the local day played', () => {
    let p = finish(initialProgress('kid', T0), 'w1', 'arrival', 3, T0)
    expect(p.worlds.w1.nodes.arrival.completedAt).toBe(T0.toISOString())
    expect(p.lastNode).toEqual({ worldId: 'w1', nodeId: 'arrival' })
    expect(p.daysPlayed).toEqual([localDay(T0)])
    p = finish(p, 'w1', 'arrival', 3, day(1))
    expect(p.worlds.w1.nodes.arrival.completedAt).toBe(T0.toISOString())
    expect(p.daysPlayed).toEqual([localDay(T0), localDay(day(1))])
    p = finish(p, 'w1', 'lesson-groups', 3, day(1))
    expect(p.daysPlayed).toHaveLength(2)
    expect(p.lastNode).toEqual({ worldId: 'w1', nodeId: 'lesson-groups' })
    expect(p.updatedAt).toBe(day(1).toISOString())
  })

  it('localDay uses the local calendar', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(localDay(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31')
  })

  it('guardians: failing keeps the crystal hidden, passing gives the content letter (not the caller\'s)', () => {
    let p = initialProgress('kid', T0)
    for (const n of season1.worlds[0].nodes.slice(0, -1)) p = finish(p, 'w1', n.id)
    const failed = applyNodeResult(p, 'w1', 'guardian', { stars: 2, passed: false }, T0)
    expect(failed.worlds.w1.crystal).toBe(false)
    expect(failed.worlds.w1.nodes.guardian.done).toBe(false)
    expect(failed.stars).toBe(p.stars)
    expect(isWorldUnlocked(failed, 'w2')).toBe(false)
    const won = applyNodeResult(failed, 'w1', 'guardian', { stars: 0, passed: true, letter: 'Z' }, T0)
    expect(won.worlds.w1.crystal).toBe(true)
    expect(won.worlds.w1.letter).toBe('V')
    expect(won.worlds.w1.nodes.guardian).toMatchObject({ done: true, stars: 1 })
    expect(won.worlds.w2).toMatchObject({ unlocked: true, crystal: false })
    // a letter alone counts as a pass; stars alone never do (a failed challenge can still score stars)
    const byLetter = applyNodeResult(p, 'w1', 'guardian', { stars: 0, letter: 'V' }, T0)
    expect(byLetter.worlds.w1.crystal).toBe(true)
    const starsOnly = applyNodeResult(p, 'w1', 'guardian', { stars: 2 }, T0)
    expect(starsOnly.worlds.w1.crystal).toBe(false)
    expect(starsOnly.worlds.w1.nodes.guardian.done).toBe(false)
    expect(starsOnly.stars).toBe(p.stars)
  })

  it('keeps personal race records, fastest first', () => {
    let p = initialProgress('kid', T0)
    for (let i = 1; i <= 5; i++) p = playWorld(p, `w${i}`)
    for (const n of season1.worlds[5].nodes) {
      if (n.id === 'race') break
      p = finish(p, 'w6', n.id)
    }
    for (const ms of [90_000, 80_000, 120_000, 70_000, 100_000, 95_000, 60_000]) p = applyNodeResult(p, 'w6', 'race', { stars: 2, ms }, T0)
    expect(p.worlds.w6.nodes.race.records).toEqual([60_000, 70_000, 80_000, 90_000, 95_000])
    expect(p.worlds.w6.nodes.race.bestMs).toBe(60_000)
    // non-race activities keep no records
    expect(p.worlds.w6.nodes.wheel.records).toBeUndefined()
  })

  it('ignores unknown worlds and nodes', () => {
    const p = initialProgress('kid', T0)
    expect(applyNodeResult(p, 'w1', 'nope', { stars: 3 }, T0)).toBe(p)
    expect(applyNodeResult(p, 'w42', 'arrival', { stars: 3 }, T0)).toBe(p)
  })

  it('awards stickers when their rule becomes true, exactly once', () => {
    let p = finish(finish(initialProgress('kid', T0), 'w1', 'arrival'), 'w1', 'lesson-groups')
    const q = finish(p, 'w1', 'groups', 1)
    expect(newStickers(p, q)).toEqual(['w1-seta'])
    p = q
    p = finish(p, 'w1', 'array', 2)
    expect(p.stickers).not.toContain('w1-flor')
    const r = finish(p, 'w1', 'array', 3)
    expect(newStickers(p, r)).toEqual(['w1-flor'])
    expect(finish(r, 'w1', 'array', 3).stickers.filter((s) => s === 'w1-flor')).toHaveLength(1)
  })

  it('awards the days sticker after 3 different days', () => {
    let p = initialProgress('kid', T0)
    p = finish(p, 'w1', 'arrival', 3, day(0))
    p = finish(p, 'w1', 'arrival', 3, day(0))
    p = finish(p, 'w1', 'arrival', 3, day(2))
    expect(p.stickers).not.toContain('dias-3')
    p = finish(p, 'w1', 'arrival', 3, day(5))
    expect(p.stickers).toContain('dias-3')
  })
})

describe('nextNode', () => {
  it('walks the whole season in order and ends with null, all letters spelling VALIENTE', () => {
    let p = initialProgress('kid', T0)
    expect(nextNode(p)).toEqual({ worldId: 'w1', nodeId: 'arrival' })
    let steps = 0
    for (let n = nextNode(p); n; n = nextNode(p)) {
      p = finish(p, n.worldId, n.nodeId)
      if (++steps > 200) throw new Error('loop')
    }
    expect(steps).toBe(season1.worlds.reduce((s, w) => s + w.nodes.length, 0))
    expect(crystalsOf(p)).toEqual(Array(8).fill(true))
    expect(lettersOf(p).join('')).toBe('VALIENTE')
    expect(p.diplomaEarnedAt).toBe(T0.toISOString())
    expect(p.stickers).toContain('lumi-brilla')
    expect(p.stickers.filter((id) => getSticker(id)?.worldId)).toHaveLength(24)
    // max currency = 3 stars per node
    expect(p.stars).toBe(3 * steps)
  })

  it('suggests the guardian again after a failed challenge', () => {
    let p = initialProgress('kid', T0)
    for (const n of season1.worlds[0].nodes.slice(0, -1)) p = finish(p, 'w1', n.id)
    p = applyNodeResult(p, 'w1', 'guardian', { stars: 0, passed: false }, T0)
    expect(nextNode(p)).toEqual({ worldId: 'w1', nodeId: 'guardian' })
  })

  it('a child who starts further ahead keeps going forward, but resumes where they last played', () => {
    let p = unlockThroughWorld(initialProgress('kid', T0), startingWorldForGrade(4), T0)
    expect(isWorldUnlocked(p, 'w2')).toBe(true)
    expect(isWorldUnlocked(p, 'w3')).toBe(true)
    expect(isWorldUnlocked(p, 'w4')).toBe(false)
    expect(nextNode(p)).toEqual({ worldId: 'w3', nodeId: 'arrival' })
    p = finish(p, 'w1', 'arrival')
    expect(nextNode(p)).toEqual({ worldId: 'w1', nodeId: 'lesson-groups' })
    p = finish(p, 'w3', 'arrival')
    expect(nextNode(p)).toEqual({ worldId: 'w3', nodeId: 'lesson-five' })
    p = playWorld(p, 'w3')
    expect(nextNode(p)).toEqual({ worldId: 'w4', nodeId: 'arrival' })
  })
})

describe('grade, letters and shop', () => {
  it('chooses a starting world by grade', () => {
    expect(startingWorldForGrade()).toBe('w1')
    expect(startingWorldForGrade(1)).toBe('w1')
    expect(startingWorldForGrade(2)).toBe('w1')
    expect(startingWorldForGrade(3)).toBe('w1')
    expect(startingWorldForGrade(4)).toBe('w3')
    expect(startingWorldForGrade(6)).toBe('w3')
  })

  it('lettersOf shows only won letters', () => {
    const p = playWorld(initialProgress('kid', T0), 'w1')
    expect(lettersOf(p)).toEqual(['V', null, null, null, null, null, null, null])
  })

  it('buys accessories with spendable stars, respecting world locks', () => {
    let p = initialProgress('kid', T0)
    expect(canBuyAccessory(p, 'lollipop')).toEqual({ ok: false, reason: 'stars' })
    expect(canBuyAccessory(p, 'nope')).toEqual({ ok: false, reason: 'unknown' })
    p = playWorld(p, 'w1')
    expect(canBuyAccessory(p, 'crown')).toEqual({ ok: false, reason: 'locked' })
    const before = spendableStars(p)
    const q = buyAccessory(p, 'flower-crown', T0)
    expect(q.accessoriesOwned).toEqual(['flower-crown'])
    expect(spendableStars(q)).toBe(before - getAccessory('flower-crown')!.price)
    expect(canBuyAccessory(q, 'flower-crown')).toEqual({ ok: false, reason: 'owned' })
    expect(buyAccessory(q, 'flower-crown', T0)).toBe(q)
    expect(buyAccessory(q, 'crown', T0)).toBe(q)
  })

  it('the whole shop is affordable with a full season of stars, but not after the first world', () => {
    let p = initialProgress('kid', T0)
    for (let n = nextNode(p); n; n = nextNode(p)) p = finish(p, n.worldId, n.nodeId)
    const total = ACCESSORY_IDS.reduce((s, id) => s + getAccessory(id)!.price, 0)
    expect(total).toBeLessThanOrEqual(p.stars)
    expect(total).toBeGreaterThan(p.stars * 0.6)
  })
})
