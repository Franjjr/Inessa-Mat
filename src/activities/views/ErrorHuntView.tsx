/* Exercise view "error-hunt" (encuentra el error, PLAN_DOCENTE §5). A column calculation is written out with its
   result. The child decides: «Está bien» or «Hay un error». With an error, the child taps the column where it is and
   writes the right result. Nothing is revealed: the calculation is shown exactly as the child would write it. */
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { ErrorHuntExercise, ExerciseViewProps } from '@/types'
import { digitAt, digitCount } from '@/engine'
import { columnName } from '@/engine'
import { NumberInput } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { Button } from '@/ui'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './BugViews.module.css'

const SIGN: Record<ErrorHuntExercise['op'], string> = { add: '+', sub: '−', mul: '×' }

export default function ErrorHuntView(props: ExerciseViewProps) {
  const { exercise, onAnswered, allowHints = true, showFeedback = true, compact } = props
  if (exercise.kind !== 'error-hunt') return null
  return (
    <HuntRound key={exercise.id} ex={exercise} onAnswered={onAnswered} allowHints={allowHints} showFeedback={showFeedback} compact={compact} />
  )
}

interface RoundProps {
  ex: ErrorHuntExercise
  onAnswered: ExerciseViewProps['onAnswered']
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
}

function HuntRound({ ex, onAnswered, allowHints, showFeedback, compact }: RoundProps) {
  const host = useActivityHost()
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [verdict, setVerdict] = useState<'ok' | 'error' | null>(null)
  const [column, setColumn] = useState<number | null>(null)
  const [value, setValue] = useState<number | null>(null)
  // One extra empty column on the left: a missing digit of the written result can be pointed at too.
  const cols = useMemo(() => Math.max(digitCount(ex.top), digitCount(ex.bottom), digitCount(ex.shown)) + 1, [ex])
  const order = useMemo(() => Array.from({ length: cols }, (_, k) => cols - 1 - k), [cols]) // left to right
  const cellOf = (n: number, i: number) => (i < digitCount(n) ? String(digitAt(n, i)) : '')
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const canCheck = verdict === 'ok' || (verdict === 'error' && column !== null && value !== null)

  const submit = (v = value, c = column, vd = verdict) => {
    if (vd === null) return
    const ok = vd === 'ok'
    const r = flow.submit({ type: 'hunt', ok, column: ok ? null : c, value: ok ? null : v })
    if (r.correct) celebrate('small')
  }

  return (
    <section className={clsx(s.view, compact && s.compact)} aria-label="Encuentra el error">
      <p className={s.prompt}>{host.t('Mira esta cuenta. ¿Está bien el resultado?')}</p>

      <div className={s.calc} style={{ gridTemplateColumns: `repeat(${cols}, var(--bug-cell))` }} role="table" aria-label="Cuenta">
        {order.map((i) => (
          <span key={`t${i}`} className={s.digit} style={{ gridColumn: cols - i, gridRow: 1 }} aria-hidden>{cellOf(ex.top, i)}</span>
        ))}
        {order.map((i) => (
          <span key={`b${i}`} className={s.digit} style={{ gridColumn: cols - i, gridRow: 2 }} aria-hidden>
            {i === cols - 1 ? SIGN[ex.op] : cellOf(ex.bottom, i)}
          </span>
        ))}
        <span className={s.line} style={{ gridColumn: `1 / span ${cols}`, gridRow: 3 }} aria-hidden />
        {order.map((i) => {
          const picked = verdict === 'error' && column === i
          const selectable = verdict === 'error'
          const label = `columna de las ${columnName(i)}`
          return selectable ? (
            <button
              key={`r${i}`}
              type="button"
              className={clsx(s.digit, s.hit, picked && s.picked)}
              style={{ gridColumn: cols - i, gridRow: 4 }}
              aria-label={label}
              aria-pressed={picked}
              onClick={() => setColumn(i)}
            >
              {cellOf(ex.shown, i)}
            </button>
          ) : (
            <span key={`r${i}`} className={s.digit} style={{ gridColumn: cols - i, gridRow: 4 }} aria-hidden>{cellOf(ex.shown, i)}</span>
          )
        })}
      </div>

      <div className={s.verdicts} role="group" aria-label="¿Está bien?">
        <Button
          size="lg"
          variant={verdict === 'ok' ? 'success' : 'secondary'}
          aria-pressed={verdict === 'ok'}
          onClick={() => { setVerdict('ok'); setColumn(null); setValue(null) }}
        >
          ✓ Está bien
        </Button>
        <Button
          size="lg"
          variant={verdict === 'error' ? 'primary' : 'secondary'}
          aria-pressed={verdict === 'error'}
          onClick={() => setVerdict('error')}
        >
          ✗ Hay un error
        </Button>
      </div>

      {verdict === 'error' && (
        <div className={s.fix}>
          <p className={s.hint}>
            {column === null ? host.t('Toca la columna donde está el error.') : host.t(`Error en las ${columnName(column)}. ¿Cuál es el resultado bien escrito?`)}
          </p>
          <div className={s.answer}>
            <span className={s.answerLabel}>{host.t('Resultado bien:')}</span>
            <NumberInput
              value={value}
              onChange={setValue}
              onSubmit={(v) => { setValue(v); if (column !== null) submit(v, column, 'error') }}
              maxDigits={4}
              size="lg"
              status={status}
              ariaLabel="Resultado correcto"
              placeholder="?"
              autoFocus
            />
          </div>
        </div>
      )}

      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={canCheck} />
    </section>
  )
}
