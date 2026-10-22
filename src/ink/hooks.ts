/* Public hooks of the ink module. */
import { useCallback, useMemo } from 'react'
import type { AnswerInputPreference, DigitRecognizer, InputMode } from '@/types'
import { useInk } from './context'

export interface InputModeState {
  mode: InputMode
  setPreferred(pref: AnswerInputPreference): void
  isTouchDevice: boolean
  penSeen: boolean
  /** The child's stored preference ('auto' unless changed in settings). */
  preference: AnswerInputPreference
  /** Forget that a pen was seen on this device so fingers write again (adult settings). */
  forgetPen(): void
}

/** How the child answers right now: pen / touch / keyboard / keypad (see policy.resolveInputMode). */
export function useInputMode(): InputModeState {
  const c = useInk()
  return useMemo(
    () => ({ mode: c.mode, setPreferred: c.setPreferred, isTouchDevice: c.isTouchDevice, penSeen: c.penSeen, preference: c.preference, forgetPen: c.forgetPen }),
    [c.mode, c.setPreferred, c.isTouchDevice, c.penSeen, c.preference, c.forgetPen],
  )
}

/** Low-level access to the shared digit recogniser. `recognize` is null until the model is ready. */
export function useRecognizer(): { ready: boolean; recognize: DigitRecognizer['recognize'] | null } {
  const { recognizer, ready } = useInk()
  const recognize = useMemo<DigitRecognizer['recognize'] | null>(
    () => (ready && recognizer ? (strokes, zone) => recognizer.recognize(strokes, zone) : null),
    [ready, recognizer],
  )
  return { ready, recognize }
}

export interface InkLearning {
  /** Call after a CORRECT answer: the digits recognised since the last confirm/discard become personal samples. */
  confirm(): void
  /** Call after a wrong answer (or when leaving): forget the pending recognitions. */
  discard(): void
  /** Alternative chips picked since the last confirm/discard (read it before confirm/discard → ExerciseOutcome.recognitionFixes). */
  recognitionFixes(): number
  /** Digits read with low confidence that the child has not confirmed or rewritten yet (0 = answer may be graded). */
  uncertain(): number
  /** The digits still in doubt, in the order they were written. */
  uncertainDigits(): number[]
  /** "Sí, es así": the child confirms the digits in doubt. */
  confirmDoubts(): void
  /** Call before grading: returns true (and shows the "¿Has escrito…?" prompt) when a digit is still in doubt. */
  requestConfirm(): boolean
}

export function useInkLearning(): InkLearning {
  const { learning } = useInk()
  const confirm = useCallback(() => learning.confirm(), [learning])
  const discard = useCallback(() => learning.discard(), [learning])
  const recognitionFixes = useCallback(() => learning.recognitionFixes(), [learning])
  const uncertain = useCallback(() => learning.uncertain(), [learning])
  const uncertainDigits = useCallback(() => learning.uncertainDigits(), [learning])
  const confirmDoubts = useCallback(() => learning.confirmDoubts(), [learning])
  const requestConfirm = useCallback(() => learning.requestConfirm(), [learning])
  return useMemo(
    () => ({ confirm, discard, recognitionFixes, uncertain, uncertainDigits, confirmDoubts, requestConfirm }),
    [confirm, discard, recognitionFixes, uncertain, uncertainDigits, confirmDoubts, requestConfirm],
  )
}
