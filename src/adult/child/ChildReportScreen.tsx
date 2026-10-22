/* One child's report for the grown-ups: times-table heatmap, frequent mistakes explained, time and accuracy
   for the last 7 days, progress through the worlds, the real prize, learning settings and data tools
   (calibration reset, GDPR export, deletion). */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CompanionArt } from '@/art'
import { clearInkSamples, eraseChild, exportChildData, getChildSummary, getProgress, useChildren } from '@/data'
import { describeError } from '@/engine'
import { season1 } from '@/content'
import type { ChildSummary, CompanionSpecies, ErrorType, ProgressState } from '@/types'
import { Button, toast } from '@/ui'
import { AdultPage } from '../shared/AdultPage'
import { ConfirmModal } from '../shared/ConfirmModal'
import { FactHeatmap, FactLegend } from '../shared/FactHeatmap'
import { countFactStates, FACT_STATE_LABEL } from '../shared/heatmap'
import { downloadBlob, slug } from '../shared/download'
import { errorMessage } from '../shared/messages'
import { formatMinutes, formatPercent, formatRelative, plural } from '../shared/format'
import { ChildSettingsCard } from './ChildSettingsCard'
import { RewardCard } from './RewardCard'
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
      downloadBlob(blob, `numeria-${slug(name)}-datos.json`)
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

  const worldStates = season1.worlds.map((w, i) => {
    const wp = progress.worlds[w.id]
    const firstOpen = season1.worlds.find((x) => progress.worlds[x.id]?.unlocked && !progress.worlds[x.id]?.crystal)
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
      </header>

      <section className={s.stats} aria-label="Resumen de la última semana">
        <div className={s.stat}>
          <span className={s.statValue}>{formatMinutes(summary.minutesLast7Days)}</span>
          <span className={s.statLabel}>jugando en los últimos 7 días</span>
        </div>
        <div className={s.stat}>
          <span className={s.statValue}>{formatPercent(summary.accuracyLast7Days)}</span>
          <span className={s.statLabel}>de respuestas correctas en la última semana</span>
        </div>
        <div className={s.stat}>
          <span className={s.statValue}>{counts.mastered} de 55</span>
          <span className={s.statLabel}>multiplicaciones dominadas</span>
        </div>
        <div className={s.stat}>
          <span className={s.statValue}>{summary.worldsCompleted} de {worldsTotal}</span>
          <span className={s.statLabel}>{plural(summary.worldsCompleted, 'cristal mágico recuperado', 'cristales mágicos recuperados')}</span>
        </div>
      </section>

      <div className={s.twoCol}>
        <section className={adult.card} aria-labelledby="heatmap-title">
          <div className={s.heatWrap}>
            <h2 id="heatmap-title" className={adult.subheading}>Tablas de multiplicar</h2>
            <p className={adult.muted}>
              Cada casilla es una multiplicación. Así se ve lo que sabe {name} hoy.
            </p>
          </div>
          <FactHeatmap grid={summary.factGrid} label={`Mapa de las tablas de ${name}`} />
          <FactLegend />
          <p className={adult.hint}>
            {(['mastered', 'learning', 'struggling', 'unseen'] as const)
              .map((st) => `${counts[st]} ${FACT_STATE_LABEL[st].toLowerCase()}`)
              .join(' · ')}
          </p>
          <p className={adult.hint}>
            Las casillas se repiten en las dos direcciones (7 × 6 y 6 × 7 son la misma). Si una casilla aparece «para repasar»,
            conviene jugar un rato con esas tablas, sin prisa.
          </p>
        </section>

        <div className={adult.stack}>
          <section className={adult.card} aria-labelledby="errors-title">
            <h2 id="errors-title" className={adult.subheading}>Errores más frecuentes</h2>
            <p className={adult.muted}>Del último mes. Los errores de lectura de la letra no cuentan.</p>
            {summary.topErrors.length === 0 ? (
              <p className={adult.lead}>Todavía no hay errores que destacar.</p>
            ) : (
              <ul className={adult.list} aria-label="Errores más frecuentes">
                {summary.topErrors.map((e) => (
                  <li key={e.errorType} className={s.errorRow}>
                    <span className={s.errorCount} aria-label={`${e.count} veces`}>{e.count}</span>
                    <span className={adult.lead} style={{ fontSize: 'var(--fs-sm)' }}>
                      {describeError(e.errorType as ErrorType)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

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

      {child && <ChildSettingsCard child={child} />}

      <section className={adult.card} aria-labelledby="data-title">
        <h2 id="data-title" className={adult.subheading}>Datos y privacidad</h2>
        <p className={adult.muted}>
          Puedes descargar todo lo que Numeria guarda de {name} o borrar su perfil. Ten en cuenta que borrar no se puede deshacer.
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
          Numeria olvidará las muestras de escritura de {name} y volverá a pedirle que escriba algunos números para aprender su letra.
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
