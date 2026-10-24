/* Progressive hints: level 1 recalls the strategy (text only), level 2 shows a visual scaffold, level 3 works
   one step and leaves the final answer for the child ("= ?"). Params feed the HintVisual renderer. */
import type {
  ColumnAddExercise, ColumnMulExercise, ColumnSubExercise, DivisionExercise, DivMethod, Exercise, Hint, SkipCountExercise,
  SubMethod, TableMethod, WordProblemExercise,
} from '@/types'
import { analyzeAdd, analyzeSub, digitAt, digitCount } from './arith'
import { columnName } from './feedback'
import { strategyDetail } from './strategies'
import { compensationSteps, lineStops, partsResults, subtrahendParts } from './subMethods'
import { hintsCalc } from './calc'
import { hintsNumeric } from './numeric'
import { hintsClock } from './clock'
import { barHints } from './bars'
import { hintsMoney } from './money'
import { hintsMeasure } from './measure'
import { hintsChance, hintsChart } from './data'
import { hintsPattern } from './patterns'
import { hintsMulParts } from './bigops'
import { hintsLongMul } from './longmul'
import { hintsPosition } from './position'
import { checkHints, huntHints } from './bugs'
import { divisionParts } from './divParts'
import { TABLE_METHODS } from './methods'
import { fractionHints } from './fractions'
import { geometryHints } from './geometry'

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'], params?: Hint['params']): Hint =>
  params ? { level, text, visual, params } : { level, text, visual }

/** The favourite trick (when it applies to the fact) replaces the first hint; the visual and the worked step stay. */
function factHints(a: number, b: number, tableMethod?: TableMethod | null): Hint[] {
  const d = strategyDetail(a, b)
  const trick = tableMethod ? TABLE_METHODS.find((t) => t.id === tableMethod && t.applies(a, b)) : undefined
  return [
    hint(1, trick ? trick.hint : d.strategy.text, 'none'),
    hint(2, d.visualText, d.strategy.visual, { ...d.visualParams }),
    hint(3, d.workedText, d.workedVisual, d.workedParams ?? { ...d.visualParams, a, b }),
  ]
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
      ? `Ahora suma las ${columnName(i + 1)} sin olvidar la llevada: ¿cuánto da?`
      : `Como ya no quedan más cifras, ese ${Math.floor(sum / 10)} baja directo al resultado. ¿Qué número sale?`
    worked = `${cap(columnName(i))}: ${parts.join(' + ')} = ${sum}. Escribe ${sum % 10} y me llevo ${Math.floor(sum / 10)} a las ${columnName(i + 1)}. ${next}`
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
    worked = `${cap(columnName(i))}: ${top} es menos que ${digitAt(s, i)}, y la vecina es un 0. Pide a las ${columnName(lender)}: el ${digitAt(m, lender)} se queda en ${digitAt(m, lender) - 1}, cada 0 se convierte en 9 y tus ${columnName(i)} son ${top + 10}. ${top + 10} − ${digitAt(s, i)} = ?`
  } else {
    worked = `${cap(columnName(i))}: ${top} es menos que ${digitAt(s, i)}. La vecina de las ${columnName(i + 1)} te presta 1 y su ${digitAt(m, i + 1)} se queda en ${digitAt(m, i + 1) - 1}. Ahora tienes ${top + 10}: ${top + 10} − ${digitAt(s, i)} = ?`
  }
  return [
    hint(1, 'Empieza por las unidades. Si arriba hay menos que abajo, ¡pide prestado a la vecina!', 'none'),
    hint(2, zero
      ? 'Si la vecina es un 0, no tiene nada que prestar: pide a la siguiente. El 0 se convierte en 10, presta 1 y se queda en 9.'
      : 'La vecina presta 1 decena: tú ganas 10 y ella se queda con una menos. ¡Táchala!', 'borrow', { ...params, column: i }),
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
    hint(2, `Cuando la cifra de arriba es menor, no te quedes parado: ${columnName(i)} arriba suman 10 y la casa de al lado de abajo cuenta 1 más.`, 'borrow', { ...params, column: i }),
    hint(3, `${cap(columnName(i))}: ${digitAt(m, i)} + 10 = ${top}. Resta ${top} − ${digitAt(s, i)} = ? Y abajo, en las ${columnName(next)}: ${digitAt(s, next)} + 1 = ${adjusted[next]}.`, 'borrow', { ...params, column: i }),
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
    hint(1, `Empieza en ${s} y cuenta hacia delante hasta ${m}. Salta primero a un número redondo.`, 'none'),
    hint(2, first !== undefined
      ? `Desde ${s}, el primer salto cae en ${first}. ¿Cuánto hay de ${s} a ${first}?`
      : `Desde ${s} salta hasta ${m}: ¿cuántos saltos de 10 caben en el camino?`, 'none'),
    hint(3, first !== undefined
      ? `De ${s} a ${first} hay ${first - s}. Sigue contando: ¿cuánto hay de ${first} al siguiente salto?`
      : `Cuenta de ${s} hacia ${m} con saltos de 10 y de 1. ¿Cuántos has dado?`, 'none', params),
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

function columnMulHints(ex: ColumnMulExercise): Hint[] {
  const t = Math.floor(ex.top / 10)
  const u = ex.top % 10
  const b = ex.bottom
  const c = Math.floor((u * b) / 10)
  const params = { top: ex.top, bottom: b, tens: t * 10, units: u }
  const worked = c > 0
    ? `Unidades: ${u} × ${b} = ${u * b}. Escribe ${(u * b) % 10} y me llevo ${c}. Decenas: ${t} × ${b} = ${t * b}, más la llevada ${c} = ?`
    : `Unidades: ${u} × ${b} = ${u * b}. Decenas: ${t} × ${b} = ?`
  return [
    hint(1, 'Multiplica primero las unidades y después las decenas. ¡No te olvides de sumar la llevada!', 'none'),
    hint(2, `Parte el número: ${ex.top} = ${t * 10} + ${u}. Multiplica cada parte por ${b}.`, 'place-value', params),
    hint(3, worked, 'carry', { ...params, column: 1, carry: c }),
  ]
}

/* «Repartir por partes»: the dividend in its parts; the first part is the step the hint names (never the total). */
function partsDivisionHints(ex: DivisionExercise): Hint[] {
  const { dividend: n, divisor: d } = ex
  const steps = divisionParts(n, d)
  const params = { total: n, groups: d, dividend: n, divisor: d }
  return [
    hint(1, 'Parte el número en partes fáciles: centenas, decenas y unidades. Reparte cada parte y después suma.', 'none'),
    hint(2, `Parte el ${n}: ${steps.map((s) => s.part).join(' + ')}. Reparte cada parte entre ${d}.`, 'place-value', params),
    hint(3, `Empieza por la parte más grande: ${steps[0].partial} ÷ ${d} = ?`, 'share', params),
  ]
}

/* «Multiplicar hacia arriba»: the child climbs the multiples; the hints say how, not where it stops. */
function climbDivisionHints(ex: DivisionExercise): Hint[] {
  const { dividend: n, divisor: d } = ex
  return [
    hint(1, `Pregúntate: ¿qué número por ${d} da ${n}, o se acerca sin pasarse?`, 'none'),
    hint(2, `Sube de ${d} en ${d}: cada fila suma ${d} más. Para cuando la fila llegue a ${n} o lo pase.`, 'none'),
    hint(3, `Escribe la fila siguiente: ${d} × el número de la fila = ? ¿Pasa de ${n}?`, 'none'),
  ]
}

const SHORT_GALERA_HINT = 'Sin restas: calcula de cabeza lo que sobra al repartir y bájalo a la siguiente cifra. Escribe solo el cociente.'

/* A 2-digit divisor: estimate by rounding the divisor, then check by multiplying. No hint names a quotient digit. */
function twoDigitDivisorHints(ex: DivisionExercise, short: boolean): Hint[] {
  const { dividend: n, divisor: d } = ex
  const round = Math.round(d / 10) * 10
  const params = { total: n, groups: d, dividend: n, divisor: d }
  return [
    hint(1, short ? SHORT_GALERA_HINT : `En cada paso pregúntate cuántas veces cabe el ${d}. Prueba un número y multiplícalo por ${d}.`, 'none'),
    hint(2, `Para estimar, piensa en el ${d} como si fuera ${round}. Después comprueba multiplicando por ${d} de verdad.`, 'share', params),
    hint(3, `Si al multiplicar te pasas, prueba uno menos. Si lo que sobra es ${d} o más, prueba uno más.`, 'share', params),
  ]
}

function divisionHints(ex: DivisionExercise, method?: DivMethod): Hint[] {
  if (method === 'div-parts' && ex.divisor < 10) return partsDivisionHints(ex)
  if (method === 'climb' && ex.quotient < 10) return climbDivisionHints(ex)
  const short = method === 'galera-short'
  const { dividend: n, divisor: d, quotient: q } = ex
  if (d >= 10) return twoDigitDivisorHints(ex, short)
  const t = Math.floor(n / 10)
  const u = n % 10
  const params = { total: n, groups: d, dividend: n, divisor: d }
  let l1: string
  let worked: string
  if (q < 10) {
    l1 = `¿Qué número de la tabla del ${d} se acerca más a ${n} sin pasarse?`
    worked = `Cuenta de ${d} en ${d} y para antes de pasarte de ${n}. ¿En qué fila vas?`
  } else if (ex.variant === 'exact') {
    l1 = 'Primero reparte las decenas y después las unidades.'
    worked = `Decenas: ${t} ÷ ${d} = ${Math.floor(t / d)}. Ahora las unidades: ${u} ÷ ${d} = ?`
  } else {
    const qt = Math.floor(t / d)
    const left = t - qt * d
    l1 = 'Reparte primero las decenas. Lo que sobre, júntalo con las unidades y sigue repartiendo.'
    worked = left > 0
      ? `Decenas: ${t} ÷ ${d} = ${qt} y sobra ${left}. Júntalo con el ${u}: ${left * 10 + u} ÷ ${d} = ?`
      : `Decenas: ${t} ÷ ${d} = ${qt} y no sobra nada. Ahora baja el ${u}: ${u} ÷ ${d} = ?`
  }
  return [
    hint(1, short ? SHORT_GALERA_HINT : l1, 'none'),
    hint(2, `Reparte ${n} en ${d} grupos iguales. Lo que no se pueda repartir es el resto.`, 'share', params),
    hint(3, worked, 'share', params),
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
      return [
        hint(1, l1, 'none'),
        hint(2, 'Se juntan dos cantidades: hay que sumar.', 'place-value', params),
        hint(3, `Piénsalo en columna: ${a} + ${b} = ?`, 'carry', { ...params, column: Math.max(0, first - 1), carry: first > 0 ? carries[first] : 0 }),
      ]
    }
    case 'sub': {
      const params = { a, b, digits: digitCount(a), column: Math.max(0, analyzeSub(a, b).borrowed.findIndex(Boolean)) }
      return [
        hint(1, l1, 'none'),
        hint(2, 'Se quita una cantidad (o se comparan dos): hay que restar.', 'borrow', params),
        hint(3, `Piénsalo en columna: ${a} − ${b} = ?`, 'borrow', params),
      ]
    }
    case 'mul': {
      if (b >= 10) {
        // 2-digit × 1-digit story: the column scaffold, 2-digit number on top.
        const params = { top: b, bottom: a, tens: Math.floor(b / 10) * 10, units: b % 10 }
        return [
          hint(1, l1, 'none'),
          hint(2, `Hay ${a} grupos de ${b}: hay que multiplicar. Parte el ${b} en ${params.tens} + ${params.units}.`, 'place-value', params),
          hint(3, `Piénsalo con el ${b} arriba: ${b} × ${a} = ?`, 'carry', { ...params, column: 1, carry: Math.floor(((b % 10) * a) / 10) }),
        ]
      }
      return [
        hint(1, l1, 'none'),
        hint(2, `Hay ${a} grupos de ${b}: hay que multiplicar.`, 'groups', { groups: a, perGroup: b }),
        hint(3, `Piensa la operación: ${a} × ${b} = ?`, 'groups', { groups: a, perGroup: b }),
      ]
    }
    case 'div': {
      const params = { total: a, groups: b, dividend: a, divisor: b }
      return [
        hint(1, l1, 'none'),
        hint(2, `Hay que repartir ${a} en partes iguales: hay que dividir entre ${b}.`, 'share', params),
        hint(3, `Piensa la operación: ${a} ÷ ${b} = ?`, 'share', params),
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
      const seq = Array.from({ length: Math.min(q, 10) }, (_, i) => d * (i + 1)).join(', ')
      return [
        hint(1, `Dividir es lo contrario de multiplicar: ¿${d} por cuánto da ${p}?`, 'none'),
        hint(2, `Reparte ${p} en grupos de ${d}.`, 'share', { total: p, groups: q, perGroup: d }),
        hint(3, `Cuenta de ${d} en ${d} hasta llegar a ${p}: ${seq}. ¿Cuántos saltos has dado?`, 'skip-count', { step: d, count: q }),
      ]
    }
    case 'missing-factor': {
      const known = ex.missing === 'a' ? ex.b : ex.a
      const seq = Array.from({ length: Math.min(ex.answer, 10) }, (_, i) => known * (i + 1)).join(', ')
      return [
        hint(1, `¿${known} por cuánto da ${ex.product}? Piensa en la tabla del ${known}.`, 'none'),
        hint(2, `Cuenta de ${known} en ${known} hasta llegar a ${ex.product}.`, 'skip-count', { step: known, count: ex.answer }),
        hint(3, `${seq}. ¿Cuántos números has dicho?`, 'skip-count', { step: known, count: ex.answer, index: ex.answer - 1 }),
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
        hint(1, 'El doble es sumar el número consigo mismo.', 'none'),
        hint(2, `Dobla el ${ex.start} paso a paso: cada número es el doble del anterior.`, 'double-chain', { start: ex.start, steps: ex.steps }),
        hint(3, `${ex.start} + ${ex.start} = ?`, 'double-chain', { start: ex.start, steps: ex.steps, index: 0 }),
      ]
    case 'fact-family':
      return [
        hint(1, 'Con 3 números salen 4 operaciones: dos multiplicaciones y dos divisiones.', 'none'),
        hint(2, `Mira el triángulo: arriba el ${ex.product}, abajo el ${ex.a} y el ${ex.b}.`, 'family', { a: ex.a, b: ex.b, product: ex.product }),
        hint(3, `${ex.a} × ${ex.b} = ${ex.product}. Con el espejo: ${ex.b} × ${ex.a} = ${ex.product}. Ahora reparte: ${ex.product} ÷ ${ex.a} = ?`, 'family', { a: ex.a, b: ex.b, product: ex.product }),
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
    case 'area': return geometryHints(ex)
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
