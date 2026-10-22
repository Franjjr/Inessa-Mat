/* Adult dashboards and GDPR export. */
import type { ChildSummary } from '@/types'
import { listAttempts, listSessions } from './activity'
import { db } from './db'
import { DataError, toDataError } from './errors'
import { publicMastery, publicReward, publicSession } from './mappers'
import { META, getMeta } from './meta'
import { getMastery } from './progress'
import { remoteSummaries } from './schools'
import { getAuth } from './store'
import { getSupabase, isBackendAvailable } from './supabase'
import { buildSummary, statsFromLocal } from './summary'

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

/** GDPR right to erasure: hard-deletes the child on the server (owner/admin, online) and on this device. */
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
  await db.transaction('rw', [db.children, db.progress, db.mastery, db.attempts, db.sessions, db.rewards, db.inkSamples, db.outbox, db.meta], async () => {
    await Promise.all([
      db.children.delete(childId),
      db.progress.delete(childId),
      db.mastery.where('childId').equals(childId).delete(),
      db.attempts.where('childId').equals(childId).delete(),
      db.sessions.where('childId').equals(childId).delete(),
      db.rewards.where('childId').equals(childId).delete(),
      db.inkSamples.where('childId').equals(childId).delete(),
      db.outbox.where('childId').equals(childId).delete(),
      db.meta.delete(META.progressVersion(childId)),
      db.meta.delete(META.assignmentsCache(childId)),
    ])
    const active = await db.meta.get(META.activeChildId)
    if (active?.value === childId) await db.meta.delete(META.activeChildId)
  })
}

/** GDPR: everything stored on this device for a child, as a JSON file. */
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
  const doc = {
    format: 'numeria-child-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    notice:
      'Copia de todos los datos de este perfil guardados en este dispositivo (Numeria). ' +
      'Si usas una cuenta, la copia de la nube contiene los mismos datos sincronizados.',
    child,
    progress: progress ?? null,
    mastery: mastery.map(publicMastery),
    attempts,
    sessions: sessions.map(publicSession),
    rewards: rewards.map(publicReward),
    handwritingSamples: inkSamples,
    assignments: assignments ?? [],
    pendingSyncChanges: pending,
  }
  return new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
}
