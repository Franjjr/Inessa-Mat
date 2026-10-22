/* Creates an adult account and its first organisation (family or school). The organisation is created by
   @/data during sign-up; with e-mail confirmation on, the adult is asked to confirm first. */
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/data'
import type { OrgKind } from '@/types'
import { Button, Spinner } from '@/ui'
import { AdultPage } from '../shared/AdultPage'
import { TextField } from '../shared/Field'
import { errorMessage } from '../shared/messages'
import { validateSignup, type SignupErrors, type SignupInput } from './validation'
import { AfterSignIn } from './AfterSignIn'
import { useInviteAcceptance } from './invite'
import s from './auth.module.css'
import adult from '../shared/adult.module.css'

const ORG_OPTIONS: { kind: OrgKind; title: string; text: string }[] = [
  { kind: 'family', title: 'Familia', text: 'Para tus hijos e hijas. Cada peque tiene su perfil y su aventura.' },
  { kind: 'school', title: 'Colegio', text: 'Para docentes. Clases con código, asignaciones y progreso de la clase.' },
]

const EMPTY: SignupInput = {
  displayName: '', email: '', password: '', confirm: '', orgKind: null, orgName: '', acceptedPrivacy: false,
}

export default function SignupScreen() {
  const { status, backendAvailable, signUp } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const invite = params.get('invite')
  const invited = useInviteAcceptance(invite, status === 'signed-in')

  const [form, setForm] = useState<SignupInput>(EMPTY)
  const [errors, setErrors] = useState<SignupErrors>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<{ text: string; taken: boolean } | null>(null)
  const [sent, setSent] = useState<string | null>(null)

  const set = <K extends keyof SignupInput>(key: K, value: SignupInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  if (status === 'loading') return <Spinner />

  if (status === 'signed-in') {
    if (invite && invited.status === 'working') return <AdultPage title="Crear cuenta" narrow><Spinner label="Aceptando la invitación…" /></AdultPage>
    return (
      <AdultPage title="Cuenta creada" narrow>
        <AfterSignIn next="/adult" />
      </AdultPage>
    )
  }

  if (!backendAvailable) {
    return (
      <AdultPage title="Crear cuenta" back="/welcome" narrow>
        <section className={adult.card}>
          <h2 className={adult.subheading}>Las cuentas no están disponibles en esta versión</h2>
          <p className={adult.lead}>Puedes probar Numeria sin cuenta. Todo se guarda en este dispositivo.</p>
          <div className={adult.actions}><Button onClick={() => navigate('/welcome')}>Volver al inicio</Button></div>
        </section>
      </AdultPage>
    )
  }

  if (sent) {
    return (
      <AdultPage title="Revisa tu correo" back="/welcome" narrow>
        <section className={adult.card} role="status">
          <h2 className={adult.subheading}>Te hemos enviado un correo de confirmación</h2>
          <p className={adult.lead}>
            Abre el enlace de <strong>{sent}</strong> en este dispositivo para activar tu cuenta. Si no lo ves, revisa la carpeta de spam.
          </p>
          <div className={s.confirmBox}>
            <Link to="/login" className={s.link}>Ya lo he confirmado: iniciar sesión</Link>
          </div>
        </section>
      </AdultPage>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const found = validateSignup(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setBusy(true)
    try {
      await signUp({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        orgKind: form.orgKind as OrgKind,
        orgName: form.orgName,
      })
      setSent(form.email.trim())
    } catch (err) {
      const text = errorMessage(err, 'No hemos podido crear la cuenta. Revisa la conexión e inténtalo de nuevo.')
      setFormError({ text, taken: text.includes('Ya existe una cuenta') })
    } finally {
      setBusy(false)
    }
  }

  const orgLabel = form.orgKind === 'school' ? 'Nombre del colegio' : 'Nombre de tu familia'

  return (
    <AdultPage title="Crear cuenta" back="/welcome" narrow>
      {invite && (
        <div className={`${adult.notice} ${adult.noticeInfo}`} role="status">
          Tienes una invitación. Crea la cuenta con el correo al que te la enviaron.
        </div>
      )}
      <form className={adult.card} onSubmit={submit} noValidate aria-label="Crear cuenta">
        <TextField
          id="signup-name" label="Tu nombre" autoComplete="name" value={form.displayName}
          onChange={(e) => set('displayName', e.target.value)} error={errors.displayName}
        />
        <TextField
          id="signup-email" label="Correo electrónico" type="email" autoComplete="email" inputMode="email" autoCapitalize="none"
          value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email}
        />
        <TextField
          id="signup-password" label="Contraseña" type="password" autoComplete="new-password"
          value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password}
          hint="Al menos 8 caracteres, con letras y números."
        />
        <TextField
          id="signup-confirm" label="Repite la contraseña" type="password" autoComplete="new-password"
          value={form.confirm} onChange={(e) => set('confirm', e.target.value)} error={errors.confirm}
        />

        <fieldset className={s.form} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} aria-describedby={errors.orgKind ? 'signup-org-error' : undefined}>
          <legend className={adult.label} style={{ marginBottom: 8 }}>¿Cómo usarás Numeria?</legend>
          <div className={s.orgChoices} role="radiogroup" aria-label="Tipo de cuenta">
            {ORG_OPTIONS.map((o) => (
              <button
                key={o.kind}
                type="button"
                role="radio"
                aria-checked={form.orgKind === o.kind}
                className={adult.choiceCard}
                onClick={() => set('orgKind', o.kind)}
              >
                <span className={adult.choiceTitle}>{o.title}</span>
                <span className={adult.muted}>{o.text}</span>
              </button>
            ))}
          </div>
          {errors.orgKind && <p id="signup-org-error" className={adult.error}>{errors.orgKind}</p>}
        </fieldset>

        {form.orgKind && (
          <TextField
            id="signup-org" label={orgLabel} value={form.orgName} onChange={(e) => set('orgName', e.target.value)}
            error={errors.orgName} hint={form.orgKind === 'school' ? 'Así lo verán las familias al unirse a una clase.' : 'Solo lo veis las personas adultas de la familia.'}
          />
        )}

        <label className={s.checkRow}>
          <input
            type="checkbox"
            checked={form.acceptedPrivacy}
            onChange={(e) => set('acceptedPrivacy', e.target.checked)}
            aria-invalid={errors.acceptedPrivacy ? true : undefined}
          />
          <span>
            He leído y acepto la <Link to="/legal/privacidad" target="_blank" rel="noreferrer">política de privacidad</Link>.
            Entiendo que los datos de los menores los gestiono yo como persona adulta responsable.
          </span>
        </label>
        {errors.acceptedPrivacy && <p className={adult.error}>{errors.acceptedPrivacy}</p>}

        {formError && (
          <p className={adult.error} role="alert">
            {formError.text}{' '}
            {formError.taken && <Link to="/login" className={s.link}>Iniciar sesión</Link>}
          </p>
        )}

        <Button type="submit" size="lg" block disabled={busy}>{busy ? 'Creando la cuenta…' : 'Crear cuenta'}</Button>
      </form>
      <p className={adult.muted}>
        ¿Ya tienes cuenta? <Link to="/login" className={s.link}>Iniciar sesión</Link>
      </p>
    </AdultPage>
  )
}
