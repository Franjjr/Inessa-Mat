/* Classes of a school account: create and archive classes, share join codes, see each class. */
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { archiveClass, createClass, listClasses, regenerateJoinCode, useAuth } from '@/data'
import type { ClassRoom } from '@/types'
import { Button, Card, toast } from '@/ui'
import { AdultPage } from '../shared/AdultPage'
import { ConfirmModal } from '../shared/ConfirmModal'
import { TextField } from '../shared/Field'
import { errorMessage } from '../shared/messages'
import { plural } from '../shared/format'
import { copyText } from '../shared/clipboard'
import s from './school.module.css'
import adult from '../shared/adult.module.css'

export default function SchoolScreen() {
  const { activeOrg, status, backendAvailable } = useAuth()
  const navigate = useNavigate()
  const orgId = activeOrg?.id ?? null
  const isSchool = activeOrg?.kind === 'school'

  const [classes, setClasses] = useState<ClassRoom[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [action, setAction] = useState<{ kind: 'archive' | 'regenerate'; room: ClassRoom } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    const rows = await listClasses(orgId)
    setClasses(rows.filter((c) => !c.archivedAt))
  }, [orgId])

  useEffect(() => {
    if (!orgId || !isSchool) return
    let alive = true
    load().catch((e: unknown) => {
      if (alive) setLoadError(errorMessage(e, 'No hemos podido cargar las clases.'))
    })
    return () => {
      alive = false
    }
  }, [orgId, isSchool, load])

  if (!backendAvailable || status === 'local-only') {
    return (
      <AdultPage title="Clases" back="/adult" narrow>
        <section className={adult.card}>
          <h2 className={adult.subheading}>Las clases necesitan una cuenta de colegio</h2>
          <p className={adult.lead}>Inicia sesión o crea una cuenta para tu colegio. Así podrás crear clases y compartir sus códigos.</p>
          <div className={adult.actions}>
            <Button onClick={() => navigate('/signup')}>Crear cuenta</Button>
            <Button variant="secondary" onClick={() => navigate('/login')}>Iniciar sesión</Button>
          </div>
        </section>
      </AdultPage>
    )
  }

  if (!activeOrg || !isSchool) {
    return (
      <AdultPage title="Clases" back="/adult" narrow>
        <section className={adult.card}>
          <h2 className={adult.subheading}>Esta cuenta es familiar</h2>
          <p className={adult.lead}>
            Las clases son para cuentas de colegio. Si tu hijo va a un colegio que usa Repasitos, puedes unirlo a su clase
            con el código que te den.
          </p>
          <div className={adult.actions}>
            <Button onClick={() => navigate('/adult/join')}>Unirse a una clase</Button>
          </div>
        </section>
      </AdultPage>
    )
  }

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    const clean = name.trim()
    if (!clean) {
      setNameError('Escribe el nombre de la clase, por ejemplo «3.º B».')
      return
    }
    setNameError(null)
    setBusy(true)
    try {
      await createClass(activeOrg.id, clean, grade ? Number(grade) : null)
      setName('')
      setGrade('')
      await load()
      toast('Clase creada. Ya puedes compartir su código.')
    } catch (err) {
      setCreateError(errorMessage(err, 'No hemos podido crear la clase. Inténtalo de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!action) return
    setBusy(true)
    setActionError(null)
    try {
      if (action.kind === 'archive') {
        await archiveClass(action.room.id)
        toast(`Clase ${action.room.name} archivada`)
      } else {
        await regenerateJoinCode(action.room.id)
        toast('Código nuevo creado. El anterior ya no sirve.')
      }
      setAction(null)
      await load()
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const firstClass = classes?.[0]
  const familyMessage = firstClass
    ? `Familias de ${firstClass.name}: para unir a vuestro hijo a Repasitos, entrad en repasitos.es, elegid «Unirse a una clase» e introducid el código ${firstClass.joinCode}.`
    : 'Familias: para unir a vuestro hijo a Repasitos, entrad en repasitos.es, elegid «Unirse a una clase» e introducid el código de su clase.'

  return (
    <AdultPage title="Clases y colegio" back="/adult">
      <header className={adult.stack} style={{ gap: 6 }}>
        <h2 className={adult.heading}>{activeOrg.name}</h2>
        <p className={adult.lead}>
          Cada clase tiene un código. Compártelo solo con las familias de esa clase: así cada familia une a su hijo
          con su consentimiento.
        </p>
      </header>

      <section className={`${adult.card} ${adult.cardYellow}`} aria-labelledby="guide-title">
        <h2 id="guide-title" className={adult.subheading}>Tres pasos para empezar</h2>
        <ol className={s.steps}>
          <li>
            <span className={s.stepNum} aria-hidden>1</span>
            <div className={adult.stack} style={{ gap: 2 }}>
              <span className={adult.strong}>Crea la clase</span>
              <span className={adult.muted}>Escribe su nombre y su curso, por ejemplo «3.º B».</span>
            </div>
          </li>
          <li>
            <span className={s.stepNum} aria-hidden>2</span>
            <div className={adult.stack} style={{ gap: 2 }}>
              <span className={adult.strong}>Copia su código</span>
              <span className={adult.muted}>Cada clase tiene un código. Pulsa «Copiar» en su tarjeta, más abajo.</span>
            </div>
          </li>
          <li>
            <span className={s.stepNum} aria-hidden>3</span>
            <div className={adult.stack} style={{ gap: 6, minWidth: 0 }}>
              <span className={adult.strong}>Pégalo en la agenda o en un mensaje a las familias</span>
              <pre className={s.template} aria-label="Mensaje para las familias">{familyMessage}</pre>
              <div>
                <Button variant="secondary" size="sm" onClick={() => void copyText(familyMessage).then((ok) => toast(ok ? 'Mensaje copiado' : 'Selecciona el texto y cópialo a mano'))}>
                  Copiar el mensaje
                </Button>
              </div>
            </div>
          </li>
        </ol>
      </section>

      <section className={adult.card} aria-labelledby="new-class-title">
        <h2 id="new-class-title" className={adult.subheading}>Crear una clase</h2>
        <form className={s.createRow} onSubmit={create} noValidate>
          <TextField
            id="class-name" label="Nombre de la clase" value={name} maxLength={40}
            onChange={(e) => setName(e.target.value)} error={nameError}
          />
          <div className={adult.field}>
            <label htmlFor="class-grade" className={adult.label}>Curso</label>
            <select id="class-grade" className={`${adult.input} ${adult.select}`} value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">Sin curso</option>
              {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>{g}.º de Primaria</option>)}
            </select>
          </div>
          <Button type="submit" disabled={busy}>{busy ? 'Creando…' : 'Crear clase'}</Button>
        </form>
        {createError && <p className={adult.error} role="alert">{createError}</p>}
      </section>

      {loadError && <p className={adult.error} role="alert">{loadError}</p>}

      <section aria-labelledby="classes-title" className={adult.stack}>
        <div className={adult.cardHead}>
          <h2 id="classes-title" className={adult.subheading}>Tus clases</h2>
          {classes && <span className={adult.muted}>{plural(classes.length, 'clase', 'clases')}</span>}
        </div>
        {classes && classes.length === 0 && (
          <Card><p className={adult.lead}>Todavía no tienes clases. Crea la primera arriba.</p></Card>
        )}
        <div className={s.classGrid}>
          {classes?.map((room) => (
            <article key={room.id} className={s.classCard} aria-label={`Clase ${room.name}`}>
              <div className={adult.cardHead}>
                <h3 className={s.classTitle}>{room.name}</h3>
                {room.grade && <span className={adult.muted}>{room.grade}.º</span>}
              </div>
              <div className={adult.stack} style={{ gap: 6 }}>
                <span className={adult.label}>Código para las familias</span>
                <div className={s.codeBox}>
                  <span className={adult.code} aria-label={`Código ${room.joinCode.split('').join(' ')}`}>{room.joinCode}</span>
                  <Button variant="secondary" size="sm" onClick={() => void copyText(room.joinCode).then((ok) => toast(ok ? 'Código copiado' : 'Copia el código a mano'))}>
                    Copiar
                  </Button>
                </div>
              </div>
              <div className={adult.actions}>
                <Button onClick={() => navigate(`/adult/class/${room.id}`)}>Ver la clase</Button>
                <Button variant="ghost" size="sm" onClick={() => { setActionError(null); setAction({ kind: 'regenerate', room }) }}>Nuevo código</Button>
                <Button variant="ghost" size="sm" onClick={() => { setActionError(null); setAction({ kind: 'archive', room }) }}>Archivar</Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ConfirmModal
        open={action !== null}
        title={action?.kind === 'archive' ? `¿Archivar ${action.room.name}?` : `¿Crear un código nuevo para ${action?.room.name ?? ''}?`}
        confirmLabel={action?.kind === 'archive' ? 'Archivar' : 'Crear código nuevo'}
        danger={action?.kind === 'archive'}
        busy={busy}
        error={actionError}
        onConfirm={() => void confirm()}
        onCancel={() => setAction(null)}
      >
        <p className={adult.lead}>
          {action?.kind === 'archive'
            ? 'La clase dejará de aparecer aquí y las familias ya no podrán unirse con su código. El progreso de los alumnos se conserva.'
            : 'El código actual dejará de funcionar. Tendrás que compartir el nuevo con las familias que lo necesiten.'}
        </p>
      </ConfirmModal>
    </AdultPage>
  )
}
