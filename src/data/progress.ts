/* Game progress (one ProgressState per child) and Leitner mastery per skill. */
import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { initialProgress } from '@/content'
import type { MasteryMap, ProgressState, SkillMastery } from '@/types'
import { db } from './db'
import { DataError } from './errors'
import { isErasedChild } from './erasure'
import { publicMastery } from './mappers'
import { enqueue, masteryKey } from './outbox'
import type { MasteryRow } from './types'
import { isAfter, nextTimestamp, nowIso } from './util'

// ------------------------------------------------------------------------------------------------ progress

/** Progress of a child; created (world 1 unlocked, via @/content initialProgress) on first read. */
export async function getProgress(childId: string): Promise<ProgressState> {
  const existing = await db.progress.get(childId)
  if (existing) return existing
  return db.transaction('rw', [db.progress, db.children, db.outbox], async () => {
    const again = await db.progress.get(childId)
    if (again) return again
    const fresh = initialProgress(childId)
    const child = await db.children.get(childId)
    if (!child) return fresh // not a child of this device (e.g. a teacher's view): don't persist
    await db.progress.put(fresh)
    await enqueue('progress', childId, childId)
    return fresh
  })
}

/** Atomic read-modify-write; the updater must be pure. `updatedAt` is maintained here.
 *  Never decrease `stars` (it is the total earned): record spending in `starsSpent`. Merges across devices derive the
 *  totals from the merged facts (see merge.ts), so both counters add up what each device earned or bought offline.
 *  Erased children store nothing. */
export async function updateProgress(childId: string, updater: (s: ProgressState) => ProgressState): Promise<ProgressState> {
  return db.transaction('rw', [db.progress, db.children, db.outbox, db.meta], async () => {
    const cur = (await db.progress.get(childId)) ?? initialProgress(childId)
    if (await isErasedChild(childId)) return cur
    const draft = structuredClone(cur)
    const result = updater(draft)
    if (!result || typeof result !== 'object') throw new DataError('invalid', 'updateProgress: the updater must return a ProgressState')
    const next: ProgressState = { ...result, childId, updatedAt: nextTimestamp(cur.updatedAt) }
    await db.progress.put(next)
    await enqueue('progress', childId, childId)
    return next
  })
}

/** Live progress; undefined while loading. Creates the initial progress the first time. */
export function useProgress(childId: string | null | undefined): ProgressState | undefined {
  const p = useLiveQuery(async () => (childId ? ((await db.progress.get(childId)) ?? null) : undefined), [childId])
  useEffect(() => {
    if (childId && p === null) void getProgress(childId)
  }, [childId, p])
  return p ?? undefined
}

// ------------------------------------------------------------------------------------------------ mastery

export async function getMastery(childId: string): Promise<MasteryMap> {
  const rows = await db.mastery.where('childId').equals(childId).toArray()
  const map: MasteryMap = {}
  for (const r of rows) map[r.skill] = publicMastery(r)
  return map
}

export async function saveMastery(childId: string, items: SkillMastery[]): Promise<void> {
  if (!items.length) return
  await db.transaction('rw', [db.mastery, db.children, db.outbox, db.meta], async () => {
    if (await isErasedChild(childId)) return
    for (const item of items) {
      if (!item?.skill) continue
      const prev = await db.mastery.get([childId, item.skill])
      // Each local save must win over what the server has: keep updatedAt strictly increasing per row.
      const updatedAt = prev && !isAfter(item.updatedAt, prev.updatedAt) ? nextTimestamp(prev.updatedAt) : (item.updatedAt || nowIso())
      const row: MasteryRow = { ...item, childId, updatedAt }
      await db.mastery.put(row)
      await enqueue('mastery', masteryKey(childId, item.skill), childId)
    }
  })
}

/** Live mastery map; undefined while loading or without a child. */
export function useMastery(childId: string | null | undefined): MasteryMap | undefined {
  return useLiveQuery(async () => (childId ? getMastery(childId) : undefined), [childId])
}
