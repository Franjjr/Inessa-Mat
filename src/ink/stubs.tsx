/* TEMPORARY placeholders so the app compiles. The ink agent replaces the exports in ./index.ts with real
   implementations and deletes this file. Signatures here are the contract. */
import type { ReactNode } from 'react'
import type { AnswerInputPreference, DigitCellProps, DigitRecognizer, InputMode, NumberInputProps } from '@/types'

export function InkProvider({ children }: { children: ReactNode; childId?: string | null }) {
  return <>{children}</>
}

export function useInputMode(): { mode: InputMode; setPreferred: (pref: AnswerInputPreference) => void; isTouchDevice: boolean; penSeen: boolean } {
  return { mode: 'keyboard', setPreferred: () => {}, isTouchDevice: false, penSeen: false }
}

export function DigitCell({ value, onChange, ariaLabel }: DigitCellProps) {
  return (
    <input
      aria-label={ariaLabel ?? 'cifra'}
      inputMode="numeric"
      maxLength={1}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value.slice(-1)), { confidence: 1, via: 'keyboard' })}
      style={{ width: 64, height: 72, fontSize: 36, textAlign: 'center', borderRadius: 12, border: '2px solid var(--c-line)' }}
    />
  )
}

export function NumberInput({ value, onChange, onSubmit }: NumberInputProps) {
  return (
    <input
      inputMode="numeric"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      onKeyDown={(e) => e.key === 'Enter' && onSubmit(value)}
      style={{ width: 160, height: 80, fontSize: 40, textAlign: 'center', borderRadius: 16, border: '2px solid var(--c-line)' }}
    />
  )
}

export function Keypad(_props: { onDigit: (d: number) => void; onDelete: () => void; onSubmit?: () => void; disabled?: boolean }) {
  return null
}

export function CalibrationFlow({ onDone }: { childId: string; companionName: string; onDone: () => void }) {
  return <button onClick={onDone}>Calibración (pendiente)</button>
}

export function useRecognizer(): { ready: boolean; recognize: DigitRecognizer['recognize'] | null } {
  return { ready: false, recognize: null }
}

export function TraceDigit({ onDone }: { digit: number; onDone: () => void }) {
  return <button onClick={onDone}>Trazar (pendiente)</button>
}
