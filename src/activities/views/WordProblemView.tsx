/* Exercise view "word-problem": a short Spanish story with its numbers. Optionally the child first chooses the
   operation (juntar, quitar, repetir, repartir). The answer is written with the unit ("estrellas") shown next to it. */
import { useMemo, useRef, useState } from 'react'
import type { ExerciseViewProps, WordProblemExercise } from '@/types'
import { NumberInput } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { ListenButton } from '@/activities/shared/ListenButton'
import { statementFor } from '@/engine/statement'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { initialOf, useRetryFlow, useRetryWrong, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import { ExerciseLayout } from './ExerciseLayout'
import s from './WordProblemView.module.css'

export interface WordProblemViewProps extends ExerciseViewProps {
  /** The child picks the operation before solving. */
  chooseOp?: boolean
}

const OPS: { op: WordProblemExercise['op']; label: string; sign: string; verb: string }[] = [
  { op: 'add', label: 'Juntar', sign: '+', verb: 'juntar' },
  { op: 'sub', label: 'Quitar', sign: '−', verb: 'quitar' },
  { op: 'mul', label: 'Repetir', sign: '×', verb: 'repetir' },
  { op: 'div', label: 'Repartir', sign: '÷', verb: 'repartir' },
]

export default function WordProblemView(props: WordProblemViewProps) {
  const { exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact, chooseOp } = props
  if (exercise.kind !== 'word-problem') return null
  return (
    <WordRound
      key={exercise.id}
      ex={exercise}
      onAnswered={onAnswered}
      allowHints={allowHints}
      showFeedback={showFeedback}
      compact={compact}
      chooseOp={chooseOp}
      guided={guided}
      retry={props}
    />
  )
}

interface RoundProps {
  ex: WordProblemExercise
  onAnswered: ExerciseViewProps['onAnswered']
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
  chooseOp?: boolean
  guided?: boolean
  /** «Inténtalo otra vez»: what the child wrote (the number, and what is left over) and the wrong boxes. */
  retry?: RetryProps
}

function WordRound({ ex, onAnswered, allowHints, showFeedback, compact, chooseOp, guided, retry }: RoundProps) {
  const host = useActivityHost()
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  const text = useMemo(() => host.t(ex.text), [host, ex.text])
  // A try again starts with what the child wrote: the number, the remainder, and the operation she had already found.
  const before = initialOf(retry, 'number') ?? null
  const beforeDiv = initialOf(retry, 'division') ?? null
  const first = before ? before.value : beforeDiv ? beforeDiv.quotient : null
  const firstRest = beforeDiv ? beforeDiv.remainder : null
  /** 0: the answer box, 1: the box of what is left over. */
  const wrongBox = useRetryWrong(retry, () => [
    ...(first !== ex.answer ? [0] : []),
    ...((ex.remainder ?? 0) > 0 && firstRest !== (ex.remainder ?? 0) ? [1] : []),
  ])
  const [picked, setPicked] = useState<WordProblemExercise['op'] | null>(() => (chooseOp && (before || beforeDiv) ? ex.op : null))
  const [opClue, setOpClue] = useState<string | null>(null)
  /** The wrong-operation clue has been counted for this problem (counted once, at the first wrong button). */
  const clueCounted = useRef(false)
  const [value, setValue] = useState<number | null>(first)
  const [rest, setRest] = useState<number | null>(firstRest)
  const hasRemainder = (ex.remainder ?? 0) > 0
  const opReady = !chooseOp || picked === ex.op

  const pickOp = (op: WordProblemExercise['op']) => {
    setPicked(op)
    if (op === ex.op) {
      setOpClue(null)
      return
    }
    // A wrong operation is a clue taken: the first one counts as a hint used, so trying the buttons one by one does not
    // climb mastery. The buttons stay open, and the clue makes the child read the story again without naming the operation.
    if (!clueCounted.current) {
      clueCounted.current = true
      flow.countClue()
    }
    setOpClue(host.t('Esa no es la que toca. Vuelve a leer la historia y piensa qué pasa con los números.'))
  }

  // Takes the values explicitly: a NumberInput submit passes the value it has just read.
  const submit = (answer: number | null = value, leftover: number | null = rest) => {
    if (answer === null) return
    const c = hasRemainder
      ? flow.submit({ type: 'division', quotient: answer, remainder: leftover })
      : flow.submit({ type: 'number', value: answer })
    if (c.correct) celebrate('small')
  }

  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  /** Before checking again, a box the child had wrong stays soft red until she changes it. */
  const statusOf = (box: 0 | 1, now: number | null, then: number | null) =>
    !flow.result && wrongBox.has(box) && now === then ? 'wrong' as const : status
  const readyToCheck = value !== null && opReady

  return (
    <ExerciseLayout
      workClassName={`${s.view} ${compact ? s.compact : ''}`}
      aria-label="Problema"
      prompt={text}
      actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={readyToCheck} />}
    >
      {/* With the voice on the problem reads itself here: the «word» and «exercises» activities have no other «Escuchar»,
          and the lesson (TrySlot) and the session (ExerciseStep) leave theirs out for a problem when the voice is on. */}
      {host.prefs.voice && <ListenButton text={statementFor({ ...ex, text })} className={s.speak} />}

      {chooseOp && (
        <div className={s.ops} role="group" aria-label="¿Qué operación?">
          <p className={s.opsTitle}>{host.t('¿Qué hacemos con los números?')}</p>
          <div className={s.opButtons}>
            {OPS.map((o) => (
              <button
                key={o.op}
                type="button"
                className={`${s.opBtn} ${picked === o.op ? s.opOn : ''}`}
                onClick={() => pickOp(o.op)}
                aria-pressed={picked === o.op}
              >
                <span className={s.opSign} aria-hidden>{o.sign}</span>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
          {opClue && <p className={s.opClue}>{opClue}</p>}
        </div>
      )}

      <div className={s.answer}>
        <span className={s.answerLabel}>{host.t('Respuesta:')}</span>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => {
            setValue(v)
            if (opReady) submit(v)
          }}
          maxDigits={4}
          size="lg"
          status={statusOf(0, value, first)}
          ariaLabel="Respuesta"
          placeholder="?"
          autoFocus={!chooseOp}
          disabled={!opReady}
          checkButton={!hasRemainder}
        />
        <span className={s.unit}>{ex.unit}</span>
      </div>

      {hasRemainder && (
        <div className={s.answer}>
          <span className={s.answerLabel}>{host.t('Sobra:')}</span>
          <NumberInput value={rest} onChange={setRest} onSubmit={(r) => submit(value, r)} maxDigits={2} size="lg" status={statusOf(1, rest, firstRest)} ariaLabel="Lo que sobra" placeholder="?" disabled={!opReady} checkButton={false} />
        </div>
      )}

      {guided && <p className={s.guide}>{host.t('Piensa qué pasa en la historia antes de escribir el número.')}</p>}
    </ExerciseLayout>
  )
}
