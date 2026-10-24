/* Independent reference arithmetic for tests (string based, deliberately different from src/engine/arith.ts). */
import type { Answer, Exercise } from '@/types'

const digitsOf = (n: number) => String(n).split('').reverse().map(Number)

/** Number of columns that produce a carry, computed on decimal strings. */
export function refCarryCount(ops: number[]): number {
  const strs = ops.map((o) => String(o).split('').reverse())
  const width = Math.max(...strs.map((s) => s.length))
  let carry = 0
  let count = 0
  for (let i = 0; i < width; i++) {
    const s = strs.reduce((acc, d) => acc + Number(d[i] ?? '0'), 0) + carry
    carry = s >= 10 ? Math.floor(s / 10) : 0
    if (carry) count++
  }
  return count
}

/** Carry written above each column (index 0 = units), padded to the answer length. */
export function refCarries(ops: number[]): number[] {
  const sum = ops.reduce((a, b) => a + b, 0)
  const width = Math.max(String(sum).length, ...ops.map((o) => String(o).length))
  const out = [0]
  let carry = 0
  for (let i = 0; i < width - 1; i++) {
    const s = ops.reduce((acc, o) => acc + (Math.floor(o / 10 ** i) % 10), 0) + carry
    carry = Math.floor(s / 10)
    out.push(carry)
  }
  return out
}

/** Borrow flags (regrouping) computed with a different formulation: compare suffixes. Column i borrows when the
    lower part of the minuend (columns 0..i) is smaller than the lower part of the subtrahend. */
export function refBorrowed(m: number, s: number): boolean[] {
  const width = String(m).length
  const out: boolean[] = []
  for (let i = 0; i < width; i++) {
    const mod = 10 ** (i + 1)
    out.push(m % mod < s % mod)
  }
  return out
}

/** Borrow across zero: some column i borrows and the minuend digit i+1 is 0. */
export function refZeroBorrow(m: number, s: number): boolean {
  const b = refBorrowed(m, s)
  const md = digitsOf(m)
  return b.some((x, i) => x && md[i + 1] === 0)
}

/** The answer a perfect child would give, in the Answer shape the views send. */
export function correctAnswer(ex: Exercise): Answer {
  switch (ex.kind) {
    case 'skip-count':
    case 'double-chain':
      return { type: 'numbers', values: [...ex.answer] }
    case 'fact-family':
      return { type: 'facts', facts: [...ex.answer] }
    case 'column-add':
    case 'column-sub':
    case 'column-mul':
      return { type: 'digits', digits: digitsOf(ex.answer) }
    case 'division':
      return { type: 'division', quotient: ex.quotient, remainder: ex.remainder }
    case 'word-problem':
      return ex.remainder ? { type: 'division', quotient: ex.answer, remainder: ex.remainder } : { type: 'number', value: ex.answer }
    case 'compare':
      return { type: 'sign', sign: ex.answer }
    case 'order':
      return { type: 'numbers', values: [...ex.answer] }
    case 'place-value':
      return Array.isArray(ex.answer) ? { type: 'numbers', values: [...ex.answer] } : { type: 'number', value: ex.answer }
    case 'fraction-shade':
      return { type: 'shade', chosen: Array.from({ length: ex.numerator }, (_, i) => i) }
    case 'fraction-read':
      return { type: 'fraction', numerator: ex.numerator, denominator: ex.denominator }
    case 'fraction-equal':
      return { type: 'marks', marked: [...ex.unequal] }
    case 'angle-tap':
      return { type: 'marks', marked: [...ex.rightCorners] }
    case 'shape-choice':
      return { type: 'choice', index: ex.answer }
    case 'fraction-of':
    case 'perimeter':
    case 'shape-count':
      return { type: 'number', value: ex.answer }
    case 'decimal':
      if (ex.mode === 'compare') return { type: 'sign', sign: ex.answer as '<' | '>' | '=' }
      if (ex.mode === 'money') return { type: 'numbers', values: [Math.floor(ex.value / 100), ex.value % 100] }
      return { type: 'numbers', values: [Math.floor(ex.value / 100), ex.places === 1 ? Math.floor((ex.value % 100) / 10) : ex.value % 100] }
    case 'decimal-op':
      return { type: 'numbers', values: [Math.floor(ex.answer / 100), ex.places === 1 ? Math.floor((ex.answer % 100) / 10) : ex.answer % 100] }
    default:
      return { type: 'number', value: ex.answer as number }
  }
}

export const digits = (n: number): number[] => digitsOf(n)
