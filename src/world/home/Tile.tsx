/* A daily tile: a solid sticker with a label, an optional hint and optional art in its corner. Used on the home and on
   «Mis premios». */
import type { ReactNode } from 'react'
import s from './ChildHomeScreen.module.css'

export function Tile({ label, hint, tone, onClick, children }: {
  label: string; hint?: string; tone: 'violet' | 'blue' | 'yellow' | 'green'; onClick: () => void; children?: ReactNode
}) {
  return (
    <button type="button" className={`${s.tile} ${s[tone]}`} onClick={onClick}>
      <span className={s.tileLabel}>{label}</span>
      {hint && <span className={s.tileHint}>{hint}</span>}
      {children && <span className={s.tileArt}>{children}</span>}
    </button>
  )
}
