/* Real-world rewards promised by the family (the Gran Cofre) and handwriting samples (device only). */
import type { InkSample, Reward } from '@/types'
import { db } from './db'
import { DataError } from './errors'
import { isErasedChild } from './erasure'
import { publicReward } from './mappers'
import { enqueue } from './outbox'
import { getAuth } from './store'
import type { RewardRow } from './types'
import { nextTimestamp, nowIso, uuid } from './util'

// ------------------------------------------------------------------------------------------------ rewards

export async function getRewards(childId: string): Promise<Reward[]> {
  const rows = await db.rewards.where('childId').equals(childId).toArray()
  return rows.sort((a, b) => (a.kind === b.kind ? a.title.localeCompare(b.title, 'es') : a.kind === 'chest' ? -1 : 1)).map(publicReward)
}

/** Creates or replaces the chest reward of a child (one per child). */
export async function setChestReward(childId: string, title: string, description?: string): Promise<Reward> {
  const t = String(title ?? '').trim()
  if (!t) throw new DataError('invalid', 'Escribe cuál será el premio.')
  if (t.length > 120) throw new DataError('invalid', 'El premio es demasiado largo (máximo 120 letras).')
  const d = description?.trim() ? description.trim().slice(0, 500) : null
  return db.transaction('rw', [db.rewards, db.children, db.outbox, db.meta], async () => {
    if (await isErasedChild(childId)) throw new DataError('not-found', 'No encontramos ese perfil.')
    const existing = (await db.rewards.where('childId').equals(childId).toArray()).find((r) => r.kind === 'chest')
    const row: RewardRow = existing
      ? { ...existing, title: t, description: d, updatedAt: nextTimestamp(existing.updatedAt) }
      : {
          id: uuid(), childId, kind: 'chest', worldId: null, title: t, description: d,
          createdBy: getAuth().user?.id ?? null, unlockedAt: null, claimedAt: null, updatedAt: nowIso(),
        }
    await db.rewards.put(row)
    await enqueue('rewards', row.id, childId)
    return publicReward(row)
  })
}

async function patchReward(rewardId: string, patch: (r: RewardRow) => Partial<RewardRow> | null): Promise<void> {
  await db.transaction('rw', [db.rewards, db.children, db.outbox], async () => {
    const cur = await db.rewards.get(rewardId)
    if (!cur) throw new DataError('not-found', 'No encontramos ese premio.')
    const p = patch(cur)
    if (!p) return
    await db.rewards.put({ ...cur, ...p, updatedAt: nextTimestamp(cur.updatedAt) })
    await enqueue('rewards', rewardId, cur.childId)
  })
}

export async function markRewardUnlocked(rewardId: string): Promise<void> {
  await patchReward(rewardId, (r) => (r.unlockedAt ? null : { unlockedAt: nowIso() }))
}

export async function markRewardClaimed(rewardId: string): Promise<void> {
  await patchReward(rewardId, (r) => (r.claimedAt ? null : { claimedAt: nowIso(), unlockedAt: r.unlockedAt ?? nowIso() }))
}

// ------------------------------------------------------------------------------------------------ handwriting samples

/** Max samples kept per child and digit (oldest non-calibration samples are pruned first). */
export const MAX_INK_SAMPLES_PER_DIGIT = 60

export async function addInkSample(sample: InkSample): Promise<void> {
  if (!sample?.childId || !Number.isInteger(sample.digit) || sample.digit < 0 || sample.digit > 9) {
    throw new DataError('invalid', 'addInkSample: invalid sample')
  }
  const row: InkSample = { ...sample, id: sample.id || uuid(), createdAt: sample.createdAt || nowIso() }
  await db.transaction('rw', [db.inkSamples, db.meta], async () => {
    if (await isErasedChild(row.childId)) return // handwriting of an erased child is never kept
    await db.inkSamples.put(row)
    const same = await db.inkSamples.where('[childId+digit]').equals([row.childId, row.digit]).toArray()
    const excess = same.length - MAX_INK_SAMPLES_PER_DIGIT
    if (excess > 0) {
      const ordered = same.sort((a, b) => {
        const ca = a.source === 'calibration' ? 1 : 0
        const cb = b.source === 'calibration' ? 1 : 0
        return ca - cb || a.createdAt.localeCompare(b.createdAt)
      })
      await db.inkSamples.bulkDelete(ordered.slice(0, excess).map((s) => s.id))
    }
  })
}

/** Oldest first. */
export async function listInkSamples(childId: string): Promise<InkSample[]> {
  const rows = await db.inkSamples.where('childId').equals(childId).toArray()
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function clearInkSamples(childId: string): Promise<void> {
  await db.inkSamples.where('childId').equals(childId).delete()
}
