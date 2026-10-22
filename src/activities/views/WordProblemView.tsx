/* Exercise view "word-problem": a short Spanish story with its numbers. Optionally the child first chooses the
   operation (juntar, quitar, repetir, repartir). The answer is written with the unit ("estrellas") shown next to it. */
import { useMemo, useState } from 'react'
import type { ExerciseViewProps, WordProblemExercise } from '@/types'
import { NumberInput } from '@/ink'
import { speech } from '@/audio'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
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
}

function WordRound({ ex, onAnswered, allowHints, showFeedback, compact, chooseOp, guided }: RoundProps) {
  const host = useActivityHost()
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const text = useMemo(() => host.t(ex.text), [host, ex.text])
  const [picked, setPicked] = useState<WordProblemExercise['op'] | null>(null)
  const [opClue, setOpClue] = useState<string | null>(null)
  const [value, setValue] = useState<number | null>(null)
  const [rest, setRest] = useState<number | null>(null)
  const hasRemainder = (ex.remainder ?? 0) > 0
  const opReady = !chooseOp || picked === ex.op

  const pickOp = (op: WordProblemExercise['op']) => {
    setPicked(op)
    setOpClue(op === ex.op ? null : host.t('Pista: mira la historia. ¿Se juntan, se quitan, se repiten o se reparten?'))
  }

  // Takes the values explicitly: a NumberInput submit passes the value it has just read.
  const submit = (answer: number | null = value, leftover: number | null = rest) => {
    if (answer === null) return
    const c = hasRemainder
      ? flow.submit({ type: 'division', quotient: answer, remainder: leftover })
      : flow.submit({ type: 'number', value: answer })
    if (c.correct) celebrate('small')
  }

  const readAloud = () => {
    void speech.say(text, { interrupt: true })
  }
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const readyToCheck = value !== null && opReady

  return (
    <section className={`${s.view} ${compact ? s.compact : ''}`} aria-label="Problema">
      <article className={s.story}>
        <p className={s.text}>{text}</p>
        {host.prefs.voice && (
          <button type="button" className={s.speak} onClick={readAloud} aria-label="Leer en voz alta">
            🔊 Escuchar
          </button>
        )}
      </article>

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
          status={status}
          ariaLabel="Respuesta"
          placeholder="?"
          autoFocus={!chooseOp}
          disabled={!opReady}
        />
        <span className={s.unit}>{ex.unit}</span>
      </div>

      {hasRemainder && (
        <div className={s.answer}>
          <span className={s.answerLabel}>{host.t('Sobra:')}</span>
          <NumberInput value={rest} onChange={setRest} onSubmit={(r) => submit(value, r)} maxDigits={2} size="lg" status={status} ariaLabel="Lo que sobra" placeholder="?" disabled={!opReady} />
        </div>
      )}

      {guided && <p className={s.guide}>{host.t('Piensa qué pasa en la historia antes de escribir el número.')}</p>}

      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={readyToCheck} />
    </section>
  )
}
