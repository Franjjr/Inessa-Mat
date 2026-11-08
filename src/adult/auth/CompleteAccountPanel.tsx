/* «Completa tu cuenta»: an account with no family or school yet (the first time someone comes in with Google). Asks what
   the sign-up form asks besides e-mail and password: the adult's name (Google's, ready to change), family or school, its
   name, and the privacy policy. */
import { useEffect, useState, type FormEvent } from 'react'
import { completeAccount, suggestedDisplayName, useAuth, useAuthExtras } from '@/data'
import type { OrgKind } from '@/types'
import { Button } from '@/ui'
import { TextField } from '../shared/Field'
import { lockAdultArea } from '../gate/AdultGate'
import { errorMessage } from '../shared/messages'
import { AccountSetupFields } from './AccountSetupFields'
import { validateAccountSetup, type AccountSetupErrors, type AccountSetupInput } from './validation'
import s from './auth.module.css'
import adult from '../shared/adult.module.css'

/** True once the account has loaded from the server and has no family or school (not while offline or on a failed load). */
export function useNeedsAccountSetup(): boolean {
  const { status, profile, memberships } = useAuth()
  const { offline } = useAuthExtras()
  return status === 'signed-in' && !offline && profile !== null && memberships.length === 0
}

export function CompleteAccountPanel() {
  const { user, signOut } = useAuth()
  const [form, setForm] = useState<AccountSetupInput>({ displayName: '', orgKind: null, orgName: '', acceptedPrivacy: false })
  const [errors, setErrors] = useState<AccountSetupErrors>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    suggestedDisplayName()
      .then((name) => {
        if (alive && name) setForm((f) => (f.displayName ? f : { ...f, displayName: name }))
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const set = <K extends keyof AccountSetupInput>(key: K, value: AccountSetupInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const found = validateAccountSetup(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setBusy(true)
    try {
      await completeAccount({ displayName: form.displayName, orgKind: form.orgKind as OrgKind, orgName: form.orgName })
    } catch (err) {
      setFormError(errorMessage(err, 'No hemos podido guardar la cuenta. Revisa la conexión e inténtalo de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={`${adult.card} ${s.panel}`} onSubmit={submit} noValidate aria-label="Completa tu cuenta">
      <h2 className={adult.subheading}>Completa tu cuenta</h2>
      <p className={adult.lead}>
        Has entrado{user?.email ? <> como <strong>{user.email}</strong></> : null}. Falta poco: dinos cómo usarás Repasitos.
      </p>
      <TextField
        id="setup-name" label="Tu nombre" autoComplete="name" value={form.displayName}
        onChange={(e) => set('displayName', e.target.value)} error={errors.displayName}
      />
      <AccountSetupFields idPrefix="setup" value={form} errors={errors} set={set} />
      {formError && <p className={adult.error} role="alert">{formError}</p>}
      <Button type="submit" size="lg" block disabled={busy}>{busy ? 'Guardando…' : 'Seguir'}</Button>
      <div className={s.footerLinks}>
        <Button variant="ghost" onClick={() => { lockAdultArea(); void signOut() }} disabled={busy}>No es mi cuenta: cerrar sesión</Button>
      </div>
    </form>
  )
}
