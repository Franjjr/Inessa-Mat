/* Progressive hints: level 1 recalls the strategy (text only), level 2 shows a visual scaffold, level 3 works
   one step and leaves the final answer for the child ("= ?"). Params feed the HintVisual renderer. */
import type {
  ColumnAddExercise, ColumnMulExercise, ColumnSubExercise, DivisionExercise, DivMethod, Exercise, Hint, SkipCountExercise,
  SubMethod, TableMethod, WordProblemExercise,
} from '@/types'
import { analyzeAdd, analyzeSub, digitAt, digitCount } from './arith'
import { columnName, columnWithArticle } from './feedback'
import { strategyDetail, trickDetail } from './strategies'
import { compensationSteps, lineStops, partsResults, subtrahendParts } from './subMethods'
import { hintsCalc } from './calc'
import { fmt, hintsNumeric } from './numeric'
import { hintsClock } from './clock'
import { barHints } from './bars'
import { hintsMoney } from './money'
import { hintsDecimal } from './decimals'
import { hintsMeasure } from './measure'
import { hintsChance, hintsChart } from './data'
import { hintsPattern } from './patterns'
import { hintsMulParts } from './bigops'
import { hintsLongMul } from './longmul'
import { hintsOrdinal } from './ordinals'
import { hintsPosition } from './position'
import { checkHints, huntHints } from './bugs'
import { fractionHints } from './fractions'
import { geometryHints } from './geometry'
import { hintsLengua } from './lengua/exercises'
import { hintsEnglish } from './ingles/exercises'

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'], params?: Hint['params']): Hint =>
  params ? { level, text, visual, params } : { level, text, visual }

/** One trick for the three hints: the favourite trick (when it applies to the fact) gives the rule, its drawing and its
    worked step; otherwise the engine's own strategy does. */
function factHints(a: number, b: number, tableMethod?: TableMethod | null): Hint[] {
  const d = trickDetail(tableMethod, a, b) ?? strategyDetail(a, b)
  return [
    hint(1, d.strategy.text, 'none'),
    hint(2, d.visualText, d.strategy.visual, { ...d.visualParams }),
    hint(3, d.workedText, d.workedVisual, d.workedParams ?? { ...d.visualParams, a, b }),
  ]
}

/** «La vecina de las centenas te presta 1 centena, que son 10 decenas»: the lending column named by its unit. */
const UNIT_OF_COLUMN = ['1 unidad', '1 decena', '1 centena', '1 millar', '1 decena de millar']
function lendText(i: number): string {
  const lender = i + 1
  const keeps = lender === 3 ? 'él se queda con 1 menos' : 'ella se queda con 1 menos'
  const who = lender === 3 ? 'El vecino' : 'La vecina'
  return `${who} de ${columnWithArticle(lender)} te presta ${UNIT_OF_COLUMN[lender] ?? '1'}, que son 10 ${columnName(i)}: tú ganas 10 ${columnName(i)} y ${keeps}.`
}

function columnAddHints(ex: ColumnAddExercise): Hint[] {
  const ops = ex.operands
  const cols = Math.max(...ops.map(digitCount))
  const firstCarry = ex.carries.findIndex((c, i) => i > 0 && c > 0)
  const params = { operands: [...ops], a: ops[0], b: ops[1] ?? 0, digits: cols }
  let worked: string
  if (firstCarry > 0) {
    const i = firstCarry - 1
    const sum = ops.reduce((s, n) => s + digitAt(n, i), 0) + (ex.carries[i] ?? 0)
    const parts = ops.map((n) => String(digitAt(n, i)))
    if ((ex.carries[i] ?? 0) > 0) parts.unshift(String(ex.carries[i]))
    const next = i + 1 < cols
      ? `Ahora suma ${columnWithArticle(i + 1)} sin olvidar la llevada: ¿cuánto da?`
      : `Como ya no quedan más cifras, ese ${Math.floor(sum / 10)} baja directo al resultado. ¿Qué número sale?`
    worked = `${cap(columnName(i))}: ${parts.join(' + ')} = ${sum}. Escribe ${sum % 10} y me llevo ${Math.floor(sum / 10)} a ${columnWithArticle(i + 1)}. ${next}`
  } else {
    const u = ops.map((n) => String(digitAt(n, 0))).join(' + ')
    const t = ops.map((n) => String(digitAt(n, 1))).join(' + ')
    worked = `Unidades: ${u} = ${ops.reduce((s, n) => s + digitAt(n, 0), 0)}. Ahora las decenas: ${t} = ?`
  }
  return [
    hint(1, 'Empieza siempre por las unidades. Si te sale 10 o más, escribe las unidades y ¡me llevo una!', 'none'),
    hint(2, 'Coloca cada cifra en su casa: unidades debajo de unidades, decenas debajo de decenas… y suma casa por casa.', 'place-value', params),
    hint(3, worked, 'carry', { ...params, column: Math.max(0, firstCarry - 1), carry: firstCarry > 0 ? ex.carries[firstCarry] : 0 }),
  ]
}

function columnSubHints(ex: ColumnSubExercise): Hint[] {
  const { minuend: m, subtrahend: s } = ex
  const an = analyzeSub(m, s)
  const params = { a: m, b: s, digits: digitCount(m) }
  const i = ex.borrowed.findIndex(Boolean)
  if (i < 0) {
    return [
      hint(1, 'Empieza por las unidades y resta casa por casa: arriba menos abajo.', 'none'),
      hint(2, 'Mira las casas: unidades con unidades, decenas con decenas…', 'place-value', params),
      hint(3, `Unidades: ${digitAt(m, 0)} − ${digitAt(s, 0)} = ${digitAt(m, 0) - digitAt(s, 0)}. Ahora las decenas: ${digitAt(m, 1)} − ${digitAt(s, 1)} = ?`, 'borrow', { ...params, column: 1 }),
    ]
  }
  const zero = an.zeroChains.find((c) => c[0] === i)
  const top = digitAt(m, i) - (i > 0 && ex.borrowed[i - 1] ? 1 : 0)
  let worked: string
  if (zero) {
    const lender = zero[zero.length - 1]
    worked = `${cap(columnName(i))}: ${top} es menos que ${digitAt(s, i)}, y la vecina es un 0. Pide a ${columnWithArticle(lender)}: el ${digitAt(m, lender)} se queda en ${digitAt(m, lender) - 1}, cada 0 se convierte en 9 y tus ${columnName(i)} son ${top + 10}. ${top + 10} − ${digitAt(s, i)} = ?`
  } else {
    worked = `${cap(columnName(i))}: ${top} es menos que ${digitAt(s, i)}. La vecina de ${columnWithArticle(i + 1)} te presta 1 y su ${digitAt(m, i + 1)} se queda en ${digitAt(m, i + 1) - 1}. Ahora tienes ${top + 10}: ${top + 10} − ${digitAt(s, i)} = ?`
  }
  return [
    hint(1, 'Empieza por las unidades. Si arriba hay menos que abajo, ¡pide prestado a la vecina!', 'none'),
    hint(2, zero
      ? 'Si la vecina es un 0, no tiene nada que prestar: pide a la siguiente. El 0 se convierte en 10, presta 1 y se queda en 9.'
      : `${lendText(i)} ¡Táchala!`, 'borrow', { ...params, column: i }),
    hint(3, worked, 'borrow', { ...params, column: i }),
  ]
}

/* «Me llevo una abajo»: the same first column as «pedir prestado», but the ten goes to the top number and the 1 to the
   bottom number of the next column. The hints name the intermediate numbers only, never the difference. */
function carrySubHints(ex: ColumnSubExercise): Hint[] {
  const { minuend: m, subtrahend: s } = ex
  const { borrows, adjusted } = compensationSteps(m, s)
  const i = borrows.findIndex(Boolean)
  const params = { a: m, b: s, digits: digitCount(m) }
  if (i < 0) {
    return [
      hint(1, 'Empieza por las unidades y resta casa por casa: arriba menos abajo.', 'none'),
      hint(2, 'Mira las casas: unidades con unidades, decenas con decenas…', 'place-value', params),
      hint(3, `Unidades: ${digitAt(m, 0)} − ${digitAt(s, 0)} = ?`, 'borrow', { ...params, column: 0 }),
    ]
  }
  const next = i + 1
  const top = digitAt(m, i) + 10
  return [
    hint(1, 'Si arriba hay menos que abajo: ¡me llevo una! Súmale 10 al de arriba, y a la cifra de abajo de la casa de al lado súmale 1.', 'none'),
    hint(2, 'Si arriba hay menos que abajo, pon un 1 delante del de arriba (suma 10) y escribe un 1 pequeño junto a la cifra de abajo de la casa siguiente.', 'borrow', { ...params, column: i }),
    hint(3, `${cap(columnName(i))}: ${digitAt(m, i)} + 10 = ${top}. Resta ${top} − ${digitAt(s, i)} = ? Y abajo, en ${columnWithArticle(next)}: ${digitAt(s, next)} + 1 = ${adjusted[next]}.`, 'borrow', { ...params, column: i }),
  ]
}

/* «Por partes»: the subtrahend is split into its non-zero parts and taken away one at a time. The worked hint shows
   the first result only; the last one is left to the child. */
function partsSubHints(ex: ColumnSubExercise): Hint[] {
  const { minuend: m, subtrahend: s } = ex
  const parts = subtrahendParts(s)
  const results = partsResults(m, s)
  const params = { a: m, b: s, digits: digitCount(m) }
  const split = parts.join(' + ')
  const worked = parts.length > 1
    ? `${m} − ${parts[0]} = ${results[0]}. Ahora quita ${parts[1]}: ${results[0]} − ${parts[1]} = ?`
    : `${m} − ${parts[0]} = ?`
  return [
    hint(1, `Separa el número de abajo en partes: ${s} = ${split}. Quita una parte cada vez.`, 'none'),
    hint(2, `Empieza por la parte más grande: ${m} − ${parts[0]} = ?`, 'place-value', params),
    hint(3, worked, 'place-value', params),
  ]
}

/* «Saltos en la recta»: count forward from the subtrahend, first to a round number. The worked hint names the first
   jump's length (an intermediate), never the total. */
function lineSubHints(ex: ColumnSubExercise): Hint[] {
  const { minuend: m, subtrahend: s } = ex
  const stops = lineStops(s, m)
  const params = { a: m, b: s, digits: digitCount(m) }
  const first = stops[0]
  return [
    hint(1, `Empieza en ${fmt(s)} y cuenta hacia delante hasta ${fmt(m)}. Salta primero a un número redondo.`, 'none'),
    hint(2, first !== undefined
      ? `Desde ${fmt(s)}, el primer salto cae en ${fmt(first)}. ¿Cuánto hay de ${fmt(s)} a ${fmt(first)}?`
      : `Desde ${fmt(s)}, un salto de 10 llega a ${fmt(s)} + 10 = ? Sigue así hasta ${fmt(m)}.`, 'none'),
    hint(3, first !== undefined
      ? `De ${fmt(s)} a ${fmt(first)} hay ${fmt(first - s)}. Sigue contando: ¿cuánto hay de ${fmt(first)} al siguiente salto?`
      : `Cuenta de ${fmt(s)} hacia ${fmt(m)} con saltos de 10 y de 1. ¿Cuánto has sumado en total?`, 'none', params),
  ]
}

function subtractionHints(ex: ColumnSubExercise, method: SubMethod | undefined): Hint[] {
  switch (method) {
    case 'carry': return carrySubHints(ex)
    case 'parts': return partsSubHints(ex)
    case 'line': return lineSubHints(ex)
    default: return columnSubHints(ex)
  }
}

/* Column multiplication, house by house: every column is worked (its product, the carry it takes and the one it gives),
   and the last column is left for the child. Works for any number of digits on top (525 × 8 is three columns). */
function columnMulHints(ex: ColumnMulExercise): Hint[] {
  const top = ex.top
  const b = ex.bottom
  const cols = digitCount(top)
  const t = Math.floor(top / 10)
  const u = top % 10
  const params = { top, bottom: b, tens: t * 10, units: u }
  const parts: string[] = []
  let carry = 0
  let firstCarry = 0
  for (let i = 0; i < cols; i++) {
    const d = digitAt(top, i)
    const product = d * b
    const label = cap(columnName(i))
    const withCarry = carry > 0 ? `, más ${carry} = ${product + carry}` : ''
    if (i === cols - 1) {
      parts.push(carry > 0 ? `${label}: ${d} × ${b} = ${product}, más ${carry} = ?` : `${label}: ${d} × ${b} = ?`)
      break
    }
    const value = product + carry
    const next = Math.floor(value / 10)
    parts.push(next > 0
      ? `${label}: ${d} × ${b} = ${product}${withCarry}, escribo ${value % 10} y me llevo ${next}.`
      : `${label}: ${d} × ${b} = ${product}${withCarry}, escribo ${value}.`)
    if (next > 0 && firstCarry === 0) firstCarry = next
    carry = next
  }
  const split = Array.from({ length: cols }, (_, i) => digitAt(top, cols - 1 - i) * 10 ** (cols - 1 - i)).filter((p) => p > 0)
  return [
    hint(1, 'Multiplica primero las unidades, después las decenas y las demás casas. ¡No te olvides de sumar lo que te llevas!', 'none'),
    hint(2, `Parte el número: ${top} = ${split.join(' + ')}. Multiplica cada parte por ${b}.`, 'place-value', params),
    hint(3, parts.join(' '), 'carry', { ...params, column: 1, carry: firstCarry }),
  ]
}

/** The first number taken in the galera: the shortest left part of the dividend that holds the divisor. */
export function firstPartial(dividend: number, divisor: number): { digits: number; value: number } {
  const s = String(dividend)
  for (let k = 1; k <= s.length; k++) {
    const value = Number(s.slice(0, k))
    if (value >= divisor) return { digits: k, value }
  }
  return { digits: s.length, value: dividend }
}

/** Whether the text names one of the numbers the child has to find (the result, what is left over). */
function leaks(text: string, answers: number[]): boolean {
  const tokens = text.replace(/(\d) (\d)/g, '$1$2').split(/\D+/)
  return answers.some((a) => tokens.includes(String(a)))
}

/** The first candidate that names none of the answers (the last one names no number of the result at all). */
function safeText(candidates: string[], answers: number[]): string {
  return candidates.find((c) => !leaks(c, answers)) ?? candidates[candidates.length - 1]
}

/** «Mira la primera cifra, 5: el 8 no cabe. Coge dos cifras: 52. ¿Cuántas veces cabe el 8 en 52?» A number that is also
    the result or what is left over is not said (the hint would give it away). */
function firstStepText(n: number, d: number, answers: number[]): string {
  const first = Number(String(n)[0])
  const { digits, value } = firstPartial(n, d)
  const words = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco']
  const take = words[digits] ?? String(digits)
  const candidates = digits === 1
    ? [`Mira la primera cifra, el ${first}: ¿cuántas veces cabe el ${d} en el ${first}?`, `Mira la primera cifra: ¿cuántas veces cabe el ${d} en ella?`]
    : [
        `Mira la primera cifra, ${first}: el ${d} no cabe. Coge ${take} cifras: ${value}. ¿Cuántas veces cabe el ${d} en ${value}?`,
        `Mira la primera cifra: el ${d} no cabe. Coge ${take} cifras: ${value}. ¿Cuántas veces cabe el ${d} en ${value}?`,
        `Mira la primera cifra: el ${d} no cabe. Coge ${take} cifras. ¿Cuántas veces cabe el ${d} en ese número?`,
      ]
  return safeText([...candidates, 'Mira la primera cifra. Si el número que reparte no cabe, coge una cifra más. ¿Cuántas veces cabe?'], answers)
}

const GALERA_STEP = 'Escribe ese número debajo del número que reparte. Multiplícalo por el número que reparte, réstalo y baja la cifra siguiente.'
const SHORT_GALERA_STEP = 'Escribe ese número debajo del número que reparte. Lo que sobra, calcúlalo de cabeza y escríbelo pequeño, y baja la cifra siguiente.'
const LEFT_FIRST = 'Empieza por la izquierda: coge las cifras que hagan falta para que quepa el número que reparte.'
/** The galera without subtractions: the first hint never asks for a written «resta», it says what is done in the head. */
const SHORT_LEFT_FIRST = 'Empieza por la izquierda, como siempre. Hazlo de cabeza: lo que sobra al repartir se junta con la cifra siguiente. Escribe solo lo que sale en cada paso.'

/* A 2-digit divisor: estimate with the table of the rounded divisor, then check by multiplying by the real one. The
   estimate is written as a division to think about (24 : 8), never with its result. */
function twoDigitDivisorHints(ex: DivisionExercise, short: boolean): Hint[] {
  const { dividend: n, divisor: d } = ex
  const params = { total: n, groups: d, dividend: n, divisor: d }
  const { value } = firstPartial(n, d)
  const round = Math.round(d / 10) * 10
  const table = round / 10
  const think = `${Math.floor(value / 10)} : ${table}`
  const rounded = d % 10 === 0 ? `El ${d} ya es redondo` : `Redondea el ${d} a ${round}`
  const estimate = safeText([
    `Primer número: ${value}. ${rounded}: piensa en la tabla del ${table} (${think}) y comprueba multiplicando por ${d}.`,
    `${rounded}: piensa en la tabla del ${table} (${think}) y comprueba multiplicando por ${d}.`,
    `${rounded}: piensa en su tabla, sin el cero, y comprueba multiplicando por ${d}.`,
    'Redondea el número que reparte, piensa en su tabla y comprueba multiplicando por el número de verdad.',
  ], [ex.quotient, ex.remainder])
  return [
    hint(1, short ? SHORT_LEFT_FIRST : LEFT_FIRST, 'none'),
    hint(2, estimate, 'share', params),
    hint(3, `${short ? SHORT_GALERA_STEP : GALERA_STEP} Si al multiplicar te pasas, prueba uno menos. Si lo que sobra es ${d} o más, prueba uno más.`, 'share', params),
  ]
}

/* The galera. Level 1 says where to start, level 2 what sharing means, level 3 the first step with the real number
   («¿cuántas veces cabe el 8 en 52?»): it names the number to share, never a digit of the result. The retired methods
   («repartir por partes», «multiplicar hacia arriba») are explained with the galera too. */
function divisionHints(ex: DivisionExercise, method?: DivMethod): Hint[] {
  const short = method === 'galera-short'
  const { dividend: n, divisor: d, quotient: q } = ex
  if (d >= 10) return twoDigitDivisorHints(ex, short)
  const params = { total: n, groups: d, dividend: n, divisor: d }
  if (q < 10 && n < 100) {
    // One step: the table of the divisor, counted up to the dividend without passing it.
    return [
      hint(1, `¿Qué número de la tabla del ${d} se acerca más a ${n} sin pasarse?`, 'none'),
      hint(2, `Reparte ${n} en ${d} partes iguales. Lo que no se pueda repartir es lo que sobra.`, 'share', params),
      hint(3, `Cuenta de ${d} en ${d} y para antes de pasarte de ${n}: ¿cuántas veces has contado?`, 'share', params),
    ]
  }
  return [
    hint(1, short ? SHORT_LEFT_FIRST : LEFT_FIRST, 'none'),
    hint(2, `Reparte ${n} en ${d} partes iguales, cifra a cifra. Lo que no se pueda repartir es lo que sobra.`, 'share', params),
    hint(3, `${firstStepText(n, d, [q, ex.remainder])} ${short ? SHORT_GALERA_STEP : GALERA_STEP}`, 'share', params),
  ]
}

function skipHints(ex: SkipCountExercise): Hint[] {
  const h = ex.hiddenIndexes[0] ?? 1
  const prev = ex.values[h - 1] ?? 0
  return [
    hint(1, `Cuenta de ${ex.step} en ${ex.step}: suma ${ex.step} cada vez.`, 'none'),
    hint(2, `Mira los saltos: cada salto es de ${ex.step}.`, 'skip-count', { step: ex.step, start: ex.values[0], count: ex.values.length }),
    hint(3, `Después del ${prev} viene ${prev} + ${ex.step} = ?`, 'skip-count', { step: ex.step, start: ex.values[0], count: ex.values.length, index: h }),
  ]
}

/* Word problems: level 1 asks what happens in the story, level 2 names the operation, level 3 writes it down.
   The visuals reuse the column / division scaffolds with the same params as those exercises. */
function wordHints(ex: WordProblemExercise): Hint[] {
  const [a, b] = ex.operands
  const l1 = 'Lee la historia despacio. ¿Qué pasa: se juntan cosas, se quitan, hay grupos iguales o se reparte?'
  switch (ex.op) {
    case 'add': {
      const digits = Math.max(digitCount(a), digitCount(b))
      const carries = analyzeAdd([a, b]).carries
      const first = carries.findIndex((c, i) => i > 0 && c > 0)
      const params = { operands: [a, b], a, b, digits }
      // Level 2 asks what the story does, without naming the operation: the child decides it. Level 3 writes it.
      return [
        hint(1, l1, 'none'),
        hint(2, '¿Hay que juntar cantidades para saber cuántas hay en total?', 'place-value', params),
        hint(3, `Piénsalo en columna: ${a} + ${b} = ?`, 'carry', { ...params, column: Math.max(0, first - 1), carry: first > 0 ? carries[first] : 0 }),
      ]
    }
    case 'sub': {
      const params = { a, b, digits: digitCount(a), column: Math.max(0, analyzeSub(a, b).borrowed.findIndex(Boolean)) }
      return [
        hint(1, l1, 'none'),
        hint(2, '¿Se van cosas, o hay que comparar cuánto más tiene uno que otro?', 'borrow', params),
        hint(3, `Piénsalo en columna: ${a} − ${b} = ?`, 'borrow', params),
      ]
    }
    case 'mul': {
      if (b >= 10) {
        // 2-digit × 1-digit story: the column scaffold, 2-digit number on top.
        const params = { top: b, bottom: a, tens: Math.floor(b / 10) * 10, units: b % 10 }
        return [
          hint(1, l1, 'none'),
          hint(2, `¿Hay ${a} grupos iguales, con ${b} en cada uno? Parte el ${b} en ${params.tens} + ${params.units}.`, 'place-value', params),
          hint(3, `Piénsalo con el ${b} arriba: ${b} × ${a} = ?`, 'carry', { ...params, column: 1, carry: Math.floor(((b % 10) * a) / 10) }),
        ]
      }
      return [
        hint(1, l1, 'none'),
        hint(2, `¿Hay ${a} grupos iguales, con ${b} en cada uno?`, 'groups', { groups: a, perGroup: b }),
        hint(3, `Piensa la operación: ${a} × ${b} = ?`, 'groups', { groups: a, perGroup: b }),
      ]
    }
    case 'div': {
      const params = { total: a, groups: b, dividend: a, divisor: b }
      return [
        hint(1, l1, 'none'),
        hint(2, `¿Hay que repartir ${a} en partes iguales, y saber cuánto toca a cada una?`, 'share', params),
        hint(3, `Piensa la operación: ${a} : ${b} = ?`, 'share', params),
      ]
    }
  }
}

/** The methods the child is using, when they change the hints (see methods.ts). */
export interface HintOptions {
  divMethod?: DivMethod
  tableMethod?: TableMethod | null
}

/** Progressive hints (level 1 strategy → level 3 worked step) for this exercise. */
export function hintsFor(ex: Exercise, method?: SubMethod, options: HintOptions = {}): Hint[] {
  switch (ex.kind) {
    case 'fact-mul': return factHints(ex.a, ex.b, options.tableMethod)
    case 'fact-div': {
      const { dividend: p, divisor: d, answer: q } = ex
      return [
        // The same idea as the lesson: sharing out one by one, then the multiplication that undoes it, then a worked example.
        hint(1, `Reparte ${p} entre ${d}, de uno en uno: ¿cuántos le tocan a cada uno?`, 'none'),
        // The first round of the sharing: one for each of the d. How many rounds there are is what the child finds.
        hint(2, `¿${d} por cuánto da ${p}? Mira: en cada vuelta, cada uno recibe 1.`, 'share', { total: p, groups: d, perGroup: 1 }),
        hint(3, `${DIVISION_EXAMPLE_TEXT(p, d, q)} Ahora cuenta tú de ${d} en ${d} hasta ${p}: ¿cuántos números has dicho? Eso es lo que le toca a cada uno.`, 'skip-count', DIVISION_EXAMPLE_PARAMS(p, d, q)),
      ]
    }
    case 'missing-factor': {
      const known = ex.missing === 'a' ? ex.b : ex.a
      // Only the first two jumps are drawn and said, never the series up to the product: how many numbers the child
      // counts is the answer. The jumps stop before one that equals the answer, so no drawn number is the answer, not even
      // when the known factor is the answer too (3 × ? = 9 draws nothing: the first jump would be the 3 itself).
      let drawn = 0
      for (let i = 1; i <= Math.min(2, ex.answer - 1); i++) {
        if (known * i === ex.answer) break
        drawn = i
      }
      const first = Array.from({ length: drawn }, (_, i) => known * (i + 1))
      const start = first.length ? `${first.join(', ')}… ` : ''
      return [
        hint(1, `¿${known} por cuánto da ${ex.product}? Piensa en la tabla del ${known}.`, 'none'),
        hint(2, `Cuenta de ${known} en ${known} hasta llegar a ${ex.product}.`, 'skip-count', { step: known, count: drawn }),
        hint(3, `${start}Sigue contando de ${known} en ${known} hasta llegar a ${ex.product}. ¿Cuántos números dices?`, 'skip-count', { step: known, count: drawn }),
      ]
    }
    case 'skip-count': return skipHints(ex)
    case 'groups': {
      const sum = Array.from({ length: ex.groups }, () => String(ex.perGroup)).join(' + ')
      return [
        hint(1, `Multiplicar es sumar grupos iguales: ${ex.groups} grupos de ${ex.perGroup}.`, 'none'),
        hint(2, `Cuenta de ${ex.perGroup} en ${ex.perGroup}, un salto por cada grupo.`, 'groups', { groups: ex.groups, perGroup: ex.perGroup, emoji: ex.emoji }),
        hint(3, `${sum} = ?`, 'groups', { groups: ex.groups, perGroup: ex.perGroup, emoji: ex.emoji }),
      ]
    }
    case 'array': {
      const params = { rows: ex.rows, cols: ex.cols, emoji: ex.emoji }
      // Small arrays: add row by row (what hint 2 just showed). Big ones: the fact's trick.
      if (ex.rows <= 6) {
        return [
          hint(1, `Cuenta las filas y cuántos hay en cada fila: ${ex.rows} filas de ${ex.cols}.`, 'none'),
          hint(2, `Cada fila tiene ${ex.cols}. Cuenta de ${ex.cols} en ${ex.cols}, fila a fila.`, 'array', params),
          hint(3, `Fila a fila: ${Array.from({ length: ex.rows }, () => String(ex.cols)).join(' + ')} = ?`, 'array', params),
        ]
      }
      const d = strategyDetail(ex.rows, ex.cols)
      return [
        hint(1, `Cuenta las filas y cuántos hay en cada fila: ${ex.rows} filas de ${ex.cols}.`, 'none'),
        hint(2, `Cada fila tiene ${ex.cols}. Cuenta de ${ex.cols} en ${ex.cols}, fila a fila.`, 'array', params),
        hint(3, d.workedText, d.workedVisual, { ...d.visualParams, rows: ex.rows, cols: ex.cols }),
      ]
    }
    case 'double-chain':
      return [
        // Only the first double is drawn (the chain of every answer would give them all); the worked step goes one further.
        hint(1, `El doble es sumar el número consigo mismo: el doble de ${ex.start} es ${ex.start} + ${ex.start}.`, 'none'),
        hint(2, `Dobla el ${ex.start}: cada número es el doble del anterior.`, 'double-chain', { start: ex.start, steps: 1 }),
        hint(3, `${ex.start} + ${ex.start} = ${ex.start * 2}. Ahora el doble de ${ex.start * 2}: ${ex.start * 2} + ${ex.start * 2} = ?`, 'double-chain', { start: ex.start, steps: 1, index: 0 }),
      ]
    case 'fact-family':
      return [
        hint(1, 'Con 3 números salen 4 operaciones: dos multiplicaciones y dos divisiones.', 'none'),
        hint(2, `Mira el triángulo: arriba el ${ex.product}, abajo el ${ex.a} y el ${ex.b}.`, 'family', { a: ex.a, b: ex.b, product: ex.product }),
        hint(3, `${ex.a} × ${ex.b} = ${ex.product}. Con el espejo: ${ex.b} × ${ex.a} = ${ex.product}. Ahora reparte: ${ex.product} : ${ex.a} = ?`, 'family', { a: ex.a, b: ex.b, product: ex.product }),
      ]
    case 'column-add': return columnAddHints(ex)
    case 'column-sub': return subtractionHints(ex, method)
    case 'column-mul': return columnMulHints(ex)
    case 'division': return divisionHints(ex, options.divMethod)
    case 'word-problem': return wordHints(ex)
    case 'place-value':
    case 'compare':
    case 'order':
    case 'round':
    case 'number-line': return hintsNumeric(ex) ?? []
    case 'mental':
    case 'equation': return hintsCalc(ex) ?? []
    case 'bar-problem': return barHints(ex)
    case 'error-hunt': return huntHints(ex)
    case 'check-calc': return checkHints(ex)
    case 'clock-read':
    case 'clock-set':
    case 'time-convert':
    case 'time-duration':
    case 'calendar': return hintsClock(ex) ?? []
    case 'fraction-shade':
    case 'fraction-read':
    case 'fraction-of':
    case 'fraction-equal':
    case 'fraction-add': return fractionHints(ex)
    case 'shape-choice':
    case 'angle-tap':
    case 'perimeter':
    case 'shape-count': return geometryHints(ex)
    case 'money': return hintsMoney(ex) ?? []
    case 'measure': return hintsMeasure(ex) ?? []
    case 'chart': return hintsChart(ex)
    case 'chance': return hintsChance(ex)
    case 'pattern': return hintsPattern(ex)
    case 'position': return hintsPosition(ex)
    case 'mul-parts': return hintsMulParts(ex)
    case 'long-mul': return hintsLongMul(ex)
    case 'ordinal': return hintsOrdinal(ex)
    case 'decimal': case 'decimal-op': return hintsDecimal(ex)
    case 'area': return geometryHints(ex)
    case 'lng-tap-words':
    case 'lng-sentence-parts':
    case 'lng-classify':
    case 'lng-transform':
    case 'lng-missing-letter':
    case 'lng-punctuation':
    case 'lng-stress':
    case 'lng-syllables':
    case 'lng-dictation':
    case 'lng-alphabet':
    case 'lng-pair-words':
    case 'lng-read-choice':
    case 'lng-read-text':
    case 'lng-read-order':
    case 'lng-copy':
    case 'lng-guided': return hintsLengua(ex)
    case 'eng-listen-pick':
    case 'eng-match':
    case 'eng-write-word':
    case 'eng-complete':
    case 'eng-num-write':
    case 'eng-num-listen':
    case 'eng-op-listen':
    case 'eng-memory':
    case 'eng-scramble':
    case 'eng-speak': return hintsEnglish(ex)
  }
}

/* Level 3 of a division fact works a different case: the skip count of an example, then the child counts the jumps of the
   real one. The example never uses a number of the child's own fact (dividend, divisor, answer), or the answer would show. */
function divisionExample(p: number, d: number, q: number) {
  for (let e = 2; e <= 9; e++) {
    for (let k = 2; k <= 9; k++) {
      const jumps = Array.from({ length: k }, (_, i) => e * (i + 1))
      const shown = [e * k, e, k, ...jumps]
      // 4 : 2 = 2 is a poor example: the divisor and the result are the same number, so it does not show which is which.
      if (e === k) continue
      if (!shown.includes(p) && !shown.includes(d) && !shown.includes(q)) return { p: e * k, d: e, q: k, jumps }
    }
  }
  throw new Error(`no division example avoids ${p} : ${d} = ${q}`)
}
const DIVISION_EXAMPLE_TEXT = (p: number, d: number, q: number) => {
  const e = divisionExample(p, d, q)
  return `Ejemplo con otro caso: ${e.p} : ${e.d}. Cuenta de ${e.d} en ${e.d}: ${e.jumps.join(', ')}. Son ${e.q} saltos, así que a cada uno le tocan ${e.q}.`
}
const DIVISION_EXAMPLE_PARAMS = (p: number, d: number, q: number) => {
  const e = divisionExample(p, d, q)
  return { step: e.d, count: e.q }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
