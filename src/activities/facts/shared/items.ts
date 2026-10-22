/* Item generation and small helpers shared by the activities. Everything goes through @/engine. */
import { useState } from 'react'
import { generate } from '@/engine'
import type { ActivityConfig, ActivityHost, Exercise, SkillSelector } from '@/types'

/** Sessions are short: never more than this many items per activity run (PEDAGOGY: 8–12 items). */
export const MAX_ITEMS = 12

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
  const [items] = useState<Exercise[]>(() =>
    generate({ ...config.selector, ...override, adaptive: config.selector.adaptive ?? true }, count, {
      rng: host.rng,
      mastery: host.mastery,
    }),
  )
  return items
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
