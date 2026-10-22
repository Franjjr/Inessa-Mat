/* A labelled on/off switch with a hint. The switch is a real button with role="switch". */
import { useId } from 'react'
import adult from '../shared/adult.module.css'

export function SwitchRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  const id = useId()
  return (
    <div className={adult.switchRow}>
      <div className={adult.stack} style={{ gap: 2, minWidth: 0 }}>
        <span id={`${id}-label`} className={adult.label}>{label}</span>
        {hint && <span id={`${id}-hint`} className={adult.hint}>{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        className={adult.switch}
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      />
    </div>
  )
}
