/* Labelled text input with hint and error wired up through aria-describedby. */
import clsx from 'clsx'
import type { InputHTMLAttributes } from 'react'
import s from './adult.module.css'

export function TextField({
  id,
  label,
  hint,
  error,
  className,
  ...input
}: { id: string; label: string; hint?: string; error?: string | null } & InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>{label}</label>
      <input
        id={id}
        className={clsx(s.input, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...input}
      />
      {hint && !error && <p id={`${id}-hint`} className={s.hint}>{hint}</p>}
      {error && <p id={`${id}-error`} className={s.error}>{error}</p>}
    </div>
  )
}
