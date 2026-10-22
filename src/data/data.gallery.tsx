/* Dev gallery for the data module: /dev/gallery?only=src/data
   Exercises the live hooks against the real IndexedDB of the browser (seed with tools/shot.mjs --seed or the
   button). Not part of the public API. */
import { useEffect, useState } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { describeError } from '@/engine'
import type { ChildSummary, ErrorType } from '@/types'
import { recordAttempt, useActiveChild, useAuth, useChildren, useMastery, useProgress, useSyncStatus, getChildSummary, updateProgress, type SyncStatus } from './index'
import { seedDemo } from './dev'
import { uuid } from './util'
import s from './data.gallery.module.css'

const SYNC_LABEL: Record<SyncStatus['state'], { text: string; icon: string }> = {
  'local-only': { text: 'Solo en este dispositivo', icon: '📱' },
  offline: { text: 'Sin conexión · se guardará después', icon: '☁️' },
  idle: { text: 'Todo guardado en la nube', icon: '✅' },
  syncing: { text: 'Guardando…', icon: '🔄' },
  error: { text: 'Algunos cambios no se han guardado', icon: '⚠️' },
}

function SyncBadge({ status }: { status: SyncStatus }) {
  const l = SYNC_LABEL[status.state]
  return (
    <span className={s.badge} data-state={status.state}>
      <span aria-hidden>{l.icon}</span>
      {l.text}
      {status.pending > 0 && <span className={s.count}>{status.pending} pendientes</span>}
    </span>
  )
}

function FactGrid({ grid }: { grid: number[][] }) {
  return (
    <div className={s.grid} role="table" aria-label="Tablas de multiplicar: dominio por operación">
      <span className={s.corner}>×</span>
      {grid.map((_, b) => (
        <span key={`h${b}`} className={s.head}>{b + 1}</span>
      ))}
      {grid.map((row, a) => (
        <div key={a} className={s.row} role="row">
          <span className={s.head}>{a + 1}</span>
          {row.map((box, b) => (
            <span key={b} className={s.cell} data-box={box} role="cell" title={`${a + 1} × ${b + 1}: ${box < 0 ? 'sin ver' : `caja ${box}`}`}>
              {(a + 1) * (b + 1)}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

function Legend() {
  const items: [number, string][] = [[-1, 'Sin ver'], [0, 'Nueva'], [1, 'Practicando'], [2, 'Casi'], [3, 'Bien'], [4, 'Muy bien'], [5, 'Dominada']]
  return (
    <div className={s.legend}>
      {items.map(([box, label]) => (
        <span key={box} className={s.legendItem}>
          <span className={s.swatch} data-box={box} />
          {label}
        </span>
      ))}
    </div>
  )
}

function Inspector() {
  const auth = useAuth()
  const sync = useSyncStatus()
  const children = useChildren()
  const { child, loading } = useActiveChild()
  const progress = useProgress(child?.id)
  const mastery = useMastery(child?.id)
  const [summary, setSummary] = useState<ChildSummary | null>(null)
  const masteryCount = mastery ? Object.keys(mastery).length : 0

  useEffect(() => {
    if (!child) return
    let alive = true
    void getChildSummary(child.id).then((x) => alive && setSummary(x))
    return () => {
      alive = false
    }
  }, [child, masteryCount, progress?.updatedAt])

  if (loading || children === undefined) return <p className={s.muted}>Cargando datos del dispositivo…</p>

  if (!child) {
    return (
      <div className={s.empty}>
        <p>No hay ningún perfil activo en este dispositivo.</p>
        <button className={s.btn} onClick={() => void seedDemo()}>Crear datos de demostración</button>
      </div>
    )
  }

  const worlds = Object.entries(progress?.worlds ?? {}).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
  const available = (progress?.stars ?? 0) - (progress?.starsSpent ?? 0)

  return (
    <div className={s.inspector}>
      <header className={s.header}>
        <div className={s.who}>
          <span className={s.avatar} aria-hidden>🐱</span>
          <div>
            <h3 className={s.name}>{child.nickname}</h3>
            <p className={s.muted}>
              {child.grade ? `${child.grade}º de Primaria · ` : ''}con {child.companion.name} · {children.length} perfil{children.length === 1 ? '' : 'es'} en este dispositivo
            </p>
          </div>
        </div>
        <div className={s.statusCol}>
          <SyncBadge status={sync} />
          <span className={s.muted}>Cuenta: {auth.status === 'signed-in' ? auth.activeOrg?.name ?? 'sin organización' : auth.status === 'local-only' ? 'sin cuenta' : auth.status}</span>
        </div>
      </header>

      <div className={s.cols}>
        <section className={s.card}>
          <h4 className={s.h4}>Progreso</h4>
          <div className={s.stats}>
            <div className={s.stat}><strong>{available}</strong><span>estrellas para gastar</span></div>
            <div className={s.stat}><strong>{summary?.worldsCompleted ?? '—'}</strong><span>{summary?.worldsCompleted === 1 ? 'cristal' : 'cristales'}</span></div>
            <div className={s.stat}><strong>{summary?.minutesLast7Days ?? '—'}</strong><span>min esta semana</span></div>
            <div className={s.stat}><strong>{summary?.accuracyLast7Days == null ? '—' : `${Math.round(summary.accuracyLast7Days * 100)}%`}</strong><span>aciertos</span></div>
          </div>
          <ul className={s.worlds}>
            {worlds.map(([id, w]) => {
              const done = Object.values(w.nodes).filter((n) => n.done).length
              return (
                <li key={id} className={s.world} style={{ ['--wc' as string]: `var(--${id}, var(--c-primary))` }}>
                  <span className={s.worldDot} aria-hidden>{w.crystal ? '💎' : w.unlocked ? '🔓' : '🔒'}</span>
                  <span className={s.worldText}>
                    <span className={s.worldName}>Mundo {id.replace('w', '')}</span>
                    <span className={s.muted}>{done} {done === 1 ? 'paso' : 'pasos'}{w.letter ? ` · letra ${w.letter}` : ''}</span>
                  </span>
                </li>
              )
            })}
          </ul>
          {summary && summary.topErrors.length > 0 && (
            <div className={s.errors}>
              <span className={s.errorsTitle}>Lo que más le cuesta (30 días)</span>
              <ul className={s.errorList}>
                {summary.topErrors.map((e) => (
                  <li key={e.errorType}>
                    <span>{describeError(e.errorType as ErrorType)}</span>
                    <span className={s.count}>{e.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className={s.actions}>
            <button className={s.btn} onClick={() => void updateProgress(child.id, (p) => ({ ...p, stars: p.stars + 1 }))}>+1 estrella</button>
            <button
              className={s.btnGhost}
              onClick={() =>
                void recordAttempt({
                  id: uuid(), childId: child.id, sessionId: null, skill: 'mul:6x7', kind: 'fact-mul', correct: true, given: '42', expected: '42',
                  ms: 3100, inputMode: 'pen', hintsUsed: 0, errorType: null, context: { activity: 'gallery' }, createdAt: new Date().toISOString(),
                })
              }
            >
              Registrar 6 × 7 = 42
            </button>
          </div>
        </section>

        <section className={s.card}>
          <h4 className={s.h4}>Tablas de multiplicar</h4>
          {summary ? <FactGrid grid={summary.factGrid} /> : <p className={s.muted}>Calculando…</p>}
          <Legend />
        </section>
      </div>
    </div>
  )
}

function AllSyncStates() {
  const states: SyncStatus[] = [
    { state: 'local-only', pending: 0, lastSyncedAt: null },
    { state: 'idle', pending: 0, lastSyncedAt: new Date().toISOString() },
    { state: 'syncing', pending: 12, lastSyncedAt: null },
    { state: 'offline', pending: 31, lastSyncedAt: null },
    { state: 'error', pending: 2, lastSyncedAt: null, error: 'Hay 2 cambios que la nube no ha aceptado.' },
  ]
  return (
    <div className={s.badges}>
      {states.map((st) => <SyncBadge key={st.state} status={st} />)}
    </div>
  )
}

const entries: GalleryEntry[] = [
  { title: 'Inspector de datos (hooks en vivo sobre IndexedDB)', render: () => <Inspector />, width: 1120 },
  { title: 'Estados de sincronización (useSyncStatus)', render: () => <AllSyncStates />, width: 1120 },
]

export default entries
