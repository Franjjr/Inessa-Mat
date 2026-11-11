/* Warns the grown-up when the browser refused persistent storage: the child's progress then lives in a space the browser
   may clear under pressure. Shows nothing when the answer is granted, unsupported or not known yet. */
import { useEffect, useState } from 'react'
import { getPersistenceState, type PersistenceState } from '@/data'
import s from './adult.module.css'

export function PersistenceNotice() {
  const [state, setState] = useState<PersistenceState | null>(null)

  useEffect(() => {
    let alive = true
    void getPersistenceState().then((v) => {
      if (alive) setState(v)
    })
    return () => {
      alive = false
    }
  }, [])

  if (state !== 'denied') return null
  return (
    <div className={`${s.notice} ${s.noticeWarn}`} role="note">
      <span className={s.noticeMark} aria-hidden="true">!</span>
      <span>
        Este navegador podría borrar el progreso si se queda sin espacio. Si puedes, añade la app a la pantalla de inicio.
      </span>
    </div>
  )
}
