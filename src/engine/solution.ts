/* «Así se resuelve»: the whole solution of an exercise, step by step, with its final answer (and unit). Shown when the
   child gives up («No lo sé»), after the last miss of a lesson try, and at the end of a wrong session step: the app
   teaches the way the Spanish school writes it, with the child's words (7-8 years old), and never asks anything back
   (no «= ?»). The hints (hints.ts) stop before the answer; the solution goes all the way.
   The answer always holds the expected answer of the corrector (check(...).expected), so the two never disagree. */
import type {
  BarProblemExercise, CheckCalcExercise, ColumnSubExercise, DivisionExercise, DivMethod,
  EqTerm, ErrorHuntExercise, Exercise, Hint, HintVisual, SubMethod, TableMethod,
} from '@/types'
import { check } from './check'
import { digitAt, digitCount } from './arith'
import { columnName, columnWithArticle } from './feedback'
import { strategyDetail, trickDetail } from './strategies'
import { lineStops, partsResults, subtrahendParts } from './subMethods'
import { firstPartial, hintsFor } from './hints'
import { euros } from './money'
import { fmtDecimal } from './decimals'
import { expectedClock } from './clock'

export interface SolutionOptions {
  subMethod?: SubMethod
  divMethod?: DivMethod
  tableMethod?: TableMethod | null
}

export interface Solution {
  /** The worked steps, in order. Short sentences; none asks anything back. */
  steps: string[]
  /** The final answer, with its unit when it has one («30 alumnos», «451», «las seis y veinte»). */
  answer: string
  /** A drawing for the solution (the same scaffolds as the hints). */
  visual?: HintVisual
  params?: Hint['params']
}

/** Numbers as the child reads them: four digits together (4750), from 10 000 grouped by a space (12 500). */
export const num = (n: number): string => (Math.abs(n) >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n))

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** «1 decena», «1 centena», «1 millar»: the unit a column lends. */
const ONE_OF = ['1 unidad', '1 decena', '1 centena', '1 millar', '1 decena de millar']
/** The neighbour that lends, with its gender: «la vecina» (decenas, centenas), «el vecino» (millares). */
const neighbour = (i: number) => (i === 3 ? 'al vecino' : 'a la vecina')

/** The expected answer of the corrector, as the logs and the report show it. */
function expectedOf(ex: Exercise): string {
  return check(ex, { type: 'number', value: Number.NaN }).expected
}

// ---------------------------------------------------------------- column operations (also used by word problems)

export function columnAddSteps(ops: readonly number[]): string[] {
  const cols = Math.max(...ops.map(digitCount))
  const steps: string[] = []
  let carry = 0
  for (let i = 0; i < cols; i++) {
    const digits = ops.filter((n) => i < digitCount(n)).map((n) => digitAt(n, i))
    const plain = digits.reduce((s, d) => s + d, 0)
    const sum = plain + carry
    const label = cap(columnName(i))
    const add = digits.length > 1 ? `${digits.join(' + ')} = ${plain}` : `${digits[0]}`
    const withCarry = carry ? (digits.length > 1 ? `${add}, más ${carry} que me llevo = ${sum}` : `${add}, más ${carry} que me llevo = ${sum}`) : add
    const last = i === cols - 1
    if (last || sum < 10) steps.push(`${label}: ${withCarry}. Escribo ${sum}.`)
    else steps.push(`${label}: ${withCarry}. Escribo ${sum % 10} y me llevo ${Math.floor(sum / 10)}.`)
    carry = last ? 0 : Math.floor(sum / 10)
  }
  return steps
}

/** «Pedir prestado arriba», the Spanish school way: the neighbour lends 1 and is crossed out with one less. */
export function columnSubSteps(m: number, s: number): string[] {
  const width = digitCount(m)
  const tops = Array.from({ length: width }, (_, i) => digitAt(m, i))
  const steps: string[] = []
  for (let i = 0; i < width; i++) {
    const bottom = i < digitCount(s) ? digitAt(s, i) : 0
    const label = cap(columnName(i))
    const top = tops[i]
    if (top >= bottom) {
      steps.push(i < digitCount(s) ? `${label}: ${top} − ${bottom} = ${top - bottom}.` : `${label}: no hay nada que quitar, baja el ${top}.`)
      continue
    }
    let j = i + 1
    while (j < width && tops[j] === 0) j++
    if (j === i + 1) {
      const before = tops[j]
      tops[j] -= 1
      steps.push(`${label}: ${top} es menos que ${bottom}, pido ${ONE_OF[j]} ${neighbour(j)}: ${top + 10} − ${bottom} = ${top + 10 - bottom}, y el ${before} se queda en ${tops[j]}.`)
    } else {
      const before = tops[j]
      tops[j] -= 1
      for (let k = i + 1; k < j; k++) tops[k] = 9
      steps.push(`${label}: ${top} es menos que ${bottom} y la vecina es un 0. Pido a ${columnWithArticle(j)}: el ${before} se queda en ${tops[j]} y cada 0 se convierte en 9. Ahora ${top + 10} − ${bottom} = ${top + 10 - bottom}.`)
    }
    tops[i] = top + 10
  }
  return steps
}

/** «Me llevo una abajo»: 10 more on top, and 1 more on the bottom digit of the next column. */
function carrySubSteps(m: number, s: number): string[] {
  const width = digitCount(m)
  const steps: string[] = []
  let carry = 0
  for (let i = 0; i < width; i++) {
    const top = digitAt(m, i)
    const raw = i < digitCount(s) ? digitAt(s, i) : 0
    const bottom = raw + carry
    const label = cap(columnName(i))
    const bottomText = carry ? `${raw} + 1 = ${bottom}` : `${bottom}`
    if (top >= bottom) {
      steps.push(carry ? `${label}: abajo, ${bottomText}. ${top} − ${bottom} = ${top - bottom}.` : `${label}: ${top} − ${bottom} = ${top - bottom}.`)
      carry = 0
    } else {
      steps.push(`${label}: ${carry ? `abajo, ${bottomText}. ` : ''}${top} es menos que ${bottom}: pongo un 1 delante, ${top + 10} − ${bottom} = ${top + 10 - bottom}, y me llevo 1 a la cifra de abajo de ${columnWithArticle(i + 1)}.`)
      carry = 1
    }
  }
  return steps
}

function subSteps(m: number, s: number, method?: SubMethod): string[] {
  switch (method) {
    case 'carry': return carrySubSteps(m, s)
    case 'parts': {
      const parts = subtrahendParts(s)
      const results = partsResults(m, s)
      const out = [`Separo el número de abajo en partes: ${num(s)} = ${parts.map(num).join(' + ')}.`]
      let at = m
      parts.forEach((p, i) => {
        out.push(`${num(at)} − ${num(p)} = ${num(results[i])}.`)
        at = results[i]
      })
      return out
    }
    case 'line': {
      const stops = [s, ...lineStops(s, m), m]
      const jumps = stops.slice(1).map((p, i) => p - stops[i])
      const out = [`Empiezo en ${num(s)} y cuento hacia delante hasta ${num(m)}.`]
      stops.slice(1).forEach((p, i) => out.push(`De ${num(stops[i])} a ${num(p)} hay ${num(jumps[i])}.`))
      out.push(jumps.length > 1 ? `Junto los saltos: ${jumps.map(num).join(' + ')} = ${num(m - s)}.` : `Hay ${num(m - s)} de ${num(s)} a ${num(m)}.`)
      return out
    }
    default: return columnSubSteps(m, s)
  }
}

export function columnMulSteps(top: number, b: number): string[] {
  const cols = digitCount(top)
  const steps: string[] = []
  let carry = 0
  for (let i = 0; i < cols; i++) {
    const d = digitAt(top, i)
    const product = d * b
    const value = product + carry
    const label = cap(columnName(i))
    const calc = carry ? `${d} × ${b} = ${product}, más ${carry} que me llevo = ${value}` : `${d} × ${b} = ${product}`
    const last = i === cols - 1
    if (last || value < 10) steps.push(`${label}: ${calc}. Escribo ${value}.`)
    else steps.push(`${label}: ${calc}. Escribo ${value % 10} y me llevo ${Math.floor(value / 10)}.`)
    carry = last ? 0 : Math.floor(value / 10)
  }
  return steps
}

/** The galera step by step: each number taken, how many times the divisor fits, what is left and the digit brought down. */
export function galeraSteps(n: number, d: number): string[] {
  const digits = String(n).split('').map(Number)
  const { digits: used, value } = firstPartial(n, d)
  const steps: string[] = []
  let partial = value
  let i = used
  const fits = (p: number) => {
    const q = Math.floor(p / d)
    const r = p - q * d
    const left = r === 0 ? 'y no sobra nada' : `y sobra${r === 1 ? '' : 'n'} ${r}`
    if (q === 0) return { q, r, text: `El ${d} no cabe en ${p}: escribo 0 en el resultado.` }
    return { q, r, text: `El ${d} cabe ${q} ${q === 1 ? 'vez' : 'veces'} en ${num(p)}: ${q} × ${d} = ${num(q * d)}, ${left}.` }
  }
  let step = fits(partial)
  steps.push(used > 1 ? `Cojo ${num(partial)}, porque el ${d} no cabe en el ${digits[0]}. ${step.text}` : `Empiezo por el ${partial}. ${step.text}`)
  while (i < digits.length) {
    partial = step.r * 10 + digits[i]
    const down = `Bajo el ${digits[i]}: tengo ${num(partial)}.`
    step = fits(partial)
    steps.push(`${down} ${step.text}`)
    i++
  }
  return steps
}

// ---------------------------------------------------------------- tiny arithmetic expressions (cálculo mental, igualdades)

type Tok = number | '+' | '−' | '×' | ':' | '(' | ')'

function tokenize(text: string): Tok[] | null {
  const out: Tok[] = []
  const src = text.replace(/(\d) (?=\d{3}\b)/g, '$1')
  let k = 0
  while (k < src.length) {
    const c = src[k]
    if (/\s/.test(c)) { k++; continue }
    const m = /^\d+/.exec(src.slice(k))
    if (m) { out.push(Number(m[0])); k += m[0].length; continue }
    if (c === '-') { out.push('−'); k++; continue }
    if (c === 'x' || c === '·') { out.push('×'); k++; continue }
    if (c === '÷' || c === '/') { out.push(':'); k++; continue }
    if ('+−×:()'.includes(c)) { out.push(c as Tok); k++; continue }
    return null
  }
  return out
}

/** Evaluates step by step (brackets first, then × and :, then + and − from left to right), one sentence per operation. */
export function evaluateSteps(text: string): { steps: string[]; value: number } | null {
  let toks = tokenize(text)
  if (!toks || !toks.length) return null
  const steps: string[] = []
  const apply = (a: number, op: Tok, b: number) => (op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b)
  const reduceFlat = (t: Tok[], record: boolean): Tok[] => {
    let cur = [...t]
    for (const ops of [['×', ':'], ['+', '−']]) {
      for (let k = 1; k < cur.length - 1; k++) {
        if (ops.includes(cur[k] as string) && typeof cur[k - 1] === 'number' && typeof cur[k + 1] === 'number') {
          const v = apply(cur[k - 1] as number, cur[k], cur[k + 1] as number)
          if (!Number.isFinite(v)) return cur
          if (record) steps.push(`${num(cur[k - 1] as number)} ${cur[k]} ${num(cur[k + 1] as number)} = ${num(v)}.`)
          cur = [...cur.slice(0, k - 1), v, ...cur.slice(k + 2)]
          k = 0
        }
      }
    }
    return cur
  }
  for (let guard = 0; guard < 20 && toks.includes('('); guard++) {
    const close: number = toks.indexOf(')')
    let open: number = close
    while (open >= 0 && toks[open] !== '(') open--
    if (close < 0 || open < 0) return null
    const inner = reduceFlat(toks.slice(open + 1, close), true)
    if (inner.length !== 1) return null
    toks = [...toks.slice(0, open), inner[0], ...toks.slice(close + 1)]
  }
  const end = reduceFlat(toks, true)
  if (end.length !== 1 || typeof end[0] !== 'number') return null
  return { steps, value: end[0] }
}

const sideText = (side: EqTerm[]) => side.map((t) => (t === null ? '__' : typeof t === 'number' ? num(t) : t)).join(' ')

// ---------------------------------------------------------------- per kind

function barSteps(ex: BarProblemExercise): string[] {
  const out: string[] = []
  const one = ex.steps.length === 1
  let prevName = ''
  ex.steps.forEach((st, i) => {
    const row = one ? ex.bar : ex.bar.filter((b) => b.row === i)
    const nameOf = (v: number) => {
      const slot = row.find((b) => b.value === v)
      return slot ? `«${slot.name}» (${num(v)})` : prevName ? `«${prevName}» (${num(v)})` : num(v)
    }
    const total = row.find((b) => b.kind === 'total' && b.value === null)
    const unknown = row.find((b) => b.value === null && b.kind !== 'total') ?? total
    const resultName = (st.op === 'add' || st.op === 'mul' ? total : unknown)?.name ?? ''
    const res = `${num(st.result)}`
    const a = nameOf(st.a)
    const b = nameOf(st.b)
    switch (st.op) {
      case 'add':
        out.push(`${cap(a)} y ${b} son los trozos de la barra${resultName ? `. «${resultName}» es la barra entera` : ''}. Para la barra entera se juntan los trozos: ${num(st.a)} + ${num(st.b)} = ${res}.`)
        break
      case 'sub':
        out.push(`${cap(a)} es la barra entera y ${b} es un trozo${resultName ? `. «${resultName}» es el trozo que falta` : ''}. Para el trozo que falta se quita: ${num(st.a)} − ${num(st.b)} = ${res}.`)
        break
      case 'mul':
        out.push(`Hay ${num(st.a)} trozos iguales de ${num(st.b)}${resultName ? `. «${resultName}» es la barra entera` : ''}. Se repite el trozo: ${num(st.a)} × ${num(st.b)} = ${res}.`)
        break
      case 'div':
        out.push(`${cap(a)} se reparte en ${num(st.b)} partes iguales${resultName ? `. «${resultName}» es una parte` : ''}: ${num(st.a)} : ${num(st.b)} = ${res}.`)
        break
    }
    prevName = resultName
  })
  return out
}

function huntSolution(ex: ErrorHuntExercise): Solution {
  const sym = ex.op === 'add' ? '+' : ex.op === 'sub' ? '−' : '×'
  const steps = [`Hago la cuenta bien: ${num(ex.top)} ${sym} ${num(ex.bottom)}.`]
  steps.push(...(ex.op === 'add' ? columnAddSteps([ex.top, ex.bottom]) : ex.op === 'sub' ? columnSubSteps(ex.top, ex.bottom) : columnMulSteps(ex.top, ex.bottom)))
  if (ex.wrongColumn === null) {
    steps.push(`Sale ${num(ex.answer)}, lo mismo que en la cuenta: todas las casas están bien.`)
    return { steps, answer: `La cuenta está bien: ${num(ex.shown)}.` }
  }
  const c = ex.wrongColumn
  steps.push(`Sale ${num(ex.answer)}. En la cuenta pone ${num(ex.shown)}: el error está en ${columnWithArticle(c)}, donde pone ${digitAt(ex.shown, c)} y tendría que poner ${digitAt(ex.answer, c)}.`)
  return { steps, answer: `La cuenta está mal. Lo correcto es ${num(ex.answer)}.` }
}

function checkCalcSolution(ex: CheckCalcExercise): Solution {
  const verdict = ex.ok ? 'bien' : 'mal'
  let steps: string[]
  if (ex.answer < 0) {
    // The claimed result is smaller than a number it adds: the check cannot even be subtracted.
    steps = [`El resultado, ${num(ex.claimed)}, es más pequeño que ${num(ex.right)}: una suma nunca da menos que uno de sus números.`, 'La cuenta está mal.']
    return { steps, answer: 'la cuenta está mal' }
  }
  if (ex.op === 'add') {
    steps = [`Para comprobar una suma, al resultado le quito uno de los números: ${num(ex.claimed)} − ${num(ex.right)} = ${num(ex.answer)}.`,
      ex.ok ? `Sale ${num(ex.left)}, el otro número: la cuenta está bien.` : `Tendría que salir ${num(ex.left)}, y sale ${num(ex.answer)}: la cuenta está mal.`]
  } else if (ex.op === 'sub') {
    steps = [`Para comprobar una resta, sumo el resultado y el número de abajo: ${num(ex.claimed)} + ${num(ex.right)} = ${num(ex.answer)}.`,
      ex.ok ? `Sale ${num(ex.left)}, el de arriba: la cuenta está bien.` : `Tendría que salir ${num(ex.left)}, y sale ${num(ex.answer)}: la cuenta está mal.`]
  } else {
    const r = ex.remainder ?? 0
    steps = [`Para comprobar una división, multiplico el resultado por el número que reparte y sumo lo que sobra: ${num(ex.right)} × ${num(ex.claimed)} + ${r} = ${num(ex.answer)}.`,
      ex.ok ? `Sale ${num(ex.left)}, el número que se reparte: la cuenta está bien.` : `Tendría que salir ${num(ex.left)}, y sale ${num(ex.answer)}: la cuenta está mal.`]
  }
  return { steps, answer: `${num(ex.answer)}; la cuenta está ${verdict}` }
}

/** The hint texts that can stand as a step of the solution (a strategy, not a question to answer with «= ?»). */
function strategySteps(ex: Exercise, opts: SolutionOptions): string[] {
  const hs = hintsFor(ex, opts.subMethod, { divMethod: opts.divMethod, tableMethod: opts.tableMethod })
  return hs.slice(0, 2).map((h) => h.text).filter((t) => !/=\s*\?/.test(t) && !/[{}]/.test(t.replace(/\{(child|pet)\}/g, '')))
}

/** «roja» → «rojas», «azul» → «azules», «minuto» → «minutos». */
const plural = (w: string) => (/[aeiouáéíóú]$/i.test(w) ? `${w}s` : `${w}es`)
const andList = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : xs.join(''))

const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const time = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`
/** «a las 12:40», «a la 1:40»: the article of a time on the clock face. */
const atTime = (h: number, m: number) => `${h % 12 === 1 ? 'la' : 'las'} ${time(h, m)}`

function divisionAnswer(q: number, r: number): string {
  return r === 0 ? `${num(q)}, y no sobra nada` : `${num(q)}, y sobra${r === 1 ? '' : 'n'} ${num(r)}`
}

/** The whole solution of an exercise: its steps and its answer (with unit). */
export function solutionFor(ex: Exercise, opts: SolutionOptions = {}): Solution {
  switch (ex.kind) {
    case 'fact-mul': {
      const d = trickDetail(opts.tableMethod, ex.a, ex.b) ?? strategyDetail(ex.a, ex.b)
      const worked = d.workedText.replace(/\?\s*$/, String(ex.answer))
      return { steps: [d.strategy.text, worked], answer: `${ex.a} × ${ex.b} = ${ex.answer}`, visual: d.strategy.visual, params: d.visualParams }
    }
    case 'fact-div': {
      const { dividend: p, divisor: d, answer: q } = ex
      const jumps = Array.from({ length: q }, (_, i) => d * (i + 1))
      return {
        steps: [`Repartir ${p} entre ${d} es pensar: ${d} por cuánto da ${p}.`, `Cuento de ${d} en ${d}: ${jumps.join(', ')}. Son ${q} saltos.`, `${d} × ${q} = ${p}, así que ${p} : ${d} = ${q}.`],
        answer: `${p} : ${d} = ${q}`,
        visual: 'share', params: { total: p, groups: d, perGroup: q },
      }
    }
    case 'missing-factor': {
      const known = ex.missing === 'a' ? ex.b : ex.a
      const jumps = Array.from({ length: ex.answer }, (_, i) => known * (i + 1))
      const eq = ex.missing === 'a' ? `${ex.answer} × ${ex.b} = ${ex.product}` : `${ex.a} × ${ex.answer} = ${ex.product}`
      return { steps: [`Cuento de ${known} en ${known} hasta ${ex.product}: ${jumps.join(', ')}.`, `He dicho ${ex.answer} números: ${eq}.`], answer: String(ex.answer) }
    }
    case 'skip-count': {
      const shown = ex.values.map(String)
      return { steps: [`Cuento de ${ex.step} en ${ex.step}: sumo ${ex.step} cada vez.`, `${shown.join(', ')}.`], answer: ex.answer.join(', '), visual: 'skip-count', params: { step: ex.step, start: ex.values[0] / ex.step, count: ex.values.length } }
    }
    case 'groups': {
      const sum = Array.from({ length: ex.groups }, () => String(ex.perGroup)).join(' + ')
      return { steps: [`Hay ${ex.groups} grupos de ${ex.perGroup}: ${sum} = ${ex.answer}.`, `Es lo mismo que ${ex.groups} × ${ex.perGroup} = ${ex.answer}.`], answer: String(ex.answer), visual: 'groups', params: { groups: ex.groups, perGroup: ex.perGroup } }
    }
    case 'array': {
      const sum = Array.from({ length: ex.rows }, () => String(ex.cols)).join(' + ')
      return { steps: [`Hay ${ex.rows} filas de ${ex.cols}: ${sum} = ${ex.answer}.`, `Es lo mismo que ${ex.rows} × ${ex.cols} = ${ex.answer}.`], answer: String(ex.answer), visual: 'array', params: { rows: ex.rows, cols: ex.cols } }
    }
    case 'double-chain': {
      const steps: string[] = []
      let at = ex.start
      for (const v of ex.answer) {
        steps.push(`El doble de ${at}: ${at} + ${at} = ${v}.`)
        at = v
      }
      return { steps, answer: ex.answer.join(', '), visual: 'double-chain', params: { start: ex.start, steps: ex.answer.length } }
    }
    case 'fact-family': {
      const { a, b, product: p } = ex
      const facts = a === b ? [`${a} × ${b} = ${p}`, `${p} : ${a} = ${b}`] : [`${a} × ${b} = ${p}`, `${b} × ${a} = ${p}`, `${p} : ${a} = ${b}`, `${p} : ${b} = ${a}`]
      return {
        steps: [`${a} × ${b} = ${p}.`, ...(a === b ? [] : [`Con el espejo: ${b} × ${a} = ${p}.`]), `Al repartir se deshace la multiplicación: ${facts.slice(a === b ? 1 : 2).join(' y ')}.`],
        answer: facts.join('; '),
      }
    }
    case 'column-add': return { steps: columnAddSteps(ex.operands), answer: num(ex.answer) }
    case 'column-sub': return withAnswer(subSteps(ex.minuend, ex.subtrahend, opts.subMethod), num(ex.answer))
    case 'column-mul': return { steps: columnMulSteps(ex.top, ex.bottom), answer: num(ex.answer) }
    case 'division': return divisionSolution(ex)
    case 'word-problem': {
      const [a, b] = ex.operands
      const sym = { add: '+', sub: '−', mul: '×', div: ':' }[ex.op]
      const what = { add: 'Se juntan las cantidades', sub: 'Se quita, o se mira cuánto más hay', mul: 'Hay grupos iguales', div: 'Se reparte en partes iguales' }[ex.op]
      const result = ex.op === 'div' && ex.remainder ? `${num(ex.answer)} y sobra${ex.remainder === 1 ? '' : 'n'} ${ex.remainder}` : num(ex.answer)
      const steps = [`${what}: ${num(a)} ${sym} ${num(b)} = ${result}.`]
      if (ex.op === 'add' && Math.max(a, b) >= 100) steps.push(...columnAddSteps([a, b]))
      if (ex.op === 'sub' && a >= 100) steps.push(...subSteps(a, b, opts.subMethod))
      if (ex.op === 'mul' && Math.max(a, b) >= 10 && Math.min(a, b) < 10) steps.push(...columnMulSteps(Math.max(a, b), Math.min(a, b)))
      return { steps, answer: `${result} ${ex.unit}` }
    }
    case 'bar-problem': return { steps: barSteps(ex), answer: `${num(ex.answer)} ${ex.unit}` }
    case 'place-value': {
      const parts = ex.parts
      const names = ['millares', 'centenas', 'decenas', 'unidades']
      const digits = String(ex.value).padStart(4, '0').split('').map(Number).slice(-4)
      const count = digits.map((dg, i) => `${dg} ${names[i]}`).filter((_, i) => i > 0 || digits[0] > 0)
      const answer = Array.isArray(ex.answer) ? ex.answer.map(num).join(', ') : num(ex.answer)
      return { steps: [`Hay ${andList(count)}.`, `${parts.filter((p) => p > 0).map(num).join(' + ')} = ${num(ex.value)}.`], answer }
    }
    case 'compare': {
      const { left: l, right: r } = ex
      if (l === r) return { steps: ['Los dos números tienen las mismas cifras en cada casa: son iguales.'], answer: `${num(l)} = ${num(r)}` }
      const width = Math.max(digitCount(l), digitCount(r))
      if (digitCount(l) !== digitCount(r)) {
        return { steps: [`${num(digitCount(l) > digitCount(r) ? l : r)} tiene más cifras: es el mayor.`], answer: `${num(l)} ${ex.answer} ${num(r)}` }
      }
      let i = width - 1
      while (i > 0 && digitAt(l, i) === digitAt(r, i)) i--
      return {
        steps: [`Comparo casa por casa desde la izquierda. La primera que cambia es la de ${columnWithArticle(i)}: ${digitAt(l, i)} y ${digitAt(r, i)}.`, `${digitAt(l, i)} es ${digitAt(l, i) > digitAt(r, i) ? 'mayor' : 'menor'} que ${digitAt(r, i)}, así que ${num(l)} ${ex.answer} ${num(r)}.`],
        answer: `${num(l)} ${ex.answer} ${num(r)}`,
      }
    }
    case 'order': {
      const sign = ex.direction === 'asc' ? ' < ' : ' > '
      return { steps: [`Miro primero la cifra de la izquierda de cada número; si es igual, la siguiente.`, `De ${ex.direction === 'asc' ? 'menor a mayor' : 'mayor a menor'}: ${ex.answer.map(num).join(sign)}.`], answer: ex.answer.map(num).join(sign) }
    }
    case 'round': {
      const place = Math.round(Math.log10(ex.to))
      const look = digitAt(ex.value, place - 1)
      const up = look >= 5
      return {
        steps: [`Miro la cifra de ${columnWithArticle(place - 1)}: es un ${look}.`, up ? `Es 5 o más: la cifra de ${columnWithArticle(place)} sube 1.` : `Es menos de 5: la cifra de ${columnWithArticle(place)} se queda igual.`, `Las cifras de la derecha pasan a 0: ${num(ex.answer)}.`],
        answer: num(ex.answer),
      }
    }
    case 'number-line': {
      if (ex.mode === 'jump' && ex.start !== null) {
        const sym = ex.jump > 0 ? '+' : '−'
        return { steps: [`Empiezo en ${num(ex.start)} y doy un salto de ${num(Math.abs(ex.jump))} hacia la ${ex.jump > 0 ? 'derecha' : 'izquierda'}.`, `${num(ex.start)} ${sym} ${num(Math.abs(ex.jump))} = ${num(ex.answer)}.`], answer: num(ex.answer) }
      }
      const prev = ex.blank > 0 ? ex.ticks[ex.blank - 1] : ex.ticks[ex.blank + 1]
      const text = ex.blank > 0 ? `Después de ${num(prev)} viene ${num(prev)} + ${num(ex.step)} = ${num(ex.answer)}.` : `Antes de ${num(prev)} va ${num(prev)} − ${num(ex.step)} = ${num(ex.answer)}.`
      return { steps: [`Las marcas van de ${num(ex.step)} en ${num(ex.step)}.`, text], answer: num(ex.answer) }
    }
    case 'mental': {
      const steps = strategySteps(ex, opts).slice(0, 1)
      const expr = ex.prompt.replace(/\s*=\s*\?\s*$/, '')
      const ev = /=\s*\?\s*$/.test(ex.prompt) ? evaluateSteps(expr) : null
      if (ev && ev.value === ex.answer) steps.push(...ev.steps)
      else if (ex.family.startsWith('completar')) steps.push(`${num(ex.a)} + ${num(ex.answer)} = ${num(ex.b)}.`)
      else steps.push(`${ex.prompt.replace(/\s*=\s*\?\s*$/, '').replace(/\?/g, '')} → ${num(ex.answer)}.`.replace(/^¿/, ''))
      return { steps, answer: num(ex.answer) }
    }
    case 'equation': {
      const l = sideText(ex.left)
      const r = sideText(ex.right)
      const lv = ex.left.includes(null) ? null : evaluateSteps(l)
      const rv = ex.right.includes(null) ? null : evaluateSteps(r)
      if (ex.mode === 'same' || ex.answer === '=' || ex.answer === '≠') {
        const same = ex.answer === '='
        return {
          steps: [`Lado izquierdo: ${l} = ${lv ? num(lv.value) : ''}.`, `Lado derecho: ${r} = ${rv ? num(rv.value) : ''}.`, same ? 'Valen lo mismo: se pone =.' : 'No valen lo mismo: se pone ≠.'],
          answer: same ? `${l} = ${r}` : `${l} ≠ ${r}`,
        }
      }
      const known = lv ?? rv
      const blankSide = lv ? ex.right : ex.left
      const filled = sideText(blankSide.map((t) => (t === null ? (ex.answer as number) : t)))
      return {
        steps: [`El signo = es una balanza: los dos lados valen lo mismo.`, `El lado sin hueco vale ${known ? num(known.value) : ''}.`, `${filled} = ${known ? num(known.value) : ''}, así que el número que falta es ${num(ex.answer as number)}.`],
        answer: num(ex.answer as number),
      }
    }
    case 'error-hunt': return huntSolution(ex)
    case 'check-calc': return checkCalcSolution(ex)
    case 'clock-read': {
      const phrase = expectedClock(ex)
      return { steps: [`La aguja corta marca la hora y la larga, los minutos: ${ex.minute} minutos.`, `Son ${phrase}.`], answer: phrase }
    }
    case 'clock-set': return { steps: ['Pon primero la aguja larga en los minutos, contando de 5 en 5 desde el 12.', `Después, la aguja corta en la hora: ${ex.prompt}.`, `En el reloj digital, ${time(ex.answer.hour, ex.answer.minute)}.`], answer: ex.prompt }
    case 'time-convert': return { steps: [`«${ex.phrase}» en el reloj de 24 horas: ${time(ex.answer.hour, ex.answer.minute)}.`, ex.answer.hour >= 13 ? `Por la tarde y por la noche, a la hora se le suma 12: ${ex.answer.hour - 12} + 12 = ${ex.answer.hour}.` : 'Por la mañana la hora se escribe igual.'], answer: ex.direction === 'to-phrase' ? `${ex.phrase} (${expectedClock(ex)})` : expectedClock(ex) }
    case 'time-duration': {
      const start = time(ex.start.hour, ex.start.minute)
      const end = time(ex.end.hour, ex.end.minute)
      if (ex.ask === 'end') return { steps: [`Empieza a ${atTime(ex.start.hour, ex.start.minute)}.`, `${ex.duration} minutos más tarde ${ex.end.hour % 12 === 1 ? 'es' : 'son'} ${atTime(ex.end.hour, ex.end.minute)}: ${expectedClock(ex)}.`], answer: expectedClock(ex) }
      return { steps: [`Empieza a ${atTime(ex.start.hour, ex.start.minute)} y acaba a ${atTime(ex.end.hour, ex.end.minute)}.`, `De ${start} a ${end} pasan ${ex.duration} minutos.`], answer: `${ex.duration} minutos` }
    }
    case 'calendar': {
      const answer = expectedClock(ex)
      if (ex.topic === 'weekday' && ex.week) {
        const list = Array.from({ length: ex.week.days }, (_, i) => DAYS[(ex.week!.today + 1 + i) % 7])
        return { steps: [`Hoy es ${DAYS[ex.week.today]}. Cuento ${ex.week.days} ${ex.week.days === 1 ? 'día' : 'días'}: ${list.join(', ')}.`], answer }
      }
      if (ex.topic === 'seconds' && ex.seconds) {
        const s = ex.seconds
        const step = s.form === 'min-to-s' ? `1 minuto son 60 segundos: ${s.minutes} × 60 = ${num(ex.answer)}.`
          : s.form === 'mixed' ? `${s.minutes} × 60 = ${s.minutes * 60}, y ${s.minutes * 60} + ${s.seconds} = ${num(ex.answer)}.`
            : `60 segundos son 1 minuto: ${num(s.total)} : 60 = ${num(ex.answer)}.`
        return { steps: [step], answer }
      }
      if (ex.topic === 'units' && ex.units) {
        const from = ex.units.amount === 1 ? ex.units.from : plural(ex.units.from)
        return { steps: [...strategySteps(ex, opts).slice(0, 1), `${ex.units.amount} ${from} son ${num(ex.answer)} ${ex.units.to}.`], answer: `${answer} ${ex.units.to}` }
      }
      if (ex.topic === 'month' && ex.month) return { steps: [...strategySteps(ex, opts).slice(0, 1), `${cap(ex.month)} tiene ${answer} días.`], answer: `${answer} días` }
      return { steps: [...strategySteps(ex, opts).slice(0, 1), `${ex.prompt.replace(/^¿|\?$/g, '')}: ${answer}.`], answer }
    }
    case 'fraction-shade': return { steps: [`El número de abajo, ${ex.denominator}, dice las partes iguales. El de arriba, ${ex.numerator}, las que se colorean.`, `Coloreo ${ex.numerator} de las ${ex.denominator} partes.`], answer: `${ex.numerator} de ${ex.denominator}` }
    case 'fraction-read': return { steps: [`La figura tiene ${ex.denominator} partes iguales: ese número va abajo.`, `Hay ${ex.numerator} de color: ese número va arriba.`], answer: `${ex.numerator}/${ex.denominator}` }
    case 'fraction-of': {
      const each = ex.total / ex.denominator
      const steps = [`Reparto ${num(ex.total)} en ${ex.denominator} partes iguales: ${num(ex.total)} : ${ex.denominator} = ${num(each)}.`]
      if (ex.numerator > 1) steps.push(`Cojo ${ex.numerator} partes: ${ex.numerator} × ${num(each)} = ${num(ex.answer)}.`)
      return { steps, answer: num(ex.answer), visual: 'share', params: { total: ex.total, groups: ex.denominator, perGroup: each } }
    }
    case 'fraction-equal': {
      const list = ex.unequal.map((i) => i + 1)
      return { steps: ['Miro si todas las partes de cada figura son del mismo tamaño.', list.length ? `Las partes no son iguales en: ${list.join(', ')}.` : 'Todas las figuras tienen partes iguales.'], answer: list.length ? `Figuras ${list.join(', ')}` : 'Ninguna' }
    }
    case 'shape-choice': {
      const steps = ex.hints.filter((h) => !/=\s*\?/.test(h)).slice(0, 2)
      return { steps: [...steps, `La respuesta es «${ex.options[ex.answer]}».`], answer: ex.options[ex.answer] }
    }
    case 'angle-tap': {
      const list = ex.rightCorners.map((i) => i + 1)
      return { steps: ['Un ángulo recto es como la esquina de una hoja de papel.', list.length ? `Encajan las esquinas ${list.join(', ')}.` : 'Ninguna esquina encaja: no hay ángulos rectos.'], answer: list.length ? `Esquinas ${list.join(', ')}` : expectedOf(ex) || 'Ninguna' }
    }
    case 'perimeter': return { steps: ['El perímetro es el camino alrededor: se suman todos los lados.', `${ex.sides.map(num).join(' + ')} = ${num(ex.answer)} ${ex.unit}.`], answer: `${num(ex.answer)} ${ex.unit}` }
    case 'shape-count': {
      const what = ex.ask === 'sides' ? 'lados' : 'esquinas'
      return { steps: [`Cuento ${ex.ask === 'sides' ? 'los lados' : 'las esquinas'} uno a uno: ${Array.from({ length: ex.answer }, (_, i) => i + 1).join(', ')}.`], answer: `${ex.answer} ${what}` }
    }
    case 'area': {
      const rows = new Map<number, number>()
      for (const [r] of ex.figure.filled) rows.set(r, (rows.get(r) ?? 0) + 1)
      const counts = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, c]) => c)
      return { steps: ['El área es lo que ocupa la figura: cuento los cuadraditos.', counts.length > 1 ? `Fila a fila: ${counts.join(' + ')} = ${ex.answer}.` : `Hay ${ex.answer}.`], answer: `${ex.answer} cuadraditos` }
    }
    case 'money': return moneySolution(ex, opts)
    case 'measure': {
      switch (ex.mode) {
        case 'ruler': return { steps: [`El objeto empieza en el ${ex.start} y acaba en el ${ex.end}.`, `${ex.end} − ${ex.start} = ${ex.answer}.`], answer: `${ex.answer} cm` }
        case 'convert': return { steps: [...strategySteps(ex, opts).slice(0, 1), `${ex.given} = ${num(ex.answer)} ${ex.unit}.`], answer: `${num(ex.answer)} ${ex.unit}` }
        case 'add': return { steps: [...strategySteps(ex, opts).slice(0, 1), `En total: ${num(ex.answer)} ${ex.unit}.`], answer: `${num(ex.answer)} ${ex.unit}` }
        case 'unit': return { steps: [`Pienso en el tamaño real de ${ex.object}.`, `Se mide en ${ex.answer}.`], answer: ex.answer }
        case 'estimate': {
          const answer = expectedOf(ex)
          return { steps: [`Pienso en el tamaño real de ${ex.object}: «${ex.claim}».`, ex.answer ? 'Tiene sentido.' : 'No tiene sentido.'], answer }
        }
      }
      break
    }
    case 'chart': {
      const answer = ex.options.length ? ex.options[ex.answer] : num(ex.answer)
      const values = ex.categories.map((c) => `${c.label}: ${num(c.value)}`)
      const steps = values.length ? [`Leo cada uno: ${values.join('; ')}.`] : strategySteps(ex, opts).slice(0, 1)
      if (ex.ask === 'difference' && ex.categories.length) {
        const sorted = [...ex.categories].map((c) => c.value).sort((a, b) => b - a)
        const pair = sorted.flatMap((a) => sorted.map((b) => [a, b])).find(([a, b]) => a - b === ex.answer)
        if (pair) steps.push(`${num(pair[0])} − ${num(pair[1])} = ${num(ex.answer)}.`)
      } else if (ex.ask === 'total' && ex.categories.length) {
        steps.push(`${ex.categories.map((c) => num(c.value)).join(' + ')} = ${num(ex.answer)}.`)
      }
      steps.push(`La respuesta es ${answer}.`)
      return { steps, answer }
    }
    case 'chance': {
      const bag = ex.bag.map((b) => `${b.count} ${b.count === 1 ? b.label : plural(b.label)}`)
      return { steps: [`En la bolsa hay ${andList(bag)}.`, ...strategySteps(ex, opts).slice(1, 2)], answer: ex.options[ex.answer] }
    }
    case 'pattern': {
      if (ex.mode === 'shapes') return { steps: ['Busco el trozo que se repite y sigo con la figura que le toca.'], answer: ex.options[ex.answer] }
      const first = ex.items.find((v) => typeof v === 'number') as number | undefined
      if (ex.mode === 'predict' && ex.position !== null && first !== undefined) {
        const jumps = ex.position - 1
        return { steps: [`Cada vez se suma ${ex.step}.`, `Del puesto 1 al ${ex.position} hay ${jumps} saltos: ${jumps} × ${ex.step} = ${jumps * ex.step}.`, `${num(first)} + ${num(jumps * ex.step)} = ${num(ex.answer)}.`], answer: num(ex.answer) }
      }
      const shown = ex.items.map((v) => (v === null ? num(ex.answer) : String(v)))
      return { steps: [ex.step >= 0 ? `Cada vez se suma ${ex.step}.` : `Cada vez se resta ${-ex.step}.`, `${shown.join(', ')}.`], answer: num(ex.answer) }
    }
    case 'position': {
      const answer = ex.options[ex.answer]
      if (ex.mode === 'route' && ex.moves.length) {
        const dirs = { up: 'hacia arriba', down: 'hacia abajo', left: 'a la izquierda', right: 'a la derecha' }
        return { steps: [...ex.moves.map((m) => `${m.n} ${m.n === 1 ? 'casilla' : 'casillas'} ${dirs[m.dir]}.`), `Llego a: ${answer}.`], answer }
      }
      return { steps: [...strategySteps(ex, opts).slice(0, 1), `La respuesta es «${answer}».`], answer }
    }
    case 'mul-parts': {
      const [p0, p1] = ex.partials
      return {
        steps: [`Parto el ${ex.bottom} en ${ex.tens} y ${ex.units}.`, `${num(ex.top)} × ${ex.units} = ${num(p0)}.`, `${num(ex.top)} × ${ex.tens} = ${num(p1)}.`, `Sumo las dos partes: ${num(p0)} + ${num(p1)} = ${num(ex.answer)}.`],
        answer: `${num(p0)} + ${num(p1)} = ${num(ex.answer)}`,
      }
    }
    case 'long-mul': {
      const digits = String(ex.bottom).split('').reverse().map(Number)
      const steps = ex.partials.map((p, i) => `${num(ex.top)} × ${num(digits[i] * 10 ** i)} = ${num(p)}.`)
      steps.push(`Sumo las filas: ${ex.partials.map(num).join(' + ')} = ${num(ex.answer)}.`)
      return { steps, answer: num(ex.answer) }
    }
    case 'ordinal': {
      if (ex.mode === 'row') return { steps: [`Cuento desde el principio, uno a uno, hasta el ${ex.n}.`], answer: `El ${ex.n}.º` }
      return { steps: [...strategySteps(ex, opts).slice(0, 1), `La respuesta es «${ex.options[ex.answer]}».`], answer: ex.options[ex.answer] }
    }
    case 'decimal': {
      if (ex.mode === 'compare' && ex.other !== undefined) {
        const a = fmtDecimal(ex.value, ex.places)
        const b = fmtDecimal(ex.other, ex.places)
        return { steps: ['Miro primero la parte entera; si es igual, las décimas y después las centésimas.', `${a} ${ex.answer} ${b}.`], answer: `${a} ${ex.answer} ${b}` }
      }
      const answer = expectedOf(ex)
      return { steps: [...strategySteps(ex, opts).slice(0, 1), `La respuesta es ${answer}.`], answer }
    }
    case 'fraction-add': {
      const sym = ex.op === 'add' ? '+' : '−'
      return {
        steps: [`Las dos fracciones tienen partes del mismo tamaño: abajo se queda el ${ex.denominator}.`, `Arriba: ${ex.a} ${sym} ${ex.b} = ${ex.answer}.`, `${ex.a}/${ex.denominator} ${sym} ${ex.b}/${ex.denominator} = ${ex.answer}/${ex.denominator}.`],
        answer: `${ex.answer}/${ex.denominator}`,
      }
    }
    case 'decimal-op': {
      const sym = ex.op === 'add' ? '+' : '−'
      const a = fmtDecimal(ex.left, ex.places)
      const b = fmtDecimal(ex.right, ex.places)
      const r = fmtDecimal(ex.answer, ex.places)
      return { steps: ['Pongo las comas una debajo de otra y hago la cuenta como siempre, desde la derecha.', `${a} ${sym} ${b} = ${r}.`], answer: r }
    }
    default: break
  }
  // Lengua, inglés and anything new: the strategy hints and the corrector's answer.
  const answer = expectedOf(ex)
  return { steps: [...strategySteps(ex, opts), `La respuesta es «${answer}».`], answer }
}

function withAnswer(steps: string[], answer: string): Solution {
  return { steps: [...steps, `Resultado: ${answer}.`], answer }
}

function divisionSolution(ex: DivisionExercise): Solution {
  const { dividend: n, divisor: d, quotient: q, remainder: r } = ex
  const steps = galeraSteps(n, d)
  steps.push(`Resultado: ${num(q)}${r ? `, y sobra${r === 1 ? '' : 'n'} ${r}` : ''}. Compruebo: ${num(q)} × ${d}${r ? ` + ${r}` : ''} = ${num(n)}.`)
  return { steps, answer: divisionAnswer(q, r), visual: 'share', params: { total: n, groups: d, dividend: n, divisor: d } }
}

function moneySolution(ex: Extract<Exercise, { kind: 'money' }>, opts: SolutionOptions): Solution {
  switch (ex.mode) {
    case 'recognise': return { steps: ['Miro el número y el tamaño de la moneda o del billete.'], answer: ex.answer < 100 ? `${ex.answer} ${ex.answer === 1 ? 'céntimo' : 'céntimos'}` : `${euros(ex.answer)} (${num(ex.answer)} céntimos)` }
    case 'pay': return { steps: ['Empiezo por la pieza más grande que quepa en el precio y sigo con las que faltan.', `Junto exactamente ${euros(ex.price)}.`], answer: euros(ex.price) }
    case 'change': return { steps: [`He pagado ${euros(ex.paid)} y cuesta ${euros(ex.price)}.`, `${euros(ex.paid)} − ${euros(ex.price)} = ${euros(ex.answer)}.`], answer: euros(ex.answer) }
    case 'add': return { steps: [`Sumo los precios: ${ex.items.map((i) => euros(i.price)).join(' + ')} = ${euros(ex.answer)}.`], answer: euros(ex.answer) }
    case 'compare': {
      return { steps: [`Los precios: ${ex.items.map((i) => `${i.name}, ${euros(i.price)}`).join('; ')}.`, `${ex.question === 'more' ? 'El más caro' : 'El más barato'}: ${ex.answer}.`], answer: ex.answer }
    }
    case 'budget': {
      const answer = typeof ex.answer === 'number' ? euros(ex.answer) : ex.answer
      return { steps: [`Tengo ${euros(ex.budget)}. Los precios: ${ex.items.map((i) => `${i.name}, ${euros(i.price)}`).join('; ')}.`, ...strategySteps(ex, opts).slice(0, 1), `La respuesta es ${answer}.`], answer }
    }
    case 'convert': {
      if (ex.direction === 'to-cents') return { steps: [`1 euro son 100 céntimos: ${euros(ex.amount)} son ${num(ex.amount)} céntimos.`], answer: `${num(ex.amount)} céntimos` }
      const [e, c] = Array.isArray(ex.answer) ? ex.answer : [Math.floor(ex.amount / 100), ex.amount % 100]
      return { steps: [`Cada 100 céntimos son 1 euro: ${num(ex.amount)} céntimos son ${e} euros y ${c} céntimos.`], answer: `${e} euros y ${c} céntimos (${euros(ex.amount)})` }
    }
  }
}

/** Steps of a column subtraction with the method, for views and lessons that show the whole calculation. */
export function subtractionSolution(ex: ColumnSubExercise, method?: SubMethod): Solution {
  return withAnswer(subSteps(ex.minuend, ex.subtrahend, method), num(ex.answer))
}

