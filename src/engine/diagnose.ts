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
  /** Subtraction: 'borrow-column' = a column that had to borrow was left undone (written 0) while its neighbour
      did lend (it is right): the child did not ask for the ten, so the message names that column. */
  detail?: 'borrow-column'
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
  // The lender kept its digit: it lent a ten and was not crossed out. `focus` is the lender column.
  const lender = wrong.find((i) => i < cols && borrowIn(i) === 1 && g(i) === noDecrement(i))
  if (lender !== undefined) return { errorType: 'borrow-forgot', wrongColumns: wrong, focus: [lender] }
  // A borrowing column written 0. When its neighbour did lend (it is right), the ten was never asked for in this
  // column: name the column, not the neighbour (981 − 314 written 660). Otherwise the neighbour was not crossed out.
  const zeroCol = wrong.find((i) => i < cols && an.borrowed[i] && g(i) === 0)
  if (zeroCol !== undefined) {
    if (zeroCol + 1 < cols && !wrong.includes(zeroCol + 1)) return { errorType: 'fact', wrongColumns: wrong, focus: [zeroCol], detail: 'borrow-column' }
    return { errorType: 'borrow-forgot', wrongColumns: wrong, focus: [zeroCol + 1] }
  }
  return { errorType: 'fact', wrongColumns: wrong }
}

// ---------------------------------------------------------------- any number of digits × 1-digit

/** Column by column, for a top of any length (12 × 9, 525 × 8): p[i] = digit i × bottom, cin[i] = the carry into
    column i. The classic bugs are checked on the whole number first, then column by column (`focus` = the column). */
export function diagnoseMul(top: number, bottom: number, given: readonly (number | null)[]): Diagnosis {
  const answer = top * bottom
  const wrong = wrongColumnsOf(given, answer, digitCount(answer))
  const value = valueOf(given)
  if (given.some((d) => d !== null && (d > 9 || d < 0))) {
    return { errorType: 'carry-wrong', wrongColumns: given.flatMap((d, i) => (d !== null && (d > 9 || d < 0) ? [i] : [])) }
  }
  const n = digitCount(top)
  // Everything right except the leading digit left out: the final carry was never written down.
  if (wrong.length && wrong.every((i) => i >= n && (given[i] ?? 0) === 0)) return { errorType: 'carry-forgot', wrongColumns: wrong, focus: [wrong[0]] }
  const p: number[] = []
  const cin: number[] = [0]
  for (let i = 0; i < n; i++) {
    p.push(digitAt(top, i) * bottom)
    cin.push(Math.floor((p[i] + cin[i]) / 10))
  }
  const carried = cin.slice(0, n).map((c, i) => (c > 0 ? i : -1)).filter((i) => i >= 0)
  if (carried.length) {
    // Every carry left out: each column keeps its own product (47 × 3 → 121).
    let noCarry = 0
    for (let i = 0; i < n; i++) noCarry += (i < n - 1 ? p[i] % 10 : p[i]) * 10 ** i
    if (value === noCarry) return { errorType: 'carry-forgot', wrongColumns: wrong, focus: carried.slice(0, 1) }
    if (n === 2) {
      const t = Math.floor(top / 10)
      const u = top % 10
      const up = u * bottom
      const c = Math.floor(up / 10)
      const beforeMultiply = (t + c) * bottom * 10 + (up % 10)
      const concat = Number(`${t * bottom}${up}`)
      const swapped = (t * bottom + (up % 10)) * 10 + c
      if (value === beforeMultiply || value === concat || value === swapped) return { errorType: 'carry-wrong', wrongColumns: wrong }
    }
    const forgot = wrong.filter((i) => i < n && cin[i] > 0 && (given[i] ?? 0) === p[i] % 10)
    if (forgot.length) return { errorType: 'carry-forgot', wrongColumns: wrong, focus: forgot.slice(0, 1) }
    const multiplied = wrong.filter((i) => i < n && cin[i] > 0 && (given[i] ?? 0) === ((digitAt(top, i) + cin[i]) * bottom) % 10)
    if (multiplied.length) return { errorType: 'carry-wrong', wrongColumns: wrong, focus: multiplied.slice(0, 1) }
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
): { errorType: ErrorType; detail: DivisionDetail; place?: number } {
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
    // Stopped after sharing the tens: the units digit of the quotient is missing (a cell left empty). In a longer
    // division the child may stop earlier (5248 : 8 → 6, after the centenas): `place` names the column it stopped at.
    if (q >= 1 && q === Math.floor(Q / 10)) return { errorType: 'incomplete', detail: 'stopped' }
    for (let place = 2; 10 ** place <= Q; place++) {
      if (q >= 1 && q === Math.floor(Q / 10 ** place)) return { errorType: 'incomplete', detail: 'stopped', place }
    }
    if (qd.length === Qd.length && qd.length > 1 && [...qd].reverse().every((d, i) => d === Qd[i])) {
      return { errorType: 'misaligned', detail: 'reversed' }
    }
    if (qd.length === Qd.length && qd.filter((d, i) => d !== Qd[i]).length === 1) return { errorType: 'fact', detail: 'digit' }
    return { errorType: 'other', detail: 'other' }
  }
  return { errorType: 'fact', detail: 'near' }
}
