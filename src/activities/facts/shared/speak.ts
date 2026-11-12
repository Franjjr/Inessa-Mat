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

/** Speaks the fact when voice is on. Without a result it is the question «¿Seis por siete?»; with one, the whole fact
 *  «seis por siete, cuarenta y dos». A new exercise cuts in on whatever was still being said. Never throws. */
export function speakFact(left: number, right: number, op: '×' | '÷', result?: number): void {
  try {
    const word = op === '×' ? 'por' : 'entre'
    const text = result !== undefined
      ? `${numberWords(left)} ${word} ${numberWords(right)}, ${numberWords(result)}`
      : `¿${numberWords(left)} ${word} ${numberWords(right)}?`
    void speech.say(text, { interrupt: true })
  } catch {
    /* speech is optional */
  }
}
