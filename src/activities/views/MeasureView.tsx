/* Medida (measure:*): choose the unit of a real object, convert simple units, read a measure on an on-screen ruler
   (the object does not always start at 0), add two measures in mixed units, and say whether a claimed measure is
   reasonable. Numbers are typed in the same writing pad as the other numeric views. */
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { DIMENSION_NAME, fmt } from '@/engine'
import { useActivityHost } from '@/activities/host'
import { useMediaQuery } from '@/activities/lesson/useLessonMedia'
import type {
  ExerciseViewProps, MeasureAddExercise, MeasureConvertExercise, MeasureEstimateExercise, MeasureRulerExercise, MeasureUnitExercise,
} from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow, type AnswerFlow } from '../groups/flow'
import s from './NumericViews.module.css'
import m from './MoneyViews.module.css'
import r from './MeasureView.module.css'

type MeasureEx = MeasureUnitExercise | MeasureConvertExercise | MeasureRulerExercise | MeasureAddExercise | MeasureEstimateExercise

export default function MeasureView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'measure') return null
  return <MeasureRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function MeasureRound({ ex, onAnswered, showFeedback, allowHints }: { ex: MeasureEx } & Pick<ExerciseViewProps, 'onAnswered' | 'showFeedback' | 'allowHints'>) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback: showFeedback ?? true, allowHints: allowHints ?? true })
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  return (
    <section className={s.view} aria-label="Medida" data-kind="measure" data-mode={ex.mode} data-status={status}>
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
  )
}

const celebrateIfRight = (flow: AnswerFlow, answer: Parameters<AnswerFlow['submit']>[0]) => {
  const c = flow.submit(answer)
  if (c.correct) celebrate('small')
}

// ---------------------------------------------------------------- unit of an object

function UnitRound({ ex, flow }: { ex: MeasureUnitExercise; flow: AnswerFlow }) {
  const [picked, setPicked] = useState<string | null>(null)
  const locked = !!flow.result?.correct
  return (
    <>
      <p className={s.instructions}>¿Qué unidad usarías para medir {DIMENSION_NAME[ex.dimension]} de {ex.object}?</p>
      <div className={m.stage}>
        <span className={r.objectEmoji} aria-hidden>{ex.emoji}</span>
        <span className={r.objectName}>{ex.object}</span>
      </div>
      <div className={m.choices} role="group" aria-label="Medida">
        {ex.options.map((o) => (
          <button
            key={o.unit}
            type="button"
            className={clsx(m.choice, picked === o.unit && m.choiceOn)}
            aria-pressed={picked === o.unit}
            onClick={() => { if (!locked) setPicked(o.unit) }}
          >
            {fmt(o.value)} {o.unit}
          </button>
        ))}
      </div>
      <AnswerBar flow={flow} onCheck={() => picked && celebrateIfRight(flow, { type: 'option', value: picked })} canCheck={picked !== null} />
    </>
  )
}

// ---------------------------------------------------------------- conversion

function ConvertRound({ ex, flow }: { ex: MeasureConvertExercise; flow: AnswerFlow }) {
  const [value, setValue] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const submit = (v: number | null = value) => { if (v !== null) celebrateIfRight(flow, { type: 'number', value: v }) }
  return (
    <>
      <p className={s.instructions}>{ex.toBig ? 'Pasa a la unidad grande.' : 'Pasa a la unidad pequeña.'}</p>
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
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />
    </>
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
  const cm = 24
  const pad = 14
  const width = (to - from) * cm + pad * 2
  const top = 14
  const bodyH = 58
  const x = (v: number) => pad + (v - from) * cm
  return (
    <svg className={r.ruler} viewBox={`0 0 ${width} ${top + bodyH + 46}`} role="img" aria-label={`Regla de ${max} centímetros. El objeto empieza en ${start} y acaba en ${end}`}>
      <rect x={0} y={top} width={width} height={bodyH} rx={10} className={r.rulerBody} />
      {Array.from({ length: to - from + 1 }, (_, k) => {
        const i = from + k
        const len = i % 10 === 0 ? 26 : i % 5 === 0 ? 20 : 12
        return (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1={top + bodyH} y2={top + bodyH - len} className={r.tick} />
            {i % 5 === 0 && (
              <text x={x(i)} y={top + bodyH + 34} textAnchor="middle" className={r.label}>{i}</text>
            )}
          </g>
        )
      })}
      <rect x={x(start)} y={top + 14} width={Math.max(4, (end - start) * cm)} height={bodyH - 28} rx={8} className={r.thing} />
      <line x1={x(start)} x2={x(start)} y1={top - 4} y2={top + bodyH + 2} className={r.startMark} />
    </svg>
  )
}

function RulerRound({ ex, flow }: { ex: MeasureRulerExercise; flow: AnswerFlow }) {
  const [value, setValue] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const submit = (v: number | null = value) => { if (v !== null) celebrateIfRight(flow, { type: 'number', value: v }) }
  return (
    <>
      <p className={s.instructions}>
        {ex.start === 0
          ? 'Mira dónde acaba el objeto en la regla. ¿Cuántos centímetros mide?'
          : `El objeto empieza en ${ex.start}. Mira dónde acaba. ¿Cuántos centímetros mide?`}
      </p>
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
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />
    </>
  )
}

// ---------------------------------------------------------------- add two measures

function AddRound({ ex, flow }: { ex: MeasureAddExercise; flow: AnswerFlow }) {
  const host = useActivityHost()
  const text = useMemo(() => host.t(ex.text), [host, ex.text])
  const [value, setValue] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const submit = (v: number | null = value) => { if (v !== null) celebrateIfRight(flow, { type: 'number', value: v }) }
  return (
    <>
      <p className={m.storyText}>{text}</p>
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
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />
    </>
  )
}

// ---------------------------------------------------------------- estimate

function EstimateRound({ ex, flow }: { ex: MeasureEstimateExercise; flow: AnswerFlow }) {
  const [ok, setOk] = useState<boolean | null>(null)
  const locked = !!flow.result?.correct
  return (
    <>
      <p className={s.instructions}>¿Es razonable lo que dice?</p>
      <div className={m.stage}>
        <span className={r.objectEmoji} aria-hidden>{ex.emoji}</span>
        <span className={r.claim}>{ex.claim}</span>
      </div>
      <div className={m.choices} role="group" aria-label="Respuesta">
        <button type="button" className={clsx(m.choice, ok === true && m.choiceOn)} aria-pressed={ok === true} onClick={() => { if (!locked) setOk(true) }}>
          Sí, es razonable
        </button>
        <button type="button" className={clsx(m.choice, ok === false && m.choiceOn)} aria-pressed={ok === false} onClick={() => { if (!locked) setOk(false) }}>
          No, no es razonable
        </button>
      </div>
      <AnswerBar flow={flow} onCheck={() => ok !== null && celebrateIfRight(flow, { type: 'verdict', ok, value: null })} canCheck={ok !== null} />
    </>
  )
}
