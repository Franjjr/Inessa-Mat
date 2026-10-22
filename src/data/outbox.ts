/* Outbox of pending pushes. Must be called inside a Dexie 'rw' transaction that includes db.outbox and db.children
   (so the enqueue commits atomically with the local write). Children that are local-only (orgId null) are not
   enqueued: claimLocalData() enqueues all of their data at once when the adult attaches them to an account. */
import { db } from './db'
import type { OutboxEntry, SyncTable } from './types'
import { nowIso } from './util'

type Listener = () => void
const listeners = new Set<Listener>()

/** Called (after commit) whenever something was enqueued: the sync engine schedules a debounced flush. */
export function onEnqueued(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

let notifyTimer: ReturnType<typeof setTimeout> | null = null

function notify() {
  // after the surrounding transaction has had a chance to commit; coalesced
  if (notifyTimer) return
  notifyTimer = setTimeout(() => {
    notifyTimer = null
    for (const l of [...listeners]) l()
  }, 0)
}

export async function enqueue(table: SyncTable, key: string, childId: string, opts: { force?: boolean } = {}): Promise<void> {
  if (!opts.force) {
    const child = await db.children.get(childId)
    if (!child || child.orgId === null) return
  }
  const existing = await db.outbox.where('[table+key]').equals([table, key]).first()
  if (existing) {
    await db.outbox.update(existing.seq!, { rev: existing.rev + 1, tries: 0, nextTryAt: 0, dead: false, lastError: null })
  } else {
    const entry: OutboxEntry = { table, key, childId, rev: 0, createdAt: nowIso(), tries: 0, nextTryAt: 0, lastError: null, dead: false }
    await db.outbox.add(entry)
  }
  notify()
}

/** Bulk enqueue (claimLocalData). Same transaction requirements as enqueue. */
export async function enqueueMany(items: { table: SyncTable; key: string; childId: string }[]): Promise<void> {
  if (!items.length) return
  const existing = await db.outbox.where('[table+key]').anyOf(items.map((i) => [i.table, i.key])).toArray()
  const byKey = new Map(existing.map((e) => [`${e.table}\u0000${e.key}`, e]))
  const now = nowIso()
  const fresh: OutboxEntry[] = []
  for (const it of items) {
    const k = `${it.table}\u0000${it.key}`
    const cur = byKey.get(k)
    if (cur) {
      if (cur.seq === undefined) continue // duplicate item in this call
      await db.outbox.update(cur.seq, { rev: cur.rev + 1, tries: 0, nextTryAt: 0, dead: false, lastError: null })
    } else {
      fresh.push({ table: it.table, key: it.key, childId: it.childId, rev: 0, createdAt: now, tries: 0, nextTryAt: 0, lastError: null, dead: false })
      byKey.set(k, fresh[fresh.length - 1])
    }
  }
  if (fresh.length) await db.outbox.bulkAdd(fresh)
  notify()
}

export function masteryKey(childId: string, skill: string): string {
  return `${childId}|${skill}`
}

export function parseMasteryKey(key: string): [string, string] {
  const i = key.indexOf('|')
  return [key.slice(0, i), key.slice(i + 1)]
}

/** Delete the entry if it was not re-enqueued while the push was in flight. */
export async function ackEntry(entry: OutboxEntry): Promise<void> {
  await db.transaction('rw', db.outbox, async () => {
    const cur = await db.outbox.get(entry.seq!)
    if (cur && cur.rev === entry.rev) await db.outbox.delete(entry.seq!)
  })
}

export const MAX_ENTRY_TRIES = 6

/** A rejected write (permission/validation): back off this entry; after MAX_ENTRY_TRIES mark it dead. */
export async function failEntry(entry: OutboxEntry, error: string): Promise<void> {
  await db.transaction('rw', db.outbox, async () => {
    const cur = await db.outbox.get(entry.seq!)
    if (!cur) return
    const tries = cur.tries + 1
    const delay = Math.min(60 * 60_000, 30_000 * 2 ** (tries - 1))
    await db.outbox.update(cur.seq!, { tries, nextTryAt: Date.now() + delay, lastError: error, dead: tries >= MAX_ENTRY_TRIES })
  })
}

export async function pendingCount(): Promise<number> {
  return db.outbox.filter((e) => !e.dead).count()
}
