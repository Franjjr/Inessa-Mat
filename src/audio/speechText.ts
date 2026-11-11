/* Turn child-facing copy into text a Spanish TTS voice reads naturally:
   - strips emojis, HTML/markdown and leftover template placeholders;
   - reads maths the way a teacher says it: "6 × 7 = 42" → "seis por siete son cuarenta y dos",
     "6 × 7 = ?" → "¿seis por siete son…?", "3843 − 1234" → "tres mil ochocientos cuarenta y tres menos …";
   - writes numbers as words with the right agreement ("1 estrella" → "una estrella", "21 cristales" → "veintiún cristales");
   - reads hours, fractions, money, units and the signs (> < = ≠ and arrows) as words, so no symbol reaches the voice;
   - splits long text into sentence-sized chunks (Chrome cuts utterances after ~15 s; shorter chunks also make
     interrupting snappier). */
import { decimalWords, numberToSpanish, ordinalToSpanish, type NumberForm } from './spanishNumbers'

const NUM = String.raw`\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?`
const FRAC = String.raw`\d{1,2}/\d{1,2}`
const BLANK = String.raw`\?+|_+|□|▢|⬜|…|\.{3}`
/** Units that may follow a quantity ("14 cm", "6,50 €"); longest first so "min" is not read as "m". */
const UNIT = String.raw`min|mm|dm|cm|km|kg|ml|€|%|m|g|l|h|s`
const UNIT_TAIL = String.raw`(?:\s?(?:${UNIT})²?(?![\p{L}\d]))?`
const OPERAND = `(?:${FRAC}|(?:${NUM})${UNIT_TAIL}|${BLANK})`
// Operators between two operands. Unspaced ':' (times) and unspaced '-' (ranges) are handled separately.
const OP = String.raw`\s*[×✕xX*·+−–÷=]\s*|\s+[-:]\s+`
// No lookbehind (older iPadOS Safari lacks it): the preceding character is captured and re-emitted.
const MATH_RE = new RegExp(`(^|[^\\p{L}\\d])(${OPERAND}(?:(?:${OP})${OPERAND})+)(?![\\p{L}\\d])`, 'gu')
const TOKEN_RE = new RegExp(`(${FRAC})|(${NUM})(?:\\s?(${UNIT})(²)?(?![\\p{L}\\d]))?|(${BLANK})|([×✕xX*·+\\-−–÷:=])`, 'gu')

const OP_WORD: Record<string, string> = {
  '×': 'por', '✕': 'por', x: 'por', X: 'por', '*': 'por', '·': 'por',
  '+': 'más', '-': 'menos', '−': 'menos', '–': 'menos',
  '÷': 'entre', ':': 'entre', '=': 'son',
}

/** Feminine nouns that commonly follow a number in Numeria's copy (singular stems; plurals match too). Nouns in -a / -as
    that are not listed are still read as feminine (see isFeminine), except the masculine ones in MASCULINE_A. */
const FEMININE = [
  'estrella', 'gema', 'moneda', 'flor', 'fresa', 'manzana', 'galleta', 'pegatina', 'caja', 'bolsa', 'cesta', 'mesa',
  'fila', 'columna', 'decena', 'centena', 'unidad', 'vez', 'veces', 'semana', 'hora', 'página', 'pieza', 'canica',
  'tabla', 'letra', 'hada', 'rana', 'mariquita', 'pregunta', 'respuesta', 'cifra', 'llave', 'perla', 'naranja', 'pera',
  'uva', 'seta', 'ficha', 'casilla', 'vida', 'planta', 'semilla', 'hoja', 'piedra', 'concha', 'burbuja', 'gota', 'nube',
  'montaña', 'persona', 'niña', 'amiga', 'chuche', 'tarta', 'pizza', 'porción', 'porciones', 'rodaja', 'bola', 'vela',
  'figura', 'piruleta', 'abeja', 'mariposa', 'hormiga', 'oveja', 'vaca', 'gallina', 'pata', 'rueda', 'ala', 'pluma',
  'cereza', 'lección', 'lecciones', 'actividad', 'partida', 'ronda', 'prueba', 'casa', 'calle', 'puerta', 'ventana',
  'botella', 'taza', 'cuchara', 'tortuga', 'ballena', 'foca', 'pulsera', 'corona', 'varita', 'fruta', 'golosina',
  'noche', 'mañana', 'tarde', 'cosa', 'mitad', 'operación', 'operaciones', 'multiplicación',
  'multiplicaciones', 'división', 'divisiones', 'carta', 'isla', 'ola', 'torre', 'joya', 'chica', 'aventura',
  // Also verbs in the singular ("resta 1"): feminine only in the plural, or after a verb that asks for a noun.
  'cuenta', 'suma', 'resta', 'parte',
]

/** Words in -a / -as that are masculine ("21 días", "1 mapa"). */
const MASCULINE_A = new Set([
  'día', 'días', 'problema', 'mapa', 'pictograma', 'planeta', 'tema', 'idioma', 'sistema', 'programa', 'diagrama',
  'poema', 'clima', 'drama', 'lema', 'esquema', 'teorema', 'telegrama', 'cometa', 'yoga', 'sofá', 'papá',
])

/** Words that are also verbs or other non-nouns: after a number they do not take the feminine / the shortened "un". */
const VERB_A = new Set([
  'cuenta', 'resta', 'suma', 'parte', 'presta', 'pasa', 'sobra', 'falta', 'queda', 'toca', 'mira', 'gana', 'salta', 'baja',
  'sube', 'usa', 'llega', 'marca', 'pinta', 'forma', 'para', 'esta', 'hasta', 'toda', 'cada', 'ya', 'va', 'da', 'ha',
  'hace', 'dice', 'mide', 'vale', 'cabe', 'sale', 'tiene', 'viene', 'pone', 'lleva', 'quita', 'añade', 'copia', 'completa',
])
/** A verb that asks for a noun right after it: "haz 1 suma" is the noun, "desde 500 cuenta" the verb. */
const NOUN_CONTEXT = new Set(['haz', 'hay', 'tienes', 'tiene', 'escribe', 'resuelve', 'copia', 'completa', 'hacemos', 'haces', 'has', 'ha', 'otra'])

/** Words that never take the shortened "un" / the feminine: articles, prepositions, conjunctions, pronouns, copulas. */
const NOT_A_NOUN = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'a', 'al', 'del', 'de', 'en', 'con', 'sin', 'por', 'para', 'entre',
  'hasta', 'desde', 'sobre', 'tras', 'según', 'y', 'e', 'o', 'u', 'ni', 'pero', 'si', 'no', 'sí', 'que', 'cuando', 'como',
  'más', 'menos', 'es', 'son', 'era', 'fue', 'está', 'están', 'hay', 'se', 'te', 'me', 'lo', 'le', 'les', 'nos', 'mi', 'tu',
  'su', 'ser', 'sea', 'igual', 'ya', 'también', 'solo', 'sólo', 'aquí', 'allí', 'luego', 'antes', 'después', 'porque',
  'donde', 'cuánto', 'cuántos', 'cuántas', 'qué', 'cómo', 'cuál', 'quién', 'estar', 'tiene', 'tienen',
  'vale', 'valen', 'da', 'dan', 'queda', 'quedan', 'sobra', 'sobran', 'falta', 'faltan', 'cabe', 'caben', 'pasa', 'hace',
  'hacen', 'sale', 'salen', 'significa', 'significan', 'quiere', 'dice', 'mide', 'miden', 'cuesta', 'cuestan', 'resulta',
  'ocupa', 'ocupan', 'lleva', 'llevan', 'toca', 'tocan', 'cuenta', 'cuentan', 'presta', 'resta', 'suma',
])
/** Infinitives, gerunds and first-person plurals: not nouns. */
const VERBISH = /(?:ar|er|ir|amos|emos|imos|ando|iendo|ó|é)$/u

const UNITS: Record<string, [string, string]> = {
  '€': ['euro', 'euros'], '%': ['por ciento', 'por ciento'], mm: ['milímetro', 'milímetros'], cm: ['centímetro', 'centímetros'],
  dm: ['decímetro', 'decímetros'], km: ['kilómetro', 'kilómetros'],
  kg: ['kilo', 'kilos'], m: ['metro', 'metros'], g: ['gramo', 'gramos'], l: ['litro', 'litros'], ml: ['mililitro', 'mililitros'],
  min: ['minuto', 'minutos'], h: ['hora', 'horas'], s: ['segundo', 'segundos'],
}

/** Denominators 2..12 as words: [singular, plural]. */
const DENOMINATOR: Record<number, [string, string]> = {
  2: ['medio', 'medios'], 3: ['tercio', 'tercios'], 4: ['cuarto', 'cuartos'], 5: ['quinto', 'quintos'],
  6: ['sexto', 'sextos'], 7: ['séptimo', 'séptimos'], 8: ['octavo', 'octavos'], 9: ['noveno', 'novenos'],
  10: ['décimo', 'décimos'], 11: ['onceavo', 'onceavos'], 12: ['doceavo', 'doceavos'],
}

/** The gender of the thing counted when no noun follows a number ("tenía 21 y le dan 5"): the caller may know it. */
export type SpeechGender = 'm' | 'f'
export interface SpeakableOptions {
  /** Gender of the thing counted when no noun follows the number (default masculine). */
  gender?: SpeechGender
}

function isFeminine(word: string, prevWord = ''): boolean {
  const w = word.toLowerCase()
  if (MASCULINE_A.has(w) || MASCULINE_A.has(w.replace(/s$/, ''))) return false
  const plural = w.endsWith('s') && w.length > 3
  if (VERB_A.has(w) && !plural) return NOUN_CONTEXT.has(prevWord.toLowerCase()) && FEMININE.includes(w)
  if (FEMININE.some((f) => w === f || w === `${f}s` || w === `${f}es`)) return true
  const stem = w.replace(/(?:es|s)$/, '')
  if (/(?:ción|sión|dad|tad|tud|umbre)$/u.test(stem)) return true
  if (NOT_A_NOUN.has(w)) return false
  return w.length > 3 && (w.endsWith('as') || w.endsWith('a'))
}

/** Whether a word after a number is (probably) a noun, so "1" is the shortened "un". In doubt: false → "uno". */
function looksLikeNoun(word: string): boolean {
  const w = word.toLowerCase()
  if (NOT_A_NOUN.has(w) || VERB_A.has(w)) return false
  return !VERBISH.test(w)
}

function parseNum(raw: string): { int: number; dec: string | null } {
  const [i, d] = raw.split(',')
  return { int: Number(i.replace(/\./g, '')), dec: d ?? null }
}

function numWords(raw: string, form: NumberForm): string {
  const { int, dec } = parseNum(raw)
  if (!Number.isFinite(int)) return raw
  const base = numberToSpanish(int, form)
  return dec ? `${numberToSpanish(int, 'm')} coma ${decimalWords(dec)}` : base
}

const euroWords = (n: number) => `${numberToSpanish(n, 'apocope')} ${n === 1 ? 'euro' : 'euros'}`
const centWords = (n: number) => `${numberToSpanish(n, 'apocope')} ${n === 1 ? 'céntimo' : 'céntimos'}`

/** A number with its unit as words: "2,50 €" → "dos euros con cincuenta céntimos", "14 cm" → "catorce centímetros". */
function quantity(raw: string, unit: string, squared = false): string {
  const { int, dec } = parseNum(raw)
  if (!Number.isFinite(int)) return raw
  if (unit === '€') {
    if (dec === null) return euroWords(int)
    if (dec.length > 2) return `${numWords(raw, 'm')} euros`
    const cents = Number(dec.padEnd(2, '0'))
    if (int === 0) return centWords(cents)
    return cents === 0 ? euroWords(int) : `${euroWords(int)} con ${centWords(cents)}`
  }
  const [sing, plural] = UNITS[unit]
  const one = int === 1 && !dec
  const words = dec ? numWords(raw, 'm') : numberToSpanish(int, unit === 'h' ? 'f' : 'apocope')
  const name = one ? sing : plural
  return squared ? `${words} ${name} ${one ? 'cuadrado' : 'cuadrados'}` : `${words} ${name}`
}

/** "3/4" → "tres cuartos". Null when it is not a fraction a child meets (numerator above denominator, denominator above 12). */
function fractionWords(a: number, b: number): string | null {
  if (a < 1 || a > b || b > 12) return null
  if (b === 1) return 'un entero'
  const [sing, plural] = DENOMINATOR[b]
  return a === 1 ? `un ${sing}` : `${numberToSpanish(a, 'apocope')} ${plural}`
}

interface Token { kind: 'num' | 'blank' | 'op'; text: string; unit?: string; squared?: boolean }

function tokenWords(t: Token, blank: string): string {
  if (t.kind === 'blank') return blank
  if (t.kind === 'op') return OP_WORD[t.text] ?? t.text
  if (t.text.includes('/')) {
    const [a, b] = t.text.split('/').map(Number)
    return fractionWords(a, b) ?? `${numberToSpanish(a)} entre ${numberToSpanish(b)}`
  }
  return t.unit ? quantity(t.text, t.unit, t.squared) : numWords(t.text, 'm')
}

/** Words for a run of tokens; the first "=" is "son", a second one in the same chain ", que son". */
function wordsOf(tokens: Token[], blank: string): string {
  let equals = 0
  return tokens
    .map((t) => (t.kind === 'op' && t.text === '=' ? (equals++ === 0 ? 'son' : ', que son') : tokenWords(t, blank)))
    .join(' ')
}

function readMath(expr: string): string {
  const tokens: Token[] = []
  for (const m of expr.matchAll(TOKEN_RE)) {
    if (m[1]) tokens.push({ kind: 'num', text: m[1] })
    else if (m[2]) tokens.push({ kind: 'num', text: m[2], unit: m[3], squared: !!m[4] })
    else if (m[5]) tokens.push({ kind: 'blank', text: m[5] })
    else if (m[6]) tokens.push({ kind: 'op', text: m[6] })
  }
  const last = tokens[tokens.length - 1]
  const prev = tokens[tokens.length - 2]
  // "6 × 7 = ?" → a question with rising intonation: "¿seis por siete son…?"
  if (last?.kind === 'blank' && prev?.kind === 'op' && prev.text === '=') {
    const body = tokens.slice(0, -2)
    const chained = body.some((t) => t.kind === 'op' && t.text === '=')
    return `¿${wordsOf(body, '¿cuánto?')}${chained ? ', que son…' : ' son…'}?`
  }
  return wordsOf(tokens, '… ¿cuánto?…')
}

/** "07:05" → "las siete y cinco"; from 13 h on (and 0 h) hour and minutes are said as numbers: "las dieciocho cuarenta y cinco". */
function clockWords(h: number, m: number): string {
  const art = h === 1 ? 'la' : 'las'
  if (h >= 1 && h <= 12) {
    const hour = numberToSpanish(h, 'f')
    return m === 0 ? `${art} ${hour} en punto` : `${art} ${hour} y ${numberToSpanish(m)}`
  }
  const hour = numberToSpanish(h)
  if (m === 0) return `${art} ${hour} horas`
  return `${art} ${hour} ${m < 10 ? `cero ${numberToSpanish(m)}` : numberToSpanish(m)}`
}

const EMOJI_RE = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}‍︎️⃣]/gu
const SYMBOLS_RE = /[☆✓✗✘❖◆◇○●■▪▫►▶◀♡♢♤♧★✦✧✩✪✫✬✭✮✯✰⋆]/gu
/** The characters the voice service accepts (api/tts.ts SAFE_TEXT): anything else is dropped before it is sent. */
const UNSAFE_RE = /[^\p{L}\p{N}\s.,;:¡!¿?'‘’"«»()\-–—…%+×÷=/]/gu

const ARROWS: [RegExp, string, string][] = [
  [/(?:[→➜⇒⟶↦➔➡]️?\s*)+/gu, 'a la derecha', 'derecha'],
  [/(?:[←⬅⇐⟵]️?\s*)+/gu, 'a la izquierda', 'izquierda'],
  [/(?:[↑⬆⇑]️?\s*)+/gu, 'hacia arriba', 'arriba'],
  [/(?:[↓⬇⇓]️?\s*)+/gu, 'hacia abajo', 'abajo'],
]

/** Capitalised words ("RESTAR") are read letter by letter by some voices: say them as ordinary words. Roman numerals and
    a few acronyms stay. */
const ROMAN = /^M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$/
const ACRONYMS = new Set(['ABN', 'ESO', 'PDF', 'USB', 'ONU', 'EGB'])

/** The language a text is spoken in. English keeps its digits: the English voice reads them itself. */
export type SpeechLang = 'es' | 'en'

/** Clean and verbalise a piece of child-facing copy for TTS. Digits become Spanish words unless `lang` is 'en'. */
export function toSpeakable(input: string, lang: SpeechLang = 'es', opts: SpeakableOptions = {}): string {
  if (!input) return ''
  // Thousands written with a space ("2 475", "1 000"): one number, before the spaces are normalised.
  let s = input.normalize('NFC').replace(/\b\d{1,3}(?:[     ]\d{3})+\b/g, (m) => m.replace(/[     ]/g, ''))
  s = s.replace(/[   ]/g, ' ')

  // Emoji operators → plain operators (before emojis are stripped).
  s = s.replace(/✖️?|✖/g, '×').replace(/➕/g, '+').replace(/➖/g, '−').replace(/➗/g, '÷').replace(/🟰/g, '=')

  // Markup. A "<" only opens a tag when a letter or "/" follows: "3 < 5" is a comparison.
  s = s
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<\/(p|div|li|h\d)>/gi, '. ')
    .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, lang === 'en' ? ' and ' : ' y ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')

  // Spanish only: the English voice reads digits and maths itself.
  if (lang === 'es') {
    // Capitalised words → lower case (V15).
    s = s.replace(/(^|[^\p{L}])(\p{Lu}{3,})(?![\p{L}])/gu, (m, pre: string, w: string) =>
      ROMAN.test(w) || ACRONYMS.has(w) ? m : `${pre}${w.toLocaleLowerCase('es-ES')}`)

    // Hours "07:05" (before the maths: ":" would be read as a division).
    s = s.replace(/(^|[^\p{L}\d:])(?:las?\s+)?([01]?\d|2[0-3]):([0-5]\d)(?![\p{L}\d:])/gu, (_m, pre: string, h: string, mm: string) =>
      `${pre}${clockWords(Number(h), Number(mm))}`)

    // Maths spans first (they may contain "?" / "_" blanks that markdown stripping would eat).
    s = s.replace(MATH_RE, (_m, pre: string, expr: string) => `${pre}${readMath(expr)}`)

    // Ranges "3-4" → "tres a cuatro".
    s = s.replace(/(\d+)-(\d+)/g, (_m, a: string, b: string) => `${numWords(a, 'm')} a ${numWords(b, 'm')}`)

    // Ordinals: 1º, 2ª, 3.º. A feminine article ("la 1º") or ª makes the ordinal agree ("la primera").
    s = s.replace(/(^|\s)((?:la|las)\s+)?(\d+)\.?\s?([ºª°])/gi, (_m, pre: string, art: string | undefined, n: string, o: string) =>
      `${pre}${art ?? ''}${ordinalToSpanish(Number(n), o === 'ª' || !!art)}`)

    // Fractions "3/4" → "tres cuartos"; with a unit "1/2 kg" → "medio kilo", "3/4 l" → "tres cuartos de litro".
    s = s.replace(new RegExp(`(^|[^\\p{L}\\d/])(\\d{1,2})/(\\d{1,2})(?![\\d/])(?:\\s?(${UNIT})(?![\\p{L}\\d]))?`, 'gu'),
      (m, pre: string, a: string, b: string, unit?: string) => {
        const words = fractionWords(Number(a), Number(b))
        if (!words) return `${pre}${numberToSpanish(Number(a))} entre ${numberToSpanish(Number(b))}${unit ? ` ${UNITS[unit][1]}` : ''}`
        if (!unit || unit === '€' || unit === '%') return `${pre}${words}${unit ? ` ${UNITS[unit][1]}` : ''}`
        const name = UNITS[unit]
        return words === 'un medio' ? `${pre}medio ${name[0]}` : `${pre}${words} de ${name[0]}`
      })

    // Numbers followed by a unit or currency.
    s = s.replace(new RegExp(`(\\d{1,3}(?:\\.\\d{3})+(?:,\\d+)?|\\d+(?:,\\d+)?)\\s?(${UNIT})(²)?(?![\\p{L}\\d])`, 'gu'),
      (_m, n: string, u: string, sq?: string) => quantity(n, u, !!sq))

    // Remaining numbers, agreeing with the next word. In doubt a "1" stays "uno": only before a noun it is "un".
    s = s.replace(/(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)(\s+[\p{L}]+)?/gu, (m, n: string, next: string | undefined, offset: number, whole: string) => {
      const before = whole.slice(0, offset)
      const prevWord = /([\p{L}]+)\s+$/u.exec(before)?.[1] ?? ''
      const nextWord = next?.trim()
      let form: NumberForm = 'm'
      if (nextWord) {
        if (isFeminine(nextWord, prevWord)) form = 'f'
        else if (looksLikeNoun(nextWord)) form = 'apocope'
        else if (/^(la|las)$/i.test(prevWord)) form = 'f'
      } else if (/^(la|las)$/i.test(prevWord) || opts.gender === 'f') form = 'f'
      return numWords(n, form) + (next ?? '')
    })

    // Signs that are still symbols become words (V7). "El signo = significa…" → "El signo igual significa…".
    s = s
      .replace(/(signo)\s*=/gi, '$1 igual')
      .replace(/(signo)\s*≠/gi, '$1 distinto')
      .replace(/(signo)\s*>/gi, '$1 mayor que')
      .replace(/(signo)\s*</gi, '$1 menor que')
      .replace(/≠/g, ' distinto de ').replace(/≤/g, ' menor o igual que ').replace(/≥/g, ' mayor o igual que ')
      .replace(/≈/g, ' aproximadamente ')
      .replace(/\s=\s|=/g, ' es igual a ')
      .replace(/(\S\s|^)>(?=\s)/g, (_m, pre: string) => `${pre} mayor que`)
      .replace(/(\S\s)<(?=\s)/g, (_m, pre: string) => `${pre} menor que`)
      .replace(/\s[×✕]\s|[×✕]/g, ' por ')
      .replace(/\s÷\s|÷/g, ' entre ')
      .replace(/\s\+\s|\+/g, ' más ')
      .replace(/\s−\s|−/g, ' menos ')
      .replace(/(\d)\s?°\s?C\b/g, '$1 grados')
      .replace(/%/g, ' por ciento')

    // Arrows: "→" is "flecha a la derecha"; several in a row, "tres flechas a la derecha". A single "→" between two things
    // ("14 → 28") is only a pause, as before: a teacher says "el doble de 14 es 28", not "flecha".
    for (const [re, phrase] of ARROWS) {
      s = s.replace(re, (run, offset: number, whole: string) => {
        const n = [...run].filter((c) => !/[\s\uFE0F]/u.test(c)).length
        if (n > 1) return ` ${numberToSpanish(n, 'f')} flechas ${phrase} `
        const between = /[\p{L}\d]\s*$/u.test(whole.slice(0, offset)) && /^\s*[\p{L}\d¿¡]/u.test(whole.slice(offset + run.length))
        return between && phrase === 'a la derecha' ? ', ' : ` flecha ${phrase} `
      })
    }
    s = s.replace(/[↔⇔]/g, ' flecha en las dos direcciones ')
  }

  // Markdown emphasis, bullets, arrows and other symbols. ">" is kept: "3 > 2" was handled above, a stray one is dropped
  // by UNSAFE_RE.
  s = s
    .replace(/[*_~`#|]+/g, ' ')
    .replace(/[→➜⇒⟶↦➔➡]/g, ', ')
    .replace(/\s[•·]\s/g, ', ')
    .replace(/&/g, lang === 'en' ? ' and ' : ' y ')
    .replace(EMOJI_RE, ' ')
    .replace(SYMBOLS_RE, ' ')
    .replace(UNSAFE_RE, ' ')

  // Whitespace and punctuation tidy-up.
  s = s
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?…])/g, '$1')
    .replace(/([¡¿])\s+/g, '$1')
    .replace(/([,;:])(?=[^\s\d])/g, '$1 ')
    .replace(/([,;:])[,;:]+/g, '$1')
    .replace(/,\./g, '.')
    .replace(/¿+/g, '¿')
    .replace(/\?+/g, '?')
    .replace(/^[\s,.;:]+/, '')
    .replace(/[\s,;:]+$/, '')
    .trim()
  return s
}

/** Split into chunks of whole sentences (≤ max chars), falling back to commas for very long sentences. */
export function chunkForSpeech(text: string, max = 220): string[] {
  const sentences = text.match(/[^.!?…]+(?:[.!?…]+[»")\]]*|$)/g)?.map((x) => x.trim()).filter(Boolean) ?? []
  const out: string[] = []
  let cur = ''
  const push = (piece: string) => {
    if (!cur) cur = piece
    else if (cur.length + 1 + piece.length <= max) cur = `${cur} ${piece}`
    else {
      out.push(cur)
      cur = piece
    }
  }
  for (const sentence of sentences) {
    if (sentence.length <= max) {
      push(sentence)
      continue
    }
    const parts = sentence.split(/,\s+/).map((p, i, all) => (i < all.length - 1 ? `${p},` : p))
    for (const part of parts) {
      if (part.length <= max) push(part)
      else for (let i = 0; i < part.length; i += max) push(part.slice(i, i + max))
    }
  }
  if (cur) out.push(cur)
  return out
}
