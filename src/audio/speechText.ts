/* Turn child-facing copy into text a Spanish TTS voice reads naturally:
   - strips emojis, HTML/markdown and leftover template placeholders;
   - reads maths the way a teacher says it: "6 × 7 = 42" → "seis por siete son cuarenta y dos",
     "6 × 7 = ?" → "¿seis por siete son…?", "3843 − 1234" → "tres mil ochocientos cuarenta y tres menos …";
   - writes numbers as words with the right agreement ("1 estrella" → "una estrella", "21 cristales" → "veintiún cristales");
   - splits long text into sentence-sized chunks (Chrome cuts utterances after ~15 s; shorter chunks also make
     interrupting snappier). */
import { decimalWords, numberToSpanish, ordinalToSpanish, type NumberForm } from './spanishNumbers'

const NUM = String.raw`\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?`
const BLANK = String.raw`\?+|_+|□|▢|⬜|…|\.{3}`
const OPERAND = `(?:${NUM}|${BLANK})`
// Operators between two operands. Unspaced ':' (times) and unspaced '-' (ranges) are handled separately.
const OP = String.raw`\s*[×✕xX*·+−–÷=]\s*|\s+[-:]\s+`
// No lookbehind (older iPadOS Safari lacks it): the preceding character is captured and re-emitted.
const MATH_RE = new RegExp(`(^|[^\\p{L}\\d])(${OPERAND}(?:(?:${OP})${OPERAND})+)(?![\\p{L}\\d])`, 'gu')
const TOKEN_RE = new RegExp(`(${NUM})|(${BLANK})|([×✕xX*·+\\-−–÷:=])`, 'gu')

const OP_WORD: Record<string, string> = {
  '×': 'por', '✕': 'por', x: 'por', X: 'por', '*': 'por', '·': 'por',
  '+': 'más', '-': 'menos', '−': 'menos', '–': 'menos',
  '÷': 'entre', ':': 'entre', '=': 'son',
}

/** Feminine nouns that commonly follow a number in Numeria's copy (singular stems; plurals match too). */
const FEMININE = [
  'estrella', 'gema', 'moneda', 'flor', 'fresa', 'manzana', 'galleta', 'pegatina', 'caja', 'bolsa', 'cesta', 'mesa',
  'fila', 'columna', 'decena', 'centena', 'unidad', 'vez', 'veces', 'semana', 'hora', 'página', 'pieza', 'canica',
  'tabla', 'letra', 'hada', 'rana', 'mariquita', 'pregunta', 'respuesta', 'cifra', 'llave', 'perla', 'naranja', 'pera',
  'uva', 'seta', 'ficha', 'casilla', 'vida', 'planta', 'semilla', 'hoja', 'piedra', 'concha', 'burbuja', 'gota', 'nube',
  'montaña', 'persona', 'niña', 'amiga', 'chuche', 'tarta', 'pizza', 'porción', 'porciones', 'rodaja', 'bola', 'vela',
  'figura', 'piruleta', 'abeja', 'mariposa', 'hormiga', 'oveja', 'vaca', 'gallina', 'pata', 'rueda', 'ala', 'pluma',
  'cereza', 'lección', 'lecciones', 'actividad', 'partida', 'ronda', 'prueba', 'casa', 'calle', 'puerta', 'ventana',
  'botella', 'taza', 'cuchara', 'tortuga', 'ballena', 'foca', 'pulsera', 'corona', 'varita', 'fruta', 'golosina',
  'noche', 'mañana', 'tarde', 'cosa', 'parte', 'mitad', 'operación', 'operaciones', 'suma', 'resta', 'multiplicación',
  'multiplicaciones', 'división', 'divisiones', 'cuenta', 'carta', 'isla', 'ola', 'torre', 'joya', 'chica', 'aventura',
]

const UNITS: Record<string, [string, string]> = {
  '€': ['euro', 'euros'], '%': ['por ciento', 'por ciento'], cm: ['centímetro', 'centímetros'], km: ['kilómetro', 'kilómetros'],
  kg: ['kilo', 'kilos'], m: ['metro', 'metros'], g: ['gramo', 'gramos'], l: ['litro', 'litros'], ml: ['mililitro', 'mililitros'],
  min: ['minuto', 'minutos'], h: ['hora', 'horas'], s: ['segundo', 'segundos'],
}

function isFeminine(word: string): boolean {
  const w = word.toLowerCase()
  return FEMININE.some((f) => w === f || w === `${f}s` || w === `${f}es`)
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

function readMath(expr: string): string {
  const tokens: { kind: 'num' | 'blank' | 'op'; text: string }[] = []
  for (const m of expr.matchAll(TOKEN_RE)) {
    if (m[1]) tokens.push({ kind: 'num', text: m[1] })
    else if (m[2]) tokens.push({ kind: 'blank', text: m[2] })
    else if (m[3]) tokens.push({ kind: 'op', text: m[3] })
  }
  const last = tokens[tokens.length - 1]
  const prev = tokens[tokens.length - 2]
  // "6 × 7 = ?" → a question with rising intonation: "¿seis por siete son…?"
  if (last?.kind === 'blank' && prev?.kind === 'op' && prev.text === '=') {
    const body = tokens.slice(0, -2).map((t) => (t.kind === 'num' ? numWords(t.text, 'm') : t.kind === 'op' ? OP_WORD[t.text] : '¿cuánto?'))
    return `¿${body.join(' ')} son…?`
  }
  return tokens
    .map((t) => (t.kind === 'num' ? numWords(t.text, 'm') : t.kind === 'op' ? OP_WORD[t.text] ?? t.text : '… ¿cuánto?…'))
    .join(' ')
}

const EMOJI_RE = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}‍︎️⃣]/gu
const SYMBOLS_RE = /[☆✓✗✘❖◆◇○●■▪▫►▶◀♡♢♤♧★✦✧✩✪✫✬✭✮✯✰⋆]/gu

/** Clean and verbalise a piece of child-facing copy for TTS. */
export function toSpeakable(input: string): string {
  if (!input) return ''
  let s = input.normalize('NFC').replace(/[   ]/g, ' ')

  // Emoji operators → plain operators (before emojis are stripped).
  s = s.replace(/✖️?|✖/g, '×').replace(/➕/g, '+').replace(/➖/g, '−').replace(/➗/g, '÷').replace(/🟰/g, '=')

  // Markup.
  s = s
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<\/(p|div|li|h\d)>/gi, '. ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, ' y ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')

  // Maths spans first (they may contain "?" / "_" blanks that markdown stripping would eat).
  s = s.replace(MATH_RE, (_m, pre: string, expr: string) => `${pre}${readMath(expr)}`)

  // Ranges "3-4" → "tres a cuatro".
  s = s.replace(/(\d+)-(\d+)/g, (_m, a: string, b: string) => `${numWords(a, 'm')} a ${numWords(b, 'm')}`)

  // Ordinals: 1º, 2ª, 3.º
  s = s.replace(/(\d+)\.?\s?([ºª°])/g, (_m, n: string, o: string) => ordinalToSpanish(Number(n), o === 'ª'))

  // Numbers followed by a unit or currency.
  s = s.replace(/(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)\s?(€|%|cm|km|kg|ml|min|m|g|l|h|s)(?![\p{L}\d])/gu, (_m, n: string, u: string) => {
    const { int, dec } = parseNum(n)
    const [sing, plural] = UNITS[u]
    const fem = u === 'h'
    const words = dec ? numWords(n, 'm') : numberToSpanish(int, fem ? 'f' : 'apocope')
    return `${words} ${int === 1 && !dec ? sing : plural}`
  })

  // Remaining numbers, agreeing with the next word.
  s = s.replace(/(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)(\s+[\p{L}]+)?/gu, (_m, n: string, next?: string) => {
    if (!next) return numWords(n, 'm')
    const form: NumberForm = isFeminine(next.trim()) ? 'f' : 'apocope'
    return numWords(n, form) + next
  })

  // Markdown emphasis, bullets, arrows and other symbols.
  s = s
    .replace(/[*_~`#>|]+/g, ' ')
    .replace(/[→➜⇒⟶↦➔➡]/g, ', ')
    .replace(/\s[•·]\s/g, ', ')
    .replace(/&/g, ' y ')
    .replace(EMOJI_RE, ' ')
    .replace(SYMBOLS_RE, ' ')

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
