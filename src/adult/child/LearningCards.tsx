/* Lo que aprende, for the grown-ups (docs/curriculum/PLAN_DOCENTE.md §6): where the child is in the temario, what
   the mistakes say and what helps at home, and the tests (each prueba inicial and the recall of what was learnt
   weeks ago). Maths is LearningSection; Lengua is LenguaSection (its own temario, mistakes, placement, readings and
   minutes), shown only when Lengua is on for the child or has Lengua attempts; English is EnglishSection (the words
   learnt by theme, the words that fail with what was written, the numbers, the prueba inicial and the minutes).
   Each section reads only its subject's rows. The cards are pure (fixed data in the gallery); the sections read the
   data and offer the test again. A failing read shows inside the section and never takes the whole report down. */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMastery, listAttempts, listSessions, updateProgress } from '@/data'
import { syllabusFor, syllabusForGrade } from '@/content/syllabus'
import { STORY_READINGS } from '@/content/lengua/stories'
import { handwritingReport } from '@/engine/caligrafia/report'
import { getWorld, seasonIdForGrade } from '@/content'
import {
  attemptsOf, describeError, describeSkillShort, englishWordsReport, errorReport, minutesOfSubject, placementFlags, placementRuns, recallReport, storyFlag,
  syllabusReport, topicNeeds, ENGLISH_PLACEMENT_COUNT, ENGLISH_SKILL_TEXT, ENGLISH_THEMES, LENGUA_PLACEMENT_COUNT, PLACEMENT_COUNT, THEME_NAME,
  type EnglishWordsReport, type ErrorReport, type LessonSubject, type PlacementRun, type RecallReport, type SyllabusReport,
  type TopicNeeds, type TopicState,
} from '@/engine'
import { speedReport, type SpeedReport } from '@/engine/report'
import type { AttemptRecord, MasteryMap, ProgressState, ReadingDef, SessionRecord } from '@/types'
import { Button, toast } from '@/ui'
import { errorMessage } from '../shared/messages'
import { SpeakingWordsCard } from './SpeakingWordsCard'
import { formatDate, formatMinutes, formatPercent, plural } from '../shared/format'
import { tableNoun } from '../shared/reading'
import { weeklyTrend, type WeekTrend } from './trend'
import adult from '../shared/adult.module.css'
import s from './child.module.css'

/** Enough history for the recall check and every prueba inicial, read from this device. */
const ATTEMPT_LIMIT = 5000
const DAY_MS = 24 * 60 * 60 * 1000
/** A prueba inicial is repeated every three or four weeks (docs/curriculum/PLAN_DOCENTE.md): the adult is reminded after three. */
const TEST_EVERY_DAYS = 28
const TEST_STALE_DAYS = 21

/** Element ids are unique on the page: Lengua's cards carry a `lengua-` prefix, English's an `ingles-` one, maths keeps the original ids. */
const ID_PREFIX: Record<LessonSubject, string> = { math: '', language: 'lengua-', english: 'ingles-' }
const idOf = (subject: LessonSubject, name: string) => `${ID_PREFIX[subject]}${name}`

export interface LearningData {
  mastery: MasteryMap
  /** Every attempt but the handwriting ones, so a crowd of pen tries cannot push the placement tests out of the window. */
  attempts: AttemptRecord[]
  sessions: SessionRecord[]
  /** The handwriting (Caligrafía) attempts only. Optional: when missing, Caligrafía reads `attempts`. */
  handwriting?: AttemptRecord[]
}

/** The mastery, the attempts (newest first) and the sessions of the last week, read from this device once for the whole
    report: both sections take this one read (`data`, `loadError`). */
export function useLearningData(childId: string, progressUpdatedAt?: string): { data: LearningData | null; error: string | null } {
  const [data, setData] = useState<LearningData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const since = new Date(Date.now() - 7 * DAY_MS).toISOString()
    Promise.resolve()
      .then(() => Promise.all([
        getMastery(childId),
        listAttempts(childId, { limit: ATTEMPT_LIMIT, skipHandwriting: true }),
        listSessions(childId, { since }),
        listAttempts(childId, { limit: ATTEMPT_LIMIT }),
      ]))
      .then(([mastery, attempts, sessions, all]) => {
        if (alive) setData({ mastery, attempts, sessions, handwriting: all.filter((a) => a.skill.startsWith('calig:')) })
      })
      .catch((e: unknown) => { if (alive) setError(errorMessage(e, 'No hemos podido leer lo que ha practicado.')) })
    return () => { alive = false }
  }, [childId, progressUpdatedAt])

  return { data, error }
}

/** The toast after the prueba inicial of a subject is offered: the subject's name is in it (maths has none). */
const OFFER_TOAST: Record<LessonSubject, (childName: string) => string> = {
  math: (name) => `Se le ofrecerá la prueba a ${name} en su próxima visita.`,
  language: (name) => `Se le ofrecerá la prueba de Lengua a ${name} en su próxima visita.`,
  english: (name) => `Se le ofrecerá la prueba de Inglés a ${name} en su próxima visita.`,
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
      toast(OFFER_TOAST[subject](childName))
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
      syllabus: syllabusReport(syllabusForGrade(grade), data.mastery, 'math', undefined, { progress: progress ?? undefined }),
      needs: topicNeeds(syllabusForGrade(grade), data.attempts, now),
      errors: errorReport(data.attempts, now),
      runs: placementRuns(data.attempts),
      recall: recallReport(data.attempts, now),
      weeks: weeklyTrend(data.attempts, now),
      speed: speedReport(data.mastery),
    }
  }, [data, grade])

  if (loadError && !reports) {
    return <section className={adult.card}><p className={adult.error} role="alert">{loadError}</p></section>
  }
  if (!reports) return <p className={adult.muted} role="status">Leyendo lo que ha practicado…</p>

  return (
    <>
      <TemarioCard report={reports.syllabus} needs={reports.needs} childName={childName} />
      <SpeedCard speed={reports.speed} childName={childName} />
      <WeeklyTrendCard weeks={reports.weeks} childName={childName} />
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
      syllabus: syllabusReport(syllabus, data.mastery, 'language', undefined, { progress: progress ?? undefined }),
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

/** English for the grown-ups. Shown when English is on for the child (`enabled`) or the child has English attempts; otherwise nothing. */
export function EnglishSection({ childId, childName, enabled, speakingOn = false, progress, data, loadError }: {
  childId: string; childName: string; enabled: boolean; speakingOn?: boolean; progress: ProgressState | null
  data: LearningData | null; loadError: string | null
}) {
  const { error, offer } = useOfferPlacement(childId, childName, 'english', !!progress?.flags?.[placementFlags('english').requested])

  const reports = useMemo(() => {
    if (!data) return null
    return {
      attempts: attemptsOf(data.attempts, 'english').length,
      words: englishWordsReport(data.attempts, data.mastery),
      runs: placementRuns(data.attempts, 'english'),
      minutes: minutesOfSubject(data.sessions, 'english'),
    }
  }, [data])

  // Not on for the child: nothing until the data says the child has English attempts.
  if (!data) {
    if (!enabled) return null
    if (loadError) return <section className={adult.card}><p className={adult.error} role="alert">{loadError}</p></section>
    return <p className={adult.muted} role="status">Leyendo lo que ha practicado en Inglés…</p>
  }
  if (!reports || (!enabled && reports.attempts === 0)) return null

  return (
    <>
      <EnglishWordsCard report={reports.words} minutes={reports.minutes} />
      <SpeakingWordsCard childId={childId} speakingOn={speakingOn} />
      <TestsCard
        subject="english"
        runs={reports.runs}
        count={ENGLISH_PLACEMENT_COUNT}
        childName={childName}
        error={error}
        offer={offer}
      />
    </>
  )
}

/** A typed word as the report shows it: what was written, or «en blanco» when nothing was. */
const writtenText = (given: string) => (given.trim() ? `«${given}»` : '(en blanco)')

/** The English words learnt by theme, the words that fail with what was written, and the numbers the child knows; the minutes
    of English this week are in the head. */
export function EnglishWordsCard({ report, minutes }: { report: EnglishWordsReport; minutes: number }) {
  const themes = ENGLISH_THEMES.filter((t) => report.learnt[t].length > 0)
  const ops = report.numbers.ops.map((op) => ENGLISH_SKILL_TEXT[`eng:num:ops:${op}`])
  return (
    <section className={adult.card} aria-labelledby="ingles-palabras-title">
      <div className={adult.cardHead}>
        <h2 id="ingles-palabras-title" className={adult.subheading}>Inglés</h2>
        <span className={adult.muted}>{formatMinutes(minutes)} en los últimos 7 días</span>
      </div>

      <h3 className={s.mistakeTitle}>Palabras aprendidas</h3>
      {themes.length === 0 ? (
        <p className={adult.lead}>Todavía no ha dominado ningún tema de palabras.</p>
      ) : (
        <ul className={adult.list} aria-label="Palabras aprendidas por tema">
          {themes.map((t) => (
            <li key={t}><strong className={adult.strong}>{THEME_NAME[t]}</strong>: {report.learnt[t].join(', ')}</li>
          ))}
        </ul>
      )}

      <h3 className={s.mistakeTitle}>Palabras en las que falla</h3>
      {report.failing.length === 0 ? (
        <p className={adult.muted}>Ninguna por ahora.</p>
      ) : (
        <ul className={adult.list} aria-label="Palabras en las que falla">
          {report.failing.map((f) => (
            <li key={f.word}>Escribe {f.given.map(writtenText).join(', ')} por «{f.word}»</li>
          ))}
        </ul>
      )}

      <h3 className={s.mistakeTitle}>Números</h3>
      <p className={adult.lead}>
        {report.numbers.upTo === 0 ? 'Todavía no ha dominado los números en inglés.' : `Cuenta en inglés hasta el ${report.numbers.upTo}.`}
      </p>
      {ops.length > 0 && <p className={adult.muted}>Ya domina: {ops.join(', ')}.</p>}
    </section>
  )
}

/** Caligrafía con lápiz for the grown-ups: the letters and links learnt, the ones that cost, and the criterion that fails
    most. Hidden while the data is not read and when the child has no handwriting try (the section is not for everyone). */
export function CaligrafiaSection({ data, childName }: { data: LearningData | null; childName: string }) {
  const report = useMemo(() => (data ? handwritingReport(data.handwriting ?? data.attempts, data.mastery) : null), [data])
  if (!report) return null
  return (
    <section className={adult.card} aria-labelledby="caligrafia-title">
      <div className={adult.cardHead}>
        <h2 id="caligrafia-title" className={adult.subheading}>Caligrafía</h2>
        <span className={adult.muted}>{plural(report.tries, 'intento', 'intentos')} con el lápiz</span>
      </div>
      <p className={adult.lead}>
        {report.learnt.length > 0
          ? <>Letras y enlaces dominados: <strong className={adult.strong}>{report.learnt.join(', ')}</strong>.</>
          : `${childName} todavía no domina ninguna letra ni enlace.`}
      </p>
      {report.costly.length > 0 && <p className={adult.muted}>Le cuestan: {report.costly.join(', ')}.</p>}
      {report.worst && <p className={adult.muted}>Lo que más falla: {report.worst.word}.</p>}
    </section>
  )
}

// ------------------------------------------------------------------------------------------------ temario

const TERM_TEXT: Record<number, string> = { 1: '1.er trimestre', 2: '2.º trimestre', 3: '3.er trimestre' }

/** The heading of the temario of each subject. */
const TEMARIO_TITLE: Record<LessonSubject, (course: number) => string> = {
  math: (course) => `Temario de ${course}.º`,
  language: (course) => `Temario de Lengua de ${course}.º`,
  english: (course) => `Temario de Inglés de ${course}.º`,
}

/** Which adventure world a stage is in: maths only (2.º plays its own season on the same maps; Lengua and English have none). */
const ADVENTURE: Record<LessonSubject, boolean> = { math: true, language: false, english: false }

/** The sentence after the stage: maths goes in a spiral, Lengua and English go from the easy to the hard. */
const STAGE_NOTE: Record<LessonSubject, (course: number) => ReactNode> = {
  math: (course) => <> Seguimos un orden propio, en espiral: cada etapa mezcla números y operaciones con dinero, reloj, medidas{course >= 3 ? ', fracciones' : ''} o figuras.</>,
  language: () => ' Las etapas van de lo fácil a lo difícil, y cada tema vuelve a repasarse en la sesión de cada día.',
  english: () => ' Las etapas van de lo fácil a lo difícil, y cada tema vuelve a repasarse en la sesión de cada día.',
}

const STATE_TEXT: Record<TopicState, string> = {
  'dominado': 'Dominado',
  'trabajando': 'Trabajando',
  'sin-empezar': 'Sin empezar',
  'pendiente': 'Próximamente',
}

export function TemarioCard({ report, needs, childName, subject = 'math' }: {
  report: SyllabusReport; needs: Record<string, TopicNeeds>; childName: string; subject?: LessonSubject
}) {
  // The stage's world in the adventure of the course (2.º plays its own season on the same maps).
  const stageId = ADVENTURE[subject] ? report.current?.stage?.worldId : undefined
  const stageWorld = stageId ? getWorld(stageId, seasonIdForGrade(report.course)) : undefined
  return (
    <section className={`${adult.card} ${adult.cardBlue}`} aria-labelledby={idOf(subject, 'temario-title')}>
      <div className={adult.cardHead}>
        <h2 id={idOf(subject, 'temario-title')} className={adult.subheading}>{TEMARIO_TITLE[subject](report.course)}</h2>
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
          {STAGE_NOTE[subject](report.course)}
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

const MISTAKES_TITLE: Record<LessonSubject, string> = { math: 'En qué falla', language: 'En qué falla en Lengua', english: 'En qué falla en Inglés' }

function trendText(count: number, previous: number): string | null {
  if (previous === 0) return null
  if (count === 0) return 'Ya no le pasa: el mes anterior sí.'
  if (count <= previous * 0.7) return `Va a menos (el mes anterior: ${previous}).`
  if (count >= previous * 1.3) return `Va a más (el mes anterior: ${previous}).`
  return `Parecido al mes anterior (${previous}).`
}

/** One or two names in quotes, «7 × 8» or «7 × 8» y «6 × 9»: at most two different names, the examples a piece of advice points at. */
function joinNames(names: string[]): string {
  const unique = [...new Set(names)].slice(0, 2).map((n) => `«${n}»`)
  return unique.length === 2 ? `${unique[0]} y ${unique[1]}` : unique.join('')
}

export function MistakesCard({ report, childName, subject = 'math' }: { report: ErrorReport; childName: string; subject?: LessonSubject }) {
  const now = report.groups.filter((g) => g.count > 0)
  const gone = report.groups.filter((g) => g.count === 0)
  return (
    <section className={adult.card} aria-labelledby={idOf(subject, 'mistakes-title')}>
      <div className={adult.cardHead}>
        <h2 id={idOf(subject, 'mistakes-title')} className={adult.subheading}>{MISTAKES_TITLE[subject]}</h2>
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
            {now.map((g) => {
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
                  {g.examples.length > 0 && (
                    <ul className={s.examples} aria-label={`Ejemplos de ${g.label.toLowerCase()}`}>
                      {g.examples.map((e, k) => (
                        <li key={k}>
                          {describeSkillShort(e.skill)}: {e.given.trim() ? `escribió «${e.given}»` : 'no escribió nada'} (la respuesta es {e.expected})
                        </li>
                      ))}
                    </ul>
                  )}
                  {trend && <p className={adult.muted}>{trend}</p>}
                  <p className={s.advice}>
                    <strong>Qué ayuda:</strong> {g.advice}
                    {g.examples.length > 0 && <> Para empezar, con {joinNames(g.examples.map((e) => describeSkillShort(e.skill)))}.</>}
                  </p>
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

const TESTS_TITLE: Record<LessonSubject, string> = { math: 'Pruebas', language: 'Prueba inicial de Lengua', english: 'Prueba inicial de Inglés' }
const TESTS_INTRO: Record<LessonSubject, (count: number) => string> = {
  math: (count) => `${count} preguntas de todo el curso, sin pistas ni aviso de acierto o fallo. Marca el punto de partida.`,
  language: (count) => `${count} preguntas de gramática, ortografía y vocabulario, sin pistas ni aviso de acierto o fallo. No hay lectura ni dictado. Marca el punto de partida.`,
  english: (count) => `${count} preguntas de palabras, frases y números en inglés, sin pistas ni aviso de acierto o fallo. No hay audio. Marca el punto de partida.`,
}

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
  // The reminder counts from the last test that was finished: one left half done does not set the next date.
  const lastFinished = [...runs].reverse().find((r) => r.complete) ?? null
  const first = runs.length > 1 ? runs[0] : null
  const blocks = latest ? latest.blocks.filter((b) => b.total > 0) : []
  const intro = TESTS_INTRO[subject](count)
  return (
    <section className={adult.card} aria-labelledby={idOf(subject, 'tests-title')}>
      <div className={adult.cardHead}>
        <h2 id={idOf(subject, 'tests-title')} className={adult.subheading}>{TESTS_TITLE[subject]}</h2>
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
          {lastFinished && <TestDueNote lastStartedAt={lastFinished.startedAt} />}
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

// ------------------------------------------------------------------------------------------------ rhythm, speed and trend

/** Reminder for the grown-up: the next prueba inicial is due four weeks after the last one; after three without one it says so. */
export function TestDueNote({ lastStartedAt, now = new Date() }: { lastStartedAt: string; now?: Date }) {
  const days = (now.getTime() - Date.parse(lastStartedAt)) / DAY_MS
  if (!Number.isFinite(days) || days < 0) return null
  if (days >= TEST_STALE_DAYS) {
    const weeks = Math.floor(days / 7)
    return <p className={adult.hint} role="status">Hace {weeks} semanas que no se hace. Conviene repetirla para ver lo que ha avanzado.</p>
  }
  const due = new Date(Date.parse(lastStartedAt) + TEST_EVERY_DAYS * DAY_MS).toISOString()
  return <p className={adult.hint}>Próxima prueba sugerida: {formatDate(due)}.</p>
}

/** How fast the times tables come back: from memory (quick) and still thought over (slow). Only a reading, never a push. */
export function SpeedCard({ speed, childName }: { speed: SpeedReport; childName: string }) {
  if (speed.quick.length === 0 && speed.slow.length === 0) return null
  return (
    <section className={adult.card} aria-labelledby="rapidez-title">
      <div className={adult.cardHead}>
        <h2 id="rapidez-title" className={adult.subheading}>Rapidez</h2>
        <span className={adult.muted}>Tiempo medio de lo que ya domina</span>
      </div>
      <p className={adult.lead}>
        {speed.quick.length > 0 && <>{childName} tarda poco en contestar {tableNoun(speed.quick)}. </>}
        {speed.slow.length > 0 && <>Con {tableNoun(speed.slow)} todavía va pensando: es normal, y con la práctica se acorta.</>}
      </p>
      <p className={adult.hint}>No hay prisa: es solo una lectura del tiempo que tarda, no una medida para comparar.</p>
    </section>
  )
}

/** The last eight weeks of maths: answers, accuracy and days played, so the grown-up sees whether things move. */
export function WeeklyTrendCard({ weeks, childName }: { weeks: WeekTrend[]; childName: string }) {
  const oldestFirst = [...weeks].reverse()
  if (oldestFirst.filter((w) => w.answered > 0).length < 2) return null
  const label = (w: WeekTrend) => (w.weeksAgo === 0 ? 'Esta semana' : w.weeksAgo === 1 ? 'La semana pasada' : `Hace ${w.weeksAgo} semanas`)
  return (
    <section className={adult.card} aria-labelledby="tendencia-title">
      <div className={adult.cardHead}>
        <h2 id="tendencia-title" className={adult.subheading}>Cómo va cambiando</h2>
        <span className={adult.muted}>Matemáticas, últimas 8 semanas</span>
      </div>
      <p className={adult.muted}>
        Cada semana: cuántas respuestas ha dado {childName}, cuántas fueron bien y en cuántos días jugó. Una semana sin datos es una semana sin jugar.
      </p>
      <ul className={s.worldList} aria-label="Semanas de matemáticas">
        {oldestFirst.map((w) => (
          <li key={w.weeksAgo} className={s.worldItem}>
            <span className={s.worldName}>{label(w)}</span>
            {w.answered === 0 ? (
              <span className={s.worldState}>Sin practicar</span>
            ) : (
              <span className={s.worldState}>
                {formatPercent(w.correct / w.answered)} de aciertos · {plural(w.answered, 'respuesta', 'respuestas')} · {plural(w.days, 'día', 'días')}
                <span className={s.meter} aria-hidden>
                  <span className={s.meterFill} style={{ width: `${(w.correct / w.answered) * 100}%` }} />
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
