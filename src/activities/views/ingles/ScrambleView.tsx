/* Inglés de 3.º, letras desordenadas (eng-scramble): the picture (or the Spanish word) and the letters of the word in a
   shuffled order. The child taps the letters in order; «⌫ Borrar» takes the last one back. There is no timer. The word
   built is graded as typed text (compareEnglish: capitals do not count, a letter away is «¡Casi!»). */
import { useState } from 'react'
import { celebrate } from '@/fx'
import type { EngScrambleExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import { PictureFace } from './shared'
import { statusOf, useSayRight } from './sound'
import s from './Ingles.module.css'

export default function ScrambleView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'eng-scramble') return null
  return <ScrambleRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function ScrambleRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: EngScrambleExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  /** The tiles tapped so far, as indexes into ex.tiles, in order. */
  const [placed, setPlaced] = useState<number[]>([])
  const locked = flow.result?.correct === true
  const built = placed.map((i) => ex.tiles[i]).join('')
  useSayRight(flow.result, ex.answer)

  const tap = (i: number) => {
    if (locked || placed.includes(i)) return
    setPlaced([...placed, i])
  }
  const back = () => {
    if (locked) return
    setPlaced(placed.slice(0, -1))
  }
  const submit = () => {
    if (!built) return
    const c = flow.submit({ type: 'text', value: built })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Ordenar las letras" data-kind={ex.kind} data-status={statusOf(flow.result)}>
      <p className={s.prompt}>Ordena las letras y escribe la palabra en inglés</p>
      <div className={s.card} aria-label={`Palabra: ${ex.card.es}`}>
        <PictureFace card={ex.card} />
        {ex.card.emoji && ex.card.theme !== 'familia' && <span className={s.gloss}>{ex.card.es}</span>}
      </div>
      <div className={s.built} aria-label="Tu palabra" aria-live="polite">
        {built || <span className={s.builtEmpty} aria-hidden>·····</span>}
      </div>
      <div className={s.tiles} role="group" aria-label="Letras">
        {ex.tiles.map((letter, i) => (
          <button key={i} type="button" className={s.tile} disabled={placed.includes(i) || locked} onClick={() => tap(i)}>
            {letter}
          </button>
        ))}
      </div>
      <div className={s.tileActions}>
        <button type="button" className={s.backspace} onClick={back} disabled={placed.length === 0 || locked}>
          ⌫ Borrar
        </button>
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={built.length > 0} />
    </section>
  )
}
