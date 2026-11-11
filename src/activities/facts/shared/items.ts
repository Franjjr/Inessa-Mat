/* Item generation and small helpers shared by the activities. Everything goes through @/engine. */
import { useState } from 'react'
import { generate, makeFactMul, parseSkill } from '@/engine'
import type { ActivityConfig, ActivityHost, Exercise, MasteryMap, SkillSelector } from '@/types'

/** Sessions are short: never more than this many items per activity run (PEDAGOGY: 8–12 items). */
export const MAX_ITEMS = 12
/** Mastery box from which a fact counts as known: its timers and countdowns may run (see bubbles). */
export const KNOWN_BOX = 3
/** Correct rounds after which the building step of an operations round (rectangle, baskets, friends) becomes optional. */
export const BUILD_SKIP_AFTER = 3

/** Operations activities draw from the child's mastery like the facts do (on unless the selector says otherwise). */
export function adaptiveSelector(selector: SkillSelector): SkillSelector {
  return { ...selector, adaptive: selector.adaptive ?? true }
}

export function itemCount(config: ActivityConfig, fallback: number, max = MAX_ITEMS): number {
  return Math.max(1, Math.min(config.count ?? fallback, max))
}

/** Generates the session items once per mount, adaptive to the child's mastery when the host provides it. */
export function useItems(
  config: ActivityConfig,
  count: number,
  host: ActivityHost,
  override?: Partial<SkillSelector>,
): Exercise[] {
  const [items] = useState<Exercise[]>(() => {
    const selector = { ...config.selector, ...override, adaptive: config.selector.adaptive ?? true }
    const generated = generate(selector, count, { rng: host.rng, mastery: host.mastery })
    return interleaveReview(generated, selector, host.mastery, host.rng)
  })
  return items
}

/**
 * Interleaving (practice mixes the tables): when an activity draws from one table only, its last fact is swapped
 * for a fact of another table that the child has seen and not yet secured (mastery box below KNOWN_BOX). One item
 * only, so the activity keeps its own table. Pure: returns the items unchanged when there is nothing to review.
 */
export function interleaveReview(items: Exercise[], selector: SkillSelector, mastery: MasteryMap, rng: () => number): Exercise[] {
  const tables = selector.tables ?? []
  if (tables.length !== 1 || items.length < 4) return items
  const [own] = tables
  const last = items[items.length - 1]
  if (last.kind !== 'fact-mul') return items
  const review = Object.entries(mastery)
    .filter(([, m]) => m.attempts > 0 && m.box < KNOWN_BOX)
    .map(([key]) => parseSkill(key))
    .filter((p): p is { type: 'mul'; a: number; b: number } => p?.type === 'mul' && p.a !== own && p.b !== own)
    .filter((p) => !items.some((it) => it.id === makeFactMul(p.a, p.b).id))
  if (review.length === 0) return items
  const pick = review[Math.floor(rng() * review.length)]
  return [...items.slice(0, -1), makeFactMul(pick.a, pick.b)]
}

/** Mirror rule helper: a fact written as [a, b] with a <= b is the same skill for both orientations. */
export function sortPair(a: number, b: number): [number, number] {
  return a <= b ? [a, b] : [b, a]
}

/** Whole seconds as m:ss (adult-facing timers, race). */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const sec = total % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

/** Deterministic shuffle using the host RNG. */
export function shuffleWith<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
