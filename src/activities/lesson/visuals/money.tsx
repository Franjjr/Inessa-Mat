/* Money visual (money): the real euro coins and notes of a list, drawn with the same pieces as the money exercises
   (MoneyPiece), in a row; with a price, the price tag and, when the pieces pay more, the change line. Values that are not
   a coin or a note of the euro are skipped. */
import { PIECES, euros } from '@/engine'
import { MoneyPiece } from '@/activities/views/MoneyPiece'
import type { VisualProps } from './types'
import { numParam, strParam } from './types'
import s from './visuals.module.css'

const REAL = new Set<number>(PIECES)

/** Una cantidad en céntimos, como la escribe la lección: «2 €», «1,25 €», «50 cént.». */
export function moneyLabel(cents: number): string {
  return cents >= 100 ? euros(cents) : `${cents} cént.`
}

/** The real coins and notes of a comma list of céntimos («200,50,20,3» → [200, 50, 20]). */
function realPieces(list: string): number[] {
  return list.split(',').map((t) => Number(t.trim())).filter((v) => REAL.has(v))
}

export function MoneyVisual({ params }: VisualProps) {
  const pieces = realPieces(strParam(params, 'items', ''))
  const price = numParam(params, 'price', -1)
  const total = pieces.reduce((sum, v) => sum + v, 0)
  const change = price >= 0 && total > price ? total - price : 0
  // Two pieces fit side by side at the big size; more are drawn smaller, so the row wraps inside a 360 px phone.
  const size = pieces.length > 2 ? 'md' : 'lg'

  return (
    <div className={s.stage}>
      <div className={s.moneyRow} role="img" aria-label={pieces.map(moneyLabel).join(', ') || 'Sin monedas'}>
        {pieces.map((v, i) => (
          <span key={i} className={s.moneyPiece} data-piece={v}>
            <MoneyPiece value={v} size={size} />
          </span>
        ))}
      </div>
      {price >= 0 ? <p className={s.moneyTag}>Precio: {moneyLabel(price)}</p> : null}
      {change > 0 ? <p className={s.moneyChange}>Te devuelven {moneyLabel(change)}</p> : null}
    </div>
  )
}
