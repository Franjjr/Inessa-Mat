/* Lo que aprende, for the grown-ups (docs/curriculum/PLAN_DOCENTE.md §6): where the child is in the temario, what
   the mistakes say and what helps at home, and the tests (each prueba inicial and the recall of what was learnt
   weeks ago). The cards are pure (fixed data in the gallery); LearningSection reads the data and offers the test
   again. A failing read shows inside the section and never takes the whole report down. */
import { useEffect, useMemo, useState } from 'react'
import { getMastery, listAttempts, updateProgress } from '@/data'
import { syllabusForGrade } from '@/content/syllabus'
import { getWorld } from '@/content'
import {
  describeError, errorReport, placementRuns, recallReport, syllabusReport, PLACEMENT_COUNT,
  type ErrorReport, type PlacementRun, type RecallReport, type SyllabusReport, type TopicState,
} from '@/engine'
import type { AttemptRecord, MasteryMap, ProgressState } from '@/types'
import { Button, toast } from '@/ui'
import { errorMessage } from '../shared/messages'
import { formatDate, formatPercent, plural } from '../shared/format'
import adult from '../shared/adult.module.css'
import s from './child.module.css'

/** Enough history for the recall check and every prueba inicial, read from this device. */
const ATTEMPT_LIMIT = 5000

export function LearningSection({ childId, childName, grade, progress }: { childId: string; childName: string; grade?: number; progress: ProgressState | null }) {
  const [data, setData] = useState<{ mastery: MasteryMap; attempts: AttemptRecord[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const requested = !!progress?.flags?.placementRequested

  useEffect(() => {
    let alive = true
    Promise.resolve()
      .then(() => Promise.all([getMastery(childId), listAttempts(childId, { limit: ATTEMPT_LIMIT })]))
      .then(([mastery, attempts]) => { if (alive) setData({ mastery, attempts }) })
      .catch((e: unknown) => { if (alive) setError(errorMessage(e, 'No hemos podido leer lo que ha practicado.')) })
    return () => { alive = false }
  }, [childId, progress?.updatedAt])

  const reports = useMemo(() => {
    if (!data) return null
    const now = new Date()
    return {
      syllabus: syllabusReport(syllabusForGrade(grade), data.mastery),
      errors: errorReport(data.attempts, now),
      runs: placementRuns(data.attempts),
      recall: recallReport(data.attempts, now),
    }
  }, [data, grade])

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

  if (error && !reports) {
    return <section className={adult.card}><p className={adult.error} role="alert">{error}</p></section>
  }
  if (!reports) return <p className={adult.muted} role="status">Leyendo lo que ha practicado…</p>

  return (
    <>
      <TemarioCard report={reports.syllabus} childName={childName} />
      <MistakesCard report={reports.errors} childName={childName} />
      <TestsCard
        runs={reports.runs}
        recall={reports.recall}
        childName={childName}
        error={error}
        offer={{ requested, busy, onOffer: () => void offer() }}
      />
    </>
  )
}

// ------------------------------------------------------------------------------------------------ temario

const TERM_TEXT: Record<number, string> = { 1: '1.er trimestre', 2: '2.º trimestre', 3: '3.er trimestre' }

const STATE_TEXT: Record<TopicState, string> = {
  'dominado': 'Dominado',
  'trabajando': 'Trabajando',
  'sin-empezar': 'Sin empezar',
  'pendiente': 'Próximamente',
}

export function TemarioCard({ report, childName }: { report: SyllabusReport; childName: string }) {
  return (
    <section className={`${adult.card} ${adult.cardBlue}`} aria-labelledby="temario-title">
      <div className={adult.cardHead}>
        <h2 id="temario-title" className={adult.subheading}>Temario de {report.course}.º</h2>
        <span className={adult.muted}>{report.mastered} de {report.available} temas dominados</span>
      </div>
      <p className={adult.lead}>
        {report.current
          ? <>Ahora está con <strong className={adult.strong}>{report.current.topicName}</strong> ({report.current.blockName.toLowerCase()}). La sesión de cada día empieza por ahí y repasa lo anterior.</>
          : `${childName} domina todos los temas que ya se pueden practicar. La sesión de cada día repasa lo aprendido.`}
      </p>
      {report.current?.stage && (
        <p className={adult.muted}>
          Etapa {report.current.stage.number} de {report.current.stage.total} · {TERM_TEXT[report.current.stage.term]}
          {report.current.stage.worldId && getWorld(report.current.stage.worldId) ? ` · en la aventura, ${getWorld(report.current.stage.worldId)!.name}` : ''}.
          Seguimos un orden propio, en espiral: cada etapa mezcla números y operaciones con dinero, reloj, medidas{report.course >= 3 ? ', fracciones' : ''} o figuras.
        </p>
      )}
      <p className={adult.muted}>Un tema está dominado cuando acierta con soltura casi todos sus ejercicios, más de una vez.</p>
      <ul className={s.blockList} aria-label="Bloques del temario">
        {report.blocks.map((b) => (
          <li key={b.id}>
            <details className={s.block} open={b.topics.some((t) => t.current)}>
              <summary className={s.blockHead}>
                <span className={s.worldName}>{b.name}</span>
                <span className={s.blockCount}>{b.available === 0 ? 'Próximamente' : `${b.mastered} de ${b.available}`}</span>
                <span className={s.meter} aria-hidden>
                  <span className={s.meterFill} style={{ width: `${b.available ? (b.mastered / b.available) * 100 : 0}%` }} />
                </span>
              </summary>
              <ul className={s.topicList}>
                {b.topics.map((t) => (
                  <li key={t.id} className={s.topicItem}>
                    <span className={s.topicName}>{t.name}{t.current ? ' · ahora' : ''}</span>
                    <span className={`${s.topicState} ${s[`state-${t.state}`]}`}>
                      {STATE_TEXT[t.state]}
                      {t.state === 'trabajando' ? ` · ${formatPercent(t.progress)}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ mistakes

function trendText(count: number, previous: number): string | null {
  if (previous === 0) return null
  if (count === 0) return 'Ya no le pasa: el mes anterior sí.'
  if (count <= previous * 0.7) return `Va a menos (el mes anterior: ${previous}).`
  if (count >= previous * 1.3) return `Va a más (el mes anterior: ${previous}).`
  return `Parecido al mes anterior (${previous}).`
}

export function MistakesCard({ report, childName }: { report: ErrorReport; childName: string }) {
  const now = report.groups.filter((g) => g.count > 0)
  const gone = report.groups.filter((g) => g.count === 0)
  return (
    <section className={adult.card} aria-labelledby="mistakes-title">
      <div className={adult.cardHead}>
        <h2 id="mistakes-title" className={adult.subheading}>En qué falla</h2>
        <span className={adult.muted}>Último mes</span>
      </div>
      {report.answered === 0 ? (
        <p className={adult.lead}>Todavía no ha practicado en el último mes.</p>
      ) : now.length === 0 ? (
        <p className={adult.lead}>
          {plural(report.answered, 'respuesta', 'respuestas')} en el último mes y ningún error que destacar.
        </p>
      ) : (
        <>
          <p className={adult.muted}>
            {plural(report.wrong, 'fallo', 'fallos')} de {report.answered} respuestas ({formatPercent(report.wrong / report.answered)}).
            Los fallos de lectura de la letra no cuentan. Equivocarse es parte de aprender: lo útil es ver qué se repite.
          </p>
          <ul className={adult.list} aria-label="Tipos de fallo">
            {now.map((g, i) => {
              const trend = trendText(g.count, g.previous)
              return (
                <li key={g.id} className={s.mistake}>
                  <div className={s.mistakeHead}>
                    <span className={s.errorCount}>{g.count} {g.count === 1 ? 'vez' : 'veces'}</span>
                    <h3 className={s.mistakeTitle}>{g.label}</h3>
                  </div>
                  <p className={adult.lead} style={{ fontSize: 'var(--fs-sm)' }}>{g.meaning}</p>
                  {g.types.length > 1 && (
                    <p className={adult.muted}>{g.types.map((t) => `${describeError(t.errorType)} (${t.count})`).join(' · ')}</p>
                  )}
                  {trend && <p className={adult.muted}>{trend}</p>}
                  {i < 2 && <p className={s.advice}><strong>Qué ayuda:</strong> {g.advice}</p>}
                </li>
              )
            })}
          </ul>
          {gone.length > 0 && (
            <p className={adult.hint}>
              Ya no falla en: {gone.map((g) => g.label.toLowerCase()).join(', ')}. Buena señal: lo ha superado {childName}.
            </p>
          )}
        </>
      )}
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ tests

export function TestsCard({ runs, recall, childName, error, offer }: {
  runs: PlacementRun[]
  recall: RecallReport
  childName: string
  error?: string | null
  offer: { requested: boolean; busy: boolean; onOffer: () => void }
}) {
  const latest = runs[runs.length - 1] ?? null
  const first = runs.length > 1 ? runs[0] : null
  const blocks = latest ? latest.blocks.filter((b) => b.total > 0) : []
  return (
    <section className={adult.card} aria-labelledby="tests-title">
      <div className={adult.cardHead}>
        <h2 id="tests-title" className={adult.subheading}>Pruebas</h2>
        <span className={adult.muted}>{runs.length === 0 ? 'Sin hacer' : plural(runs.length, 'prueba inicial', 'pruebas iniciales')}</span>
      </div>

      <h3 className={s.mistakeTitle}>Prueba inicial</h3>
      <p className={adult.muted}>
        {PLACEMENT_COUNT} preguntas de todo el curso, sin pistas ni aviso de acierto o fallo. Marca el punto de partida.
        Si se repite pasadas unas semanas, se ve lo que ha avanzado {childName}.
      </p>
      {!latest ? (
        <p className={adult.lead}>Todavía no se ha hecho.</p>
      ) : (
        <>
          <p className={adult.lead}>
            {first ? 'La última, el' : 'Hecha el'} {formatDate(latest.startedAt)}: {latest.correct} de {latest.answered} bien
            {first ? `. La primera, el ${formatDate(first.startedAt)}: ${first.correct} de ${first.answered}.` : '.'}
          </p>
          {!latest.complete && <p className={adult.hint}>Quedó a medias ({latest.answered} de {PLACEMENT_COUNT}).</p>}
          <ul className={s.worldList} aria-label="Resultado por bloque">
            {blocks.map((b) => {
              const before = first?.blocks.find((x) => x.id === b.id)
              return (
                <li key={b.id} className={s.worldItem}>
                  <span className={s.worldName}>{b.label}</span>
                  <span className={s.worldState}>
                    {before && before.total > 0 ? `antes ${before.correct} de ${before.total} → ` : ''}{b.correct} de {b.total}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
      <div className={adult.actions}>
        <Button variant="secondary" onClick={offer.onOffer} disabled={offer.busy || offer.requested}>
          {offer.requested ? 'Se ofrecerá en la próxima visita' : latest ? 'Volver a hacer la prueba' : 'Ofrecer la prueba'}
        </Button>
      </div>
      {error && <p className={adult.error} role="alert">{error}</p>}

      <h3 className={`${s.mistakeTitle} ${s.subsection}`}>Recuerdo</h3>
      <p className={adult.muted}>
        Lo que de verdad importa: si lo que acertaba sigue sabiéndolo cuando vuelve a salir {recall.minDays} días o más después, sin pistas.
      </p>
      {recall.checked < 5 ? (
        <p className={adult.lead}>Aún no hay datos suficientes: aparecen tras unas semanas de práctica.</p>
      ) : (
        <p className={adult.lead}>
          Recuerda <strong className={adult.strong}>{formatPercent(recall.remembered / recall.checked)}</strong> ({recall.remembered} de {recall.checked} ejercicios
          que volvieron a salir en los últimos tres meses).
        </p>
      )}
    </section>
  )
}
