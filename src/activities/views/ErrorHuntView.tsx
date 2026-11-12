/* Exercise view "error-hunt" (encuentra el error, PLAN_DOCENTE §5). A column calculation is written out with its
   result. The child decides: «Está bien» or «Hay un error». With an error, the child taps the column where it is and
   writes the right result. Nothing is revealed: the calculation is shown exactly as the child would write it.
   A sign above the calculation says whose it is and that it may be wrong on purpose (p1n-01): a child must never
   take it for a model. It never says whether this one is wrong (some are right: «Está bien» is an answer). */
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { ErrorHuntExercise, ExerciseViewProps } from '@/types'
import { digitAt, digitCount } from '@/engine'
import { columnWithArticle } from '@/engine'
import { NumberInput } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { Button } from '@/ui'
import { AnswerBar } from '../groups/AnswerBar'
import { initialOf, RETRY_WRONG_CLASS, useRetryFlow, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import { ExerciseLayout } from './ExerciseLayout'
import s from './BugViews.module.css'

/** The sign above a calculation made wrong on purpose (p1n-01). */
export const HUNT_SIGN = 'Dani ha hecho esta cuenta. Puede tener un fallo a propósito.'

const SIGN: Record<ErrorHuntExercise['op'], string> = { add: '+', sub: '−', mul: '×' }

export default function ErrorHuntView(props: ExerciseViewProps) {
  const { exercise, onAnswered, allowHints = true, showFeedback = true, compact } = props
  if (exercise.kind !== 'error-hunt') return null
  return (
    <HuntRound key={exercise.id} ex={exercise} onAnswered={onAnswered} allowHints={allowHints} showFeedback={showFeedback} compact={compact} retry={props} />
  )
}

interface RoundProps {
  ex: ErrorHuntExercise
  onAnswered: ExerciseViewProps['onAnswered']
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
  /** «Inténtalo otra vez»: the verdict, the column and the result the child gave; the wrong ones are marked. */
  retry?: RetryProps
}

/** What to mark on a try again of an encuentra el error: the verdict when it was the wrong one, else the column tapped
    when the written result is right there, and the result when it is not the right one. Worked out here: the
    corrector names the column tapped also when that column was a good one (only the result was wrong). */
export function huntRetryMarks(ex: ErrorHuntExercise, retry: RetryProps | undefined): { verdict: boolean; column: boolean; value: boolean } {
  const before = initialOf(retry, 'hunt')
  const none = { verdict: false, column: false, value: false }
  if (!before || before.ok === null) return none
  if (before.ok !== (ex.wrongColumn === null)) return { ...none, verdict: true }
  if (before.ok) return none
  const c = before.column
  const errorColumn = c !== null && digitAt(ex.shown, c) !== digitAt(ex.answer, c)
  return { verdict: false, column: c !== null && !errorColumn, value: before.value !== null && before.value !== ex.answer }
}

function HuntRound({ ex, onAnswered, allowHints, showFeedback, compact, retry }: RoundProps) {
  const host = useActivityHost()
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  // A try again starts with what the child said: the verdict, the column and the result, the wrong ones soft red.
  const [before] = useState(() => initialOf(retry, 'hunt'))
  const [marks] = useState(() => huntRetryMarks(ex, retry))
  const [verdict, setVerdict] = useState<'ok' | 'error' | null>(before?.ok === true ? 'ok' : before?.ok === false ? 'error' : null)
  const [column, setColumn] = useState<number | null>(before?.ok === false ? before.column : null)
  const [value, setValue] = useState<number | null>(before?.ok === false ? before.value : null)
  const checked = !!flow.result
  const firstVerdict = before?.ok === true ? 'ok' : before?.ok === false ? 'error' : null
  const verdictMarked = (v: 'ok' | 'error') => !checked && marks.verdict && verdict === v && firstVerdict === v
  const columnMarked = (i: number) => !checked && marks.column && column === i && before?.column === i
  const valueMarked = !checked && marks.value && value === (before?.value ?? null)
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
    <ExerciseLayout
      workClassName={clsx(s.view, compact && s.compact)}
      aria-label="Encuentra el error"
      prompt={host.t('¿Está bien esta cuenta?')}
      actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={canCheck} />}
    >
      <p className={s.sign} data-cartel="">{host.t(HUNT_SIGN)}</p>

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
          // A difference never has more digits than the top number: the spare column is only for sums and products.
          const selectable = verdict === 'error' && (ex.op !== 'sub' || i < digitCount(ex.top))
          const label = `columna de ${columnWithArticle(i)}`
          return selectable ? (
            <button
              key={`r${i}`}
              type="button"
              className={clsx(s.digit, s.hit, picked && s.picked, columnMarked(i) && RETRY_WRONG_CLASS)}
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
          className={clsx(verdictMarked('ok') && RETRY_WRONG_CLASS)}
          aria-pressed={verdict === 'ok'}
          onClick={() => { setVerdict('ok'); setColumn(null); setValue(null) }}
        >
          ✓ Está bien
        </Button>
        <Button
          size="lg"
          variant={verdict === 'error' ? 'primary' : 'secondary'}
          className={clsx(verdictMarked('error') && RETRY_WRONG_CLASS)}
          aria-pressed={verdict === 'error'}
          onClick={() => setVerdict('error')}
        >
          ✗ Hay un error
        </Button>
      </div>

      {verdict === 'error' && (
        <div className={s.fix}>
          <p className={s.hint}>
            {column === null ? host.t('Toca la columna donde está el error.') : host.t(`Error en ${columnWithArticle(column)}. ¿Cuál es el resultado bien escrito?`)}
          </p>
          <div className={s.answer}>
            <span className={s.answerLabel}>{host.t('Resultado bien:')}</span>
            <NumberInput
              value={value}
              onChange={setValue}
              onSubmit={(v) => { setValue(v); if (column !== null) submit(v, column, 'error') }}
              maxDigits={4}
              size="lg"
              status={valueMarked ? 'wrong' : status}
              ariaLabel="Resultado correcto"
              placeholder="?"
              autoFocus
            />
          </div>
        </div>
      )}
    </ExerciseLayout>
  )
}
