/* Prueba inicial in the child report: the result by block (what the child already knows and what to work on) and
   a button to offer the test again on the next visit. Reads the placement attempts; writes only a progress flag. */
import { useEffect, useState } from 'react'
import { listAttempts, updateProgress } from '@/data'
import { summarizePlacement, type PlacementSummary } from '@/engine'
import type { ProgressState } from '@/types'
import { Button, toast } from '@/ui'
import { errorMessage } from '../shared/messages'
import { formatPercent } from '../shared/format'
import adult from '../shared/adult.module.css'
import s from './child.module.css'

export function PlacementCard({ childId, childName, progress }: { childId: string; childName: string; progress: ProgressState | null }) {
  const [summary, setSummary] = useState<PlacementSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requested = !!progress?.flags?.placementRequested

  useEffect(() => {
    let alive = true
    // Promise chain: a failing read shows inside this card and never takes the whole report down.
    Promise.resolve()
      .then(() => listAttempts(childId, { limit: 400 }))
      .then((list) => { if (alive) setSummary(summarizePlacement(list)) })
      .catch((e: unknown) => { if (alive) setError(errorMessage(e, 'No hemos podido leer la prueba inicial.')) })
    return () => { alive = false }
  }, [childId, progress?.updatedAt])

  const offer = async () => {
    setBusy(true)
    setError(null)
    try {
      await updateProgress(childId, (p) => ({ ...p, flags: { ...p.flags, placementRequested: true }, updatedAt: new Date().toISOString() }))
      toast(`Se le ofrecerá la prueba a ${childName} en su próxima visita.`)
    } catch (e) {
      setError(errorMessage(e, 'No hemos podido preparar la prueba. Inténtalo de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={adult.card} aria-labelledby="placement-title">
      <div className={adult.cardHead}>
        <h2 id="placement-title" className={adult.subheading}>Prueba inicial</h2>
        <span className={adult.muted}>{progress?.flags?.placement ? 'Hecha' : requested ? 'Pendiente de hacer' : 'Sin hacer'}</span>
      </div>
      <p className={adult.muted}>
        Unas diez preguntas por bloque, sin pistas ni aviso de acierto o fallo. Sirve de punto de partida: la sesión de cada día empieza donde está {childName}.
      </p>
      {error && <p className={adult.error} role="alert">{error}</p>}
      {!summary ? (
        <p className={adult.muted} role="status">Leyendo la prueba…</p>
      ) : summary.answered === 0 ? (
        <p className={adult.lead}>Todavía no se ha hecho.</p>
      ) : (
        <>
          {!summary.complete && <p className={adult.hint}>La última prueba quedó a medias ({summary.answered} de 14).</p>}
          <ul className={s.worldList} aria-label="Resultado por bloque">
            {summary.blocks.filter((b) => b.total > 0).map((b) => (
              <li key={b.id} className={s.worldItem}>
                <span className={s.worldName}>{b.label}</span>
                <span className={s.worldState}>{b.correct} de {b.total} · {formatPercent(b.total ? b.correct / b.total : 0)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className={adult.actions}>
        <Button variant="secondary" onClick={() => void offer()} disabled={busy || requested}>
          {requested ? 'Se ofrecerá en la próxima visita' : 'Volver a hacer la prueba'}
        </Button>
      </div>
    </section>
  )
}
