/* Device-local key/value settings stored in the Dexie `meta` table. */
import { db } from './db'

export const META = {
  activeChildId: 'activeChildId',
  /** 'local-only' once the adult chose "usar sin cuenta" on this device. */
  mode: 'mode',
  adultPin: 'adultPin',
  lastSyncedAt: 'sync.lastSyncedAt',
  lastUserId: 'auth.lastUserId',
  activeOrg: (userId: string) => `auth.activeOrg:${userId}`,
  authCache: (userId: string) => `auth.cache:${userId}`,
  cursor: (orgId: string, table: string) => `sync.cursor:${orgId}:${table}`,
  progressVersion: (childId: string) => `sync.progressVersion:${childId}`,
  assignmentsCache: (childId: string) => `cache.assignments:${childId}`,
} as const

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await db.meta.get(key)
  return row?.value as T | undefined
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value })
}

export async function deleteMeta(key: string): Promise<void> {
  await db.meta.delete(key)
}
