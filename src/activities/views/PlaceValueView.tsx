/* Numbers up to 9 999, one exercise (place-value): the blocks (millares, centenas, decenas, unidades) → the number,
   the expanded form (4 000 + 300 + 20 + 5) → one box per part, or the number written in words → the digits.
   Expanded form (p1n-03/04): the box of a 0 digit may stay empty (it shows a grey 0 and counts as 0), each box says
   «valor de las centenas»…, and with the visual support (guided) a worked example sits on top. Each box is as wide
   as its part (the units one digit, the millares four), so five boxes fit on a tablet without one per line.
   Blocks (P6-14): the base-ten pieces of the classroom: millar a big cube, centena a 10 × 10 plate, decena a bar of
   ten, unidad a little cube. */
import { Fragment, useState } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { fmt, numberWords, placeName } from '@/engine'
import type { ExerciseViewProps, PlaceValueExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './NumericViews.module.css'
import { ExerciseLayout } from './ExerciseLayout'

export default function PlaceValueView({ exercise, onAnswered, showFeedback = true, allowHints = true, guided }: ExerciseViewProps) {
  if (exercise.kind !== 'place-value') return null
  return (
    <PlaceRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} guided={!!guided} />
  )
}

/** The worked example shown above the expanded form, with as many digits as the exercise and a 0 in it. */
export function expandedExample(digits: number): string {
  const n = digits >= 5 ? 12045 : digits === 4 ? 2405 : 305
  const parts = String(n).split('').map((d, i, all) => Number(d) * 10 ** (all.length - 1 - i))
  return `${fmt(n)} = ${parts.map((p) => fmt(p)).join(' + ')}`
}

/** «valor de las centenas», «valor de los millares»… */
const valueLabel = (place: string) => `valor de ${place === 'millares' ? 'los' : 'las'} ${place}`

interface RoundProps {
  ex: PlaceValueExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
  guided: boolean
}

function PlaceRound({ ex, onAnswered, showFeedback, allowHints, guided }: RoundProps) {
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
  // The box of a 0 digit may stay empty: it counts as 0 (the child does not have to write «0» to be right).
  const zeroAt = (i: number) => digitOf(ex.value, top - i) === 0
  const cellsReady = cells.every((c, i) => c !== null || zeroAt(i))
  const submitCells = () => {
    if (!cellsReady) return
    const c = flow.submit({ type: 'numbers', values: cells.map((v, i) => (v === null && zeroAt(i) ? 0 : v)) })
    if (c.correct) celebrate('small')
  }

  return (
    <section className="ex-shell" aria-label={ex.value >= 10000 ? 'Números de 5 cifras' : 'Números hasta 9 999'} data-kind={ex.kind} data-mode={ex.mode}>
      {ex.mode === 'blocks' && (
        <ExerciseLayout workClassName={s.view} prompt={'Cuenta los bloques de cada clase y escribe el número.'} actions={<AnswerBar flow={flow} onCheck={() => submitValue()} canCheck={value !== null} />}>
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
        </ExerciseLayout>
      )}

      {ex.mode === 'words' && (
        <ExerciseLayout workClassName={s.view} prompt={'Lee el número y escríbelo con cifras.'} actions={<AnswerBar flow={flow} onCheck={() => submitValue()} canCheck={value !== null} />}>
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
        </ExerciseLayout>
      )}

      {ex.mode === 'expanded' && (
        <ExerciseLayout
          workClassName={s.view}
          prompt="Escribe cuánto vale cada cifra."
          sub="Si la cifra es 0, su casilla puede quedar vacía."
          actions={<AnswerBar flow={flow} onCheck={submitCells} canCheck={cellsReady} />}
        >
          {guided && (
            <p className={s.example}>
              <span className={s.exampleLabel}>Ejemplo:</span> {expandedExample(ex.parts.length)}
            </p>
          )}
          <p className={s.prompt}>{fmt(ex.value)}</p>
          <div className={s.row} role="group" aria-label="Descomposición">
            {ex.parts.map((_, i) => (
              <Fragment key={i}>
                {i > 0 && <span className={s.sign} aria-hidden>+</span>}
                <span className={s.cell}>
                  <span className={s.cellLabel}>{valueLabel(placeName(top - i))}</span>
                  <NumberInput
                    value={cells[i]}
                    onChange={(v) => setCells((prev) => prev.map((c, k) => (k === i ? v : c)))}
                    onSubmit={() => submitCells()}
                    maxDigits={top - i + 1}
                    size="lg"
                    status={status}
                    ariaLabel={`Valor de ${placeName(top - i) === 'millares' ? 'los' : 'las'} ${placeName(top - i)}`}
                    checkButton={false}
                    placeholder={zeroAt(i) ? '0' : '?'}
                    autoFocus={i === 0}
                  />
                </span>
              </Fragment>
            ))}
          </div>
        </ExerciseLayout>
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
  const label = place === 3 ? 'Millares (cubos)' : place === 2 ? 'Centenas (placas)' : place === 1 ? 'Decenas (barras)' : 'Unidades (cubitos)'
  const tile = place === 3 ? s.mil : place === 2 ? s.cent : place === 1 ? s.dec : s.uni
  return (
    <div className={s.group} title={`${count} ${label.split(' ')[0].toLowerCase()}`}>
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
    <div className={s.group} title={count === 1 ? 'una decena de millar' : `${count} decenas de millar`}>
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
