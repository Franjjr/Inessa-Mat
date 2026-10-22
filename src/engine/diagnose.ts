/* Error diagnosis for column operations and divisions. Inputs are the child's digits (units-first, nulls already
   checked by the caller) and the exercise numbers; outputs an ErrorType plus the columns to highlight.
   Approach: compare against "bug models" (the classic wrong algorithms children use) and classify each wrong
   column, then pick the most specific explanation. */
import type { ErrorType } from '@/types'
import { analyzeAdd, analyzeSub, digitAt, digitCount, fromDigits, toDigits } from './arith'

export interface Diagnosis {
  errorType: ErrorType
  /** Every wrong column (to highlight gently). */
  wrongColumns: number[]
  /** The wrong columns that show the diagnosed error itself (named in the feedback). Defaults to wrongColumns. */
  focus?: number[]
}

/** Columns (0 = units) where the given digits differ from the expected value. Empty cells count as 0. */
export function wrongColumnsOf(given: readonly (number | null)[], expected: number, cols: number): number[] {
  const e = toDigits(expected)
  const n = Math.max(cols, given.length, e.length)
  const out: number[] = []
  for (let i = 0; i < n; i++) if ((given[i] ?? 0) !== (e[i] ?? 0)) out.push(i)
  return out
}

export function valueOf(given: readonly (number | null)[]): number {
  return fromDigits(given.map((d) => d ?? 0))
}

function pickType(counts: Map<ErrorType, number>, priority: ErrorType[]): ErrorType {
  let best: ErrorType = priority[priority.length - 1]
  let bestN = -1
  for (const t of priority) {
    const n = counts.get(t) ?? 0
    if (n > bestN) { best = t; bestN = n }
  }
  return best
}

/** The answer written one column too far left (started in the tens) — a placement error. */
function isShiftedLeft(given: readonly (number | null)[], expected: number): boolean {
  const e = toDigits(expected)
  if ((given[0] ?? 0) !== 0 || e[0] === 0) return false
  for (let i = 0; i < e.length; i++) if ((given[i + 1] ?? 0) !== e[i]) return false
  return true
}

// ---------------------------------------------------------------- addition

export function diagnoseAdd(operands: readonly number[], given: readonly (number | null)[], carriesGiven?: readonly (number | null)[]): Diagnosis {
  const { answer, carries } = analyzeAdd(operands)
  const opCols = Math.max(...operands.map(digitCount))
  const cols = Math.max(opCols, digitCount(answer))
  const wrong = wrongColumnsOf(given, answer, cols)
  const value = valueOf(given)
  const lens = operands.map(digitCount)
  if (new Set(lens).size > 1) {
    const maxLen = Math.max(...lens)
    const leftAligned = operands.reduce((s, op) => s + op * 10 ** (maxLen - digitCount(op)), 0)
    if (value === leftAligned) return { errorType: 'misaligned', wrongColumns: wrong }
  }
  if (isShiftedLeft(given, answer)) return { errorType: 'misaligned', wrongColumns: wrong }
  if (given.some((d) => d !== null && (d > 9 || d < 0))) {
    return { errorType: 'carry-wrong', wrongColumns: given.flatMap((d, i) => (d !== null && (d > 9 || d < 0) ? [i] : [])) }
  }
  const counts = new Map<ErrorType, number>()
  const columnsOf = new Map<ErrorType, number[]>()
  const bump = (t: ErrorType, i: number) => {
    counts.set(t, (counts.get(t) ?? 0) + 1)
    columnsOf.set(t, [...(columnsOf.get(t) ?? []), i])
  }
  for (const i of wrong) {
    const g = given[i] ?? 0
    const cin = carries[i] ?? 0
    const raw = operands.reduce((s, op) => s + digitAt(op, i), 0)
    if (i >= opCols) {
      bump(g === 0 ? 'carry-forgot' : 'carry-wrong', i)
      continue
    }
    const c = carriesGiven?.[i]
    if (cin > 0 && g === raw % 10) bump('carry-forgot', i)
    else if (raw + cin >= 10 && g === Math.floor((raw + cin) / 10)) bump('carry-wrong', i)
    else if (c !== undefined && c !== null && c !== cin && g === (raw + c) % 10) bump('carry-wrong', i)
    else bump('fact', i)
  }
  const errorType = pickType(counts, ['carry-forgot', 'carry-wrong', 'fact'])
  return { errorType, wrongColumns: wrong, focus: columnsOf.get(errorType) ?? wrong }
}

// ---------------------------------------------------------------- subtraction

/** Value produced by the "smaller from larger" bug: |top − bottom| in every column, never borrowing. */
export function smallerFromLargerValue(minuend: number, subtrahend: number): number {
  const cols = digitCount(minuend)
  const d: number[] = []
  for (let i = 0; i < cols; i++) d.push(Math.abs(digitAt(minuend, i) - digitAt(subtrahend, i)))
  return fromDigits(d)
}

export function diagnoseSub(minuend: number, subtrahend: number, given: readonly (number | null)[]): Diagnosis {
  const an = analyzeSub(minuend, subtrahend)
  const cols = digitCount(minuend)
  const wrong = wrongColumnsOf(given, an.answer, cols)
  const value = valueOf(given)
  const m = (i: number) => digitAt(minuend, i)
  const s = (i: number) => digitAt(subtrahend, i)
  const g = (i: number) => given[i] ?? 0
  if (value === minuend + subtrahend) return { errorType: 'other', wrongColumns: wrong }
  const sl = digitCount(subtrahend)
  if (sl < cols) {
    const shifted = minuend - subtrahend * 10 ** (cols - sl)
    if (shifted > 0 && value === shifted) return { errorType: 'misaligned', wrongColumns: wrong }
  }
  if (isShiftedLeft(given, an.answer)) return { errorType: 'misaligned', wrongColumns: wrong }
  if (value === smallerFromLargerValue(minuend, subtrahend)) return { errorType: 'smaller-from-larger', wrongColumns: wrong }
  const zeroCols = new Set(an.zeroChains.flat())
  if (an.zeroBorrow && wrong.some((i) => zeroCols.has(i))) return { errorType: 'zero-borrow', wrongColumns: wrong }
  if (wrong.some((i) => i < cols && m(i) < s(i) && g(i) === s(i) - m(i))) return { errorType: 'smaller-from-larger', wrongColumns: wrong }
  const borrowIn = (i: number) => (i > 0 && an.borrowed[i - 1] ? 1 : 0)
  const noDecrement = (i: number) => (m(i) >= s(i) ? m(i) - s(i) : m(i) + 10 - s(i))
  if (wrong.some((i) => i < cols && borrowIn(i) === 1 && g(i) === noDecrement(i))) return { errorType: 'borrow-forgot', wrongColumns: wrong }
  if (wrong.some((i) => i < cols && an.borrowed[i] && g(i) === 0)) return { errorType: 'borrow-forgot', wrongColumns: wrong }
  return { errorType: 'fact', wrongColumns: wrong }
}

// ---------------------------------------------------------------- 2-digit × 1-digit

export function diagnoseMul(top: number, bottom: number, given: readonly (number | null)[]): Diagnosis {
  const answer = top * bottom
  const wrong = wrongColumnsOf(given, answer, digitCount(answer))
  const value = valueOf(given)
  if (given.some((d) => d !== null && (d > 9 || d < 0))) {
    return { errorType: 'carry-wrong', wrongColumns: given.flatMap((d, i) => (d !== null && (d > 9 || d < 0) ? [i] : [])) }
  }
  // Everything right except the leading digit left out: the final carry was never written down.
  if (wrong.length && wrong.every((i) => i >= digitCount(top) && (given[i] ?? 0) === 0)) return { errorType: 'carry-forgot', wrongColumns: wrong }
  const t = Math.floor(top / 10)
  const u = top % 10
  const up = u * bottom
  const c = Math.floor(up / 10)
  if (c > 0) {
    const noCarry = t * bottom * 10 + (up % 10)
    if (value === noCarry) return { errorType: 'carry-forgot', wrongColumns: wrong }
    const beforeMultiply = (t + c) * bottom * 10 + (up % 10)
    const concat = Number(`${t * bottom}${up}`)
    const swapped = (t * bottom + (up % 10)) * 10 + c
    if (value === beforeMultiply || value === concat || value === swapped) return { errorType: 'carry-wrong', wrongColumns: wrong }
    if (!wrong.includes(0) && (given[1] ?? 0) === (t * bottom) % 10) return { errorType: 'carry-forgot', wrongColumns: wrong }
  }
  if (value === top + bottom) return { errorType: 'operation', wrongColumns: wrong }
  return { errorType: 'fact', wrongColumns: wrong }
}

// ---------------------------------------------------------------- division

/** too-big / too-small: quotient off by one or two · remainder: quotient right, remainder wrong · bring-down: the
    leftover ten was not joined to the units · stopped: only the tens were shared (84 ÷ 4 → 2, 70 ÷ 7 → 1, forgetting
    the 0) · reversed: quotient digits swapped (21 → 12) · operation: subtracted/added/multiplied instead · digit: one
    quotient digit wrong (a table fact) · near: one-digit quotient that is not the nearest multiple. */
export type DivisionDetail =
  | 'too-big' | 'too-small' | 'remainder' | 'bring-down' | 'stopped' | 'reversed' | 'operation' | 'digit' | 'near' | 'other'

export function diagnoseDivision(
  dividend: number, divisor: number, q: number, r: number,
): { errorType: ErrorType; detail: DivisionDetail } {
  const Q = Math.floor(dividend / divisor)
  if (r === 0 && [dividend - divisor, dividend + divisor, dividend * divisor].includes(q)) {
    return { errorType: 'operation', detail: 'operation' }
  }
  if (r >= divisor) return { errorType: 'remainder-too-big', detail: 'remainder' }
  if (q === Q) return { errorType: 'fact', detail: 'remainder' }
  if (q > Q && q - Q <= 2) return { errorType: 'quotient-off', detail: 'too-big' }
  if (q === Q - 1) return { errorType: 'quotient-off', detail: 'too-small' }
  if (Q >= 10) {
    const t = Math.floor(dividend / 10)
    const u = dividend % 10
    // Bring-down error: tens digit right, but the leftover ten was not joined to the units.
    if (Math.floor(q / 10) === Math.floor(Q / 10) && t % divisor !== 0 && q % 10 === Math.floor(u / divisor)) {
      return { errorType: 'other', detail: 'bring-down' }
    }
    const qd = toDigits(q)
    const Qd = toDigits(Q)
    // Stopped after sharing the tens: the units digit of the quotient is missing (a cell left empty).
    if (q >= 1 && q === Math.floor(Q / 10)) return { errorType: 'incomplete', detail: 'stopped' }
    if (qd.length === Qd.length && qd.length > 1 && [...qd].reverse().every((d, i) => d === Qd[i])) {
      return { errorType: 'misaligned', detail: 'reversed' }
    }
    if (qd.length === Qd.length && qd.filter((d, i) => d !== Qd[i]).length === 1) return { errorType: 'fact', detail: 'digit' }
    return { errorType: 'other', detail: 'other' }
  }
  return { errorType: 'fact', detail: 'near' }
}
