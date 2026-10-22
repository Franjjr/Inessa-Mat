/* Sign-in with e-mail and password, with a magic-link option, password reset and the new-password step
   that follows a reset link. Works only when the backend is configured. */
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { updatePassword, useAuth, useAuthExtras } from '@/data'
import { Button, Spinner } from '@/ui'
import { AdultPage } from '../shared/AdultPage'
import { TextField } from '../shared/Field'
import { errorMessage } from '../shared/messages'
import { validateEmail, validateLogin, validateNewPassword } from './validation'
import { AfterSignIn } from './AfterSignIn'
import { useInviteAcceptance } from './invite'
import s from './auth.module.css'
import adult from '../shared/adult.module.css'

type Notice = { tone: 'ok' | 'error' | 'info'; text: string } | null

export default function LoginScreen() {
  const { status, backendAvailable, signInWithPassword, sendMagicLink, resetPassword } = useAuth()
  const { passwordRecovery } = useAuthExtras()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const invite = params.get('invite')
  const invited = useInviteAcceptance(invite, status === 'signed-in')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  if (status === 'loading') return <Spinner />

  if (!backendAvailable) {
    return (
      <AdultPage title="Iniciar sesión" back="/welcome" narrow>
        <section className={adult.card}>
          <h2 className={adult.subheading}>Las cuentas no están disponibles en esta versión</h2>
          <p className={adult.lead}>
            Puedes seguir usando Numeria sin cuenta. Todo se guarda en este dispositivo.
          </p>
          <div className={adult.actions}>
            <Button onClick={() => navigate('/welcome')}>Volver al inicio</Button>
          </div>
        </section>
      </AdultPage>
    )
  }

  if (status === 'signed-in' && !passwordRecovery) {
    if (invite && invited.status === 'working') {
      return <AdultPage title="Invitación" narrow><Spinner label="Aceptando la invitación…" /></AdultPage>
    }
    if (invite && invited.status === 'error') {
      return (
        <AdultPage title="Invitación" narrow>
          <section className={adult.card}>
            <p className={adult.error} role="alert">{invited.error}</p>
            <div className={adult.actions}><Button onClick={() => navigate('/adult')}>Continuar</Button></div>
          </section>
        </AdultPage>
      )
    }
    return (
      <AdultPage title="Sesión iniciada" narrow>
        {invite && invited.status === 'done' && (
          <div className={`${adult.notice} ${adult.noticeOk}`} role="status">Invitación aceptada. Ya formas parte de la cuenta.</div>
        )}
        <AfterSignIn next="/adult" />
      </AdultPage>
    )
  }

  const signupLink = invite ? `/signup?invite=${encodeURIComponent(invite)}` : '/signup'

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault()
    setNotice(null)
    if (passwordRecovery) {
      const next = {
        password: validateNewPassword(newPassword) ?? undefined,
        confirm: newPassword !== confirm ? 'Las contraseñas no coinciden.' : undefined,
      }
      setErrors(next)
      if (next.password || next.confirm) return
      setBusy(true)
      try {
        await updatePassword(newPassword)
        setNotice({ tone: 'ok', text: 'Contraseña guardada. Ya puedes seguir.' })
      } catch (err) {
        setNotice({ tone: 'error', text: errorMessage(err) })
      } finally {
        setBusy(false)
      }
      return
    }
    const check = validateLogin(email, password)
    setErrors(check)
    if (check.email || check.password) return
    setBusy(true)
    try {
      await signInWithPassword(email, password)
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const sendLink = async () => {
    setNotice(null)
    const emailError = validateEmail(email)
    setErrors({ email: emailError ?? undefined })
    if (emailError) return
    setBusy(true)
    try {
      await sendMagicLink(email)
      setNotice({ tone: 'ok', text: `Te hemos enviado un enlace a ${email.trim()}. Ábrelo en este mismo dispositivo para entrar. Si no llega, revisa la carpeta de spam.` })
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const forgot = async () => {
    setNotice(null)
    const emailError = validateEmail(email)
    setErrors({ email: emailError ?? undefined })
    if (emailError) return
    setBusy(true)
    try {
      await resetPassword(email)
      setNotice({ tone: 'info', text: 'Si hay una cuenta con ese correo, te hemos enviado un enlace para elegir una contraseña nueva.' })
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  if (passwordRecovery) {
    return (
      <AdultPage title="Nueva contraseña" narrow>
        <form className={adult.card} onSubmit={submitPassword} noValidate>
          <h2 className={adult.subheading}>Elige una contraseña nueva</h2>
          <TextField
            id="new-password" label="Contraseña nueva" type="password" autoComplete="new-password"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            hint="Al menos 8 caracteres, con letras y números." error={errors.password}
          />
          <TextField
            id="confirm-password" label="Repítela" type="password" autoComplete="new-password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm}
          />
          {notice && <p className={notice.tone === 'error' ? adult.error : adult.hint} role="status">{notice.text}</p>}
          <Button type="submit" size="lg" block disabled={busy}>{busy ? 'Guardando…' : 'Guardar contraseña'}</Button>
        </form>
      </AdultPage>
    )
  }

  return (
    <AdultPage title="Iniciar sesión" back="/welcome" narrow>
      <div className={s.form}>
        {invite && (
          <div className={`${adult.notice} ${adult.noticeInfo}`} role="status">
            Tienes una invitación. Entra con el correo al que te la enviaron y la aceptaremos automáticamente.
          </div>
        )}
        <form className={adult.card} onSubmit={submitPassword} noValidate aria-label="Iniciar sesión">
          <TextField
            id="login-email" label="Correo electrónico" type="email" autoComplete="username" inputMode="email"
            value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoCapitalize="none"
          />
          <TextField
            id="login-password" label="Contraseña" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password}
          />
          {notice && (
            <p
              className={notice.tone === 'error' ? adult.error : adult.hint}
              role={notice.tone === 'error' ? 'alert' : 'status'}
            >
              {notice.text}
            </p>
          )}
          <Button type="submit" size="lg" block disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</Button>
        </form>

        <div className={s.footerLinks}>
          <Button variant="ghost" onClick={() => void forgot()} disabled={busy}>He olvidado la contraseña</Button>
          <Button variant="ghost" onClick={() => void sendLink()} disabled={busy}>Enviarme un enlace para entrar</Button>
        </div>

        <p className={adult.muted}>
          ¿Todavía no tienes cuenta? <Link to={signupLink} className={s.link}>Crear cuenta</Link>
        </p>
      </div>
    </AdultPage>
  )
}
