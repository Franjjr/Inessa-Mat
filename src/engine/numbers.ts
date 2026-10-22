/* Constructive operand generators for column operations and divisions. Each one builds numbers digit by digit
   so the requested number of carries/borrows is hit exactly, then verifies the result with the independent
   analysis in arith.ts. They return null when the request is impossible (the caller falls back). */
import type { Rng } from '@/types'
import { analyzeAdd, analyzeDiv, analyzeSub, fromDigits } from './arith'
import type { DivisionVariant } from './skills'
import { pick, randInt, range, shuffle, weightedIndex } from './rng'

const ATTEMPTS = 60

function zeroCount(n: number): number {
  return String(n).split('').filter((c) => c === '0').length
}

/** Columns whose carry-out is allowed: a 4-digit sum must stay below 10000. */
export function carryableColumns(digits: number): number[] {
  return digits >= 4 ? range(0, digits - 2) : range(0, digits - 1)
}

export function maxCarries(digits: number): number {
  return carryableColumns(digits).length
}

/**
 * Two addends: the first has exactly `digits` digits, the second `secondDigits` (digits or digits-1), with exactly
 * `carries` columns producing a carry.
 */
export function genAddOperands(rng: Rng, digits: number, carries: number, secondDigits = digits): [number, number] | null {
  const carryable = carryableColumns(digits).filter((c) => secondDigits === digits || c < secondDigits || digits < 4)
  if (carries > carryable.length || carries < 0) return null
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const set = new Set(shuffle(rng, carryable).slice(0, carries))
    const a: number[] = []
    const b: number[] = []
    let cin = 0
    let ok = true
    for (let i = 0; i < digits; i++) {
      const want = set.has(i)
      const aLo = i === digits - 1 ? 1 : 0
      const bHas = i < secondDigits
      const bLo = i === secondDigits - 1 ? 1 : 0
      const cands: [number, number][] = []
      for (let x = aLo; x <= 9; x++) {
        for (let y = bHas ? bLo : 0; y <= (bHas ? 9 : 0); y++) {
          if ((x + y + cin >= 10) !== want) continue
          if (bHas && x === 0 && y === 0) continue
          cands.push([x, y])
        }
      }
      if (cands.length === 0) { ok = false; break }
      const [x, y] = pick(rng, cands)
      a.push(x)
      b.push(y)
      cin = want ? 1 : 0
    }
    if (!ok) continue
    const A = fromDigits(a)
    const B = fromDigits(b)
    if (zeroCount(A) > 1 || zeroCount(B) > 1) continue
    if (digits >= 4 && A + B >= 10000) continue
    if (analyzeAdd([A, B]).carryCount !== carries) continue
    return [A, B]
  }
  return null
}

/**
 * Minuend with `digits` digits, subtrahend with `subDigits` (digits or digits-1). `target` = exact number of borrows
 * (never across a zero), or 'z' = at least one borrow across a zero. The result always keeps `digits` digits.
 */
export function genSubPair(rng: Rng, digits: number, target: number | 'z', subDigits = digits): [number, number] | null {
  const zero = target === 'z'
  if (zero && digits < 3) return null
  if (!zero && (target < 0 || target > digits - 1)) return null
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const borrowSet = new Set<number>()
    const zeroCols = new Set<number>()
    if (zero) {
      const start = randInt(rng, 0, digits - 3)
      const maxZeros = digits - 2 - start
      const zeros = maxZeros >= 2 && rng() < 0.35 ? 2 : 1
      for (let j = 1; j <= zeros; j++) zeroCols.add(start + j)
      for (let j = 0; j <= zeros; j++) borrowSet.add(start + j)
      for (let c = 0; c < digits - 1; c++) if (!borrowSet.has(c) && c < start && rng() < 0.4) borrowSet.add(c)
      for (let c = start + zeros + 1; c < digits - 1; c++) if (rng() < 0.4) borrowSet.add(c)
    } else {
      for (const c of shuffle(rng, range(0, digits - 2)).slice(0, target)) borrowSet.add(c)
    }
    const m: number[] = []
    const s: number[] = []
    let bin = 0
    let ok = true
    for (let i = 0; i < digits; i++) {
      const top = i === digits - 1
      const want = borrowSet.has(i)
      const sHas = i < subDigits
      const sLo = i === subDigits - 1 ? 1 : 0
      const cands: [number, number][] = []
      const mValues = zeroCols.has(i) ? [0] : range(top ? 1 : 0, 9)
      for (const x of mValues) {
        if (!zero && bin === 1 && x === 0) continue // would borrow across a zero
        if (zero && !zeroCols.has(i) && bin === 1 && x === 0) continue // keep the chain exactly where planned
        for (let y = sHas ? sLo : 0; y <= (sHas ? 9 : 0); y++) {
          if ((x - bin < y) !== want) continue
          if (top && x - bin - y < 1) continue
          if (!zeroCols.has(i) && sHas && x === 0 && y === 0) continue
          cands.push([x, y])
        }
      }
      if (cands.length === 0) { ok = false; break }
      const [x, y] = pick(rng, cands)
      m.push(x)
      s.push(y)
      bin = want ? 1 : 0
    }
    if (!ok) continue
    const M = fromDigits(m)
    const S = fromDigits(s)
    if (!zero && (zeroCount(M) > 1 || zeroCount(S) > 1)) continue
    if (zero && zeroCount(S) > 1) continue
    const an = analyzeSub(M, S)
    if (zero ? !an.zeroBorrow : an.zeroBorrow || an.borrowCount !== target) continue
    return [M, S]
  }
  return null
}

const DEFAULT_BOTTOMS = [2, 3, 4, 5, 6, 7, 8, 9]

/** 2-digit × 1-digit: [top, bottom]; carry = units product >= 10. Tops end in 1..9 (never ×0 units) and are >= 12. */
export function genMul2x1(rng: Rng, carry: boolean, bottoms: number[] = DEFAULT_BOTTOMS): [number, number] | null {
  const valid = bottoms.filter((b) => b >= 2 && b <= 9)
  const pool = valid.length ? valid : DEFAULT_BOTTOMS
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const b = pick(rng, pool)
    const units = range(1, 9).filter((u) => (u * b >= 10) === carry)
    if (units.length === 0) continue
    const u = pick(rng, units)
    // Without carry, keep most results 2-digit like the workbook (21 × 4, 43 × 2), sometimes 3-digit (52 × 3).
    const tens = range(1, 9).filter((t) => carry || rng() < 0.3 || t * b < 10)
    const t = pick(rng, tens.length ? tens : [1])
    const top = t * 10 + u
    if (top < 12) continue
    return [top, b]
  }
  return null
}

const DIVISION_POOLS: Record<DivisionVariant, [number, number][]> = { exact: [], rem: [], long: [] }
for (let divisor = 2; divisor <= 9; divisor++) {
  for (let dividend = 10; dividend <= 99; dividend++) {
    const { quotient, remainder, variant } = analyzeDiv(dividend, divisor)
    if (variant === 'exact' && remainder === 0) DIVISION_POOLS.exact.push([dividend, divisor])
    else if (variant === 'rem' && remainder > 0 && quotient >= 2) DIVISION_POOLS.rem.push([dividend, divisor])
    else if (variant === 'long' && remainder === 0) DIVISION_POOLS.long.push([dividend, divisor])
  }
}

/** All (dividend, divisor) pairs of a variant (2-digit ÷ 1-digit; 'long' and 'exact' have no final remainder). */
export function divisionPool(variant: DivisionVariant, divisors?: number[]): [number, number][] {
  const all = DIVISION_POOLS[variant]
  if (!divisors || divisors.length === 0) return all
  const filtered = all.filter(([, d]) => divisors.includes(d))
  return filtered.length ? filtered : all
}

/**
 * A (dividend, divisor) pair of the variant.
 * - 'rem': divisor first (uniform), so every table appears (17 ÷ 5, 23 ÷ 4, 38 ÷ 6, 45 ÷ 7…).
 * - 'exact' / 'long': the pools are very uneven (÷2 has 20 exact pairs, ÷7 only 70 and 77), so a uniform divisor
 *   would make 70 ÷ 7, 80 ÷ 8, 55 ÷ 5… most of the items. Pairs are weighted by poolSize^-0.25 per divisor, which keeps
 *   the workbook's ÷2 / ÷3 / ÷4 at the centre (48 ÷ 2, 69 ÷ 3, 84 ÷ 4) while still visiting the big tables, and exact
 *   divisions ending in 0 (30 ÷ 3, 70 ÷ 7 → quotient 10) are rarer.
 */
export function genDivision(rng: Rng, variant: DivisionVariant, divisors?: number[]): [number, number] {
  const pool = divisionPool(variant, divisors)
  const sizes = new Map<number, number>()
  for (const [, d] of pool) sizes.set(d, (sizes.get(d) ?? 0) + 1)
  const weights = pool.map(([dividend, d]) => {
    const n = sizes.get(d)!
    const perDivisor = variant === 'rem' ? 1 / n : n ** -0.25
    return perDivisor * (variant === 'exact' && dividend % 10 === 0 ? 0.3 : 1)
  })
  return pool[weightedIndex(rng, weights)]
}
