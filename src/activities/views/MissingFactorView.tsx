/* Missing factor (missing-factor): "6 × [ ] = 42" or "[ ] × 6 = 42". The blank is the answer box itself. */
import clsx from 'clsx'
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { useInkLearning } from '@/ink/hooks'
import type { ExerciseViewProps, MissingFactorExercise } from '@/types'
import { useActivityHost } from '../host'
import { useAnswerFlow } from '../facts/shared/flow'
import { HintPanel } from '../facts/shared/HintPanel'
import shared from '../facts/shared/shared.module.css'
import { ExerciseLayout } from './ExerciseLayout'
import { FactViewBar } from './FactViewBar'
import s from './MissingFactorView.module.css'

export default function MissingFactorView({ exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, initialAnswer }: ExerciseViewProps) {
  const ex = exercise as MissingFactorExercise
  const host = useActivityHost()
  const flow = useAnswerFlow({ exercise, onAnswered, guided, allowHints })
  const learning = useInkLearning()
  // «Inténtalo otra vez»: the pad starts with what she wrote, marked as not right until she changes it.
  const before = initialAnswer?.type === 'number' ? initialAnswer.value : null
  const [draft, setDraft] = useState<number | null>(before ?? null)
  const done = flow.phase === 'done'
  const correct = done && !!flow.last?.correct
  const status = correct ? 'correct' : flow.phase === 'retry' || (before !== null && draft === before) ? 'wrong' : 'idle'
  const missingFirst = ex.missing === 'a'

  const submit = (v: number | null) => {
    if (done) return
    // Ink that could not be read («?»): the child is asked which number it is, nothing is graded.
    if (v === null) { learning.requestConfirm(); return }
    // What she wrote stays on the pad after a wrong try (clearKey), so she sees what the app read.
    flow.submit({ type: 'number', value: v })
  }

  const blank = done ? (
    <span className={clsx(s.answer, !correct && s.answerRevealed)} aria-label={`Número que falta: ${ex.answer}`}>{ex.answer}</span>
  ) : (
    <NumberInput
      clearKey={flow.attemptKey}
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
    <ExerciseLayout
      aria-label="Número que falta"
      prompt="¿Qué número falta?"
      sub={`Piensa: ¿qué número multiplicado por ${missingFirst ? ex.b : ex.a} da ${ex.product}?`}
      actions={<FactViewBar allowHints={allowHints} hintsShown={flow.hintsShown} hintsTotal={flow.hints.length} canHint={flow.canHint}
        onHint={flow.askHint} onCheck={() => submit(draft)} canCheck done={done} />}
    >
    <div className={clsx(s.root, compact && s.compact)} data-kind={ex.kind} data-phase={flow.phase}>
      <div className={clsx(shared.equation, compact && shared.equationCompact)}>
        {missingFirst ? blank : <span>{ex.a}</span>}
        <span className={shared.sign} aria-hidden>×</span>
        {missingFirst ? <span>{ex.b}</span> : blank}
        <span className={shared.sign} aria-hidden>=</span>
        <span>{ex.product}</span>
      </div>

      <div className={s.below}>
        <HintPanel hints={flow.hints} shown={flow.hintsShown} />
        {showFeedback && flow.clue && (
          <p className={clsx(shared.clue, correct && shared.clueOk, done && !correct && shared.clueReveal)} role="status">
            {flow.clue}
          </p>
        )}
        {showFeedback && flow.canDispute && (
          <button type="button" className={shared.hintBtn} onClick={flow.dispute}>
            No, yo he escrito otra cosa
          </button>
        )}
      </div>
    </div>
    </ExerciseLayout>
  )
}
