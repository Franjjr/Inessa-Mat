/* <Keypad> — big friendly on-screen number pad: 0–9, ⌫ and ✓.
   Buttons never steal focus from the cell they type into (mousedown is prevented). */
import clsx from 'clsx'
import type { MouseEvent } from 'react'
import { haptics, sfx } from '@/audio'
import { BackspaceIcon, CheckIcon } from './icons'
import { usePalmGuard } from './usePalmGuard'
import s from './Keypad.module.css'

export interface KeypadProps {
  onDigit: (d: number) => void
  onDelete: () => void
  onSubmit?: () => void
  disabled?: boolean
  /** 'grid' = phone-style 3×4 (default); 'wide' = two rows of 5 for bottom docks / portrait. */
  layout?: 'grid' | 'wide'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Disable only the ✓ button (e.g. nothing written yet). */
  submitDisabled?: boolean
}

const keepFocus = (e: MouseEvent) => e.preventDefault()

export function Keypad({ onDigit, onDelete, onSubmit, disabled, layout = 'grid', size = 'md', className, submitDisabled }: KeypadProps) {
  const palm = usePalmGuard()
  const press = (fn: () => void) => palm.guard(() => {
    if (disabled) return
    haptics.tap()
    sfx.play('tap', { volume: 0.5 })
    fn()
  })
  const digit = (d: number) => (
    <button key={d} type="button" className={s.key} onMouseDown={keepFocus} onPointerDown={palm.onPointerDown} onClick={press(() => onDigit(d))} disabled={disabled} aria-label={String(d)}>
      {d}
    </button>
  )
  const del = (
    <button key="del" type="button" className={clsx(s.key, s.del)} onMouseDown={keepFocus} onPointerDown={palm.onPointerDown} onClick={press(onDelete)} disabled={disabled} aria-label="Borrar">
      <BackspaceIcon size={size === 'lg' ? 36 : 30} />
    </button>
  )
  const ok = onSubmit ? (
    <button key="ok" type="button" className={clsx(s.key, s.ok)} onMouseDown={keepFocus} onPointerDown={palm.onPointerDown} onClick={press(onSubmit)} disabled={disabled || submitDisabled} aria-label="Comprobar">
      <CheckIcon size={size === 'lg' ? 40 : 34} strokeWidth={3.2} />
    </button>
  ) : <span key="ok" aria-hidden className={s.spacer} />

  const keys = layout === 'wide'
    ? [1, 2, 3, 4, 5].map(digit).concat(del, ...[6, 7, 8, 9, 0].map(digit), ok)
    : [1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit).concat(del, digit(0), ok)

  return (
    <div className={clsx(s.pad, s[layout], s[size], className)} role="group" aria-label="Teclado de números" data-ink-keypad="">
      {keys}
    </div>
  )
}
