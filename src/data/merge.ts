/* Conflict resolution. Progress merges MONOTONICALLY so a child never loses anything she earned on another device:
     unlocks / crystals / nodes done / chest / flags → OR        per node stars → max (capped at 3)
     stars, starsSpent → max of (both sides, what the merged nodes / owned accessories imply)
     stickers / accessories / days played → union (sorted)       letters → kept (deterministic pick on conflict)
     best times → min                                            completion dates → earliest
     lastNode → from the most recently updated side               updatedAt → max
   Stars are a running total on each device (progression.ts adds the best-result delta of a node; buying an accessory
   adds its price to starsSpent). Two devices that played offline must ADD their deltas, so the merged totals are
   derived from the merged facts (sum of per-node best stars, sum of prices of the union of owned accessories) instead
   of taking the max of two partial totals. The stored totals stay as a floor for content that is no longer known.
   mergeProgress is commutative, associative and idempotent on its output (property-tested in merge.test.ts).
   Rewards: claimedAt / unlockedAt → earliest non-null (never reverted); other fields → last-writer-wins (mergeReward).
   Other synced rows use last-writer-wins on updatedAt (lww). */
import { MAX_RECORDS as CONTENT_MAX_RECORDS, getAccessory } from '@/content'
import type { NodeProgress, ProgressState, WorldProgress } from '@/types'
import type { RewardRow } from './types'
import { stableStringify } from './util'

const MAX_RECORDS = CONTENT_MAX_RECORDS ?? 5

function orTrue(a: boolean | undefined, b: boolean | undefined): boolean {
  return Boolean(a) || Boolean(b)
}

function maxNum(a: number | undefined, b: number | undefined): number {
  return Math.max(Number.isFinite(a) ? (a as number) : 0, Number.isFinite(b) ? (b as number) : 0)
}

function minDefined(a: number | undefined, b: number | undefined): number | undefined {
  const fa = typeof a === 'number' && Number.isFinite(a)
  const fb = typeof b === 'number' && Number.isFinite(b)
  if (fa && fb) return Math.min(a as number, b as number)
  return fa ? a : fb ? b : undefined
}

/** Earliest ISO date (string compare is wrong for mixed offsets, so compare parsed times). */
function earliest(a: string | undefined, b: string | undefined): string | undefined {
  if (!a) return b || undefined
  if (!b) return a
  const ta = Date.parse(a)
  const tb = Date.parse(b)
  if (Number.isNaN(ta)) return b
  if (Number.isNaN(tb)) return a
  if (ta === tb) return a < b ? a : b
  return ta < tb ? a : b
}

function latest(a: string, b: string): string {
  const ta = Date.parse(a)
  const tb = Date.parse(b)
  if (Number.isNaN(ta)) return b
  if (Number.isNaN(tb)) return a
  if (ta === tb) return a > b ? a : b
  return ta > tb ? a : b
}

function union(a: readonly string[] | undefined, b: readonly string[] | undefined): string[] {
  return [...new Set([...(a ?? []), ...(b ?? [])])].sort()
}

/** Non-empty value; if both are set and differ, the lexicographically smaller (deterministic). */
function firstSorted(a: string | undefined, b: string | undefined): string {
  return [a, b].filter((x): x is string => Boolean(x)).sort()[0] ?? ''
}

function pickDefined<T>(a: T | undefined, b: T | undefined, tieBreak: (x: T, y: T) => T): T | undefined {
  if (a === undefined || a === null) return b ?? undefined
  if (b === undefined || b === null) return a
  return tieBreak(a, b)
}

/** Deterministic choice between two different values (keeps merge commutative). */
function smallerByJson<T>(a: T, b: T): T {
  const sa = stableStringify(a)
  const sb = stableStringify(b)
  return sa <= sb ? a : b
}

function setIf<T extends object, K extends keyof T>(obj: T, key: K, value: T[K] | undefined): void {
  if (value !== undefined) obj[key] = value as T[K]
}

export function mergeNode(a: NodeProgress | undefined, b: NodeProgress | undefined): NodeProgress {
  const out: NodeProgress = {
    done: orTrue(a?.done, b?.done),
    stars: Math.min(3, maxNum(a?.stars, b?.stars)),
  }
  setIf(out, 'bestMs', minDefined(a?.bestMs, b?.bestMs))
  setIf(out, 'completedAt', earliest(a?.completedAt, b?.completedAt))
  if (a?.records || b?.records) {
    const all = [...(a?.records ?? []), ...(b?.records ?? [])].filter((n) => typeof n === 'number' && Number.isFinite(n))
    out.records = [...new Set(all)].sort((x, y) => x - y).slice(0, MAX_RECORDS)
  }
  return out
}

export function mergeWorld(a: WorldProgress | undefined, b: WorldProgress | undefined): WorldProgress {
  const nodes: Record<string, NodeProgress> = {}
  const ids = new Set([...Object.keys(a?.nodes ?? {}), ...Object.keys(b?.nodes ?? {})])
  for (const id of [...ids].sort()) nodes[id] = mergeNode(a?.nodes?.[id], b?.nodes?.[id])
  const out: WorldProgress = {
    unlocked: orTrue(a?.unlocked, b?.unlocked),
    nodes,
    crystal: orTrue(a?.crystal, b?.crystal),
  }
  setIf(out, 'letter', pickDefined(a?.letter || undefined, b?.letter || undefined, (x, y) => (x <= y ? x : y)))
  setIf(out, 'completedAt', earliest(a?.completedAt, b?.completedAt))
  return out
}

function newerSide(a: ProgressState, b: ProgressState): ProgressState {
  const ta = Date.parse(a.updatedAt)
  const tb = Date.parse(b.updatedAt)
  if (ta === tb || (Number.isNaN(ta) && Number.isNaN(tb))) return smallerByJson(a, b)
  if (Number.isNaN(ta)) return b
  if (Number.isNaN(tb)) return a
  return ta > tb ? a : b
}

/** Stars earned in total: every node counts its best result once (see progression.ts applyNodeResult). */
export function starsFromNodes(worlds: Record<string, WorldProgress>): number {
  let total = 0
  for (const w of Object.values(worlds)) {
    for (const n of Object.values(w?.nodes ?? {})) total += Math.min(3, maxNum(n?.stars, 0))
  }
  return total
}

/** Stars spent on the accessories the child owns (each purchase costs the accessory's price once). */
export function starsSpentFromAccessories(owned: readonly string[]): number {
  return owned.reduce((sum, id) => sum + (getAccessory(id)?.price ?? 0), 0)
}

export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const worlds: Record<string, WorldProgress> = {}
  const worldIds = new Set([...Object.keys(a.worlds ?? {}), ...Object.keys(b.worlds ?? {})])
  for (const id of [...worldIds].sort()) worlds[id] = mergeWorld(a.worlds?.[id], b.worlds?.[id])
  const accessoriesOwned = union(a.accessoriesOwned, b.accessoriesOwned)

  const flags: Record<string, boolean> = {}
  const flagKeys = new Set([...Object.keys(a.flags ?? {}), ...Object.keys(b.flags ?? {})])
  for (const k of [...flagKeys].sort()) flags[k] = orTrue(a.flags?.[k], b.flags?.[k])

  const newer = newerSide(a, b)
  const older = newer === a ? b : a
  const out: ProgressState = {
    childId: firstSorted(a.childId, b.childId),
    seasonId: firstSorted(a.seasonId, b.seasonId),
    worlds,
    stars: Math.max(maxNum(a.stars, b.stars), starsFromNodes(worlds)),
    starsSpent: Math.max(maxNum(a.starsSpent, b.starsSpent), starsSpentFromAccessories(accessoriesOwned)),
    stickers: union(a.stickers, b.stickers),
    accessoriesOwned,
    chestOpened: orTrue(a.chestOpened, b.chestOpened),
    daysPlayed: union(a.daysPlayed, b.daysPlayed),
    flags,
    updatedAt: latest(a.updatedAt, b.updatedAt),
  }
  setIf(out, 'diplomaEarnedAt', earliest(a.diplomaEarnedAt, b.diplomaEarnedAt))
  setIf(out, 'lastNode', newer.lastNode ?? older.lastNode)
  return out
}

/** Merge two copies of one reward. Claims and unlocks never go back (earliest non-null wins, so a claim survives an
 *  edit from a device that has not seen it); the other fields follow the newer edit. */
export function mergeReward(a: RewardRow, b: RewardRow): RewardRow {
  const newer = lww(a, b) as RewardRow
  return {
    ...newer,
    unlockedAt: earliest(a.unlockedAt ?? undefined, b.unlockedAt ?? undefined) ?? null,
    claimedAt: earliest(a.claimedAt ?? undefined, b.claimedAt ?? undefined) ?? null,
    updatedAt: latest(a.updatedAt, b.updatedAt),
  }
}

/** Canonical form of a state (what merging it with itself yields). */
export function normalizeProgress(s: ProgressState): ProgressState {
  return mergeProgress(s, s)
}

/** Last-writer-wins: returns the row with the later updatedAt (deterministic tie-break). */
export function lww<T extends { updatedAt: string }>(a: T | undefined, b: T | undefined): T | undefined {
  if (!a) return b
  if (!b) return a
  const ta = Date.parse(a.updatedAt)
  const tb = Date.parse(b.updatedAt)
  if (ta === tb) return smallerByJson(a, b) === a ? b : a
  return ta > tb ? a : b
}
