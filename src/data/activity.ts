/* Attempts (append-only log of answered exercises) and play sessions. */
import Dexie from 'dexie'
import type { AttemptRecord, SessionRecord } from '@/types'
import { db } from './db'
import { DataError } from './errors'
import { isErasedChild } from './erasure'
import { publicSession } from './mappers'
import { enqueue } from './outbox'
import { updateProgress } from './progress'
import type { SessionRow } from './types'
import { localDay, nextTimestamp, nowIso, uuid } from './util'

// ------------------------------------------------------------------------------------------------ attempts

export async function recordAttempt(attempt: AttemptRecord): Promise<void> {
  if (!attempt?.childId) throw new DataError('invalid', 'recordAttempt: childId is required')
  const row: AttemptRecord = { ...attempt, id: attempt.id || uuid(), createdAt: attempt.createdAt || nowIso() }
  await db.transaction('rw', [db.attempts, db.children, db.outbox, db.meta], async () => {
    if (await isErasedChild(row.childId)) return // erased child: nothing is kept on this device
    await db.attempts.put(row)
    await enqueue('attempts', row.id, row.childId)
  })
}

/** Newest first. `since` is inclusive (ISO date). */
export async function listAttempts(childId: string, opts: { since?: string; limit?: number } = {}): Promise<AttemptRecord[]> {
  let coll = db.attempts
    .where('[childId+createdAt]')
    .between([childId, opts.since ?? Dexie.minKey], [childId, Dexie.maxKey], true, true)
    .reverse()
  if (opts.limit && opts.limit > 0) coll = coll.limit(opts.limit)
  return coll.toArray()
}

// ------------------------------------------------------------------------------------------------ sessions

/** Active-time bookkeeping: time between touches counts, capped, and hidden-tab time never counts. */
const MAX_GAIN_MS = 10 * 60_000
const lastTouch = new Map<string, number>()

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const now = Date.now()
      for (const id of lastTouch.keys()) lastTouch.set(id, now)
    }
  })
}

function activeMinutes(row: SessionRow, explicit: number | undefined): number {
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return Math.max(row.minutes, explicit)
  if (row.endedAt) return row.minutes
  const now = Date.now()
  const from = lastTouch.get(row.id) ?? Date.parse(row.startedAt)
  const gain = Math.min(MAX_GAIN_MS, Math.max(0, now - from))
  lastTouch.set(row.id, now)
  return Math.round((row.minutes + gain / 60_000) * 100) / 100
}

export async function startSession(childId: string): Promise<SessionRecord> {
  const now = nowIso()
  const row: SessionRow = { id: uuid(), childId, startedAt: now, endedAt: null, minutes: 0, summary: null, updatedAt: now }
  const erased = await db.transaction('rw', [db.sessions, db.children, db.outbox, db.meta], async () => {
    if (await isErasedChild(childId)) return true // erased child: the session is not kept
    await db.sessions.add(row)
    await enqueue('sessions', row.id, childId)
    return false
  })
  if (erased) return publicSession(row)
  lastTouch.set(row.id, Date.now())
  // Gentle streak display: remember the day (local time) the child played.
  const child = await db.children.get(childId)
  if (child) {
    const today = localDay()
    const p = await db.progress.get(childId)
    if (!p?.daysPlayed?.includes(today)) {
      await updateProgress(childId, (s) => ({ ...s, daysPlayed: [...new Set([...(s.daysPlayed ?? []), today])].sort() }))
    }
  }
  return publicSession(row)
}

/** Call on activity end / visibility hidden; idempotent. Minutes only grow: pass `minutes` to set the active time
 *  explicitly, otherwise the time since the previous touch is added (max 10 min per touch). */
export async function touchSession(sessionId: string, patch: Partial<SessionRecord>): Promise<void> {
  await db.transaction('rw', [db.sessions, db.children, db.outbox], async () => {
    const cur = await db.sessions.get(sessionId)
    if (!cur) return
    const next: SessionRow = {
      ...cur,
      minutes: activeMinutes(cur, patch.minutes),
      endedAt: cur.endedAt ?? patch.endedAt ?? null,
      summary: patch.summary !== undefined ? patch.summary : cur.summary,
      updatedAt: nextTimestamp(cur.updatedAt),
    }
    await db.sessions.put(next)
    await enqueue('sessions', sessionId, cur.childId)
  })
}

export async function endSession(sessionId: string, summary: SessionRecord['summary']): Promise<void> {
  await db.transaction('rw', [db.sessions, db.children, db.outbox], async () => {
    const cur = await db.sessions.get(sessionId)
    if (!cur) return
    const next: SessionRow = {
      ...cur,
      minutes: activeMinutes(cur, undefined),
      endedAt: cur.endedAt ?? nowIso(),
      summary: summary ?? cur.summary,
      updatedAt: nextTimestamp(cur.updatedAt),
    }
    await db.sessions.put(next)
    await enqueue('sessions', sessionId, cur.childId)
  })
  lastTouch.delete(sessionId)
}

/** Newest first. `since` filters on startedAt (inclusive). */
export async function listSessions(childId: string, opts: { since?: string } = {}): Promise<SessionRecord[]> {
  const rows = await db.sessions
    .where('[childId+startedAt]')
    .between([childId, opts.since ?? Dexie.minKey], [childId, Dexie.maxKey], true, true)
    .reverse()
    .toArray()
  return rows.map(publicSession)
}
