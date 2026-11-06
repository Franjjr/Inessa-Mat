/* Inglés de 3.º, unir (eng-match): four English words and four pictures. The child taps a word, then its picture; a tap
   on a paired word or picture takes the pair apart. Answer: marks (the card of each word, in the order of the words). */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import type { EngMatchExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import { PictureFace } from './shared'
import { statusOf, useSayRight } from './sound'
import s from './Ingles.module.css'

const NONE = -1

export default function MatchView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'eng-match') return null
  return <MatchRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function MatchRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: EngMatchExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [marked, setMarked] = useState<number[]>(() => ex.words.map(() => NONE))
  const [selected, setSelected] = useState<number | null>(null)
  const locked = flow.result?.correct === true
  const full = marked.every((c) => c !== NONE)
  // The sentence that says the right pairs: the English word and the picture, pair by pair.
  useSayRight(flow.result, ex.words.join(', '))

  const tapWord = (i: number) => {
    if (locked || flow.submitted) return
    if (marked[i] !== NONE) {
      setMarked(marked.map((c, j) => (j === i ? NONE : c)))
      setSelected(null)
      return
    }
    setSelected(selected === i ? null : i)
  }

  const tapCard = (card: number) => {
    if (locked || flow.submitted || selected === null) return
    // A picture takes one word only: the word that had it lets it go.
    setMarked(marked.map((c, j) => (c === card ? NONE : j === selected ? card : c)))
    setSelected(null)
  }

  const submit = () => {
    if (!full) return
    const c = flow.submit({ type: 'marks', marked })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Unir palabras y dibujos" data-kind={ex.kind} data-status={statusOf(flow.result)}>
      <p className={s.prompt}>Une cada palabra con su dibujo</p>
      <div className={s.matchGrid}>
        <div className={s.matchCol} role="group" aria-label="Palabras">
          {ex.words.map((w, i) => (
            <button
              key={w}
              type="button"
              className={clsx(s.matchWord, selected === i && s.optionOn, marked[i] !== NONE && s.paired)}
              aria-pressed={selected === i}
              onClick={() => tapWord(i)}
            >
              {w}
            </button>
          ))}
        </div>
        <div className={s.matchCol} role="group" aria-label="Dibujos">
          {ex.cards.map((card, c) => {
            const pair = marked.indexOf(c)
            return (
              <button
                key={c}
                type="button"
                className={clsx(s.pictureCard, pair !== NONE && s.paired)}
                onClick={() => (pair !== NONE && selected === null ? tapWord(pair) : tapCard(c))}
                aria-label={`Dibujo ${c + 1}`}
              >
                <PictureFace card={card} />
              </button>
            )
          })}
        </div>
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={full} />
    </section>
  )
}
