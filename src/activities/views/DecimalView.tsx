/* Décimas y centésimas (4.º, decimal): colour a bar of 10 or a grid of 100 and write its number, read the words and write
   the number, compare two decimals with < = >, and write euros and céntimos as a decimal (2,45 € → 2 euros y 45 céntimos).
   A number is written in two boxes, the whole part and the decimal part, with the comma fixed between them. In centésimas
   the decimal box holds up to two digits that fill from the left: a single 5 is 0,50 (see decimalFromBoxes). */
import clsx from 'clsx'
import { useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { decimalWords, fmtDecimal } from '@/engine'
import type { DecimalExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow, type AnswerFlow } from '../groups/flow'
import s from './NumericViews.module.css'
import m from './MoneyViews.module.css'
import d from './DecimalViews.module.css'

type Sign = '<' | '>' | '='

const SIGNS: { sign: Sign; label: string }[] = [
  { sign: '<', label: 'menor que' },
  { sign: '=', label: 'igual a' },
  { sign: '>', label: 'mayor que' },
]

export default function DecimalView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'decimal') return null
  return <DecimalRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function DecimalRound({ ex, onAnswered, showFeedback, allowHints }: { ex: DecimalExercise } & Pick<ExerciseViewProps, 'onAnswered' | 'showFeedback' | 'allowHints'>) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback: showFeedback ?? true, allowHints: allowHints ?? true })
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  return (
    <section className={s.view} aria-label="Décimas y centésimas" data-kind={ex.kind} data-mode={ex.mode} data-status={status}>
      {ex.mode === 'compare' ? <Compare ex={ex} flow={flow} /> : <WriteNumber ex={ex} flow={flow} status={status} />}
    </section>
  )
}

// ---------------------------------------------------------------- shade, read, money: write the number

const INSTRUCTION: Record<'shade' | 'read' | 'money', string> = {
  shade: '¿Qué número está coloreado? Escríbelo con coma.',
  read: 'Escribe el número con cifras, con su coma.',
  money: 'Un euro son cien céntimos. ¿Cuántos euros y cuántos céntimos son?',
}

function WriteNumber({ ex, flow, status }: { ex: DecimalExercise; flow: AnswerFlow; status: 'idle' | 'correct' | 'wrong' }) {
  const [whole, setWhole] = useState<number | null>(null)
  const [dec, setDec] = useState<number | null>(null)
  const money = ex.mode === 'money'
  const check = (w: number | null, x: number | null) => {
    if (w === null || x === null) return
    const c = flow.submit({ type: 'numbers', values: [w, x] })
    if (c.correct) celebrate('small')
  }
  const wholeLabel = money ? 'Euros' : 'Parte entera'
  const decLabel = money ? 'Céntimos' : ex.places === 1 ? 'Décimas' : 'Décimas y centésimas'
  return (
    <>
      <p className={s.instructions}>{INSTRUCTION[ex.mode as 'shade' | 'read' | 'money']}</p>
      {ex.mode === 'shade' && <Shade ex={ex} />}
      {ex.mode === 'read' && <p className={d.words}>{decimalWords(ex)}</p>}
      {money && (
        <div className={m.stage}>
          <span className={m.bigAmount}>{fmtDecimal(ex.value, 2)} €</span>
        </div>
      )}
      <div className={m.amountWrap}>
        <div className={m.amountRow} role="group" aria-label={money ? 'Euros y céntimos' : 'Número con coma'}>
          <div className={m.amountLead}>
            <div className={m.amountCol}>
              <NumberInput
                value={whole}
                onChange={setWhole}
                onSubmit={(v) => { setWhole(v); if (!flow.submitted) check(v, dec) }}
                maxDigits={2}
                size="lg"
                status={status}
                ariaLabel={wholeLabel}
                checkButton={false}
                placeholder={money ? '€' : '0'}
                autoFocus
              />
              {money && <span className={m.unit}>euros</span>}
            </div>
            <span className={m.comma} aria-hidden>,</span>
          </div>
          <div className={m.amountCol}>
            <NumberInput
              value={dec}
              onChange={setDec}
              onSubmit={(v) => { setDec(v); if (!flow.submitted) check(whole, v) }}
              maxDigits={money || ex.places === 2 ? 2 : 1}
              size="lg"
              status={status}
              ariaLabel={decLabel}
              checkButton={false}
              placeholder="00"
            />
            {money && <span className={m.unit}>céntimos</span>}
          </div>
        </div>
      </div>
      <AnswerBar flow={flow} onCheck={() => check(whole, dec)} canCheck={whole !== null && dec !== null} />
    </>
  )
}

/** The drawing of the number: a bar of 10 parts for décimas, a grid of 100 for centésimas, with the parts coloured.
    The drawing is labelled without the count, so it does not give the answer away. */
function Shade({ ex }: { ex: DecimalExercise }) {
  const cells = ex.places === 1 ? 10 : 100
  const coloured = ex.places === 1 ? ex.value / 10 : ex.value
  return (
    <div
      className={clsx(d.grid, ex.places === 1 && d.bar)}
      style={{ ['--cols' as string]: 10 }}
      role="img"
      aria-label={ex.places === 1 ? 'Barra dividida en diez partes iguales' : 'Cuadrícula dividida en cien partes iguales'}
    >
      {Array.from({ length: cells }, (_, i) => (
        <span key={i} className={clsx(d.cell, i < coloured && d.cellOn)} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- compare: two decimals and a sign

function Compare({ ex, flow }: { ex: DecimalExercise; flow: AnswerFlow }) {
  const [picked, setPicked] = useState<Sign | null>(null)
  const submit = () => {
    if (!picked) return
    const c = flow.submit({ type: 'sign', sign: picked })
    if (c.correct) celebrate('small')
  }
  return (
    <>
      <p className={s.instructions}>¿Qué signo va entre los dos números?</p>
      <div className={s.row}>
        <span className={s.card}><span className={s.cardNumber}>{fmtDecimal(ex.value, ex.places)}</span></span>
        <span className={s.sign} aria-hidden>{picked ?? '?'}</span>
        <span className={s.card}><span className={s.cardNumber}>{fmtDecimal(ex.other ?? 0, ex.places)}</span></span>
      </div>
      <div className={s.signPad} role="group" aria-label="Signo">
        {SIGNS.map((o) => (
          <button
            key={o.sign}
            type="button"
            className={clsx(s.signBtn, picked === o.sign && s.signOn)}
            onClick={() => { if (!flow.result?.correct) setPicked(o.sign) }}
            aria-pressed={picked === o.sign}
            aria-label={o.label}
          >
            {o.sign}
          </button>
        ))}
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={picked !== null} />
    </>
  )
}
