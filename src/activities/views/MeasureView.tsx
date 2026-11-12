/* Medida (measure:*): choose the unit of a real object, convert simple units, read a measure on an on-screen ruler
   (the object does not always start at 0), add two measures in mixed units, and say whether a claimed measure is
   reasonable. Numbers are typed in the same writing pad as the other numeric views. */
import clsx from 'clsx'
import { createContext, useContext, useMemo, useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt, measureStatement } from '@/engine'
import { useActivityHost } from '@/activities/host'
import { useMediaQuery } from '@/activities/lesson/useLessonMedia'
import type {
  ExerciseViewProps, MeasureAddExercise, MeasureConvertExercise, MeasureEstimateExercise, MeasureRulerExercise, MeasureUnitExercise,
} from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { MeasureRuler } from './MeasureRuler'
import type { AnswerFlow } from '../groups/flow'
import { RETRY_WRONG_CLASS, useRetryChoice, useRetryFlow, useRetryNumber, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import s from './NumericViews.module.css'
import m from './MoneyViews.module.css'
import r from './MeasureView.module.css'
import { ExerciseLayout } from './ExerciseLayout'

type MeasureEx = MeasureUnitExercise | MeasureConvertExercise | MeasureRulerExercise | MeasureAddExercise | MeasureEstimateExercise

export default function MeasureView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'measure') return null
  return <MeasureRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
}

/** «Inténtalo otra vez»: what the child gave on the last try, for the screen of each mode (see TrySlotRetry.ts). */
const RetryContext = createContext<RetryProps | undefined>(undefined)

function MeasureRound({ ex, onAnswered, showFeedback, allowHints, retry }: { ex: MeasureEx; retry?: RetryProps } & Pick<ExerciseViewProps, 'onAnswered' | 'showFeedback' | 'allowHints'>) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback: showFeedback ?? true, allowHints: allowHints ?? true })
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  return (
    <RetryContext.Provider value={retry}>
    <section className="ex-shell" aria-label="Medida" data-kind="measure" data-mode={ex.mode} data-status={status}>
      {(() => {
        switch (ex.mode) {
          case 'unit': return <UnitRound ex={ex} flow={flow} />
          case 'convert': return <ConvertRound ex={ex} flow={flow} />
          case 'ruler': return <RulerRound ex={ex} flow={flow} />
          case 'add': return <AddRound ex={ex} flow={flow} />
          case 'estimate': return <EstimateRound ex={ex} flow={flow} />
        }
      })()}
    </section>
    </RetryContext.Provider>
  )
}

const celebrateIfRight = (flow: AnswerFlow, answer: Parameters<AnswerFlow['submit']>[0]) => {
  const c = flow.submit(answer)
  if (c.correct) celebrate('small')
}

// ---------------------------------------------------------------- unit of an object

function UnitRound({ ex, flow }: { ex: MeasureUnitExercise; flow: AnswerFlow }) {
  const again = useRetryChoice<string>(useContext(RetryContext), (a) => (a.type === 'option' ? a.value : null), ex.answer)
  const [picked, setPicked] = useState<string | null>(again.first)
  const locked = !!flow.result?.correct
  return (
    <ExerciseLayout workClassName={s.view} prompt={measureStatement(ex)} actions={<AnswerBar flow={flow} onCheck={() => picked && celebrateIfRight(flow, { type: 'option', value: picked })} canCheck={picked !== null} />}>
      <div className={m.stage}>
        <span className={r.objectEmoji} aria-hidden>{ex.emoji}</span>
        <span className={r.objectName}>{ex.object}</span>
      </div>
      <div className={m.choices} role="group" aria-label="Medida">
        {ex.options.map((o) => (
          <button
            key={o.unit}
            type="button"
            className={clsx(m.choice, picked === o.unit && m.choiceOn, again.marked(o.unit, picked, !!flow.result) && RETRY_WRONG_CLASS)}
            aria-pressed={picked === o.unit}
            onClick={() => { if (!locked) setPicked(o.unit) }}
          >
            {fmt(o.value)} {o.unit}
          </button>
        ))}
      </div>
    </ExerciseLayout>
  )
}

// ---------------------------------------------------------------- conversion

function ConvertRound({ ex, flow }: { ex: MeasureConvertExercise; flow: AnswerFlow }) {
  const again = useRetryNumber(useContext(RetryContext), ex.answer)
  const [value, setValue] = useState<number | null>(again.first)
  const status = again.marked(value, !!flow.result) ? 'wrong' as const : flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const submit = (v: number | null = value) => { if (v !== null) celebrateIfRight(flow, { type: 'number', value: v }) }
  return (
    <ExerciseLayout workClassName={s.view} prompt={ex.toBig ? 'Pasa a la unidad grande.' : 'Pasa a la unidad pequeña.'} actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />}>
      <div className={r.equation}>
        <span className={r.given}>{ex.given.charAt(0).toUpperCase() + ex.given.slice(1)}</span>
        {/* The unit goes before the box: after it would sit beside the pad's own ✓ button. */}
        <span className={r.unit}>en {ex.unit}:</span>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); if (!flow.submitted) submit(v) }}
          maxDigits={4}
          size="lg"
          status={status}
          ariaLabel={`Cantidad en ${ex.unit}`}
          placeholder="?"
          autoFocus
        />
      </div>
    </ExerciseLayout>
  )
}

// ---------------------------------------------------------------- ruler

/**
 * Ruler of 30 cm drawn to scale, with the object from `start` to `end`. The child reads where it ends. On a phone the
 * whole ruler would be tiny, so it shows only the stretch around the object (from a multiple of 5 to another).
 */
function Ruler({ max, start, end }: { max: number; start: number; end: number }) {
  const narrow = useMediaQuery('(max-width: 600px)')
  let from = 0
  let to = max
  if (narrow) {
    from = Math.max(0, Math.floor((start - 1) / 5) * 5)
    to = Math.min(max, Math.ceil((end + 1) / 5) * 5)
    if (to - from < 10) to = Math.min(max, from + 10)
    if (to - from < 10) from = Math.max(0, to - 10)
  }
  return <MeasureRuler start={start} end={end} from={from} to={to} label={`Regla de ${max} centímetros. El objeto empieza en ${start} y acaba en ${end}`} />
}

function RulerRound({ ex, flow }: { ex: MeasureRulerExercise; flow: AnswerFlow }) {
  const again = useRetryNumber(useContext(RetryContext), ex.answer)
  const [value, setValue] = useState<number | null>(again.first)
  const status = again.marked(value, !!flow.result) ? 'wrong' as const : flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const submit = (v: number | null = value) => { if (v !== null) celebrateIfRight(flow, { type: 'number', value: v }) }
  return (
    <ExerciseLayout
      workClassName={s.view}
      prompt="¿Cuántos centímetros mide?"
      sub={ex.start === 0 ? 'Mira dónde acaba el objeto en la regla.' : `El objeto empieza en ${ex.start}. Mira dónde acaba.`}
      actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />}
    >
      <Ruler max={ex.max} start={ex.start} end={ex.end} />
      <div className={m.row}>
        <span className={r.unit}>En cm:</span>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); if (!flow.submitted) submit(v) }}
          maxDigits={2}
          size="lg"
          status={status}
          ariaLabel="Centímetros"
          placeholder="?"
          autoFocus
        />
      </div>
    </ExerciseLayout>
  )
}

// ---------------------------------------------------------------- add two measures

function AddRound({ ex, flow }: { ex: MeasureAddExercise; flow: AnswerFlow }) {
  const host = useActivityHost()
  const text = useMemo(() => host.t(ex.text), [host, ex.text])
  const again = useRetryNumber(useContext(RetryContext), ex.answer)
  const [value, setValue] = useState<number | null>(again.first)
  const status = again.marked(value, !!flow.result) ? 'wrong' as const : flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const submit = (v: number | null = value) => { if (v !== null) celebrateIfRight(flow, { type: 'number', value: v }) }
  return (
    <ExerciseLayout workClassName={s.view} prompt={text} actions={<AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />}>
      <div className={m.row}>
        <span className={r.unit}>En {ex.unit}:</span>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); if (!flow.submitted) submit(v) }}
          maxDigits={4}
          size="lg"
          status={status}
          ariaLabel={`Total en ${ex.unit}`}
          placeholder="?"
          autoFocus
        />
      </div>
    </ExerciseLayout>
  )
}

// ---------------------------------------------------------------- estimate

function EstimateRound({ ex, flow }: { ex: MeasureEstimateExercise; flow: AnswerFlow }) {
  const again = useRetryChoice<boolean>(useContext(RetryContext), (a) => (a.type === 'verdict' ? a.ok : null), ex.answer)
  const [ok, setOk] = useState<boolean | null>(again.first)
  const locked = !!flow.result?.correct
  return (
    <ExerciseLayout workClassName={s.view} prompt={'¿Es razonable lo que dice?'} actions={<AnswerBar flow={flow} onCheck={() => ok !== null && celebrateIfRight(flow, { type: 'verdict', ok, value: null })} canCheck={ok !== null} />}>
      <div className={m.stage}>
        <span className={r.objectEmoji} aria-hidden>{ex.emoji}</span>
        <span className={r.claim}>{ex.claim}</span>
      </div>
      <div className={m.choices} role="group" aria-label="Respuesta">
        <button type="button" className={clsx(m.choice, ok === true && m.choiceOn, again.marked(true, ok, !!flow.result) && RETRY_WRONG_CLASS)} aria-pressed={ok === true} onClick={() => { if (!locked) setOk(true) }}>
          Sí, es razonable
        </button>
        <button type="button" className={clsx(m.choice, ok === false && m.choiceOn, again.marked(false, ok, !!flow.result) && RETRY_WRONG_CLASS)} aria-pressed={ok === false} onClick={() => { if (!locked) setOk(false) }}>
          No, no es razonable
        </button>
      </div>
    </ExerciseLayout>
  )
}
