/* P1, permanent property test: «una respuesta final correcta jamás se da por mala; nada incorrecto se da por bueno».
   For every maths skill graded by the operations checker (facts, column add/sub/mul, division, word problems, mul-parts,
   long-mul) and for every written method (sub: borrow, carry, parts, line; div: galera, galera-short, div-parts, climb;
   mul-parts; long-mul), at least 60 seeds:
   (1) a right final with any steps in between (empty, at random, from the other method, in another order, half written)
       is correct, and its message starts with the praise (never «¡Casi!» nor «te falta»);
   (2) a final ±1, ±10, +100 or with one digit more is never correct.
   The domain kinds (bars, bugs, fractions, clock, money, decimals, geometry, numeric) have their own file built on the
   same harness (p1-propiedades-dominios). The literal cases of the audit (branches auditoria/p1-suma-resta and
   auditoria/p1-mul-div, and the critic's photo cases) follow, each as a plain `it`. */
import { describe, expect, it } from 'vitest'
import {
  check, climbProducts, createRng, divisionParts, generate, lineStops, makeColumnSub, makeDivision, makeFactFamily,
  makeLongMul, makeMulParts, makeWordProblem,
} from '@/engine'
import type { Answer, CheckResult, Exercise, ExerciseKind } from '@/types'
import { SKILL_CASES, finalCorrectVariants, finalWrongVariants, forEachSkill, methodsFor, type SkillCase } from './p1-harness'

const SEEDS = 60

/** The kinds this file covers: those graded in check.ts, bigops.ts and longmul.ts. */
const SCOPE: ExerciseKind[] = [
  'fact-mul', 'fact-div', 'missing-factor', 'skip-count', 'groups', 'array', 'double-chain', 'fact-family',
  'column-add', 'column-sub', 'column-mul', 'division', 'word-problem', 'mul-parts', 'long-mul',
]
const CASES = SKILL_CASES.filter((c) => SCOPE.includes(c.kind))
const PRAISE_ONLY = /Casi|falta/

interface Miss { ex: string; label: string; method?: string; result: CheckResult }
const show = (m: Miss) => `${m.ex} [${m.method ?? '-'}] ${m.label} → correct=${m.result.correct} ${m.result.errorType ?? ''} «${m.result.feedback}»`

/** Seeds that produced at least one exercise for each method, over the whole file (a method must reach ≥ 60). */
const methodSeeds = new Map<string, Set<string>>()

function sweep(c: SkillCase, want: boolean): { covered: number; tried: number; misses: Miss[] } {
  const misses: Miss[] = []
  let tried = 0
  const covered = forEachSkill((x) => x === c, SEEDS, (ex: Exercise, _c, seed) => {
    for (const method of methodsFor(ex)) {
      const key = `${c.kind}:${method}`
      if (!methodSeeds.has(key)) methodSeeds.set(key, new Set())
      methodSeeds.get(key)!.add(`${c.name}:${seed}`)
      const variants = want ? finalCorrectVariants(ex, method === '-' ? undefined : method) : finalWrongVariants(ex, method === '-' ? undefined : method)
      for (const variant of variants) {
        tried++
        const result = check(ex, variant.answer, variant.method ? { method: variant.method } : {})
        const bad = want ? !result.correct || PRAISE_ONLY.test(result.feedback ?? '') : result.correct
        if (bad) misses.push({ ex: ex.id, label: variant.label, method: variant.method, result })
      }
    }
  }).get(c.name) ?? 0
  return { covered, tried, misses }
}

describe('P1 (1): un final correcto con cualquier paso intermedio es correcto', () => {
  it.each(CASES.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const { covered, tried, misses } = sweep(c, true)
    expect(covered, `${c.name}: semillas con ejercicio`).toBeGreaterThanOrEqual(SEEDS)
    expect(tried).toBeGreaterThan(0)
    expect(misses.length, misses.slice(0, 5).map(show).join('\n')).toBe(0)
  })
})

describe('P1 (2): un final equivocado nunca es correcto', () => {
  it.each(CASES.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const { tried, misses } = sweep(c, false)
    expect(tried).toBeGreaterThan(0)
    expect(misses.length, misses.slice(0, 5).map(show).join('\n')).toBe(0)
  })
})

/* The kinds graded outside check.ts that no other property file takes (calc, data, patterns, position, ordinals):
   the reference answer built from the exercise is correct, and every other choice or a number ±1, ±10, +100 or with
   one digit more is not. */
const OTHER_KINDS: ExerciseKind[] = ['mental', 'equation', 'chart', 'chance', 'pattern', 'position', 'ordinal']
const OTHER_CASES = SKILL_CASES.filter((c) => OTHER_KINDS.includes(c.kind))

describe('P1 en cálculo mental, igualdades, gráficos, azar, series, posición y ordinales', () => {
  it('están todos en el registro', () => {
    expect([...new Set(OTHER_CASES.map((c) => c.kind))].sort()).toEqual([...OTHER_KINDS].sort())
  })
  it.each(OTHER_CASES.map((c) => [c.name, c] as const))('%s: la respuesta de referencia es correcta y las otras no', (_name, c) => {
    const misses: Miss[] = []
    let wrongs = 0
    const covered = forEachSkill((x) => x === c, SEEDS, (ex) => {
      for (const variant of finalCorrectVariants(ex)) {
        const result = check(ex, variant.answer)
        if (!result.correct || PRAISE_ONLY.test(result.feedback ?? '')) misses.push({ ex: ex.id, label: variant.label, result })
      }
      for (const variant of finalWrongVariants(ex)) {
        wrongs++
        const result = check(ex, variant.answer)
        if (result.correct) misses.push({ ex: ex.id, label: variant.label, result })
      }
    }).get(c.name) ?? 0
    expect(covered).toBeGreaterThanOrEqual(SEEDS)
    expect(wrongs).toBeGreaterThan(0)
    expect(misses.length, misses.slice(0, 5).map(show).join('\n')).toBe(0)
  })
})

describe('P1: cada método se prueba con al menos 60 semillas', () => {
  it.each([
    'column-sub:borrow', 'column-sub:carry', 'column-sub:parts', 'column-sub:line',
    'division:galera', 'division:galera-short', 'division:div-parts', 'division:climb', 'mul-parts:mul-parts', 'long-mul:long-mul',
  ])('%s', (key) => {
    if (!methodSeeds.has(key)) for (const c of CASES) sweep(c, true)
    expect(methodSeeds.get(key)?.size ?? 0).toBeGreaterThanOrEqual(SEEDS)
  })
})

/* The praise rule (P1-SR-5) in every maths kind: whatever is graded correct is celebrated, never with «¡Casi!» nor
   «te falta». The domain kinds' right answers are built in their own file; here any answer that comes out correct is
   looked at (the reference one and the variants above). */
describe('P1 en todos los tipos de matemáticas: un acierto se celebra sin «Casi» ni «falta»', () => {
  it.each(SKILL_CASES.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const misses: Miss[] = []
    forEachSkill((x) => x === c, 20, (ex) => {
      for (const variant of finalCorrectVariants(ex)) {
        const result = check(ex, variant.answer, variant.method ? { method: variant.method } : {})
        if (result.correct && PRAISE_ONLY.test(result.feedback ?? '')) misses.push({ ex: ex.id, label: variant.label, result })
      }
    })
    expect(misses.length, misses.slice(0, 5).map(show).join('\n')).toBe(0)
  })
})

// ---------------------------------------------------------------- the literal cases of the audit

const line = (values: (number | null)[], total: number | null): Answer => ({ type: 'steps', method: 'line', values, total })
const parts = (values: (number | null)[]): Answer => ({ type: 'steps', method: 'parts', values })

describe('foto 1: 212 − 40 con saltos, total 172', () => {
  const ex = makeColumnSub(212, 40)
  it('la ruta de libro es 200, 210 y el total 172', () => {
    expect(lineStops(40, 212)).toEqual([200, 210])
    expect(ex.answer).toBe(172)
  })
  it.each([
    ['[212, 40] (lo que se ve en la foto)', [212, 40]],
    ['[160, 10]', [160, 10]],
    ['[null, 210]', [null, 210]],
    ['[200, 210, 212]', [200, 210, 212]],
    ['[40, 200, 210]', [40, 200, 210]],
    ['[null, null]', [null, null]],
  ] as const)('paradas %s, total 172 → correcta y sin «Casi»', (_l, stops) => {
    const r = check(ex, line([...stops], 172), { method: 'line' })
    expect(r.correct).toBe(true)
    expect(r.feedback).not.toMatch(PRAISE_ONLY)
  })
  it('las paradas fuera de orden solo dejan una nota detrás del acierto', () => {
    expect(check(ex, line([212, 40], 172), { method: 'line' }).feedback).toBe('¡Muy bien, 172! Los saltos van de menor a mayor: 40, 200, 210 y 212.')
  })
  it('total 171 → mal; total vacío → incompleta con «Escribe cuánto has saltado en total.»', () => {
    expect(check(ex, line([200, 210], 171), { method: 'line' }).correct).toBe(false)
    expect(check(ex, line([200, 210], null), { method: 'line' })).toMatchObject({ correct: false, errorType: 'incomplete', feedback: 'Escribe cuánto has saltado en total.' })
  })
})

describe('resta por partes: el último número escrito es la respuesta', () => {
  const ex = makeColumnSub(352, 127)
  it('352 − 127 [null, null, 225], [225, null, null] y [345, 325, 225] → correcta', () => {
    for (const v of [[null, null, 225], [225, null, null], [345, 325, 225]]) {
      const r = check(ex, parts(v), { method: 'parts' })
      expect(r.correct, JSON.stringify(v)).toBe(true)
      expect(r.feedback).not.toMatch(PRAISE_ONLY)
    }
  })
  it('93 − 12 [84, 81] → correcta', () => {
    expect(check(makeColumnSub(93, 12), parts([84, 81]), { method: 'parts' }).correct).toBe(true)
  })
  it('[252, 232, 224] → mal, con el mensaje del paso', () => {
    const r = check(ex, parts([252, 232, 224]), { method: 'parts' })
    expect(r.correct).toBe(false)
    expect(r.feedback).toBe('¡Casi! Revisa el paso 3: a 232 hay que quitarle 7.')
  })
  it('[225, null, 999]: el resultado ya estaba en el paso 1; se nombra el último paso, no el 1', () => {
    const r = check(ex, parts([225, null, 999]), { method: 'parts' })
    expect(r.correct).toBe(false)
    expect(r.feedback).toBe('¡Ya tenías el resultado en el paso 1: 225! El último número que escribes es la respuesta: revisa el paso 3.')
    expect(r.feedback).not.toContain('Revisa el paso 1')
  })
})

describe('multiplicar por partes: el total decide', () => {
  const nums = (values: (number | null)[]): Answer => ({ type: 'numbers', values })
  it('23 × 14 [230, 92, 322], [92, 230, 322], [92, 23, 322] y [null, null, 322] → correcta', () => {
    const ex = makeMulParts(23, 14)
    for (const v of [[230, 92, 322], [92, 230, 322], [92, 23, 322], [null, null, 322]]) {
      const r = check(ex, nums(v))
      expect(r.correct, JSON.stringify(v)).toBe(true)
      expect(r.feedback).not.toMatch(PRAISE_ONLY)
    }
  })
  it('sin el cero y con el total bien: correcta, y un consejo detrás del acierto', () => {
    expect(check(makeMulParts(23, 14), nums([92, 23, 322])).feedback).toBe('¡Muy bien! Has multiplicado por partes. Un consejo: al multiplicar por 10, pon el cero de la derecha: 23 × 10 = 230.')
  })
  it('72 × 49 [2880, 648, 3528] → correcta', () => {
    expect(check(makeMulParts(72, 49), nums([2880, 648, 3528])).correct).toBe(true)
  })
  it('total 321 → mal; una parte bien en la otra línea no se acusa', () => {
    const ex = makeMulParts(23, 14)
    expect(check(ex, nums([92, 230, 321])).correct).toBe(false)
    const swapped = check(ex, nums([230, 92, 321]))
    expect(swapped.correct).toBe(false)
    expect(swapped.feedback).not.toMatch(/23 × 4|23 × 10/)
    expect(check(ex, nums([92, 23, 115])).feedback).toContain('no olvides el cero')
    expect(check(ex, nums([93, 230, 323])).feedback).toBe('¡Casi! Revisa 23 × 4.')
  })
})

describe('repartir por partes: el cociente y el resto deciden', () => {
  const dp = (p: (number | null)[], quotient: number | null, remainder: number | null = null): Answer => ({ type: 'division-parts', parts: p, quotient, remainder })
  it('84 ÷ 4 partes [2, 1] cociente 21 → correcta (la parte en decenas)', () => {
    expect(check(makeDivision(84, 4), dp([2, 1], 21)).correct).toBe(true)
  })
  it('partes [null, null] cociente 21 → correcta', () => {
    expect(check(makeDivision(84, 4), dp([null, null], 21)).correct).toBe(true)
  })
  it('una parte errónea con el total bien → correcta, en todas las divisiones de una cifra', () => {
    const misses: string[] = []
    let n = 0
    for (let seed = 1; seed <= 120; seed++) {
      for (const ex of generate({ skills: ['div:2x1:exact', 'div:2x1:rem', 'div:2x1:long', 'div:3x1:exact', 'div:3x1:rem'] }, 4, { rng: createRng(seed) })) {
        if (ex.kind !== 'division' || ex.divisor >= 10) continue
        n++
        const st = divisionParts(ex.dividend, ex.divisor)
        const p = st.map((s, k) => (k === st.length - 1 ? s.quotient + 1 : s.quotient))
        if (!check(ex, dp(p, ex.quotient, ex.remainder)).correct) misses.push(ex.id)
      }
    }
    expect(n).toBeGreaterThan(100)
    expect(misses).toEqual([])
  })
  it('con el cociente mal, la parte equivocada se nombra por su paso', () => {
    const r = check(makeDivision(84, 4), dp([19, 1], 20))
    expect(r).toMatchObject({ correct: false, errorType: 'fact' })
    expect(r.feedback).toContain('paso 1')
  })
  it('84 ÷ 4 [2, 1] y cociente 3 (sumó las decenas tal cual): dice cuánto vale el 2 y la suma que falta', () => {
    const r = check(makeDivision(84, 4), dp([2, 1], 3))
    expect(r).toMatchObject({ correct: false, errorType: 'other' })
    expect(r.feedback).toBe('Tu 2 son 2 decenas, es decir, 20. Ahora suma: 20 + 1 = ?')
    expect(r.feedback).not.toContain('Ya tienes bien las partes')
    expect(check(makeDivision(84, 4), dp([2, 1], null))).toMatchObject({ correct: false, errorType: 'incomplete', feedback: 'Tu 2 son 2 decenas, es decir, 20. Ahora suma: 20 + 1 = ?' })
  })
  it('con las partes de libro y el cociente mal, el mensaje es «súmalas»', () => {
    expect(check(makeDivision(84, 4), dp([20, 1], 22)).feedback).toBe('Ya tienes bien las partes. Ahora súmalas: eso es el cociente (lo que le toca a cada uno).')
  })
})

describe('multiplicar hacia arriba: el cociente y el resto deciden', () => {
  const climb = (products: (number | null)[], remainder: number | null, quotient?: number): Answer =>
    ({ type: 'climb', products, remainder, ...(quotient === undefined ? {} : { quotient }) }) as Answer
  it('29 ÷ 4 filas 4…28 sin la fila 32, resto 1 → correcta', () => {
    expect(check(makeDivision(29, 4), climb([4, 8, 12, 16, 20, 24, 28], 1)).correct).toBe(true)
  })
  it('54 ÷ 7 con la fila 2 = 15, resto 5 y cociente 7 → correcta', () => {
    const products = climbProducts(54, 7).map((p, k) => (k === 1 ? 15 : p))
    expect(check(makeDivision(54, 7), climb(products, 5, 7)).correct).toBe(true)
    expect(check(makeDivision(54, 7), climb(products, 5)).correct).toBe(true)
  })
  it('28 ÷ 4 filas [4, 8, 120] → mal, nombra la fila 3; corregidas, correcta', () => {
    const r = check(makeDivision(28, 4), climb([4, 8, 120], null))
    expect(r.correct).toBe(false)
    expect(r.feedback).toBe('¡Casi! Revisa la fila 3: ¿cuánto es 4 por 3?')
    expect(check(makeDivision(28, 4), climb([4, 8, 12, 16, 20, 24, 28], null)).correct).toBe(true)
  })
  it('un cociente escrito equivocado no se da por bueno', () => {
    expect(check(makeDivision(29, 4), climb([null], 1, 6)).correct).toBe(false)
  })
  it('29 ÷ 4 con las filas bien hasta 32 y el cociente 8: error de cociente, nunca «Sigue subiendo»', () => {
    const products = climbProducts(29, 4)
    expect(products[products.length - 1]).toBe(32)
    for (const rows of [products, products.map(() => null)]) {
      const r = check(makeDivision(29, 4), climb(rows, 1, 8))
      expect(r).toMatchObject({ correct: false, errorType: 'fact' })
      expect(r.feedback).toBe('Revisa el cociente (lo que le toca a cada uno): cuenta las filas que no pasan de 29.')
    }
  })
})

describe('familia de un cuadrado: makeFactFamily(6, 6)', () => {
  it('las cuatro casillas de FactFamilyView (cada hecho dos veces) → correcta', () => {
    expect(check(makeFactFamily(6, 6), { type: 'facts', facts: ['6x6=36', '6x6=36', '36/6=6', '36/6=6'] }).correct).toBe(true)
  })
  it('un hecho tres veces o uno que falta no vale', () => {
    expect(check(makeFactFamily(6, 6), { type: 'facts', facts: ['6x6=36', '6x6=36', '6x6=36', '36/6=6'] }).correct).toBe(false)
    expect(check(makeFactFamily(6, 6), { type: 'facts', facts: ['6x6=36', '6x6=36'] }).correct).toBe(false)
  })
})

describe('multiplicar en columna (long-mul): solo el total califica', () => {
  it('23 × 14: total 322 con filas vacías o mal → correcta; 323 → mal', () => {
    const ex = makeLongMul(23, 14)
    expect(check(ex, { type: 'long-mul', rows: [[null, null, null], [0, null, null]], total: [2, 2, 3] }).correct).toBe(true)
    expect(check(ex, { type: 'long-mul', rows: [[9, 9, 9], [0, 9, 9]], total: [2, 2, 3] }).correct).toBe(true)
    expect(check(ex, { type: 'long-mul', rows: [], total: [3, 2, 3] }).correct).toBe(false)
  })
})

describe('problema de texto con resto', () => {
  const ex = makeWordProblem('div-galletas', 'Reparte 29 galletas entre 4 amigos.', 'div', 29, 4, 'galletas')
  it('el cociente bien y el resto vacío → incompleta: «Te falta escribir lo que sobra.»', () => {
    expect(check(ex, { type: 'division', quotient: 7, remainder: null })).toMatchObject({
      correct: false, errorType: 'incomplete', feedback: 'Te falta escribir lo que sobra.',
    })
  })
  it('cociente y resto bien → correcta; el resto mal → mal', () => {
    expect(check(ex, { type: 'division', quotient: 7, remainder: 1 }).correct).toBe(true)
    expect(check(ex, { type: 'division', quotient: 7, remainder: 2 }).correct).toBe(false)
  })
})

describe('mensajes de la resta según el método (auditoría p1-mensajes)', () => {
  it('«me llevo una»: 52 − 27 = 35 (restar el pequeño del grande) habla de «me llevo una», no de la vecina', () => {
    const r = check(makeColumnSub(52, 27), { type: 'digits', digits: [5, 3], method: 'carry' }, { method: 'carry' })
    expect(r.errorType).toBe('smaller-from-larger')
    expect(r.feedback).toContain('Me llevo una')
    expect(r.feedback).not.toMatch(/vecina/)
  })
  it('pedir prestado conserva su mensaje de la vecina', () => {
    expect(check(makeColumnSub(52, 27), { type: 'digits', digits: [5, 3] }).feedback).toContain('vecina')
  })
})

describe('multiplicar en columna 2 × 2: la entrada suave de 3.º', () => {
  const draw = (regroup?: 'one') => generate({ skills: ['mul:col:2x2'], ...(regroup ? { regroup } : {}) }, 40, { rng: createRng(7) })
    .filter((e) => e.kind === 'long-mul')

  it('con pocas llevadas (regroup one) el de abajo va de 11 a 19 y la fila de las unidades lleva poco', () => {
    const items = draw('one')
    expect(items.length).toBeGreaterThan(10)
    for (const ex of items) {
      expect(ex.bottom, ex.id).toBeGreaterThanOrEqual(11)
      expect(ex.bottom, ex.id).toBeLessThanOrEqual(19)
      expect(ex.top, ex.id).toBeLessThanOrEqual(34)
      expect((ex.top % 10) * (ex.bottom % 10), ex.id).toBeLessThan(30)
      expect(ex.answer).toBe(ex.top * ex.bottom)
    }
  })

  it('sin pedirlo, 4.º sigue con el rango completo 12-99 × 12-99', () => {
    expect(draw().some((ex) => ex.bottom > 19 || ex.top > 34)).toBe(true)
  })
})
