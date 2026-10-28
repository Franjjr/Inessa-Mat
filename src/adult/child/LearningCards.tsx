/* Lo que aprende, for the grown-ups (docs/curriculum/PLAN_DOCENTE.md §6): where the child is in the temario, what
   the mistakes say and what helps at home, and the tests (each prueba inicial and the recall of what was learnt
   weeks ago). Maths is LearningSection; Lengua is LenguaSection (its own temario, mistakes, placement, readings and
   minutes), shown only when Lengua is on for the child or has Lengua attempts. Each section reads only its subject's
   rows. The cards are pure (fixed data in the gallery); the sections read the data and offer the test again. A failing
   read shows inside the section and never takes the whole report down. */
import { useEffect, useMemo, useState } from 'react'
import { getMastery, listAttempts, listSessions, updateProgress } from '@/data'
import { syllabusFor, syllabusForGrade } from '@/content/syllabus'
import { STORY_READINGS } from '@/content/lengua/stories'
import { getWorld, seasonIdForGrade } from '@/content'
import {
  attemptsOf, describeError, errorReport, minutesOfSubject, placementFlags, placementRuns, recallReport, storyFlag, syllabusReport, topicNeeds,
  LENGUA_PLACEMENT_COUNT, PLACEMENT_COUNT, type ErrorReport, type LessonSubject, type PlacementRun, type RecallReport, type SyllabusReport,
  type TopicNeeds, type TopicState,
} from '@/engine'
import type { AttemptRecord, MasteryMap, ProgressState, ReadingDef, SessionRecord } from '@/types'
import { Button, toast } from '@/ui'
import { errorMessage } from '../shared/messages'
import { formatDate, formatMinutes, formatPercent, plural } from '../shared/format'
import adult from '../shared/adult.module.css'
import s from './child.module.css'

/** Enough history for the recall check and every prueba inicial, read from this device. */
const ATTEMPT_LIMIT = 5000
const DAY_MS = 24 * 60 * 60 * 1000

/** Element ids are unique on the page: Lengua's cards carry a `lengua-` prefix, maths keeps the original ids. */
const idOf = (subject: LessonSubject, name: string) => `${subject === 'language' ? 'lengua-' : ''}${name}`

export interface LearningData { mastery: MasteryMap; attempts: AttemptRecord[]; sessions: SessionRecord[] }

/** The mastery, the attempts (newest first) and the sessions of the last week, read from this device once for the whole
    report: both sections take this one read (`data`, `loadError`). */
export function useLearningData(childId: string, progressUpdatedAt?: string): { data: LearningData | null; error: string | null } {
  const [data, setData] = useState<LearningData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const since = new Date(Date.now() - 7 * DAY_MS).toISOString()
    Promise.resolve()
      .then(() => Promise.all([getMastery(childId), listAttempts(childId, { limit: ATTEMPT_LIMIT }), listSessions(childId, { since })]))
      .then(([mastery, attempts, sessions]) => { if (alive) setData({ mastery, attempts, sessions }) })
      .catch((e: unknown) => { if (alive) setError(errorMessage(e, 'No hemos podido leer lo que ha practicado.')) })
    return () => { alive = false }
  }, [childId, progressUpdatedAt])

  return { data, error }
}

/** Asks for the subject's prueba inicial again on the child's next visit. */
async function requestPlacement(childId: string, subject: LessonSubject): Promise<void> {
  await updateProgress(childId, (p) => ({ ...p, flags: { ...p.flags, [placementFlags(subject).requested]: true }, updatedAt: new Date().toISOString() }))
}

/** The offer of a subject's prueba inicial: busy while it is sent, and the error («Ofrecer la prueba») if it fails. */
function useOfferPlacement(childId: string, childName: string, subject: LessonSubject, requested: boolean) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const onOffer = async () => {
    setBusy(true)
    setError(null)
    try {
      await requestPlacement(childId, subject)
      toast(subject === 'language'
        ? `Se le ofrecerá la prueba de Lengua a ${childName} en su próxima visita.`
        : `Se le ofrecerá la prueba a ${childName} en su próxima visita.`)
    } catch (e) {
      setError(errorMessage(e, 'No hemos podido preparar la prueba. Inténtalo de nuevo.'))
    } finally {
      setBusy(false)
    }
  }
  return { error, offer: { requested, busy, onOffer: () => void onOffer() } }
}

export function LearningSection({ childId, childName, grade, progress, data, loadError }: {
  childId: string; childName: string; grade?: number; progress: ProgressState | null; data: LearningData | null; loadError: string | null
}) {
  const { error, offer } = useOfferPlacement(childId, childName, 'math', !!progress?.flags?.[placementFlags('math').requested])

  const reports = useMemo(() => {
    if (!data) return null
    const now = new Date()
    return {
      syllabus: syllabusReport(syllabusForGrade(grade), data.mastery),
      needs: topicNeeds(syllabusForGrade(grade), data.attempts, now),
      errors: errorReport(data.attempts, now),
      runs: placementRuns(data.attempts),
      recall: recallReport(data.attempts, now),
    }
  }, [data, grade])

  if (loadError && !reports) {
    return <section className={adult.card}><p className={adult.error} role="alert">{loadError}</p></section>
  }
  if (!reports) return <p className={adult.muted} role="status">Leyendo lo que ha practicado…</p>

  return (
    <>
      <TemarioCard report={reports.syllabus} needs={reports.needs} childName={childName} />
      <MistakesCard report={reports.errors} childName={childName} />
      <TestsCard
        runs={reports.runs}
        count={PLACEMENT_COUNT}
        recall={reports.recall}
        childName={childName}
        error={error}
        offer={offer}
      />
    </>
  )
}

/** Lengua for the grown-ups. Shown when Lengua is on for the child (`enabled`) or the child has Lengua attempts; otherwise nothing. */
export function LenguaSection({ childId, childName, grade, enabled, progress, data, loadError }: {
  childId: string; childName: string; grade?: number; enabled: boolean; progress: ProgressState | null
  data: LearningData | null; loadError: string | null
}) {
  const { error, offer } = useOfferPlacement(childId, childName, 'language', !!progress?.flags?.[placementFlags('language').requested])

  const reports = useMemo(() => {
    if (!data) return null
    const now = new Date()
    const syllabus = syllabusFor('language', grade)
    const attempts = attemptsOf(data.attempts, 'language')
    return {
      attempts: attempts.length,
      syllabus: syllabusReport(syllabus, data.mastery, 'language'),
      needs: topicNeeds(syllabus, data.attempts, now, 30, 'language'),
      errors: errorReport(data.attempts, now, 30, 'language'),
      runs: placementRuns(data.attempts, 'language'),
      minutes: minutesOfSubject(data.sessions, 'language'),
      read: STORY_READINGS.filter((r) => progress?.flags?.[storyFlag(r.id)]),
    }
  }, [data, grade, progress])

  // Not on for the child: nothing until the data says the child has Lengua attempts.
  if (!data) {
    if (!enabled) return null
    if (loadError) return <section className={adult.card}><p className={adult.error} role="alert">{loadError}</p></section>
    return <p className={adult.muted} role="status">Leyendo lo que ha practicado en Lengua…</p>
  }
  if (!reports || (!enabled && reports.attempts === 0)) return null

  return (
    <>
      {reports.syllabus.blocks.length > 0 && <TemarioCard subject="language" report={reports.syllabus} needs={reports.needs} childName={childName} />}
      <MistakesCard subject="language" report={reports.errors} childName={childName} />
      <TestsCard
        subject="language"
        runs={reports.runs}
        count={LENGUA_PLACEMENT_COUNT}
        childName={childName}
        error={error}
        offer={offer}
      />
      <ReadingCard read={reports.read} total={STORY_READINGS.length} minutes={reports.minutes} />
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

export function TemarioCard({ report, needs, childName, subject = 'math' }: {
  report: SyllabusReport; needs: Record<string, TopicNeeds>; childName: string; subject?: LessonSubject
}) {
  const lengua = subject === 'language'
  // The stage's world in the adventure of the course (2.º plays its own season on the same maps; Lengua has no adventure).
  const stageId = lengua ? undefined : report.current?.stage?.worldId
  const stageWorld = stageId ? getWorld(stageId, seasonIdForGrade(report.course)) : undefined
  return (
    <section className={`${adult.card} ${adult.cardBlue}`} aria-labelledby={idOf(subject, 'temario-title')}>
      <div className={adult.cardHead}>
        <h2 id={idOf(subject, 'temario-title')} className={adult.subheading}>
          {lengua ? `Temario de Lengua de ${report.course}.º` : `Temario de ${report.course}.º`}
        </h2>
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
          {stageWorld ? ` · en la aventura, ${stageWorld.name}` : ''}.
          {lengua
            ? ' Las etapas van de lo fácil a lo difícil, y cada tema vuelve a repasarse en la sesión de cada día.'
            : <> Seguimos un orden propio, en espiral: cada etapa mezcla números y operaciones con dinero, reloj, medidas{report.course >= 3 ? ', fracciones' : ''} o figuras.</>}
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
                    {needs[t.id] && (needs[t.id].dontKnow > 0 || needs[t.id].retried > 0) && (
                      <span className={s.topicNeeds}>
                        <span>No lo sabía: {needs[t.id].dontKnow}</span>
                        <span>Necesitó otro intento: {needs[t.id].retried}</span>
                      </span>
                    )}
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

export function MistakesCard({ report, childName, subject = 'math' }: { report: ErrorReport; childName: string; subject?: LessonSubject }) {
  const now = report.groups.filter((g) => g.count > 0)
  const gone = report.groups.filter((g) => g.count === 0)
  return (
    <section className={adult.card} aria-labelledby={idOf(subject, 'mistakes-title')}>
      <div className={adult.cardHead}>
        <h2 id={idOf(subject, 'mistakes-title')} className={adult.subheading}>{subject === 'language' ? 'En qué falla en Lengua' : 'En qué falla'}</h2>
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

export function TestsCard({ runs, count, subject = 'math', recall, childName, error, offer }: {
  runs: PlacementRun[]
  /** Questions in one prueba inicial of this subject. */
  count: number
  subject?: LessonSubject
  /** Maths only: the recall check. Lengua has none yet. */
  recall?: RecallReport
  childName: string
  error?: string | null
  offer: { requested: boolean; busy: boolean; onOffer: () => void }
}) {
  const latest = runs[runs.length - 1] ?? null
  const first = runs.length > 1 ? runs[0] : null
  const blocks = latest ? latest.blocks.filter((b) => b.total > 0) : []
  const intro = subject === 'language'
    ? `${count} preguntas de gramática, ortografía y vocabulario, sin pistas ni aviso de acierto o fallo. No hay lectura ni dictado. Marca el punto de partida.`
    : `${count} preguntas de todo el curso, sin pistas ni aviso de acierto o fallo. Marca el punto de partida.`
  return (
    <section className={adult.card} aria-labelledby={idOf(subject, 'tests-title')}>
      <div className={adult.cardHead}>
        <h2 id={idOf(subject, 'tests-title')} className={adult.subheading}>{subject === 'language' ? 'Prueba inicial de Lengua' : 'Pruebas'}</h2>
        <span className={adult.muted}>{runs.length === 0 ? 'Sin hacer' : plural(runs.length, 'prueba inicial', 'pruebas iniciales')}</span>
      </div>

      {recall && <h3 className={s.mistakeTitle}>Prueba inicial</h3>}
      <p className={adult.muted}>
        {intro} Si se repite pasadas unas semanas, se ve lo que ha avanzado {childName}.
      </p>
      {!latest ? (
        <p className={adult.lead}>Todavía no se ha hecho.</p>
      ) : (
        <>
          <p className={adult.lead}>
            {first ? 'La última, el' : 'Hecha el'} {formatDate(latest.startedAt)}: {latest.correct} de {latest.answered} bien
            {first ? `. La primera, el ${formatDate(first.startedAt)}: ${first.correct} de ${first.answered}.` : '.'}
          </p>
          {!latest.complete && <p className={adult.hint}>Quedó a medias ({latest.answered} de {count}).</p>}
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

      {recall && (
        <>
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
        </>
      )}
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ readings and minutes

/** The Lengua stories read to their last question, and the minutes of Lengua this week. */
export function ReadingCard({ read, total, minutes }: { read: ReadingDef[]; total: number; minutes: number }) {
  return (
    <section className={adult.card} aria-labelledby="lengua-lectura-title">
      <div className={adult.cardHead}>
        <h2 id="lengua-lectura-title" className={adult.subheading}>Lecturas de Lengua</h2>
        <span className={adult.muted}>{formatMinutes(minutes)} en los últimos 7 días</span>
      </div>
      {read.length === 0 ? (
        <p className={adult.lead}>Todavía no ha terminado ninguna lectura con sus preguntas.</p>
      ) : (
        <>
          <p className={adult.lead}>Ha leído {read.length} de {total} lecturas, cada una con sus preguntas.</p>
          <ul className={adult.list} aria-label="Lecturas terminadas">
            {read.map((r) => <li key={r.id}>{r.title}</li>)}
          </ul>
        </>
      )}
      <p className={adult.hint}>Los minutos son solo de Lengua, de los últimos 7 días.</p>
    </section>
  )
}
