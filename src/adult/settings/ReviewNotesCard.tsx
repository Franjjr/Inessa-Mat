/* The answers the app marked wrong on this device, newest first, for a grown-up to check. A right answer marked
   wrong is a bug in the app: the adult can export the list (a JSON file) and send it, or delete it.
   A handwritten answer shows the child's ink, digit by digit, next to «la app leyó 47»: a misread is easy to spot. */
import { useEffect, useState } from 'react'
import { clearWrongAnswerNotes, listWrongAnswerNotes, type WrongAnswerNote } from '@/data'
import { decodeImage28 } from '@/ink/readLog'
import { Button, toast } from '@/ui'
import { ConfirmModal } from '../shared/ConfirmModal'
import { downloadBlob } from '../shared/download'
import { errorMessage } from '../shared/messages'
import { plural } from '../shared/format'
import { formatWrongAnswer, wrongAnswerExport } from './reviewNotes'
import s from './settings.module.css'
import adult from '../shared/adult.module.css'
import inkCss from './ReviewNotesInk.module.css'

/** One digit as the recogniser saw it (28×28, dark ink on a light square). */
function InkThumb({ image, label }: { image: string; label: string }) {
  const px = decodeImage28(image)
  if (px.length !== 784) return null
  const cells = []
  for (let i = 0; i < 784; i++) {
    const v = px[i]
    if (v > 0.08) cells.push(<rect key={i} x={i % 28} y={Math.floor(i / 28)} width={1} height={1} fillOpacity={Math.min(1, v)} />)
  }
  return (
    <svg className={inkCss.thumb} viewBox="0 0 28 28" width={28} height={28} role="img" aria-label={label}>
      <rect width={28} height={28} className={inkCss.thumbBg} />
      <g className={inkCss.thumbInk}>{cells}</g>
    </svg>
  )
}

/** «la app leyó 47» (the number as it was graded) with the ink of each digit read, and whether one digit would have
 *  made it right. The digits are listed apart, in the order they are on screen: a carry or a partial row never
 *  changes the number shown. */
function InkReadingLine({ note }: { note: WrongAnswerNote }) {
  const ink = note.ink
  if (!ink?.digits.length) return null
  const digits = ink.digits.map((d) => d.digit).join(' ')
  return (
    <span className={inkCss.line}>
      <span className={inkCss.thumbs}>
        {ink.digits.map((d, i) =>
          d.image28 ? <InkThumb key={i} image={d.image28} label={`Trazo de la cifra ${i + 1}, leída como ${d.digit}`} /> : null)}
      </span>
      <span>
        la app leyó {note.given || '(nada)'}
        {ink.digits.some((d) => d.doubtful && !d.confirmed) ? ' (con dudas)' : ''}
        {ink.oneDigitFix ? ' · cambiando una cifra estaría bien' : ''}
        <span className={inkCss.digits}> · cifras escritas a mano: {digits}</span>
      </span>
    </span>
  )
}

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
        Si ves una respuesta que estaba bien y la app la marcó mal, descarga el archivo y compártelo con quien mantiene la app. Así podemos corregir las respuestas que la app marca mal.
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
              <li key={n.seq ?? `${n.at}-${n.given}`} className={s.reviewItem}>
                {formatWrongAnswer(n)}
                <InkReadingLine note={n} />
              </li>
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
        confirmLabel="Sí, borrar"
        danger
        busy={busy}
        error={actionError}
        onConfirm={() => void clear()}
        onCancel={() => setConfirmOpen(false)}
      >
        <p className={adult.lead}>
          {count === 1 ? 'Se borrará 1 respuesta' : `Se borrarán ${count} respuestas`} de este dispositivo.
          No se puede deshacer. Descarga el archivo antes si quieres conservarlo.
        </p>
      </ConfirmModal>
    </section>
  )
}
