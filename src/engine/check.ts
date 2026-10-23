/* check(exercise, answer): pure, deterministic grading + diagnosis + warm Spanish feedback.
   Every Answer shape is accepted where it makes sense (a column answer may arrive as a plain number, a division
   as just the quotient...). `given`/`expected` are compact normalised strings for logs and dashboards.
   wrongColumns: column ops → column indexes (0 = units); skip-count/double-chain → indexes into the answer array;
   fact-family → indexes of the wrong facts in the given list. */
import type {
  Answer, CheckResult, ColumnAddExercise, ColumnMulExercise, ColumnSubExercise, DivisionExercise, DoubleChainExercise,
  Exercise, FactDivExercise, FactFamilyExercise, FactMulExercise, MissingFactorExercise, SkipCountExercise,
  WordProblemExercise, BarProblemExercise, ErrorHuntExercise, CheckCalcExercise,
} from '@/types'
import { checkBar } from './bars'
import { checkCheckCalc, checkErrorHunt } from './bugs'
import { climbProducts, divisionParts } from './divParts'
import { digitCount, toDigits } from './arith'
import { diagnoseAdd, diagnoseDivision, diagnoseMul, diagnoseSub, valueOf } from './diagnose'
import { FEEDBACK, columnName, praise, praiseFact } from './feedback'
import { borrowMarks, compensationSteps, lineStops, subtrahendParts } from './subMethods'
import { strategyForFact } from './strategies'
import { checkCalc } from './calc'
import { checkNumeric } from './numeric'
import { checkClock, expectedClock } from './clock'
import { checkFractionEqual, checkFractionOf, checkFractionRead, checkFractionShade } from './fractions'
import { checkAngleTap, checkPerimeter, checkShapeChoice, checkShapeCount } from './geometry'
import { checkMoney } from './money'
import { checkMeasure } from './measure'
import { checkChance, checkChart } from './data'
import { checkPattern } from './patterns'
import { checkMulParts } from './bigops'
import { checkArea } from './geometry'
import { checkPosition } from './position'

// ---------------------------------------------------------------- answer normalisation

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** A single number from any answer shape; null = empty; undefined = shape that cannot hold a number. */
function numberFrom(answer: Answer): number | null | undefined {
  switch (answer.type) {
    case 'number': return isNum(answer.value) ? answer.value : null
    case 'digits': {
      const d = answer.digits
      if (d.every((x) => x === null || x === undefined)) return null
      // Inner blanks make the number unreadable.
      const top = d.reduce<number>((acc, x, i) => (x !== null && x !== undefined ? i : acc), -1)
      for (let i = 0; i <= top; i++) if (!isNum(d[i])) return null
      return valueOf(d.slice(0, top + 1) as number[])
    }
    case 'numbers': return answer.values.length === 1 ? (isNum(answer.values[0]) ? answer.values[0] : null) : undefined
    case 'division': return isNum(answer.quotient) ? answer.quotient : null
    case 'facts': return undefined
  }
}

function numbersFrom(answer: Answer, expectedLength: number): (number | null)[] | undefined {
  if (answer.type === 'numbers') return answer.values.map((v) => (isNum(v) ? v : null))
  if (expectedLength === 1) {
    const n = numberFrom(answer)
    return n === undefined ? undefined : [n]
  }
  return undefined
}

/** Units-first digit cells from a column answer (or a plain number). */
function digitsFrom(answer: Answer): { digits: (number | null)[]; carries?: (number | null)[] } | undefined {
  if (answer.type === 'digits') {
    return {
      digits: answer.digits.map((d) => (isNum(d) ? d : null)),
      carries: answer.carries?.map((c) => (isNum(c) ? c : null)),
    }
  }
  if (answer.type === 'number') return { digits: isNum(answer.value) && answer.value >= 0 ? toDigits(answer.value) : [] }
  return undefined
}

function showDigits(digits: readonly (number | null)[]): string {
  let top = -1
  digits.forEach((d, i) => { if (d !== null && d !== 0) top = i })
  if (top < 0) return digits.some((d) => d === 0) ? '0' : '?'
  // A cell holding more than one digit ("15" written in one box) is shown in brackets so logs stay unambiguous.
  return digits.slice(0, top + 1).map((d) => (d === null ? '?' : d >= 0 && d <= 9 ? String(d) : `[${d}]`)).reverse().join('')
}

const show = (n: number | null | undefined) => (n === null || n === undefined ? '?' : String(n))

function wrongShape(expected: string): CheckResult {
  return { correct: false, given: '', expected, errorType: 'other', feedback: FEEDBACK.wrongShape }
}

function incomplete(given: string, expected: string, wrongColumns?: number[]): CheckResult {
  const r: CheckResult = { correct: false, given, expected, errorType: 'incomplete', feedback: given === '?' || given === '' ? FEEDBACK.empty : FEEDBACK.incomplete }
  if (wrongColumns && wrongColumns.length) r.wrongColumns = wrongColumns
  return r
}

// ---------------------------------------------------------------- facts

function checkFactMul(ex: FactMulExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  const v = numberFrom(answer)
  if (v === undefined) return wrongShape(expected)
  if (v === null) return incomplete('?', expected)
  const given = String(v)
  const strategy = strategyForFact(ex.a, ex.b)
  if (v === ex.answer) return { correct: true, given, expected, feedback: praiseFact(ex.id, strategy) }
  if (v === ex.a + ex.b) return { correct: false, given, expected, errorType: 'operation', feedback: FEEDBACK.factAdded(ex.a, ex.b) }
  const neighbours: [number, number][] = [[ex.a, ex.b - 1], [ex.a, ex.b + 1], [ex.a - 1, ex.b], [ex.a + 1, ex.b]]
  const nb = neighbours.find(([x, y]) => x >= 1 && y >= 1 && x * y === v)
  const feedback = nb ? FEEDBACK.factNeighbour(v, nb[0], nb[1], strategy) : FEEDBACK.factWrong(strategy)
  return { correct: false, given, expected, errorType: 'fact', feedback }
}

function checkFactDiv(ex: FactDivExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  const v = numberFrom(answer)
  if (v === undefined) return wrongShape(expected)
  if (v === null) return incomplete('?', expected)
  const given = String(v)
  if (v === ex.answer) return { correct: true, given, expected, feedback: praise(ex.id) }
  const ops = [ex.dividend - ex.divisor, ex.dividend + ex.divisor, ex.dividend * ex.divisor]
  if (ops.includes(v)) return { correct: false, given, expected, errorType: 'operation', feedback: FEEDBACK.divOperation(ex.dividend, ex.divisor) }
  return { correct: false, given, expected, errorType: 'fact', feedback: FEEDBACK.divWrong(ex.dividend, ex.divisor) }
}

function checkMissing(ex: MissingFactorExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  const v = numberFrom(answer)
  if (v === undefined) return wrongShape(expected)
  if (v === null) return incomplete('?', expected)
  const given = String(v)
  if (v === ex.answer) return { correct: true, given, expected, feedback: praiseFact(ex.id, strategyForFact(ex.a, ex.b)) }
  const known = ex.missing === 'a' ? ex.b : ex.a
  if (v === ex.product) return { correct: false, given, expected, errorType: 'other', feedback: FEEDBACK.missingProduct(ex.product) }
  if (v === ex.product - known || v === ex.product + known) {
    return { correct: false, given, expected, errorType: 'operation', feedback: FEEDBACK.missingWrong(known, ex.product) }
  }
  return { correct: false, given, expected, errorType: 'fact', feedback: FEEDBACK.missingWrong(known, ex.product) }
}

function checkSequence(ex: SkipCountExercise | DoubleChainExercise, answer: Answer): CheckResult {
  const expectedValues = ex.answer
  const expected = expectedValues.join(', ')
  const vals = numbersFrom(answer, expectedValues.length)
  if (!vals) return wrongShape(expected)
  const given = expectedValues.map((_, i) => show(vals[i])).join(', ')
  const empty = expectedValues.flatMap((_, i) => (vals[i] === null || vals[i] === undefined ? [i] : []))
  if (empty.length === expectedValues.length) return incomplete('?', expected)
  if (empty.length) return incomplete(given, expected, empty)
  const wrong = expectedValues.flatMap((v, i) => (vals[i] !== v ? [i] : []))
  if (wrong.length === 0) {
    const fb = ex.kind === 'double-chain' ? praiseFact(ex.id, strategyForFact(ex.start, 2 ** ex.steps)) : praise(ex.id)
    return { correct: true, given, expected, feedback: fb }
  }
  return {
    correct: false, given, expected, errorType: 'fact', wrongColumns: wrong,
    feedback: ex.kind === 'skip-count' ? FEEDBACK.skipWrong(ex.step) : FEEDBACK.chainWrong,
  }
}

function checkCount(ex: Exercise & { answer: number }, answer: Answer, a: number, b: number, isArray: boolean): CheckResult {
  const expected = String(ex.answer)
  const v = numberFrom(answer)
  if (v === undefined) return wrongShape(expected)
  if (v === null) return incomplete('?', expected)
  const given = String(v)
  if (v === ex.answer) return { correct: true, given, expected, feedback: praise(ex.id) }
  if (v === a + b) return { correct: false, given, expected, errorType: 'operation', feedback: FEEDBACK.groupsAdded }
  return { correct: false, given, expected, errorType: 'fact', feedback: isArray ? FEEDBACK.arrayWrong(a, b) : FEEDBACK.groupsWrong(a, b) }
}

// ---------------------------------------------------------------- fact family

interface ParsedFact { op: 'x' | '/'; l: number; r: number; res: number }

/** Accepts "6x7=42", "6 × 7 = 42", "6*7=42", "42:6=7", "42 ÷ 6 = 7", "42/6=7" and the mirrored "42 = 6 × 7". */
export function parseFact(text: string): ParsedFact | null {
  const s = text
    .replace(/[×xX*·⋅✕]/g, 'x')
    .replace(/[÷:/]/g, '/')
    .replace(/\s+/g, '')
  let m = s.match(/^(\d+)([x/])(\d+)=(\d+)$/)
  if (m) return { op: m[2] as 'x' | '/', l: Number(m[1]), r: Number(m[3]), res: Number(m[4]) }
  m = s.match(/^(\d+)=(\d+)([x/])(\d+)$/)
  if (m) return { op: m[3] as 'x' | '/', l: Number(m[2]), r: Number(m[4]), res: Number(m[1]) }
  return null
}

const factKey = (f: ParsedFact) => `${f.l}${f.op}${f.r}=${f.res}`
const factTrue = (f: ParsedFact) => (f.op === 'x' ? f.l * f.r === f.res : f.r !== 0 && f.l === f.r * f.res)
const prettyFact = (key: string) => key.replace('x', '×').replace('/', '÷')

function checkFamily(ex: FactFamilyExercise, answer: Answer): CheckResult {
  const expectedKeys = ex.answer.map((s) => factKey(parseFact(s)!))
  const expectedSet = [...new Set(expectedKeys)]
  const expected = expectedKeys.map(prettyFact).join('; ')
  if (answer.type !== 'facts') return wrongShape(expected)
  const facts: unknown[] = Array.isArray(answer.facts) ? answer.facts : []
  const written = facts
    .map((f, i) => ({ i, text: typeof f === 'string' ? f.trim() : f === null || f === undefined ? '' : String(f).trim() }))
    .filter((f) => f.text !== '')
  if (written.length === 0) return incomplete('?', expected)
  const parsed = written.map((w) => ({ ...w, fact: parseFact(w.text) }))
  const given = parsed.map((p) => (p.fact ? prettyFact(factKey(p.fact)) : p.text)).join('; ')
  // "6 ÷ 42 = 7": the right numbers in the wrong order (the big number goes first in a division).
  const reversed = parsed.filter((p) => p.fact && p.fact.op === '/' && !factTrue(p.fact) && p.fact.r === p.fact.l * p.fact.res).map((p) => p.i)
  const falseOnes = parsed.filter((p) => p.fact && !factTrue(p.fact) && !reversed.includes(p.i)).map((p) => p.i)
  const unparsed = parsed.filter((p) => !p.fact).map((p) => p.i)
  const keys = parsed.filter((p) => p.fact).map((p) => factKey(p.fact!))
  const foreign = parsed.filter((p) => p.fact && factTrue(p.fact) && !expectedSet.includes(factKey(p.fact))).map((p) => p.i)
  const distinctGood = new Set(keys.filter((k) => expectedSet.includes(k)))
  const allGood = falseOnes.length === 0 && unparsed.length === 0 && foreign.length === 0 && reversed.length === 0
  if (allGood && distinctGood.size === expectedSet.length && keys.length === new Set(keys).size) {
    return { correct: true, given, expected, feedback: praise(ex.id) }
  }
  const base = { correct: false as const, given, expected }
  if (falseOnes.length) return { ...base, errorType: 'fact', wrongColumns: falseOnes, feedback: FEEDBACK.familyFact }
  if (unparsed.length || foreign.length || reversed.length) {
    return { ...base, errorType: 'other', wrongColumns: [...unparsed, ...foreign, ...reversed].sort((a, b) => a - b), feedback: FEEDBACK.familyOther(ex.a, ex.b, ex.product) }
  }
  if (keys.length !== new Set(keys).size) {
    const seen = new Set<string>()
    const dups = parsed.filter((p) => { const k = factKey(p.fact!); if (seen.has(k)) return true; seen.add(k); return false }).map((p) => p.i)
    return { ...base, errorType: 'other', wrongColumns: dups, feedback: FEEDBACK.familyRepeated }
  }
  return { ...base, errorType: 'incomplete', feedback: FEEDBACK.familyIncomplete(ex.a, ex.b, ex.product) }
}

// ---------------------------------------------------------------- column ops

/** Cells holding more than one digit (e.g. "15" typed in one box) or negative values. */
function bigCells(digits: readonly (number | null)[]): number[] {
  return digits.flatMap((d, i) => (d !== null && (d > 9 || d < 0 || !Number.isInteger(d)) ? [i] : []))
}

interface ColumnInput { digits: (number | null)[]; carries?: (number | null)[] }

/** Shared pre-checks: blanks inside the answer, value, extra non-zero digits beyond the answer.
    `required` = how many low columns must be filled in. A blank leading cell that only the final carry would fill
    (768 + 457 written as "225") is not "incomplete": it is diagnosed like a 0 (a forgotten carry). */
function columnPrecheck(input: ColumnInput, answer: number, cols: number, required = digitCount(answer)): { empty: number[]; extra: boolean; value: number } {
  const len = digitCount(answer)
  const empty: number[] = []
  for (let i = 0; i < Math.min(len, required); i++) if (input.digits[i] === null || input.digits[i] === undefined) empty.push(i)
  let extra = false
  for (let i = len; i < Math.max(cols, input.digits.length); i++) if ((input.digits[i] ?? 0) !== 0) extra = true
  return { empty, extra, value: valueOf(input.digits) }
}

function checkColumnAdd(ex: ColumnAddExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  const input = digitsFrom(answer)
  if (!input) return wrongShape(expected)
  const opCols = Math.max(...ex.operands.map(digitCount))
  const len = digitCount(ex.answer)
  // The final carry may have been written in the carry row instead of the result row (e.g. 768 + 457).
  if (len > opCols && input.digits[len - 1] == null && input.carries?.[len - 1] === toDigits(ex.answer)[len - 1]) {
    input.digits = input.digits.slice()
    input.digits[len - 1] = input.carries[len - 1]!
  }
  const given = showDigits(input.digits)
  const big = bigCells(input.digits)
  if (big.length) return { correct: false, given, expected, errorType: 'carry-wrong', wrongColumns: big, feedback: FEEDBACK.carryWrong }
  const { empty, extra, value } = columnPrecheck(input, ex.answer, Math.max(opCols, len), opCols)
  if (input.digits.every((d) => d === null)) return incomplete('?', expected)
  if (empty.length) return incomplete(given, expected, empty)
  if (!extra && value === ex.answer) {
    return { correct: true, given, expected, feedback: FEEDBACK.addCorrect(ex.carries.filter((c) => c > 0).length, ex.id) }
  }
  const d = diagnoseAdd(ex.operands, input.digits, input.carries)
  const feedback =
    d.errorType === 'carry-forgot' ? FEEDBACK.carryForgot(d.focus ?? d.wrongColumns)
      : d.errorType === 'carry-wrong' ? FEEDBACK.carryWrong
        : d.errorType === 'misaligned' ? FEEDBACK.misaligned
          : FEEDBACK.addFact(d.wrongColumns)
  return { correct: false, given, expected, errorType: d.errorType, wrongColumns: d.wrongColumns, feedback }
}

/* Subtraction methods: the written steps. Marks in the column (pedir prestado arriba, me llevo una abajo) are graded
   only where the child writes them: an empty mark is not wrong, a written one must match the step the method needs. */
const SUB_STEP_FEEDBACK = {
  borrowMark: (col: number) => `¡Casi! Revisa la cifra que has tachado en las ${columnName(col)}: al prestar, la vecina se queda con una menos.`,
  carryMark: (col: number) => `¡Casi! Revisa la cifra de abajo de las ${columnName(col)}: le sumas 1 cuando la columna de la derecha se lleva.`,
  partsWrong: (step: number, from: number, part: number) => `¡Casi! Revisa el paso ${step}: a ${from} hay que quitarle ${part}.`,
  partsCorrect: '¡Muy bien! Has restado por partes, paso a paso.',
  lineWrong: (step: number, from: number, to: number) => `¡Casi! El salto ${step} va de ${from} hacia ${to}: cuenta hacia delante, sin pasarte.`,
  lineTotal: 'Los saltos ya están bien colocados. Suma cuánto has avanzado en total.',
  lineCorrect: '¡Muy bien! Has contado con saltos hasta llegar.',
} as const

/** Columns (units = 0) where a written subtraction mark does not match what the method needs at that point. */
function markErrors(ex: ColumnSubExercise, answer: Extract<Answer, { type: 'digits' }>): number[] {
  if (!answer.carries) return []
  const expected = answer.method === 'carry' ? compensationSteps(ex.minuend, ex.subtrahend).marks : borrowMarks(ex.minuend, ex.subtrahend)
  const wrong: number[] = []
  for (let i = 1; i < expected.length; i++) {
    const written = answer.carries[i]
    if (!isNum(written)) continue
    if (written !== expected[i]) wrong.push(i)
  }
  return wrong
}

function checkSubParts(ex: ColumnSubExercise, values: (number | null)[]): CheckResult {
  const expected = String(ex.answer)
  const parts = subtrahendParts(ex.subtrahend)
  const given = values.slice(0, parts.length).map((v) => (isNum(v) ? String(v) : '?')).join(' · ')
  if (parts.some((_, k) => !isNum(values[k]))) return incomplete(given, expected)
  let from = ex.minuend
  for (let k = 0; k < parts.length; k++) {
    const v = values[k] as number
    if (v !== from - parts[k]) {
      return { correct: false, given, expected, errorType: 'fact', feedback: SUB_STEP_FEEDBACK.partsWrong(k + 1, from, parts[k]) }
    }
    from = v
  }
  return { correct: true, given, expected, feedback: SUB_STEP_FEEDBACK.partsCorrect }
}

function checkSubLine(ex: ColumnSubExercise, values: (number | null)[], total: number | null | undefined): CheckResult {
  const expected = String(ex.answer)
  const stops = lineStops(ex.subtrahend, ex.minuend)
  const given = values.slice(0, stops.length).map((v) => (isNum(v) ? String(v) : '?')).join(' → ') + (isNum(total) ? ` = ${total}` : '')
  if (stops.some((_, k) => !isNum(values[k])) || !isNum(total)) return incomplete(given, expected)
  let at = ex.subtrahend
  for (let k = 0; k < stops.length; k++) {
    const v = values[k] as number
    if (v <= at || v >= ex.minuend) {
      return { correct: false, given, expected, errorType: 'other', feedback: SUB_STEP_FEEDBACK.lineWrong(k + 1, at, ex.minuend) }
    }
    at = v
  }
  if (total !== ex.answer) return { correct: false, given, expected, errorType: 'other', feedback: SUB_STEP_FEEDBACK.lineTotal }
  return { correct: true, given, expected, feedback: SUB_STEP_FEEDBACK.lineCorrect }
}

function checkColumnSub(ex: ColumnSubExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  if (answer.type === 'steps') {
    return answer.method === 'parts'
      ? checkSubParts(ex, answer.values)
      : checkSubLine(ex, answer.values, answer.total)
  }
  const input = digitsFrom(answer)
  if (!input) return wrongShape(expected)
  const cols = digitCount(ex.minuend)
  const len = digitCount(ex.answer)
  const given = showDigits(input.digits)
  const big = bigCells(input.digits)
  if (big.length) return { correct: false, given, expected, errorType: 'other', wrongColumns: big, feedback: FEEDBACK.oneDigitPerCell }
  const { empty, extra, value } = columnPrecheck(input, ex.answer, cols)
  if (empty.length === len && input.digits.every((x) => x === null || x === undefined)) return incomplete('?', expected)
  if (empty.length) return incomplete(given, expected, empty)
  if (!extra && value === ex.answer) {
    const marks = answer.type === 'digits' ? markErrors(ex, answer) : []
    if (marks.length) {
      const msg = answer.type === 'digits' && answer.method === 'carry' ? SUB_STEP_FEEDBACK.carryMark : SUB_STEP_FEEDBACK.borrowMark
      return { correct: false, given, expected, errorType: 'borrow-forgot', wrongColumns: marks, feedback: msg(marks[0]) }
    }
    return { correct: true, given, expected, feedback: FEEDBACK.subCorrect(ex.borrowed.filter(Boolean).length, ex.id) }
  }
  const d = diagnoseSub(ex.minuend, ex.subtrahend, input.digits)
  const feedback =
    d.errorType === 'smaller-from-larger' ? FEEDBACK.smallerFromLarger
      : d.errorType === 'zero-borrow' ? FEEDBACK.zeroBorrow
        : d.errorType === 'borrow-forgot' ? FEEDBACK.borrowForgot
          : d.errorType === 'misaligned' ? FEEDBACK.misaligned
            : d.errorType === 'other' ? FEEDBACK.subAdded
              : FEEDBACK.subFact(d.wrongColumns)
  return { correct: false, given, expected, errorType: d.errorType, wrongColumns: d.wrongColumns, feedback }
}

function checkColumnMul(ex: ColumnMulExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  const input = digitsFrom(answer)
  if (!input) return wrongShape(expected)
  const len = digitCount(ex.answer)
  const given = showDigits(input.digits)
  const big = bigCells(input.digits)
  if (big.length) return { correct: false, given, expected, errorType: 'carry-wrong', wrongColumns: big, feedback: FEEDBACK.carryWrongMul }
  const { empty, extra, value } = columnPrecheck(input, ex.answer, len, 2)
  if (input.digits.every((d) => d === null)) return incomplete('?', expected)
  if (empty.length) return incomplete(given, expected, empty)
  if (!extra && value === ex.answer) {
    return { correct: true, given, expected, feedback: FEEDBACK.mulCorrect(ex.id) }
  }
  const d = diagnoseMul(ex.top, ex.bottom, input.digits)
  const feedback =
    d.errorType === 'carry-forgot' ? FEEDBACK.carryForgot(d.wrongColumns.filter((c) => c >= 1).slice(0, 1))
      : d.errorType === 'carry-wrong' ? FEEDBACK.carryWrongMul
        : d.errorType === 'operation' ? FEEDBACK.mulAdded(ex.bottom)
        : FEEDBACK.mulFact(d.wrongColumns.filter((c) => c < len).length ? d.wrongColumns.filter((c) => c < len) : d.wrongColumns)
  return { correct: false, given, expected, errorType: d.errorType, wrongColumns: d.wrongColumns, feedback }
}

// ---------------------------------------------------------------- division

const showDivision = (q: number | null, r: number | null) => `${show(q)} resto ${show(r)}`

function checkDivision(ex: DivisionExercise, answer: Answer): CheckResult {
  const expected = showDivision(ex.quotient, ex.remainder)
  let q: number | null
  let r: number | null
  if (answer.type === 'division') {
    q = isNum(answer.quotient) ? answer.quotient : null
    r = isNum(answer.remainder) ? answer.remainder : null
  } else {
    const n = numberFrom(answer)
    if (n === undefined) return wrongShape(expected)
    q = n
    r = null
  }
  // An exact division may leave the remainder box empty.
  if (r === null && ex.remainder === 0 && q !== null) r = 0
  const given = showDivision(q, r)
  if (q === null && r === null) return incomplete('?', expected)
  if (q === null || r === null) return incomplete(given, expected)
  if (q === ex.quotient && r === ex.remainder) return { correct: true, given, expected, feedback: FEEDBACK.divCorrect(ex.id) }
  if (q < 0 || r < 0) return { correct: false, given, expected, errorType: 'other', feedback: FEEDBACK.divisionOther }
  const d = diagnoseDivision(ex.dividend, ex.divisor, q, r)
  const feedback =
    d.errorType === 'remainder-too-big' ? FEEDBACK.remainderTooBig(ex.divisor)
      : d.detail === 'too-big' ? FEEDBACK.quotientTooBig(q, ex.divisor, ex.dividend)
        : d.detail === 'too-small' ? FEEDBACK.quotientTooSmall
          : d.detail === 'remainder' ? FEEDBACK.remainderWrong(ex.dividend, q * ex.divisor)
            : d.detail === 'bring-down' ? FEEDBACK.bringDown
              : d.detail === 'stopped' ? FEEDBACK.divisionStopped
                : d.detail === 'reversed' ? FEEDBACK.divisionReversed
                  : d.detail === 'operation' ? FEEDBACK.divisionOperation(ex.dividend, ex.divisor)
                    : d.detail === 'near' ? FEEDBACK.divisionNear(ex.divisor, ex.dividend)
                      : d.detail === 'digit' ? FEEDBACK.divisionFact(ex.divisor)
                        : FEEDBACK.divisionOther
  return { correct: false, given, expected, errorType: d.errorType, feedback }
}

/* «Repartir por partes» and «Multiplicar hacia arriba»: the written steps. The total and the remainder count at the end;
   a part that is written wrong is named (the step), never the right number. */
const DIV_METHOD_FEEDBACK = {
  partWrong: (step: number, partial: number, divisor: number) =>
    `¡Casi! Revisa el paso ${step}: ¿cuántas veces cabe el ${divisor} en ${partial}?`,
  partsIncomplete: 'Escribe el cociente de cada parte y después el total.',
  partsTotal: 'Ya tienes bien las partes. Ahora suma sus cocientes: ese es el cociente.',
  climbWrong: (row: number, divisor: number) => `¡Casi! Revisa la fila ${row}: ¿cuánto es ${divisor} por ${row}?`,
  climbIncomplete: 'Sigue subiendo: escribe la siguiente fila hasta pasarte del dividendo.',
  climbOver: 'Te has pasado: para en la primera fila que llega o pasa del dividendo.',
  remainder: 'El cociente está bien: ahora revisa el resto.',
}

function checkDivisionParts(ex: DivisionExercise, answer: Extract<Answer, { type: 'division-parts' }>): CheckResult {
  const steps = divisionParts(ex.dividend, ex.divisor)
  const expected = showDivision(ex.quotient, ex.remainder)
  const written = steps.map((_, k) => answer.parts[k] ?? null)
  const given = written.map((v) => show(v)).join(' + ') + (answer.quotient === null ? '' : ` = ${answer.quotient}`)
  if (written.some((v) => v === null) || answer.quotient === null) return incomplete(given, expected)
  for (let k = 0; k < steps.length; k++) {
    if (written[k] !== steps[k].quotient) {
      return { correct: false, given, expected, errorType: 'fact', wrongColumns: [k], feedback: DIV_METHOD_FEEDBACK.partWrong(k + 1, steps[k].partial, ex.divisor) }
    }
  }
  const total = steps.reduce((sum, s) => sum + s.quotient, 0)
  if (answer.quotient !== total) return { correct: false, given, expected, errorType: 'other', feedback: DIV_METHOD_FEEDBACK.partsTotal }
  if (answer.remainder === null) return incomplete(given, expected)
  if (answer.remainder !== ex.remainder) return { correct: false, given, expected, errorType: 'other', feedback: DIV_METHOD_FEEDBACK.remainder }
  return { correct: true, given, expected, feedback: FEEDBACK.divCorrect(ex.id) }
}

function checkClimb(ex: DivisionExercise, answer: Extract<Answer, { type: 'climb' }>): CheckResult {
  const products = climbProducts(ex.dividend, ex.divisor)
  const stop = products.findIndex((p) => p >= ex.dividend)
  const expected = showDivision(ex.quotient, ex.remainder)
  const written = answer.products
  const filled = written.map((v, k) => (v === null || v === undefined ? -1 : k)).filter((k) => k >= 0)
  const given = written.filter((v) => v !== null && v !== undefined).join(' · ')
  if (filled.length === 0) return incomplete('?', expected)
  for (const k of filled) {
    if (written[k] !== products[k]) {
      return { correct: false, given, expected, errorType: 'fact', wrongColumns: [k], feedback: DIV_METHOD_FEEDBACK.climbWrong(k + 1, ex.divisor) }
    }
  }
  if (filled[filled.length - 1] > stop) return { correct: false, given, expected, errorType: 'other', feedback: DIV_METHOD_FEEDBACK.climbOver }
  if (!filled.includes(stop)) return incomplete(given, expected)
  if (answer.remainder === null || answer.remainder === undefined) return incomplete(given, expected)
  if (answer.remainder !== ex.remainder) return { correct: false, given, expected, errorType: 'other', feedback: DIV_METHOD_FEEDBACK.remainder }
  return { correct: true, given, expected, feedback: FEEDBACK.divCorrect(ex.id) }
}

/** A division may come as the galera answer, the parts or the climb, whatever method the view used. */
function checkDivisionAny(ex: DivisionExercise, answer: Answer): CheckResult {
  if (answer.type === 'division-parts') return checkDivisionParts(ex, answer)
  if (answer.type === 'climb') return checkClimb(ex, answer)
  return checkDivision(ex, answer)
}

// ---------------------------------------------------------------- word problems

function opValue(op: WordProblemExercise['op'], a: number, b: number): number | null {
  switch (op) {
    case 'add': return a + b
    case 'sub': return Math.abs(a - b)
    case 'mul': return a * b
    case 'div': return b !== 0 && a % b === 0 ? a / b : a > b && b !== 0 ? Math.floor(a / b) : null
  }
}

function checkWord(ex: WordProblemExercise, answer: Answer): CheckResult {
  const hasRem = (ex.remainder ?? 0) > 0
  const expected = hasRem ? showDivision(ex.answer, ex.remainder!) : String(ex.answer)
  let v: number | null | undefined
  let r: number | null = null
  if (answer.type === 'division') {
    v = isNum(answer.quotient) ? answer.quotient : null
    r = isNum(answer.remainder) ? answer.remainder : null
  } else v = numberFrom(answer)
  if (v === undefined) return wrongShape(expected)
  if (v === null) return incomplete('?', expected)
  const given = answer.type === 'division' && hasRem ? showDivision(v, r) : String(v)
  const remOk = answer.type !== 'division' ? true : hasRem ? r === ex.remainder : r === null || r === 0
  if (v === ex.answer && remOk) return { correct: true, given, expected, feedback: FEEDBACK.wordCorrect(ex.answer, ex.unit) }
  const [a, b] = ex.operands
  if (v !== ex.answer) {
    const others = (['add', 'sub', 'mul', 'div'] as const).filter((o) => o !== ex.op)
    if (others.some((o) => opValue(o, a, b) === v)) {
      return { correct: false, given, expected, errorType: 'operation', feedback: FEEDBACK.wordOperation[ex.op] }
    }
  }
  if (hasRem && v === ex.answer && r !== null && r >= b) {
    return { correct: false, given, expected, errorType: 'remainder-too-big', feedback: FEEDBACK.remainderTooBig(b) }
  }
  return { correct: false, given, expected, errorType: 'fact', feedback: FEEDBACK.wordFact }
}

// ---------------------------------------------------------------- dispatcher

/** The expected answer as text, for logs when the child's answer has no usable shape. */
function expectedText(ex: Exercise): string {
  if (ex.kind === 'division') return showDivision(ex.quotient, ex.remainder)
  if (ex.kind === 'fact-family') return ex.answer.map(prettyFact).join('; ')
  const a: unknown = (ex as { answer?: unknown }).answer
  if (Array.isArray(a)) return a.join(', ')
  return a === undefined ? '' : String(a)
}

/** Check an answer and diagnose the error type. Pure and deterministic. */
export function check(exercise: Exercise, answer: Answer): CheckResult {
  if (!answer || typeof answer !== 'object') return wrongShape(expectedText(exercise))
  switch (exercise.kind) {
    case 'fact-mul': return checkFactMul(exercise, answer)
    case 'fact-div': return checkFactDiv(exercise, answer)
    case 'missing-factor': return checkMissing(exercise, answer)
    case 'skip-count':
    case 'double-chain': return checkSequence(exercise, answer)
    case 'groups': return checkCount(exercise, answer, exercise.groups, exercise.perGroup, false)
    case 'array': return checkCount(exercise, answer, exercise.rows, exercise.cols, true)
    case 'fact-family': return checkFamily(exercise, answer)
    case 'column-add': return checkColumnAdd(exercise, answer)
    case 'column-sub': return checkColumnSub(exercise, answer)
    case 'column-mul': return checkColumnMul(exercise, answer)
    case 'division': return checkDivisionAny(exercise, answer)
    case 'word-problem': return checkWord(exercise, answer)
    case 'place-value':
    case 'compare':
    case 'order':
    case 'round':
    case 'number-line': return checkNumeric(exercise, answer)
    case 'mental':
    case 'equation': return checkCalc(exercise, answer) ?? wrongShape(expectedText(exercise))
    case 'bar-problem': return checkBar(exercise as BarProblemExercise, answer)
    case 'error-hunt': return checkErrorHunt(exercise as ErrorHuntExercise, answer)
    case 'check-calc': return checkCheckCalc(exercise as CheckCalcExercise, answer)
    case 'clock-read':
    case 'clock-set':
    case 'time-convert':
    case 'time-duration':
    case 'calendar': return checkClock(exercise, answer) ?? wrongShape(expectedClock(exercise))
    // fracciones and geometría (block E)
    case 'fraction-shade': return checkFractionShade(exercise, answer)
    case 'fraction-read': return checkFractionRead(exercise, answer)
    case 'fraction-of': return checkFractionOf(exercise, answer)
    case 'fraction-equal': return checkFractionEqual(exercise, answer)
    case 'shape-choice': return checkShapeChoice(exercise, answer)
    case 'angle-tap': return checkAngleTap(exercise, answer)
    case 'perimeter': return checkPerimeter(exercise, answer)
    case 'shape-count': return checkShapeCount(exercise, answer)
    case 'money': return checkMoney(exercise, answer)
    case 'measure': return checkMeasure(exercise, answer)
    case 'chart': return checkChart(exercise, answer)
    case 'chance': return checkChance(exercise, answer)
    case 'pattern': return checkPattern(exercise, answer)
    case 'position': return checkPosition(exercise, answer)
    case 'mul-parts': return checkMulParts(exercise, answer)
    case 'area': return checkArea(exercise, answer)
  }
}
