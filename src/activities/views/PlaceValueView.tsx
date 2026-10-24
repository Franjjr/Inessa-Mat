/* Numbers up to 9 999, one exercise (place-value): the blocks (millares, centenas, decenas, unidades) → the number,
   the expanded form (4 000 + 300 + 20 + 5) → one box per part, or the number written in words → the digits. */
import { Fragment, useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt, numberWords, placeName } from '@/engine'
import type { ExerciseViewProps, PlaceValueExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './NumericViews.module.css'

export default function PlaceValueView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'place-value') return null
  return (
    <PlaceRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
  )
}

interface RoundProps {
  ex: PlaceValueExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}

function PlaceRound({ ex, onAnswered, showFeedback, allowHints }: RoundProps) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [value, setValue] = useState<number | null>(null)
  const [cells, setCells] = useState<(number | null)[]>(() => ex.parts.map(() => null))
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const top = ex.parts.length - 1
  // Up to 9 999 four boxes; the five-digit numbers (10 000 and over) need five.
  const maxDigits = Math.max(4, ex.parts.length)

  const submitValue = (v: number | null = value) => {
    if (v === null) return
    const c = flow.submit({ type: 'number', value: v })
    if (c.correct) celebrate('small')
  }
  const submitCells = () => {
    if (cells.some((c) => c === null)) return
    const c = flow.submit({ type: 'numbers', values: cells })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label={ex.value >= 10000 ? 'Números de 5 cifras' : 'Números hasta 9 999'} data-kind={ex.kind} data-mode={ex.mode}>
      {ex.mode === 'blocks' && (
        <>
          <p className={s.instructions}>Cuenta los bloques de cada clase y escribe el número.</p>
          <div className={s.blocks} aria-label="Bloques">
            {ex.parts.map((_, i) => (
              <BlockGroup key={i} place={top - i} count={digitOf(ex.value, top - i)} />
            ))}
          </div>
          <div className={s.row}>
            <NumberInput
              value={value}
              onChange={setValue}
              onSubmit={(v) => { setValue(v); if (!flow.submitted) submitValue(v) }}
              maxDigits={maxDigits}
              size="lg"
              status={status}
              ariaLabel="Número de los bloques"
              placeholder="?"
              autoFocus
            />
          </div>
          <AnswerBar flow={flow} onCheck={() => submitValue()} canCheck={value !== null} />
        </>
      )}

      {ex.mode === 'words' && (
        <>
          <p className={s.instructions}>Lee el número y escríbelo con cifras.</p>
          <p className={s.words}>{numberWords(ex.value)}</p>
          <div className={s.row}>
            <NumberInput
              value={value}
              onChange={setValue}
              onSubmit={(v) => { setValue(v); if (!flow.submitted) submitValue(v) }}
              maxDigits={maxDigits}
              size="lg"
              status={status}
              ariaLabel="Número en cifras"
              placeholder="?"
              autoFocus
            />
          </div>
          <AnswerBar flow={flow} onCheck={() => submitValue()} canCheck={value !== null} />
        </>
      )}

      {ex.mode === 'expanded' && (
        <>
          <p className={s.instructions}>Escribe cuánto vale cada cifra. Si una cifra es 0, escribe 0.</p>
          <p className={s.prompt}>{fmt(ex.value)}</p>
          <div className={s.row} role="group" aria-label="Descomposición">
            {ex.parts.map((_, i) => (
              <Fragment key={i}>
                {i > 0 && <span className={s.sign} aria-hidden>+</span>}
                <span className={s.cell}>
                  <span className={s.cellLabel}>{placeName(top - i)}</span>
                  <NumberInput
                    value={cells[i]}
                    onChange={(v) => setCells((prev) => prev.map((c, k) => (k === i ? v : c)))}
                    onSubmit={() => submitCells()}
                    maxDigits={maxDigits}
                    size="lg"
                    status={status}
                    ariaLabel={`Valor de ${placeName(top - i) === 'millares' ? 'los' : 'las'} ${placeName(top - i)}`}
                    checkButton={false}
                    placeholder="?"
                    autoFocus={i === 0}
                  />
                </span>
              </Fragment>
            ))}
          </div>
          <AnswerBar flow={flow} onCheck={submitCells} canCheck={cells.every((c) => c !== null)} />
        </>
      )}
    </section>
  )
}

/** The digit of `n` at place `place` (0 = units). */
function digitOf(n: number, place: number): number {
  return Math.floor(n / 10 ** place) % 10
}

/** One class of blocks: as many tiles as the digit says (a 0 shows no tile). */
function BlockGroup({ place, count }: { place: number; count: number }) {
  if (place === 4) return <TenThousandGroup count={count} />
  const label = place === 3 ? 'Millares' : place === 2 ? 'Centenas' : place === 1 ? 'Decenas' : 'Unidades'
  const tile = place === 3 ? s.mil : place === 2 ? s.cent : place === 1 ? s.dec : s.uni
  return (
    <div className={s.group} title={`${count} ${label.toLowerCase()}`}>
      <div className={s.tiles}>
        {Array.from({ length: count }, (_, k) => <span key={k} className={tile} aria-hidden />)}
      </div>
      <span className={s.groupLabel}>{label}</span>
    </div>
  )
}

/** The decenas de millar: each one is a pile of ten blocks of mil, so the child counts piles, then the tiles of a pile. */
function TenThousandGroup({ count }: { count: number }) {
  return (
    <div className={s.group} title={`${count} decenas de millar`}>
      <div className={s.tiles}>
        {Array.from({ length: count }, (_, k) => (
          <span key={k} className={s.pile} aria-hidden>
            {Array.from({ length: 10 }, (_, j) => <span key={j} className={s.milSlice} />)}
          </span>
        ))}
      </div>
      <span className={s.groupLabel}>Decenas de millar</span>
    </div>
  )
}
