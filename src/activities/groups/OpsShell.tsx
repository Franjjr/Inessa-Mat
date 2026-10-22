/* Frame of an operations minigame: exit button, title, round progress and the body. */
import type { CSSProperties, ReactNode } from 'react'
import { Button } from '@/ui'
import { useActivityHost } from '@/activities/host'
import s from './OpsShell.module.css'

export interface OpsShellProps {
  title: string
  /** 0-based index of the current round, and the number of rounds. */
  index: number
  total: number
  onExit?: () => void
  background?: string
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function OpsShell({ title, index, total, onExit, background, children, className, style }: OpsShellProps) {
  const host = useActivityHost()
  const pct = total > 0 ? Math.min(100, Math.round((index / total) * 100)) : 0
  return (
    <main className={`${s.shell} ${className ?? ''}`} style={{ background, ...style }}>
      <header className={s.top}>
        {onExit && (
          <Button variant="secondary" round aria-label="Salir" onClick={onExit}>
            <span aria-hidden style={{ fontSize: 26, lineHeight: 1 }}>‹</span>
          </Button>
        )}
        <h1 className={s.title}>{host.t(title)}</h1>
        {total > 0 && (
          <span className={s.count} aria-label={`Ronda ${Math.min(index + 1, total)} de ${total}`}>
            {Math.min(index + 1, total)}/{total}
          </span>
        )}
      </header>
      <div className={s.track} aria-hidden>
        <div className={s.fill} style={{ width: `${pct}%` }} />
      </div>
      <div className={s.body}>{children}</div>
    </main>
  )
}

/** Shown when the selector produced no rounds for this activity: the child can leave without a dead end. */
export function NoRounds({ title, onExit }: { title: string; onExit?: () => void }) {
  const host = useActivityHost()
  return (
    <OpsShell title={title} index={0} total={0} onExit={onExit}>
      <div className={s.empty}>
        <p>{host.t('Hoy no hay ejercicios de este juego. ¡Prueba otro!')}</p>
        {onExit && <Button variant="primary" size="lg" onClick={onExit}>Volver</Button>}
      </div>
    </OpsShell>
  )
}
