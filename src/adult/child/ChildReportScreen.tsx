/* One child's report for the grown-ups. Order: the conclusion first (which tables to praise and which to review),
   the four figures for the last 7 days, what the child is learning (temario, mistakes by kind, tests), then Lengua
   (the same cards, shown when Lengua is on for the child), then the times-table grid with its legend and the worlds.
   Then the real prize, the subjects and game settings, and data tools (calibration reset, GDPR export, deletion).
   A picture of the story so far can be shared. */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CompanionArt } from '@/art'
import { clearInkSamples, eraseChild, exportChildData, getChildSummary, getProgress, useChildren } from '@/data'
import { season1, seasonOf } from '@/content'
import { subjectOffered } from '@/engine'
import type { ChildSummary, CompanionSpecies, ProgressState } from '@/types'
import { Button, toast } from '@/ui'
import { AdultPage } from '../shared/AdultPage'
import { ConfirmModal } from '../shared/ConfirmModal'
import { FactHeatmap, FactLegend } from '../shared/FactHeatmap'
import { countFactStates } from '../shared/heatmap'
import { readTables } from '../shared/reading'
import { downloadBlob, slug } from '../shared/download'
import { errorMessage } from '../shared/messages'
import { formatMinutes, formatPercent, formatRelative, plural } from '../shared/format'
import { ChildSettingsCard } from './ChildSettingsCard'
import { SubtractionMethodsCard } from './SubtractionMethodsCard'
import { OtherMethodsCard } from './OtherMethodsCard'
import { LearningSection, LenguaSection, useLearningData } from './LearningCards'
import { RewardCard } from './RewardCard'
import { SubjectsCard } from './SubjectsCard'
import { renderSummaryPng, shareSummaryPng } from './shareSummary'
import s from './child.module.css'
import adult from '../shared/adult.module.css'

export default function ChildReportScreen() {
  const { childId = '' } = useParams()
  const navigate = useNavigate()
  const children = useChildren()
  const child = children?.find((c) => c.id === childId) ?? null

  const [summary, setSummary] = useState<ChildSummary | null>(null)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [calibrationOpen, setCalibrationOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [sharing, setSharing] = useState(false)
  // One read of the learning data for both sections (maths and Lengua), not one each.
  const learning = useLearningData(childId, progress?.updatedAt)

  useEffect(() => {
    let alive = true
    setLoadError(null)
    Promise.all([getChildSummary(childId), getProgress(childId)])
      .then(([sum, prog]) => {
        if (!alive) return
        setSummary(sum)
        setProgress(prog)
      })
      .catch((e: unknown) => {
        if (alive) setLoadError(errorMessage(e, 'No hemos podido cargar este informe.'))
      })
    return () => {
      alive = false
    }
  }, [childId])

  if (loadError) {
    return (
      <AdultPage title="Informe" back="/adult" narrow>
        <section className={adult.card}>
          <p className={adult.error} role="alert">{loadError}</p>
          <div className={adult.actions}><Button onClick={() => navigate('/adult')}>Volver a la zona de adultos</Button></div>
        </section>
      </AdultPage>
    )
  }

  if (!summary || !progress) {
    return (
      <AdultPage title="Informe" back="/adult">
        <p className={adult.muted} role="status">Preparando el informe…</p>
      </AdultPage>
    )
  }

  const counts = countFactStates(summary.factGrid)
  const reading = readTables(summary.factGrid, child?.nickname ?? summary.nickname)
  const worldsTotal = season1.worlds.length
  const name = child?.nickname ?? summary.nickname

  const calibrate = async () => {
    setBusy(true)
    setActionError(null)
    try {
      await clearInkSamples(childId)
      setCalibrationOpen(false)
      toast('Calibración reiniciada. La volverá a hacer al escribir.')
    } catch (e) {
      setActionError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const exportData = async () => {
    setActionError(null)
    try {
      const blob = await exportChildData(childId)
      downloadBlob(blob, `repasitos-${slug(name)}-datos.json`)
      toast('Copia de datos descargada')
    } catch (e) {
      setActionError(errorMessage(e))
    }
  }

  const remove = async () => {
    setBusy(true)
    setActionError(null)
    try {
      await eraseChild(childId)
      setDeleteOpen(false)
      toast(`Perfil de ${name} borrado`)
      navigate('/adult', { replace: true })
    } catch (e) {
      setActionError(errorMessage(e, 'No hemos podido borrar el perfil. Inténtalo de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  const share = async () => {
    setSharing(true)
    try {
      const currentName = seasonOf(progress).worlds.find((w) => w.id === summary.currentWorld)?.name ?? null
      const blob = await renderSummaryPng({
        nickname: name,
        companionName: child?.companion.name ?? '',
        crystals: summary.worldsCompleted,
        totalCrystals: worldsTotal,
        currentWorld: summary.worldsCompleted >= worldsTotal ? null : currentName,
      })
      const result = await shareSummaryPng(blob, name)
      if (result === 'downloaded') toast('Imagen descargada')
    } catch (e) {
      toast(errorMessage(e, 'No hemos podido crear la imagen.'))
    } finally {
      setSharing(false)
    }
  }

  // The names of the child's season: the 2.º adventure renames two worlds.
  const season = seasonOf(progress)
  const worldStates = season.worlds.map((w, i) => {
    const wp = progress.worlds[w.id]
    const firstOpen = season.worlds.find((x) => progress.worlds[x.id]?.unlocked && !progress.worlds[x.id]?.crystal)
    if (wp?.crystal) return { id: w.id, index: i, name: w.name, state: 'done' as const }
    if (wp?.unlocked) return { id: w.id, index: i, name: w.name, state: firstOpen?.id === w.id ? ('current' as const) : ('open' as const) }
    return { id: w.id, index: i, name: w.name, state: 'locked' as const }
  })

  return (
    <AdultPage title={`Informe de ${name}`} back="/adult">
      <header className={s.header}>
        <div className={s.identity}>
          <CompanionArt
            species={(child?.companion.species ?? summary.companionSpecies) as CompanionSpecies}
            size={84}
            colorway={child?.companion.colorway}
            equipped={child?.companion.equipped}
            animated={false}
          />
          <div className={adult.stack} style={{ gap: 4, minWidth: 0 }}>
            <h2 className={s.name}>{name}</h2>
            <p className={adult.muted}>
              {child?.grade ? `${child.grade}.º de Primaria · ` : ''}Última vez que jugó: {formatRelative(summary.lastPlayedAt)}
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => void share()} disabled={sharing}>
          {sharing ? 'Preparando la imagen…' : 'Compartir resumen'}
        </Button>
      </header>

      <section className={`${adult.card} ${adult.cardYellow} ${s.verdict}`} aria-labelledby="report-title">
        <h2 id="report-title" className={s.name} style={{ fontSize: 'clamp(26px, 3.4vw, 34px)', lineHeight: 1.12 }}>
          {reading.headline}
        </h2>
        <p className={adult.lead}>{reading.support}</p>
      </section>

      <section className={s.stats} aria-label="Cifras de los últimos 7 días y en total">
        <div className={s.stat}>
          <span className={s.statValue}>{formatMinutes(summary.minutesLast7Days)}</span>
          <span className={s.statLabel}>jugando en los últimos 7 días</span>
        </div>
        <div className={s.stat}>
          <span className={s.statValue}>{formatPercent(summary.accuracyLast7Days)}</span>
          <span className={s.statLabel}>de aciertos en los últimos 7 días</span>
        </div>
        <div className={s.stat}>
          <span className={s.statValue}>{counts.mastered} de 55</span>
          <span className={s.statLabel}>multiplicaciones dominadas en total</span>
        </div>
        <div className={s.stat}>
          <span className={s.statValue}>{summary.worldsCompleted} de {worldsTotal}</span>
          <span className={s.statLabel}>{plural(summary.worldsCompleted, 'cristal conseguido en total', 'cristales conseguidos en total')}</span>
        </div>
      </section>

      <LearningSection childId={childId} childName={name} grade={child?.grade} progress={progress} data={learning.data} loadError={learning.error} />
      <LenguaSection
        childId={childId}
        childName={name}
        grade={child?.grade}
        enabled={!!child && (child.settings.subjects ?? ['math']).includes('language') && subjectOffered('language', child.grade)}
        progress={progress}
        data={learning.data}
        loadError={learning.error}
      />

      <div className={s.twoCol}>
        <section className={`${adult.card} ${adult.cardGreen}`} aria-labelledby="heatmap-title">
          <div className={s.heatWrap}>
            <h2 id="heatmap-title" className={adult.subheading}>Tablas de multiplicar</h2>
            <p className={adult.muted}>
              Cada casilla es una multiplicación, sin repetir: 55 en total (7 × 6 y 6 × 7 son la misma). Así va lo que sabe {name} hasta ahora.
            </p>
          </div>
          <FactLegend />
          <FactHeatmap triangle grid={summary.factGrid} label={`Mapa de las tablas de ${name}`} />
          <p className={adult.hint}>
            Dominadas: {counts.mastered} · En camino: {counts.learning} · Para repasar: {counts.struggling} · Sin practicar: {counts.unseen}
          </p>
          {reading.reviewFacts.length > 0 && (
            <p className={adult.hint}>Si una casilla aparece «Hay que repasarla», conviene jugar un rato con esas tablas, sin prisa.</p>
          )}
        </section>

        <div className={adult.stack}>
          <SubtractionMethodsCard info={summary.subtractionMethods} />
          <OtherMethodsCard division={summary.divisionMethods} tables={summary.tableTricks} />

          <section className={adult.card} aria-labelledby="worlds-title">
            <div className={adult.cardHead}>
              <h2 id="worlds-title" className={adult.subheading}>Mundos</h2>
              <span className={adult.muted}>{worldsTotal} mundos</span>
            </div>
            <ol className={s.worldList}>
              {worldStates.map((w) => (
                <li key={w.id} className={s.worldItem}>
                  <span className={s.worldNum} style={{ background: `var(--w${w.index + 1})` }} aria-hidden>{w.index + 1}</span>
                  <span className={s.worldName}>{w.name}</span>
                  <span className={`${s.worldState} ${w.state === 'done' ? s.done : w.state === 'locked' ? s.locked : s.current}`}>
                    {w.state === 'done' ? 'Cristal conseguido' : w.state === 'current' ? 'Aquí está ahora' : w.state === 'open' ? 'Abierto' : 'Bloqueado'}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <RewardCard childId={childId} childName={name} />

      <section className={s.group} aria-labelledby="settings-group-title">
        <h2 id="settings-group-title" className={adult.heading} style={{ fontSize: 'var(--fs-lg)' }}>Ajustes de {name}</h2>
        <p className={adult.muted}>Cambian cómo se usa Repasitos con {name}. No cambian lo que ya sabe.</p>
        {child && <SubjectsCard child={child} />}
        {child && <ChildSettingsCard child={child} />}
      </section>

      <section className={adult.card} aria-labelledby="data-title">
        <h2 id="data-title" className={adult.subheading}>Datos y privacidad</h2>
        <p className={adult.muted}>
          Puedes descargar todo lo que Repasitos guarda de {name} o borrar su perfil. Ten en cuenta que borrar no se puede deshacer.
        </p>
        {actionError && <p className={adult.error} role="alert">{actionError}</p>}
        <div className={adult.actions}>
          <Button variant="secondary" onClick={() => setCalibrationOpen(true)}>Reiniciar la calibración de la escritura</Button>
          <Button variant="secondary" onClick={() => void exportData()}>Descargar sus datos (JSON)</Button>
          {child && (
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>Borrar este perfil</Button>
          )}
        </div>
      </section>

      <ConfirmModal
        open={calibrationOpen}
        title="¿Reiniciar la calibración?"
        confirmLabel="Sí, reiniciar"
        busy={busy}
        error={actionError}
        onConfirm={() => void calibrate()}
        onCancel={() => setCalibrationOpen(false)}
      >
        <p className={adult.lead}>
          Repasitos olvidará las muestras de escritura de {name} y volverá a pedirle que escriba algunos números para aprender su letra.
          Sus avances no cambian.
        </p>
      </ConfirmModal>

      <ConfirmModal
        open={deleteOpen}
        title={`¿Borrar a ${name}?`}
        confirmLabel="Borrar perfil"
        danger
        busy={busy}
        error={actionError}
        onConfirm={() => void remove()}
        onCancel={() => setDeleteOpen(false)}
      >
        <p className={adult.lead}>
          Se borrarán su progreso, sus resultados, sus premios y sus muestras de escritura de este dispositivo
          {child?.orgId ? ' y de la nube' : ''}. Si quieres conservar una copia, descárgala antes.
        </p>
      </ConfirmModal>
    </AdultPage>
  )
}
