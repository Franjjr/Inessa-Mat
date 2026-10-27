/* Encuentra el error and Comprobar (docs/curriculum/PLAN_DOCENTE.md §5, DIDACTICA §1.3).
   - error-hunt: a column calculation is shown with its result. Sometimes the result is right; sometimes it carries
     the classic mistake of a bug model: the carry not added (carry-forgot), the borrow not paid back (borrow-forgot),
     a single-digit fact that is off (fact), or a digit written in the wrong column (place-value). The child decides,
     and when there is an error marks the column and writes the right result.
   - check-calc: a claim «left op right = claimed» (sometimes false, with one of the same kinds of error). The child
     writes the check operation (claimed − right, claimed + right, or divisor × quotient + remainder) and decides.
   Every wrong value is produced by a bug model and checked to be genuinely wrong. Errors are tagged with their type
   (ErrorType), so the adult report can say «en qué falla». Hints never state the right result. */
import type {
  Answer, CheckCalcExercise, CheckResult, ErrorHuntExercise, ErrorType, Hint, Rng,
} from '@/types'
import { digitAt, digitCount, fromDigits } from './arith'
import { columnName } from './feedback'
import { genAddOperands, genMul2x1, genSubPair } from './numbers'
import { pick, randInt, shuffle } from './rng'
import { checkSkill, huntSkill, type CheckOp, type HuntOp } from './skills'

// ---------------------------------------------------------------- bug models

/** Addition where no column passes a carry: each column keeps only its own units. */
export function addWithoutCarry(ops: readonly number[]): number {
  const cols = Math.max(...ops.map(digitCount))
  const digits: number[] = []
  for (let i = 0; i < cols; i++) digits.push(ops.reduce((s, n) => s + digitAt(n, i), 0) % 10)
  return fromDigits(digits)
}

/** Subtraction that borrows but never pays the ten back (the lender keeps its digit). */
export function subBorrowForgot(minuend: number, subtrahend: number): number {
  const cols = digitCount(minuend)
  const digits: number[] = []
  for (let i = 0; i < cols; i++) {
    const a = digitAt(minuend, i)
    const b = digitAt(subtrahend, i)
    digits.push(a >= b ? a - b : a + 10 - b)
  }
  return fromDigits(digits)
}

/** 2-digit × 1-digit where the carry of the units is never added to the tens. */
export function mulCarryForgot(top: number, bottom: number): number {
  const units = (top % 10) * bottom
  const tens = Math.floor(top / 10) * bottom
  return tens * 10 + (units % 10)
}

/** One digit of n moved by delta (±1) in column `col`; null when the digit would leave 0..9. */
export function nudgeDigit(n: number, col: number, delta: number): number | null {
  if (col >= digitCount(n)) return null
  const d = digitAt(n, col)
  const nd = d + delta
  if (nd < 0 || nd > 9) return null
  return n + (nd - d) * 10 ** col
}

/** Two neighbouring digits of n swapped (a digit written in the wrong column); null when they are equal. */
export function swapDigits(n: number, i: number, j: number): number | null {
  if (i >= digitCount(n) || j >= digitCount(n)) return null
  const a = digitAt(n, i)
  const b = digitAt(n, j)
  if (a === b) return null
  return n + (b - a) * 10 ** i + (a - b) * 10 ** j
}

/** First column (units = 0) where two numbers differ, or null when they are equal. */
export function firstDifferentColumn(a: number, b: number): number | null {
  const cols = Math.max(digitCount(a), digitCount(b))
  for (let i = 0; i < cols; i++) if (digitAt(a, i) !== digitAt(b, i)) return i
  return null
}

interface Bug { value: number; type: ErrorType }

/** The bugs that fit an operation, in random order, each one a genuinely different value. */
function bugsFor(op: 'add' | 'sub' | 'mul', operands: number[], rng: Rng): Bug[] {
  const out: Bug[] = []
  const add = (value: number, type: ErrorType) => {
    if (value >= 0) out.push({ value, type })
  }
  const [x, y] = operands
  if (op === 'add') add(addWithoutCarry([x, y]), 'carry-forgot')
  if (op === 'sub') add(subBorrowForgot(x, y), 'borrow-forgot')
  if (op === 'mul') add(mulCarryForgot(x, y), 'carry-forgot')
  return shuffle(rng, out)
}

/**
 * A wrong result of the same family as `answer`: one of three kinds, in a random order so every kind shows up: the bug
 * model of the operation (carry or borrow forgotten), one digit off by one («fact»), or two neighbouring digits swapped
 * («place-value»). The order is random; each kind is genuinely wrong.
 */
function wrongValue(answer: number, models: Bug[], rng: Rng): Bug | null {
  const fromModel = (): Bug | null => {
    const valid = models.filter((b) => b.value !== answer && b.value >= 0)
    return valid.length ? valid[0] : null
  }
  const fromFact = (): Bug | null => {
    const cols = digitCount(answer)
    for (const col of shuffle(rng, Array.from({ length: cols }, (_, i) => i))) {
      for (const delta of shuffle(rng, [1, -1])) {
        const v = nudgeDigit(answer, col, delta)
        if (v !== null && v !== answer && v >= 0) return { value: v, type: 'fact' }
      }
    }
    return null
  }
  const fromPlace = (): Bug | null => {
    const cols = digitCount(answer)
    for (const i of shuffle(rng, Array.from({ length: Math.max(0, cols - 1) }, (_, k) => k))) {
      const v = swapDigits(answer, i, i + 1)
      if (v !== null && v !== answer) return { value: v, type: 'place-value' }
    }
    return null
  }
  const order = pick(rng, [
    [fromModel, fromFact, fromPlace],
    [fromFact, fromPlace, fromModel],
    [fromPlace, fromModel, fromFact],
  ])
  for (const make of order) {
    const bug = make()
    if (bug) return bug
  }
  return null
  return null
}

// ---------------------------------------------------------------- encuentra el error

/** Two operands of the operation with the carries (add), borrows (sub) or the carry (mul) the bug needs. */
function operandsForHunt(op: HuntOp, rng: Rng): [number, number] | null {
  if (op === 'add') {
    const digits = pick(rng, [2, 3])
    // Capped: the sum keeps the digits of the operands (never past 999, the top of 2.º).
    return genAddOperands(rng, digits, randInt(rng, 1, digits - 1), digits, true)
  }
  if (op === 'sub') {
    const digits = pick(rng, [2, 3])
    return genSubPair(rng, digits, randInt(rng, 1, digits - 1))
  }
  return genMul2x1(rng, true)
}

const HUNT_SYMBOL: Record<HuntOp, string> = { add: '+', sub: '−', mul: '×' }

/** An encuentra el error. `wrong` decides whether the shown result carries an error (it is then tagged). */
export function genErrorHunt(op: HuntOp, rng: Rng, wrong: boolean): ErrorHuntExercise {
  for (let attempt = 0; attempt < 120; attempt++) {
    const pair = operandsForHunt(op, rng)
    if (!pair) continue
    const [top, bottom] = pair
    const answer = op === 'add' ? top + bottom : op === 'sub' ? top - bottom : top * bottom
    let shown = answer
    let errorType: ErrorType | null = null
    if (wrong) {
      const models = bugsFor(op, [top, bottom], rng)
      const bug = wrongValue(answer, models, rng)
      if (!bug) continue
      shown = bug.value
      errorType = bug.type
    }
    const wrongColumn = firstDifferentColumn(shown, answer)
    if (wrong !== (wrongColumn !== null)) continue
    const digits = Math.max(digitCount(top), digitCount(bottom), digitCount(answer))
    return {
      id: `error-hunt:${op}:${top}${HUNT_SYMBOL[op]}${bottom}=${shown}`,
      kind: 'error-hunt',
      skill: huntSkill(op),
      difficulty: op === 'mul' ? 3 : digits >= 3 ? 3 : 2,
      op, top, bottom, shown, answer, wrongColumn, errorType,
    }
  }
  throw new Error(`bugs: no ${op} calculation could be built`)
}

// ---------------------------------------------------------------- comprobar

/** A claim with the check operation the child writes. `ok` decides whether the claim is true. */
export function genCheckCalc(op: CheckOp, rng: Rng, ok: boolean): CheckCalcExercise {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (op === 'div') {
      const d = randInt(rng, 2, 9)
      const q = randInt(rng, 2, Math.min(99, Math.floor(999 / d)))
      const r = randInt(rng, 0, d - 1)
      const dividend = d * q + r
      let claimedQ = q
      let claimedR = r
      let errorType: ErrorType | null = null
      if (!ok) {
        const kind = pick(rng, ['quotient-off', 'remainder-too-big', 'place-value'] as const)
        if (kind === 'quotient-off') { claimedQ = q + 1; errorType = 'quotient-off' }
        if (kind === 'remainder-too-big') { claimedR = r + d; errorType = 'remainder-too-big' }
        if (kind === 'place-value') {
          const v = q >= 10 ? swapDigits(q, 0, 1) : null
          if (v === null) continue
          claimedQ = v
          errorType = 'place-value'
        }
      }
      const isOk = claimedQ === q && claimedR === r
      if (isOk !== ok) continue
      return {
        id: `check-calc:div:${dividend}/${d}=${claimedQ}r${claimedR}`,
        kind: 'check-calc', skill: checkSkill('div'), difficulty: 3,
        op: 'div', left: dividend, right: d, claimed: claimedQ, remainder: claimedR,
        answer: d * claimedQ + claimedR, ok: isOk, errorType,
      }
    }
    if (op === 'add') {
      const digits = pick(rng, [2, 3])
      const pair = genAddOperands(rng, digits, randInt(rng, 0, digits - 1))
      if (!pair) continue
      const [l, r] = pair
      const sum = l + r
      let claimed = sum
      let errorType: ErrorType | null = null
      if (!ok) {
        const bug = wrongValue(sum, bugsFor('add', [l, r], rng), rng)
        if (!bug) continue
        claimed = bug.value
        errorType = bug.type
      }
      if ((claimed === sum) !== ok) continue
      return {
        id: `check-calc:add:${l}+${r}=${claimed}`, kind: 'check-calc', skill: checkSkill('add'), difficulty: digits === 3 ? 3 : 2,
        op: 'add', left: l, right: r, claimed, answer: claimed - r, ok, errorType,
      }
    }
    // sub
    const digits = pick(rng, [2, 3])
    const pair = genSubPair(rng, digits, randInt(rng, 0, digits - 1))
    if (!pair) continue
    const [m, s] = pair
    const diff = m - s
    let claimed = diff
    let errorType: ErrorType | null = null
    if (!ok) {
      const bug = wrongValue(diff, bugsFor('sub', [m, s], rng), rng)
      if (!bug) continue
      claimed = bug.value
      errorType = bug.type
    }
    if ((claimed === diff) !== ok) continue
    return {
      id: `check-calc:sub:${m}-${s}=${claimed}`, kind: 'check-calc', skill: checkSkill('sub'), difficulty: digits === 3 ? 3 : 2,
      op: 'sub', left: m, right: s, claimed, answer: claimed + s, ok, errorType,
    }
  }
  throw new Error(`bugs: no ${op} claim could be built`)
}

// ---------------------------------------------------------------- grading

/** Child-facing comment for each kind of mistake (shown after a wrong verdict). */
const MISSED: Record<ErrorType, string> = {
  'carry-forgot': '¡Ojo con la mochila! Hay una llevada que no se ha sumado en esa cuenta.',
  'borrow-forgot': 'Cuando la vecina presta una decena, se queda con una menos. ¡Mira esa resta!',
  fact: 'Hay una cuenta de una sola cifra que no sale. Mira la cuenta columna a columna.',
  'place-value': 'Hay una cifra escrita en una columna que no le toca. Mira el sitio de cada cifra.',
  'clock-hour': 'La hora del reloj no es esa. Mira la aguja corta.',
  'clock-minute': 'Los minutos no son esos. Cuenta con la aguja larga de cinco en cinco.',
  'clock-period': 'Ese momento del día no es el que toca. Mira si es de la mañana, de la tarde o de la noche.',
  'quotient-off': 'Si el cociente es demasiado grande o pequeño, el resto no cuadra. Revisa la prueba.',
  'remainder-too-big': 'El resto tiene que ser más pequeño que el divisor. ¡Cabe una vez más!',
  'false-alarm': 'Esa cuenta estaba bien. Compruébala otra vez, columna a columna.',
  'bar-placement': 'Revisa el dibujo: cada número va en su parte.',
  step: 'Revisa el primer paso de la historia.',
  operation: 'Revisa la operación: ¿se juntan, se quitan, se repiten o se reparten?',
  other: 'Revisa la cuenta con calma.',
  'fraction-parts': 'Mira si las partes son del mismo tamaño antes de contarlas.',
  'fraction-count': 'Cuenta bien: arriba las partes de color, abajo todas las partes iguales.',
  'geo-name': 'Mira bien la figura: cuenta sus lados y esquinas, y fíjate en cómo es.',
  'geo-perimeter': 'Para el contorno hay que sumar todos los lados, ni uno más ni uno menos.',
  'left-right': 'Mira bien hacia qué lado está: izquierda o derecha.',
  'carry-wrong': 'En cada casa solo cabe una cifra: revisa las llevadas.',
  misaligned: 'Coloca las cifras empezando por la derecha: unidades debajo de unidades.',
  'smaller-from-larger': 'Resta siempre el número pequeño del grande, en cada columna.',
  'zero-borrow': 'Cuidado con el cero: no tiene nada que prestar. Pide a la casa siguiente.',
  incomplete: 'Te falta algo por escribir.',
  recognition: 'Revisa la cuenta con calma.',
  'dont-know': 'Revisa la cuenta con calma.',
  'word-class': 'Esa palabra no es de la clase que se pide. Mira otra vez qué hace o cómo es.',
  'word-form': 'La palabra cambiada no es esa. Revisa el género, el número o la terminación.',
  'sentence-part': 'Esa palabra no está en la parte de la frase que se pide. Piensa quién hace la acción.',}

export const HUNT_FEEDBACK = {
  right: '¡Muy bien! La cuenta está bien. Comprobarla también es aprender.',
  falseAlarm: 'Esta cuenta estaba bien. Compruébala otra vez, columna a columna.',
  wrongColumn: '¡Casi! Mira otra vez: ¿en qué columna empieza el error?',
  wrongValue: 'La columna es la buena, pero el número correcto es otro. Vuelve a calcular esa columna.',
  incomplete: 'Primero di si la cuenta está bien. Si no lo está, marca la columna y escribe el resultado.',
  correct: '¡Lo has encontrado! Cada error tiene su columna.',
}

export const CHECK_FEEDBACK = {
  correct: '¡Muy bien! Has comprobado con la operación contraria.',
  falseAlarm: 'La cuenta estaba bien: la prueba sale igual. ¡No dudes de ti!',
  value: '¡Casi! Escribe bien la cuenta de comprobación.',
  incomplete: 'Escribe la cuenta de comprobación y di si la cuenta está bien.',
}

/** Grades an encuentra el error: the verdict, then the column and the right result when there is an error. */
export function checkErrorHunt(ex: ErrorHuntExercise, answer: Answer): CheckResult {
  const expected = ex.wrongColumn === null ? 'bien' : `columna ${ex.wrongColumn + 1}: ${ex.answer}`
  const shown = String(ex.shown)
  if (answer.type !== 'hunt') return { correct: false, given: '', expected, errorType: 'other', feedback: '¿Me lo escribes otra vez?' }
  if (answer.ok === null || answer.ok === undefined) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: HUNT_FEEDBACK.incomplete }
  const right = ex.wrongColumn === null
  if (right) {
    if (answer.ok) return { correct: true, given: 'bien', expected, feedback: HUNT_FEEDBACK.right }
    return { correct: false, given: 'error', expected, errorType: 'false-alarm', feedback: HUNT_FEEDBACK.falseAlarm }
  }
  const type: ErrorType = ex.errorType ?? 'other'
  if (answer.ok === true) return { correct: false, given: `bien (${shown})`, expected, errorType: type, feedback: MISSED[type] }
  if (answer.column === null || answer.column === undefined) {
    return { correct: false, given: 'error', expected, errorType: 'incomplete', feedback: HUNT_FEEDBACK.incomplete }
  }
  const given = `error en la columna ${answer.column + 1}: ${answer.value ?? '?'}`
  if (answer.column !== ex.wrongColumn) return { correct: false, given, expected, errorType: type, wrongColumns: [answer.column], feedback: HUNT_FEEDBACK.wrongColumn }
  if (answer.value === null || answer.value === undefined) return { correct: false, given, expected, errorType: 'incomplete', feedback: HUNT_FEEDBACK.incomplete }
  if (answer.value !== ex.answer) return { correct: false, given, expected, errorType: type, wrongColumns: [ex.wrongColumn], feedback: HUNT_FEEDBACK.wrongValue }
  return { correct: true, given, expected, feedback: HUNT_FEEDBACK.correct }
}

/** Grades a comprobar: the verdict and the check operation (the number the check gives). */
export function checkCheckCalc(ex: CheckCalcExercise, answer: Answer): CheckResult {
  const expected = `${ex.answer}; ${ex.ok ? 'bien' : 'mal'}`
  if (answer.type !== 'verdict') return { correct: false, given: '', expected, errorType: 'other', feedback: '¿Me lo escribes otra vez?' }
  if (answer.ok === null || answer.ok === undefined || answer.value === null || answer.value === undefined) {
    return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: CHECK_FEEDBACK.incomplete }
  }
  const given = `${answer.value} ${answer.ok ? 'bien' : 'mal'}`
  if (answer.ok !== ex.ok) {
    const type: ErrorType = ex.ok ? 'false-alarm' : ex.errorType ?? 'other'
    return { correct: false, given, expected, errorType: type, feedback: ex.ok ? CHECK_FEEDBACK.falseAlarm : MISSED[type] }
  }
  if (answer.value !== ex.answer) return { correct: false, given, expected, errorType: 'fact', feedback: CHECK_FEEDBACK.value }
  return { correct: true, given, expected, feedback: CHECK_FEEDBACK.correct }
}

// ---------------------------------------------------------------- hints

const HUNT_WORKED: Record<ErrorType, string> = {
  'carry-forgot': 'Mira las llevadas: ¿has sumado la que viene de la columna de la derecha?',
  'borrow-forgot': 'Cuando la vecina presta una decena, ¿se queda con una menos?',
  fact: 'Revisa una sola cuenta de una cifra: ¿cuánto da de verdad?',
  'place-value': 'Revisa en qué columna está cada cifra del resultado.',
  'clock-hour': 'Revisa la aguja corta: ¿qué hora marca?',
  'clock-minute': 'Revisa la aguja larga: ¿cuántos minutos cuenta?',
  'clock-period': 'Revisa el momento del día.',
  'quotient-off': 'Revisa cuántas veces cabe el divisor.',
  'remainder-too-big': 'Revisa que el resto sea más pequeño que el divisor.',
  'false-alarm': 'Repasa la cuenta columna a columna.',
  'bar-placement': 'Repasa la cuenta columna a columna.',
  step: 'Repasa la cuenta columna a columna.',
  operation: 'Repasa la cuenta columna a columna.',
  other: 'Repasa la cuenta columna a columna.',
  'fraction-parts': 'Repasa si las partes son iguales.',
  'fraction-count': 'Repasa qué número va arriba y cuál abajo.',
  'geo-name': 'Repasa la figura lado a lado.',
  'geo-perimeter': 'Repasa que has sumado todos los lados.',
  'left-right': 'Repasa hacia qué lado está cada cosa.',
  'carry-wrong': 'Repasa las llevadas, una a una.',
  misaligned: 'Repasa que cada cifra esté en su columna.',
  'smaller-from-larger': 'Resta siempre el número pequeño del grande, en cada columna.',
  'zero-borrow': 'Cuidado con el cero al pedir prestado.',
  incomplete: 'Repasa la cuenta columna a columna.',
  recognition: 'Repasa la cuenta columna a columna.',
  'dont-know': 'Repasa la cuenta columna a columna.',
  'word-class': 'Mira qué hace la palabra o cómo es: ¿responde a qué pregunta?',
  'word-form': 'Cambia solo lo que se pide (género, número o tiempo) y revisa la terminación.',
  'sentence-part': 'Pregúntate quién hace la acción: esa parte es el sujeto.',}

/** Hints of an encuentra el error: the method, the column, then the kind of mistake, never the right result. */
export function huntHints(ex: ErrorHuntExercise): Hint[] {
  const where = ex.wrongColumn !== null ? ` Mira bien las ${columnName(ex.wrongColumn)}.` : ' Si todas las columnas salen bien, la cuenta está bien.'
  const params = { a: ex.top, b: ex.bottom, digits: Math.max(digitCount(ex.top), digitCount(ex.bottom), digitCount(ex.shown)) }
  return [
    { level: 1, text: 'Repasa la cuenta desde las unidades, columna a columna. Puede haber un solo error.', visual: 'none' },
    { level: 2, text: 'Mira cada columna: ¿lo que se escribe es lo que sale de hacer esa columna?', visual: 'place-value', params },
    { level: 3, text: `${ex.errorType ? HUNT_WORKED[ex.errorType] : 'Repasa la cuenta columna a columna.'}${where}`, visual: 'none' },
  ]
}

/** Hints of a comprobar: which operation checks which, then the check written out (the number is the child's). */
export function checkHints(ex: CheckCalcExercise): Hint[] {
  const l1 = ex.op === 'sub'
    ? 'Para comprobar una resta, suma el resultado y el número de abajo: ¿sale el de arriba?'
    : ex.op === 'add'
      ? 'Para comprobar una suma, resta el número de abajo al resultado: ¿sale el otro número?'
      : 'Para comprobar una división, multiplica el divisor por el cociente y suma el resto: ¿sale el dividendo?'
  const l3 = ex.op === 'sub'
    ? `${ex.claimed} + ${ex.right} = ?`
    : ex.op === 'add'
      ? `${ex.claimed} − ${ex.right} = ?`
      : `${ex.right} × ${ex.claimed} + ${ex.remainder ?? 0} = ?`
  return [
    { level: 1, text: l1, visual: 'none' },
    { level: 2, text: 'Escribe la cuenta de comprobación. Después decide si la cuenta de arriba está bien.', visual: 'none' },
    { level: 3, text: `Cuenta: ${l3}`, visual: 'none' },
  ]
}
