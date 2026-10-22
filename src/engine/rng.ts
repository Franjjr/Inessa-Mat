/* Deterministic randomness helpers. Everything random in the engine flows through an Rng so that the same seed
   always produces the same exercises (tests, replays, guardian challenges). */
import type { Rng } from '@/types'

/** Seeded PRNG (mulberry32). Same seed → same sequence. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a 32-bit hash of a string (stable across platforms). */
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Integer in [lo, hi] (inclusive). */
export function randInt(rng: Rng, lo: number, hi: number): number {
  if (hi < lo) return lo
  return lo + Math.floor(rng() * (hi - lo + 1))
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

/** Index chosen with probability proportional to its weight. Non-positive weights are never chosen
    unless every weight is non-positive (then uniform). */
export function weightedIndex(rng: Rng, weights: readonly number[]): number {
  let total = 0
  for (const w of weights) if (w > 0) total += w
  if (total <= 0) return Math.floor(rng() * weights.length)
  let r = rng() * total
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i]
    if (w <= 0) continue
    r -= w
    if (r < 0) return i
  }
  // Floating point guard: last positive weight.
  for (let i = weights.length - 1; i >= 0; i--) if (weights[i] > 0) return i
  return 0
}

export function range(lo: number, hi: number): number[] {
  const out: number[] = []
  for (let i = lo; i <= hi; i++) out.push(i)
  return out
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}
