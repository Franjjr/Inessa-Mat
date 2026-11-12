/* P1 harness: «una respuesta final correcta jamás se da por mala; nada incorrecto se da por bueno».
   Stable API for the property tests (p1-propiedades and the domain groups' own file):
   - forEachSkill(filter, seeds, fn): every maths skill case of the registry, `seeds` seeds each.
   - finalCorrectVariants(ex, method?): answers whose FINAL result is right, with the steps in between empty, at random,
     from the other method, in another order or half written, as the views send them.
   - finalWrongVariants(ex, method?): answers with the final result ±1, ±10, +100 or one digit more, the steps right.
   - methodsFor(ex): the written methods a view may use for that exercise (sub: borrow, carry, parts, line; div: galera,
     galera-short, div-parts, climb; mul-parts; long-mul). Exercises with one way of answering give ['-'].
   Kinds without their own variants here (the domain kinds) give the reference answer only. */
import {
  blockSkillsOf, borrowMarks, climbProducts, compensationSteps, createRng, digitCount, divisionParts, generate,
  isValidSkill, lineStops, partsResults, subtrahendParts,
} from '@/engine'
import { correctAnswer, refCarries as refCarriesOf } from './helpers'
import type {
  Answer, ColumnAddExercise, ColumnMulExercise, ColumnSubExercise, DivisionExercise, Exercise, ExerciseKind,
  FactFamilyExercise, LongMulExercise, MulPartsExercise, SkillKey, SkillSelector,
} from '@/types'
import { ALL_KINDS } from '@/engine/generate'

export interface SkillCase {
  /** Readable name for the reports: the skill key or the selector. */
  name: string
  kind: ExerciseKind
  selector: SkillSelector
}

export interface Variant {
  label: string
  answer: Answer
  /** The method the view used (passed to check as context.method). */
  method?: string
}

/** The maths kinds of the registry: every kind except Lengua and Inglés. */
export const MATH_KINDS: ExerciseKind[] = [...new Set(ALL_KINDS)].filter((k) => !k.startsWith('lng-') && !k.startsWith('eng-'))

const REGROUPS = ['none', 'one', 'many', 'any'] as const
const DIV_SKILLS: SkillKey[] = [
  'div:2x1:exact', 'div:2x1:rem', 'div:2x1:long', 'div:3x1:exact', 'div:3x1:rem', 'div:4x1:exact', 'div:4x1:rem',
  'div:3x2:exact', 'div:3x2:rem', 'div:3x2:round',
]

/** The skill selectors of one kind: the column ops by digits and regrouping, the operations by skill key. */
function casesOf(kind: ExerciseKind): SkillCase[] {
  const bySkills = (skills: SkillKey[]) => skills.filter(isValidSkill).map((s) => ({ name: s, kind, selector: { skills: [s] } }))
  switch (kind) {
    case 'column-add':
      return [2, 3, 4].flatMap((d) => REGROUPS.map((r) => ({ name: `column-add ${d}d ${r}`, kind, selector: { kinds: [kind], digits: d as 2 | 3 | 4, regroup: r } })))
    case 'column-sub':
      return [
        ...[2, 3, 4].flatMap((d) => REGROUPS.map((r) => ({ name: `column-sub ${d}d ${r}`, kind, selector: { kinds: [kind], digits: d as 2 | 3 | 4, regroup: r } }))),
        { name: 'column-sub 3d ceros', kind, selector: { kinds: [kind], digits: 3, zeros: true } },
        { name: 'column-sub 4d ceros', kind, selector: { kinds: [kind], digits: 4, zeros: true } },
      ]
    case 'column-mul': return bySkills(['mul:2x1:c0', 'mul:2x1:c1', 'mul:3x1:c0', 'mul:3x1:c1'])
    case 'division': return bySkills(DIV_SKILLS)
    case 'word-problem': return bySkills(['word:add', 'word:sub', 'word:mul', 'word:div'])
    case 'mul-parts': return bySkills(['mul:2dx2d', 'mul:3dx2d'])
    case 'long-mul': return bySkills(['mul:col:2x2', 'mul:col:3x2', 'mul:col:2x3', 'mul:col:3x3'])
    default: {
      const skills = blockSkillsOf(kind)
      return skills.length ? bySkills(skills) : [{ name: kind, kind, selector: { kinds: [kind] } }]
    }
  }
}

/** Every maths skill case, kind by kind. */
export const SKILL_CASES: SkillCase[] = MATH_KINDS.flatMap(casesOf)

/** Runs `fn` on the exercises of every case that passes `filter`, `seeds` seeds each (3 exercises per seed, only those of
    the case's kind). Returns, per case name, how many seeds produced at least one exercise. */
export function forEachSkill(
  filter: (c: SkillCase) => boolean, seeds: number, fn: (ex: Exercise, c: SkillCase, seed: number) => void,
): Map<string, number> {
  const covered = new Map<string, number>()
  SKILL_CASES.forEach((c, index) => {
    if (!filter(c)) return
    let n = 0
    for (let seed = 1; seed <= seeds; seed++) {
      const items = generate(c.selector, 3, { rng: createRng(seed * 7919 + index) }).filter((ex) => ex.kind === c.kind)
      if (items.length) n++
      for (const ex of items) fn(ex, c, seed)
    }
    covered.set(c.name, n)
  })
  return covered
}

// ---------------------------------------------------------------- answers

const digitsOf = (n: number, width = digitCount(n)): (number | null)[] =>
  Array.from({ length: width }, (_, i) => Math.floor(n / 10 ** i) % 10)
const padNull = (d: (number | null)[], width: number) => [...d, ...Array.from({ length: Math.max(0, width - d.length) }, () => null)]

/** A small deterministic generator per exercise, so the «al azar» variants are the same on every run. */
function rngFor(ex: Exercise) {
  let h = 2166136261
  for (const ch of ex.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return createRng(h >>> 0)
}

export function methodsFor(ex: Exercise): string[] {
  if (ex.kind === 'column-sub') return ['borrow', 'carry', 'parts', 'line']
  if (ex.kind === 'division') {
    // The views offer «por partes» with a one-digit divisor and «hacia arriba» with a one-digit quotient.
    return ['galera', 'galera-short', ...(ex.divisor < 10 ? ['div-parts'] : []), ...(ex.quotient < 10 ? ['climb'] : [])]
  }
  if (ex.kind === 'mul-parts') return ['mul-parts']
  if (ex.kind === 'long-mul') return ['long-mul']
  return ['-']
}

const v = (label: string, answer: Answer, method?: string): Variant => (method ? { label, answer, method } : { label, answer })

function subVariants(ex: ColumnSubExercise, method: string): Variant[] {
  const width = digitCount(ex.minuend)
  const rnd = rngFor(ex)
  const ans = ex.answer
  if (method === 'borrow' || method === 'carry') {
    const other = method === 'borrow' ? compensationSteps(ex.minuend, ex.subtrahend).marks : borrowMarks(ex.minuend, ex.subtrahend)
    const own = method === 'borrow' ? borrowMarks(ex.minuend, ex.subtrahend) : compensationSteps(ex.minuend, ex.subtrahend).marks
    const dig = (digits: (number | null)[], carries?: (number | null)[]): Answer => ({ type: 'digits', digits, ...(carries ? { carries } : {}), method })
    return [
      v('marcas de su método', dig(digitsOf(ans), own), method),
      v('marcas vacías', dig(digitsOf(ans, width), []), method),
      v('marcas al azar', dig(digitsOf(ans), Array.from({ length: width }, () => Math.floor(rnd() * 10))), method),
      v('marcas del otro método', dig(digitsOf(ans), other), method),
      v('ceros a la izquierda', dig(digitsOf(ans, width)), method),
      v('casillas de delante vacías', dig(padNull(digitsOf(ans), width)), method),
      v('número suelto', { type: 'number', value: ans }, method),
    ]
  }
  const steps = (values: (number | null)[], total?: number | null): Answer =>
    method === 'parts' ? { type: 'steps', method: 'parts', values } : { type: 'steps', method: 'line', values, total }
  if (method === 'parts') {
    const book = partsResults(ex.minuend, ex.subtrahend)
    const n = subtrahendParts(ex.subtrahend).length
    const last = (values: (number | null)[]) => values.map((x, k) => (k === n - 1 ? ans : x))
    // 352 − 127 taking the small parts first: 345, 325, 225.
    let at = ex.minuend
    const smallFirst = [...subtrahendParts(ex.subtrahend)].reverse().map((p) => (at -= p))
    return [
      v('pasos de libro', steps(book), method),
      v('pasos vacíos', steps(last(book.map(() => null))), method),
      v('pasos al azar', steps(last(book.map(() => Math.floor(rnd() * 999)))), method),
      v('un paso +1', steps(last(book.map((x, k) => (k === 0 ? x + 1 : x)))), method),
      v('en otro orden (partes pequeñas primero)', steps(smallFirst), method),
      v('a medias: el final en la primera casilla', steps(book.map((_, k) => (k === 0 ? ans : null))), method),
    ]
  }
  const stops = lineStops(ex.subtrahend, ex.minuend)
  const pts = [ex.subtrahend, ...stops, ex.minuend]
  return [
    v('paradas de libro', steps(stops, ans), method),
    v('paradas vacías', steps(stops.map(() => null), ans), method),
    v('paradas al azar', steps(stops.map(() => Math.floor(rnd() * 2 * ex.minuend)), ans), method),
    v('minuendo y sustraendo (foto 1)', steps([ex.minuend, ex.subtrahend], ans), method),
    v('acaba en el minuendo', steps([...stops, ex.minuend], ans), method),
    v('repite la salida', steps([ex.subtrahend, ...stops], ans), method),
    v('tamaños de los saltos', steps(pts.slice(1).map((p, i) => p - pts[i]), ans), method),
    v('hacia atrás', steps([...stops].reverse(), ans), method),
    v('a medias: un hueco', steps(stops.map((x, k) => (k === 0 ? null : x)), ans), method),
  ]
}

function divisionVariants(ex: DivisionExercise, method: string): Variant[] {
  const q = ex.quotient
  const r = ex.remainder
  const rnd = rngFor(ex)
  if (method === 'galera' || method === 'galera-short') {
    return [
      v('cociente y resto', { type: 'division', quotient: q, remainder: r }, method),
      ...(r === 0 ? [v('exacta con el resto vacío', { type: 'division', quotient: q, remainder: null }, method)] : []),
    ]
  }
  if (method === 'div-parts') {
    const st = divisionParts(ex.dividend, ex.divisor)
    const parts = (p: (number | null)[]): Answer => ({ type: 'division-parts', parts: p, quotient: q, remainder: r })
    const tens = st.map((s, k) => (k === 0 && s.carried === 0 && s.quotient % 10 === 0 && s.quotient > 0 && String(s.part).length === 2 ? s.quotient / 10 : s.quotient))
    return [
      v('partes de libro', parts(st.map((s) => s.quotient)), method),
      v('partes vacías', parts(st.map(() => null)), method),
      v('partes al azar', parts(st.map(() => Math.floor(rnd() * 50))), method),
      v('parte en decenas (2 por 20)', parts(tens), method),
      v('una parte +1', parts(st.map((s, k) => (k === st.length - 1 ? s.quotient + 1 : s.quotient))), method),
      v('a medias', parts(st.map((s, k) => (k === 0 ? s.quotient : null))), method),
    ]
  }
  // climb
  const products = climbProducts(ex.dividend, ex.divisor)
  const climb = (p: (number | null)[], remainder: number | null = r, quotient?: number): Answer =>
    ({ type: 'climb', products: p, remainder, ...(quotient === undefined ? {} : { quotient }) }) as Answer
  const fitting = products.filter((p) => p <= ex.dividend)
  return [
    v('filas de libro', climb(products), method),
    v('sin la fila que se pasa', climb(fitting), method),
    // A slip on the way (row 2), never in the last row that fits: the remainder is worked out from that one.
    v('una fila del camino mal', climb(products.map((p, k) => (k === 1 && fitting.length > 2 ? p + 1 : p))), method),
    v('con el cociente escrito y filas vacías', climb(products.map(() => null), r, q), method),
    ...(r === 0 ? [v('exacta con el resto vacío', climb(products, null), method)] : []),
  ]
}

function mulPartsVariants(ex: MulPartsExercise): Variant[] {
  const [u, t] = ex.partials
  const nums = (values: (number | null)[]): Answer => ({ type: 'numbers', values })
  return [
    v('partes de libro', nums([u, t, ex.answer]), 'mul-parts'),
    v('en otro orden', nums([t, u, ex.answer]), 'mul-parts'),
    v('partes vacías', nums([null, null, ex.answer]), 'mul-parts'),
    v('una parte mal', nums([u + 1, t, ex.answer]), 'mul-parts'),
    v('sin el cero', nums([u, t / 10, ex.answer]), 'mul-parts'),
    v('a medias', nums([u, null, ex.answer]), 'mul-parts'),
  ]
}

function longMulVariants(ex: LongMulExercise): Variant[] {
  const cols = digitCount(ex.answer)
  const total = digitsOf(ex.answer)
  const rows = (fill: (j: number, k: number) => number | null) => ex.partials.map((_, j) => Array.from({ length: cols }, (_, k) => fill(j, k)))
  const book = rows((j, k) => (digitsOf(ex.partials[j], cols)[k] ?? 0))
  return [
    v('filas de libro', { type: 'long-mul', rows: book, total }, 'long-mul'),
    v('filas vacías', { type: 'long-mul', rows: rows((j, k) => (k < j ? 0 : null)), total }, 'long-mul'),
    v('filas mal', { type: 'long-mul', rows: rows((j, k) => (k < j ? 0 : 9)), total }, 'long-mul'),
    v('sin ceros de desplazamiento', { type: 'long-mul', rows: rows((j, k) => digitsOf(Math.floor(ex.partials[j] / 10 ** j), cols)[k] ?? null), total }, 'long-mul'),
    v('sin filas', { type: 'long-mul', rows: [], total }, 'long-mul'),
  ]
}

function familyVariants(ex: FactFamilyExercise): Variant[] {
  const { a, b, product: p } = ex
  return [
    v('las cuatro', { type: 'facts', facts: [...ex.answer] }),
    v('en otro orden', { type: 'facts', facts: [...ex.answer].reverse() }),
    v('con signos de la escuela', { type: 'facts', facts: [`${a} × ${b} = ${p}`, `${b} × ${a} = ${p}`, `${p} : ${a} = ${b}`, `${p} : ${b} = ${a}`] }),
    v('al revés (42 = 6 × 7)', { type: 'facts', facts: [`${p} = ${a} × ${b}`, `${p} = ${b} × ${a}`, `${p} ÷ ${a} = ${b}`, `${p} ÷ ${b} = ${a}`] }),
  ]
}

/** Answers whose final result is right. `method` narrows to one method (see methodsFor); all of them by default. */
export function finalCorrectVariants(ex: Exercise, method?: string): Variant[] {
  const methods = method ? [method] : methodsFor(ex)
  switch (ex.kind) {
    case 'column-sub': return methods.flatMap((m) => subVariants(ex, m))
    case 'division': return methods.flatMap((m) => divisionVariants(ex, m))
    case 'mul-parts': return mulPartsVariants(ex)
    case 'long-mul': return longMulVariants(ex)
    case 'fact-family': return familyVariants(ex)
    case 'column-add': {
      const e = ex as ColumnAddExercise
      const width = Math.max(digitCount(e.answer), ...e.operands.map(digitCount))
      const rnd = rngFor(ex)
      const out = [
        v('llevadas de libro', { type: 'digits', digits: digitsOf(e.answer), carries: refCarriesOf(e.operands) }),
        v('llevadas vacías', { type: 'digits', digits: digitsOf(e.answer), carries: [] }),
        v('llevadas al azar', { type: 'digits', digits: digitsOf(e.answer), carries: Array.from({ length: width }, () => Math.floor(rnd() * 10)) }),
        v('casillas de delante vacías', { type: 'digits', digits: padNull(digitsOf(e.answer), width) }),
        v('número suelto', { type: 'number', value: e.answer }),
      ]
      const opCols = Math.max(...e.operands.map(digitCount))
      const len = digitCount(e.answer)
      if (len > opCols) {
        const d = digitsOf(e.answer)
        const carries = d.map((x, i) => (i === len - 1 ? x : null))
        out.push(v('última llevada solo arriba', { type: 'digits', digits: d.map((x, i) => (i === len - 1 ? null : x)), carries }))
      }
      return out
    }
    case 'column-mul': {
      const e = ex as ColumnMulExercise
      const d = digitsOf(e.answer)
      const out = [
        v('llevadas vacías', { type: 'digits', digits: d, carries: d.map(() => null) }),
        v('llevadas 7', { type: 'digits', digits: d, carries: d.map(() => 7) }),
        v('llevadas de dos cifras', { type: 'digits', digits: d, carries: d.map((_, i) => (i ? 12 : null)) }),
        v('número suelto', { type: 'number', value: e.answer }),
      ]
      if (d.length > digitCount(e.top)) {
        out.push(v('última llevada solo arriba', { type: 'digits', digits: d.map((x, i) => (i === d.length - 1 ? null : x)), carries: d.map((x, i) => (i === d.length - 1 ? x : null)) }))
      }
      return out
    }
    case 'fact-mul': case 'fact-div': case 'missing-factor': case 'groups': case 'array':
      return [
        v('número', { type: 'number', value: ex.answer }),
        v('en casillas', { type: 'digits', digits: digitsOf(ex.answer) }),
        v('lista de uno', { type: 'numbers', values: [ex.answer] }),
      ]
    case 'word-problem':
      return ex.remainder
        ? [v('cociente y resto', { type: 'division', quotient: ex.answer, remainder: ex.remainder })]
        : [v('número', { type: 'number', value: ex.answer }), v('en casillas', { type: 'digits', digits: digitsOf(ex.answer) })]
    case 'mental':
      return [v('número', { type: 'number', value: ex.answer })]
    case 'equation':
      return [v('respuesta', ex.answer === '=' || ex.answer === '≠' ? { type: 'sign', sign: ex.answer } : { type: 'number', value: ex.answer })]
    case 'chart':
      return ex.ask === 'most' || ex.ask === 'least'
        ? [v('opción', { type: 'choice', index: ex.answer })]
        : [v('número', { type: 'number', value: ex.answer }), v('lista de uno', { type: 'numbers', values: [ex.answer] })]
    case 'pattern':
      return ex.mode === 'shapes'
        ? [v('figura', { type: 'choice', index: ex.answer })]
        : [v('número', { type: 'number', value: ex.answer }), v('lista de uno', { type: 'numbers', values: [ex.answer] })]
    case 'chance': case 'position': case 'ordinal':
      return [v('opción', { type: 'choice', index: ex.answer })]
    default:
      return [v('respuesta de referencia', correctAnswer(ex))]
  }
}

/** The other choices of a tap-to-answer exercise (in the ordinal «row» mode, the other places of the queue). */
function otherChoices(count: number, right: number): number[] {
  return Array.from({ length: count }, (_, i) => i).filter((i) => i !== right)
}

/** The wrong finals: ±1, ±10, +100 and one digit more (a 1 in front), never negative. */
export function wrongFinals(n: number): { label: string; value: number }[] {
  return [
    { label: '+1', value: n + 1 }, { label: '−1', value: n - 1 }, { label: '+10', value: n + 10 }, { label: '−10', value: n - 10 },
    { label: '+100', value: n + 100 }, { label: 'una cifra de más', value: Number(`1${n}`) },
  ].filter((w) => w.value >= 0 && w.value !== n)
}

/** Answers with the final result wrong and the steps right. Only kinds whose final is one number (or a list). */
export function finalWrongVariants(ex: Exercise, method?: string): Variant[] {
  const methods = method ? [method] : methodsFor(ex)
  const out: Variant[] = []
  const each = (n: number, build: (w: number) => Answer, m?: string) => {
    for (const w of wrongFinals(n)) out.push(v(`final ${w.label}`, build(w.value), m))
  }
  switch (ex.kind) {
    case 'column-add': case 'column-mul':
      each(ex.answer, (w) => ({ type: 'digits', digits: digitsOf(w) }))
      break
    case 'column-sub':
      for (const m of methods) {
        if (m === 'borrow' || m === 'carry') each(ex.answer, (w) => ({ type: 'digits', digits: digitsOf(w), method: m }), m)
        else if (m === 'parts') each(ex.answer, (w) => ({ type: 'steps', method: 'parts', values: partsResults(ex.minuend, ex.subtrahend).map((x, k, all) => (k === all.length - 1 ? w : x)) }), m)
        else each(ex.answer, (w) => ({ type: 'steps', method: 'line', values: lineStops(ex.subtrahend, ex.minuend), total: w }), m)
      }
      break
    case 'division':
      for (const m of methods) {
        const st = divisionParts(ex.dividend, ex.divisor)
        if (m === 'div-parts') {
          each(ex.quotient, (w) => ({ type: 'division-parts', parts: st.map((s) => s.quotient), quotient: w, remainder: ex.remainder }), m)
          each(ex.remainder, (w) => ({ type: 'division-parts', parts: st.map((s) => s.quotient), quotient: ex.quotient, remainder: w }), m)
        } else if (m === 'climb') {
          const products = climbProducts(ex.dividend, ex.divisor)
          each(ex.remainder, (w) => ({ type: 'climb', products, remainder: w }), m)
          each(ex.quotient, (w) => ({ type: 'climb', products: products.map(() => null), remainder: ex.remainder, quotient: w }) as Answer, m)
        } else {
          each(ex.quotient, (w) => ({ type: 'division', quotient: w, remainder: ex.remainder }), m)
          each(ex.remainder, (w) => ({ type: 'division', quotient: ex.quotient, remainder: w }), m)
        }
      }
      break
    case 'mul-parts':
      each(ex.answer, (w) => ({ type: 'numbers', values: [...ex.partials, w] }), 'mul-parts')
      break
    case 'long-mul':
      each(ex.answer, (w) => ({ type: 'long-mul', rows: [], total: digitsOf(w) }), 'long-mul')
      break
    case 'fact-mul': case 'fact-div': case 'missing-factor': case 'groups': case 'array':
      each(ex.answer, (w) => ({ type: 'number', value: w }))
      break
    case 'skip-count': case 'double-chain':
      each(ex.answer[ex.answer.length - 1], (w) => ({ type: 'numbers', values: ex.answer.map((x, i) => (i === ex.answer.length - 1 ? w : x)) }))
      break
    case 'fact-family':
      each(ex.product, (w) => ({ type: 'facts', facts: ex.answer.map((f, i) => (i === 0 ? `${ex.a}x${ex.b}=${w}` : f)) }))
      break
    case 'word-problem':
      each(ex.answer, (w) => (ex.remainder ? { type: 'division', quotient: w, remainder: ex.remainder } : { type: 'number', value: w }))
      if (ex.remainder) each(ex.remainder, (w) => ({ type: 'division', quotient: ex.answer, remainder: w }))
      break
    case 'mental':
      each(ex.answer, (w) => ({ type: 'number', value: w }))
      break
    case 'equation':
      if (ex.answer === '=' || ex.answer === '≠') out.push(v('el otro signo', { type: 'sign', sign: ex.answer === '=' ? '≠' : '=' }))
      else each(ex.answer, (w) => ({ type: 'number', value: w }))
      break
    case 'chart': case 'pattern': {
      const choice = ex.kind === 'chart' ? ex.ask === 'most' || ex.ask === 'least' : ex.mode === 'shapes'
      if (choice) for (const i of otherChoices(ex.options.length, ex.answer)) out.push(v(`opción ${i}`, { type: 'choice', index: i }))
      else each(ex.answer, (w) => ({ type: 'number', value: w }))
      break
    }
    case 'chance': case 'position':
      for (const i of otherChoices(ex.options.length, ex.answer)) out.push(v(`opción ${i}`, { type: 'choice', index: i }))
      break
    case 'ordinal': {
      const count = ex.mode === 'row' ? ex.items.length : ex.options.length
      for (const i of otherChoices(count, ex.answer)) out.push(v(`opción ${i}`, { type: 'choice', index: i }))
      break
    }
    default:
      break
  }
  return out
}
