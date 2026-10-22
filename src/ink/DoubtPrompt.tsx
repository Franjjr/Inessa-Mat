/* <DoubtPrompt/> — the gentle "¿Has escrito…?" question shown when the child tries to grade an answer while a digit
   was read with low confidence. Rendered once by <InkProvider>. The child confirms the digits ("Sí, es así") or
   rewrites them; a misread is never counted as a maths error (see LearningStore.requestConfirm). */
import { useSyncExternalStore } from 'react'
import { useInk } from './context'
import s from './DoubtPrompt.module.css'

/** Spanish list of digits: "un 7", "3 y 7", "3, 7 y 1". */
export function digitsList(digits: number[]): string {
  if (digits.length <= 1) return `un ${digits[0] ?? ''}`.trim()
  return `${digits.slice(0, -1).join(', ')} y ${digits[digits.length - 1]}`
}

export function DoubtPrompt() {
  const { learning } = useInk()
  useSyncExternalStore(learning.subscribe, () => learning.version)
  if (!learning.isPromptOpen()) return null
  const digits = learning.uncertainDigits()
  if (digits.length === 0) return null
  const plural = digits.length > 1
  const question = plural
    ? `¿Has escrito ${digitsList(digits)}? Si no, bórralos y escríbelos otra vez`
    : `¿Has escrito ${digitsList(digits)}? Si no, bórralo y escríbelo otra vez`
  return (
    <div className={s.prompt} role="status" aria-live="polite" data-testid="ink-doubt-prompt">
      <p className={s.text}>{question}</p>
      <div className={s.actions}>
        <button type="button" className={s.yes} onClick={() => learning.confirmDoubts()}>
          Sí, es así
        </button>
        <button type="button" className={s.no} onClick={() => learning.dismissPrompt()}>
          La escribo otra vez
        </button>
      </div>
    </div>
  )
}
