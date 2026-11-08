/* One multiplication or division fact (fact-mul / fact-div): "6 × 7 = [ ]". Written answer through @/ink.
   teach (multiplication only, for screens that hide the view's own feedback): after a wrong try the engine's clue — the
   trick of that fact — shows (and is read aloud with voice on); with 'full', after the second wrong try the drawing and
   the worked step show and the child writes the answer before going on. */
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { speech } from '@/audio'
import { NumberInput } from '@/ink'
import type { ExerciseViewProps, FactDivExercise, FactMulExercise } from '@/types'
import { useActivityHost } from '../host'
import { useAnswerFlow } from '../facts/shared/flow'
import { HintPanel, HintVisual } from '../facts/shared/HintPanel'
import { speakFact } from '../facts/shared/speak'
import shared from '../facts/shared/shared.module.css'
import s from './FactView.module.css'

export default function FactView({ exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, tableMethod, teach = 'none', onTry }: ExerciseViewProps) {
  const ex = exercise as FactMulExercise | FactDivExercise
  const host = useActivityHost()
  const teaching = exercise.kind === 'fact-mul' ? teach : 'none'
  const flow = useAnswerFlow({ exercise, onAnswered, guided, allowHints, tableMethod, copyOnReveal: teaching === 'full',
    clueCountsAsHint: teaching !== 'none' && !showFeedback })
  const [draft, setDraft] = useState<number | null>(null)
  const isDiv = ex.kind === 'fact-div'
  const left = isDiv ? ex.dividend : ex.a
  const right = isDiv ? ex.divisor : ex.b
  const sign = isDiv ? '÷' : '×'
  const done = flow.phase === 'done'
  const correct = done && !!flow.last?.correct
  const status = correct ? 'correct' : flow.phase === 'retry' ? 'wrong' : 'idle'
  const copying = flow.phase === 'copy'
  // The clue after a wrong try: always where the view shows its feedback; with teach, also where it does not.
  const showClue = !!flow.clue && (showFeedback || (teaching !== 'none' && (flow.phase === 'retry' || copying)))
  const worked = copying ? flow.hints[flow.hints.length - 1] : undefined

  useEffect(() => {
    if (host.prefs.voice) speakFact(left, right, sign)
    // Only once per exercise: a new exercise is a new component key in the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id])

  useEffect(() => {
    if (flow.phase === 'retry' || copying) onTry?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.phase])

  // With voice on, the trick is read aloud after a wrong try (a rhyme sticks better heard), and the fact when copying.
  useEffect(() => {
    if (!host.prefs.voice || teaching === 'none') return
    try {
      if (flow.phase === 'retry' && flow.clue) void speech.say(flow.clue.replace(/ × /g, ' por '))
      if (copying) speakFact(left, right, sign, ex.answer)
    } catch {
      /* speech is optional */
    }
    // Once per wrong try: attemptKey changes with each one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow.phase, flow.attemptKey])

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
        {allowHints && !copying && (
          <div className={s.actions}>
            <button type="button" className={shared.hintBtn} onClick={flow.askHint} disabled={!flow.canHint}>
              Pista {flow.hintsShown} de {flow.hints.length}
            </button>
          </div>
        )}
        {!copying && <HintPanel hints={flow.hints} shown={flow.hintsShown} />}
        {showClue && (
          <p className={clsx(shared.clue, correct && shared.clueOk, (copying || (done && !correct)) && shared.clueReveal)} role="status">
            {flow.clue}
          </p>
        )}
        {worked && (
          <div className={shared.hintBox} role="note" data-testid="fact-worked">
            <p className={shared.hintText}>{host.t(worked.text.replace(/\?\s*$/, String(ex.answer)))}</p>
            <HintVisual hint={worked} />
          </div>
        )}
      </div>
    </div>
  )
}
