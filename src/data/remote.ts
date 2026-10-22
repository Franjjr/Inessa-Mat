/* The only place that builds PostgREST queries for the sync engine (keeps the surface small and mockable). */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProgressState } from '@/types'

export type Row = Record<string, unknown>

export const PAGE_SIZE = 500

interface Result<T> {
  data: T | null
  error: unknown
}

async function run<T>(p: PromiseLike<Result<T>>): Promise<T> {
  const { data, error } = await p
  if (error) throw error
  return data as T
}

export async function upsertRows(sb: SupabaseClient, table: string, rows: Row[], onConflict: string, ignoreDuplicates = false): Promise<void> {
  if (!rows.length) return
  await run(sb.from(table).upsert(rows, { onConflict, ignoreDuplicates }))
}

/** One page of rows changed since `since` (inclusive), oldest change first. */
export async function selectChanged(
  sb: SupabaseClient,
  table: string,
  column: string,
  values: string[],
  since: string | null,
  opts: { createdColumn?: string; createdSince?: string } = {},
): Promise<Row[]> {
  let q = sb.from(table).select('*').in(column, values)
  if (since) q = q.gte('synced_at', since)
  if (opts.createdColumn && opts.createdSince) q = q.gte(opts.createdColumn, opts.createdSince)
  return (await run<Row[]>(q.order('synced_at', { ascending: true }).limit(PAGE_SIZE))) ?? []
}

export async function fetchProgress(sb: SupabaseClient, childId: string): Promise<Row | null> {
  return run<Row | null>(sb.from('progress').select('child_id,state,version,updated_at,synced_at').eq('child_id', childId).maybeSingle())
}

/** Insert the first progress row of a child; 'conflict' when another device inserted it first. */
export async function insertProgress(sb: SupabaseClient, childId: string, state: ProgressState): Promise<number | 'conflict'> {
  const { data, error } = await sb
    .from('progress')
    .insert({ child_id: childId, state, updated_at: state.updatedAt })
    .select('version')
    .single()
  if (error) {
    if ((error as { code?: string }).code === '23505') return 'conflict'
    throw error
  }
  return Number((data as Row | null)?.version ?? 1)
}

/** Compare-and-swap on the server version. Returns the new version, or null if someone else wrote first. */
export async function casProgress(sb: SupabaseClient, childId: string, state: ProgressState, version: number): Promise<number | null> {
  const rows = await run<Row[]>(
    sb.from('progress').update({ state, updated_at: state.updatedAt }).eq('child_id', childId).eq('version', version).select('version'),
  )
  if (!rows || rows.length === 0) return null
  return Number(rows[0].version)
}

/** Child ids erased in the given organizations (GDPR tombstones). Full list: erasures are rare and must never be
 *  missed, so this is not cursor-based. */
export async function fetchErasedChildIds(sb: SupabaseClient, orgIds: string[]): Promise<string[]> {
  if (!orgIds.length) return []
  const out: string[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const rows = await run<Row[]>(
      sb.from('erased_children').select('child_id').in('org_id', orgIds).order('child_id', { ascending: true }).range(from, from + PAGE_SIZE - 1),
    )
    for (const r of rows ?? []) out.push(String(r.child_id))
    if (!rows || rows.length < PAGE_SIZE) break
  }
  return out
}

/** Every row of a table whose `column` is one of `values`, read page by page (ordered by a unique column). */
export async function selectAllIn(sb: SupabaseClient, table: string, column: string, values: string[], orderBy: string): Promise<Row[]> {
  if (!values.length) return []
  const out: Row[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const rows = await run<Row[]>(
      sb.from(table).select('*').in(column, values).order(orderBy, { ascending: true }).range(from, from + PAGE_SIZE - 1),
    )
    out.push(...(rows ?? []))
    if (!rows || rows.length < PAGE_SIZE) break
  }
  return out
}
