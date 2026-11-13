/* P1 — «una respuesta final correcta jamás se da por mala; nada incorrecto se da por bueno» — en problemas, fracciones,
   decimales, dinero, medida, tiempo, geometría, datos y numeración.
   For hundreds of generated exercises per kind (many seeds) the test builds (1) the book answer, which must be right;
   (2) answers with the right final result and the intermediate fields changed (another order, another equivalent form,
   another valid notation), which must be right too; (3) wrong final results, which must never be right. Then the cases
   of the audit branches auditoria/p1-medida-problemas and auditoria/p1-numeros, with the P1 expectation. */
import { describe, expect, it } from 'vitest'
import { check, createRng, generate, geoSkill, GEO_OPS, hintsFor, statementOf } from '@/engine'
import { makeWordProblem } from '@/engine/make'
import { explainHunt } from '@/engine/bugs'
import { fractionName, genFractionOf } from '@/engine/fractions'
import { SHOP } from '@/engine/money'
import { measureUnitQuestion } from '@/engine/measure'
import { makePlaceValue } from '@/engine/numeric'
import { buildSense } from '@/engine/wordProblems'
import { parseClockPhrase } from '@/engine/time'
import { hourFromAngle, moveMinuteHand } from '@/activities/views/Clock'
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
  if (ex.kind === 'clock-read') return ex.mode === 'write' ? { type: 'time', ...ex.answer } : { type: 'choice', index: ex.correct }
  if (ex.kind === 'clock-set') return { type: 'time', ...ex.answer }
  if (ex.kind === 'time-convert') return ex.direction === 'to-digital' ? { type: 'time', ...ex.answer } : { type: 'choice', index: ex.correct }
  if (ex.kind === 'time-duration') return ex.ask === 'end' ? { type: 'time', ...ex.end } : { type: 'number', value: ex.duration }
  if (ex.kind === 'calendar') return ex.topic === 'weekday' ? { type: 'choice', index: ex.answer } : { type: 'number', value: ex.answer }
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
        const st0 = ex.steps[k]
        // When the slipped value is also another action of the story on the same amount (35 + 7 for 35 + 6 when
        // «le da 7»), it is another valid order, not a slip: the walk cannot tell, so it is left out.
        const ap = (op: string, x: number, y: number) => (op === 'add' ? x + y : op === 'sub' ? x - y : op === 'mul' ? x * y : x / y)
        if (ex.steps.some((o, j) => j !== k && o.op === st0.op && ap(o.op, st0.a, o.b) === st0.result + 1)) continue
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

  it('un paso válido en otro orden, con la misma operación y un resultado cercano, no se llama «paso que no sale»', () => {
    const base = bars.find((e) => e.steps.length === 2)!
    // «Tenía 50, pierde 8 y luego 5»: 50 − 8 = 42, 42 − 5 = 37. The child does 50 − 5 = 45 first (valid) and then slips.
    const ex: BarProblemExercise = {
      ...base, withBar: false, answer: 37,
      steps: [{ op: 'sub', a: 50, b: 8, result: 42 }, { op: 'sub', a: 42, b: 5, result: 37 }],
    }
    const r = check(ex, { type: 'bar', placed: ex.bar.map((b) => b.value), ops: ['sub', 'sub'], results: [45, 36] })
    expect(r.correct).toBe(false)
    expect(r.feedback ?? '').not.toContain('El paso 1 no sale')
    expect(check(ex, { type: 'bar', placed: ex.bar.map((b) => b.value), ops: ['sub', 'sub'], results: [45, 37] }).correct).toBe(true)
    // A real slip in the first step is still named.
    const slip = check(ex, { type: 'bar', placed: ex.bar.map((b) => b.value), ops: ['sub', 'sub'], results: [43, 38] })
    expect(slip.feedback).toBe('El paso 1 no sale: 50 − 8 son 42, no 43.')
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
  it('las barras llevan los nombres de la historia y la pista dice dónde va cada número (P3PE-16)', () => {
    const generic = bars.filter((e) => e.bar.some((b) => ['Tú', 'Amigo', 'Diferencia'].includes(b.name) || /[{}]/.test(b.name)))
    report('barra con nombre genérico', generic.map((e) => text(e.id)), bars.length)
    const withBar = bars.filter((e) => e.withBar && !(e.steps.length === 1 && e.steps[0].op === 'mul'))
    expect(withBar.length).toBeGreaterThan(20)
    for (const ex of withBar) {
      const l2 = hintsFor(ex)[1].text
      for (const b of ex.bar) if (b.value !== null) expect(l2, ex.id).toContain(`el ${b.value} en «${b.name}»`)
    }
    const girls = bars.find((e) => e.id.includes('combine-total') && e.withBar)
    expect(girls, "combine-total con barra").toBeDefined()
    expect(hintsFor(girls!)[1].text).toMatch(/^Pon el \d+ en «Niñas» y el \d+ en «Niños»\./)
  })
})

describe('problemas de texto con resto', () => {
  it('el cociente bien y el «Sobra» aún vacío es «incompleto», no un error de cuenta', () => {
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
      if (ex.op === 'sub') answers.push({ type: 'verdict', ok: ex.ok, value: ex.left - ex.claimed })
      // A check that does not come out is an intermediate step: it guides, it never fails the right verdict (P1).
      answers.push({ type: 'verdict', ok: ex.ok, value: ex.answer + 7 })
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

  it('la decisión buena con una prueba que no sale es correcta, con una nota que enseña la prueba', () => {
    const base = checks.find((e) => e.op === 'add')!
    const ex: CheckCalcExercise = { ...base, left: 31, right: 22, claimed: 53, answer: 31, ok: true, errorType: null }
    const r = check(ex, { type: 'verdict', ok: true, value: 30 })
    expect(r.correct).toBe(true)
    expect(r.errorType).toBeUndefined()
    expect(r.feedback).toBe('¡Bien decidido! Repasa tu prueba: 53 − 22 = 31.')
  })

  it('resta 75 − 32 = 43: también vale la prueba 75 − 43 = 32', () => {
    const base = checks.find((e) => e.op === 'sub')!
    const ex: CheckCalcExercise = { ...base, left: 75, right: 32, claimed: 43, answer: 75, ok: true, errorType: null }
    const r = check(ex, { type: 'verdict', ok: true, value: 32 })
    expect(r.correct).toBe(true)
    expect(r.feedback).toBe('¡Muy bien! Has comprobado con la operación contraria.')
    // 75 − 32 = 44 with «bien» and the check 75 − 44 = 31: the check tells her it is wrong.
    const bad: CheckCalcExercise = { ...ex, claimed: 44, answer: 76, ok: false, errorType: 'fact' }
    const rb = check(bad, { type: 'verdict', ok: true, value: 31 })
    expect(rb.correct).toBe(false)
    expect(rb.feedback).toBe('Tu prueba da 31 y el número que restas es 32: no coinciden, así que la cuenta está mal.')
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
    expect(hintsFor(ex)[0].text).toBe('Multiplica el resultado por el número entre el que repartes y suma lo que sobra: ¿te sale el número del principio?')
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
      if (!r.correct || !r.feedback?.includes(' lo mismo')) misses.push({ id: ex.id, answer: a, result: r })
    }
    expect(total).toBeGreaterThan(100)
    report('fracción equivalente simplificada dada por mala', misses, total)
    const ex = { ...exs[0], op: 'add' as const, a: 5, b: 3, denominator: 10, answer: 8 }
    const r = check(ex, { type: 'fraction', numerator: 4, denominator: 5 })
    expect(r.correct).toBe(true)
    expect(r.feedback).toBe('¡Bien! Cuatro quintos valen lo mismo que ocho décimos.')
    // The voice reads the note (P5): no «4/5» in figures.
    expect(r.feedback).not.toMatch(/\d\/\d/)
    const half = check({ ...ex, a: 1, b: 1, denominator: 4, answer: 2 }, { type: 'fraction', numerator: 1, denominator: 2 })
    expect(half.feedback).toBe('¡Bien! Un medio vale lo mismo que dos cuartos.')
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
      if (!r.correct || !r.feedback?.includes(`Aquí contamos las ${ex.denominator} partes`) || /\d\/\d/.test(r.feedback)) misses.push({ id: ex.id, answer: a, result: r })
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
    // A wrong amount in disorder: the message gives the rule, never «escribe» a wrong amount the child would obey (P4).
    const wrongOrder = check(ex, { type: 'numbers', values: [38, 160] })
    expect(wrongOrder.correct).toBe(false)
    expect(wrongOrder.feedback).toBe('160 céntimos son 1 € y 60 céntimos. En la casilla de los céntimos va un número de 0 a 99.')
    expect(wrongOrder.feedback).not.toContain('escribe')
    expect(check(ex, { type: 'numbers', values: [37, 250] }).feedback).toBe('250 céntimos son 2 € y 50 céntimos: escribe 39 € y 50 céntimos.')
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

// ---------------------------------------------------------------- reloj y tiempo

const CLOCK_SKILLS: SkillKey[] = ['clock:read:30', 'clock:read:15', 'clock:read:5', 'clock:set:30', 'clock:set:5', 'clock:convert:day', 'time:end', 'time:elapsed',
  'cal:units', 'cal:weekday', 'cal:month', 'time:seconds']

describe('reloj y tiempo (auditoría p1-medida-problemas H7, H18; P4-13)', () => {
  const clocks = sample(CLOCK_SKILLS, 30, 8)

  it('los 5 tipos: libro correcto, otra hora o minutos nunca', () => {
    const kinds = new Set(clocks.map((e) => e.kind))
    for (const k of ['clock-read', 'clock-set', 'time-convert', 'time-duration', 'calendar'] as const) expect(kinds.has(k), k).toBe(true)
    const misses: Miss[] = []
    for (const ex of clocks) {
      const book = bookAnswer(ex)
      if (!check(ex, book).correct) misses.push({ id: ex.id, answer: book })
      for (const bad of wrongAnswers(ex)) if (check(ex, bad).correct) misses.push({ id: ex.id, answer: bad, note: `${ex.id}: acepta una mala` })
    }
    report('reloj: libro o malas', misses, clocks.length)
  })

  it('«¿a qué hora acaba?»: 13:00 en lugar de 1:00 se acepta', () => {
    const exs = of(sample('time:end', 60), 'time-duration')
    const misses: Miss[] = []
    let total = 0
    for (const ex of exs) {
      const startMin = (ex.start.hour % 12) * 60 + ex.start.minute
      if (startMin + ex.duration < 12 * 60 || ex.end.hour === 12) continue
      const a: Answer = { type: 'time', hour: ex.end.hour + 12, minute: ex.end.minute }
      total++
      const r = check(ex, a)
      if (!r.correct) misses.push({ id: ex.id, answer: a, result: r })
    }
    expect(total).toBeGreaterThanOrEqual(8)
    report('hora de final en 24 h dada por mala', misses, total)
  })

  it('leer el reloj escribiendo: las 12 y las 0 son la misma aguja (0:45 por 12:45)', () => {
    const exs = of(sample(['clock:read:30', 'clock:read:15', 'clock:read:5'], 60), 'clock-read').filter((e) => e.answer.hour === 12)
    expect(exs.length).toBeGreaterThanOrEqual(12)
    const misses: Miss[] = []
    for (const ex of exs) {
      const a: Answer = { type: 'time', hour: 0, minute: ex.answer.minute }
      const r = check({ ...ex, mode: 'write' }, a)
      if (!r.correct) misses.push({ id: ex.id, answer: a, result: r })
    }
    report('0:xx por 12:xx dado por malo', misses, exs.length)
  })

  it('24 horas: «las doce de la noche» admite 24:00 además de 00:00, con la nota de la medianoche', () => {
    const exs = of(sample('clock:convert:day', 200), 'time-convert').filter((e) => e.direction === 'to-digital' && e.answer.hour === 0)
    expect(exs.length).toBeGreaterThanOrEqual(11)
    const misses: Miss[] = []
    for (const ex of exs) {
      const a: Answer = { type: 'time', hour: 24, minute: ex.answer.minute }
      const r = check(ex, a)
      if (!r.correct || !r.feedback?.includes('la hora se escribe con dos ceros') || /\d:\d/.test(r.feedback)) misses.push({ id: ex.id, answer: a, result: r })
    }
    report('24:xx por 00:xx dado por malo', misses, exs.length)
  })

  it('una duración mal: el mensaje habla del tiempo que pasa, no de agujas', () => {
    for (const ex of of(clocks, 'time-duration')) {
      const bad = wrongAnswers(ex)[0]
      const r = check(ex, bad)
      expect(r.feedback, ex.id).toBe('¡Casi! Cuenta cuánto tiempo pasa desde que empieza: suma las horas y luego los minutos.')
    }
  })

  it('la frase equivocada recibe el mensaje de lo que está mal: 5:30 con «las seis menos cuarto» → minutos', () => {
    const ex = of(clocks, 'clock-read').find((e) => e.mode === 'phrase')!
    const at = { ...ex, hour: 5, minute: 30, answer: { hour: 5, minute: 30 }, options: ['las cinco y media', 'las seis menos cuarto', 'las seis y media'], correct: 0 }
    const r = check(at, { type: 'choice', index: 1 })
    expect(r.errorType).toBe('clock-minute')
    expect(r.feedback).toContain('Cuenta los minutos')
    const h = check(at, { type: 'choice', index: 2 })
    expect(h.errorType).toBe('clock-hour')
    expect(h.feedback).toContain('aguja corta')
  })

  it('de 1:00 a 5:59 se dice «de la madrugada»', () => {
    const exs = of(sample('clock:convert:day', 120), 'time-convert').filter((e) => e.answer.hour >= 1 && e.answer.hour <= 5)
    expect(exs.length).toBeGreaterThanOrEqual(77)
    const bad = exs.filter((e) => !/ de la madrugada$/.test(e.phrase) || e.options.some((o) => / de la noche$/.test(o) && parseClockPhrase(o)!.hour24 >= 1 && parseClockPhrase(o)!.hour24 <= 5))
    report('horas de madrugada dichas «de la noche»', bad.map((e) => text(`${e.phrase} → ${e.answer.hour}:${e.answer.minute}`)), exs.length)
  })

  it('poner el reloj: colocar primero la aguja corta en el número que dice la frase no cambia la hora', () => {
    // «las cuatro menos cuarto» (3:45): the hands start at the opposite minutes; the child drags the short hand to the 4
    // and then the long hand. While the long hand still says 15 the face honestly shows 4:15; when the long hand moves,
    // moveMinuteHand reads the short hand again from where it was left (src/activities/views/Clock.tsx), so it ends at 3.
    const misses: Miss[] = []
    let total = 0
    for (let h = 1; h <= 12; h++) {
      for (const minute of [35, 40, 45, 50, 55]) {
        const startMinute = (minute + 30) % 60
        const nextHour = (h % 12) + 1
        const aim = (nextHour % 12) * 30
        const afterShort = { hour: hourFromAngle(aim, startMinute), minute: startMinute }
        const setHour = moveMinuteHand(afterShort, minute, aim).hour
        total++
        if (setHour !== h) misses.push(text(`«las ${nextHour} menos ${60 - minute}»: la hora queda en ${setHour}`))
      }
    }
    report('hora mal leída por el orden en que se mueven las agujas', misses, total)
  })
})

// ---------------------------------------------------------------- geometría

const GEO: SkillKey[] = GEO_OPS.map(geoSkill)
/** The classification ops: the level-2 hint ties each description to its name. */
const CLASSIFY: string[] = ['line:type', 'line:rel', 'line:kind', 'angle:class', 'tri:sides', 'tri:angles', 'quad:name', 'circle:parts', 'circle']

describe('geometría, 21 operaciones (auditoría p1-medida-problemas H9, H21; P4-17)', () => {
  const geo = sample(GEO, 30, 6)

  it('las 21 operaciones: libro correcto, otra opción u otro número nunca', () => {
    expect(GEO.length).toBe(21)
    const ops = new Set(geo.map((e) => e.skill))
    for (const s of GEO) expect(ops.has(s), s).toBe(true)
    const misses: Miss[] = []
    for (const ex of geo) {
      if (!check(ex, bookAnswer(ex)).correct) misses.push({ id: ex.id, answer: bookAnswer(ex) })
      for (const bad of wrongAnswers(ex)) if (check(ex, bad).correct) misses.push({ id: ex.id, answer: bad, note: `${ex.id}: acepta una mala` })
    }
    report('geometría: libro o malas', misses, geo.length)
  })

  it('en cada pregunta exactamente una opción es verdad', () => {
    const exs = of(sample(['geo:line:rel', 'geo:circle:parts', 'geo:poly:name', 'geo:quad:name'], 60, 10), 'shape-choice')
    expect(exs.length).toBeGreaterThan(500)
    const alsoTrue: Record<string, string[]> = {
      perpendiculares: ['se cruzan', 'se cortan'], diámetro: ['cuerda'], cuadrado: ['rectángulo', 'rombo'],
    }
    const bad = exs.filter((ex) => (alsoTrue[ex.options[ex.answer]] ?? []).some((o) => ex.options.includes(o)))
    report('preguntas con dos opciones verdaderas', bad.map((e) => text(`${e.question} ${e.options.join(' / ')}`)), exs.length)
  })

  it('«¿Puede rodar este cuerpo?»', () => {
    const ex = of(sample('geo:solid:roll', 3, 3), 'shape-choice')[0]
    expect(ex.question).toBe('¿Puede rodar este cuerpo?')
  })

  it('la pista 2 de cada clasificación nombra todas las opciones', () => {
    for (const op of CLASSIFY) {
      for (const ex of of(sample(`geo:${op}`, 10, 4), 'shape-choice')) {
        const h = hintsFor(ex)[1].text.toLowerCase()
        for (const o of ex.options) expect(h, `${op}: ${hintsFor(ex)[1].text}`).toContain(o.toLowerCase())
      }
    }
  })

  it('las pistas de geometría no gritan: ninguna palabra en mayúsculas (la voz podría deletrearla)', () => {
    for (const op of CLASSIFY) {
      for (const ex of of(sample(`geo:${op}`, 10, 4), 'shape-choice')) {
        for (const h of hintsFor(ex)) expect(h.text, `${op}`).not.toMatch(/[A-ZÁÉÍÓÚÑ]{3,}/)
      }
    }
  })

  it('la pista 2 de cada clasificación tiene frases cortas (como mucho 14 palabras cada una)', () => {
    for (const op of CLASSIFY) {
      for (const ex of of(sample(`geo:${op}`, 10, 4), 'shape-choice')) {
        for (const h of [hintsFor(ex)[1]]) {
          for (const sentence of h.text.split(/(?<=[.?!])\s+/)) expect(sentence.split(/\s+/).length, `${op}: ${sentence}`).toBeLessThanOrEqual(14)
        }
      }
    }
  })

  it('la pista 2 de las rectas explica la tercera opción: «se cortan torcidas»', () => {
    const ex = of(sample('geo:line:rel', 5, 3), 'shape-choice')[0]
    expect(hintsFor(ex)[1].text).toBe('Si nunca se tocan, son «paralelas». Si se cortan como la esquina del papel, son «perpendiculares». Si se cortan torcidas, es la otra: «se cortan sin formar ángulo recto».')
  })
})

// ---------------------------------------------------------------- medida

describe('medida (P4-18, P4-19, P3PE-15)', () => {
  const measures = of(sample(['measure:unit:length', 'measure:unit:mass', 'measure:unit:capacity', 'measure:convert:length', 'measure:convert:mass',
    'measure:convert:capacity', 'measure:convert:length:all', 'measure:ruler', 'measure:add', 'measure:estimate'], 20, 6), 'measure')

  it('libro correcto, otro número u otra unidad nunca', () => {
    expect(new Set(measures.map((e) => e.mode)).size).toBe(5)
    const misses: Miss[] = []
    for (const ex of measures) {
      const book: Answer = ex.mode === 'unit' ? { type: 'option', value: ex.answer }
        : ex.mode === 'estimate' ? { type: 'verdict', ok: ex.answer, value: null } : { type: 'number', value: ex.answer }
      if (!check(ex, book).correct) misses.push({ id: ex.id, answer: book })
      const bad: Answer[] = ex.mode === 'unit' ? wrongAnswers(ex) : ex.mode === 'estimate' ? [{ type: 'verdict', ok: !ex.answer, value: null }] : [{ type: 'number', value: ex.answer + 1 }]
      for (const b of bad) if (check(ex, b).correct) misses.push({ id: ex.id, answer: b, note: 'acepta una mala' })
    }
    report('medida: libro o malas', misses, measures.length)
  })

  it('pistas de peso y capacidad sin «coche» ni «tira» ni «patatas»; ninguna con «cuántos saltos»', () => {
    for (const ex of measures) {
      const hs = hintsFor(ex).map((h) => h.text).join(' ')
      if (ex.mode !== 'ruler' && 'dimension' in ex && ex.dimension !== 'length') expect(hs, ex.id).not.toMatch(/coche|tira/)
      // «Una bolsa de patatas» is, for a child, the 150 g bag of crisps: a wrong picture of a kilo.
      expect(hs, ex.id).not.toMatch(/patatas/)
      expect(hs, ex.id).not.toMatch(/cuántos saltos/)
    }
  })

  it('la pregunta de la unidad dice las opciones con palabras y no «medir capacidad de»', () => {
    const vaso = of(sample('measure:unit:capacity', 40, 4), 'measure').find((e) => e.mode === 'unit' && e.object === 'un vaso de agua')
    expect(vaso && vaso.mode === 'unit' && measureUnitQuestion(vaso)).toMatch(/^Un vaso de agua, ¿cuánto tiene: 200 (mililitros|litros) o 200 (mililitros|litros)\?$/)
    for (const ex of measures) expect(statementOf(ex), ex.id).not.toMatch(/medir capacidad de/)
  })
})

// ---------------------------------------------------------------- datos y probabilidad

describe('gráficos y probabilidad (auditoría p1-medida-problemas H12)', () => {
  const charts = sample(['chart:pict', 'chart:pict:x', 'chart:bars', 'chart:table', 'chart:freq', 'chart:mode', 'prob:chance', 'prob:likely'], 30, 6)
    .filter((e): e is Extract<Exercise, { kind: 'chart' | 'chance' }> => e.kind === 'chart' || e.kind === 'chance')

  it('libro correcto, otro número u otra opción nunca', () => {
    expect(new Set(charts.map((e) => e.kind))).toEqual(new Set(['chart', 'chance']))
    const misses: Miss[] = []
    for (const ex of charts) {
      const book: Answer = (ex.kind === 'chart' && ex.options.length) || ex.kind === 'chance' ? { type: 'choice', index: ex.answer } : { type: 'number', value: ex.answer }
      if (!check(ex, book).correct) misses.push({ id: ex.id, answer: book })
      const bad: Answer = book.type === 'choice' ? { type: 'choice', index: (ex.answer + 1) % (ex.options.length || 2) } : { type: 'number', value: ex.answer + 1 }
      if (check(ex, bad).correct) misses.push({ id: ex.id, answer: bad, note: 'acepta una mala' })
    }
    report('gráficos: libro o malas', misses, charts.length)
  })

  it('900 preguntas: ninguna con «tiene los/las…»; cada tema con su pregunta', () => {
    const exs = of(sample(['chart:pict', 'chart:pict:x', 'chart:bars'], 100, 9), 'chart')
    expect(exs.length).toBeGreaterThan(400)
    report('preguntas con «tiene los/las»', exs.filter((e) => /tiene (los|las) /.test(e.question) || /días (más )?tiene/.test(e.question)).map((e) => text(e.question)), exs.length)
    const qs = new Set(exs.map((e) => e.question))
    for (const q of ['¿Cuántas gallinas vimos?', '¿Cuántos días llovió?', '¿Cuántos días estuvo nublado?', '¿Cuántos votos tiene la fresa?', '¿De qué clase de libro leímos más?']) {
      expect(qs.has(q), q).toBe(true)
    }
    expect([...qs].some((q) => /^¿Cuántos cuentos más que cómics leímos\?$/.test(q) || /^¿Cuántos cómics más que cuentos leímos\?$/.test(q))).toBe(true)
  })
})

// ---------------------------------------------------------------- numeración, cálculo mental, igualdades, ordinales, series, posición

const NUM: SkillKey[] = [
  ...(['blocks', 'expanded', 'words'] as const).flatMap((m) => ['', ':999', ':19999', ':99999'].map((x) => `num:place:${m}${x}`)),
  ...['compare', 'order'].flatMap((k) => ['', ':999', ':19999', ':99999'].map((x) => `num:${k}${x}`)),
  'num:round:10', 'num:round:100', 'num:round:1000:99999',
  'num:line:10', 'num:line:100', 'num:line:1000', 'num:line:10000', 'num:line:10:999', 'num:line:100:999',
  ...['dobles', 'triples', 'mitades', 'completar10', 'completar100', 'completar1000', 'decenas', 'centenas', 'compensar', 'por10', 'romanos',
    'combinadas', 'jerarquia', 'parentesis', 'asociativa', 'distributiva', 'estimar'].map((f) => `mental:${f}`),
  'eq:flex', 'eq:same', 'num:ordinal:10', 'num:ordinal:20', 'num:ordinal:30', 'pattern:shapes', 'pattern:numbers', 'pattern:predict',
  'pos:relative', 'pos:next', 'pos:route',
]

describe('numeración y cálculo mental (auditoría p1-numeros p1n-03, p1n-04, p1n-05, p1n-08)', () => {
  const nums = sample(NUM, 30, 6)

  it('place-value, round, number-line, mental, equation, ordinal, pattern, position: libro correcto, malas nunca', () => {
    const kinds = new Set(nums.map((e) => e.kind))
    for (const k of ['place-value', 'compare', 'order', 'round', 'number-line', 'mental', 'equation', 'ordinal', 'pattern', 'position'] as const) expect(kinds.has(k), k).toBe(true)
    const misses: Miss[] = []
    for (const ex of nums) {
      const book: Answer = ex.kind === 'place-value' && ex.mode === 'expanded' ? { type: 'numbers', values: [...ex.parts] }
        : ex.kind === 'equation' && ex.mode === 'same' ? { type: 'sign', sign: ex.answer as '=' | '≠' }
          : ex.kind === 'pattern' ? (ex.mode === 'shapes' ? { type: 'choice', index: ex.answer } : { type: 'number', value: ex.answer })
            : ex.kind === 'ordinal' || ex.kind === 'position' ? { type: 'choice', index: ex.answer } : bookAnswer(ex)
      if (!check(ex, book).correct) misses.push({ id: ex.id, answer: book })
      const bad: Answer[] = book.type === 'sign' ? [{ type: 'sign', sign: book.sign === '=' ? '≠' : book.sign === '≠' ? '=' : book.sign === '<' ? '>' : '<' }]
        : book.type === 'choice' ? [{ type: 'choice', index: ((book.index as number) + 1) % ('options' in ex && ex.options.length > 1 ? ex.options.length : 2) }]
          : book.type === 'numbers' ? [{ type: 'numbers', values: book.values.map((v, i) => (i === 0 ? (v as number) + 1 : v)) }]
            : book.type === 'number' ? [{ type: 'number', value: (book.value as number) + 1 }] : []
      for (const b of bad) if (check(ex, b).correct) misses.push({ id: ex.id, answer: b, note: 'acepta una mala' })
    }
    report('numeración: libro o malas', misses, nums.length)
  })

  it('descomposición: dejar vacía la casilla de un 0 (4 025 = 4 000 + 20 + 5) no es un error', () => {
    const exs = of(sample(['num:place:expanded', 'num:place:expanded:999', 'num:place:expanded:19999', 'num:place:expanded:99999'], 80, 10), 'place-value').filter((e) => e.parts.includes(0))
    expect(exs.length).toBeGreaterThan(300)
    const bad = exs.filter((ex) => !check(ex, { type: 'numbers', values: ex.parts.map((p) => (p === 0 ? null : p)) }).correct)
    report('descomposición con un 0 sin escribir', bad.map((e) => text(String(e.value))), exs.length)
    const ex = exs[0]
    expect(check(ex, { type: 'numbers', values: ex.parts.map(() => null) }).errorType).toBe('incomplete')
  })

  it('descomposición: «3» bajo la etiqueta «centenas» es lo mismo que 300 (352 con [3, 5, 2])', () => {
    const ex = makePlaceValue(352, 'expanded')
    expect(check(ex, { type: 'numbers', values: [3, 5, 2] }).correct).toBe(true)
    expect(check(ex, { type: 'numbers', values: [300, 50, 2] }).correct).toBe(true)
    expect(check(ex, { type: 'numbers', values: [3, 5, 3] }).correct).toBe(false)
    expect(check(ex, { type: 'numbers', values: [30, 5, 2] }).correct).toBe(false)
  })

  it('ningún redondeo a la decena o a la centena da 10 000 (no cabe en la casilla de cuatro cifras)', () => {
    const exs = of(sample(['num:round:10', 'num:round:100'], 200, 10), 'round')
    report('redondeo con 5 cifras', exs.filter((e) => e.answer >= 10000).map((e) => text(`${e.value} → ${e.answer}`)), exs.length)
  })

  it('ordinales: la fila se cuenta «desde la salida»', () => {
    const rows = of(sample(['num:ordinal:10', 'num:ordinal:20', 'num:ordinal:30'], 30, 6), 'ordinal').filter((e) => e.mode === 'row')
    expect(rows.length).toBeGreaterThan(20)
    for (const ex of rows) expect(statementOf(ex)).toContain('desde la salida')
  })

  it('cálculo mental: enunciados de distributiva y estimar, y ninguna combinada con números de más de dos cifras', () => {
    const d = of(sample('mental:distributiva', 4, 3), 'mental')[0]
    expect(d.prompt).toBe(`${d.a} × ${d.b} es ${d.a} × ${d.b - (d.b % 10)} más ${d.a} × ${d.b % 10}. ¿Cuánto es ${d.a} × ${d.b % 10}?`)
    const e = of(sample('mental:estimar', 4, 3), 'mental')[0]
    expect(e.prompt).toMatch(/^¿Cuánto da, más o menos, [\d ]+ [+−] [\d ]+\? Redondea cada número a la (decena|centena) y (suma|resta)\.$/)
    const comb = of(sample('mental:combinadas', 60, 10), 'mental')
    report('combinadas con números > 99', comb.filter((x) => Math.max(x.a, x.b, x.c ?? 0) > 99).map((x) => text(x.prompt)), comb.length)
  })

  it('estimar: la cuenta exacta no es un error de cuenta; el mensaje enseña a redondear primero', () => {
    const base = of(sample('mental:estimar', 4, 3), 'mental')[0]
    const ex = { ...base, a: 47, b: 32, answer: 80, place: 10 as const }
    const r = check(ex, { type: 'number', value: 79 })
    expect(r.correct).toBe(false)
    expect(r.errorType).not.toBe('fact')
    expect(r.feedback).toBe('Esa es la cuenta exacta. Aquí redondea primero: 50 + 30 = ?')
    const sub = check({ ...ex, a: 86, b: 42, answer: 50 }, { type: 'number', value: 44 })
    expect(sub.feedback).toBe('Esa es la cuenta exacta. Aquí redondea primero: 90 − 40 = ?')
    for (const e of of(sample('mental:estimar', 40, 6), 'mental')) {
      expect(check(e, { type: 'number', value: e.answer }).correct).toBe(true)
    }
  })

  it('ninguna respuesta que se escribe es negativa (el teclado no tiene signo menos)', () => {
    const all = [...nums, ...of(sample(['check:add', 'check:sub', 'check:div'], 40, 10), 'check-calc')]
    const bad = all.filter((e) => 'answer' in e && typeof e.answer === 'number' && e.answer < 0)
    report('respuestas negativas', bad.map((e) => text(e.id)), all.length)
  })
})

// ---------------------------------------------------------------- la pista 3 usa los datos del ejercicio (P4-24)

describe('la pista 3 usa los datos del ejercicio (P4-24)', () => {
  const kinds: [string, SkillKey[]][] = [
    ['clock-read', ['clock:read:5']], ['clock-set', ['clock:set:5']], ['area', ['geo:area']], ['angle-tap', ['geo:angle:tap']],
    ['fraction-read', ['frac:read:4', 'frac:read:8', 'frac:read:6']], ['fraction-equal', ['frac:equal']], ['shape-count', ['geo:poly:sides']],
    ['place-value', ['num:place:words', 'num:place:words:999']], ['error-hunt', ['hunt:add', 'hunt:sub', 'hunt:mul']],
    ['chart', ['chart:pict', 'chart:bars']], ['time-convert', ['clock:convert:day']], ['time-duration', ['time:end', 'time:elapsed']],
  ]
  for (const [kind, skills] of kinds) {
    it(`${kind}: en 5 ejercicios distintos, al menos 3 pistas 3 distintas`, () => {
      // Five exercises spread over the sample (not five of the same seed).
      const pool = sample(skills, 10, 4).filter((e) => e.kind === kind).filter((e) => !(e.kind === 'chart' && e.options.length))
      const exs = [0, 1, 2, 3, 4].map((i) => pool[Math.floor((i * pool.length) / 5)]).filter(Boolean)
      expect(exs.length).toBe(5)
      const third = new Set(exs.map((e) => hintsFor(e)[2].text))
      expect(third.size, [...third].join('\n')).toBeGreaterThanOrEqual(3)
    })
  }
})

// ---------------------------------------------------------------- «¿tiene sentido?» y suma de precios

describe('«¿tiene sentido?» (auditoría p1-medida-problemas H10)', () => {
  it('ninguna propuesta a menos del 10 % del resultado se pregunta con «¿Tiene sentido?»', () => {
    const bad: Miss[] = []
    let total = 0
    for (let seed = 1; seed <= 1200; seed++) {
      const p = buildSense(createRng(seed))
      if (p.shown === p.right) continue
      total++
      if (Math.abs(p.shown - p.right) / p.right <= 0.1 && /¿Tiene sentido esa respuesta\?$/.test(p.exercise.question)) bad.push(text(`${p.exercise.question} (resultado ${p.right})`))
    }
    expect(total).toBeGreaterThan(316)
    report('«¿tiene sentido?» con una propuesta cercana', bad, total)
  })

  it('la pregunta no delata la respuesta: las dos preguntas salen con respuestas buenas y malas', () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= 400; seed++) {
      const p = buildSense(createRng(seed))
      seen.add(`${p.exercise.question.endsWith('¿Es correcta la respuesta de Lumi?') ? 'exacta' : 'sentido'}:${p.shown === p.right}`)
    }
    expect(seen).toEqual(new Set(['exacta:true', 'exacta:false', 'sentido:true', 'sentido:false']))
  })
})

describe('suma de precios', () => {
  it('cada suma tiene al menos dos tarjetas con su precio', () => {
    const exs = of(sample('money:add'), 'money').filter((e) => e.mode === 'add')
    expect(exs.every((e) => e.mode === 'add' && e.items.length >= 2)).toBe(true)
  })
})
