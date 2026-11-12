/* Exercise view "check-calc" (comprobar, PLAN_DOCENTE §5 and §13). A claim is written out, «left op right = claimed».
   The child checks it with the opposite operation (claimed − right, claimed + right, or divisor × quotient + remainder),
   writes that check, and says whether the claim is right.
   p1n-01: a sign above the claim says it may be right or wrong. p1n-02: the box of the check is the school's proof
   («el resultado menos un sumando»); it is optional when the engine grades a right verdict without it (asked to the
   engine itself, so the view follows whatever the grading does). */
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { CheckCalcExercise, ExerciseViewProps } from '@/types'
import { check as grade } from '@/engine'
import { NumberInput } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { Button } from '@/ui'
import { AnswerBar } from '../groups/AnswerBar'
import { RETRY_WRONG_CLASS, useRetryChoice, useRetryFlow, useRetryNumber, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import { ExerciseLayout } from './ExerciseLayout'
import s from './BugViews.module.css'

/** The sign above a claim that may be wrong (p1n-01). */
export const CHECK_SIGN = 'Esta cuenta puede estar bien o mal. ¿Lo compruebas?'

/** The name of the school's proof for each operation (p1n-02). */
const PROOF: Record<CheckCalcExercise['op'], string> = {
  add: 'La prueba: el resultado menos un sumando',
  sub: 'La prueba: el resultado más lo que se quita',
  div: 'La prueba: divisor × cociente + resto',
}

/** Whether the engine grades a verdict without the proof written (then the box is optional). Both verdicts are asked
    and both must be graded (not sent back as incomplete): an optional box that showed for only one of them would tell
    the child whether the calculation is right. */
export function proofOptional(ex: CheckCalcExercise): boolean {
  return [true, false].every((ok) => grade(ex, { type: 'verdict', ok, value: null }).errorType !== 'incomplete')
}

export default function CheckCalcView(props: ExerciseViewProps) {
  const { exercise, onAnswered, allowHints = true, showFeedback = true, compact } = props
  if (exercise.kind !== 'check-calc') return null
  return (
    <CheckRound key={exercise.id} ex={exercise} onAnswered={onAnswered} allowHints={allowHints} showFeedback={showFeedback} compact={compact} retry={props} />
  )
}

interface RoundProps {
  ex: CheckCalcExercise
  onAnswered: ExerciseViewProps['onAnswered']
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
  /** «Inténtalo otra vez»: the verdict and the check the child wrote; the wrong one is marked. */
  retry?: RetryProps
}

function CheckRound({ ex, onAnswered, allowHints, showFeedback, compact, retry }: RoundProps) {
  const host = useActivityHost()
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  // A try again starts with the verdict and the check the child wrote; each wrong one is soft red until she changes it.
  const againVerdict = useRetryChoice<boolean>(retry, (a) => (a.type === 'verdict' ? a.ok : null), ex.ok)
  const againValue = useRetryNumber(retry, ex.answer, (a) => (a.type === 'verdict' ? a.value : null))
  const [verdict, setVerdict] = useState<boolean | null>(againVerdict.first)
  const [value, setValue] = useState<number | null>(againValue.first)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const checked = !!flow.result

  const claim = useMemo(() => {
    if (ex.op === 'div') return `${ex.left} ÷ ${ex.right} = ${ex.claimed}, y sobran ${ex.remainder ?? 0}`
    return `${ex.left} ${ex.op === 'add' ? '+' : '−'} ${ex.right} = ${ex.claimed}`
  }, [ex])
  const check = useMemo(() => {
    if (ex.op === 'add') return `${ex.claimed} − ${ex.right} = ?`
    if (ex.op === 'sub') return `${ex.claimed} + ${ex.right} = ?`
    return `${ex.right} × ${ex.claimed} + ${ex.remainder ?? 0} = ?`
  }, [ex])
  const optional = useMemo(() => proofOptional(ex), [ex])
  const canCheck = verdict !== null && (value !== null || optional)

  const submit = (v = value, vd = verdict) => {
    if (vd === null || (v === null && !optional)) return
    const r = flow.submit({ type: 'verdict', ok: vd, value: v })
    if (r.correct) celebrate('small')
  }

  return (
    <ExerciseLayout
      workClassName={clsx(s.view, compact && s.compact)}
      aria-label="Comprobar"
      prompt={host.t('¿Está bien esta cuenta?')}
      sub={host.t('Compruébala con la operación contraria.')}
      actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={canCheck} />}
    >
      <p className={s.sign} data-cartel="">{host.t(CHECK_SIGN)}</p>
      <p className={s.claim} aria-label={`Cuenta: ${claim}`}>{claim}</p>

      <div className={s.verdicts} role="group" aria-label="¿Está bien?">
        <Button size="lg" variant={verdict === true ? 'success' : 'secondary'} className={clsx(againVerdict.marked(true, verdict, checked) && RETRY_WRONG_CLASS)} aria-pressed={verdict === true} onClick={() => setVerdict(true)}>
          ✓ Sí, está bien
        </Button>
        <Button size="lg" variant={verdict === false ? 'primary' : 'secondary'} className={clsx(againVerdict.marked(false, verdict, checked) && RETRY_WRONG_CLASS)} aria-pressed={verdict === false} onClick={() => setVerdict(false)}>
          ✗ No está bien
        </Button>
      </div>

      <div className={s.answer}>
        <span className={s.answerLabel}>{host.t(`${PROOF[ex.op]}${optional ? ' (si quieres)' : ''}:`)}</span>
        <span className={s.checkExpr}>{check}</span>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); if (verdict !== null) submit(v, verdict) }}
          maxDigits={4}
          size="lg"
          status={againValue.marked(value, checked) ? 'wrong' : status}
          ariaLabel="Resultado de la comprobación"
          placeholder="?"
        />
      </div>
    </ExerciseLayout>
  )
}
