/* Two division methods as pure functions (the views and the checker use the same numbers):
   - «Repartir por partes»: the dividend is split into its place-value parts and each part is divided, the remainder
     of one part joining the next: 84 ÷ 4 = 80 ÷ 4 + 4 ÷ 4 = 20 + 1 = 21; 85 ÷ 4 → 80 ÷ 4 = 20, then 5 ÷ 4 = 1 r 1.
   - «Multiplicar hacia arriba»: the multiples of the divisor are climbed one by one until one passes the dividend:
     «¿qué número por 4 da 28?» → 4, 8, 12, 16, 20, 24, 28 (7 fits), 32 is past it.
   Divisions with the dividend and the divisor as in the galera (divisor 1..9). */

export interface PartsStep {
  /** The place-value part of the dividend (0 is never a part). */
  part: number
  /** The remainder of the previous part, joined to this part before dividing. */
  carried: number
  /** part + carried: the number this step divides. */
  partial: number
  quotient: number
  remainder: number
}

/** The parts of the dividend, largest first, each divided with the remainder of the one before. */
export function divisionParts(dividend: number, divisor: number): PartsStep[] {
  const digits = String(dividend).split('').map(Number)
  const width = digits.length
  const steps: PartsStep[] = []
  let carried = 0
  for (let i = 0; i < width; i++) {
    const place = width - 1 - i
    const digit = digits[i]
    // Zero digits are not parts, except that the units always make the last step (even when 0).
    if (digit === 0 && place !== 0) continue
    const part = digit * 10 ** place
    const partial = carried + part
    const quotient = Math.floor(partial / divisor)
    const remainder = partial - quotient * divisor
    steps.push({ part, carried, partial, quotient, remainder })
    carried = remainder
  }
  return steps
}

/** The partial quotients of divisionParts, and the quotient and remainder they add up to. */
export function divisionPartsResult(dividend: number, divisor: number): { quotients: number[]; quotient: number; remainder: number } {
  const steps = divisionParts(dividend, divisor)
  return {
    quotients: steps.map((s) => s.quotient),
    quotient: steps.reduce((sum, s) => sum + s.quotient, 0),
    remainder: steps.length ? steps[steps.length - 1].remainder : dividend,
  }
}

/**
 * Multiplication climb: the products divisor × 1, × 2, … up to the first one that reaches or passes the dividend
 * (28 ÷ 4 stops at 28: it is exact; 29 ÷ 4 stops at 32).
 */
export function climbProducts(dividend: number, divisor: number): number[] {
  const out: number[] = []
  for (let k = 1; ; k++) {
    out.push(divisor * k)
    if (divisor * k >= dividend) break
  }
  return out
}

/** The quotient the climb finds: the last product that does not pass the dividend (the stop row is exact or not). */
export function climbQuotient(dividend: number, divisor: number): number {
  const products = climbProducts(dividend, divisor)
  const last = products[products.length - 1]
  return last === dividend ? products.length : products.length - 1
}
