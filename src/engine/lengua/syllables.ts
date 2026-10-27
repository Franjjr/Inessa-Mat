/* Sílabas de las palabras de Lengua de 3.º: el partidor que usan los ejercicios de contar o separar sílabas
   («lng-syllables», gram:silabas) y de tocar la sílaba fuerte («lng-stress», orto:tonica).
   Reglas: dos vocales juntas forman un diptongo, salvo que sean dos abiertas (a, e, o) o que la débil lleve tilde (í, ú):
   entonces hay hiato. La h entre vocales no separa. Dos consonantes que van juntas (bl, br, cl, cr, dr, fl, fr, gl, gr,
   kl, kr, pl, pr, tl, tr) empiezan la sílaba siguiente. ch, ll, rr, qu y gu (ante e, i) son un solo sonido. */
import type { Answer, CheckResult, Hint, LngStressExercise, LngSyllablesExercise, Rng, SkillKey } from '@/types'
import { hashString, pick, shuffle } from '../rng'

/** t is the letters written; v is the vowel it sounds like (a final y sounds like i). */
interface Unit { t: string; kind: 'V' | 'C' | 'H'; v?: string }

const INSEPARABLE = new Set(['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'kl', 'kr', 'pl', 'pr', 'tl', 'tr'])
const isStrong = (v: string) => 'aeoáéó'.includes(v)
const isAccentedWeak = (v: string) => 'íú'.includes(v)
const VOWEL_LETTERS = 'aeiouáéíóúü'

/** Letters as units: vowels (a final y after a vowel is i), consonants, and the h that may be silent. */
function unitsOf(word: string): Unit[] {
  const w = word.toLocaleLowerCase('es').normalize('NFC')
  const out: Unit[] = []
  let i = 0
  while (i < w.length) {
    const c = w[i]
    const n = w[i + 1]
    if ((c === 'c' && n === 'h') || (c === 'l' && n === 'l') || (c === 'r' && n === 'r')) { out.push({ t: c + n, kind: 'C' }); i += 2; continue }
    if (c === 'q' && n === 'u') { out.push({ t: 'qu', kind: 'C' }); i += 2; continue }
    if (c === 'g' && n === 'u' && 'eéií'.includes(w[i + 2] ?? '')) { out.push({ t: 'gu', kind: 'C' }); i += 2; continue }
    if (c === 'y' && (w.length === 1 || (i === w.length - 1 && VOWEL_LETTERS.includes(w[i - 1])))) { out.push({ t: 'y', kind: 'V', v: 'i' }); i++; continue }
    if (VOWEL_LETTERS.includes(c)) { out.push({ t: c, kind: 'V' }); i++; continue }
    if (c === 'h') { out.push({ t: 'h', kind: 'H' }); i++; continue }
    out.push({ t: c, kind: 'C' })
    i++
  }
  return out
}

/** Runs of vowels (an h between two vowels joins the run); everything else is a run of consonants. */
function chunksOf(units: Unit[]): { vowel: boolean; us: Unit[] }[] {
  const chunks: { vowel: boolean; us: Unit[] }[] = []
  units.forEach((u, i) => {
    const inside = u.kind === 'V' || (u.kind === 'H' && units[i - 1]?.kind === 'V' && units[i + 1]?.kind === 'V')
    const last = chunks[chunks.length - 1]
    if (last && last.vowel === inside) last.us.push(u)
    else chunks.push({ vowel: inside, us: [u] })
  })
  return chunks
}

/** Splits a run of vowels into nuclei: a hiatus between two vowels opens a new nucleus (the h goes with it). */
function nucleiOf(us: Unit[]): Unit[][] {
  const groups: Unit[][] = []
  let cur: Unit[] = []
  let prev: string | null = null
  let pendingH: Unit[] = []
  for (const u of us) {
    if (u.kind === 'H') { pendingH.push(u); continue }
    const sound = u.v ?? u.t
    const hiatus = prev !== null && ((isStrong(prev) && isStrong(sound)) || isAccentedWeak(prev) || isAccentedWeak(sound))
    if (hiatus) { groups.push(cur); cur = [...pendingH, u] } else cur.push(...pendingH, u)
    pendingH = []
    prev = sound
  }
  groups.push(cur)
  return groups
}

/** How many of the consonants between two nuclei stay with the syllable before; the rest starts the next one. */
function keepBefore(c: Unit[]): number {
  if (c.length <= 1) return 0
  if (c.length === 2) return INSEPARABLE.has(c[0].t + c[1].t) ? 0 : 1
  return INSEPARABLE.has(c[c.length - 2].t + c[c.length - 1].t) ? c.length - 2 : c.length - 1
}

const textOf = (us: Unit[]) => us.map((u) => u.t).join('')

/** The syllables of a Spanish word, in lowercase («Mariposa» → ma, ri, po, sa). A word with no vowel is one piece. */
export function syllabify(word: string): string[] {
  const nuclei: Unit[][] = []
  const before: Unit[][] = []
  let pending: Unit[] = []
  for (const chunk of chunksOf(unitsOf(word))) {
    if (!chunk.vowel) { pending = [...pending, ...chunk.us]; continue }
    nucleiOf(chunk.us).forEach((g, j) => {
      before.push(j === 0 ? pending : [])
      nuclei.push(g)
    })
    pending = []
  }
  if (nuclei.length === 0) return [textOf(unitsOf(word))]
  const tail = pending
  return nuclei.map((nucleus, k) => {
    const lead = k === 0 ? before[0] : before[k].slice(keepBefore(before[k]))
    const trail = k === nuclei.length - 1 ? tail : before[k + 1].slice(0, keepBefore(before[k + 1]))
    return textOf([...lead, ...nucleus, ...trail])
  })
}

/** The index of the stressed syllable: the written tilde if there is one, else the rule (llana: a word that ends in a
    vowel, n or s; aguda: the rest). */
export function stressedSyllable(word: string): number {
  const syl = syllabify(word)
  if (syl.length <= 1) return 0
  const accented = syl.findIndex((s) => /[áéíóú]/.test(s))
  if (accented >= 0) return accented
  const last = word.toLocaleLowerCase('es').slice(-1)
  return /[aeiouüns]/.test(last) ? syl.length - 2 : syl.length - 1
}

// ---------------------------------------------------------------- exercises

/** Words of 3.º with two or more syllables, for the count, split and stress exercises (the syllabifier tests check them). */
export const SYLLABLE_WORDS: string[] = [
  'casa', 'mesa', 'perro', 'pelota', 'mariposa', 'gato', 'elefante', 'jirafa', 'cocodrilo', 'hormiga', 'cuento', 'pingüino',
  'ciudad', 'perrito', 'chocolate', 'llave', 'bicicleta', 'caballo', 'tortuga', 'estrella', 'ventana', 'cuchara', 'paraguas',
  'lápiz', 'árbol', 'camión', 'canción', 'leer', 'día', 'reír', 'baúl', 'búho', 'huevo', 'murciélago', 'teléfono', 'reloj',
  'mano', 'sombrero', 'hombro', 'conejo', 'ardilla', 'abeja', 'cangrejo', 'mochila', 'zapato', 'tijera', 'hospital',
  'ventilador', 'biblioteca', 'aire', 'ruido', 'vacaciones', 'guitarra', 'queso', 'cuaderno', 'vergüenza', 'tiempo',
  'hierba', 'hueso', 'escuela', 'estudio', 'nube', 'viaje', 'jaula', 'oído', 'leído', 'Paraguay', 'prohibir', 'cigüeña',
]

/** Wrong cuts of a word (for «split»): two other ways to cut the same letters, moving one cut. */
function wrongSplits(parts: string[]): string[] {
  const out: string[] = []
  if (parts.length >= 3) out.push([parts[0] + parts[1], ...parts.slice(2)].join('-'))
  const longest = parts.reduce((best, p, i) => (p.length > parts[best].length ? i : best), 0)
  const p = parts[longest]
  if (p.length >= 3) {
    out.push([...parts.slice(0, longest), p.slice(0, 1), p.slice(1), ...parts.slice(longest + 1)].join('-'))
    out.push([...parts.slice(0, longest), p.slice(0, -1), p.slice(-1), ...parts.slice(longest + 1)].join('-'))
  }
  return [...new Set(out)].filter((s) => s !== parts.join('-'))
}

/** count: how many syllables the word has, with the numbers next to it. split: the right cut, and two wrong ones. */
export function buildSyllables(skill: SkillKey, rng: Rng, mode: 'count' | 'split'): LngSyllablesExercise {
  const word = pick(rng, SYLLABLE_WORDS)
  const parts = syllabify(word)
  const answer = mode === 'count' ? String(parts.length) : parts.join('-')
  const others = mode === 'count'
    ? [String(parts.length - 1), String(parts.length + 1)]
    : wrongSplits(parts).slice(0, 2)
  return {
    id: `lng-syllables:${mode}:${word}`, kind: 'lng-syllables', skill, difficulty: mode === 'count' ? 1 : 3,
    word, mode, options: shuffle(rng, [answer, ...others]), answer,
  }
}

/** The stressed syllable of a word: the parts are shown and the child taps one. */
export function buildStress(skill: SkillKey, rng: Rng): LngStressExercise {
  const word = pick(rng, SYLLABLE_WORDS)
  return {
    id: `lng-stress:${word}`, kind: 'lng-stress', skill, difficulty: 2, word, syllables: syllabify(word), stressed: stressedSyllable(word),
  }
}

// ---------------------------------------------------------------- check, hints, statement

const CHILD = '¡Muy bien, {child}!'

export function checkSyllables(ex: LngSyllablesExercise, answer: Answer): CheckResult {
  if (answer.type !== 'choice' || answer.index === null) {
    return { correct: false, given: '', expected: ex.answer, errorType: 'incomplete', feedback: 'Elige una respuesta.' }
  }
  const given = ex.options[answer.index] ?? ''
  if (given === ex.answer) return { correct: true, given, expected: ex.answer, feedback: CHILD }
  return {
    correct: false, given, expected: ex.answer, errorType: 'syllable',
    feedback: ex.mode === 'count'
      ? 'Cuenta otra vez: di la palabra despacio y da una palmada por cada sílaba.'
      : 'Mira dónde se corta cada sílaba: las vocales juntas suelen ir en la misma.',
  }
}

export function checkStress(ex: LngStressExercise, answer: Answer): CheckResult {
  const expected = ex.syllables[ex.stressed]
  if (answer.type !== 'marks' || answer.marked.length === 0) {
    return { correct: false, given: '', expected, errorType: 'incomplete', feedback: 'Toca la sílaba que se dice con más fuerza.' }
  }
  const given = answer.marked.map((i) => ex.syllables[i]).join('-')
  if (answer.marked.length === 1 && answer.marked[0] === ex.stressed) return { correct: true, given, expected, feedback: CHILD }
  return { correct: false, given, expected, errorType: 'stress', feedback: 'Esa sílaba no es la fuerte. Dila despacio y busca la que suena más.' }
}

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'] = 'none', params?: Hint['params']): Hint =>
  params ? { level, text, visual, params } : { level, text, visual }

/** Other words, split (never the one asked, and no numbers): the model the child looks at. */
function modelsFor(word: string, id: string): string[] {
  const others = SYLLABLE_WORDS.filter((w) => w !== word)
  const off = hashString(id) % others.length
  return [0, 1, 2].map((i) => syllabify(others[(off + i) % others.length]).join('-'))
}

export function hintsSyllables(ex: LngSyllablesExercise | LngStressExercise): Hint[] {
  if (ex.kind === 'lng-stress') {
    return [
      hint(1, 'Cada palabra tiene una sílaba con más fuerza. Dila despacio y escucha cuál suena más.'),
      hint(2, 'Estas pistas ayudan a encontrarla:', 'words', { words: ['llana: acaba en vocal, n o s', 'aguda: acaba en otra letra', 'con tilde: el acento escrito marca esa sílaba'] }),
      hint(3, 'Cuenta las sílabas desde el final: ¿suena más fuerte el último golpe o el penúltimo?'),
    ]
  }
  if (ex.mode === 'count') {
    return [
      hint(1, 'Di la palabra despacio. Cada golpe de voz es una sílaba: pon la mano delante de la boca mientras la dices.'),
      hint(2, 'Así se separan otras palabras:', 'words', { words: modelsFor(ex.word, ex.id) }),
      hint(3, 'Cuenta los golpes de voz uno a uno. Dos vocales juntas que suenan a la vez son una sola sílaba. ¿Cuántos golpes has contado?'),
    ]
  }
  return [
    hint(1, 'Di la palabra despacio y busca los golpes de voz: cada sílaba es un golpe.'),
    hint(2, 'Así se separan otras palabras:', 'words', { words: modelsFor(ex.word, ex.id) }),
    hint(3, 'Corta después de una vocal cuando la consonante va sola. Si hay dos consonantes que no van juntas, la primera cierra una sílaba y la segunda empieza otra. ¿Dónde corta la voz?'),
  ]
}

export function statementSyllables(ex: LngSyllablesExercise | LngStressExercise): string {
  if (ex.kind === 'lng-stress') return `Toca la sílaba fuerte de: ${ex.word}`
  return ex.mode === 'count' ? `Cuenta las sílabas de: ${ex.word}` : `Separa en sílabas: ${ex.word}`
}
