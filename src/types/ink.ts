/** A captured point. x/y in CSS px relative to the writing zone's top-left; t in ms (performance.now()). */
export interface InkPoint { x: number; y: number; t: number; p?: number /* pressure 0..1 */ }
export interface InkStroke { points: InkPoint[]; pointerType: 'pen' | 'touch' | 'mouse' }

export interface DigitRecognition {
  /** Most likely digit, or null if the zone is empty / nothing digit-like. */
  digit: number | null
  confidence: number                 // 0..1 for `digit`
  /** Full distribution over 0..9 (after personalisation). */
  probs: number[]
  /** Top alternatives sorted by probability, for "¿Querías escribir…?" chips. */
  alternatives: { digit: number; p: number }[]
  /** Penultimate-layer embedding, used for personalisation samples. */
  embedding: number[]
  /** 28×28 normalised image (0..1), row-major — debugging and sample storage. */
  image28: Float32Array
}

/** Low-level recogniser API (src/ink/ml/recognizer.ts, owned by the ML module). */
export interface DigitRecognizer {
  ready: boolean
  load(): Promise<void>
  /** strokes are in zone pixel coordinates; zoneSize helps normalisation of stroke width. */
  recognize(strokes: InkStroke[], zoneSize: { width: number; height: number }): DigitRecognition
}

/** Props of <DigitCell/> — one handwritten digit (column ops, carries, short answers). */
export interface DigitCellProps {
  value: number | null
  onChange: (digit: number | null, info?: { confidence: number; via: 'pen' | 'touch' | 'keyboard' | 'keypad' }) => void
  /** Visual role: result digit, small carry/borrow box, or a pre-filled given digit (read-only). */
  variant?: 'result' | 'carry' | 'given'
  /** Place-value colour band (u, d, c, um) or none. */
  place?: 'u' | 'd' | 'c' | 'um' | null
  /** Keyboard focus order hint; DigitCellGroup moves focus automatically (units → tens for column ops). */
  autoFocus?: boolean
  disabled?: boolean
  /** Gentle highlight (e.g. wrong column after checking). */
  status?: 'idle' | 'active' | 'correct' | 'wrong' | 'hint'
  ariaLabel?: string
  size?: 'sm' | 'md' | 'lg'
}

/** Props of <NumberInput/> — a free writing pad for a whole number (auto segmentation into digits). */
export interface NumberInputProps {
  value: number | null
  onChange: (value: number | null) => void
  /** Called when the child presses ✓ (or Enter). */
  onSubmit: (value: number | null) => void
  maxDigits?: number           // default 3
  size?: 'md' | 'lg'
  autoFocus?: boolean
  disabled?: boolean
  placeholder?: string
  status?: 'idle' | 'correct' | 'wrong'
}
