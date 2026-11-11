/* Warns the grown-up when the browser refused persistent storage: the child's progress then lives in a space the browser
   may clear under pressure. Shows nothing when the answer is granted, unsupported or not known yet. «Entendido» hides it
   on this device (remembered in localStorage) and it comes back after 30 days if the browser still refuses. */
import { useEffect, useState } from 'react'
import { getPersistenceState, type PersistenceState } from '@/data'
import { Button } from '@/ui'
import s from './adult.module.css'

export const PERSISTENCE_DISMISS_KEY = 'repasitos:persistence-notice-dismissed'
export const PERSISTENCE_DISMISS_DAYS = 30

function wasDismissedRecently(): boolean {
  try {
    const raw = window.localStorage.getItem(PERSISTENCE_DISMISS_KEY)
    const at = raw ? Number(raw) : NaN
    return Number.isFinite(at) && Date.now() - at < PERSISTENCE_DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function PersistenceNotice() {
  const [state, setState] = useState<PersistenceState | null>(null)
  const [dismissed, setDismissed] = useState(wasDismissedRecently)

  useEffect(() => {
    let alive = true
    void getPersistenceState().then((v) => {
      if (alive) setState(v)
    })
    return () => {
      alive = false
    }
  }, [])

  if (state !== 'denied' || dismissed) return null
  const dismiss = () => {
    try {
      window.localStorage.setItem(PERSISTENCE_DISMISS_KEY, String(Date.now()))
    } catch {
      // no storage: it simply hides until the next visit
    }
    setDismissed(true)
  }
  return (
    <div className={`${s.notice} ${s.noticeWarn}`} role="note">
      <span className={s.noticeMark} aria-hidden="true">!</span>
      <span className={s.noticeBody}>
        Este navegador podría borrar el progreso si se queda sin espacio. Si puedes, añade la app a la pantalla de inicio.
      </span>
      <Button type="button" variant="secondary" size="sm" className={s.noticeAction} onClick={dismiss}>Entendido</Button>
    </div>
  )
}
