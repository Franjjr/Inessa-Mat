/* Doubling chain (double-chain): 3 → 6 → 12 → 24. The child writes each doubling as the links appear. */
import clsx from 'clsx'
import { useState } from 'react'
import { NumberInput } from '@/ink'
import type { DoubleChainExercise, ExerciseViewProps } from '@/types'
import { useActivityHost } from '../host'
import { useSlotFlow } from '../facts/shared/flow'
import { HintPanel } from '../facts/shared/HintPanel'
import { SequenceBoard, type SequenceCell } from '../facts/shared/SequenceBoard'
import shared from '../facts/shared/shared.module.css'
import s from './DoubleChainView.module.css'

export default function DoubleChainView({ exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact }: ExerciseViewProps) {
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
  const [draft, setDraft] = useState<number | null>(null)
  const done = flow.phase === 'done'
  const allCorrect = done && !!flow.last?.correct
  const current = flow.current

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

  const submit = (v: number | null) => {
    if (v === null || done) return
    flow.submit(v)
    setDraft(null)
  }

  return (
    <div className={clsx(s.root, compact && s.compact)} data-kind={ex.kind} data-phase={flow.phase}>
      <SequenceBoard cells={cells} variant="chain" label={`Cadena de dobles desde ${ex.start}`} />

      {!done ? (
        <div className={s.inputRow}>
          <p className={shared.instructions}>¿Cuánto es el doble del último eslabón?</p>
          <NumberInput
            key={`${current}-${flow.attemptKey}`}
            value={draft}
            onChange={setDraft}
            onSubmit={submit}
            maxDigits={3}
            size={host.prefs.bigCells ? 'lg' : 'md'}
            autoFocus
            status={flow.phase === 'retry' ? 'wrong' : 'idle'}
            ariaLabel={`Eslabón ${current + 2} de la cadena`}
          />
        </div>
      ) : (
        <p className={clsx(shared.clue, allCorrect ? shared.clueOk : shared.clueReveal)}>
          {allCorrect ? '¡Cadena completa! Doble, doble y doble.' : 'Así queda la cadena.'}
        </p>
      )}

      <div className={s.below}>
        {allowHints && (
          <div className={s.actions}>
            <button type="button" className={shared.hintBtn} onClick={flow.askHint} disabled={!flow.canHint}>
              Pista {flow.hintsShown} de {flow.hints.length}
            </button>
          </div>
        )}
        <HintPanel hints={flow.hints} shown={flow.hintsShown} />
        {showFeedback && flow.clue && !allCorrect && (
          <p className={clsx(shared.clue, done && shared.clueReveal)} role="status">{flow.clue}</p>
        )}
      </div>
    </div>
  )
}
