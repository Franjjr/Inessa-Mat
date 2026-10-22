/* Replaces window.confirm: an accessible dialog with a clear cancel path. */
import type { ReactNode } from 'react'
import { Button, Modal } from '@/ui'
import s from './adult.module.css'

export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  danger,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} dismissable={!busy}>
      <div className={s.stack}>
        {children}
        {error && <p className={s.error} role="alert">{error}</p>}
        <div className={s.actions}>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Un momento…' : confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
