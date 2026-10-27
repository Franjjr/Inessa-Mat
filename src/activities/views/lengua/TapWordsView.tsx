/* Lengua de 3.º, tocar palabras: the words of a class in a sentence (lng-tap-words: sustantivos, adjetivos, verbos,
   artículos) and the subject or the predicate (lng-sentence-parts). Every word is a button; the sentence is not typed.
   The answer is every word tapped; the check runs with «Comprobar» (or «Revisar» after a wrong try). */
import clsx from 'clsx'
import { useState } from 'react'
import { celebrate } from '@/fx'
import { grammarPrompt } from '@/engine'
import type { ExerciseViewProps, LngSentencePartsExercise, LngTapWordsExercise } from '@/types'
import { AnswerBar } from '../../groups/AnswerBar'
import { useAnswerFlow } from '../../groups/flow'
import s from './Lengua.module.css'

export default function TapWordsView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'lng-tap-words' && exercise.kind !== 'lng-sentence-parts') return null
  return <TapRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function TapRound({ ex, onAnswered, showFeedback, allowHints }: {
  ex: LngTapWordsExercise | LngSentencePartsExercise
  onAnswered: ExerciseViewProps['onAnswered']
  showFeedback: boolean
  allowHints: boolean
}) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const [marked, setMarked] = useState<number[]>([])
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'

  const toggle = (i: number) => {
    if (flow.result?.correct) return
    setMarked((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i].sort((a, b) => a - b)))
  }
  const submit = () => {
    const c = flow.submit({ type: 'marks', marked })
    if (c.correct) celebrate('small')
  }

  return (
    <section className={s.view} aria-label="Gramática" data-kind={ex.kind} data-status={status}>
      <p className={s.prompt}>{grammarPrompt(ex)}</p>
      <div className={s.sentence} role="group" aria-label="Frase">
        {ex.words.map((w, i) => (
          <button
            key={i}
            type="button"
            className={clsx(s.word, marked.includes(i) && s.wordOn)}
            aria-pressed={marked.includes(i)}
            onClick={() => toggle(i)}
          >
            {w}
          </button>
        ))}
        <span className={s.stop} aria-hidden>.</span>
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={marked.length > 0} />
    </section>
  )
}
