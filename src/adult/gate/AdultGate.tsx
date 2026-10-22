/* Keeps children out of the grown-ups' area. First use asks an adult to create a PIN; afterwards the PIN
   opens the area for 20 minutes. Forgetting it: with an account, re-enter the account password; without
   one, answer a multiplication question. Five wrong PINs pause the keypad for 30 seconds. */
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAdultPin, hasAdultPin, setAdultPin, useAuth, verifyAdultPin } from '@/data'
import { Button, Spinner } from '@/ui'
import { AdultPage } from '../shared/AdultPage'
import { NumberPad, PinDots } from '../shared/NumberPad'
import { errorMessage } from '../shared/messages'
import { validatePin } from '../auth/validation'
import s from './gate.module.css'
import adult from '../shared/adult.module.css'

export const ADULT_SESSION_MS = 20 * 60_000
const MAX_FAILURES = 5
const LOCK_MS = 30_000
const MAX_DIGITS = 8

let unlockedUntil = 0

// Failed attempts and the lock survive a reload, so a reload cannot reset the five-try limit.
// Per-device only (localStorage); storage may be unavailable, in which case the limit is in memory.
const LOCK_KEY = 'numeria.adultGate.lock'

interface LockState {
  failures: number
  lockedUntil: number
}

function readLockState(): LockState {
  try {
    const raw = window.localStorage.getItem(LOCK_KEY)
    if (!raw) return { failures: 0, lockedUntil: 0 }
    const parsed = JSON.parse(raw) as Partial<LockState>
    return {
      failures: Number.isFinite(parsed.failures) ? Math.max(0, Number(parsed.failures)) : 0,
      lockedUntil: Number.isFinite(parsed.lockedUntil) ? Number(parsed.lockedUntil) : 0,
    }
  } catch {
    return { failures: 0, lockedUntil: 0 }
  }
}

function writeLockState(state: LockState): void {
  try {
    if (state.failures === 0 && state.lockedUntil === 0) window.localStorage.removeItem(LOCK_KEY)
    else window.localStorage.setItem(LOCK_KEY, JSON.stringify(state))
  } catch {
    // Storage blocked: the in-memory state still applies for this visit.
  }
}

/** True while the adult area is open on this device (kept in memory: a reload asks again). */
export function isAdultAreaUnlocked(now: number = Date.now()): boolean {
  return now < unlockedUntil
}

/** Closes the adult area at once (used when signing out). */
export function lockAdultArea(): void {
  unlockedUntil = 0
}

/** Tests only. */
export function __resetAdultGateForTests(): void {
  unlockedUntil = 0
}

export interface MathQuestion {
  a: number
  b: number
  answer: number
}

/** Adult fallback question (two 2-digit numbers). `random` is injectable for tests. */
export function makeMathQuestion(random: () => number = Math.random): MathQuestion {
  const a = 12 + Math.floor(random() * 8)
  const b = 12 + Math.floor(random() * 8)
  return { a, b, answer: a * b }
}

type Mode = 'enter' | 'setup' | 'confirm' | 'forgot-password' | 'forgot-maths'
type Tone = 'info' | 'error' | 'ok'

export function AdultGate({ children }: { children: ReactNode }) {
  const { status, user, backendAvailable, signInWithPassword } = useAuth()
  const navigate = useNavigate()
  const [hasPin, setHasPin] = useState<boolean | null>(null)
  const [unlocked, setUnlocked] = useState<boolean>(() => isAdultAreaUnlocked())
  const [mode, setMode] = useState<Mode>('enter')
  const [digits, setDigits] = useState('')
  const [firstPin, setFirstPin] = useState('')
  const [message, setMessage] = useState<{ tone: Tone; text: string } | null>(null)
  const [failures, setFailures] = useState(() => readLockState().failures)
  const [lockedUntil, setLockedUntil] = useState(() => readLockState().lockedUntil)
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [password, setPassword] = useState('')
  const [question, setQuestion] = useState<MathQuestion>(() => makeMathQuestion())

  useEffect(() => {
    let alive = true
    hasAdultPin()
      .then((has) => {
        if (!alive) return
        setHasPin(has)
        setMode(has ? 'enter' : 'setup')
        setMessage(has ? null : { tone: 'info', text: 'Crea un PIN para entrar aquí. Solo lo sabrán las personas adultas.' })
      })
      .catch(() => {
        if (alive) setMessage({ tone: 'error', text: 'No hemos podido comprobar el PIN. Vuelve a intentarlo.' })
      })
    return () => {
      alive = false
    }
  }, [])

  const locked = lockedUntil > now
  useEffect(() => {
    if (!locked) return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [locked])

  const padMode = mode === 'enter' || mode === 'setup' || mode === 'confirm' || mode === 'forgot-maths'
  const canType = padMode && !busy && !locked && !unlocked && hasPin !== null

  const addDigit = (d: string) => {
    setMessage(null)
    setDigits((cur) => (cur.length >= MAX_DIGITS ? cur : cur + d))
  }
  const backspace = () => setDigits((cur) => cur.slice(0, -1))

  const unlock = () => {
    unlockedUntil = Date.now() + ADULT_SESSION_MS
    setUnlocked(true)
  }

  const submit = async () => {
    if (busy) return
    if (mode === 'enter') {
      if (locked) return
      if (digits.length < 4) {
        setMessage({ tone: 'info', text: 'Escribe tu PIN (entre 4 y 8 números).' })
        return
      }
      setBusy(true)
      try {
        const ok = await verifyAdultPin(digits)
        if (ok) {
          writeLockState({ failures: 0, lockedUntil: 0 })
          setFailures(0)
          unlock()
          return
        }
        const next = failures + 1
        setFailures(next)
        setDigits('')
        if (next >= MAX_FAILURES) {
          const until = Date.now() + LOCK_MS
          setLockedUntil(until)
          writeLockState({ failures: 0, lockedUntil: until })
          setNow(Date.now())
          setFailures(0)
          setMessage({ tone: 'error', text: 'Demasiados intentos seguidos. Espera 30 segundos antes de volver a probar.' })
        } else {
          writeLockState({ failures: next, lockedUntil: 0 })
          setMessage({ tone: 'error', text: 'Ese PIN no es correcto. Inténtalo otra vez.' })
        }
      } catch {
        setMessage({ tone: 'error', text: 'No hemos podido comprobar el PIN. Vuelve a intentarlo.' })
      } finally {
        setBusy(false)
      }
      return
    }
    if (mode === 'setup') {
      const err = validatePin(digits)
      if (err) {
        setMessage({ tone: 'error', text: err })
        return
      }
      setFirstPin(digits)
      setDigits('')
      setMode('confirm')
      setMessage({ tone: 'info', text: 'Escríbelo otra vez para confirmarlo.' })
      return
    }
    if (mode === 'confirm') {
      if (digits !== firstPin) {
        setDigits('')
        setFirstPin('')
        setMode('setup')
        setMessage({ tone: 'error', text: 'Los PIN no coinciden. Empecemos otra vez.' })
        return
      }
      setBusy(true)
      try {
        await setAdultPin(digits)
        unlock()
      } catch (e) {
        setMessage({ tone: 'error', text: errorMessage(e) })
      } finally {
        setBusy(false)
      }
      return
    }
    if (mode === 'forgot-maths') {
      if (Number(digits) !== question.answer) {
        setDigits('')
        setQuestion(makeMathQuestion())
        setMessage({ tone: 'error', text: 'Ese resultado no es correcto. Te hemos puesto otra cuenta.' })
        return
      }
      await clearAdultPin()
      setDigits('')
      setFirstPin('')
      setFailures(0)
      setMode('setup')
      setMessage({ tone: 'ok', text: 'Muy bien. Ahora crea un PIN nuevo.' })
    }
  }

  // Physical keyboards on tablets and computers.
  useEffect(() => {
    if (!canType) return
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) {
        e.preventDefault()
        addDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        backspace()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        void submit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // submit reads the latest state, so the listener is rebound whenever that state changes.
  }, [canType, digits, mode, firstPin, failures, question, busy, locked])

  if (unlocked) return <>{children}</>

  if (hasPin === null && !message) {
    return <Spinner />
  }

  const startForgot = () => {
    setMessage(null)
    setDigits('')
    if (backendAvailable && status === 'signed-in' && user?.email) {
      setPassword('')
      setMode('forgot-password')
    } else {
      setQuestion(makeMathQuestion())
      setMode('forgot-maths')
    }
  }

  const submitPassword = async () => {
    if (!user?.email) return
    if (!password) {
      setMessage({ tone: 'error', text: 'Escribe la contraseña de tu cuenta.' })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      await signInWithPassword(user.email, password)
      await clearAdultPin()
      setPassword('')
      setMode('setup')
      setDigits('')
      setMessage({ tone: 'ok', text: 'Confirmado. Crea un PIN nuevo.' })
    } catch (e) {
      setMessage({ tone: 'error', text: errorMessage(e) })
    } finally {
      setBusy(false)
    }
  }

  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - now) / 1000))
  const title = mode === 'setup' || mode === 'confirm' ? 'Crea tu PIN' : mode === 'forgot-password' || mode === 'forgot-maths' ? 'Recuperar el PIN' : 'Zona de adultos'
  const subtitle =
    mode === 'enter'
      ? 'Esta zona es para las personas adultas. Escribe el PIN para continuar.'
      : mode === 'setup'
        ? 'Elige entre 4 y 8 números. Así, los peques no entran aquí sin querer.'
        : mode === 'confirm'
          ? 'Escríbelo otra vez para confirmarlo.'
          : mode === 'forgot-password'
            ? `Escribe la contraseña de ${user?.email ?? 'tu cuenta'} para crear un PIN nuevo.`
            : 'Para crear un PIN nuevo, responde a esta multiplicación.'

  return (
    <AdultPage title="Zona de adultos" back="/kids" narrow>
      <section className={s.wrap} aria-labelledby="gate-title">
        <div className={s.card}>
          <div className={s.lockMark} aria-hidden>
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2.5" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <h2 id="gate-title" className={adult.subheading}>{title}</h2>
          <p className={adult.lead}>{subtitle}</p>

          {message && (
            <p className={message.tone === 'error' ? adult.error : adult.hint} role={message.tone === 'error' ? 'alert' : 'status'}>
              {message.text}
            </p>
          )}

          {(mode === 'enter' || mode === 'setup' || mode === 'confirm') && (
            <>
              <PinDots length={4} filled={digits.length} label="PIN" />
              <NumberPad
                onDigit={addDigit}
                onBackspace={backspace}
                onSubmit={() => void submit()}
                submitLabel={mode === 'confirm' ? 'Confirmar' : mode === 'setup' ? 'Seguir' : 'Entrar'}
                submitDisabled={busy || locked}
                disabled={busy || locked}
              />
              {locked && <p className={adult.hint} aria-live="polite">Puedes volver a probar en {secondsLeft} segundos.</p>}
              {mode === 'enter' && (
                <button type="button" className={s.linkButton} onClick={startForgot} disabled={busy}>
                  He olvidado el PIN
                </button>
              )}
            </>
          )}

          {mode === 'forgot-maths' && (
            <>
              <p className={s.question} aria-live="polite">{question.a} × {question.b} = ?</p>
              <output className={s.answer} aria-label="Tu respuesta">{digits || '·'}</output>
              <NumberPad
                onDigit={addDigit}
                onBackspace={backspace}
                onSubmit={() => void submit()}
                submitLabel="Comprobar"
                submitDisabled={busy}
                disabled={busy}
              />
            </>
          )}

          {mode === 'forgot-password' && (
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault()
                void submitPassword()
              }}
            >
              <label className={adult.label} htmlFor="gate-password">Contraseña de tu cuenta</label>
              <input
                id="gate-password"
                className={adult.input}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" block disabled={busy}>{busy ? 'Comprobando…' : 'Continuar'}</Button>
            </form>
          )}

          {(mode === 'forgot-password' || mode === 'forgot-maths') && (
            <button
              type="button"
              className={s.linkButton}
              onClick={() => {
                setMessage(null)
                setDigits('')
                setMode('enter')
              }}
            >
              Volver a escribir el PIN
            </button>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate('/kids')}>Volver a la zona de niños</Button>
      </section>
    </AdultPage>
  )
}

export default AdultGate
