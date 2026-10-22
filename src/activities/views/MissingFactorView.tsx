/* Missing factor (missing-factor): "6 × [ ] = 42" or "[ ] × 6 = 42". The blank is the answer box itself. */
import clsx from 'clsx'
import { useState } from 'react'
import { NumberInput } from '@/ink'
import type { ExerciseViewProps, MissingFactorExercise } from '@/types'
import { useActivityHost } from '../host'
import { useAnswerFlow } from '../facts/shared/flow'
import { HintPanel } from '../facts/shared/HintPanel'
import shared from '../facts/shared/shared.module.css'
import s from './MissingFactorView.module.css'

export default function MissingFactorView({ exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact }: ExerciseViewProps) {
  const ex = exercise as MissingFactorExercise
  const host = useActivityHost()
  const flow = useAnswerFlow({ exercise, onAnswered, guided, allowHints })
  const [draft, setDraft] = useState<number | null>(null)
  const done = flow.phase === 'done'
  const correct = done && !!flow.last?.correct
  const status = correct ? 'correct' : flow.phase === 'retry' ? 'wrong' : 'idle'
  const missingFirst = ex.missing === 'a'

  const submit = (v: number | null) => {
    if (v === null || done) return
    flow.submit({ type: 'number', value: v })
    setDraft(null)
  }

  const blank = done ? (
    <span className={clsx(s.answer, !correct && s.answerRevealed)} aria-label={`Número que falta: ${ex.answer}`}>{ex.answer}</span>
  ) : (
    <NumberInput
      key={flow.attemptKey}
      value={draft}
      onChange={setDraft}
      onSubmit={submit}
      maxDigits={2}
      size={host.prefs.bigCells ? 'lg' : 'md'}
      autoFocus
      status={status}
      ariaLabel="Número que falta"
    />
  )

  return (
    <div className={clsx(s.root, compact && s.compact)} data-kind={ex.kind} data-phase={flow.phase}>
      <div className={clsx(shared.equation, compact && shared.equationCompact)}>
        {missingFirst ? blank : <span>{ex.a}</span>}
        <span className={shared.sign} aria-hidden>×</span>
        {missingFirst ? <span>{ex.b}</span> : blank}
        <span className={shared.sign} aria-hidden>=</span>
        <span>{ex.product}</span>
      </div>

      <div className={s.below}>
        {allowHints && (
          <div className={s.actions}>
            <button type="button" className={shared.hintBtn} onClick={flow.askHint} disabled={!flow.canHint}>
              Pista {flow.hintsShown} de {flow.hints.length}
            </button>
          </div>
        )}
        <HintPanel hints={flow.hints} shown={flow.hintsShown} />
        {showFeedback && flow.clue && (
          <p className={clsx(shared.clue, correct && shared.clueOk, done && !correct && shared.clueReveal)} role="status">
            {flow.clue}
          </p>
        )}
      </div>
    </div>
  )
}
