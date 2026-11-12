/* Doubling chain (double-chain): 3 → 6 → 12 → 24. The child writes each doubling as the links appear.
   Above the chain, the multiplication it solves («8 × 3 = ?»: doubling three times is multiplying by 8); at the end,
   the same line with the result («8 × 3 = 24»). */
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { NumberInput } from '@/ink'
import type { DoubleChainExercise, ExerciseViewProps } from '@/types'
import { useActivityHost } from '../host'
import { useSlotFlow } from '../facts/shared/flow'
import { HintPanel } from '../facts/shared/HintPanel'
import { SequenceBoard, type SequenceCell } from '../facts/shared/SequenceBoard'
import shared from '../facts/shared/shared.module.css'
import { ExerciseLayout } from './ExerciseLayout'
import { FactViewBar } from './FactViewBar'
import s from './DoubleChainView.module.css'

export default function DoubleChainView({ exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, initialAnswer, wrongColumns }: ExerciseViewProps) {
  const ex = exercise as DoubleChainExercise
  const host = useActivityHost()
  const flow = useSlotFlow({
    exercise,
    onAnswered,
    guided,
    allowHints,
    expected: ex.answer,
    makeAnswer: (values) => ({ type: 'numbers', values }),
    clueFor: (slot) => {
      const prev = slot === 0 ? ex.start : ex.answer[slot - 1]
      return `¡Casi! Dobla el ${prev}: ${prev} + ${prev} = ?`
    },
  })
  // «Inténtalo otra vez»: each link starts with what she wrote on the previous try, marked when it was wrong.
  const priorAt = (slot: number): number | null => {
    const v = initialAnswer?.type === 'numbers' ? initialAnswer.values[slot] : null
    return typeof v === 'number' ? v : null
  }
  const [draft, setDraft] = useState<number | null>(priorAt(0))
  const done = flow.phase === 'done'
  const allCorrect = done && !!flow.last?.correct
  const current = flow.current
  // Doubling n times multiplies by 2, 4, 8…: the table this chain practises.
  const times = 2 ** ex.answer.length
  const last = ex.answer[ex.answer.length - 1]
  const goal = `${times} × ${ex.start} = ${done ? last : '?'}`

  const before = current >= 0 ? priorAt(current) : null
  const oldWrong = before !== null && draft === before && (wrongColumns && wrongColumns.length ? wrongColumns.includes(current) : before !== ex.answer[current])

  // Link 0 is the given start; link i+1 is slot i.
  const cells: SequenceCell[] = [
    { text: String(ex.start), state: 'given' },
    ...ex.answer.map((v, slot): SequenceCell => {
      if (flow.closed[slot]) {
        return flow.revealed[slot] ? { text: String(v), state: 'revealed' } : { text: String(flow.values[slot] ?? v), state: 'filled' }
      }
      return { text: '', state: slot === current ? 'current' : 'open' }
    }),
  ]

  // A new slot starts with an empty pad; after a wrong try what she wrote stays (clearKey).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setDraft(priorAt(current)) }, [current])

  const submit = (v: number | null) => {
    if (v === null || done) return
    flow.submit(v)
  }

  return (
    <ExerciseLayout
      aria-label="Cadena de dobles"
      prompt={`Dobla ${ex.answer.length === 1 ? 'una vez' : `${ex.answer.length} veces`} el ${ex.start}, un eslabón tras otro.`}
      sub={`Ejemplo: el doble de ${ex.start === 5 ? 4 : 5} es ${ex.start === 5 ? 8 : 10}, porque ${ex.start === 5 ? '4 + 4 = 8' : '5 + 5 = 10'}. Doblar es sumar el número a sí mismo.`}
      actions={<FactViewBar allowHints={allowHints} hintsShown={flow.hintsShown} hintsTotal={flow.hints.length} canHint={flow.canHint}
        onHint={flow.askHint} onCheck={() => submit(draft)} canCheck={draft !== null} done={done} />}
    >
    <div className={clsx(s.root, compact && s.compact)} data-kind={ex.kind} data-phase={flow.phase}>
      <p className={shared.instructions} data-testid="double-goal" aria-label={done ? `${times} por ${ex.start} es ${last}` : `${times} por ${ex.start}, ¿cuánto es?`}>
        {goal}
      </p>
      <SequenceBoard cells={cells} variant="chain" label={`Cadena de dobles desde ${ex.start}`} />

      {!done ? (
        <div className={s.inputRow}>
          <p className={shared.instructions}>¿Cuánto es el doble del último eslabón?</p>
          <NumberInput
            key={current}
            clearKey={flow.attemptKey}
            value={draft}
            onChange={setDraft}
            onSubmit={submit}
            maxDigits={3}
            size={host.prefs.bigCells ? 'lg' : 'md'}
            autoFocus
            status={flow.phase === 'retry' || oldWrong ? 'wrong' : 'idle'}
            ariaLabel={`Eslabón ${current + 2} de la cadena`}
          />
        </div>
      ) : (
        <p className={clsx(shared.clue, allCorrect ? shared.clueOk : shared.clueReveal)}>
          {allCorrect ? '¡Cadena completa! Doble, doble y doble.' : 'Así queda la cadena.'}
        </p>
      )}

      <div className={s.below}>
        <HintPanel hints={flow.hints} shown={flow.hintsShown} />
        {showFeedback && flow.clue && !allCorrect && (
          <p className={clsx(shared.clue, done && shared.clueReveal)} role="status">{flow.clue}</p>
        )}
      </div>
    </div>
    </ExerciseLayout>
  )
}
