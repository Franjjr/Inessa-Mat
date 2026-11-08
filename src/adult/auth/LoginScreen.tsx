/* Sign-in with e-mail and password, or with a code sent by e-mail; password reset with a code too, then the new-password
   step (also reached from the reset e-mail's link). A code is typed in this same app, so it works on a tablet where the
   e-mail opens in another browser. ?email= fills the address (from «Crear cuenta» when it already exists). Works only when
   the backend is configured. */
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { updatePassword, useAuth, useAuthExtras } from '@/data'
import { Button, Spinner, toast } from '@/ui'
import { AdultPage } from '../shared/AdultPage'
import { TextField } from '../shared/Field'
import { errorMessage } from '../shared/messages'
import { validateEmail, validateLogin, validateNewPassword } from './validation'
import { AfterSignIn } from './AfterSignIn'
import { GoogleButton } from './GoogleButton'
import { useInviteAcceptance } from './invite'
import s from './auth.module.css'
import adult from '../shared/adult.module.css'

type Notice = { tone: 'ok' | 'error' | 'info'; text: string; offerReset?: boolean } | null
/** The code step: the code of the sign-in e-mail, or of the reset e-mail (then the new password). */
type CodeStep = 'login' | 'recovery' | null

export default function LoginScreen() {
  const { status, backendAvailable, signInWithPassword, sendMagicLink, resetPassword, verifyEmailCode } = useAuth()
  const { passwordRecovery } = useAuthExtras()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const invite = params.get('invite')
  const invited = useInviteAcceptance(invite, status === 'signed-in')

  const [email, setEmail] = useState(() => params.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [codeStep, setCodeStep] = useState<CodeStep>(null)
  const [code, setCode] = useState('')

  if (status === 'loading') return <Spinner />

  if (!backendAvailable) {
    return (
      <AdultPage title="Iniciar sesión" back="/welcome" narrow>
        <section className={`${adult.card} ${s.panel}`}>
          <h2 className={adult.subheading}>Las cuentas no están disponibles en esta versión</h2>
          <p className={adult.lead}>
            Puedes seguir usando Repasitos sin cuenta. Todo se guarda en este dispositivo.
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
          <section className={`${adult.card} ${s.panel}`}>
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
        // The step closes (passwordRecovery goes false) and «Sesión iniciada» follows: the confirmation is a toast.
        toast('Contraseña guardada')
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
      // A wrong password: the way out is right there (a code to choose a new one).
      const wrong = err instanceof Error && (err as { code?: string }).code === 'invalid-credentials'
      setNotice({ tone: 'error', text: errorMessage(err), offerReset: wrong })
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
      setCode('')
      setCodeStep('login')
      setNotice({ tone: 'ok', text: `Si hay una cuenta con ${email.trim()}, te hemos enviado un correo. Escribe aquí el código que trae (o pulsa su enlace, si lo abres en este mismo dispositivo). Si no llega en unos minutos, revisa la carpeta de spam.` })
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
      setCode('')
      setCodeStep('recovery')
      setNotice({ tone: 'info', text: `Si hay una cuenta con ${email.trim()}, te hemos enviado un correo con un código para elegir una contraseña nueva. Escríbelo aquí (o pulsa su enlace, si lo abres en este mismo dispositivo). Si no llega en unos minutos, revisa la carpeta de spam.` })
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const submitCode = async (e: FormEvent) => {
    e.preventDefault()
    if (!codeStep) return
    setBusy(true)
    try {
      await verifyEmailCode(email, code, codeStep)
      setNotice(null)
      setCodeStep(null)
    } catch (err) {
      setNotice({ tone: 'error', text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  if (codeStep && !passwordRecovery) {
    return (
      <AdultPage title={codeStep === 'recovery' ? 'Nueva contraseña' : 'Entrar con un código'} narrow>
        <form className={`${adult.card} ${s.panel}`} onSubmit={submitCode} noValidate aria-label="Escribir el código">
          {notice && (
            <p className={notice.tone === 'error' ? adult.error : adult.hint} role={notice.tone === 'error' ? 'alert' : 'status'}>{notice.text}</p>
          )}
          <TextField
            id="email-code" label="Código del correo" inputMode="numeric" autoComplete="one-time-code" maxLength={12}
            value={code} onChange={(e) => setCode(e.target.value)} hint="Las cifras que trae el correo."
          />
          <Button type="submit" size="lg" block disabled={busy}>{busy ? 'Comprobando…' : codeStep === 'recovery' ? 'Seguir' : 'Entrar'}</Button>
          <div className={s.footerLinks}>
            <Button variant="ghost" onClick={() => void (codeStep === 'recovery' ? forgot() : sendLink())} disabled={busy}>Enviarme otro código</Button>
            <Button variant="ghost" onClick={() => { setCodeStep(null); setNotice(null) }} disabled={busy}>Volver</Button>
          </div>
        </form>
      </AdultPage>
    )
  }

  if (passwordRecovery) {
    return (
      <AdultPage title="Nueva contraseña" narrow>
        <form className={`${adult.card} ${s.panel}`} onSubmit={submitPassword} noValidate>
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
        <form className={`${adult.card} ${s.panel}`} onSubmit={submitPassword} noValidate aria-label="Iniciar sesión">
          <GoogleButton context="signin" />
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
              {notice.offerReset && (
                <>
                  {' '}
                  <button type="button" className={`${s.link} ${s.linkButton}`} onClick={() => void forgot()} disabled={busy}>
                    ¿La has olvidado? Te enviamos un código para elegir otra.
                  </button>
                </>
              )}
            </p>
          )}
          <Button type="submit" size="lg" block disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</Button>
        </form>

        <div className={s.footerLinks}>
          <Button variant="ghost" onClick={() => void forgot()} disabled={busy}>He olvidado la contraseña</Button>
          <Button variant="ghost" onClick={() => void sendLink()} disabled={busy}>Entrar con un código por correo</Button>
        </div>

        <p className={adult.muted}>
          ¿Todavía no tienes cuenta? <Link to={signupLink} className={s.link}>Crear cuenta</Link>
        </p>
      </div>
    </AdultPage>
  )
}
