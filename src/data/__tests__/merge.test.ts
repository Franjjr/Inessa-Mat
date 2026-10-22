import { describe, expect, it } from 'vitest'
import type { NodeProgress, ProgressState, WorldProgress } from '@/types'
import { lww, mergeProgress, normalizeProgress } from '../merge'
import { deepEqual } from '../util'
import { rng } from './helpers'

const WORLDS = ['w1', 'w2', 'w3']
const NODES = ['n1', 'n2', 'n3', 'n4']
const STICKERS = ['s-forest', 's-river', 's-cave', 's-owl', 's-frog', 's-star']
const ACCESSORIES = ['hat', 'scarf', 'glasses', 'cape']
const DAYS = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-05', '2026-03-08']
const LETTERS = ['V', 'A', 'L']

function pick<T>(r: () => number, xs: T[]): T {
  return xs[Math.floor(r() * xs.length)]
}

function subset<T>(r: () => number, xs: T[]): T[] {
  return xs.filter(() => r() < 0.4).sort(() => r() - 0.5)
}

function date(r: () => number): string {
  return new Date(Date.parse('2026-03-01T10:00:00.000Z') + Math.floor(r() * 30) * 3_600_000).toISOString()
}

function randomNode(r: () => number): NodeProgress {
  const n: NodeProgress = { done: r() < 0.5, stars: Math.floor(r() * 4) }
  if (r() < 0.5) n.bestMs = 1000 + Math.floor(r() * 9000)
  if (r() < 0.4) n.completedAt = date(r)
  if (r() < 0.3) n.records = Array.from({ length: Math.floor(r() * 7) }, () => 1000 + Math.floor(r() * 5000))
  return n
}

function randomWorld(r: () => number): WorldProgress {
  const nodes: Record<string, NodeProgress> = {}
  for (const id of NODES) if (r() < 0.5) nodes[id] = randomNode(r)
  const w: WorldProgress = { unlocked: r() < 0.6, crystal: r() < 0.3, nodes }
  if (r() < 0.4) w.letter = pick(r, LETTERS)
  if (r() < 0.3) w.completedAt = date(r)
  return w
}

function randomState(r: () => number): ProgressState {
  const worlds: Record<string, WorldProgress> = {}
  for (const id of WORLDS) if (r() < 0.7) worlds[id] = randomWorld(r)
  const stars = Math.floor(r() * 60)
  const s: ProgressState = {
    childId: 'child-1',
    seasonId: 's1',
    worlds,
    stars,
    starsSpent: Math.floor(r() * stars),
    stickers: subset(r, STICKERS),
    accessoriesOwned: subset(r, ACCESSORIES),
    chestOpened: r() < 0.2,
    daysPlayed: subset(r, DAYS),
    flags: Object.fromEntries(subset(r, ['calibration', 'prologue', 'tutorial']).map((k) => [k, r() < 0.7])),
    updatedAt: date(r),
  }
  if (r() < 0.2) s.diplomaEarnedAt = date(r)
  if (r() < 0.6) s.lastNode = { worldId: pick(r, WORLDS), nodeId: pick(r, NODES) }
  return s
}

const RUNS = 300

function withoutLastNode(s: ProgressState): ProgressState {
  const { lastNode: _ln, ...rest } = s
  return rest as ProgressState
}

describe('mergeProgress (property tests)', () => {
  it('is commutative', () => {
    const r = rng(1)
    for (let i = 0; i < RUNS; i++) {
      const a = randomState(r)
      const b = randomState(r)
      expect(deepEqual(mergeProgress(a, b), mergeProgress(b, a))).toBe(true)
    }
  })

  it('is idempotent', () => {
    const r = rng(2)
    for (let i = 0; i < RUNS; i++) {
      const a = randomState(r)
      const b = randomState(r)
      const m = mergeProgress(a, b)
      expect(mergeProgress(m, m)).toEqual(m)
      expect(mergeProgress(normalizeProgress(a), a)).toEqual(normalizeProgress(a))
      // absorption: merging again with an input changes nothing
      expect(mergeProgress(m, a)).toEqual(m)
      expect(mergeProgress(b, m)).toEqual(m)
    }
  })

  it('is associative (lastNode is a resume hint and excluded)', () => {
    const r = rng(3)
    for (let i = 0; i < RUNS; i++) {
      const a = randomState(r)
      const b = randomState(r)
      const c = randomState(r)
      const left = mergeProgress(mergeProgress(a, b), c)
      const right = mergeProgress(a, mergeProgress(b, c))
      expect(withoutLastNode(left)).toEqual(withoutLastNode(right))
    }
  })

  it('is monotonic: nothing earned on either side is ever lost', () => {
    const r = rng(4)
    for (let i = 0; i < RUNS; i++) {
      const a = randomState(r)
      const b = randomState(r)
      const m = mergeProgress(a, b)
      for (const side of [a, b]) {
        expect(m.stars).toBeGreaterThanOrEqual(side.stars)
        expect(m.starsSpent).toBeGreaterThanOrEqual(side.starsSpent)
        for (const s of side.stickers) expect(m.stickers).toContain(s)
        for (const s of side.accessoriesOwned) expect(m.accessoriesOwned).toContain(s)
        for (const d of side.daysPlayed) expect(m.daysPlayed).toContain(d)
        if (side.chestOpened) expect(m.chestOpened).toBe(true)
        if (side.diplomaEarnedAt) expect(m.diplomaEarnedAt).toBeDefined()
        for (const [k, v] of Object.entries(side.flags)) if (v) expect(m.flags[k]).toBe(true)
        expect(Date.parse(m.updatedAt)).toBeGreaterThanOrEqual(Date.parse(side.updatedAt))
        for (const [wid, w] of Object.entries(side.worlds)) {
          const mw = m.worlds[wid]
          expect(mw).toBeDefined()
          if (w.unlocked) expect(mw.unlocked).toBe(true)
          if (w.crystal) expect(mw.crystal).toBe(true)
          if (w.letter) expect(mw.letter).toBeTruthy()
          for (const [nid, n] of Object.entries(w.nodes)) {
            const mn = mw.nodes[nid]
            expect(mn).toBeDefined()
            if (n.done) expect(mn.done).toBe(true)
            expect(mn.stars).toBeGreaterThanOrEqual(Math.min(3, n.stars))
            if (n.bestMs !== undefined) expect(mn.bestMs).toBeLessThanOrEqual(n.bestMs)
            if (n.completedAt) expect(Date.parse(mn.completedAt!)).toBeLessThanOrEqual(Date.parse(n.completedAt))
          }
        }
      }
    }
  })
})

describe('mergeProgress (examples)', () => {
  const base: ProgressState = {
    childId: 'c', seasonId: 's1', worlds: { w1: { unlocked: true, nodes: {}, crystal: false } }, stars: 10, starsSpent: 0,
    stickers: [], accessoriesOwned: [], chestOpened: false, daysPlayed: [], flags: {}, updatedAt: '2026-03-01T10:00:00.000Z',
  }

  it('combines what an iPad and an Android tablet earned offline', () => {
    const ipad: ProgressState = {
      ...base,
      worlds: { w1: { unlocked: true, crystal: true, letter: 'V', nodes: { n1: { done: true, stars: 3, bestMs: 4000 } } }, w2: { unlocked: true, nodes: {}, crystal: false } },
      stars: 25, stickers: ['s-owl'], daysPlayed: ['2026-03-02'], lastNode: { worldId: 'w2', nodeId: 'n1' }, updatedAt: '2026-03-02T18:00:00.000Z',
    }
    const android: ProgressState = {
      ...base,
      worlds: { w1: { unlocked: true, crystal: false, nodes: { n1: { done: true, stars: 2, bestMs: 3500 }, n2: { done: true, stars: 1 } } } },
      stars: 14, starsSpent: 5, accessoriesOwned: ['hat'], stickers: ['s-forest'], daysPlayed: ['2026-03-01'], updatedAt: '2026-03-01T17:00:00.000Z',
    }
    const m = mergeProgress(ipad, android)
    expect(m.worlds.w1).toEqual({ unlocked: true, crystal: true, letter: 'V', nodes: { n1: { done: true, stars: 3, bestMs: 3500 }, n2: { done: true, stars: 1 } } })
    expect(m.worlds.w2.unlocked).toBe(true)
    expect(m.stars).toBe(25)
    expect(m.starsSpent).toBe(5)
    expect(m.stickers).toEqual(['s-forest', 's-owl'])
    expect(m.accessoriesOwned).toEqual(['hat'])
    expect(m.daysPlayed).toEqual(['2026-03-01', '2026-03-02'])
    expect(m.lastNode).toEqual({ worldId: 'w2', nodeId: 'n1' }) // from the most recent device
    expect(m.updatedAt).toBe('2026-03-02T18:00:00.000Z')
  })

  it('keeps only the best race records', () => {
    const a = { ...base, worlds: { w1: { unlocked: true, crystal: false, nodes: { r: { done: true, stars: 2, records: [9000, 8000, 7000] } } } } }
    const b = { ...base, worlds: { w1: { unlocked: true, crystal: false, nodes: { r: { done: true, stars: 2, records: [6000, 8000, 10000, 11000, 12000] } } } } }
    const recs = mergeProgress(a, b).worlds.w1.nodes.r.records!
    expect(recs).toEqual([6000, 7000, 8000, 9000, 10000].slice(0, recs.length))
    expect(recs.length).toBeLessThanOrEqual(10)
    expect(recs[0]).toBe(6000)
  })

  it('never lets stars exceed 3 per node', () => {
    const a = { ...base, worlds: { w1: { unlocked: true, crystal: false, nodes: { n: { done: true, stars: 7 } } } } }
    expect(mergeProgress(a, base).worlds.w1.nodes.n.stars).toBe(3)
  })
})

describe('lww', () => {
  it('keeps the later edit and is commutative on ties', () => {
    const a = { id: 1, v: 'a', updatedAt: '2026-01-01T00:00:00.000Z' }
    const b = { id: 1, v: 'b', updatedAt: '2026-01-02T00:00:00.000Z' }
    expect(lww(a, b)).toBe(b)
    expect(lww(b, a)).toBe(b)
    const c = { id: 1, v: 'c', updatedAt: b.updatedAt }
    expect(lww(b, c)).toEqual(lww(c, b))
    expect(lww(undefined, a)).toBe(a)
  })
})
