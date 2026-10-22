/* School features (online, signed-in): classes, enrollment by class code, assignments, class overview.
   Without a backend or account they degrade gracefully: lists are empty, writes throw a Spanish DataError.
   Lists are cached in meta so dashboards still show something offline. */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Assignment, ChildSummary, ClassOverview, ClassRoom, Enrollment, SkillSelector } from '@/types'
import { db } from './db'
import { DataError, isNetworkError, toDataError } from './errors'
import { assignmentFromRow, childFromRow, classFromRow, enrollmentFromRow, masteryFromRow, progressFromRow, publicMastery } from './mappers'
import { META, getMeta, setMeta } from './meta'
import { buildSummary, type ChildStats } from './summary'
import { getAuth } from './store'
import { getSupabase, isBackendAvailable } from './supabase'
import { pushChildNow } from './sync'
import { chunk, nowIso } from './util'

type Row = Record<string, unknown>

async function online(): Promise<{ sb: SupabaseClient; userId: string }> {
  if (!isBackendAvailable()) throw new DataError('no-backend', 'Las clases necesitan una cuenta. Esta versión funciona sin cuenta.')
  const a = getAuth()
  if (a.status !== 'signed-in' || !a.user) throw new DataError('not-signed-in', 'Inicia sesión para usar las clases.')
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new DataError('offline')
  const sb = await getSupabase()
  if (!sb) throw new DataError('no-backend')
  return { sb, userId: a.user.id }
}

function canUseSchools(): boolean {
  const a = getAuth()
  return isBackendAvailable() && a.status === 'signed-in' && Boolean(a.user)
}

async function cached<T>(key: string, load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const v = await load()
    await setMeta(key, v)
    return v
  } catch (e) {
    const err = toDataError(e)
    if (err.code === 'offline' || isNetworkError(e)) return (await getMeta<T>(key)) ?? fallback
    throw err
  }
}

function q<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  return Promise.resolve(p).then(({ data, error }) => {
    if (error) throw toDataError(error)
    return data as T
  })
}

// ------------------------------------------------------------------------------------------------ classes

/** All classes of a school (active first, then archived), alphabetically. */
export async function listClasses(orgId: string): Promise<ClassRoom[]> {
  if (!canUseSchools()) return []
  return cached(`cache.classes:${orgId}`, async () => {
    const { sb } = await online()
    const rows = await q<Row[]>(sb.from('classes').select('*').eq('org_id', orgId))
    return (rows ?? []).map(classFromRow).sort((a, b) => Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt)) || a.name.localeCompare(b.name, 'es', { numeric: true }))
  }, [])
}

export async function createClass(orgId: string, name: string, grade: number | null): Promise<ClassRoom> {
  const { sb, userId } = await online()
  const n = String(name ?? '').trim()
  if (!n) throw new DataError('invalid', 'Escribe el nombre de la clase (por ejemplo, 3ºB).')
  if (n.length > 60) throw new DataError('invalid', 'El nombre de la clase es demasiado largo.')
  if (grade !== null && (!Number.isInteger(grade) || grade < 1 || grade > 6)) throw new DataError('invalid', 'El curso debe ser de 1º a 6º.')
  const row = await q<Row>(sb.from('classes').insert({ org_id: orgId, name: n, grade, teacher_id: userId }).select('*').single())
  return classFromRow(row)
}

export async function archiveClass(classId: string): Promise<void> {
  const { sb } = await online()
  const rows = await q<Row[]>(sb.from('classes').update({ archived_at: nowIso() }).eq('id', classId).select('id'))
  if (!rows?.length) throw new DataError('permission', 'Solo el profe de la clase o la dirección pueden archivarla.')
}

/** A new code for the class (when the old one was shared too widely). */
export async function regenerateJoinCode(classId: string): Promise<string> {
  const { sb } = await online()
  return String(await q<string>(sb.rpc('regenerate_join_code', { p_class_id: classId })))
}

/** Parent links their child to a teacher's class with the class code (consent). */
export async function joinClassWithCode(code: string, childId: string): Promise<ClassRoom> {
  const { sb } = await online()
  const clean = String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (clean.length !== 6) throw new DataError('invalid-code', 'El código de clase tiene 6 letras y números.')
  const child = await db.children.get(childId)
  if (!child || child.deletedAt) throw new DataError('not-found', 'No encontramos ese perfil en este dispositivo.')
  if (!child.orgId) throw new DataError('invalid', 'Antes de unirte a una clase, guarda este perfil en tu cuenta.')
  await pushChildNow(childId) // the server must know the child before linking it
  const data = await q<Row | null>(sb.rpc('join_class', { p_code: clean, p_child_id: childId }))
  if (!data || !data.id) throw new DataError('invalid-code')
  return classFromRow(data)
}

export async function listEnrollments(classId: string): Promise<Enrollment[]> {
  if (!canUseSchools()) return []
  return cached(`cache.enrollments:${classId}`, async () => {
    const { sb } = await online()
    const rows = await q<Row[]>(sb.from('class_enrollments').select('*').eq('class_id', classId))
    return (rows ?? []).map(enrollmentFromRow)
  }, [])
}

export async function removeEnrollment(classId: string, childId: string): Promise<void> {
  const { sb } = await online()
  await q(sb.from('class_enrollments').delete().eq('class_id', classId).eq('child_id', childId))
}

/** Classes a child of this device is linked to (family view). */
export async function listClassesForChild(childId: string): Promise<ClassRoom[]> {
  if (!canUseSchools()) return []
  return cached(`cache.childClasses:${childId}`, async () => {
    const { sb } = await online()
    const enr = await q<Row[]>(sb.from('class_enrollments').select('class_id').eq('child_id', childId))
    const ids = (enr ?? []).map((r) => String(r.class_id))
    if (!ids.length) return []
    const rows = await q<Row[]>(sb.from('classes').select('*').in('id', ids))
    return (rows ?? []).map(classFromRow)
  }, [])
}

// ------------------------------------------------------------------------------------------------ overview

async function remoteStats(sb: SupabaseClient, childIds: string[]): Promise<Map<string, ChildStats>> {
  const out = new Map<string, ChildStats>()
  if (!childIds.length) return out
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const errorsSince = new Date(Date.now() - 30 * 86_400_000).toISOString()
  for (const ids of chunk(childIds, 100)) {
    const rows = await q<Row[]>(sb.rpc('child_stats', { p_child_ids: ids, p_since: since, p_errors_since: errorsSince }))
    for (const r of rows ?? []) {
      out.set(String(r.child_id), {
        attempts: Number(r.attempts ?? 0),
        correct: Number(r.correct ?? 0),
        minutes: Number(r.minutes ?? 0),
        lastPlayedAt: r.last_played_at ? new Date(String(r.last_played_at)).toISOString() : null,
        topErrors: Array.isArray(r.top_errors) ? (r.top_errors as { errorType: string; count: number }[]).map((e) => ({ errorType: String(e.errorType), count: Number(e.count) })) : [],
      })
    }
  }
  return out
}

/** Summaries of the given children straight from the server (teacher dashboards, other devices' children). */
export async function remoteSummaries(childIds: string[]): Promise<ChildSummary[]> {
  const { sb } = await online()
  if (!childIds.length) return []
  const children = [] as ReturnType<typeof childFromRow>[]
  const progress = new Map<string, ReturnType<typeof progressFromRow>['state']>()
  const mastery = new Map<string, Record<string, ReturnType<typeof publicMastery>>>()
  for (const ids of chunk(childIds, 80)) {
    const cr = await q<Row[]>(sb.from('children').select('*').in('id', ids).is('deleted_at', null))
    children.push(...(cr ?? []).map(childFromRow))
    const pr = await q<Row[]>(sb.from('progress').select('child_id,state,version').in('child_id', ids))
    for (const r of pr ?? []) progress.set(String(r.child_id), progressFromRow(r).state)
    // Only times-table facts are needed for the grid.
    let from = 0
    for (;;) {
      const mr = await q<Row[]>(sb.from('skill_mastery').select('child_id,skill,data,updated_at').in('child_id', ids).like('skill', 'mul:%').range(from, from + 999))
      for (const r of mr ?? []) {
        const m = masteryFromRow(r)
        const map = mastery.get(m.childId) ?? {}
        map[m.skill] = publicMastery(m)
        mastery.set(m.childId, map)
      }
      if (!mr || mr.length < 1000) break
      from += 1000
    }
  }
  const stats = await remoteStats(sb, children.map((c) => c.id))
  return children
    .map((c) => buildSummary(c, progress.get(c.id) ?? null, mastery.get(c.id) ?? {}, stats.get(c.id) ?? null))
    .sort((a, b) => a.nickname.localeCompare(b.nickname, 'es'))
}

export async function getClassOverview(classId: string): Promise<ClassOverview> {
  return cached(`cache.overview:${classId}`, async () => {
    const { sb } = await online()
    const cls = await q<Row | null>(sb.from('classes').select('*').eq('id', classId).maybeSingle())
    if (!cls) throw new DataError('not-found', 'No encontramos esa clase.')
    const enr = await q<Row[]>(sb.from('class_enrollments').select('child_id').eq('class_id', classId))
    const ids = (enr ?? []).map((r) => String(r.child_id))
    return { classRoom: classFromRow(cls), children: await remoteSummaries(ids) }
  }, null as unknown as ClassOverview).then((v) => {
    if (!v) throw new DataError('offline')
    return v
  })
}

// ------------------------------------------------------------------------------------------------ assignments

export async function listAssignments(classId: string): Promise<Assignment[]> {
  if (!canUseSchools()) return []
  return cached(`cache.assignments.class:${classId}`, async () => {
    const { sb } = await online()
    const rows = await q<Row[]>(sb.from('assignments').select('*').eq('class_id', classId).order('starts_at', { ascending: false }))
    return (rows ?? []).map(assignmentFromRow)
  }, [])
}

export async function createAssignment(a: Omit<Assignment, 'id' | 'createdBy'>): Promise<Assignment> {
  const { sb, userId } = await online()
  const title = String(a.title ?? '').trim()
  if (!title) throw new DataError('invalid', 'Escribe un título para la misión.')
  if (a.dueAt && Date.parse(a.dueAt) <= Date.parse(a.startsAt)) throw new DataError('invalid', 'La fecha límite debe ser posterior al inicio.')
  const row = await q<Row>(
    sb.from('assignments')
      .insert({ class_id: a.classId, title: title.slice(0, 120), selector: (a.selector ?? {}) as SkillSelector, starts_at: a.startsAt, due_at: a.dueAt, created_by: userId })
      .select('*')
      .single(),
  )
  return assignmentFromRow(row)
}

function isCurrent(a: Assignment, now = Date.now()): boolean {
  return Date.parse(a.startsAt) <= now && (!a.dueAt || Date.parse(a.dueAt) >= now)
}

/** Assignments that apply to a child (via enrollments) — the game shows them as "misión de tu profe".
 *  Current ones only (started, not past due), newest first. Works offline from the last cached list. */
export async function listAssignmentsForChild(childId: string): Promise<Assignment[]> {
  const key = META.assignmentsCache(childId)
  if (!canUseSchools()) return ((await getMeta<Assignment[]>(key)) ?? []).filter((a) => isCurrent(a))
  const all = await cached(key, async () => {
    const { sb } = await online()
    const enr = await q<Row[]>(sb.from('class_enrollments').select('class_id').eq('child_id', childId))
    const ids = (enr ?? []).map((r) => String(r.class_id))
    if (!ids.length) return [] as Assignment[]
    const rows = await q<Row[]>(sb.from('assignments').select('*').in('class_id', ids).order('starts_at', { ascending: false }))
    return (rows ?? []).map(assignmentFromRow)
  }, [] as Assignment[])
  return all.filter((a) => isCurrent(a))
}
