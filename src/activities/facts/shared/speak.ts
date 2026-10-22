/* Reads a fact aloud when the child has voice turned on (PEDAGOGY 9: say the whole fact). Spanish words for 0..100. */
import { speech } from '@/audio'

const UNITS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce',
  'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós',
  'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']

export function numberWords(n: number): string {
  if (n < 0 || n > 100 || !Number.isInteger(n)) return String(n)
  if (n === 100) return 'cien'
  if (n < UNITS.length) return UNITS[n]
  const t = Math.floor(n / 10)
  const u = n % 10
  return u === 0 ? TENS[t] : `${TENS[t]} y ${UNITS[u]}`
}

/** Speaks "seis por siete, cuarenta y dos" (or "cuarenta y dos entre seis") when voice is on. Never throws. */
export function speakFact(left: number, right: number, op: '×' | '÷', result?: number): void {
  try {
    const text = op === '×'
      ? `${numberWords(left)} por ${numberWords(right)}${result !== undefined ? `, ${numberWords(result)}` : ''}`
      : `${numberWords(left)} entre ${numberWords(right)}${result !== undefined ? `, ${numberWords(result)}` : ''}`
    void speech.say(text)
  } catch {
    /* speech is optional */
  }
}
