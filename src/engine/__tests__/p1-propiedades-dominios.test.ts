/* P1 — «una respuesta final correcta jamás se da por mala; nada incorrecto se da por bueno» — en problemas, fracciones,
   decimales, dinero, medida, tiempo, geometría, datos y numeración.
   For hundreds of generated exercises per kind (many seeds) the test builds (1) the book answer, which must be right;
   (2) answers with the right final result and the intermediate fields changed (another order, another equivalent form,
   another valid notation), which must be right too; (3) wrong final results, which must never be right. Then the cases
   of the audit branches auditoria/p1-medida-problemas and auditoria/p1-numeros, with the P1 expectation. */
import { describe, expect, it } from 'vitest'
import { check, createRng, generate, hintsFor } from '@/engine'
import { makeWordProblem } from '@/engine/make'
import { explainHunt } from '@/engine/bugs'
import { fractionName, genFractionOf } from '@/engine/fractions'
import { SHOP } from '@/engine/money'
import type {
  Answer, BarProblemExercise, CheckCalcExercise, CheckResult, ErrorHuntExercise, Exercise, MoneyBudgetExercise, MoneyChangeExercise,
  SkillKey,
} from '@/types'
import { correctAnswer } from './helpers'

// ---------------------------------------------------------------- the minimal harness

/** `per` exercises of each skill for `seeds` seeds, without repeats. */
function sample(skills: SkillKey | SkillKey[], seeds = 30, per = 10): Exercise[] {
  const out = new Map<string, Exercise>()
  for (const skill of Array.isArray(skills) ? skills : [skills]) {
    for (let seed = 1; seed <= seeds; seed++) {
      for (const ex of generate({ skills: [skill] }, per, { rng: createRng(seed * 7919 + 13) })) if (!out.has(ex.id)) out.set(ex.id, ex)
    }
  }
  return [...out.values()]
}
const of = <K extends Exercise['kind']>(list: Exercise[], k: K) => list.filter((e): e is Extract<Exercise, { kind: K }> => e.kind === k)

interface Miss { id: string; answer?: Answer; result?: CheckResult; note?: string }
/** Prints how many and the first examples, then fails when there is any. */
function report(title: string, misses: Miss[], total: number) {
  if (misses.length) {
    const lines = misses.slice(0, 4).map((m) => `  · ${m.note ?? m.id}\n    respuesta ${JSON.stringify(m.answer)}\n    → ${JSON.stringify(m.result && { correct: m.result.correct, errorType: m.result.errorType, feedback: m.result.feedback })}`)
    console.log(`\n[P1] ${title}: ${misses.length} de ${total}\n${lines.join('\n')}`)
  }
  expect(misses.length, `${title}: ${misses.length} de ${total}`).toBe(0)
}
const text = (s: string): Miss => ({ id: s, note: s })

/** The book answer of a money exercise, in the shape MoneyView sends. */
function moneyAnswer(ex: Extract<Exercise, { kind: 'money' }>): Answer {
  switch (ex.mode) {
    case 'recognise': return { type: 'option', value: String(ex.answer) }
    case 'pay': return { type: 'pieces', pieces: [ex.price] }
    case 'compare': return { type: 'option', value: ex.answer }
    case 'convert': return ex.direction === 'to-cents' ? { type: 'number', value: ex.answer as number } : { type: 'numbers', values: [...(ex.answer as number[])] }
    case 'budget': return ex.ask === 'short' || ex.ask === 'left'
      ? { type: 'numbers', values: [Math.floor((ex.answer as number) / 100), (ex.answer as number) % 100] }
      : { type: 'option', value: String(ex.answer) }
    default: return { type: 'numbers', values: [Math.floor(ex.answer / 100), ex.answer % 100] }
  }
}

/** The book answer of any exercise of this family. */
function bookAnswer(ex: Exercise): Answer {
  if (ex.kind === 'money') return moneyAnswer(ex)
  if (ex.kind === 'fraction-add') return { type: 'fraction', numerator: ex.answer, denominator: ex.denominator }
  return correctAnswer(ex)
}

/** Wrong final answers built from the book one (one more, another option, another sign…): none can be right. */
function wrongAnswers(ex: Exercise): Answer[] {
  const a = bookAnswer(ex)
  const bump = (v: number) => (v % 10 === 9 ? v - 1 : v + 1)
  switch (a.type) {
    case 'number': return a.value === null ? [] : [{ type: 'number', value: a.value + 1 }, { type: 'number', value: a.value + 10 }]
    case 'numbers': {
      const k = a.values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop()
      if (k === undefined) return []
      const vs = [...a.values]
      vs[k] = bump(vs[k] as number)
      return [{ type: 'numbers', values: vs }]
    }
    case 'fraction': return [{ type: 'fraction', numerator: (a.numerator as number) + 1, denominator: a.denominator }]
    case 'shade': return ex.kind === 'fraction-shade' && a.chosen.length < ex.denominator ? [{ type: 'shade', chosen: [...a.chosen, a.chosen.length] }] : []
    case 'marks': return [{ type: 'marks', marked: a.marked.length ? a.marked.slice(1) : [0] }]
    case 'choice': {
      const n = 'options' in ex && Array.isArray(ex.options) ? ex.options.length : 0
      return n > 1 ? [{ type: 'choice', index: ((a.index as number) + 1) % n }] : []
    }
    case 'option': {
      const opts = ex.kind === 'money' && ex.mode === 'recognise' ? ex.options.map(String)
        : ex.kind === 'money' && ex.mode === 'compare' ? ex.items.map((it) => it.name)
          : ex.kind === 'money' && ex.mode === 'budget' && ex.ask === 'afford' ? ex.items.map((it) => it.name)
            : ex.kind === 'money' && ex.mode === 'budget' ? ['Sí', 'No']
              : ex.kind === 'measure' && ex.mode === 'unit' ? ex.options.map((o) => o.unit) : []
      return opts.filter((o) => o !== a.value).slice(0, 1).map((o) => ({ type: 'option', value: o }))
    }
    case 'sign': return (['<', '>', '='] as const).filter((s) => s !== a.sign).map((s) => ({ type: 'sign', sign: s }))
    case 'time': return [{ type: 'time', hour: a.hour, minute: ((a.minute as number) + 5) % 60 }]
    case 'pieces': return [{ type: 'pieces', pieces: [...a.pieces, 1] }]
    default: return []
  }
}

// ---------------------------------------------------------------- problemas con barras

describe('barras: el resultado final decide (auditoría p1-medida-problemas H1, H2, H3, H17; P4-16)', () => {
  const bars = of(sample(['bar:add', 'bar:sub', 'bar:mul', 'bar:div', 'bar:two', 'bar:three']), 'bar-problem')
  const right = (ex: BarProblemExercise): Answer & { type: 'bar' } =>
    ({ type: 'bar', placed: ex.bar.map((b) => b.value), ops: ex.steps.map((s) => s.op), results: ex.steps.map((s) => s.result) })

  it('la respuesta de libro es correcta y un resultado final distinto nunca lo es', () => {
    const misses: Miss[] = []
    for (const ex of bars) {
      if (!check(ex, right(ex)).correct) misses.push({ id: ex.id, note: `${ex.text} (libro)` })
      for (const d of [1, -1, 10]) {
        const a = right(ex)
        a.results[a.results.length - 1] = ex.answer + d
        if (check(ex, a).correct) misses.push({ id: ex.id, answer: a, note: `${ex.text} acepta ${ex.answer + d}` })
      }
    }
    report('barras: libro mal o resultado malo aceptado', misses, bars.length)
  })

  it('dos números de la historia colocados al revés y la respuesta bien → correcto (con nota si cambia la historia)', () => {
    const misses: Miss[] = []
    let total = 0
    for (const ex of bars) {
      const given = ex.bar.map((b, i) => (b.value === null ? -1 : i)).filter((i) => i >= 0)
      const pair = given.find((i, k) => given.slice(k + 1).some((j) => ex.bar[j].row === ex.bar[i].row && ex.bar[j].value !== ex.bar[i].value))
      if (pair === undefined) continue
      const j = given.find((x) => x !== pair && ex.bar[x].row === ex.bar[pair].row && ex.bar[x].value !== ex.bar[pair].value)!
      const a = right(ex)
      ;[a.placed[pair], a.placed[j]] = [a.placed[j], a.placed[pair]]
      total++
      const r = check(ex, a)
      if (!r.correct) misses.push({ id: ex.id, answer: a, result: r, note: `${ex.text} («${ex.bar[pair].name}» ↔ «${ex.bar[j].name}»)` })
      const harmless = ex.steps.length === 1 && (ex.steps[0].op === 'add' || ex.steps[0].op === 'mul')
      if (harmless && r.feedback?.includes('Fíjate')) misses.push({ id: ex.id, answer: a, result: r, note: `${ex.text}: nota en una suma o un producto` })
    }
    expect(total).toBeGreaterThan(300)
    report('barras con dos números intercambiados y la respuesta bien', misses, total)
  })

  it('la nota de una colocación que cambia la historia nombra la parte («Fíjate en la barra: el 32 va en «Niñas»»)', () => {
    const ex = bars.find((e) => e.id.startsWith('bar-problem:combine-part'))!
    const a = right(ex)
    const girls = ex.bar.findIndex((b) => b.id === 'girls')
    const all = ex.bar.findIndex((b) => b.id === 'all')
    ;[a.placed[girls], a.placed[all]] = [a.placed[all], a.placed[girls]]
    const r = check(ex, a)
    expect(r.correct).toBe(true)
    expect(r.feedback).toContain(`son ${ex.answer} niños`)
    expect(r.feedback).toContain('Fíjate en la barra')
  })

  it('tres pasos hechos en otro orden válido (sumar lo que le dan antes de restar lo que pierde) → correcto', () => {
    const misses: Miss[] = []
    let total = 0
    for (const ex of bars) {
      if (ex.steps.length !== 3) continue
      const [s1, s2, s3] = ex.steps
      if (!(s2.op === 'sub' && s3.op === 'add')) continue
      const q = s3.b
      const g = s2.b
      const a: Answer = { type: 'bar', placed: ex.bar.map((b) => b.value), ops: [s1.op, 'add', 'sub'], results: [s1.result, s1.result + q, s1.result + q - g] }
      total++
      const r = check(ex, a)
      if (!r.correct) misses.push({ id: ex.id, answer: a, result: r, note: `${ex.text} → ${s1.result} + ${q}; − ${g} = ${ex.answer}` })
    }
    expect(total).toBeGreaterThan(100)
    report('tres pasos en otro orden con la respuesta final bien', misses, total)
  })

  it('un paso intermedio equivocado: el mensaje nombra ese paso y su cuenta («El paso 2 no sale: 28 − 19 son 9, no 10.»)', () => {
    const misses: Miss[] = []
    let total = 0
    const sym = { add: '+', sub: '−', mul: '×', div: '÷' }
    for (const ex of bars) {
      for (let k = 0; k < ex.steps.length - 1; k++) {
        const a = right(ex)
        // Step k is wrong by one and the child carries the slip to the end (the final result is wrong too).
        for (let j = k; j < ex.steps.length; j++) a.results[j] = ex.steps[j].result + 1
        total++
        const r = check(ex, a)
        const st = ex.steps[k]
        const want = `paso ${k + 1} no sale: ${st.a} ${sym[st.op]} ${st.b} son ${st.result}, no ${st.result + 1}`
        if (r.correct || !(r.feedback ?? '').includes(want)) misses.push({ id: ex.id, answer: a, result: r, note: `${ex.text} — falla el paso ${k + 1}` })
      }
    }
    expect(total).toBeGreaterThan(200)
    report('mensaje de paso intermedio que no nombra el paso', misses, total)
  })

  it('«quedan» (change-sub-end): lo que tenía es la barra entera y el ? es «Le quedan»', () => {
    const ex = bars.find((e) => e.id.startsWith('bar-problem:change-sub-end'))!
    expect(ex.bar.find((b) => b.value === null)?.name).toBe('Le quedan')
    expect(ex.bar.find((b) => b.kind === 'total')?.name).toBe('Tenía')
  })

  it('«Los reparte» con cromos; las pistas de un producto no dicen «repártela»', () => {
    const two = bars.filter((e) => e.skill === 'bar:two')
    report('«Lo reparte» con cromos', two.filter((e) => /Lo reparte/.test(e.text) || e.bar.some((b) => b.name === 'Lo reparte')).map((e) => text(e.text)), two.length)
    const mul = bars.filter((e) => e.skill === 'bar:mul' || e.skill === 'bar:mul:small')
    expect(mul.length).toBeGreaterThan(20)
    for (const ex of mul) {
      expect(hintsFor(ex).map((h) => h.text).join(' '), ex.id).not.toMatch(/repárt/)
      expect(hintsFor(ex)[0].text).toContain(`${ex.steps[0].a} trozos iguales de ${ex.steps[0].b}`)
    }
  })
})

describe('problemas de texto con resto', () => {
  // checkWord lives in src/engine/check.ts (group p1-corrector-operaciones): enable when it grades the empty «Sobra» as incomplete.
  it.skip('el cociente bien y el «Sobra» aún vacío es «incompleto», no un error de cuenta', () => {
    const ex = makeWordProblem('div-galletas', 'Reparte 29 galletas entre 4 amigos.', 'div', 29, 4, 'galletas')
    const r = check(ex, { type: 'division', quotient: 7, remainder: null })
    expect(r.errorType).toBe('incomplete')
  })
})

// ---------------------------------------------------------------- encuentra el error y comprobar

const digitOf = (n: number, i: number) => Math.floor(n / 10 ** i) % 10
const len = (n: number) => String(Math.abs(n)).length

describe('encuentra el error (auditoría p1-numeros p1n-01, p1n-06; P4-21)', () => {
  const hunts = of(sample(['hunt:add', 'hunt:sub', 'hunt:mul'], 60, 12), 'error-hunt')

  it('libro correcto; el resultado mostrado (malo) nunca pasa', () => {
    const misses: Miss[] = []
    for (const ex of hunts) {
      const book: Answer = ex.wrongColumn === null ? { type: 'hunt', ok: true, column: null, value: null } : { type: 'hunt', ok: false, column: ex.wrongColumn, value: ex.answer }
      if (!check(ex, book).correct) misses.push({ id: ex.id, answer: book })
      if (ex.wrongColumn !== null && check(ex, { type: 'hunt', ok: false, column: ex.wrongColumn, value: ex.shown }).correct) misses.push({ id: ex.id, note: 'acepta el mostrado' })
      if (ex.wrongColumn !== null && check(ex, { type: 'hunt', ok: true, column: null, value: null }).correct) misses.push({ id: ex.id, note: 'acepta «bien»' })
    }
    report('encuentra el error: libro o malo', misses, hunts.length)
  })

  it('con el resultado bien escrito, tocar cualquier otra columna no suspende', () => {
    const misses: Miss[] = []
    let total = 0
    for (const ex of hunts.filter((e) => e.wrongColumn !== null)) {
      const cols = Math.max(len(ex.top), len(ex.bottom), len(ex.shown)) + 1
      for (let c = 0; c < cols; c++) {
        if (c === ex.wrongColumn) continue
        const a: Answer = { type: 'hunt', ok: false, column: c, value: ex.answer }
        total++
        const r = check(ex, a)
        if (!r.correct) misses.push({ id: ex.id, answer: a, result: r, note: `${ex.top} ${ex.op} ${ex.bottom} muestra ${ex.shown}; columna ${c + 1}` })
      }
    }
    expect(total).toBeGreaterThan(500)
    report('columna distinta con el valor correcto', misses, total)
  })

  it('479 + 229 mostrado 698: toca las centenas y escribe 708 → correcto', () => {
    const base = hunts.find((e) => e.op === 'add')!
    const ex: ErrorHuntExercise = { ...base, top: 479, bottom: 229, shown: 698, answer: 708, wrongColumn: 1, errorType: 'carry-forgot' }
    expect(check(ex, { type: 'hunt', ok: false, column: 2, value: 708 }).correct).toBe(true)
  })

  it('escribir solo la cifra arreglada: «resultado entero», nunca «vuelve a calcular esa columna»', () => {
    const base = hunts.find((e) => e.op === 'add')!
    const ex: ErrorHuntExercise = { ...base, top: 293, bottom: 358, shown: 641, answer: 651, wrongColumn: 1, errorType: 'carry-forgot' }
    const r = check(ex, { type: 'hunt', ok: false, column: 1, value: 5 })
    expect(r.correct).toBe(false)
    expect(r.feedback).toContain('resultado entero')
    expect(r.feedback).toContain('esa cifra es la buena')
    const other = check(ex, { type: 'hunt', ok: false, column: 1, value: 650 })
    expect(other.feedback).toContain('resultado entero')
    for (const e of hunts.filter((x) => x.wrongColumn !== null)) {
      const fixed = digitOf(e.answer, e.wrongColumn!)
      const res = check(e, { type: 'hunt', ok: false, column: e.wrongColumn, value: fixed })
      if (fixed !== e.answer) expect(res.feedback, e.id).not.toMatch(/calcular esa columna|empieza el error/)
    }
  })

  it('explainHunt cuenta la solución con la cuenta entera', () => {
    const base = hunts.find((e) => e.op === 'mul')!
    expect(explainHunt({ ...base, top: 75, bottom: 4, shown: 300, answer: 300, wrongColumn: null, errorType: null })).toBe('La cuenta estaba bien: 75 × 4 = 300')
    expect(explainHunt({ ...base, top: 73, bottom: 4, shown: 392, answer: 292, wrongColumn: 2, errorType: 'fact' })).toBe('El error está en las centenas: 73 × 4 = 292')
  })
})

describe('comprobar (auditoría p1-numeros p1n-02, p1n-07; P4-21)', () => {
  const checks = of(sample(['check:add', 'check:sub', 'check:div'], 60, 12), 'check-calc')
  const twoThousand = of(Array.from({ length: 200 }, (_, s) => generate({ skills: ['check:add'] }, 10, { rng: createRng(s + 1) })).flat(), 'check-calc')

  it('en 2000 generados, ninguna comprobación es negativa y no sale «12 + 68 = 8»', () => {
    expect(twoThousand.length).toBe(2000)
    const bad = twoThousand.filter((e) => e.answer < 0 || e.claimed - e.left < 0 || e.claimed < Math.max(e.left, e.right))
    report('comprobación negativa', bad.map((e) => text(`${e.left} + ${e.right} = ${e.claimed}`)), twoThousand.length)
  })

  it('la decisión correcta es correcta con la casilla vacía o con cualquier prueba válida; la contraria nunca', () => {
    const misses: Miss[] = []
    for (const ex of checks) {
      const answers: Answer[] = [{ type: 'verdict', ok: ex.ok, value: ex.answer }, { type: 'verdict', ok: ex.ok, value: null }]
      if (ex.op === 'add') answers.push({ type: 'verdict', ok: ex.ok, value: ex.claimed - ex.left })
      for (const a of answers) {
        const r = check(ex, a)
        if (!r.correct) misses.push({ id: ex.id, answer: a, result: r })
      }
      if (check(ex, { type: 'verdict', ok: !ex.ok, value: ex.answer }).correct) misses.push({ id: ex.id, note: 'acepta la decisión contraria' })
    }
    report('comprobar: decisión correcta suspendida', misses, checks.length)
  })

  it('21 + 82 = 103 con la prueba 103 − 21 = 82 → correcto', () => {
    const base = checks.find((e) => e.op === 'add')!
    const ex: CheckCalcExercise = { ...base, left: 21, right: 82, claimed: 103, answer: 21, ok: true, errorType: null }
    expect(check(ex, { type: 'verdict', ok: true, value: 82 }).correct).toBe(true)
  })

  it('53 + 22 = 76, prueba 54 y «bien» → «no coinciden»', () => {
    const base = checks.find((e) => e.op === 'add')!
    const ex: CheckCalcExercise = { ...base, left: 53, right: 22, claimed: 76, answer: 54, ok: false, errorType: 'fact' }
    const r = check(ex, { type: 'verdict', ok: true, value: 54 })
    expect(r.correct).toBe(false)
    expect(r.feedback).toContain('no coinciden')
    expect(r.feedback).toContain('Tu prueba da 54 y arriba pone 53')
  })

  it('la pista 1 de comprobar una división habla del número que reparte y de lo que sobra', () => {
    const ex = checks.find((e) => e.op === 'div')!
    expect(hintsFor(ex)[0].text).toBe('Multiplica el resultado por el número que reparte y suma lo que sobra: ¿te sale el número del principio?')
  })
})

// ---------------------------------------------------------------- fracciones

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
const FRAC_SKILLS: SkillKey[] = [
  ...[2, 3, 4, 5, 6, 8, 10, 12].flatMap((d) => [`frac:shade:${d}`, `frac:read:${d}`, `frac:name:${d}`, `frac:of:${d}`]),
  'frac:equal', 'frac:compare', 'frac:add', 'frac:sub',
]

describe('fracciones (auditoría p1-medida-problemas H4, H15, H16)', () => {
  const all = sample(FRAC_SKILLS, 20, 6)

  it('los 8 tipos: la respuesta de libro es correcta y una mala nunca', () => {
    const kinds = new Set(all.map((e) => e.kind))
    for (const k of ['fraction-shade', 'fraction-read', 'fraction-of', 'fraction-equal', 'fraction-add', 'shape-choice'] as const) expect(kinds.has(k), k).toBe(true)
    const misses: Miss[] = []
    for (const ex of all) {
      const book = bookAnswer(ex)
      if (!check(ex, book).correct) misses.push({ id: ex.id, answer: book })
      for (const bad of wrongAnswers(ex)) if (check(ex, bad).correct) misses.push({ id: ex.id, answer: bad, note: `${ex.id}: acepta una mala` })
    }
    report('fracciones: libro o malas', misses, all.length)
  })

  it('suma y resta: el resultado simplificado (2/4 → 1/2, 4/4 → 1/1) se acepta, con nota', () => {
    const exs = of(sample(['frac:add', 'frac:sub']), 'fraction-add')
    const misses: Miss[] = []
    let total = 0
    for (const ex of exs) {
      const g = gcd(ex.answer, ex.denominator)
      if (g === 1) continue
      const a: Answer = { type: 'fraction', numerator: ex.answer / g, denominator: ex.denominator / g }
      total++
      const r = check(ex, a)
      if (!r.correct || !r.feedback?.includes('vale lo mismo')) misses.push({ id: ex.id, answer: a, result: r })
    }
    expect(total).toBeGreaterThan(100)
    report('fracción equivalente simplificada dada por mala', misses, total)
    const ex = { ...exs[0], op: 'add' as const, a: 5, b: 3, denominator: 10, answer: 8 }
    const r = check(ex, { type: 'fraction', numerator: 4, denominator: 5 })
    expect(r.correct).toBe(true)
    expect(r.feedback).toBe('¡Bien! 4/5 vale lo mismo que 8/10.')
  })

  it('leer la fracción coloreada: una equivalente (2 de 4 → 1/2) se acepta y la nota dice qué contamos', () => {
    const exs = of(sample([4, 6, 8, 10, 12].map((d) => `frac:read:${d}`)), 'fraction-read')
    const misses: Miss[] = []
    let total = 0
    for (const ex of exs) {
      const g = gcd(ex.numerator, ex.denominator)
      if (g === 1) continue
      const a: Answer = { type: 'fraction', numerator: ex.numerator / g, denominator: ex.denominator / g }
      total++
      const r = check(ex, a)
      if (!r.correct || !r.feedback?.includes(`aquí contamos las ${ex.denominator} partes`)) misses.push({ id: ex.id, answer: a, result: r })
    }
    expect(total).toBeGreaterThan(100)
    report('fracción leída equivalente dada por mala', misses, total)
  })

  it('nombrar la fracción: ninguna opción falsa vale lo mismo que la buena', () => {
    const exs = of(sample([2, 3, 4, 5, 6, 8, 10, 12].map((d) => `frac:name:${d}`)), 'shape-choice')
    const names = new Map<string, number>()
    for (const d of [2, 3, 4, 5, 6, 8, 10, 12]) for (let n = 1; n <= 11; n++) names.set(fractionName(n, d), n / d)
    const misses: Miss[] = []
    for (const ex of exs) {
      const v = names.get(ex.options[ex.answer])
      const twin = ex.options.findIndex((o, i) => i !== ex.answer && names.get(o) !== undefined && Math.abs((names.get(o) as number) - (v as number)) < 1e-9)
      if (twin >= 0) misses.push({ id: ex.id, note: `buena «${ex.options[ex.answer]}», también vale «${ex.options[twin]}»` })
    }
    report('opción equivalente marcada como mala', misses, exs.length)
  })

  it('cuentos: «la mitad» y no «un medio de»; el verbo concuerda («Un cuarto de ellas son rojas»)', () => {
    const bad: Miss[] = []
    let total = 0
    for (let seed = 1; seed <= 400; seed++) {
      for (const d of [2, 3, 4, 5, 6, 8, 10, 12]) {
        const ex = genFractionOf(createRng(seed * 31 + d), d, 'numbers', seed % 2 ? '🌸' : '🍬')
        if (!ex.story) continue
        total++
        if (/ es (rojas|amarillas|de fresa)/.test(ex.story) || /un medio de/i.test(ex.story)) bad.push(text(ex.story))
      }
    }
    expect(total).toBeGreaterThan(500)
    report('cuentos de fracciones con «es rojas» o «un medio de»', [...new Map(bad.map((b) => [b.note, b])).values()], total)
  })
})

// ---------------------------------------------------------------- decimales y dinero

describe('decimales (auditoría p1-medida-problemas H5, H14)', () => {
  const decs = sample(['dec:shade:1', 'dec:shade:2', 'dec:read:1', 'dec:read:2', 'dec:compare', 'dec:money', 'dec:add:1', 'dec:add:2', 'dec:sub:1', 'dec:sub:2'], 20, 8)

  it('decimal y decimal-op: libro correcto, ±1 centésima o décima nunca', () => {
    expect(new Set(decs.map((e) => e.kind))).toEqual(new Set(['decimal', 'decimal-op']))
    const misses: Miss[] = []
    for (const ex of decs) {
      if (!check(ex, bookAnswer(ex)).correct) misses.push({ id: ex.id, answer: bookAnswer(ex) })
      for (const bad of wrongAnswers(ex)) if (check(ex, bad).correct) misses.push({ id: ex.id, answer: bad, note: 'acepta una mala' })
    }
    report('decimales: libro o malas', misses, decs.length)
  })

  it('dos cifras en la casilla de las décimas (0,54 escrito «0» y «54») no se califica como otro número', () => {
    const exs = [...of(sample(['dec:read:2', 'dec:shade:2']), 'decimal'), ...of(sample(['dec:add:2', 'dec:sub:2']), 'decimal-op')]
    const misses: Miss[] = []
    let total = 0
    for (const ex of exs) {
      const v = ex.kind === 'decimal' ? ex.value : ex.answer
      if (v % 100 < 10) continue
      const a: Answer = { type: 'numbers', values: [Math.floor(v / 100), v % 100, null] }
      total++
      const r = check(ex, a)
      if (r.correct || r.errorType !== 'incomplete' || !/una cifra en cada casilla/.test(r.feedback ?? '')) misses.push({ id: ex.id, answer: a, result: r })
    }
    expect(total).toBeGreaterThan(300)
    report('dos cifras en una casilla decimal calificadas', misses, total)
    const read = of(decs, 'decimal').find((e) => e.mode === 'read' && e.places === 2)!
    const r = check({ ...read, value: 54, answer: 54 }, { type: 'numbers', values: [0, 54, null] })
    expect(r.errorType).toBe('incomplete')
    expect(r.feedback).toBe('Pon una cifra en cada casilla: 0 , 5 4.')
  })
})

describe('dinero (auditoría p1-medida-problemas H6, H11, H13, H14)', () => {
  const money = of(sample(['money:recognise', 'money:pay', 'money:change', 'money:add', 'money:compare', 'money:convert', 'money:budget'], 30, 8), 'money')

  it('los 7 modos: libro correcto, una cantidad mala nunca', () => {
    expect(new Set(money.map((e) => e.mode)).size).toBe(7)
    const misses: Miss[] = []
    for (const ex of money) {
      const book = moneyAnswer(ex)
      if (!check(ex, book).correct) misses.push({ id: ex.id, answer: book })
      for (const bad of wrongAnswers(ex)) if (check(ex, bad).correct) misses.push({ id: ex.id, answer: bad, note: 'acepta una mala' })
    }
    report('dinero: libro o malas', misses, money.length)
  })

  it('38 € y 150 céntimos para 39,50 €: no es correcto, ni un error de cuenta, y explica «son 1 €»', () => {
    const base = money.find((e) => e.mode === 'add')!
    const ex = { ...base, answer: 3950 }
    const r = check(ex, { type: 'numbers', values: [38, 150] })
    expect(r.correct).toBe(false)
    expect(r.errorType).not.toBe('fact')
    expect(r.errorType).not.toBe('other')
    expect(r.feedback).toBe('150 céntimos son 1 € y 50 céntimos: escribe 39 € y 50 céntimos.')
    let accepted = 0
    for (const e of money.filter((x): x is MoneyChangeExercise => x.mode === 'change' && x.answer >= 100)) {
      if (check(e, { type: 'numbers', values: [Math.floor(e.answer / 100) - 1, (e.answer % 100) + 100] }).correct) accepted++
    }
    expect(accepted).toBe(0)
    const dec = of(sample('dec:money'), 'decimal')[0]
    const rd = check(dec, { type: 'numbers', values: [Math.floor(dec.value / 100) - 1, (dec.value % 100) + 100] })
    expect(rd.correct).toBe(false)
    expect(rd.feedback).toContain('son 1 €')
  })

  it('el cambio: el precio es el de la cosa (o la suma de las cosas) del catálogo, pagado con el billete más pequeño que llega', () => {
    const exs = of(sample('money:change', 80, 10), 'money').filter((e): e is MoneyChangeExercise => e.mode === 'change')
    expect(exs.length).toBeGreaterThan(150)
    const misses: Miss[] = []
    for (const ex of exs) {
      const named = SHOP.filter((it) => ex.text.includes(it.name))
      const sum = named.reduce((s, it) => s + it.price, 0)
      if (named.length === 0 || sum !== ex.price) misses.push(text(`${ex.text} (precio ${ex.price})`))
      const smallest = [500, 1000, 2000, 5000].find((n) => n - ex.price >= 10)
      if (ex.paid !== smallest) misses.push(text(`${ex.text}: paga con ${ex.paid}`))
    }
    report('cambio con un precio que no es el del catálogo', misses, exs.length)
  })

  it('«¿cuánto te sobra?»: el mensaje dice «el dinero que tienes menos lo que cuesta todo»', () => {
    const exs = money.filter((e): e is MoneyBudgetExercise => e.mode === 'budget' && e.ask === 'left')
    expect(exs.length).toBeGreaterThan(20)
    for (const ex of exs) {
      const wrong = (ex.answer as number) + 10
      const r = check(ex, { type: 'numbers', values: [Math.floor(wrong / 100), wrong % 100] })
      expect(r.feedback, ex.id).toContain('el dinero que tienes menos lo que cuesta todo')
    }
  })

  it('ningún enunciado de dinero dice «presupuesto» ni «¿Te llega?» a secas', () => {
    const bad = money.filter((e) => {
      const t = e.mode === 'budget' ? `${e.text} ${e.question}` : e.mode === 'change' || e.mode === 'add' ? e.text : ''
      return /presupuesto/i.test(t) || /¿Te llega\?/.test(t)
    })
    report('enunciados con «presupuesto» o «¿Te llega?»', bad.map((e) => text(e.id)), money.length)
    const budgets = money.filter((e): e is MoneyBudgetExercise => e.mode === 'budget' && e.ask !== 'afford')
    report('presupuesto sin decir que se compra todo', budgets.filter((e) => !/todo/.test(e.question)).map((e) => text(e.question)), budgets.length)
  })
})
