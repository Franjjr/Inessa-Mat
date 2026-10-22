/* Pure helpers for the subtraction methods: the written steps each method expects, and the number-line stops.
   Numbers are non-negative integers with minuend > subtrahend (the generator guarantees it). Digits are units first. */
import { digitAt, digitCount } from './arith'

/** Digits of n, units first, padded with zeros to `width`. */
function digitsOf(n: number, width: number): number[] {
  return Array.from({ length: width }, (_, i) => digitAt(n, i))
}

/**
 * «Pedir prestado arriba». For each column k >= 1 the value its top digit takes after it lends a ten (the lender
 * loses one, and the zeros it crosses turn into 9). null where the column does not change. Column 0 never has a mark.
 */
export function borrowMarks(minuend: number, subtrahend: number): (number | null)[] {
  const width = digitCount(minuend)
  const top = digitsOf(minuend, width)
  const bottom = digitsOf(subtrahend, width)
  const marks: (number | null)[] = Array.from({ length: width }, () => null)
  for (let i = 0; i < width; i++) {
    if (top[i] >= bottom[i]) continue
    let j = i + 1
    while (j < width && top[j] === 0) j++
    if (j >= width) break
    top[j] -= 1
    marks[j] = top[j]
    for (let k = j - 1; k > i; k--) {
      top[k] = 9
      marks[k] = 9
    }
    top[i] += 10
  }
  return marks
}

/**
 * «Me llevo una abajo» (compensación). borrows[k] = 1 when column k takes a ten (top[k] < bottom[k] + borrows[k-1]);
 * the column above k+1 then gets its subtrahend digit raised by one: marks[k+1] = (bottom[k+1] + 1) mod 10.
 * Returns the per-column marks (null where no +1 falls) and the borrows, both units first.
 */
export function compensationSteps(minuend: number, subtrahend: number): { marks: (number | null)[]; borrows: number[]; adjusted: number[] } {
  const width = digitCount(minuend)
  const top = digitsOf(minuend, width)
  const bottom = digitsOf(subtrahend, width)
  const marks: (number | null)[] = Array.from({ length: width }, () => null)
  const borrows: number[] = []
  const adjusted: number[] = []
  let carryIn = 0
  for (let k = 0; k < width; k++) {
    const sub = bottom[k] + carryIn
    if (carryIn) marks[k] = sub % 10
    adjusted.push(sub)
    const out = top[k] < sub ? 1 : 0
    borrows.push(out)
    carryIn = out
  }
  return { marks, borrows, adjusted }
}

/** The non-zero parts of the subtrahend, largest first: 127 → [100, 20, 7]. */
export function subtrahendParts(subtrahend: number): number[] {
  const width = digitCount(subtrahend)
  const parts: number[] = []
  for (let k = width - 1; k >= 0; k--) {
    const d = digitAt(subtrahend, k)
    if (d > 0) parts.push(d * 10 ** k)
  }
  return parts
}

/** Results after each part is taken away: 352 − 127 → [252, 232, 225]. The last one is the answer. */
export function partsResults(minuend: number, subtrahend: number): number[] {
  const out: number[] = []
  let v = minuend
  for (const p of subtrahendParts(subtrahend)) {
    v -= p
    out.push(v)
  }
  return out
}

/**
 * Number-line stops for «contar hacia delante» from the subtrahend up to the minuend (the minuend itself is not a
 * stop). Order: first the next ten, then the largest thousand/hundred/ten that still lies before the minuend.
 * 352 − 127 → [130, 300, 350]: jumps of 3, 170, 50 and 2 (the last jump lands on 352). Every stop is strictly
 * between the two numbers and strictly after the previous one.
 */
export function lineStops(subtrahend: number, minuend: number): number[] {
  const out: number[] = []
  let at = subtrahend
  const land = (p: number) => {
    if (p > at && p < minuend) {
      out.push(p)
      at = p
    }
  }
  if (at % 10 !== 0) land(Math.ceil(at / 10) * 10)
  for (const unit of [1000, 100, 10]) land(Math.floor(minuend / unit) * unit)
  return out
}
