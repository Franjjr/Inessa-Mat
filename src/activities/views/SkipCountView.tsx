/* Skip counting (skip-count): a necklace of beads, some hidden. The child writes the hidden beads one by one. */
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { NumberInput } from '@/ink'
import type { ExerciseViewProps, SkipCountExercise } from '@/types'
import { useActivityHost } from '../host'
import { useSlotFlow } from '../facts/shared/flow'
import { HintPanel } from '../facts/shared/HintPanel'
import { SequenceBoard, type SequenceCell } from '../facts/shared/SequenceBoard'
import shared from '../facts/shared/shared.module.css'
import { ExerciseLayout } from './ExerciseLayout'
import { FactViewBar } from './FactViewBar'
import s from './SkipCountView.module.css'

export default function SkipCountView({ exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, initialAnswer, wrongColumns }: ExerciseViewProps) {
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
  // «Inténtalo otra vez»: each bead starts with what she wrote on the previous try, marked when it was wrong.
  const priorAt = (slot: number): number | null => {
    const v = initialAnswer?.type === 'numbers' ? initialAnswer.values[slot] : null
    return typeof v === 'number' ? v : null
  }
  const [draft, setDraft] = useState<number | null>(priorAt(0))
  const done = flow.phase === 'done'
  const current = flow.current
  const allCorrect = done && !!flow.last?.correct

  const before = current >= 0 ? priorAt(current) : null
  const oldWrong = before !== null && draft === before && (wrongColumns ? wrongColumns.includes(current) : before !== ex.answer[current])

  const cells: SequenceCell[] = ex.values.map((v, i) => {
    const slot = hidden.indexOf(i)
    if (slot < 0) return { text: String(v), state: 'given' }
    if (flow.closed[slot]) {
      return flow.revealed[slot] ? { text: String(ex.answer[slot]), state: 'revealed' } : { text: String(v), state: 'filled' }
    }
    return { text: '', state: slot === current ? 'current' : 'open' }
  })

  // A new slot starts with an empty pad; after a wrong try what she wrote stays (clearKey).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setDraft(priorAt(current)) }, [current])

  const submit = (v: number | null) => {
    if (v === null || done) return
    flow.submit(v)
  }

  return (
    <ExerciseLayout
      aria-label={`Collar de ${ex.step}`}
      prompt={`Completa el collar: cuenta de ${ex.step} en ${ex.step}.`}
      sub={`Ejemplo: de ${ex.step === 5 ? 2 : 5} en ${ex.step === 5 ? 2 : 5} es ${[1, 2, 3, 4].map((k) => k * (ex.step === 5 ? 2 : 5)).join(', ')}. Escribe el número de la perla marcada.`}
      actions={<FactViewBar allowHints={allowHints} hintsShown={flow.hintsShown} hintsTotal={flow.hints.length} canHint={flow.canHint}
        onHint={flow.askHint} onCheck={() => submit(draft)} canCheck={draft !== null} done={done} />}
    >
    <div className={clsx(s.root, compact && s.compact)} data-kind={ex.kind} data-phase={flow.phase}>
      <SequenceBoard cells={cells} variant="beads" label={`Collar de ${ex.step}`} />

      {!done ? (
        <div className={s.inputRow}>
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
            ariaLabel={`Perla ${hidden[current] + 1} del collar`}
          />
        </div>
      ) : (
        <p className={clsx(shared.clue, allCorrect ? shared.clueOk : shared.clueReveal)}>
          {allCorrect ? '¡Collar completo!' : 'Así queda el collar.'}
        </p>
      )}

      <div className={s.below}>
        <HintPanel hints={flow.hints} shown={flow.hintsShown} />
        {showFeedback && flow.clue && !done && (
          <p className={shared.clue} role="status">{flow.clue}</p>
        )}
        {showFeedback && done && flow.clue && !allCorrect && (
          <p className={clsx(shared.clue, shared.clueReveal)} role="status">{flow.clue}</p>
        )}
      </div>
    </div>
    </ExerciseLayout>
  )
}
