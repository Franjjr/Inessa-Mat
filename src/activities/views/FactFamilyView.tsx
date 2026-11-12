/* Fact family (fact-family): a triangle with a, b and p, and the four related facts to write. */
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { NumberInput } from '@/ink'
import type { ExerciseViewProps, FactFamilyExercise } from '@/types'
import { useSlotFlow } from '../facts/shared/flow'
import { HintPanel } from '../facts/shared/HintPanel'
import shared from '../facts/shared/shared.module.css'
import { ExerciseLayout } from './ExerciseLayout'
import { FactViewBar } from './FactViewBar'
import s from './FactFamilyView.module.css'

/** What the child does here, said in a child's words. */
export const FAMILY_INSTRUCTION = 'Escribe las cuatro cuentas que salen con estos tres números.'

/** The worked example of the family: never the exercise itself (3, 4 and 12 is the example unless it is the exercise). */
export function familyExample(a: number, b: number): string {
  const is23 = (a === 2 && b === 3) || (a === 3 && b === 2)
  const [x, y, z] = is23 ? [3, 4, 12] : [2, 3, 6]
  return `Ejemplo con ${x}, ${y} y ${z}: ${x} × ${y} = ${z}, ${y} × ${x} = ${z}, ${z} ÷ ${x} = ${y} y ${z} ÷ ${y} = ${x}.`
}

interface Row {
  left: string
  right: string
  op: '×' | '÷'
  expected: number
}

export default function FactFamilyView({ exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, initialAnswer, wrongColumns }: ExerciseViewProps) {
  const ex = exercise as FactFamilyExercise
  const { a, b, product: p } = ex
  const rows: Row[] = [
    { left: `${a}`, right: `${b}`, op: '×', expected: p },
    { left: `${b}`, right: `${a}`, op: '×', expected: p },
    { left: `${p}`, right: `${a}`, op: '÷', expected: b },
    { left: `${p}`, right: `${b}`, op: '÷', expected: a },
  ]
  const expected = rows.map((r) => r.expected)
  const flow = useSlotFlow({
    exercise,
    onAnswered,
    guided,
    allowHints,
    expected,
    makeAnswer: (values) => {
      const [v0, v1, v2, v3] = values.map((x) => x ?? 0)
      return { type: 'facts', facts: [`${a}x${b}=${v0}`, `${b}x${a}=${v1}`, `${p}/${a}=${v2}`, `${p}/${b}=${v3}`] }
    },
    clueFor: () => '¡Casi! Piensa en la familia de números: ¿qué multiplicado da el total?',
  })
  // «Inténtalo otra vez»: each line starts with what she wrote on the previous try, marked when it was wrong.
  const priorAt = (slot: number): number | null => {
    const f = initialAnswer?.type === 'facts' ? initialAnswer.facts[slot] : undefined
    const n = f === undefined ? NaN : Number(f.split('=').pop())
    return Number.isFinite(n) ? n : null
  }
  const [draft, setDraft] = useState<number | null>(priorAt(0))
  const done = flow.phase === 'done'
  const allCorrect = done && !!flow.last?.correct
  const current = flow.current

  // A new slot starts with an empty pad; after a wrong try what she wrote stays (clearKey).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setDraft(priorAt(current)) }, [current])
  const before = current >= 0 ? priorAt(current) : null
  const oldWrong = before !== null && draft === before && (wrongColumns && wrongColumns.length ? wrongColumns.includes(current) : before !== expected[current])

  const submit = (v: number | null) => {
    if (v === null || done) return
    flow.submit(v)
  }

  return (
    <ExerciseLayout
      aria-label="Familia de operaciones"
      prompt={FAMILY_INSTRUCTION}
      sub={familyExample(a, b)}
      actions={<FactViewBar allowHints={allowHints} hintsShown={flow.hintsShown} hintsTotal={flow.hints.length} canHint={flow.canHint}
        onHint={flow.askHint} onCheck={() => submit(draft)} canCheck={draft !== null} done={done} />}
    >
    <div className={clsx(s.root, compact && s.compact)} data-kind={ex.kind} data-phase={flow.phase}>
      <svg className={s.triangle} viewBox="0 0 200 170" role="img" aria-label={`Triángulo con ${a}, ${b} y ${p}`}>
        <polygon points="100,12 22,152 178,152" className={s.tri} />
        <text x="100" y="104" className={s.num} textAnchor="middle">{p}</text>
        <text x="50" y="142" className={s.num} textAnchor="middle">{a}</text>
        <text x="150" y="142" className={s.num} textAnchor="middle">{b}</text>
      </svg>

      <ol className={s.rows} aria-label="Escribe las cuatro operaciones">
        {rows.map((r, i) => {
          const closed = flow.closed[i]
          const isCurrent = !done && i === current
          return (
            <li key={i} className={clsx(s.row, isCurrent && s.rowCurrent, closed && s.rowDone)} data-state={closed ? 'closed' : isCurrent ? 'current' : 'open'}>
              <span className={s.rowText}>{r.left} {r.op} {r.right} =</span>
              {isCurrent ? (
                <NumberInput
                  key={i}
                  clearKey={flow.attemptKey}
                  value={draft}
                  onChange={setDraft}
                  onSubmit={submit}
                  maxDigits={2}
                  size="md"
                  autoFocus
                  status={flow.phase === 'retry' || oldWrong ? 'wrong' : 'idle'}
                  ariaLabel={`Resultado de ${r.left} ${r.op} ${r.right}`}
                />
              ) : (
                <span className={clsx(s.value, flow.revealed[i] && s.valueRevealed)}>{closed ? (flow.revealed[i] ? r.expected : flow.values[i]) : <span className={s.blank} aria-hidden />}</span>
              )}
            </li>
          )
        })}
      </ol>

      <div className={s.below}>
        <HintPanel hints={flow.hints} shown={flow.hintsShown} />
        {showFeedback && flow.clue && (
          <p className={clsx(shared.clue, allCorrect && shared.clueOk, done && !allCorrect && shared.clueReveal)} role="status">{flow.clue}</p>
        )}
      </div>
    </div>
    </ExerciseLayout>
  )
}
