/* Column arithmetic analysis: digits, carries, borrows and division classification.
   Digit arrays are always units-first (index 0 = units), like Answer.digits. */
import type { DivisionVariant } from './skills'

export function toDigits(n: number): number[] {
  const v = Math.abs(Math.trunc(n))
  if (v === 0) return [0]
  const out: number[] = []
  let x = v
  while (x > 0) {
    out.push(x % 10)
    x = Math.floor(x / 10)
  }
  return out
}

export function fromDigits(digits: readonly number[]): number {
  let v = 0
  for (let i = digits.length - 1; i >= 0; i--) v = v * 10 + digits[i]
  return v
}

export function digitCount(n: number): number {
  return toDigits(n).length
}

export function digitAt(n: number, i: number): number {
  return Math.floor(Math.abs(n) / 10 ** i) % 10
}

// ---------------------------------------------------------------- addition

export interface AddAnalysis {
  answer: number
  /** carries[i] = carry going into column i (written above it). Length = answer digits; carries[0] = 0. */
  carries: number[]
  /** Number of columns that produced a carry. */
  carryCount: number
}

export function analyzeAdd(operands: readonly number[]): AddAnalysis {
  const answer = operands.reduce((s, n) => s + n, 0)
  const cols = Math.max(digitCount(answer), ...operands.map(digitCount))
  const carries: number[] = [0]
  let carry = 0
  let carryCount = 0
  for (let i = 0; i < cols; i++) {
    const s = operands.reduce((acc, n) => acc + digitAt(n, i), 0) + carry
    carry = Math.floor(s / 10)
    if (carry > 0) carryCount++
    if (i + 1 < cols) carries.push(carry)
  }
  return { answer, carries, carryCount }
}

// ---------------------------------------------------------------- subtraction

export interface SubAnalysis {
  answer: number
  /** borrowed[i] = column i needed to borrow from column i+1 (regrouping method). Length = minuend digits. */
  borrowed: boolean[]
  borrowCount: number
  /** At least one column borrowed from a neighbour that is 0 ("borrow across zero"). */
  zeroBorrow: boolean
  /** Columns involved in each borrow-across-zero: the borrowing column, the zeros and the lending column. */
  zeroChains: number[][]
}

export function analyzeSub(minuend: number, subtrahend: number): SubAnalysis {
  const answer = minuend - subtrahend
  const cols = digitCount(minuend)
  const borrowed: boolean[] = []
  let borrowIn = 0
  for (let i = 0; i < cols; i++) {
    const top = digitAt(minuend, i) - borrowIn
    const need = top < digitAt(subtrahend, i)
    borrowed.push(need)
    borrowIn = need ? 1 : 0
  }
  const zeroChains: number[][] = []
  for (let i = 0; i + 1 < cols; i++) {
    if (!borrowed[i] || digitAt(minuend, i + 1) !== 0) continue
    // Skip if this zero was already part of a chain started lower down.
    if (zeroChains.some((c) => c.includes(i + 1))) continue
    const chain = [i]
    let j = i + 1
    while (j < cols && digitAt(minuend, j) === 0) chain.push(j++)
    if (j < cols) chain.push(j)
    zeroChains.push(chain)
  }
  return { answer, borrowed, borrowCount: borrowed.filter(Boolean).length, zeroBorrow: zeroChains.length > 0, zeroChains }
}

// ---------------------------------------------------------------- 2-digit × 1-digit

export interface MulAnalysis {
  answer: number
  /** carries[i] = carry going into column i. Length = answer digits; carries[0] = 0. */
  carries: number[]
  /** Units product >= 10 (a carry into the tens). */
  unitsCarry: boolean
}

export function analyzeMul(top: number, bottom: number): MulAnalysis {
  const answer = top * bottom
  const cols = digitCount(answer)
  const carries: number[] = [0]
  let carry = 0
  for (let i = 0; i < cols - 1; i++) {
    const p = digitAt(top, i) * bottom + carry
    carry = Math.floor(p / 10)
    carries.push(carry)
  }
  return { answer, carries, unitsCarry: digitAt(top, 0) * bottom >= 10 }
}

// ---------------------------------------------------------------- division

export interface DivAnalysis {
  quotient: number
  remainder: number
  variant: DivisionVariant
}

/** Classifies a 2-digit ÷ 1-digit division the way the workbook teaches it:
    'rem'   one-digit quotient (usually with a remainder), e.g. 17 ÷ 5
    'exact' digit by digit with nothing left over at any step, e.g. 84 ÷ 4
    'long'  anything that needs bringing down (or a 3-digit dividend), e.g. 72 ÷ 3 */
export function analyzeDiv(dividend: number, divisor: number): DivAnalysis {
  const quotient = Math.floor(dividend / divisor)
  const remainder = dividend - quotient * divisor
  let variant: DivisionVariant
  if (quotient < 10) variant = 'rem'
  else if (dividend < 100 && digitAt(dividend, 1) % divisor === 0 && digitAt(dividend, 0) % divisor === 0) variant = 'exact'
  else variant = 'long'
  return { quotient, remainder, variant }
}
