/* The two written division methods of the division exercises (see DivisionView for the choice):
   - DivisionPartsView («repartir por partes»): the dividend is split in its parts (84 = 80 + 4), each part is divided
     (80 ÷ 4 = 20, 4 ÷ 4 = 1), the remainder of one part joins the next, and the quotients are added.
   - DivisionClimbView («multiplicar hacia arriba»): «¿qué número por 4 da 28?». The child writes the multiples of the
     divisor one row at a time, until one passes the dividend; the number of rows before it is the quotient.
   Both end with the remainder and go through the same engine check as the galera. */
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { DivisionExercise, ExerciseViewProps } from '@/types'
import { divisionParts } from '@/engine'
import { NumberInput } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { Button } from '@/ui'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './DivisionMethods.module.css'

type Props = Pick<ExerciseViewProps, 'exercise' | 'onAnswered' | 'allowHints' | 'showFeedback' | 'compact'>

export function DivisionPartsView({ exercise, onAnswered, allowHints = true, showFeedback = true, compact }: Props) {
  if (exercise.kind !== 'division') return null
  return <PartsRound key={exercise.id} ex={exercise} onAnswered={onAnswered} allowHints={allowHints} showFeedback={showFeedback} compact={compact} />
}

export function DivisionClimbView({ exercise, onAnswered, allowHints = true, showFeedback = true, compact }: Props) {
  if (exercise.kind !== 'division') return null
  return <ClimbRound key={exercise.id} ex={exercise} onAnswered={onAnswered} allowHints={allowHints} showFeedback={showFeedback} compact={compact} />
}

interface RoundProps {
  ex: DivisionExercise
  onAnswered: ExerciseViewProps['onAnswered']
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
}

function PartsRound({ ex, onAnswered, allowHints, showFeedback, compact }: RoundProps) {
  const host = useActivityHost()
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints, method: 'div-parts' })
  const steps = useMemo(() => divisionParts(ex.dividend, ex.divisor), [ex])
  const [parts, setParts] = useState<(number | null)[]>(() => steps.map(() => null))
  const [total, setTotal] = useState<number | null>(null)
  const [rest, setRest] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const canCheck = parts.every((p) => p !== null) && total !== null && rest !== null

  const submit = (ps = parts, t = total, r = rest) => {
    if (!ps.every((p) => p !== null) || t === null || r === null) return
    const c = flow.submit({ type: 'division-parts', parts: ps, quotient: t, remainder: r })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={clsx(s.view, compact && s.compact)} aria-label="Repartir por partes">
      <p className={s.prompt}>{host.t(`Reparte ${ex.dividend} entre ${ex.divisor} por partes. Divide cada parte y después suma.`)}</p>
      <ol className={s.parts}>
        {steps.map((st, k) => (
          <li key={k} className={s.part}>
            <span className={s.partLabel}>
              {host.t(`Parte ${k + 1}: ${st.carried > 0 ? `${st.part} + ${st.carried} que sobra` : `${st.part}`} ÷ ${ex.divisor} =`)}
            </span>
            <NumberInput
              value={parts[k]}
              onChange={(v) => setParts((prev) => prev.map((x, i) => (i === k ? v : x)))}
              onSubmit={(v) => {
                const next = parts.map((x, i) => (i === k ? v : x))
                setParts(next)
                submit(next)
              }}
              maxDigits={2}
              size="md"
              status={status}
              ariaLabel={`cociente de la parte ${k + 1}`}
              placeholder="?"
              autoFocus={k === 0}
            />
          </li>
        ))}
      </ol>
      <div className={s.totals}>
        <div className={s.answer}>
          <span className={s.answerLabel}>{host.t('Cociente:')}</span>
          <NumberInput value={total} onChange={setTotal} onSubmit={() => submit()} maxDigits={3} size="md" status={status} ariaLabel="cociente total" placeholder="?" />
        </div>
        <div className={s.answer}>
          <span className={s.answerLabel}>{host.t('Resto:')}</span>
          <NumberInput value={rest} onChange={setRest} onSubmit={() => submit()} maxDigits={2} size="md" status={status} ariaLabel="resto" placeholder="?" />
        </div>
      </div>
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={canCheck} />
    </section>
  )
}

function ClimbRound({ ex, onAnswered, allowHints, showFeedback, compact }: RoundProps) {
  const host = useActivityHost()
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints, method: 'climb' })
  const [rows, setRows] = useState<number[]>([])
  const [draft, setDraft] = useState<number | null>(null)
  const [rest, setRest] = useState<number | null>(null)
  const passed = rows.length > 0 && rows[rows.length - 1] >= ex.dividend
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const canCheck = passed && rest !== null

  const confirm = (v: number | null = draft) => {
    if (v === null || passed) return
    setRows((prev) => [...prev, v])
    setDraft(null)
  }
  const submit = (r: number | null = rest) => {
    if (!passed || r === null) return
    const c = flow.submit({ type: 'climb', products: rows, remainder: r })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={clsx(s.view, compact && s.compact)} aria-label="Multiplicar hacia arriba">
      <p className={s.prompt}>{host.t(`¿Qué número por ${ex.divisor} da ${ex.dividend}, o se acerca sin pasarse? Sube fila a fila.`)}</p>
      <ol className={s.rows}>
        {rows.map((p, k) => (
          <li key={k} className={clsx(s.row, p > ex.dividend && s.over)}>
            {`${ex.divisor} × ${k + 1} = ${p}`}
          </li>
        ))}
      </ol>
      {!passed && (
        <div className={s.answer}>
          <span className={s.answerLabel}>{host.t(`${ex.divisor} × ${rows.length + 1} =`)}</span>
          <NumberInput
            value={draft}
            onChange={setDraft}
            onSubmit={(v) => { setDraft(v); confirm(v) }}
            maxDigits={3}
            size="md"
            status={status}
            ariaLabel={`producto de ${ex.divisor} por ${rows.length + 1}`}
            placeholder="?"
            autoFocus
          />
          <Button size="md" variant="secondary" onClick={() => confirm()} disabled={draft === null}>
            {host.t('Fila lista')}
          </Button>
        </div>
      )}
      {passed && (
        <div className={s.answer}>
          <span className={s.answerLabel}>{host.t('Sobra:')}</span>
          <NumberInput value={rest} onChange={setRest} onSubmit={(v) => { setRest(v); submit(v) }} maxDigits={2} size="md" status={status} ariaLabel="resto" placeholder="?" autoFocus />
        </div>
      )}
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={canCheck} />
    </section>
  )
}
