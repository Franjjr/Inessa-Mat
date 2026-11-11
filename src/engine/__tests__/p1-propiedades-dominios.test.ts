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
import type {
  Answer, BarProblemExercise, CheckCalcExercise, CheckResult, ErrorHuntExercise, Exercise, SkillKey,
} from '@/types'

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
