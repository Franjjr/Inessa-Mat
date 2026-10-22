/* Adult dashboards and GDPR export. */
import type { AttemptRecord, ChildProfile, ChildSummary, ProgressState } from '@/types'
import { listAttempts, listSessions } from './activity'
import { db } from './db'
import { DataError, toDataError } from './errors'
import { eraseLocalChild } from './erasure'
import { attemptFromRow, masteryFromRow, progressFromRow, publicMastery, publicReward, publicSession, rewardFromRow, sessionFromRow } from './mappers'
import { lww, mergeProgress, mergeReward } from './merge'
import { META, getMeta } from './meta'
import { getMastery } from './progress'
import { fetchProgress, selectAllIn, type Row } from './remote'
import { remoteSummaries } from './schools'
import { getAuth } from './store'
import { getSupabase, isBackendAvailable } from './supabase'
import { buildSummary, statsFromLocal } from './summary'
import type { MasteryRow, RewardRow, SessionRow } from './types'
import { isAfter } from './util'

const DAY = 86_400_000

/** Summary for the adult report. Children of this device are computed locally (works offline); other children
 *  (e.g. a teacher looking at an enrolled child) come from the server. */
export async function getChildSummary(childId: string): Promise<ChildSummary> {
  const child = await db.children.get(childId)
  if (child && !child.deletedAt) {
    const now = Date.now()
    const since7 = new Date(now - 7 * DAY).toISOString()
    const since30 = new Date(now - 30 * DAY).toISOString()
    const [progress, mastery, attempts30, sessions7, newest, newestSession] = await Promise.all([
      db.progress.get(childId),
      getMastery(childId),
      listAttempts(childId, { since: since30 }),
      listSessions(childId, { since: since7 }),
      listAttempts(childId, { limit: 1 }),
      listSessions(childId),
    ])
    const attempts7 = attempts30.filter((a) => a.createdAt >= since7)
    const lastSession = newestSession[0]
    const candidates = [newest[0]?.createdAt, lastSession?.endedAt, lastSession?.startedAt].filter((x): x is string => Boolean(x))
    const lastPlayedAt = candidates.length ? candidates.sort().at(-1)! : null
    return buildSummary(child, progress ?? null, mastery, statsFromLocal(attempts7, attempts30, sessions7, lastPlayedAt))
  }
  const a = getAuth()
  if (isBackendAvailable() && a.status === 'signed-in') {
    const [summary] = await remoteSummaries([childId])
    if (summary) return summary
  }
  throw new DataError('not-found', 'No encontramos ese perfil.')
}

/** GDPR right to erasure: removes the child from the server (owner/admin, online, signed in; the server keeps a
 *  tombstone so every family device drops the child on its next sync) and from this device. */
export async function eraseChild(childId: string): Promise<void> {
  const child = await db.children.get(childId)
  if (child?.orgId) {
    const a = getAuth()
    if (!isBackendAvailable() || a.status !== 'signed-in') throw new DataError('not-signed-in', 'Inicia sesión para borrar este perfil también de la nube.')
    const role = a.memberships.find((m) => m.orgId === child.orgId)?.role
    if (role !== 'owner' && role !== 'admin') throw new DataError('permission', 'Solo la persona responsable de la familia o del colegio puede borrar perfiles.')
    const sb = await getSupabase()
    const { error } = await sb!.rpc('erase_child', { p_child_id: childId })
    if (error) throw toDataError(error)
  }
  await eraseLocalChild(childId)
}

// ------------------------------------------------------------------------------------------------ GDPR export

const NOTICE_FULL =
  'Copia completa de este perfil: incluye lo guardado en este dispositivo y lo que la nube de tu cuenta tiene de este perfil ' +
  '(todo el historial, clases y misiones). Las muestras de escritura a mano solo se guardan en este dispositivo.'

function noticeLocalOnly(reason: string): string {
  return (
    `Copia de los datos guardados en ESTE dispositivo. No incluye lo que está en la nube: ${reason} ` +
    'Para una copia completa, exporta con conexión y con la sesión iniciada.'
  )
}

interface CloudCopy {
  progress: ProgressState | null
  mastery: MasteryRow[]
  attempts: AttemptRecord[]
  sessions: SessionRow[]
  rewards: RewardRow[]
  classEnrollments: Record<string, unknown>[]
  assignments: Record<string, unknown>[]
}

const EMPTY_CLOUD: CloudCopy = { progress: null, mastery: [], attempts: [], sessions: [], rewards: [], classEnrollments: [], assignments: [] }

type CloudRead = { included: true; fetchedAt: string; copy: CloudCopy } | { included: false; reason: string }

function camelize(row: Row): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()), v]))
}

/** The child's cloud data, read page by page (full history, not the 90-day first-pull window). */
async function readCloudCopy(child: ChildProfile): Promise<CloudRead> {
  if (!child.orgId) return { included: false, reason: 'este perfil no tiene cuenta: solo existe en este dispositivo.' }
  if (!isBackendAvailable() || getAuth().status !== 'signed-in') {
    return { included: false, reason: 'no hay una sesión iniciada con la cuenta de la familia en este dispositivo.' }
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { included: false, reason: 'no hay conexión ahora mismo.' }
  try {
    const sb = await getSupabase()
    if (!sb) return { included: false, reason: 'no hay conexión con la nube configurada en esta copia de la app.' }
    const id = child.id
    const [progressRow, masteryRows, attemptRows, sessionRows, rewardRows, enrollRows] = await Promise.all([
      fetchProgress(sb, id),
      selectAllIn(sb, 'skill_mastery', 'child_id', [id], 'skill'),
      selectAllIn(sb, 'attempts', 'child_id', [id], 'id'),
      selectAllIn(sb, 'sessions', 'child_id', [id], 'id'),
      selectAllIn(sb, 'rewards', 'child_id', [id], 'id'),
      selectAllIn(sb, 'class_enrollments', 'child_id', [id], 'class_id'),
    ])
    const assignmentRows = await selectAllIn(sb, 'assignments', 'class_id', enrollRows.map((r) => String(r.class_id)), 'id')
    return {
      included: true,
      fetchedAt: new Date().toISOString(),
      copy: {
        progress: progressRow ? progressFromRow(progressRow).state : null,
        mastery: masteryRows.map(masteryFromRow),
        attempts: attemptRows.map(attemptFromRow),
        sessions: sessionRows.map(sessionFromRow),
        rewards: rewardRows.map(rewardFromRow),
        classEnrollments: enrollRows.map(camelize),
        assignments: assignmentRows.map(camelize),
      },
    }
  } catch (e) {
    console.warn('[numeria/export] cloud copy not included:', e)
    return { included: false, reason: 'no se pudieron leer los datos de la nube en este momento.' }
  }
}

/** Device copy and cloud copy of one child, merged with the same rules the sync engine uses. */
function mergeCopies(local: CloudCopy, cloud: CloudCopy): CloudCopy {
  const progress = local.progress && cloud.progress ? mergeProgress(local.progress, cloud.progress) : (local.progress ?? cloud.progress)
  const mastery = new Map<string, MasteryRow>()
  for (const m of [...local.mastery, ...cloud.mastery]) {
    const cur = mastery.get(m.skill)
    mastery.set(m.skill, cur ? (lww(cur, m) as MasteryRow) : m)
  }
  const attempts = new Map<string, AttemptRecord>()
  for (const a of [...local.attempts, ...cloud.attempts]) if (!attempts.has(a.id)) attempts.set(a.id, a)
  const sessions = new Map<string, SessionRow>()
  for (const s of [...local.sessions, ...cloud.sessions]) {
    const cur = sessions.get(s.id)
    sessions.set(
      s.id,
      cur
        ? {
            ...cur,
            minutes: Math.max(cur.minutes, s.minutes),
            endedAt: cur.endedAt ?? s.endedAt,
            summary: cur.summary ?? s.summary,
            updatedAt: isAfter(s.updatedAt, cur.updatedAt) ? s.updatedAt : cur.updatedAt,
          }
        : s,
    )
  }
  const rewards = new Map<string, RewardRow>()
  for (const r of [...local.rewards, ...cloud.rewards]) {
    const cur = rewards.get(r.id)
    rewards.set(r.id, cur ? mergeReward(cur, r) : r)
  }
  return {
    progress: progress ?? null,
    mastery: [...mastery.values()],
    attempts: [...attempts.values()].sort((x, y) => x.createdAt.localeCompare(y.createdAt)),
    sessions: [...sessions.values()],
    rewards: [...rewards.values()],
    classEnrollments: cloud.classEnrollments,
    assignments: cloud.assignments,
  }
}

/** GDPR (art. 15): everything stored for a child, as a JSON file. Signed in and online, the cloud copy is merged in
 *  (full history, classes, missions); offline or signed out, the file says so and holds this device's data only. */
export async function exportChildData(childId: string): Promise<Blob> {
  const child = await db.children.get(childId)
  if (!child) throw new DataError('not-found', 'No encontramos ese perfil.')
  const [progress, mastery, attempts, sessions, rewards, inkSamples, assignments, pending] = await Promise.all([
    db.progress.get(childId),
    db.mastery.where('childId').equals(childId).toArray(),
    db.attempts.where('childId').equals(childId).sortBy('createdAt'),
    db.sessions.where('childId').equals(childId).sortBy('startedAt'),
    db.rewards.where('childId').equals(childId).toArray(),
    db.inkSamples.where('childId').equals(childId).sortBy('createdAt'),
    getMeta(META.assignmentsCache(childId)),
    db.outbox.where('childId').equals(childId).count(),
  ])
  const cloud = await readCloudCopy(child)
  const local: CloudCopy = {
    progress: progress ?? null,
    mastery,
    attempts,
    sessions,
    rewards,
    classEnrollments: [],
    assignments: [],
  }
  const copy = mergeCopies(local, cloud.included ? cloud.copy : EMPTY_CLOUD)
  const doc = {
    format: 'numeria-child-export',
    version: 2,
    exportedAt: new Date().toISOString(),
    source: cloud.included ? 'device+cloud' : 'device',
    notice: cloud.included ? NOTICE_FULL : noticeLocalOnly(cloud.reason),
    cloud: cloud.included ? { included: true, fetchedAt: cloud.fetchedAt } : { included: false, reason: cloud.reason },
    child,
    progress: copy.progress,
    mastery: copy.mastery.map(publicMastery),
    attempts: copy.attempts,
    sessions: copy.sessions.map(publicSession),
    rewards: copy.rewards.map(publicReward),
    classEnrollments: copy.classEnrollments,
    cloudAssignments: copy.assignments,
    handwritingSamples: inkSamples,
    assignments: assignments ?? [],
    pendingSyncChanges: pending,
  }
  return new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
}
