/* Inglés de 3.º, juego de memoria (eng-memory): six pairs, a picture and its English word, in a deck of 12 cards. The child
   turns two cards; a pair is kept, a mismatch stays face up until the next tap (no timer) and then turns back. Each turned
   word is said in English. Every card turned is a flip. The game is one attempt, graded when the last pair is found. */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import type { EngMemoryExercise, ExerciseViewProps } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import { PictureFace } from './shared'
import { sayEnglish, statusOf } from './sound'
import s from './Ingles.module.css'

export default function MemoryView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'eng-memory') return null
  return <MemoryRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function MemoryRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: EngMemoryExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  /** Deck positions face up and not yet paired: at most two. A third turn first turns the mismatched two back. */
  const [up, setUp] = useState<number[]>([])
  const [found, setFound] = useState<number[]>([])
  const [flips, setFlips] = useState(0)

  const turn = (i: number) => {
    const slot = ex.deck[i]
    if (flow.submitted || found.includes(slot.pair) || up.includes(i)) return
    const nextFlips = flips + 1
    setFlips(nextFlips)
    if (slot.side === 'word') sayEnglish(ex.pairs[slot.pair].en)
    const open = up.length === 2 ? [i] : [...up, i]
    if (open.length === 2 && ex.deck[open[0]].pair === ex.deck[open[1]].pair) {
      const nextFound = [...found, slot.pair]
      setFound(nextFound)
      setUp([])
      // The last pair ends the game: one attempt, graded now.
      if (nextFound.length === ex.pairs.length) {
        const c = flow.submit({ type: 'memory', flips: nextFlips, found: nextFound.length })
        if (c.correct) celebrate('small')
      }
    } else {
      setUp(open)
    }
  }

  return (
    <section className={s.view} aria-label="Juego de memoria" data-kind={ex.kind} data-status={statusOf(flow.result)}>
      <p className={s.prompt}>Gira las cartas y encuentra las parejas</p>
      <p className={s.count}>Giros: {flips}</p>
      <div className={s.memoryGrid} role="group" aria-label="Cartas">
        {ex.deck.map((slot, i) => {
          const isFound = found.includes(slot.pair)
          const isUp = isFound || up.includes(i)
          const pair = ex.pairs[slot.pair]
          return (
            <button
              key={i}
              type="button"
              className={clsx(s.memoryCard, isUp && s.memoryUp, isFound && s.paired)}
              aria-label={`Carta ${i + 1}`}
              disabled={isFound || flow.submitted}
              onClick={() => turn(i)}
            >
              {!isUp && <span aria-hidden className={s.memoryBack}>?</span>}
              {isUp && (slot.side === 'picture'
                ? <PictureFace card={pair} />
                : <span className={s.memoryWord}>{pair.en}</span>)}
            </button>
          )
        })}
      </div>
      {/* The game submits itself when the last pair is found: the bar has the hint, and the forward button after it. */}
      <AnswerBar flow={flow} onCheck={() => {}} canCheck={false} />
    </section>
  )
}
