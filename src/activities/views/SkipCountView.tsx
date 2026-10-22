/* Skip counting (skip-count): a necklace of beads, some hidden. The child writes the hidden beads one by one. */
import clsx from 'clsx'
import { useState } from 'react'
import { NumberInput } from '@/ink'
import type { ExerciseViewProps, SkipCountExercise } from '@/types'
import { useActivityHost } from '../host'
import { useSlotFlow } from '../facts/shared/flow'
import { HintPanel } from '../facts/shared/HintPanel'
import { SequenceBoard, type SequenceCell } from '../facts/shared/SequenceBoard'
import shared from '../facts/shared/shared.module.css'
import s from './SkipCountView.module.css'

export default function SkipCountView({ exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact }: ExerciseViewProps) {
  const ex = exercise as SkipCountExercise
  const host = useActivityHost()
  const hidden = ex.hiddenIndexes
  const flow = useSlotFlow({
    exercise,
    onAnswered,
    guided,
    allowHints,
    expected: ex.answer,
    makeAnswer: (values) => ({ type: 'numbers', values }),
    clueFor: (slot) => {
      const h = hidden[slot]
      const prev = ex.values[h - 1] ?? 0
      return `¡Casi! Cuenta de ${ex.step} en ${ex.step}: después del ${prev} viene ${prev} + ${ex.step}.`
    },
  })
  const [draft, setDraft] = useState<number | null>(null)
  const done = flow.phase === 'done'
  const current = flow.current
  const allCorrect = done && !!flow.last?.correct

  const cells: SequenceCell[] = ex.values.map((v, i) => {
    const slot = hidden.indexOf(i)
    if (slot < 0) return { text: String(v), state: 'given' }
    if (flow.closed[slot]) {
      return flow.revealed[slot] ? { text: String(ex.answer[slot]), state: 'revealed' } : { text: String(v), state: 'filled' }
    }
    return { text: '', state: slot === current ? 'current' : 'open' }
  })

  const submit = (v: number | null) => {
    if (v === null || done) return
    flow.submit(v)
    setDraft(null)
  }

  return (
    <div className={clsx(s.root, compact && s.compact)} data-kind={ex.kind} data-phase={flow.phase}>
      <SequenceBoard cells={cells} variant="beads" label={`Collar de ${ex.step}`} />

      {!done ? (
        <div className={s.inputRow}>
          <p className={shared.instructions}>¿Qué número va en la perla marcada?</p>
          <NumberInput
            key={`${current}-${flow.attemptKey}`}
            value={draft}
            onChange={setDraft}
            onSubmit={submit}
            maxDigits={3}
            size={host.prefs.bigCells ? 'lg' : 'md'}
            autoFocus
            status={flow.phase === 'retry' ? 'wrong' : 'idle'}
            ariaLabel={`Perla ${hidden[current] + 1} del collar`}
          />
        </div>
      ) : (
        <p className={clsx(shared.clue, allCorrect ? shared.clueOk : shared.clueReveal)}>
          {allCorrect ? '¡Collar completo!' : 'Así queda el collar.'}
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
        {showFeedback && flow.clue && !done && (
          <p className={shared.clue} role="status">{flow.clue}</p>
        )}
        {showFeedback && done && flow.clue && !allCorrect && (
          <p className={clsx(shared.clue, shared.clueReveal)} role="status">{flow.clue}</p>
        )}
      </div>
    </div>
  )
}
