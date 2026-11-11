/* The answers the app marked wrong on this device, newest first, for a grown-up to check. A right answer marked
   wrong is a bug in the app: the adult can export the list (a JSON file) and send it, or delete it. */
import { useEffect, useState } from 'react'
import { clearWrongAnswerNotes, listWrongAnswerNotes, type WrongAnswerNote } from '@/data'
import { Button, toast } from '@/ui'
import { ConfirmModal } from '../shared/ConfirmModal'
import { downloadBlob } from '../shared/download'
import { errorMessage } from '../shared/messages'
import { plural } from '../shared/format'
import { formatWrongAnswer, wrongAnswerExport } from './reviewNotes'
import s from './settings.module.css'
import adult from '../shared/adult.module.css'

export function ReviewNotesCard() {
  const [notes, setNotes] = useState<WrongAnswerNote[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const reload = async () => {
    try {
      setNotes(await listWrongAnswerNotes())
      setLoadError(null)
    } catch (e) {
      setLoadError(errorMessage(e, 'No hemos podido leer las respuestas guardadas.'))
    }
  }

  useEffect(() => {
    let alive = true
    listWrongAnswerNotes()
      .then((rows) => {
        if (alive) setNotes(rows)
      })
      .catch((e: unknown) => {
        if (alive) setLoadError(errorMessage(e, 'No hemos podido leer las respuestas guardadas.'))
      })
    return () => {
      alive = false
    }
  }, [])

  const exportNotes = () => {
    if (!notes?.length) return
    const day = new Date().toISOString().slice(0, 10)
    downloadBlob(new Blob([wrongAnswerExport(notes)], { type: 'application/json' }), `repasitos-respuestas-marcadas-${day}.json`)
    toast('Archivo descargado')
  }

  const clear = async () => {
    setBusy(true)
    setActionError(null)
    try {
      await clearWrongAnswerNotes()
      setConfirmOpen(false)
      toast('Respuestas borradas de este dispositivo')
      await reload()
    } catch (e) {
      setActionError(errorMessage(e, 'No hemos podido borrar las respuestas. Inténtalo de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  const count = notes?.length ?? 0

  return (
    <section className={adult.card} aria-labelledby="review-notes-title">
      <h2 id="review-notes-title" className={adult.subheading}>Respuestas marcadas como mal</h2>
      <p className={adult.lead}>
        Si ves una respuesta que estaba bien y la app la marcó mal, avísanos: así arreglamos fallos como el de la resta.
      </p>
      <p className={adult.muted}>
        Se guardan solo en este dispositivo, sin nombres. Se borran al eliminar un perfil.
      </p>

      {loadError && <p className={adult.error} role="alert">{loadError}</p>}

      {notes && count === 0 && (
        <p className={adult.muted} role="status">Todavía no hay respuestas marcadas como mal en este dispositivo.</p>
      )}

      {notes && count > 0 && (
        <>
          <p className={adult.muted}>{plural(count, 'respuesta', 'respuestas')}, las más recientes primero.</p>
          <ol className={s.reviewList} aria-label="Respuestas marcadas como mal">
            {notes.map((n) => (
              <li key={n.seq ?? `${n.at}-${n.given}`} className={s.reviewItem}>{formatWrongAnswer(n)}</li>
            ))}
          </ol>
        </>
      )}

      <div className={adult.actions}>
        <Button variant="secondary" size="sm" onClick={exportNotes} disabled={!count}>Descargar como archivo</Button>
        <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)} disabled={!count || busy}>Borrar el registro</Button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="¿Borrar las respuestas marcadas como mal?"
        confirmLabel="Sí, borrarlas"
        danger
        busy={busy}
        error={actionError}
        onConfirm={() => void clear()}
        onCancel={() => setConfirmOpen(false)}
      >
        <p className={adult.lead}>
          Se borrarán las {count} de este dispositivo. No se puede deshacer. Descárgalas antes si las quieres guardar.
        </p>
      </ConfirmModal>
    </section>
  )
}
