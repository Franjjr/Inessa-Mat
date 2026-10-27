/* <TextInput> — the box for a typed answer (a word or a short phrase). The text shows with a caret. Two ways in:
   the on-screen <LetterKeyboard> (shown under the box the child uses, one per screen, via activePad) and a physical
   keyboard (letters and the accents the system composes, space, Backspace, Enter). */
import clsx from 'clsx'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { focusPad, useIsActivePad } from './activePad'
import { LetterKeyboard } from './LetterKeyboard'
import s from './TextInput.module.css'

export interface TextInputProps {
  value: string
  onChange: (value: string) => void
  /** Enter or ✓. Not called while the box is empty. */
  onSubmit?: () => void
  /** Longest answer, in characters (no limit when not given). */
  maxLength?: number
  ariaLabel?: string
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  className?: string
}

const isCharacter = (key: string) => [...key].length === 1

export function TextInput({ value, onChange, onSubmit, maxLength, ariaLabel, placeholder, autoFocus, disabled, className }: TextInputProps) {
  const uid = useId()
  const boxRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const keyboardHere = useIsActivePad(uid)
  useEffect(() => {
    if (autoFocus && !disabled) boxRef.current?.focus({ preventScroll: true })
  }, [])

  const add = (text: string) => {
    if (disabled) return
    if (maxLength != null && [...value].length + [...text].length > maxLength) return
    onChange(value + text)
  }
  const del = () => {
    if (disabled || !value) return
    onChange([...value].slice(0, -1).join(''))
  }
  const submit = () => {
    if (disabled || !value.trim()) return
    onSubmit?.()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || e.metaKey || e.ctrlKey) return
    if (e.key === 'Enter') { e.preventDefault(); submit(); return }
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); del(); return }
    if (isCharacter(e.key)) { e.preventDefault(); add(e.key) }
  }

  return (
    <div className={clsx(s.root, disabled && s.disabled, className)}>
      <div
        ref={boxRef}
        className={clsx(s.box, focused && s.focused)}
        role="textbox"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel ?? 'Escribe tu respuesta'}
        aria-disabled={disabled || undefined}
        aria-multiline={false}
        onFocus={() => { setFocused(true); focusPad(uid) }}
        onBlur={() => setFocused(false)}
        // Pressing the box takes the keyboard here (the focus is moved by hand: the pad never focuses by itself).
        onPointerDown={() => { if (!disabled) { focusPad(uid); boxRef.current?.focus({ preventScroll: true }) } }}
        onKeyDown={onKeyDown}
      >
        {value
          ? <span className={s.text}>{value}</span>
          : <span className={s.placeholder} aria-hidden>{placeholder ?? 'Escribe aquí'}</span>}
        {focused && !disabled && <span className={s.caret} aria-hidden />}
      </div>
      {keyboardHere && (
        <LetterKeyboard
          onKey={add}
          onDelete={del}
          onSubmit={onSubmit ? submit : undefined}
          disabled={disabled}
          submitDisabled={!value.trim()}
        />
      )}
    </div>
  )
}
