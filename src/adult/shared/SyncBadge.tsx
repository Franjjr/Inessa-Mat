/* Sync status in plain Spanish. Shows icon + text, never colour alone. */
import clsx from 'clsx'
import { useSyncStatus, syncNow, type SyncStatus } from '@/data'
import s from './adult.module.css'

const COPY: Record<SyncStatus['state'], { label: string; detail: string; tone: string; mark: string }> = {
  'local-only': { label: 'Solo en este dispositivo', detail: 'Crea una cuenta para guardar una copia segura en la nube.', tone: s.noticeInfo, mark: 'i' },
  offline: { label: 'Sin conexión', detail: 'Los cambios se guardan aquí y se subirán cuando vuelva internet.', tone: s.noticeWarn, mark: '…' },
  idle: { label: 'Todo sincronizado', detail: 'Los datos están guardados en la nube.', tone: s.noticeOk, mark: '✓' },
  syncing: { label: 'Sincronizando…', detail: 'Estamos subiendo los últimos cambios.', tone: s.noticeInfo, mark: '↻' },
  error: { label: 'Hay cambios pendientes', detail: 'Algunos cambios no se han podido guardar todavía.', tone: s.noticeWarn, mark: '!' },
}

export function SyncBadge({ showAction = true }: { showAction?: boolean }) {
  const status = useSyncStatus()
  const copy = COPY[status.state]
  const pendingText = status.pending > 0 ? ` (${status.pending} pendiente${status.pending === 1 ? '' : 's'})` : ''
  return (
    <div className={clsx(s.notice, copy.tone)} role="status" aria-live="polite">
      <span className={s.noticeMark} aria-hidden>{copy.mark}</span>
      <div className={s.stack} style={{ gap: 2 }}>
        <strong>{copy.label}{pendingText}</strong>
        <span>{status.error ?? copy.detail}</span>
      </div>
      {showAction && status.state !== 'local-only' && status.state !== 'syncing' && (
        <button
          type="button"
          className={s.segment}
          style={{ marginLeft: 'auto', flex: 'none' }}
          onClick={() => void syncNow().catch(() => undefined)}
          disabled={status.state === 'offline'}
        >
          Sincronizar ahora
        </button>
      )}
    </div>
  )
}
