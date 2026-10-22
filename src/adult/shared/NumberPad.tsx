/* Large on-screen number pad for PINs and quick maths answers. Every key is at least 64px tall. */
import s from './NumberPad.module.css'

export function PinDots({ length, filled, label }: { length: number; filled: number; label: string }) {
  const count = Math.max(length, filled)
  return (
    <div className={s.dots} role="img" aria-label={`${label}: ${filled} de ${length} números`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={i < filled ? s.dotOn : s.dot} aria-hidden />
      ))}
    </div>
  )
}

export function NumberPad({
  onDigit,
  onBackspace,
  onSubmit,
  submitLabel = 'Entrar',
  submitDisabled,
  disabled,
}: {
  onDigit: (digit: string) => void
  onBackspace: () => void
  onSubmit: () => void
  submitLabel?: string
  submitDisabled?: boolean
  disabled?: boolean
}) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  return (
    <div className={s.pad} role="group" aria-label="Teclado numérico">
      {digits.map((d) => (
        <button key={d} type="button" className={s.key} onClick={() => onDigit(d)} disabled={disabled}>
          {d}
        </button>
      ))}
      <button type="button" className={s.keyMuted} onClick={onBackspace} disabled={disabled} aria-label="Borrar el último número">
        ⌫
      </button>
      <button type="button" className={s.key} onClick={() => onDigit('0')} disabled={disabled}>
        0
      </button>
      <button
        type="button"
        className={s.keyGo}
        onClick={onSubmit}
        disabled={disabled || submitDisabled}
      >
        {submitLabel}
      </button>
    </div>
  )
}
