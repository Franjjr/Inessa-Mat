/* The steps of a "galera" (Spanish long division) for a 1-digit divisor.
   Digits are brought down one at a time: each step divides the partial dividend, writes the quotient digit, the
   product under the partial and the remainder that goes on to the next step.
   Pure functions only: the view and the tests use the same steps. */

export interface GaleraStep {
  /** Index of the last dividend digit used in this step (0 = the first digit of the dividend). */
  endIndex: number
  /** Index of the first dividend digit used in this step (the first step may use several digits). */
  startIndex: number
  /** The partial dividend this step divides: the previous remainder with the brought-down digit. */
  partial: number
  quotientDigit: number
  product: number
  remainder: number
}

export function galeraSteps(dividend: number, divisor: number): GaleraStep[] {
  if (!Number.isInteger(dividend) || !Number.isInteger(divisor) || dividend < 0 || divisor < 1) {
    throw new RangeError(`galeraSteps needs an integer dividend >= 0 and divisor >= 1 (got ${dividend}, ${divisor})`)
  }
  const digits = String(dividend).split('').map(Number)
  const steps: GaleraStep[] = []
  let i = 0
  let rest = 0

  const push = (startIndex: number, endIndex: number, partial: number) => {
    const quotientDigit = Math.floor(partial / divisor)
    const product = quotientDigit * divisor
    const remainder = partial - product
    steps.push({ startIndex, endIndex, partial, quotientDigit, product, remainder })
    rest = remainder
  }

  // First step: take digits until the partial dividend is at least the divisor.
  let partial = 0
  const start = 0
  while (i < digits.length) {
    partial = partial * 10 + digits[i]
    i += 1
    if (partial >= divisor) break
  }
  push(start, i - 1, partial)

  // Every further digit is brought down.
  while (i < digits.length) {
    partial = rest * 10 + digits[i]
    push(i, i, partial)
    i += 1
  }
  return steps
}

/** The quotient built from the step digits. */
export function quotientOf(steps: readonly GaleraStep[]): number {
  return steps.reduce((acc, s) => acc * 10 + s.quotientDigit, 0)
}

/** The remainder left after the last step. */
export function remainderOf(steps: readonly GaleraStep[]): number {
  return steps.length ? steps[steps.length - 1].remainder : 0
}
