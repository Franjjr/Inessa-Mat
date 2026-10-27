/* Test double for ExerciseView: two buttons answer correctly or wrongly, so lesson tests can drive try steps.
   A «Pista» button stands in for the real hint button, shown unless the view is told allowHints: false. */
import type { ExerciseViewProps } from '@/types'

export function FakeExerciseView({ onAnswered, allowHints }: ExerciseViewProps) {
  const answer = (correct: boolean) =>
    onAnswered({
      check: { correct, given: correct ? 'ok' : 'no', expected: 'ok', errorType: correct ? undefined : 'fact' },
      ms: 1200,
      inputMode: 'keyboard',
      hintsUsed: 0,
      recognitionFixes: 0,
    })
  return (
    <div data-testid="fake-exercise">
      <button type="button" onClick={() => answer(true)}>Responder bien</button>
      <button type="button" onClick={() => answer(false)}>Responder mal</button>
      {allowHints !== false && <button type="button">Pista</button>}
    </div>
  )
}
