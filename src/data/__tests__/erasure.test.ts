import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AttemptRecord } from '@/types'
import { createChild, eraseChild, exportChildData, listChildren, recordAttempt, startSession, updateChild, updateProgress } from '@/data'
import { db } from '../db'
import { META, getMeta } from '../meta'
import { runSync } from '../sync'
import { FakeSupabase } from './fakeSupabase'
import { LUNA, org, resetAll, signIn } from './helpers'

let fake: FakeSupabase
const FAM = org('fam-a')

beforeEach(async () => {
  fake = new FakeSupabase()
  await resetAll(fake)
  signIn('u1', [FAM])
})

afterEach(() => {
  vi.restoreAllMocks()
})

const attempt = (childId: string, over: Partial<AttemptRecord> = {}): AttemptRecord => ({
  id: crypto.randomUUID(), childId, sessionId: null, skill: 'mul:6x7', kind: 'fact-mul', correct: true, given: '42',
  expected: '42', ms: 3200, inputMode: 'pen', hintsUsed: 0, errorType: null, context: {},
  createdAt: new Date().toISOString(), ...over,
})

/** What the server does when a family member erases a child (0002 erase_child): data gone, tombstone kept. */
function serverErase(childId: string): void {
  for (const t of ['children', 'progress', 'skill_mastery', 'attempts', 'sessions', 'rewards']) {
    fake.tables[t] = fake.rows(t).filter((r) => String(r.id ?? r.child_id) !== childId && String(r.child_id) !== childId)
  }
  fake.rows('erased_children').push({ child_id: childId, org_id: 'fam-a', erased_at: new Date().toISOString() })
}

describe('GDPR erasure on another family device (security-2, sync-3)', () => {
  it('drops the child, its learning data and its queued changes on pull, and never pushes them again', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await recordAttempt(attempt(c.id))
    await runSync({ pull: false }) // the server has the child and the attempt
    expect(fake.rows('children')).toHaveLength(1)

    // Meanwhile the other adult erased her on the server.
    serverErase(c.id)
    // This device still has changes queued for her: a rename and a new attempt.
    await updateChild(c.id, { nickname: 'Ine' })
    await recordAttempt(attempt(c.id))

    await runSync({ pull: true })

    expect(await db.children.get(c.id)).toBeUndefined()
    expect(await db.attempts.where('childId').equals(c.id).count()).toBe(0)
    expect(await db.progress.get(c.id)).toBeUndefined()
    expect(await db.outbox.count()).toBe(0)
    expect(await listChildren()).toEqual([])
    expect(await getMeta(META.erased(c.id))).toBe(true)
    // no resurrection on the server, and no learning data re-uploaded for her
    expect(fake.rows('children')).toEqual([])
    expect(fake.rows('attempts')).toEqual([])
    expect(fake.rows('progress')).toEqual([])
  })

  it('a later sync never brings the erased child back, even if the server row reappears in a pull', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await runSync({ pull: false })
    serverErase(c.id)
    await runSync({ pull: true })
    // a stale copy of the row arrives later through the children pull
    fake.rows('children').push({
      id: c.id, org_id: 'fam-a', nickname: 'Vieja', gender: 'f', birth_year: null, grade: null, companion: {}, settings: {},
      created_at: '2026-01-01T10:00:00+00:00', updated_at: new Date(Date.now() + 60_000).toISOString(), deleted_at: null, synced_at: fake.serverNow(),
    })
    await runSync({ pull: true })
    expect(await db.children.get(c.id)).toBeUndefined()
    expect(await listChildren()).toEqual([])
  })

  it('the adult who erases a child on this device gets the same clean result, and the marker stays', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await recordAttempt(attempt(c.id))
    await runSync({ pull: false })
    fake.rpcs.erase_child = (args) => {
      serverErase(String(args.p_child_id))
      return { data: null, error: null }
    }
    await eraseChild(c.id)
    expect(fake.calls.some((x) => x.op === 'rpc' && x.table === 'erase_child')).toBe(true)
    expect(await db.children.get(c.id)).toBeUndefined()
    expect(await db.attempts.where('childId').equals(c.id).count()).toBe(0)
    expect(await getMeta(META.erased(c.id))).toBe(true)
    expect(fake.rows('erased_children').map((r) => r.child_id)).toEqual([c.id])
  })

  it('a device that already knows about the erasure stores nothing new for the child', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await runSync({ pull: false })
    serverErase(c.id)
    await runSync({ pull: true })
    await recordAttempt(attempt(c.id)) // a game still answering a question for her
    await updateProgress(c.id, (p) => ({ ...p, stars: 9 }))
    await startSession(c.id).catch(() => undefined)
    expect(await db.attempts.where('childId').equals(c.id).count()).toBe(0)
    expect(await db.progress.get(c.id)).toBeUndefined()
    expect(await db.sessions.where('childId').equals(c.id).count()).toBe(0)
    expect(await db.outbox.count()).toBe(0)
  })
})

describe('GDPR export includes the cloud copy (security-3)', () => {
  const OLD = '2025-01-01T10:00:00.000Z' // older than the 90-day first-pull window: only the server has it

  async function setupWithCloudHistory() {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await recordAttempt(attempt(c.id))
    await runSync({ pull: false })
    fake.rows('attempts').push({
      id: crypto.randomUUID(), child_id: c.id, session_id: null, skill: 'mul:2x2', kind: 'fact-mul', correct: true, given: '4', expected: '4',
      ms: 1000, input_mode: 'pen', hints_used: 0, error_type: null, recognition_fixes: 0, context: {}, created_at: OLD, synced_at: fake.serverNow(),
    })
    return c
  }

  it('signed in and online: the file holds the full cloud history and says so', async () => {
    const c = await setupWithCloudHistory()
    const doc = JSON.parse(await (await exportChildData(c.id)).text())
    expect(doc.source).toBe('device+cloud')
    expect(doc.cloud.included).toBe(true)
    expect(doc.attempts.map((a: AttemptRecord) => a.createdAt)).toContain(OLD)
    expect(doc.attempts).toHaveLength(2)
    expect(doc.notice).toMatch(/nube/)
  })

  it('offline: the file says plainly that it only holds this device, and does not claim the cloud copy is included', async () => {
    const c = await setupWithCloudHistory()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const doc = JSON.parse(await (await exportChildData(c.id)).text())
    expect(doc.source).toBe('device')
    expect(doc.cloud.included).toBe(false)
    expect(doc.attempts.map((a: AttemptRecord) => a.createdAt)).not.toContain(OLD)
    expect(doc.notice).toContain('ESTE dispositivo')
    expect(doc.notice).not.toMatch(/contiene los mismos datos/)
  })

  it('a cloud read that fails falls back to the device copy with an honest note', async () => {
    const c = await setupWithCloudHistory()
    fake.fail = (call) => (call.table === 'attempts' ? { message: 'boom', code: 'XX000' } : null)
    const doc = JSON.parse(await (await exportChildData(c.id)).text())
    expect(doc.cloud.included).toBe(false)
    expect(doc.notice).toContain('ESTE dispositivo')
  })

  it('a child that only exists on this device says it has no cloud copy', async () => {
    signIn('u1', []) // no organization: the child is local-only
    const c = await createChild({ nickname: 'Solo', gender: 'm', companion: LUNA })
    const doc = JSON.parse(await (await exportChildData(c.id)).text())
    expect(doc.cloud.included).toBe(false)
    expect(doc.notice).toContain('solo existe en este dispositivo')
  })
})
