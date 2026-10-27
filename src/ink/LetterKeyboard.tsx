/* <LetterKeyboard> — the on-screen Spanish (QWERTY) letter keyboard for typed answers: letters, ñ, ⇧ for one capital,
   ´ (the next vowel gets an accent), ¨ (ü), a symbol row (¿ ? ¡ ! , .), space, ⌫ and ✓.
   Stateless about the answer: it only remembers which modifier is armed (⇧, ´, ¨, symbols) and emits finished characters.
   Buttons never steal focus from the box they type into (mousedown is prevented). */
import clsx from 'clsx'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { haptics, sfx } from '@/audio'
import { BackspaceIcon, CheckIcon } from './icons'
import { usePalmGuard } from './usePalmGuard'
import s from './LetterKeyboard.module.css'

export interface LetterKeyboardProps {
  /** A finished character: 'a', 'Á', 'ñ', 'ú', '¿', ' '. */
  onKey: (ch: string) => void
  onDelete: () => void
  onSubmit?: () => void
  disabled?: boolean
  /** Disable only the ✓ (nothing written yet). */
  submitDisabled?: boolean
  className?: string
}

type Accent = 'acute' | 'diaeresis' | null

const ROW1 = 'qwertyuiop'.split('')
const ROW2 = 'asdfghjklñ'.split('')
const ROW3 = 'zxcvbnm'.split('')
const SYMBOLS = ['¿', '?', '¡', '!', ',', '.']
const ACUTE: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' }

const keepFocus = (e: MouseEvent) => e.preventDefault()

/** The letter the child gets: capitalised when ⇧ is armed, with the accent armed on it when it applies. */
function composeLetter(base: string, accent: Accent): string {
  if (accent === 'acute' && ACUTE[base]) return ACUTE[base]
  if (accent === 'diaeresis' && (base === 'u' || base === 'U')) return base === 'u' ? 'ü' : 'Ü'
  return base
}

export function LetterKeyboard({ onKey, onDelete, onSubmit, disabled, submitDisabled, className }: LetterKeyboardProps) {
  const [shift, setShift] = useState(false)
  const [accent, setAccent] = useState<Accent>(null)
  const [symbols, setSymbols] = useState(false)
  // Like Keypad: bring the keyboard up only when it is wholly below the bottom edge of a short screen.
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el && el.getBoundingClientRect().top >= window.innerHeight) el.scrollIntoView?.({ block: 'nearest' })
  }, [])
  const palm = usePalmGuard()
  const press = (fn: () => void) => palm.guard(() => {
    if (disabled) return
    haptics.tap()
    sfx.play('tap', { volume: 0.5 })
    fn()
  })

  const letter = (ch: string) => {
    const out = composeLetter(shift ? ch.toUpperCase() : ch, accent)
    setShift(false)
    setAccent(null)
    onKey(out)
  }
  /** A symbol or the space disarms the accent and the one-capital ⇧ (only a letter uses them). */
  const other = (ch: string) => {
    setAccent(null)
    setShift(false)
    onKey(ch)
  }

  const btn = (label: string, aria: string, onPress: () => void, cls?: string, pressed?: boolean) => (
    <button
      key={`${aria}-${label}`}
      type="button"
      className={clsx(s.key, cls, pressed && s.armed)}
      onMouseDown={keepFocus}
      onPointerDown={palm.onPointerDown}
      onClick={press(onPress)}
      disabled={disabled}
      aria-label={aria}
      aria-pressed={pressed === undefined ? undefined : pressed}
    >
      {label}
    </button>
  )
  const letterKey = (ch: string) => {
    const shown = shift ? ch.toUpperCase() : ch
    return btn(shown, shown, () => letter(ch))
  }
  const del = (
    <button key="del" type="button" className={clsx(s.key, s.fn)} onMouseDown={keepFocus} onPointerDown={palm.onPointerDown} onClick={press(() => { setAccent(null); onDelete() })} disabled={disabled} aria-label="Borrar">
      <BackspaceIcon size={22} />
    </button>
  )
  const ok = onSubmit ? (
    <button key="ok" type="button" className={clsx(s.key, s.ok)} onMouseDown={keepFocus} onPointerDown={palm.onPointerDown} onClick={press(onSubmit)} disabled={disabled || submitDisabled} aria-label="Comprobar">
      <CheckIcon size={26} strokeWidth={3.2} />
    </button>
  ) : <span key="ok" aria-hidden className={s.spacer} />

  return (
    <div ref={ref} className={clsx(s.pad, className)} role="group" aria-label="Teclado de letras" data-ink-keyboard="">
      <div className={s.row}>{ROW1.map(letterKey)}</div>
      <div className={s.row}>{ROW2.map(letterKey)}</div>
      <div className={clsx(s.row, s.row3)}>
        {btn('⇧', 'Mayúsculas', () => setShift((v) => !v), s.fn, shift)}
        {ROW3.map(letterKey)}
        {del}
      </div>
      {symbols && (
        <div className={clsx(s.row, s.symbolRow)}>
          {SYMBOLS.map((sym) => btn(sym, sym, () => other(sym)))}
        </div>
      )}
      <div className={clsx(s.row, s.bottom)}>
        {symbols
          ? btn('abc', 'Letras', () => setSymbols(false), s.fn)
          : btn('¿!', 'Símbolos', () => setSymbols(true), s.fn)}
        {btn('´', 'Acento', () => setAccent((a) => (a === 'acute' ? null : 'acute')), clsx(s.fn, s.mark), accent === 'acute')}
        {btn('¨', 'Diéresis', () => setAccent((a) => (a === 'diaeresis' ? null : 'diaeresis')), clsx(s.fn, s.mark), accent === 'diaeresis')}
        {btn('espacio', 'Espacio', () => other(' '), s.space)}
        {ok}
      </div>
    </div>
  )
}
