/* Progression rules (pure functions, never mutate their input).

   - World 1 is always open; world N opens when world N−1's crystal is won (or when an adult unlocks it).
   - Inside a world nodes are sequential: a node opens when the previous one is done. Done nodes stay open for
     replays, and once the crystal is won every node of that world is open.
   - Finishing a node:
       story / lesson  → done, worth COMPLETION_STARS (reading and listening count!)
       activity/review → done when stars ≥ 1 (or when the host passes `passed: true`, e.g. "let them continue")
       guardian        → done only when passed (`passed: true`, or a `letter` with `passed` omitted; stars alone never
                         pass): crystal + the world's letter (from content, never trusted from the caller), next
                         world unlocked; the caller plays the rescue story.
   - Best stars are kept. The star CURRENCY only grows by the improvement over the previous best, so replaying a
     node can never farm stars.
   - Stickers whose rule becomes true are added; lastNode and today's date (local) are recorded. */
import type { AccessoryDef, NodeProgress, ProgressState, WorldDef, WorldProgress } from '@/types'
import { getAccessory } from './accessories'
import { getNode, getWorld, guardianForWorld, nextWorldId, season1 } from './season'
import { stickerRuleMet, stickers } from './stickers'

/** Stars recorded for finishing a story or a lesson node. */
export const COMPLETION_STARS = 3
/** How many personal race records are kept per node (fastest first). */
export const MAX_RECORDS = 5

export function initialProgress(childId: string, now: Date = new Date()): ProgressState {
  return {
    childId, seasonId: 's1', worlds: { w1: { unlocked: true, nodes: {}, crystal: false } }, stars: 0, starsSpent: 0,
    stickers: [], accessoriesOwned: [], chestOpened: false, daysPlayed: [], flags: {}, updatedAt: now.toISOString(),
  }
}

/** Local calendar day (YYYY-MM-DD) — the child's day, not UTC. */
export function localDay(now: Date): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isWorldUnlocked(progress: ProgressState, worldId: string): boolean {
  const world = getWorld(worldId)
  if (!world) return false
  if (world.index === 1) return true
  if (progress.worlds[worldId]?.unlocked) return true
  const prev = season1.worlds[world.index - 2]
  return progress.worlds[prev.id]?.crystal === true
}

export function isNodeUnlocked(progress: ProgressState, worldId: string, nodeId: string): boolean {
  const world = getWorld(worldId)
  if (!world) return false
  const i = world.nodes.findIndex((n) => n.id === nodeId)
  if (i < 0 || !isWorldUnlocked(progress, worldId)) return false
  const wp = progress.worlds[worldId]
  if (i === 0 || wp?.crystal || wp?.nodes[nodeId]?.done) return true
  return wp?.nodes[world.nodes[i - 1].id]?.done === true
}

function frontierNode(progress: ProgressState, world: WorldDef): string {
  const wp = progress.worlds[world.id]
  const open = world.nodes.find((n) => !wp?.nodes[n.id]?.done)
  return (open ?? world.nodes[world.nodes.length - 1]).id
}

/** Where to continue the adventure: the first unfinished node of the current world (null when the season is won).
    The current world is the one the child was last in if it is still unfinished, otherwise the furthest open
    world without its crystal (so a child who started further ahead keeps going forward). */
export function nextNode(progress: ProgressState): { worldId: string; nodeId: string } | null {
  const open = season1.worlds.filter((w) => isWorldUnlocked(progress, w.id) && !progress.worlds[w.id]?.crystal)
  if (open.length === 0) return null
  const last = progress.lastNode ? open.find((w) => w.id === progress.lastNode!.worldId) : undefined
  const world = last ?? open[open.length - 1]
  return { worldId: world.id, nodeId: frontierNode(progress, world) }
}

/** The world's progress with `unlocked: true` (created empty when missing). */
function openWorld(existing: WorldProgress | undefined): WorldProgress {
  return existing ? { ...existing, unlocked: true } : { unlocked: true, nodes: {}, crystal: false }
}

const clampStars = (s: number) => (Number.isFinite(s) ? Math.max(0, Math.min(3, Math.round(s))) : 0)

/** Apply the result of finishing a node (stars, unlocks, crystal/letter/stickers). Pure: returns a new state. */
export function applyNodeResult(
  progress: ProgressState,
  worldId: string,
  nodeId: string,
  result: { stars: number; ms?: number; passed?: boolean; letter?: string },
  now: Date = new Date(),
): ProgressState {
  const world = getWorld(worldId)
  const node = getNode(worldId, nodeId)
  if (!world || !node) return progress
  const iso = now.toISOString()
  const stars = clampStars(result.stars)

  let passed: boolean
  let earned: number
  switch (node.kind) {
    case 'story':
    case 'lesson':
      passed = result.passed !== false
      earned = COMPLETION_STARS
      break
    case 'guardian':
      // Stars alone never pass a guardian (a failed challenge can still score 1–2 stars): only an explicit pass
      // or the letter handed over by GuardianChallenge.onPass count.
      passed = result.passed ?? result.letter !== undefined
      earned = Math.max(1, stars)
      break
    default:
      passed = result.passed ?? stars >= 1
      earned = stars
  }
  const gained = passed ? earned : 0

  const prevWorld: WorldProgress = progress.worlds[worldId] ?? { unlocked: false, nodes: {}, crystal: false }
  const prevNode: NodeProgress | undefined = prevWorld.nodes[nodeId]
  const prevBest = prevNode?.stars ?? 0
  const best = Math.max(prevBest, gained)
  const ms = result.ms !== undefined && Number.isFinite(result.ms) && result.ms > 0 ? Math.round(result.ms) : undefined

  const np: NodeProgress = { ...prevNode, done: (prevNode?.done ?? false) || passed, stars: best }
  if (passed && ms !== undefined) {
    np.bestMs = prevNode?.bestMs !== undefined ? Math.min(prevNode.bestMs, ms) : ms
    if (node.activity?.kind === 'race') np.records = [...(prevNode?.records ?? []), ms].sort((a, b) => a - b).slice(0, MAX_RECORDS)
  }
  if (passed && !np.completedAt) np.completedAt = iso

  const wp: WorldProgress = {
    ...prevWorld,
    unlocked: prevWorld.unlocked || isWorldUnlocked(progress, worldId),
    nodes: { ...prevWorld.nodes, [nodeId]: np },
  }
  const worlds: Record<string, WorldProgress> = { ...progress.worlds, [worldId]: wp }

  if (node.kind === 'guardian' && passed) {
    wp.crystal = true
    wp.letter = guardianForWorld(worldId)?.letter ?? result.letter
    if (!wp.completedAt) wp.completedAt = iso
    const nextId = nextWorldId(worldId)
    if (nextId) worlds[nextId] = openWorld(worlds[nextId])
  }

  const today = localDay(now)
  const next: ProgressState = {
    ...progress,
    worlds,
    stars: progress.stars + (best - prevBest),
    daysPlayed: progress.daysPlayed.includes(today) ? progress.daysPlayed : [...progress.daysPlayed, today],
    lastNode: { worldId, nodeId },
    updatedAt: iso,
  }
  const worldIds = season1.worlds.map((w) => w.id)
  if (!next.diplomaEarnedAt && worldIds.every((id) => next.worlds[id]?.crystal)) next.diplomaEarnedAt = iso
  const owned = new Set(progress.stickers)
  const won = stickers.filter((s) => !owned.has(s.id) && stickerRuleMet(s.earnedBy, next, worldIds)).map((s) => s.id)
  next.stickers = won.length ? [...progress.stickers, ...won] : progress.stickers
  return next
}

/** Stickers present in `after` but not in `before` (for the reward overlay). */
export function newStickers(before: ProgressState, after: ProgressState): string[] {
  const had = new Set(before.stickers)
  return after.stickers.filter((s) => !had.has(s))
}

/** Suggested starting world for a child's school grade (1º–6º de Primaria).
    1º–3º (and unknown) start at the beginning; 4º–6º already know groups and column addition, so they may start
    at the 6 table (w3) — use unlockThroughWorld so the earlier worlds stay open for their letters. */
export function startingWorldForGrade(grade?: number): string {
  return grade !== undefined && grade >= 4 ? 'w3' : 'w1'
}

/** Open every world up to and including `worldId` (adult/teacher setting or grade-based start). */
export function unlockThroughWorld(progress: ProgressState, worldId: string, now: Date = new Date()): ProgressState {
  const target = getWorld(worldId)
  if (!target) return progress
  const worlds = { ...progress.worlds }
  for (const w of season1.worlds) {
    if (w.index > target.index) break
    worlds[w.id] = openWorld(worlds[w.id])
  }
  return { ...progress, worlds, updatedAt: now.toISOString() }
}

/** Crystals won per world, in season order (for LumiHorn). */
export function crystalsOf(progress: ProgressState): boolean[] {
  return season1.worlds.map((w) => progress.worlds[w.id]?.crystal === true)
}

/** Secret-word letters won so far, in order; null where the crystal is still missing. */
export function lettersOf(progress: ProgressState): (string | null)[] {
  return season1.worlds.map((w) => (progress.worlds[w.id]?.crystal ? progress.worlds[w.id]?.letter ?? guardianForWorld(w.id)?.letter ?? null : null))
}

/** Stars the child can spend right now. */
export function spendableStars(progress: ProgressState): number {
  return Math.max(0, progress.stars - progress.starsSpent)
}

export type BuyCheck = { ok: true; accessory: AccessoryDef } | { ok: false; reason: 'unknown' | 'owned' | 'locked' | 'stars' }

/** Can the child buy this accessory? (`locked` = its world's crystal is not won yet.) */
export function canBuyAccessory(progress: ProgressState, accessoryId: string): BuyCheck {
  const a = getAccessory(accessoryId)
  if (!a) return { ok: false, reason: 'unknown' }
  if (progress.accessoriesOwned.includes(a.id)) return { ok: false, reason: 'owned' }
  if (a.requiresWorld && !progress.worlds[a.requiresWorld]?.crystal) return { ok: false, reason: 'locked' }
  if (spendableStars(progress) < a.price) return { ok: false, reason: 'stars' }
  return { ok: true, accessory: a }
}

/** Buy an accessory (pure). Returns the same state when it cannot be bought. */
export function buyAccessory(progress: ProgressState, accessoryId: string, now: Date = new Date()): ProgressState {
  const check = canBuyAccessory(progress, accessoryId)
  if (!check.ok) return progress
  return {
    ...progress,
    starsSpent: progress.starsSpent + check.accessory.price,
    accessoriesOwned: [...progress.accessoriesOwned, check.accessory.id],
    updatedAt: now.toISOString(),
  }
}
