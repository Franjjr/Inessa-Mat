/* Spanish (Spain) number words, so every voice reads numbers the same way and agreement is right:
   "1 estrella" → "una estrella", "21 cristales" → "veintiún cristales", "6 × 7" → "seis por siete". */

/** 'm' = uno/veintiuno (counting, maths), 'f' = una/veintiuna/doscientas, 'apocope' = un/veintiún (before a noun). */
export type NumberForm = 'm' | 'f' | 'apocope'

const UNITS = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
  'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
]
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const HUNDREDS = ['', 'ciento', 'doscient', 'trescient', 'cuatrocient', 'quinient', 'seiscient', 'setecient', 'ochocient', 'novecient']

function one(form: NumberForm): string {
  return form === 'f' ? 'una' : form === 'apocope' ? 'un' : 'uno'
}

function below100(n: number, form: NumberForm): string {
  if (n === 1) return one(form)
  if (n === 21) return form === 'f' ? 'veintiuna' : form === 'apocope' ? 'veintiún' : 'veintiuno'
  if (n < 30) return UNITS[n]
  const t = Math.floor(n / 10)
  const u = n % 10
  return u === 0 ? TENS[t] : `${TENS[t]} y ${below100(u, form)}`
}

/** hundredsForm controls "doscientos/doscientas", unitForm controls "uno/una/un". */
function below1000(n: number, hundredsForm: 'm' | 'f', unitForm: NumberForm): string {
  if (n === 100) return 'cien'
  const h = Math.floor(n / 100)
  const r = n % 100
  const hs = h === 0 ? '' : h === 1 ? 'ciento' : HUNDREDS[h] + (hundredsForm === 'f' ? 'as' : 'os')
  if (r === 0) return hs
  const rest = below100(r, unitForm)
  return hs ? `${hs} ${rest}` : rest
}

function integerWords(n: number, form: NumberForm): string {
  if (n === 0) return 'cero'
  if (n >= 1e12) return String(n)
  const hundredsForm = form === 'f' ? 'f' : 'm'
  const millions = Math.floor(n / 1e6)
  const thousands = Math.floor((n % 1e6) / 1000)
  const rest = n % 1000
  const parts: string[] = []
  if (millions) parts.push(millions === 1 ? 'un millón' : `${below1000(millions, 'm', 'apocope')} millones`)
  if (thousands) parts.push(thousands === 1 ? 'mil' : `${below1000(thousands, hundredsForm, 'apocope')} mil`)
  if (rest) parts.push(below1000(rest, hundredsForm, form))
  return parts.join(' ')
}

/** Number → Spanish words. Decimals are read digit-group wise after "coma" ("2,5" → "dos coma cinco"). */
export function numberToSpanish(n: number, form: NumberForm = 'm'): string {
  if (!Number.isFinite(n)) return String(n)
  if (n < 0) return `menos ${numberToSpanish(-n, form)}`
  if (Number.isInteger(n)) return integerWords(n, form)
  const [i, d] = String(n).split('.')
  return `${integerWords(Number(i), form)} coma ${decimalWords(d)}`
}

/** Decimal part as said in Spain: "05" → "cero cinco", "25" → "veinticinco". */
export function decimalWords(d: string): string {
  const lead = d.match(/^0+/)?.[0].length ?? 0
  const zeros = Array.from({ length: lead }, () => 'cero')
  const rest = d.slice(lead)
  return [...zeros, ...(rest ? [integerWords(Number(rest), 'm')] : [])].join(' ')
}

const ORD_M = ['', 'primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo', 'noveno', 'décimo']

/** 1º → primero, 2ª → segunda … (1..10). Larger ordinals fall back to the cardinal. */
export function ordinalToSpanish(n: number, feminine: boolean): string {
  if (n >= 1 && n <= 10) {
    const w = ORD_M[n]
    return feminine ? w.replace(/o$/, 'a') : w
  }
  return numberToSpanish(n, feminine ? 'f' : 'm')
}
