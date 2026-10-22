/* Floating bubble with digit chips: "¿Cuál querías escribir?" alternatives for an unsure recognition, or the
   full 0–9 picker (unknown ink, keypad mode on a lone cell). Rendered in a portal so no container clips it. */
import clsx from 'clsx'
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { PencilIcon } from './icons'
import s from './AltPopover.module.css'

export interface AltPopoverProps {
  anchorRef: RefObject<HTMLElement | null>
  digits: number[]
  /** Highlighted chip (the recogniser's best guess). */
  current?: number | null
  title?: string
  onPick(d: number): void
  onRewrite?(): void
  onClose(): void
}

export function AltPopover({ anchorRef, digits, current, title, onPick, onRewrite, onClose }: AltPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number; arrow: number; below: boolean } | null>(null)

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (!anchor || !ref.current) return
    const place = () => {
      const a = anchor.getBoundingClientRect()
      const b = ref.current!.getBoundingClientRect()
      const vw = window.innerWidth
      const margin = 10
      const below = a.top - b.height - 14 < margin
      const top = below ? a.bottom + 14 : a.top - b.height - 14
      const left = Math.min(vw - b.width - margin, Math.max(margin, a.left + a.width / 2 - b.width / 2))
      setPos({ left, top, arrow: a.left + a.width / 2 - left, below })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchorRef, digits.length])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || anchorRef.current?.contains(t)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [anchorRef, onClose])

  const many = digits.length > 5
  return createPortal(
    <div
      ref={ref}
      className={clsx(s.pop, pos?.below && s.below, many && s.many)}
      style={pos ? { left: pos.left, top: pos.top, ['--arrow' as string]: `${pos.arrow}px` } : { visibility: 'hidden', left: 0, top: 0 }}
      role="dialog"
      aria-label={title ?? '¿Qué número es?'}
    >
      {title && <div className={s.title}>{title}</div>}
      <div className={s.chips}>
        {digits.map((d) => (
          <button
            key={d}
            type="button"
            className={clsx(s.chip, d === current && s.current)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(d)}
            aria-label={`Es un ${d}`}
          >
            {d}
          </button>
        ))}
        {onRewrite && (
          <button type="button" className={clsx(s.chip, s.rewrite)} onMouseDown={(e) => e.preventDefault()} onClick={onRewrite} aria-label="Escribirlo otra vez">
            <PencilIcon size={26} />
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
