/* One class: the class heatmap, each pupil's progress, removing a pupil from the class, and assignments. */
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { createAssignment, getClassOverview, listAssignments, removeEnrollment, useAuth } from '@/data'
import { describeSkill } from '@/engine'
import type { Assignment, ClassOverview } from '@/types'
import { Button, toast } from '@/ui'
import { AdultPage } from '../shared/AdultPage'
import { ConfirmModal } from '../shared/ConfirmModal'
import { FactHeatmap, FactLegend } from '../shared/FactHeatmap'
import { averageGrid, countFactStates } from '../shared/heatmap'
import { hardestTable, struggleCount } from '../shared/reading'
import { errorMessage } from '../shared/messages'
import { formatDate, formatMinutes, formatPercent, formatRelative, plural } from '../shared/format'
import { copyText } from '../shared/clipboard'
import { ASSIGNMENT_PRESETS, presetSelector } from './presets'
import { TextField } from '../shared/Field'
import s from './school.module.css'
import adult from '../shared/adult.module.css'

export default function ClassScreen() {
  const { classId = '' } = useParams()
  const { status } = useAuth()
  const [overview, setOverview] = useState<ClassOverview | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<{ id: string; nickname: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [order, setOrder] = useState<'need' | 'arrival'>('need')

  const [title, setTitle] = useState('')
  const [preset, setPreset] = useState(ASSIGNMENT_PRESETS[0]!.id)
  const [due, setDue] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [ov, tasks] = await Promise.all([getClassOverview(classId), listAssignments(classId)])
    setOverview(ov)
    setAssignments(tasks)
  }, [classId])

  useEffect(() => {
    if (!classId || status !== 'signed-in') return
    let alive = true
    load().catch((e: unknown) => {
      if (alive) setLoadError(errorMessage(e, 'No hemos podido cargar esta clase.'))
    })
    return () => {
      alive = false
    }
  }, [classId, status, load])

  if (status !== 'signed-in') {
    return (
      <AdultPage title="Clase" back="/adult/school" narrow>
        <section className={adult.card}><p className={adult.lead}>Inicia sesión para ver esta clase.</p></section>
      </AdultPage>
    )
  }

  if (loadError) {
    return (
      <AdultPage title="Clase" back="/adult/school" narrow>
        <section className={adult.card}><p className={adult.error} role="alert">{loadError}</p></section>
      </AdultPage>
    )
  }

  if (!overview) {
    return <AdultPage title="Clase" back="/adult/school"><p className={adult.muted} role="status">Cargando la clase…</p></AdultPage>
  }

  const { classRoom: room, children } = overview
  const classGrid = averageGrid(children.map((c) => c.factGrid))
  const classCounts = countFactStates(classGrid)
  const notThisWeek = children.filter((c) => c.minutesLast7Days === 0).length
  const hard = hardestTable(classGrid)
  const synthesis = [
    notThisWeek === 0
      ? 'Todos han practicado esta semana.'
      : `Esta semana, ${plural(notThisWeek, 'alumno', 'alumnos')} ${notThisWeek === 1 ? 'no ha' : 'no han'} practicado.`,
    hard ? `La tabla del ${hard} es la que más les cuesta.` : 'Ahora mismo no hay tablas para repasar en la clase.',
  ].join(' ')
  // Pupils who need the most review come first; "arrival" keeps the order the server returns.
  const pupils = order === 'need'
    ? [...children].sort((x, y) => struggleCount(y.factGrid) - struggleCount(x.factGrid) || x.minutesLast7Days - y.minutesLast7Days)
    : children

  const remove = async () => {
    if (!removing) return
    setBusy(true)
    setRemoveError(null)
    try {
      await removeEnrollment(room.id, removing.id)
      setRemoving(null)
      toast(`${removing.nickname} ya no está en la clase`)
      await load()
    } catch (e) {
      setRemoveError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const assign = async (e: FormEvent) => {
    e.preventDefault()
    setAssignError(null)
    const clean = title.trim()
    if (!clean) {
      setTitleError('Escribe un título, por ejemplo «Tablas del 7 esta semana».')
      return
    }
    setTitleError(null)
    const selector = presetSelector(preset)
    if (!selector) {
      setAssignError('Elige una práctica de la lista.')
      return
    }
    setBusy(true)
    try {
      await createAssignment({
        classId: room.id,
        title: clean,
        selector,
        startsAt: new Date().toISOString(),
        dueAt: due ? new Date(`${due}T23:59:59`).toISOString() : null,
      })
      setTitle('')
      setDue('')
      toast('Misión asignada a la clase')
      await load()
    } catch (err) {
      setAssignError(errorMessage(err, 'No hemos podido asignar la práctica. Inténtalo de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdultPage title={room.name} back="/adult/school">
      <header className={s.kpis} style={{ alignItems: 'center', gap: 12 }}>
        <h2 className={adult.heading}>{room.name}</h2>
        {room.grade && <span className={adult.muted}>{room.grade}.º de Primaria</span>}
        <span className={adult.spacer} />
        <span className={adult.label}>Código</span>
        <span className={adult.code}>{room.joinCode}</span>
        <Button variant="secondary" size="sm" onClick={() => void copyText(room.joinCode).then((ok) => toast(ok ? 'Código copiado' : 'Copia el código a mano'))}>
          Copiar
        </Button>
      </header>

      {children.length > 0 && (
        <section className={`${adult.card} ${adult.cardYellow}`} aria-labelledby="class-summary-title">
          <h2 id="class-summary-title" className={adult.subheading}>Esta semana en la clase</h2>
          <p className={adult.lead}>{synthesis}</p>
        </section>
      )}

      <section className={`${adult.card} ${adult.cardGreen}`} aria-labelledby="class-heat-title">
        <div className={adult.stack} style={{ gap: 4 }}>
          <h2 id="class-heat-title" className={adult.subheading}>Tablas de la clase</h2>
          <p className={adult.muted}>
            Media de {plural(children.length, 'alumno', 'alumnos')}. Cada casilla muestra el estado medio de esa multiplicación.
          </p>
        </div>
        {children.length === 0 ? (
          <p className={adult.lead}>Todavía no hay alumnos en esta clase. Comparte el código {room.joinCode} con las familias.</p>
        ) : (
          <>
            <FactLegend />
            <FactHeatmap triangle grid={classGrid} label={`Mapa de las tablas de la clase ${room.name}`} />
            <p className={adult.hint}>
              Dominadas en la clase: {classCounts.mastered} de 55 · Para repasar: {classCounts.struggling} · Sin practicar: {classCounts.unseen}
            </p>
          </>
        )}
      </section>

      <section className={adult.card} aria-labelledby="pupils-title">
        <div className={adult.cardHead}>
          <h2 id="pupils-title" className={adult.subheading}>Alumnos</h2>
          {children.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => setOrder((o) => (o === 'need' ? 'arrival' : 'need'))}>
              {order === 'need' ? 'Ver por orden de llegada' : 'Ordenar por necesidad de repaso'}
            </Button>
          )}
        </div>
        {children.length === 0 ? (
          <p className={adult.muted}>Cuando una familia una a su hijo con el código, aparecerá aquí.</p>
        ) : (
          <ul className={s.childList} aria-label="Alumnos de la clase">
            {pupils.map((c) => {
              const mastered = countFactStates(c.factGrid).mastered
              return (
                <li key={c.childId} className={s.childRow}>
                  <div className={adult.stack} style={{ gap: 4, minWidth: 0 }}>
                    <span className={s.childName}>{c.nickname}</span>
                    <div className={s.kpis}>
                      <span>{mastered} de 55 dominadas</span>
                      <span>{formatMinutes(c.minutesLast7Days)} esta semana</span>
                      <span>{formatPercent(c.accuracyLast7Days)} de aciertos</span>
                      <span>{formatRelative(c.lastPlayedAt)}</span>
                    </div>
                  </div>
                  <div className={s.mini}>
                    <FactHeatmap compact triangle grid={c.factGrid} label={`Tablas de ${c.nickname}`} />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setRemoveError(null); setRemoving({ id: c.childId, nickname: c.nickname }) }}>
                    Quitar
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className={adult.card} aria-labelledby="assign-title">
        <div className={adult.stack} style={{ gap: 4 }}>
          <h2 id="assign-title" className={adult.subheading}>Misiones para la clase</h2>
          <p className={adult.muted}>Se muestran a cada alumno como «la misión de tu profe». Puedes ponerles fecha límite.</p>
        </div>
        {assignments.length === 0 ? (
          <p className={adult.muted}>Todavía no hay misiones.</p>
        ) : (
          <div>
            {assignments.map((a) => (
              <div key={a.id} className={s.assignment}>
                <div className={adult.stack} style={{ gap: 2, minWidth: 0 }}>
                  <span className={adult.strong}>{a.title}</span>
                  <span className={adult.muted}>{describeAssignment(a)}</span>
                </div>
                <span className={adult.muted}>{a.dueAt ? `Hasta el ${formatDate(a.dueAt)}` : 'Sin fecha límite'}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={assign} noValidate className={adult.stack} aria-label="Nueva misión">
          <TextField
            id="assign-title-input" label="Título de la misión" value={title} maxLength={80}
            onChange={(e) => setTitle(e.target.value)} error={titleError}
            hint="Por ejemplo: «Tablas del 7 esta semana»."
          />
          <div className={s.createRow}>
            <div className={adult.field}>
              <label htmlFor="assign-preset" className={adult.label}>Práctica</label>
              <select id="assign-preset" className={`${adult.input} ${adult.select}`} value={preset} onChange={(e) => setPreset(e.target.value)}>
                {ASSIGNMENT_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div className={adult.field}>
              <label htmlFor="assign-due" className={adult.label}>Fecha límite (opcional)</label>
              <input id="assign-due" type="date" className={adult.input} value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy}>{busy ? 'Asignando…' : 'Asignar'}</Button>
          </div>
          {assignError && <p className={adult.error} role="alert">{assignError}</p>}
        </form>
      </section>

      <ConfirmModal
        open={removing !== null}
        title={`¿Quitar a ${removing?.nickname ?? ''} de la clase?`}
        confirmLabel="Quitar de la clase"
        danger
        busy={busy}
        error={removeError}
        onConfirm={() => void remove()}
        onCancel={() => setRemoving(null)}
      >
        <p className={adult.lead}>
          Dejará de recibir las misiones de la clase. Sus datos de juego no se borran, y su familia puede volver a unirlo con el código.
        </p>
      </ConfirmModal>
    </AdultPage>
  )
}

function describeAssignment(a: Assignment): string {
  const skills = a.selector.skills ?? []
  if (skills.length === 0) return 'Práctica general'
  const names = skills.slice(0, 3).map((k) => describeSkill(k))
  return skills.length > 3 ? `${names.join(', ')} y más` : names.join(', ')
}
