/* Children on this device. A child belongs to the active organization of the signed-in adult, or is local-only
   (orgId null) when the device is used without an account. Deletion is soft (tombstone for sync). */
import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { initialProgress } from '@/content'
import { COMPANION_SPECIES, DEFAULT_CHILD_SETTINGS, type ChildProfile, type NewChildInput } from '@/types'
import { db } from './db'
import { DataError } from './errors'
import { META, deleteMeta, getMeta, setMeta } from './meta'
import { enqueue } from './outbox'
import { getAuth, roleIn, scopeOrgId, useAuthSnapshot } from './store'
import { nextTimestamp, nowIso, uuid } from './util'

export function isVisibleChild(c: ChildProfile | undefined, orgId: string | null): c is ChildProfile {
  return Boolean(c) && !c!.deletedAt && (c!.orgId === null || c!.orgId === orgId)
}

function byCreation(a: ChildProfile, b: ChildProfile): number {
  return a.createdAt.localeCompare(b.createdAt) || a.nickname.localeCompare(b.nickname, 'es')
}

export async function listChildrenIn(orgId: string | null): Promise<ChildProfile[]> {
  const all = await db.children.toArray()
  return all.filter((c) => isVisibleChild(c, orgId)).sort(byCreation)
}

/** Children shown on this device (active organization + local-only), oldest first. */
export async function listChildren(): Promise<ChildProfile[]> {
  return listChildrenIn(scopeOrgId())
}

/** Live list; undefined while loading (or while the auth state is still being restored). */
export function useChildren(): ChildProfile[] | undefined {
  const auth = useAuthSnapshot()
  const orgId = scopeOrgId(auth)
  const list = useLiveQuery(() => listChildrenIn(orgId), [orgId])
  return auth.status === 'loading' ? undefined : list
}

export async function getChild(id: string): Promise<ChildProfile | undefined> {
  const c = await db.children.get(id)
  return c && !c.deletedAt ? c : undefined
}

function cleanNickname(n: unknown): string {
  const s = String(n ?? '').replace(/\s+/g, ' ').trim()
  if (!s) throw new DataError('invalid', 'Escribe un nombre o apodo.')
  if (s.length > 40) throw new DataError('invalid', 'El nombre es demasiado largo (máximo 40 letras).')
  return s
}

function cleanGrade(g: unknown): number | undefined {
  if (g === undefined || g === null || g === '') return undefined
  const n = Number(g)
  if (!Number.isInteger(n) || n < 1 || n > 6) throw new DataError('invalid', 'El curso debe ser de 1º a 6º de Primaria.')
  return n
}

function cleanBirthYear(y: unknown): number | undefined {
  if (y === undefined || y === null || y === '') return undefined
  const n = Number(y)
  const now = new Date().getFullYear()
  if (!Number.isInteger(n) || n < 2005 || n > Math.min(2035, now)) throw new DataError('invalid', 'El año de nacimiento no es válido.')
  return n
}

function cleanCompanion(c: ChildProfile['companion']): ChildProfile['companion'] {
  if (!c || !COMPANION_SPECIES.includes(c.species)) throw new DataError('invalid', 'Elige un compañero de aventuras.')
  const name = String(c.name ?? '').trim().slice(0, 30)
  if (!name) throw new DataError('invalid', 'Ponle un nombre a tu compañero.')
  return {
    species: c.species,
    name,
    gender: c.gender === 'f' ? 'f' : 'm',
    colorway: c.colorway || 'default',
    equipped: Array.isArray(c.equipped) ? [...new Set(c.equipped.map(String))] : [],
  }
}

export async function createChild(input: NewChildInput): Promise<ChildProfile> {
  const now = nowIso()
  const child: ChildProfile = {
    id: uuid(),
    orgId: scopeOrgId(),
    nickname: cleanNickname(input.nickname),
    gender: input.gender === 'f' ? 'f' : 'm',
    companion: cleanCompanion(input.companion),
    settings: { ...DEFAULT_CHILD_SETTINGS, ...(input.settings ?? {}) },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  const grade = cleanGrade(input.grade)
  const birthYear = cleanBirthYear(input.birthYear)
  if (grade !== undefined) child.grade = grade
  if (birthYear !== undefined) child.birthYear = birthYear

  await db.transaction('rw', [db.children, db.progress, db.outbox, db.meta], async () => {
    await db.children.add(child)
    await db.progress.put(initialProgress(child.id, new Date(now)))
    await enqueue('children', child.id, child.id)
    await enqueue('progress', child.id, child.id)
    const active = await db.meta.get(META.activeChildId)
    if (!active?.value) await db.meta.put({ key: META.activeChildId, value: child.id })
  })
  return child
}

export async function updateChild(id: string, patch: Partial<Omit<ChildProfile, 'id'>>): Promise<ChildProfile> {
  return db.transaction('rw', [db.children, db.outbox], async () => {
    const cur = await db.children.get(id)
    if (!cur || cur.deletedAt) throw new DataError('not-found', 'No encontramos ese perfil.')
    const next: ChildProfile = {
      ...cur,
      ...patch,
      id: cur.id,
      orgId: patch.orgId !== undefined ? patch.orgId : cur.orgId,
      createdAt: cur.createdAt,
      settings: { ...cur.settings, ...(patch.settings ?? {}) },
      companion: patch.companion ? cleanCompanion({ ...cur.companion, ...patch.companion }) : cur.companion,
      updatedAt: nextTimestamp(cur.updatedAt),
      deletedAt: cur.deletedAt ?? null,
    }
    if (patch.nickname !== undefined) next.nickname = cleanNickname(patch.nickname)
    if ('grade' in patch) {
      const g = cleanGrade(patch.grade)
      if (g === undefined) delete next.grade
      else next.grade = g
    }
    if ('birthYear' in patch) {
      const y = cleanBirthYear(patch.birthYear)
      if (y === undefined) delete next.birthYear
      else next.birthYear = y
    }
    await db.children.put(next)
    await enqueue('children', id, id)
    return next
  })
}

/** Soft delete (synced as a tombstone). Local learning data of the child is removed from this device.
 *  Signed-in: only owners/admins of the child's organization may delete. */
export async function deleteChild(id: string): Promise<void> {
  const auth = getAuth()
  const cur = await db.children.get(id)
  if (!cur || cur.deletedAt) return
  if (cur.orgId && auth.status === 'signed-in') {
    const role = roleIn(cur.orgId, auth)
    if (role !== 'owner' && role !== 'admin') {
      throw new DataError('permission', 'Solo el responsable de la familia o del colegio puede borrar perfiles.')
    }
  }
  await db.transaction('rw', [db.children, db.progress, db.mastery, db.attempts, db.sessions, db.rewards, db.inkSamples, db.outbox, db.meta], async () => {
    // Drop unsent learning data of this child: it is being deleted anyway.
    await db.outbox.where('childId').equals(id).and((e) => e.table !== 'children').delete()
    await Promise.all([
      db.progress.delete(id),
      db.mastery.where('childId').equals(id).delete(),
      db.attempts.where('childId').equals(id).delete(),
      db.sessions.where('childId').equals(id).delete(),
      db.rewards.where('childId').equals(id).delete(),
      db.inkSamples.where('childId').equals(id).delete(),
    ])
    if (cur.orgId === null) {
      // Never synced: nothing to tell the server, remove it completely.
      await db.children.delete(id)
      await db.outbox.where('childId').equals(id).delete()
    } else {
      const now = nowIso()
      await db.children.put({ ...cur, deletedAt: now, updatedAt: nextTimestamp(cur.updatedAt) })
      await enqueue('children', id, id)
    }
    const active = await db.meta.get(META.activeChildId)
    if (active?.value === id) await db.meta.delete(META.activeChildId)
  })
}

// ------------------------------------------------------------------------------------------------ active child

export async function getActiveChildId(): Promise<string | null> {
  return (await getMeta<string>(META.activeChildId)) ?? null
}

export async function setActiveChildId(id: string | null): Promise<void> {
  if (id) await setMeta(META.activeChildId, id)
  else await deleteMeta(META.activeChildId)
}

/** The child currently playing on this device (persisted locally). */
export function useActiveChild(): { child: ChildProfile | null; loading: boolean; setActiveChild(id: string | null): void } {
  const auth = useAuthSnapshot()
  const orgId = scopeOrgId(auth)
  const res = useLiveQuery(async () => {
    const id = await getActiveChildId()
    if (!id) return { child: null as ChildProfile | null }
    const c = await db.children.get(id)
    return { child: isVisibleChild(c, orgId) ? c : null }
  }, [orgId])
  const setActiveChild = useCallback((id: string | null) => {
    void setActiveChildId(id)
  }, [])
  const loading = res === undefined || auth.status === 'loading'
  const child = loading ? null : (res?.child ?? null)
  return useMemo(() => ({ child, loading, setActiveChild }), [child, loading, setActiveChild])
}
