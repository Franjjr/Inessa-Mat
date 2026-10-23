/* One multiplication or division fact (fact-mul / fact-div): "6 × 7 = [ ]". Written answer through @/ink. */
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { NumberInput } from '@/ink'
import type { ExerciseViewProps, FactDivExercise, FactMulExercise } from '@/types'
import { useActivityHost } from '../host'
import { useAnswerFlow } from '../facts/shared/flow'
import { HintPanel } from '../facts/shared/HintPanel'
import { speakFact } from '../facts/shared/speak'
import shared from '../facts/shared/shared.module.css'
import s from './FactView.module.css'

export default function FactView({ exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, tableMethod }: ExerciseViewProps) {
  const ex = exercise as FactMulExercise | FactDivExercise
  const host = useActivityHost()
  const flow = useAnswerFlow({ exercise, onAnswered, guided, allowHints, tableMethod })
  const [draft, setDraft] = useState<number | null>(null)
  const isDiv = ex.kind === 'fact-div'
  const left = isDiv ? ex.dividend : ex.a
  const right = isDiv ? ex.divisor : ex.b
  const sign = isDiv ? '÷' : '×'
  const done = flow.phase === 'done'
  const correct = done && !!flow.last?.correct
  const status = correct ? 'correct' : flow.phase === 'retry' ? 'wrong' : 'idle'

  useEffect(() => {
    if (host.prefs.voice) speakFact(left, right, sign)
    // Only once per exercise: a new exercise is a new component key in the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id])

  const submit = (v: number | null) => {
    if (v === null || done) return
    flow.submit({ type: 'number', value: v })
    setDraft(null)
  }

  return (
    <div className={clsx(s.root, compact && s.compact)} data-kind={ex.kind} data-phase={flow.phase}>
      <div className={clsx(shared.equation, compact && shared.equationCompact)}>
        <span>{left}</span>
        <span className={shared.sign} aria-hidden>{sign}</span>
        <span>{right}</span>
        <span className={shared.sign} aria-hidden>=</span>
        {done ? (
          <span className={clsx(s.answer, !correct && s.answerRevealed)} aria-label={`Respuesta ${ex.answer}`}>{ex.answer}</span>
        ) : (
          <NumberInput
            key={flow.attemptKey}
            value={draft}
            onChange={setDraft}
            onSubmit={submit}
            maxDigits={3}
            size={host.prefs.bigCells ? 'lg' : 'md'}
            autoFocus
            status={status === 'idle' ? 'idle' : status}
            ariaLabel={isDiv ? `Cociente de ${left} entre ${right}` : `Producto de ${left} por ${right}`}
          />
        )}
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
