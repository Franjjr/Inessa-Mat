/* Shared UI kit — owned by the integrator. Use these instead of re-styling buttons/cards/modals per module. */
import clsx from 'clsx'
import { useEffect, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
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

/** Top bar with an optional back button. back=true → navigate(-1); back='/path' → navigate there. */
export function TopBar({ title, back, left, right }: { title?: ReactNode; back?: boolean | string; left?: ReactNode; right?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <header className={s.topbar}>
      <div className={s.topbarSide}>
        {back && (
          <Button variant="secondary" round aria-label="Volver" onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}>
            <span aria-hidden style={{ fontSize: 28, lineHeight: 1 }}>‹</span>
          </Button>
        )}
        {left}
      </div>
      <div className={s.topbarTitle}>{title}</div>
      <div className={s.topbarSide}>{right}</div>
    </header>
  )
}

export function Modal({ open, onClose, title, children, dismissable = true }: { open: boolean; onClose?: () => void; title?: ReactNode; children: ReactNode; dismissable?: boolean }) {
  if (!open) return null
  return createPortal(
    <div className={s.backdrop} onClick={() => dismissable && onClose?.()} role="presentation">
      <div className={s.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
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

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className={s.center} role="status">
      <div className={s.spinner} />
      <span className="visually-hidden">{label}</span>
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
