/* A parent links a child to a school class with the class code. The consent is explicit and recorded by the
   server through joinClassWithCode. The child must already be saved in the family account. */
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { joinClassWithCode, listClassesForChild, useAuth, useChildren } from '@/data'
import type { ChildProfile, ClassRoom } from '@/types'
import { Button, Spinner } from '@/ui'
import { AdultPage } from '../shared/AdultPage'
import { TextField } from '../shared/Field'
import { ClaimLocalPanel, localOnlyChildren } from '../shared/ClaimLocalPanel'
import { errorMessage } from '../shared/messages'
import { cleanClassCode, consentText, validateJoin, type JoinErrors } from './joinValidation'
import s from './join.module.css'
import adult from '../shared/adult.module.css'

export default function JoinClassScreen() {
  const { status, backendAvailable } = useAuth()
  const navigate = useNavigate()
  const children = useChildren()
  const locals = localOnlyChildren() ?? []
  const linkable: ChildProfile[] = (children ?? []).filter((c) => c.orgId !== null)

  const [childId, setChildId] = useState('')
  const [code, setCode] = useState('')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<JoinErrors>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [joined, setJoined] = useState<{ room: ClassRoom; nickname: string } | null>(null)
  const [current, setCurrent] = useState<ClassRoom[]>([])

  const selected = linkable.find((c) => c.id === childId) ?? linkable[0] ?? null
  const selectedId = selected?.id ?? ''

  useEffect(() => {
    if (!selectedId || status !== 'signed-in') {
      setCurrent([])
      return
    }
    let alive = true
    listClassesForChild(selectedId)
      .then((rows) => alive && setCurrent(rows))
      .catch(() => alive && setCurrent([]))
    return () => {
      alive = false
    }
  }, [selectedId, status])

  if (status === 'loading' || children === undefined) return <Spinner />

  if (!backendAvailable || status === 'local-only' || status === 'anonymous') {
    return (
      <AdultPage title="Unirse a una clase" back="/adult" narrow>
        <section className={adult.card}>
          <h2 className={adult.subheading}>Necesitas una cuenta de familia</h2>
          <p className={adult.lead}>
            Para unir a tu hijo o hija a una clase, crea una cuenta o inicia sesión. Así el colegio sabe a quién vincular.
          </p>
          <div className={adult.actions}>
            <Button onClick={() => navigate('/signup')} disabled={!backendAvailable}>Crear cuenta</Button>
            <Button variant="secondary" onClick={() => navigate('/login')} disabled={!backendAvailable}>Iniciar sesión</Button>
          </div>
        </section>
      </AdultPage>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const found = validateJoin({ code, childId: selectedId, consent })
    setErrors(found)
    if (Object.keys(found).length > 0 || !selected) return
    setBusy(true)
    try {
      const room = await joinClassWithCode(cleanClassCode(code), selected.id)
      setJoined({ room, nickname: selected.nickname })
      setCode('')
      setConsent(false)
      setCurrent(await listClassesForChild(selected.id).catch(() => [...current]))
    } catch (err) {
      setFormError(errorMessage(err, 'No hemos podido unirlo a la clase. Inténtalo de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdultPage title="Unirse a una clase" back="/adult" narrow>
      {joined && (
        <section className={`${adult.notice} ${adult.noticeOk} ${s.success}`} role="status" aria-live="polite">
          <span className={adult.noticeMark} aria-hidden>✓</span>
          <div className={adult.stack} style={{ gap: 4 }}>
            <strong>¡Listo! {joined.nickname} ya está en {joined.room.name}.</strong>
            <span>Verás las misiones de la clase en su informe. Puedes unir a más peques con otro código.</span>
          </div>
        </section>
      )}

      {locals.length > 0 && <ClaimLocalPanel />}

      {linkable.length === 0 ? (
        <section className={adult.card}>
          <h2 className={adult.subheading}>Primero guarda el perfil en tu cuenta</h2>
          <p className={adult.lead}>
            Para unir a un peque a una clase, su perfil tiene que estar en tu cuenta. Si todavía no lo tienes, créalo desde la zona de adultos.
          </p>
          <div className={adult.actions}>
            <Button onClick={() => navigate('/adult')} variant="secondary">Volver a la zona de adultos</Button>
          </div>
        </section>
      ) : (
        <form className={adult.card} onSubmit={submit} noValidate aria-label="Unirse a una clase">
          <div className={adult.field}>
            <label htmlFor="join-child" className={adult.label}>Perfil del peque</label>
            <select
              id="join-child"
              className={`${adult.input} ${adult.select}`}
              value={selectedId}
              onChange={(e) => {
                setChildId(e.target.value)
                setErrors((x) => ({ ...x, childId: undefined }))
              }}
              aria-invalid={errors.childId ? true : undefined}
            >
              {linkable.map((c) => <option key={c.id} value={c.id}>{c.nickname}</option>)}
            </select>
            {errors.childId && <p className={adult.error}>{errors.childId}</p>}
          </div>

          {current.length > 0 && (
            <p className={adult.hint}>
              {selected?.nickname} ya está en: {current.map((c) => c.name).join(', ')}.
            </p>
          )}

          <TextField
            id="join-code"
            label="Código de la clase"
            value={code}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={9}
            className={adult.inputCode}
            onChange={(e) => {
              setCode(cleanClassCode(e.target.value).slice(0, 6))
              setErrors((x) => ({ ...x, code: undefined }))
            }}
            error={errors.code}
            hint="Son 6 letras o números. Te lo dará el colegio."
          />

          <label className={s.consent}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked)
                setErrors((x) => ({ ...x, consent: undefined }))
              }}
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby="join-consent-text"
            />
            <span id="join-consent-text">{consentText(selected?.nickname ?? 'tu hijo o hija', null)}</span>
          </label>
          {errors.consent && <p className={adult.error}>{errors.consent}</p>}

          {formError && <p className={adult.error} role="alert">{formError}</p>}

          <Button type="submit" size="lg" block disabled={busy}>{busy ? 'Uniendo…' : 'Unirse a la clase'}</Button>
        </form>
      )}
    </AdultPage>
  )
}
