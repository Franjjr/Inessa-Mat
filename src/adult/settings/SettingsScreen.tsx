/* Account, organisation members and invitations, sound settings per child, the adult PIN and sign-out. */
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createInviteLink, hasAdultPin, listOrgMembers, setAdultPin, updateChild, useAuth, useChildren, verifyAdultPin } from '@/data'
import type { ChildProfile, OrgRole } from '@/types'
import { speech } from '@/audio'
import { Button, toast } from '@/ui'
import { AdultPage } from '../shared/AdultPage'
import { SyncBadge } from '../shared/SyncBadge'
import { SwitchRow } from '../child/SwitchRow'
import { TextField } from '../shared/Field'
import { errorMessage } from '../shared/messages'
import { copyText } from '../shared/clipboard'
import { validatePin } from '../auth/validation'
import { lockAdultArea } from '../gate/AdultGate'
import s from './settings.module.css'
import adult from '../shared/adult.module.css'

const ROLE_LABEL: Record<OrgRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  teacher: 'Profesor',
  guardian: 'Familiar',
}

type Member = Awaited<ReturnType<typeof listOrgMembers>>[number]

export default function SettingsScreen() {
  const { status, user, profile, activeOrg, backendAvailable, signOut } = useAuth()
  const navigate = useNavigate()
  const children = useChildren() ?? []
  const signedIn = status === 'signed-in' && !!activeOrg

  return (
    <AdultPage title="Ajustes" back="/adult">
      <SyncBadge />

      <AccountCard
        email={user?.email ?? null}
        name={profile?.displayName ?? null}
        orgName={activeOrg?.name ?? null}
        orgKind={activeOrg?.kind ?? null}
        signedIn={status === 'signed-in'}
        backendAvailable={backendAvailable}
        onSignOut={async () => {
          // Lock first: the adult area must close even if the sign-out request fails.
          lockAdultArea()
          await signOut()
          navigate('/welcome', { replace: true })
        }}
      />

      {signedIn && activeOrg && <MembersCard orgId={activeOrg.id} orgKind={activeOrg.kind} />}

      <SoundCard profiles={children} />

      <PinCard />

      <section className={adult.card} aria-labelledby="privacy-link-title">
        <h2 id="privacy-link-title" className={adult.subheading}>Privacidad</h2>
        <p className={adult.muted}>Qué datos guardamos, para qué y cómo puedes pedir copias o borrados.</p>
        <div className={adult.actions}>
          <Button variant="secondary" onClick={() => navigate('/legal/privacidad')}>Leer la política de privacidad</Button>
        </div>
      </section>
    </AdultPage>
  )
}

function AccountCard({
  email,
  name,
  orgName,
  orgKind,
  signedIn,
  backendAvailable,
  onSignOut,
}: {
  email: string | null
  name: string | null
  orgName: string | null
  orgKind: 'family' | 'school' | null
  signedIn: boolean
  backendAvailable: boolean
  onSignOut: () => Promise<void>
}) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!signedIn) {
    return (
      <section className={adult.card} aria-labelledby="account-title">
        <h2 id="account-title" className={adult.subheading}>Cuenta</h2>
        <p className={adult.lead}>Estás usando Repasitos sin cuenta. Los datos se quedan en este dispositivo.</p>
        {backendAvailable && (
          <div className={adult.actions}>
            <Button onClick={() => navigate('/signup')}>Crear cuenta</Button>
            <Button variant="secondary" onClick={() => navigate('/login')}>Iniciar sesión</Button>
          </div>
        )}
      </section>
    )
  }

  const signOutNow = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSignOut()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <section className={adult.card} aria-labelledby="account-title">
      <h2 id="account-title" className={adult.subheading}>Cuenta</h2>
      <dl className={s.kv} style={{ margin: 0 }}>
        <dt className={s.kvKey}>Correo</dt>
        <dd className={s.kvVal} style={{ margin: 0 }}>{email ?? '—'}</dd>
        <dt className={s.kvKey}>Nombre</dt>
        <dd style={{ margin: 0 }} className={s.kvVal}>{name ?? '—'}</dd>
        <dt className={s.kvKey}>Familia o colegio</dt>
        <dd style={{ margin: 0 }} className={s.kvVal}>
          {orgName ? `${orgName} (${orgKind === 'school' ? 'colegio' : 'familia'})` : '—'}
        </dd>
      </dl>
      {error && <p className={adult.error} role="alert">{error}</p>}
      <div className={adult.actions}>
        <Button variant="danger" onClick={() => void signOutNow()} disabled={busy}>{busy ? 'Cerrando…' : 'Cerrar sesión'}</Button>
      </div>
    </section>
  )
}

function MembersCard({ orgId, orgKind }: { orgId: string; orgKind: 'family' | 'school' }) {
  const [members, setMembers] = useState<Member[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrgRole>(orgKind === 'school' ? 'teacher' : 'guardian')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const roles: OrgRole[] = orgKind === 'school' ? ['teacher', 'admin'] : ['guardian', 'admin']

  useEffect(() => {
    let alive = true
    listOrgMembers(orgId)
      .then((rows) => alive && setMembers(rows))
      .catch((e: unknown) => alive && setLoadError(errorMessage(e, 'No hemos podido cargar los miembros.')))
    return () => {
      alive = false
    }
  }, [orgId])

  const invite = async (e: FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    setLink(null)
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setEmailError('Escribe el correo del adulto que quieres invitar.')
      return
    }
    setEmailError(null)
    setBusy(true)
    try {
      const url = await createInviteLink(orgId, email, role)
      setLink(url)
      setEmail('')
    } catch (err) {
      setInviteError(errorMessage(err, 'No hemos podido crear la invitación.'))
    } finally {
      setBusy(false)
    }
  }

  const share = async (url: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Invitación a Repasitos', text: 'Únete a nuestra cuenta de Repasitos:', url })
        return
      } catch {
        /* cancelled: fall back to copying */
      }
    }
    const ok = await copyText(url)
    toast(ok ? 'Enlace copiado' : 'Copia el enlace a mano')
  }

  return (
    <section className={adult.card} aria-labelledby="members-title">
      <h2 id="members-title" className={adult.subheading}>Adultos</h2>
      <p className={adult.muted}>
        {orgKind === 'school'
          ? 'Los profesores de tu colegio ven las clases que les compartas.'
          : 'Otros adultos de la familia pueden ver y ajustar los perfiles.'}
      </p>
      {loadError && <p className={adult.error} role="alert">{loadError}</p>}
      {members && (
        <ul className={s.members} aria-label="Miembros">
          {members.map((m) => (
            <li key={m.membership.userId} className={s.member}>
              <div className={adult.stack} style={{ gap: 2, minWidth: 0 }}>
                <span className={adult.strong}>{m.displayName || m.email || 'Sin nombre'}</span>
                <span className={adult.muted}>{m.email ?? ''}</span>
              </div>
              <span className={adult.muted}>{ROLE_LABEL[m.membership.role]}</span>
            </li>
          ))}
        </ul>
      )}

      <form className={adult.stack} onSubmit={invite} noValidate aria-label="Invitar a un adulto">
        <div className={adult.field}>
          <span className={adult.label} id="role-label">Papel</span>
          <div className={adult.segmented} role="radiogroup" aria-labelledby="role-label">
            {roles.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={role === r} className={adult.segment} onClick={() => setRole(r)}>
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        <TextField
          id="invite-email" label="Correo del invitado" type="email" inputMode="email" autoCapitalize="none"
          value={email} onChange={(e) => setEmail(e.target.value)} error={emailError}
          hint="Entrará automáticamente cuando inicie sesión o cree su cuenta con este correo."
        />
        <div className={adult.actions}>
          <Button type="submit" disabled={busy}>{busy ? 'Creando invitación…' : 'Crear invitación'}</Button>
        </div>
        {inviteError && <p className={adult.error} role="alert">{inviteError}</p>}
      </form>

      {link && (
        <div className={s.inviteBox} role="status">
          <span className={adult.strong}>Invitación lista. Envía este enlace al invitado:</span>
          <span className={s.linkText}>{link}</span>
          <div className={adult.actions}>
            <Button size="sm" onClick={() => void share(link)}>Compartir enlace</Button>
            <Button size="sm" variant="secondary" onClick={() => void copyText(link).then((ok) => toast(ok ? 'Enlace copiado' : 'Copia el enlace a mano'))}>
              Copiar
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function SoundCard({ profiles }: { profiles: ChildProfile[] }) {
  const [selected, setSelected] = useState('')
  const [error, setError] = useState<string | null>(null)
  const child = profiles.find((c) => c.id === (selected || profiles[0]?.id)) ?? null

  if (!child) {
    return (
      <section className={adult.card} aria-labelledby="sound-title">
        <h2 id="sound-title" className={adult.subheading}>Sonido y voz</h2>
        <p className={adult.muted}>Cuando haya un perfil, podrás elegir aquí su sonido y su voz.</p>
      </section>
    )
  }

  const change = async (patch: Partial<ChildProfile['settings']>) => {
    setError(null)
    try {
      await updateChild(child.id, { settings: { ...child.settings, ...patch } })
    } catch (e) {
      setError(errorMessage(e, 'No hemos podido guardar el cambio.'))
    }
  }

  return (
    <section className={adult.card} aria-labelledby="sound-title">
      <div className={adult.cardHead}>
        <h2 id="sound-title" className={adult.subheading}>Sonido y voz</h2>
        {profiles.length > 1 && (
          <select
            aria-label="Perfil"
            className={`${adult.input} ${adult.select}`}
            style={{ width: 'auto', minWidth: 180 }}
            value={child.id}
            onChange={(e) => setSelected(e.target.value)}
          >
            {profiles.map((c) => <option key={c.id} value={c.id}>{c.nickname}</option>)}
          </select>
        )}
      </div>
      <p className={adult.muted}>Ajustes de {child.nickname}. Se aplican en cuanto los cambias.</p>
      <SwitchRow label="Efectos de sonido" checked={child.settings.sound} onChange={(v) => void change({ sound: v })} />
      <SwitchRow label="Música" checked={child.settings.music} onChange={(v) => void change({ music: v })} />
      <SwitchRow
        label="Lumi lee en voz alta"
        hint="Las instrucciones se pueden escuchar; siempre hay un botón para escucharlas."
        checked={child.settings.voice}
        onChange={(v) => void change({ voice: v })}
      />
      <SwitchRow
        label="Leer las historias en voz alta"
        hint="Apágalo si prefieres que las historias las lea el niño. Siempre puede pulsar «Escuchar»."
        checked={child.settings.storyVoice !== false}
        onChange={(v) => void change({ storyVoice: v })}
      />
      <VoicePicker />
      {error && <p className={adult.error} role="alert">{error}</p>}
    </section>
  )
}

function PinCard() {
  const [hasPin, setHasPin] = useState<boolean | null>(null)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    hasAdultPin().then((v) => alive && setHasPin(v)).catch(() => alive && setHasPin(false))
    return () => {
      alive = false
    }
  }, [])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (hasPin) {
      if (!(await verifyAdultPin(current))) {
        setError('El PIN actual no es correcto.')
        return
      }
    }
    const pinError = validatePin(next)
    if (pinError) {
      setError(pinError)
      return
    }
    if (next !== confirm) {
      setError('Los PIN nuevos no coinciden.')
      return
    }
    setBusy(true)
    try {
      await setAdultPin(next)
      setCurrent('')
      setNext('')
      setConfirm('')
      setHasPin(true)
      toast('PIN cambiado')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={adult.card} aria-labelledby="pin-title">
      <h2 id="pin-title" className={adult.subheading}>PIN de la zona de adultos</h2>
      <p className={adult.muted}>Entre 4 y 8 números. Solo lo debe conocer el adulto.</p>
      {hasPin !== null && (
        <form className={adult.stack} onSubmit={save} noValidate aria-label="Cambiar el PIN">
          <div className={s.pinGrid}>
            {hasPin && (
              <TextField id="pin-current" label="PIN actual" type="password" inputMode="numeric" maxLength={8} autoComplete="off" value={current} onChange={(e) => setCurrent(e.target.value.replace(/\D/g, ''))} />
            )}
            <TextField id="pin-new" label={hasPin ? 'PIN nuevo' : 'PIN'} type="password" inputMode="numeric" maxLength={8} autoComplete="off" value={next} onChange={(e) => setNext(e.target.value.replace(/\D/g, ''))} />
            <TextField id="pin-confirm" label="Repite el PIN" type="password" inputMode="numeric" maxLength={8} autoComplete="off" value={confirm} onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))} />
          </div>
          {error && <p className={adult.error} role="alert">{error}</p>}
          <div className={adult.actions}>
            <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : hasPin ? 'Cambiar el PIN' : 'Crear el PIN'}</Button>
          </div>
        </form>
      )}
    </section>
  )
}

/** Voice for this device (system voices differ a lot in quality), with a sample to compare them. */
function VoicePicker() {
  const [voices, setVoices] = useState(() => speech.voices())
  const [chosen, setChosen] = useState(() => speech.preferredVoice() ?? '')

  useEffect(() => {
    // Voices arrive late on iOS and Chrome: look again for a few seconds.
    if (voices.length) return
    const timer = setInterval(() => {
      const list = speech.voices()
      if (list.length) {
        setVoices(list)
        clearInterval(timer)
      }
    }, 500)
    const stop = setTimeout(() => clearInterval(timer), 6000)
    return () => {
      clearInterval(timer)
      clearTimeout(stop)
    }
  }, [voices.length])

  const pick = (id: string) => {
    setChosen(id)
    speech.setPreferredVoice(id || null)
  }
  const tryVoice = () => {
    speech.stop()
    void speech.say('¡Hola! Soy Lumi. Seis por siete son cuarenta y dos.', { voice: 'lumi', interrupt: true })
  }

  if (!voices.length) return null
  return (
    <div className={adult.stack}>
      <label className={adult.muted} htmlFor="voice-picker">Voz de este dispositivo</label>
      <div className={adult.actions}>
        <select
          id="voice-picker"
          className={`${adult.input} ${adult.select}`}
          style={{ width: 'auto', minWidth: 220 }}
          value={chosen}
          onChange={(e) => pick(e.target.value)}
        >
          <option value="">Automática: voz natural de Repasitos (con internet) o la mejor del dispositivo</option>
          {voices.map((v) => (
            <option key={v.id} value={v.id}>{v.name}{v.local ? '' : ' (necesita internet)'}</option>
          ))}
        </select>
        <Button variant="secondary" size="sm" onClick={tryVoice}>Probar</Button>
      </div>
      <p className={adult.muted}>
        En iPad suena mucho mejor la voz mejorada: Ajustes del iPad → Accesibilidad → Contenido leído → Voces → Español
        (España) → descarga «Mónica (mejorada)» y elígela aquí.
      </p>
    </div>
  )
}
