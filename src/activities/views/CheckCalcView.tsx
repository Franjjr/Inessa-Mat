/* Exercise view "check-calc" (comprobar, PLAN_DOCENTE §5 and §13). A claim is written out, «left op right = claimed».
   The child checks it with the opposite operation (claimed − right, claimed + right, or divisor × quotient + remainder),
   writes that check, and says whether the claim is right. */
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { CheckCalcExercise, ExerciseViewProps } from '@/types'
import { NumberInput } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { Button } from '@/ui'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './BugViews.module.css'

export default function CheckCalcView(props: ExerciseViewProps) {
  const { exercise, onAnswered, allowHints = true, showFeedback = true, compact } = props
  if (exercise.kind !== 'check-calc') return null
  return (
    <CheckRound key={exercise.id} ex={exercise} onAnswered={onAnswered} allowHints={allowHints} showFeedback={showFeedback} compact={compact} />
  )
}

interface RoundProps {
  ex: CheckCalcExercise
  onAnswered: ExerciseViewProps['onAnswered']
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
}

function CheckRound({ ex, onAnswered, allowHints, showFeedback, compact }: RoundProps) {
  const host = useActivityHost()
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [verdict, setVerdict] = useState<boolean | null>(null)
  const [value, setValue] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  const claim = useMemo(() => {
    if (ex.op === 'div') return `${ex.left} ÷ ${ex.right} = ${ex.claimed}, y sobran ${ex.remainder ?? 0}`
    return `${ex.left} ${ex.op === 'add' ? '+' : '−'} ${ex.right} = ${ex.claimed}`
  }, [ex])
  const check = useMemo(() => {
    if (ex.op === 'add') return `${ex.claimed} − ${ex.right} = ?`
    if (ex.op === 'sub') return `${ex.claimed} + ${ex.right} = ?`
    return `${ex.right} × ${ex.claimed} + ${ex.remainder ?? 0} = ?`
  }, [ex])
  const canCheck = verdict !== null && value !== null

  const submit = (v = value, vd = verdict) => {
    if (vd === null || v === null) return
    const r = flow.submit({ type: 'verdict', ok: vd, value: v })
    if (r.correct) celebrate('small')
  }

  return (
    <section className={clsx(s.view, compact && s.compact)} aria-label="Comprobar">
      <p className={s.prompt}>{host.t('¿Está bien esta cuenta? Compruébala con la operación contraria.')}</p>
      <p className={s.claim} aria-label={`Cuenta: ${claim}`}>{claim}</p>

      <div className={s.verdicts} role="group" aria-label="¿Está bien?">
        <Button size="lg" variant={verdict === true ? 'success' : 'secondary'} aria-pressed={verdict === true} onClick={() => setVerdict(true)}>
          ✓ Sí, está bien
        </Button>
        <Button size="lg" variant={verdict === false ? 'primary' : 'secondary'} aria-pressed={verdict === false} onClick={() => setVerdict(false)}>
          ✗ No está bien
        </Button>
      </div>

      <div className={s.answer}>
        <span className={s.answerLabel}>{host.t('Comprobación:')}</span>
        <span className={s.checkExpr}>{check}</span>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); if (verdict !== null) submit(v, verdict) }}
          maxDigits={4}
          size="lg"
          status={status}
          ariaLabel="Resultado de la comprobación"
          placeholder="?"
        />
      </div>

      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={canCheck} />
    </section>
  )
}
