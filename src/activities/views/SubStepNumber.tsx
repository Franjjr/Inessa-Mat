/* A number written digit by digit in the step views (resta por partes, saltos en la recta). Digits are units first in
   the state; the cells are drawn left to right. Focus order is set by the parent CellGroup through the cell ids. */
import { DigitCell } from '@/ink'
import s from './SubStepViews.module.css'

const PLACE_NAMES = ['unidades', 'decenas', 'centenas', 'unidades de mil', 'decenas de mil']
const placeOf = (i: number) => (['u', 'd', 'c', 'um'] as const)[i] ?? null

/** The number written in the cells (units first). null while empty; a gap between digits makes it unreadable (null). */
export function numberOf(digits: readonly (number | null)[]): number | null {
  const top = digits.reduce<number>((acc, d, i) => (d !== null && d !== undefined ? i : acc), -1)
  if (top < 0) return null
  let value = 0
  for (let i = top; i >= 0; i--) {
    const d = digits[i]
    if (d === null || d === undefined) return null
    value = value * 10 + d
  }
  return value
}

export interface SubStepNumberProps {
  /** Prefix of the cell ids; the digit i is `${prefix}${i}` (i = 0 units). */
  prefix: string
  width: number
  digits: readonly (number | null)[]
  onDigit: (index: number, digit: number | null) => void
  /** Name for screen readers, e.g. "resultado del paso 2". */
  label: string
}

export function SubStepNumber({ prefix, width, digits, onDigit, label }: SubStepNumberProps) {
  return (
    <div className={s.number} role="group" aria-label={label}>
      {Array.from({ length: width }, (_, k) => {
        const i = width - 1 - k
        return (
          <div key={i} className={s.digit}>
            <DigitCell
              cellId={`${prefix}${i}`}
              variant="result"
              size="md"
              place={placeOf(i)}
              value={digits[i] ?? null}
              onChange={(d) => onDigit(i, d)}
              ariaLabel={`${PLACE_NAMES[i] ?? 'cifra'} de ${label}`}
            />
          </div>
        )
      })}
    </div>
  )
}

/** Cell ids in focus order: each number units first, numbers in the order given. */
export function focusOrder(prefixes: string[], width: number): string[] {
  return prefixes.flatMap((p) => Array.from({ length: width }, (_, i) => `${p}${i}`))
}
