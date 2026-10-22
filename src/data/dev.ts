/* Dev-only helpers (installed on window.__numeriaDev when import.meta.env.DEV):
     seed()  → wipes local data and creates the demo child "Inessa" (local-only) with progress, mastery, attempts
               and sessions so every screen has something to show (used by tools/shot.mjs --seed)
     reset() → wipes all local data (IndexedDB + Numeria localStorage keys)
   Everything is deterministic (seeded RNG) so screenshots are stable. */
import { applyNodeResult, initialProgress, season1 } from '@/content'
import type { AttemptRecord, ChildProfile, ErrorType, ExerciseKind, ProgressState, SkillMastery } from '@/types'
import { db, wipeLocalDatabase } from './db'
import { META } from './meta'
import type { MasteryRow, RewardRow, SessionRow } from './types'
import { getAuth, resetAuthStore, setAuth } from './store'
import { getSyncStatus, syncNow } from './sync'
import { localDay } from './util'

function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DEMO_CHILD_ID = '00000000-0000-4000-8000-0000000000e5'

/** Box per times table for the demo: easy tables mastered, 6/7/8 still in progress. */
const DEMO_BOX: Record<number, number> = { 1: 5, 2: 5, 3: 3, 4: 3, 5: 5, 6: 2, 7: 1, 8: 1, 9: 2, 10: 5 }

function demoProgress(childId: string, now: Date): ProgressState {
  let p = initialProgress(childId, new Date(now.getTime() - 12 * 86_400_000))
  const [w1, w2] = season1.worlds
  const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000)
  if (w1) {
    w1.nodes.forEach((n, i) => {
      const stars = n.kind === 'activity' ? (i % 3 === 0 ? 2 : 3) : 3
      p = applyNodeResult(p, w1.id, n.id, { stars, passed: true, ms: 60_000 + i * 5_000 }, at(10 - Math.min(i, 8)))
    })
  }
  if (w2) {
    const half = Math.max(1, Math.floor(w2.nodes.length / 2))
    w2.nodes.slice(0, half).forEach((n, i) => {
      p = applyNodeResult(p, w2.id, n.id, { stars: i % 2 ? 2 : 3, passed: true, ms: 80_000 }, at(3 - Math.min(i, 2)))
    })
  }
  const days = [6, 5, 3, 2, 1, 0].map((d) => localDay(at(d)))
  return { ...p, daysPlayed: [...new Set([...(p.daysPlayed ?? []), ...days])].sort(), flags: { ...p.flags, calibration: true, prologue: true }, updatedAt: now.toISOString() }
}

function demoMastery(childId: string, now: Date, r: () => number): MasteryRow[] {
  const rows: MasteryRow[] = []
  const iso = (msAgo: number) => new Date(now.getTime() - msAgo).toISOString()
  for (let a = 1; a <= 10; a++) {
    for (let b = a; b <= 10; b++) {
      // A fact with an easy factor (×1 ×2 ×5 ×10) is easy; otherwise it is as hard as its bigger factor.
      const easy = [1, 2, 5, 10]
      const table = easy.includes(a) ? a : easy.includes(b) ? b : Math.max(a, b)
      const base = DEMO_BOX[table] ?? 3
      const isEasy = table !== Math.max(a, b) || easy.includes(table)
      if (!isEasy && (a === 7 || b === 7) && Math.min(a, b) >= 6 && r() < 0.5) continue // a few 7s never seen yet
      const jitter = isEasy ? 0 : r() < 0.3 ? -1 : r() < 0.2 ? 1 : 0
      const box = Math.max(0, Math.min(5, base + jitter)) as SkillMastery['box']
      const attempts = 3 + Math.floor(r() * 8) + (5 - box)
      const correct = Math.max(1, Math.round(attempts * (0.45 + box * 0.1)))
      rows.push({
        childId, skill: `mul:${a}x${b}`, box, attempts, correct: Math.min(attempts, correct), streak: box,
        avgMs: 2_500 + Math.round((5 - box) * 900 + r() * 800), lastSeenAt: iso((1 + Math.floor(r() * 5)) * 86_400_000),
        dueAt: iso(-(box * 86_400_000)), lastError: box <= 1 ? 'fact' : null, updatedAt: iso(3_600_000),
      })
    }
  }
  const ops: [string, SkillMastery['box'], ErrorType | null][] = [
    ['add:3d:c1', 4, null], ['add:3d:c2', 3, 'carry-forgot'], ['add:4d:c2', 2, 'carry-forgot'], ['concept:placevalue', 4, null],
    ['concept:groups', 5, null], ['concept:array', 4, null], ['concept:commutative', 4, null],
  ]
  for (const [skill, box, err] of ops) {
    rows.push({ childId, skill, box, attempts: 8, correct: 4 + box, streak: box, avgMs: null, lastSeenAt: iso(2 * 86_400_000), dueAt: iso(-86_400_000), lastError: err, updatedAt: iso(3_600_000) })
  }
  return rows
}

function demoActivity(childId: string, now: Date, r: () => number): { attempts: AttemptRecord[]; sessions: SessionRow[] } {
  const attempts: AttemptRecord[] = []
  const sessions: SessionRow[] = []
  const playDays = [6, 5, 3, 2, 1, 0]
  playDays.forEach((daysAgo, si) => {
    const start = new Date(now.getTime() - daysAgo * 86_400_000 - (daysAgo === 0 ? 40 : 0) * 60_000)
    start.setHours(daysAgo === 0 ? Math.min(start.getHours(), 18) : 17, 30, 0, 0)
    const minutes = 11 + Math.round(r() * 8)
    const sessionId = `00000000-0000-4000-9000-${String(si).padStart(12, '0')}`
    const n = 14 + Math.floor(r() * 10)
    let correct = 0
    for (let i = 0; i < n; i++) {
      const facts = r() < 0.8
      const a = facts ? [6, 7, 8, 6, 7, 8, 3, 4, 9][Math.floor(r() * 9)] : 0
      const b = 1 + Math.floor(r() * 10)
      const [x, y] = a <= b ? [a, b] : [b, a]
      const skill = facts ? `mul:${x}x${y}` : 'add:3d:c2'
      const ok = r() < (facts ? (a === 7 || a === 8 ? 0.66 : 0.82) : 0.75)
      if (ok) correct++
      const kind: ExerciseKind = facts ? 'fact-mul' : 'column-add'
      const expected = facts ? String(a * b) : '813'
      const errorType: ErrorType | null = ok ? null : facts ? (r() < 0.12 ? 'recognition' : 'fact') : 'carry-forgot'
      attempts.push({
        id: `00000000-0000-4000-a${String(si).padStart(3, '0')}-${String(i).padStart(12, '0')}`,
        childId, sessionId, skill, kind, correct: ok,
        given: ok ? expected : facts ? String(a * b + (r() < 0.5 ? a : -a)) : '713', expected,
        ms: 2_000 + Math.round(r() * 6_000), inputMode: r() < 0.85 ? 'pen' : 'keypad', hintsUsed: ok ? 0 : r() < 0.5 ? 1 : 0,
        errorType, recognitionFixes: errorType === 'recognition' ? 1 : 0,
        context: { worldId: facts ? 'w3' : 'w2', activity: facts ? 'facts' : 'column' },
        createdAt: new Date(start.getTime() + (i + 1) * ((minutes * 60_000) / (n + 1))).toISOString(),
      })
    }
    const ended = new Date(start.getTime() + minutes * 60_000)
    sessions.push({
      id: sessionId, childId, startedAt: start.toISOString(), endedAt: ended.toISOString(), minutes,
      summary: { attempts: n, correct, starsEarned: 2 + Math.floor(r() * 4), nodesCompleted: [] }, updatedAt: ended.toISOString(),
    })
  })
  return { attempts, sessions }
}

export async function seedDemo(): Promise<{ childId: string }> {
  await wipeLocalDatabase()
  const now = new Date()
  const r = rng(20180417)
  const created = new Date(now.getTime() - 12 * 86_400_000).toISOString()
  const child: ChildProfile = {
    id: DEMO_CHILD_ID,
    orgId: null,
    nickname: 'Inessa',
    gender: 'f',
    birthYear: 2018,
    grade: 2,
    companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
    settings: { inputPreference: 'auto', sessionMinutes: 15, sound: true, music: true, voice: true, timedActivities: true, handedness: 'right', bigCells: false, subjects: ['math'] },
    createdAt: created,
    updatedAt: created,
    deletedAt: null,
  }
  const progress = demoProgress(child.id, now)
  const mastery = demoMastery(child.id, now, r)
  const { attempts, sessions } = demoActivity(child.id, now, r)
  const reward: RewardRow = {
    id: '00000000-0000-4000-b000-000000000001', childId: child.id, kind: 'chest', worldId: null,
    title: 'Una tarde de cine contigo', description: 'Con palomitas y la peli que tú elijas.', createdBy: null,
    unlockedAt: null, claimedAt: null, updatedAt: created,
  }
  await db.transaction('rw', [db.children, db.progress, db.mastery, db.attempts, db.sessions, db.rewards, db.meta], async () => {
    await db.children.put(child)
    await db.progress.put(progress)
    await db.mastery.bulkPut(mastery)
    await db.attempts.bulkPut(attempts)
    await db.sessions.bulkPut(sessions)
    await db.rewards.put(reward)
    await db.meta.put({ key: META.activeChildId, value: child.id })
    await db.meta.put({ key: META.mode, value: 'local-only' })
  })
  if (getAuth().status !== 'signed-in') setAuth({ status: 'local-only' })
  return { childId: child.id }
}

export async function resetDemo(): Promise<void> {
  await wipeLocalDatabase()
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('numeria')) localStorage.removeItem(k)
  } catch {
    /* ignore */
  }
  resetAuthStore()
}

declare global {
  interface Window {
    __numeriaDev?: {
      seed: () => Promise<{ childId: string }>
      reset: () => Promise<void>
      sync: () => Promise<void>
      status: () => unknown
      db: typeof db
    }
  }
}

export function installDevHelpers(): void {
  if (typeof window === 'undefined') return
  window.__numeriaDev = { seed: seedDemo, reset: resetDemo, sync: syncNow, status: getSyncStatus, db }
}
