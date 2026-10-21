/* PUBLIC API of the handwriting/answer-input module (agent: ink).
   UI components live in src/ink/*.tsx; the neural recogniser lives in src/ink/ml (agent: ml).
   Until implemented, these re-export placeholders from ./stubs. */
export {
  InkProvider,        // <InkProvider childId?> wraps the app: loads the recogniser, personal samples, detects input mode
  useInputMode,       // () => { mode: InputMode; setPreferred(pref: AnswerInputPreference): void; isTouchDevice: boolean; penSeen: boolean }
  DigitCell,          // (props: DigitCellProps) one handwritten digit
  NumberInput,        // (props: NumberInputProps) free pad for a whole number
  Keypad,             // ({ onDigit, onDelete, onSubmit, disabled }) on-screen number pad
  CalibrationFlow,    // ({ childId, companionName, onDone }) "enséñale a {pet} tu letra" — collects 0..9 samples
  useRecognizer,      // () => { ready: boolean; recognize: DigitRecognizer['recognize'] }
  TraceDigit,         // ({ digit, onDone }) handwriting practice: trace a digit nicely (for digits often misread)
} from './stubs'
