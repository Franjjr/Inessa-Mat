/* PUBLIC API of the handwriting/answer-input module (agent: ink).
   UI components live in src/ink/*.tsx; the neural recogniser lives in src/ink/ml (agent: ml). */
export { InkProvider } from './InkProvider'                 // <InkProvider childId? recognizer? penSeen?> loads the recogniser + personal samples, detects input mode
export { useInputMode, useRecognizer, useInkLearning } from './hooks'
//   useInputMode()   → { mode, setPreferred(pref), isTouchDevice, penSeen, preference, forgetPen() }
//   useRecognizer()  → { ready, recognize | null }
//   useInkLearning() → { confirm(), discard(), recognitionFixes() } — confirm() after a CORRECT answer
export { DigitCell } from './DigitCell'                     // (props: DigitCellProps & { cellId?, showClear?, className? })
export { NumberInput } from './NumberInput'                 // (props: NumberInputProps & { ariaLabel?, className?, keypadToggle?, keypadPosition?: 'below' | 'right' })
export { Keypad } from './Keypad'                           // ({ onDigit, onDelete, onSubmit?, disabled?, layout?, size? })
export { CellGroup } from './CellGroup'                     // focus order (e.g. units first), auto-advance, Enter, keypad fallback
export { CalibrationFlow } from './CalibrationFlow'         // ({ childId, companionName, onDone }) "Enséñale a {pet} cómo escribes los números" (samples saved for childId)
export { TraceDigit } from './TraceDigit'                   // ({ digit, onDone({ stars, score }) }) trace a digit in school stroke order
export type { InkChangeInfo, InkVia } from './DigitCell'
export type { CellGroupProps } from './CellGroup'
export type { CellOrder } from './order'
export type { KeypadProps } from './Keypad'
export type { InkLearning, InputModeState } from './hooks'
