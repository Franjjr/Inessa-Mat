/* Recognition-aware grading (PEDAGOGY 7: "Recognition ≠ maths"). A child who sees a misread digit fixes it and
   presses Comprobar again. The answer that was graded first then no longer describes what the child meant, so the
   graded outcome is the answer the child settled on, not the first one. Pure: no React, no ink. */
import type { Answer, CheckResult } from '@/types'

export interface Submitted {
  /** Stable key of the answer as written (see answerKey). */
  key: string
  check: CheckResult
}

/** Stable key of an answer: two submissions with the same digits share it. */
export function answerKey(answer: Answer): string {
  return JSON.stringify(answer)
}

export interface Graded {
  /** The check that counts for mastery and the log. */
  check: CheckResult
  /** True when the child changed what was written after a first check. */
  rewritten: boolean
}

/**
 * The graded check of one exercise, from its submissions in order.
 * - One submission, or the first one was right: the first check counts (a later re-check cannot undo it).
 * - The first one was wrong and the child rewrote the answer: the answer they settled on counts. A misread digit
 *   that was corrected is then not a maths error; a final answer that is still wrong is graded as it is.
 */
export function gradeFromSubmissions(subs: readonly Submitted[]): Graded | null {
  if (subs.length === 0) return null
  const first = subs[0]
  const last = subs[subs.length - 1]
  if (first.check.correct || subs.length === 1) return { check: first.check, rewritten: false }
  const rewritten = subs.some((s) => s.key !== first.key)
  return { check: rewritten ? last.check : first.check, rewritten }
}

// ------------------------------------------------------------------------------------------------ misread checks

type Digits = readonly (number | null)[]

/** Digits units first → the written number read left to right, '' when empty and '?' for a gap. */
function readDigits(digits: Digits): string {
  let top = -1
  digits.forEach((d, i) => { if (d != null) top = i })
  if (top < 0) return ''
  let out = ''
  for (let i = top; i >= 0; i--) out += digits[i] == null ? '?' : String(digits[i])
  return out
}

/** The digits of a units-first array reversed (a number typed in reading order into a units-first row); null when
 *  there is nothing to reverse (empty, one digit, a gap, or the same number backwards). */
function reverseRow(digits: Digits): (number | null)[] | null {
  let top = -1
  digits.forEach((d, i) => { if (d != null) top = i })
  if (top < 1) return null
  const used = digits.slice(0, top + 1)
  if (used.some((d) => d == null)) return null
  const rev = [...used].reverse()
  if (rev.every((d, i) => d === used[i])) return null
  return [...rev, ...digits.slice(top + 1)]
}

/**
 * The answer with the written number reversed: what the child meant when she typed «625» in reading order into a
 * row filled units first (it became 526). Only for the result rows of column operations. null when not applicable.
 */
export function reversedAnswer(a: Answer, kind?: string): Answer | null {
  // A sum of decimals in columns («numbers»: whole part, tenths, hundredths), filled from the last decimal: 3,75 typed
  // as read became 5,73. The digits as written, reversed, split again with the same number of decimals.
  if (a.type === 'numbers' && kind === 'decimal-op') {
    const [whole, ...decs] = a.values
    const places = decs[1] == null ? 1 : 2
    if (whole == null || decs.slice(0, places).some((d) => d == null)) return null
    const written = `${whole}${decs.slice(0, places).join('')}`
    const rev = [...written].reverse().join('')
    if (rev === written) return null
    const w = Number(rev.slice(0, rev.length - places))
    const d = rev.slice(rev.length - places).split('').map(Number)
    return { ...a, values: [w, d[0], places === 2 ? d[1] : null] }
  }
  if (a.type === 'digits') {
    const rev = reverseRow(a.digits)
    return rev ? { ...a, digits: rev } : null
  }
  if (a.type === 'long-mul') {
    const rev = reverseRow(a.total)
    return rev ? { ...a, total: rev } : null
  }
  return null
}

/** The number the child sees on screen for an answer, as she wrote it (for "He leído 47"). null when not a number. */
export function shownAnswer(a: Answer): string | null {
  switch (a.type) {
    case 'number': return a.value == null ? null : String(a.value)
    case 'digits': return readDigits(a.digits) || null
    case 'long-mul': return readDigits(a.total) || null
    case 'steps': return a.total == null ? null : String(a.total)
    case 'division': return a.quotient == null ? null : String(a.quotient)
    default: return null
  }
}

/** Every number in `n` with one digit `from` changed to `to`. */
function swapIn(n: number | null, from: number, to: number): number[] {
  if (n == null || n < 0 || !Number.isInteger(n)) return []
  const str = String(n)
  const out: number[] = []
  for (let i = 0; i < str.length; i++) {
    if (str[i] !== String(from)) continue
    const next = str.slice(0, i) + String(to) + str.slice(i + 1)
    if (next.length > 1 && next[0] === '0') continue
    out.push(Number(next))
  }
  return out
}

function swapRow(row: Digits, from: number, to: number): (number | null)[][] {
  const out: (number | null)[][] = []
  row.forEach((d, i) => { if (d === from) out.push(row.map((x, j) => (j === i ? to : x))) })
  return out
}

function swapList(list: readonly (number | null)[], from: number, to: number): (number | null)[][] {
  return list.flatMap((v, i) => swapIn(v, from, to).map((n) => list.map((x, j) => (j === i ? n : x))))
}

/**
 * The answers that differ from `a` in exactly one written digit (`from` read, `to` meant). Used before grading a
 * handwritten answer as wrong: if one of them is right, the app asks whether it read the digit well.
 */
export function oneDigitSwaps(a: Answer, from: number, to: number): Answer[] {
  if (from === to) return []
  switch (a.type) {
    case 'number': return swapIn(a.value, from, to).map((value) => ({ ...a, value }))
    case 'numbers': return swapList(a.values, from, to).map((values) => ({ ...a, values }))
    case 'digits': return swapRow(a.digits, from, to).map((digits) => ({ ...a, digits }))
    case 'steps': return [
      ...swapList(a.values, from, to).map((values) => ({ ...a, values })),
      ...swapIn(a.total ?? null, from, to).map((total) => ({ ...a, total })),
    ]
    case 'division': return [
      ...swapIn(a.quotient, from, to).map((quotient) => ({ ...a, quotient })),
      ...swapIn(a.remainder, from, to).map((remainder) => ({ ...a, remainder })),
    ]
    case 'long-mul': return [
      ...a.rows.flatMap((row, r) => swapRow(row, from, to).map((nr) => ({ ...a, rows: a.rows.map((x, k) => (k === r ? nr : x)) }))),
      ...swapRow(a.total, from, to).map((total) => ({ ...a, total })),
    ]
    default: return []
  }
}

/** A handwritten digit as the misread check needs it. altP: the probability of each alternative (same order). */
export interface ReadDigit { key: string; digit: number; confidence: number; alternatives: number[]; altP?: number[] }

/** Below this confidence a read is "doubtful" for the masking question (it never changes the grade). */
export const MASK_CONFIDENCE = 0.9
/** How often a doubtful read that does not change the grade is asked about anyway, so the question never gives the
 *  answer away (asked only when a digit fixes the answer, it would mean "you are wrong"). */
export const MASK_RATE = 0.25
/** An alternative this likely makes even a confident read worth a question. */
export const ALT_MIN_P = 0.1

/** The read was not clear: low confidence, or one alternative is not negligible. */
function unclear(r: ReadDigit, alt?: number): boolean {
  if (r.confidence < MASK_CONFIDENCE) return true
  const p = r.altP ?? []
  if (alt == null) return p.some((x) => x > ALT_MIN_P)
  return (p[r.alternatives.indexOf(alt)] ?? 0) > ALT_MIN_P
}

/**
 * Which written digit to ask about before grading, or null to grade as it is.
 * - The answer is wrong, the read was not clear (below MASK_CONFIDENCE, or that alternative had a probability above
 *   ALT_MIN_P) and changing the digit to that alternative makes it right: ask about that digit (alt: the fixing one).
 * - Otherwise, a read below MASK_CONFIDENCE is asked about MASK_RATE of the time (random() is injectable), offering
 *   its best alternative. Both questions look alike, so the question never means "you are wrong".
 * A clear read is graded as it is. Never changes a digit by itself: the child answers the question.
 */
export function misreadToAsk(
  a: Answer, correct: boolean, reads: readonly ReadDigit[], isRight: (a: Answer) => boolean, random: () => number,
): { key: string; fixes: boolean; alt?: number } | null {
  if (!reads.length) return null
  const byDoubt = [...reads].sort((x, y) => x.confidence - y.confidence)
  if (!correct) {
    for (const r of byDoubt) {
      for (const alt of r.alternatives) {
        if (unclear(r, alt) && oneDigitSwaps(a, r.digit, alt).some(isRight)) return { key: r.key, fixes: true, alt }
      }
    }
  }
  const doubtful = byDoubt.filter((r) => r.confidence < MASK_CONFIDENCE)
  if (doubtful.length && random() < MASK_RATE) {
    const r = doubtful[0]
    return { key: r.key, fixes: false, ...(r.alternatives.length ? { alt: r.alternatives[0] } : {}) }
  }
  return null
}
