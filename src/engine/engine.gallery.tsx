/* Dev gallery for the pedagogy engine: /dev/gallery?only=src/engine
   Not part of the engine API (the engine itself stays pure TS). It lets the team proofread the Spanish copy:
   Lumi's tricks, error diagnoses with their feedback, progressive hints and generated story problems. */
import type { GalleryEntry } from '@/dev/Gallery'
import type { Answer, Exercise } from '@/types'
import {
  check, createRng, describeError, fmt, generate, hintsFor, makeColumnAdd, makeColumnMul, makeColumnSub, makeDivision,
  makeFactFamily, makeFactMul, numberWords, strategyForFact,
} from './index'
import s from './engine.gallery.module.css'

const SAMPLE = (t: string) => t.replace(/\{child\}/g, 'Inessa').replace(/\{pet\}/g, 'Bigotes')

function show(ex: Exercise): string {
  switch (ex.kind) {
    case 'fact-mul': return `${ex.a} × ${ex.b}`
    case 'column-add': return ex.operands.join(' + ')
    case 'column-sub': return `${ex.minuend} − ${ex.subtrahend}`
    case 'column-mul': return `${ex.top} × ${ex.bottom}`
    case 'division': return `${ex.dividend} ÷ ${ex.divisor}`
    case 'fact-family': return `${ex.a}, ${ex.b} y ${ex.product}`
    case 'place-value': return ex.mode === 'expanded' ? fmt(ex.value) : ex.mode === 'words' ? numberWords(ex.value) : `${fmt(ex.value)} (bloques)`
    case 'compare': return `${fmt(ex.left)} ? ${fmt(ex.right)}`
    case 'order': return ex.values.map(fmt).join(' · ') + (ex.direction === 'asc' ? ' (de menor a mayor)' : ' (de mayor a menor)')
    case 'round': return `${fmt(ex.value)} a las ${ex.to === 10 ? 'decenas' : 'centenas'}`
    case 'number-line': return ex.mode === 'tick' ? `recta de ${ex.step}: marca ${ex.blank + 1} vacía` : `recta de ${ex.step}: desde ${fmt(ex.start ?? 0)}`
    case 'mental': return ex.prompt
    case 'equation': return `${ex.left.map((t) => (t === null ? '__' : String(t))).join(' ')} = ${ex.right.map((t) => (t === null ? '__' : String(t))).join(' ')}`
    default: return ex.id
  }
}

function showAnswer(a: Answer): string {
  switch (a.type) {
    case 'number': return String(a.value ?? '—')
    case 'digits': return a.digits.map((d) => (d === null ? '·' : d > 9 ? `[${d}]` : String(d))).reverse().join('')
    case 'division': return `${a.quotient ?? '—'} resto ${a.remainder ?? '—'}`
    case 'steps': return `${a.values.map((v) => v ?? '—').join(' · ')}${a.total !== undefined ? ` = ${a.total ?? '—'}` : ''}`
    case 'facts': return a.facts.join(' · ')
    case 'numbers': return a.values.join(', ')
    case 'sign': return a.sign ?? '—'
    case 'bar': return `${a.results.map((r) => r ?? '—').join(' · ')} (${a.ops.map((o) => o ?? '—').join(' ')})`
    case 'hunt': return `${a.ok === null ? '—' : a.ok ? 'bien' : 'error'}${a.column !== null ? ` columna ${a.column + 1}` : ''}${a.value !== null ? ` = ${a.value}` : ''}`
    case 'verdict': return `${a.ok === null ? '—' : a.ok ? 'bien' : 'mal'} · ${a.value ?? '—'}`
    case 'division-parts': return `${a.parts.map((v) => v ?? '—').join(' + ')} = ${a.quotient ?? '—'} resto ${a.remainder ?? '—'}`
    case 'climb': return `${a.products.map((v) => v ?? '—').join(' · ')} resto ${a.remainder ?? '—'}`
    case 'shade': return `${a.chosen.length} partes`
    case 'fraction': return `${a.numerator ?? '—'}/${a.denominator ?? '—'}`
    case 'choice': return a.index === null ? '—' : `opción ${a.index + 1}`
    case 'marks': return a.marked.length ? a.marked.map((i) => i + 1).join(', ') : 'ninguna'
  }
}

const STRATEGY_LABEL: Record<string, string> = {
  'easy-one': '×1', 'double': 'doble', 'five': '×5', 'ten': '×10', 'mirror': 'espejo', 'five-plus-one': '5 y uno más',
  'even-six-rhyme': 'pares que riman', 'double-double': 'doble y doble', 'double-double-double': 'doble ×3',
  'nine-trick': 'truco del 9', 'square-rhyme': 'rima', 'five-six-seven-eight': '5-6-7-8', 'weeks': 'semanas', 'known': 'contar',
}

function Tricks() {
  return (
    <div className={s.tricks}>
      {[6, 7, 8].map((t) => (
        <section key={t} className={s.trickCol} data-table={t}>
          <h3 className={s.h3}>Tabla del {t}</h3>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const st = strategyForFact(t, n)
            return (
              <div key={n} className={s.trick}>
                <span className={s.fact}>{t} × {n}</span>
                <span className={s.chip} data-id={st.id}>{STRATEGY_LABEL[st.id]}</span>
                <span className={s.trickText}>{st.text}</span>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}

const CASES: { ex: Exercise; answer: Answer }[] = [
  { ex: makeFactMul(6, 7), answer: { type: 'number', value: 48 } },
  { ex: makeFactMul(8, 7), answer: { type: 'number', value: 54 } },
  { ex: makeColumnAdd([368, 257]), answer: { type: 'digits', digits: [5, 1, 5] } },
  { ex: makeColumnAdd([768, 457]), answer: { type: 'digits', digits: [5, 2, 2, null] } },
  { ex: makeColumnAdd([3456, 278]), answer: { type: 'digits', digits: [6, 3, 2, 6] } },
  { ex: makeColumnSub(52, 17), answer: { type: 'digits', digits: [5, 4] } },
  { ex: makeColumnSub(734, 459), answer: { type: 'digits', digits: [5, 8, 3] } },
  { ex: makeColumnSub(503, 128), answer: { type: 'digits', digits: [5, 8, 4] } },
  { ex: makeColumnMul(47, 6), answer: { type: 'digits', digits: [2, 4, 2] } },
  { ex: makeColumnMul(47, 6), answer: { type: 'digits', digits: [2, 8, 4] } },
  { ex: makeColumnMul(23, 3), answer: { type: 'digits', digits: [6, 2] } },
  { ex: makeColumnSub(734, 459), answer: { type: 'digits', digits: [15, 7, 2] } },
  { ex: makeDivision(17, 5), answer: { type: 'division', quotient: 2, remainder: 7 } },
  { ex: makeDivision(38, 6), answer: { type: 'division', quotient: 7, remainder: 0 } },
  { ex: makeDivision(29, 4), answer: { type: 'division', quotient: 5, remainder: 1 } },
  { ex: makeDivision(72, 3), answer: { type: 'division', quotient: 20, remainder: 2 } },
  { ex: makeDivision(84, 4), answer: { type: 'division', quotient: 2, remainder: 0 } },
  { ex: makeDivision(84, 4), answer: { type: 'division', quotient: 12, remainder: 0 } },
  { ex: makeFactFamily(6, 7), answer: { type: 'facts', facts: ['6×7=42', '7×6=42', '6÷42=7', '42÷7=6'] } },
]

function Diagnoses() {
  return (
    <table className={s.table}>
      <thead>
        <tr><th>Ejercicio</th><th>Respuesta</th><th>Diagnóstico (adultos)</th><th>Columnas</th><th>Lo que dice Lumi</th></tr>
      </thead>
      <tbody>
        {CASES.map(({ ex, answer }, i) => {
          const r = check(ex, answer)
          return (
            <tr key={i}>
              <td className={s.num}>{show(ex)}</td>
              <td className={s.num}>{showAnswer(answer)}</td>
              <td><span className={s.err} data-err={r.errorType}>{r.errorType}</span><div className={s.small}>{r.errorType && describeError(r.errorType)}</div></td>
              <td className={s.small}>{r.wrongColumns?.join(', ') ?? '—'}</td>
              <td className={s.feedback}>{SAMPLE(r.feedback ?? '')}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Hints() {
  const exs = [makeFactMul(7, 6), makeColumnAdd([368, 257]), makeColumnSub(503, 128), makeDivision(72, 3)]
  return (
    <div className={s.hintGrid}>
      {exs.map((ex) => (
        <section key={ex.id} className={s.hintCard}>
          <h3 className={s.h3}>{show(ex)}</h3>
          <ol className={s.steps}>
            {hintsFor(ex).map((h) => (
              <li key={h.level} className={s.step} data-level={h.level}>
                <span className={s.level}>{h.level}</span>
                <span>
                  <span className={s.visual}>{h.visual}</span>
                  {SAMPLE(h.text)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

function Problems() {
  const rng = createRng(2026)
  const exs = [
    ...generate({ kinds: ['word-problem'], digits: 4 }, 2, { rng }),
    ...generate({ kinds: ['word-problem'], tables: [6, 7, 8] }, 3, { rng }),
    ...generate({ kinds: ['word-problem'], digits: 2 }, 3, { rng }),
  ]
  return (
    <div className={s.problems}>
      {exs.map((ex) => ex.kind === 'word-problem' && (
        <article key={ex.id} className={s.problem} data-op={ex.op}>
          <p className={s.problemText}>{SAMPLE(ex.text)}</p>
          <p className={s.problemAnswer}>
            {ex.operands[0]} {({ add: '+', sub: '−', mul: '×', div: '÷' } as const)[ex.op]} {ex.operands[1]} = <b>{ex.answer}</b> {ex.unit}
          </p>
        </article>
      ))}
    </div>
  )
}

/** Numbers up to 9 999, cálculo mental and signo igual: a few generated items with their three hints. */
function Numeros() {
  const rng = createRng(3031)
  const kinds = ['place-value', 'compare', 'order', 'round', 'number-line', 'mental', 'equation'] as const
  return (
    <div className={s.hintGrid}>
      {kinds.map((kind) => {
        const [ex] = generate({ kinds: [kind] }, 1, { rng })
        if (!ex) return null
        return (
          <section key={`${kind}:${ex.id}`} className={s.hintCard} data-kind={kind}>
            <h3 className={s.h3}>{show(ex)}</h3>
            <p className={s.problemAnswer}>Respuesta: <b>{Array.isArray((ex as { answer?: unknown }).answer) ? ((ex as { answer: number[] }).answer).join(' · ') : String((ex as { answer?: unknown }).answer ?? '')}</b></p>
            <ol className={s.steps}>
              {hintsFor(ex).map((h) => (
                <li key={h.level} className={s.step} data-level={h.level}>
                  <span className={s.level}>{h.level}</span>
                  <span>{SAMPLE(h.text)}</span>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

const entries: GalleryEntry[] = [
  { title: 'Trucos de Lumi · tablas del 6, 7 y 8 (strategyForFact)', render: () => <Tricks />, width: 1120 },
  { title: 'Errores que son pistas (check → errorType + feedback)', render: () => <Diagnoses />, width: 1120 },
  { title: 'Pistas progresivas (hintsFor)', render: () => <Hints />, width: 1120 },
  { title: 'Problemas de Numeria (generate word-problem)', render: () => <Problems />, width: 1120 },
  { title: 'Números hasta 9 999, cálculo mental y signo igual (3.º)', render: () => <Numeros />, width: 1120 },
]

export default entries
