/* Shared UI kit — owned by the integrator. Use these instead of re-styling buttons/cards/modals per module. */
import clsx from 'clsx'
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import s from './ui.module.css'

export type ButtonVariant = 'primary' | 'magic' | 'success' | 'gold' | 'secondary' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  round?: boolean
  icon?: ReactNode
}

export function Button({ variant = 'primary', size = 'md', block, round, icon, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(s.btn, s[variant], size !== 'md' && s[size], block && s.block, round && s.round, className)}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

export function Card({ children, className, tint, style }: { children: ReactNode; className?: string; tint?: string; style?: CSSProperties }) {
  return (
    <div className={clsx(s.card, tint && s.cardTinted, className)} style={tint ? { ...style, ['--card-tint' as string]: tint } : style}>
      {children}
    </div>
  )
}

/** Full-viewport screen wrapper. `background` accepts any CSS background. */
export function Screen({ children, className, background, style }: { children: ReactNode; className?: string; background?: string; style?: CSSProperties }) {
  return (
    <main className={clsx(s.screen, className)} style={{ background, ...style }}>
      {children}
    </main>
  )
}

/**
 * The one way to go back or leave in the app. Always a labelled pill (≥ 56 px), never a bare icon.
 * variant "back": chevron + «Volver», for navigation between screens.
 * variant "exit": ✕ + «Salir», for leaving an activity or an area.
 * Navigation is the caller's job: pass `onClick` (e.g. `() => navigate('/play')`). Use `aria-label` only
 * when the name needs more words, and keep the visible label inside it.
 */
export interface BackButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: 'back' | 'exit'
  /** Visible text. Defaults to «Volver» or «Salir». */
  label?: string
}

export function BackButton({ variant = 'back', label, className, ...rest }: BackButtonProps) {
  const text = label ?? (variant === 'exit' ? 'Salir' : 'Volver')
  return (
    <button type="button" className={clsx(s.backBtn, variant === 'exit' && s.backExit, className)} {...rest}>
      <span aria-hidden className={s.backIcon}>{variant === 'exit' ? '✕' : '‹'}</span>
      <span>{text}</span>
    </button>
  )
}

/** Top bar with an optional back button. back=true → back one screen; back='/path' → navigate there. */
export function TopBar({ title, back, left, right }: { title?: ReactNode; back?: boolean | string; left?: ReactNode; right?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <header className={s.topbar}>
      <div className={s.topbarSide}>
        {back && <BackButton onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))} />}
        {left}
      </div>
      <div className={s.topbarTitle}>{title}</div>
      <div className={s.topbarSide}>{right}</div>
    </header>
  )
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, title, children, dismissable = true }: { open: boolean; onClose?: () => void; title?: ReactNode; children: ReactNode; dismissable?: boolean }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  // Focus moves into the dialog, Tab stays inside it, Escape closes it, and focus returns to the opener on close.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const focusables = () => Array.from(dialog?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    ;(focusables()[0] ?? dialog)?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) {
        e.preventDefault()
        closeRef.current?.()
        return
      }
      if (e.key !== 'Tab' || !dialog) return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        dialog.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !dialog.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (opener?.isConnected) opener.focus()
    }
  }, [open, dismissable])

  if (!open) return null
  return createPortal(
    <div className={s.backdrop} onClick={() => dismissable && onClose?.()} role="presentation">
      <div ref={dialogRef} className={s.modal} role="dialog" aria-modal="true" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        {title && <h2 className={s.modalTitle}>{title}</h2>}
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Pill({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span className={s.pill} style={style}>{children}</span>
}

/** Loading state. The label is visible (children are not expected to read a bare spinner) and announced once. */
export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className={s.center} role="status" aria-live="polite">
      <div className={s.spinner} aria-hidden />
      <span className={s.spinnerLabel}>{label}</span>
    </div>
  )
}

/** Shown by placeholder files until a module agent implements the real screen. */
export function Placeholder({ name }: { name: string }) {
  return <div className={s.placeholder}>🚧 {name}</div>
}

// ---- Toasts -------------------------------------------------------------------------------------
type ToastListener = (msg: string | null) => void
let toastListener: ToastListener | null = null
let toastTimer: ReturnType<typeof setTimeout> | undefined

/** Show a short message at the bottom of the screen. */
export function toast(message: string, ms = 2600) {
  toastListener?.(message)
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toastListener?.(null), ms)
}

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    toastListener = setMsg
    return () => { toastListener = null }
  }, [])
  if (!msg) return null
  return createPortal(
    <div className={s.toastWrap} aria-live="polite"><div className={s.toast}>{msg}</div></div>,
    document.body,
  )
}
