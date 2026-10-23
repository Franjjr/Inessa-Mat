/* A coin or a note of the euro, drawn in SVG (not a photo). Coins keep their real relative diameters and colours
   (copper 1, 2 and 5 céntimos; gold 10, 20 and 50 céntimos; bimetal 1 and 2 €); notes keep one colour per value.
   The printed value is on the piece, as on the real money. The piece is decorative: the buttons that use it name it. */
import { euros, isNote, pieceName } from '@/engine'

/** Real diameters in mm (for the relative size of the coins). */
const DIAMETER: Record<number, number> = { 1: 16.25, 2: 18.75, 5: 21.25, 10: 19.75, 20: 22.25, 50: 24.25, 100: 23.25, 200: 25.75 }

/** Base size in px of a coin of 25.75 mm: the 'sm' (tray), 'md' (palette) and 'lg' (the question) sizes. */
const BASE = { sm: 52, md: 74, lg: 128 } as const

const NOTE_COLOUR: Record<number, { fill: string; ink: string }> = {
  500: { fill: '#c7d0da', ink: '#2f3d4d' },
  1000: { fill: '#ea6a5e', ink: '#fff7f2' },
  2000: { fill: '#5b9be0', ink: '#f4f9ff' },
  5000: { fill: '#f3a258', ink: '#3b2411' },
}

const COIN_COLOUR = {
  copper: { outer: '#b8733a', inner: '#dd9b5e', ink: '#3d2210' },
  gold: { outer: '#c99a3c', inner: '#ecc86a', ink: '#3d2c0c' },
  bimetal: { outer: '#b9c1cc', inner: '#e5b84a', ink: '#2c3440' },
} as const

const coinFamily = (cents: number): keyof typeof COIN_COLOUR => {
  if (cents === 200 || cents === 100) return 'bimetal'
  if (cents >= 10 && cents <= 50) return 'gold'
  return 'copper'
}

/** Printed value: '5 c', '50 c', '1 €', '2 €' (as the coins print it). */
const printed = (cents: number) => (cents >= 100 ? `${cents / 100} €` : `${cents} c`)

export interface MoneyPieceProps {
  /** Céntimos: 1 … 5000. */
  value: number
  size?: keyof typeof BASE
  /** Set the accessible name (buttons already name the piece; a decorative piece leaves this out). */
  label?: boolean
}

export function MoneyPiece({ value, size = 'md', label = false }: MoneyPieceProps) {
  const base = BASE[size]
  const aria = label ? { role: 'img' as const, 'aria-label': isNote(value) ? `Billete de ${euros(value)}` : `Moneda de ${pieceName(value)}` } : { 'aria-hidden': true as const }
  if (isNote(value)) {
    const w = base * 1.6
    const h = base * 0.8
    const c = NOTE_COLOUR[value]
    return (
      <svg viewBox="0 0 160 80" width={w} height={h} className="money-piece money-note" {...aria} data-value={value}>
        <rect x="1" y="1" width="158" height="78" rx="9" fill={c.fill} stroke="#2b3440" strokeOpacity="0.35" strokeWidth="2" />
        <rect x="8" y="8" width="144" height="64" rx="5" fill="none" stroke={c.ink} strokeOpacity="0.35" strokeWidth="1.5" />
        <circle cx="80" cy="40" r="22" fill={c.ink} fillOpacity="0.14" />
        <text x="80" y="50" textAnchor="middle" fontSize="30" fontWeight="800" fill={c.ink} fontFamily="system-ui, sans-serif">{printed(value)}</text>
        <text x="16" y="25" fontSize="11" fontWeight="700" fill={c.ink} fontFamily="system-ui, sans-serif">BCE</text>
      </svg>
    )
  }
  const mm = DIAMETER[value] ?? 20
  const d = base * (mm / 25.75)
  const colour = COIN_COLOUR[coinFamily(value)]
  const text = printed(value)
  const fontSize = text.length > 4 ? 15 : 19
  return (
    <svg viewBox="0 0 100 100" width={d} height={d} className="money-piece money-coin" {...aria} data-value={value}>
      <circle cx="50" cy="50" r="49" fill={colour.outer} />
      <circle cx="50" cy="50" r="41" fill={colour.inner} />
      {value === 100 || value === 200 ? <circle cx="50" cy="50" r="19" fill={COIN_COLOUR.gold.inner} stroke={COIN_COLOUR.gold.outer} strokeWidth="2" /> : null}
      <text x="50" y="58" textAnchor="middle" fontSize={fontSize} fontWeight="800" fill={colour.ink} fontFamily="system-ui, sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {text}
      </text>
    </svg>
  )
}
