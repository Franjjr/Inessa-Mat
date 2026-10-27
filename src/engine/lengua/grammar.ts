/* Gramática de Lengua de 3.º (bloque «gram»): tocar las palabras de una clase en una frase, tocar el sujeto o el
   predicado, elegir la clase de una palabra (común o propio, género, número, tiempo) y escribir la palabra cambiada
   (en femenino, en plural, en pasado…). Los bancos están en words.ts. Las pistas nunca dan la palabra pedida: el nivel 1
   recuerda la idea, el 2 enseña ejemplos en una tarjeta («words») y el 3 da el paso que lleva a la respuesta. */
import type {
  Answer, CheckResult, ExerciseKind, Hint, LenguaExercise, LngClassifyExercise, LngSentencePartsExercise, LngTapWordsExercise,
  LngTransformExercise, Rng, SkillKey,
} from '@/types'
import { hashString, pick, range, shuffle } from '../rng'
import { parseSkill, type ParsedSkill } from '../skills'
import { compareText, normalizeAnswer } from './text'
import { ADJECTIVES, NOUNS, PROPER_NAMES, SENTENCES, VERBS, wordClass, type Noun, type Tense, type Verb } from './words'

/** The grammar kinds of this file (the other Lengua kinds are in spelling.ts, syllables.ts and vocabulary.ts). */
export type GrammarExercise = Extract<LenguaExercise, { kind: 'lng-tap-words' | 'lng-sentence-parts' | 'lng-classify' | 'lng-transform' }>

type Wanted = LngTapWordsExercise['wanted']
type Change = LngTransformExercise['change']

const CHILD = '¡Muy bien, {child}!'
const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'] = 'none', params?: Hint['params']): Hint =>
  params ? { level, text, visual, params } : { level, text, visual }

/** A pseudo-random, stable selection of up to n items that the keep test accepts (the hints of one exercise always agree). */
function spread<T>(items: readonly T[], seed: string, n: number, keep: (x: T) => boolean): T[] {
  const ok = items.filter(keep)
  if (ok.length === 0) return []
  const off = hashString(seed) % ok.length
  return Array.from({ length: Math.min(n, ok.length) }, (_, i) => ok[(off + i) % ok.length])
}

const lower = (s: string) => s.toLocaleLowerCase('es')
const verbForm = (v: Verb, t: Tense) => (t === 'presente' ? v.pres : t === 'pasado' ? v.pas : v.fut)
const article = (n: Noun, plural = false) => (n.g === 'm' ? (plural ? 'los' : 'el') : (plural ? 'las' : 'la'))

/** The género of a noun form: the feminine pair is «femenino»; the noun itself follows its gender (casa is femenino
    even without a masculine pair). */
export function generoOf(n: Noun, fem: boolean): 'masculino' | 'femenino' {
  return fem || n.g === 'f' ? 'femenino' : 'masculino'
}

/** Options shuffled, with the index of the correct one. */
function choice(rng: Rng, options: string[], correct: string): { options: string[]; answer: number } {
  const shuffled = shuffle(rng, options)
  return { options: shuffled, answer: shuffled.indexOf(correct) }
}

// ---------------------------------------------------------------- generators

function tapWanted(p: Item): Wanted {
  if (p.item === 'sustantivo' || p.item === 'adjetivo' || p.item === 'verbo' || p.item === 'articulo') return p.item
  throw new Error(`grammar: '${p.item}' is not a word class`)
}

/** Tap the words of one class. For verbs the sentence is one whose verbs are in the skill's tense. */
function genTap(wanted: Wanted, tense: Tense | undefined, skill: SkillKey, rng: Rng): LngTapWordsExercise {
  const pool = SENTENCES.filter((s) => (wanted !== 'verbo' || s.tense === tense) && s.words.some((w) => wordClass(w).cls === wanted))
  const s = pick(rng, pool)
  const targets = s.words.flatMap((w, i) => (wordClass(w).cls === wanted ? [i] : []))
  return { id: `lng-tap-words:${wanted}:${s.words.join(' ')}`, kind: 'lng-tap-words', skill, difficulty: 2, wanted, words: [...s.words], targets }
}

/** The subject is the first words of the sentence (its `subject` count); the predicate is the rest. */
function genParts(part: LngSentencePartsExercise['part'], skill: SkillKey, rng: Rng): LngSentencePartsExercise {
  const s = pick(rng, SENTENCES)
  const targets = part === 'sujeto' ? range(0, s.subject - 1) : range(s.subject, s.words.length - 1)
  return { id: `lng-sentence-parts:${part}:${s.words.join(' ')}`, kind: 'lng-sentence-parts', skill, difficulty: 3, part, words: [...s.words], targets }
}

function genClassify(item: Item, skill: SkillKey, rng: Rng): LngClassifyExercise {
  const base = { kind: 'lng-classify' as const, skill, difficulty: 1 }
  if (item.item === 'verbo') {
    const tense = item.level as Tense
    const v = pick(rng, VERBS)
    const { options, answer } = choice(rng, ['presente', 'pasado', 'futuro'], tense)
    return { ...base, id: `lng-classify:${skill}:${verbForm(v, tense)}`, word: verbForm(v, tense), question: '¿En qué tiempo está el verbo?', options, answer }
  }
  if (item.level === 'clase') {
    const proper = rng() < 0.5
    const word = proper ? pick(rng, PROPER_NAMES) : pick(rng, NOUNS).sg
    const { options, answer } = choice(rng, ['común', 'propio'], proper ? 'propio' : 'común')
    return { ...base, id: `lng-classify:${skill}:${word}`, word, question: '¿Es un nombre común o un nombre propio?', options, answer }
  }
  if (item.level === 'genero') {
    const n = pick(rng, NOUNS)
    const fem = n.f !== undefined && rng() < 0.5
    const word = fem && n.f ? n.f.sg : n.sg
    const { options, answer } = choice(rng, ['masculino', 'femenino'], generoOf(n, fem))
    return { ...base, id: `lng-classify:${skill}:${word}`, word, question: '¿Es masculino o femenino?', options, answer }
  }
  const n = pick(rng, NOUNS)
  const plural = rng() < 0.5
  const word = plural ? n.pl : n.sg
  const { options, answer } = choice(rng, ['singular', 'plural'], plural ? 'plural' : 'singular')
  return { ...base, id: `lng-classify:${skill}:${word}`, word, question: '¿Es singular o plural?', options, answer }
}

function genTransform(item: Item, skill: SkillKey, rng: Rng): LngTransformExercise {
  const make = (word: string, change: Change, answer: string): LngTransformExercise =>
    ({ id: `lng-transform:${change}:${word}`, kind: 'lng-transform', skill, difficulty: 2, word, change, answer })
  if (item.item === 'verbo') {
    const v = pick(rng, VERBS)
    if (item.level === 'presente') return make(v.pas, 'presente', v.pres)
    return item.level === 'futuro' ? make(v.pres, 'futuro', v.fut) : make(v.pres, 'pasado', v.pas)
  }
  if (item.item === 'adjetivo') {
    const a = pick(rng, ADJECTIVES)
    if (a.m.endsWith('o') && rng() < 0.5) return make(a.m, 'femenino', a.f)
    return make(a.m, 'plural', a.mPl)
  }
  if (item.level === 'genero') {
    const n = pick(rng, NOUNS.filter((x) => x.f))
    return make(n.sg, 'femenino', n.f!.sg)
  }
  const n = pick(rng, NOUNS)
  return rng() < 0.5 ? make(n.sg, 'plural', n.pl) : make(n.pl, 'singular', n.sg)
}

/** The exercise a Lengua skill makes for one of its kinds. Throws when the kind does not practise the skill. */
export function buildGrammar(kind: ExerciseKind, skill: SkillKey, rng: Rng): GrammarExercise {
  const p = parseSkill(skill)
  if (!p || p.type !== 'lengua') throw new Error(`grammar: '${skill}' is not a Lengua skill`)
  switch (kind) {
    case 'lng-tap-words': return genTap(tapWanted(p), p.level as Tense | undefined, skill, rng)
    case 'lng-sentence-parts':
      if (p.item !== 'oracion' || (p.level !== 'sujeto' && p.level !== 'predicado')) break
      return genParts(p.level, skill, rng)
    case 'lng-classify': return genClassify(p, skill, rng)
    case 'lng-transform': return genTransform(p, skill, rng)
  }
  throw new Error(`grammar: '${kind}' does not practise '${skill}'`)
}

type Item = Extract<ParsedSkill, { type: 'lengua' }>

// ---------------------------------------------------------------- prompts

const TAP_PROMPT: Record<Wanted, string> = {
  sustantivo: 'Toca los sustantivos',
  adjetivo: 'Toca los adjetivos',
  verbo: 'Toca los verbos',
  articulo: 'Toca los artículos',
}
const PART_PROMPT = {
  sujeto: 'Toca el sujeto: quién hace la acción',
  predicado: 'Toca el predicado: lo que hace o lo que pasa',
}

/** What the child is asked, as the view says it (the classify word and the transform word are shown apart). */
export function grammarPrompt(ex: GrammarExercise): string {
  switch (ex.kind) {
    case 'lng-tap-words': return TAP_PROMPT[ex.wanted]
    case 'lng-sentence-parts': return PART_PROMPT[ex.part]
    case 'lng-classify': return ex.question
    case 'lng-transform': return `Escribe en ${ex.change}:`
  }
}

/** One line for the daily plan and for the adults' reports. */
export function grammarStatement(ex: GrammarExercise): string {
  switch (ex.kind) {
    case 'lng-tap-words':
    case 'lng-sentence-parts': return `${grammarPrompt(ex)}: ${ex.words.join(' ')}`
    case 'lng-classify': return `${ex.question} ${ex.word}`
    case 'lng-transform': return `Escribe en ${ex.change}: ${ex.word}`
  }
}

// ---------------------------------------------------------------- check

const wrongShape = (expected: string): CheckResult => ({ correct: false, given: '', expected, errorType: 'other', feedback: 'Toca las palabras de la frase.' })

function checkTap(ex: LngTapWordsExercise | LngSentencePartsExercise, answer: Answer): CheckResult {
  const expected = ex.targets.map((i) => ex.words[i]).join(', ')
  if (answer.type !== 'marks') return wrongShape(expected)
  const marked = [...new Set(answer.marked)].filter((i) => Number.isInteger(i) && i >= 0 && i < ex.words.length).sort((a, b) => a - b)
  const given = marked.map((i) => ex.words[i]).join(', ') || '—'
  if (marked.length === ex.targets.length && marked.every((v, i) => v === ex.targets[i])) return { correct: true, given, expected, feedback: CHILD }
  const wrongTap = marked.some((i) => !ex.targets.includes(i))
  if (ex.kind === 'lng-sentence-parts') {
    return {
      correct: false, given, expected, errorType: 'sentence-part',
      feedback: wrongTap ? `Esa palabra no forma parte del ${ex.part}. Mira otra vez.` : 'Te falta alguna palabra. Busca otra vez.',
    }
  }
  return {
    correct: false, given, expected, errorType: 'word-class',
    feedback: wrongTap ? 'Esa palabra no es de esa clase. Mira otra vez.' : 'Te falta alguna palabra. Busca otra vez.',
  }
}

function checkClassify(ex: LngClassifyExercise, answer: Answer): CheckResult {
  const expected = ex.options[ex.answer]
  if (answer.type !== 'choice' || answer.index === null) {
    return { correct: false, given: '', expected, errorType: 'incomplete', feedback: 'Elige una respuesta.' }
  }
  const given = ex.options[answer.index] ?? ''
  if (answer.index === ex.answer) return { correct: true, given, expected, feedback: CHILD }
  return { correct: false, given, expected, errorType: 'word-class', feedback: 'Mira la palabra otra vez y piénsalo despacio.' }
}

function checkTransform(ex: LngTransformExercise, answer: Answer): CheckResult {
  if (answer.type !== 'text') return { correct: false, given: '', expected: ex.answer, errorType: 'other', feedback: 'Escribe la palabra.' }
  const value = normalizeAnswer(answer.value ?? '')
  if (!value) return { correct: false, given: '', expected: ex.answer, errorType: 'incomplete', feedback: 'Escribe la palabra.' }
  // Capitals are forgiven (a name or a sentence start); accents count.
  const r = compareText(value, ex.answer, 'ignore-case')
  if (r.correct) return { correct: true, given: value, expected: ex.answer, feedback: CHILD }
  const feedback = r.accentOnly ? '¡Casi! Mira la tilde.' : 'Revisa la terminación de la palabra.'
  return { correct: false, given: value, expected: ex.answer, errorType: 'word-form', feedback }
}

/** Checks a typed or tapped answer of a Lengua exercise. */
export function checkGrammar(ex: GrammarExercise, answer: Answer): CheckResult {
  switch (ex.kind) {
    case 'lng-tap-words':
    case 'lng-sentence-parts': return checkTap(ex, answer)
    case 'lng-classify': return checkClassify(ex, answer)
    case 'lng-transform': return checkTransform(ex, answer)
  }
}

// ---------------------------------------------------------------- hints

const TAP_TEXT: Record<Wanted, [string, string, string]> = {
  sustantivo: [
    'Los sustantivos nombran personas, animales o cosas, y también lugares.',
    'Mira estas palabras: son sustantivos. Fíjate en lo que nombran.',
    'Pregúntate: ¿quién o qué es? Si puedes poner un o una delante, es un sustantivo.',
  ],
  adjetivo: [
    'Los adjetivos dicen cómo es alguien o algo.',
    'Busca la palabra que describe a un nombre: dice su color, su tamaño o cómo es.',
    'Pregúntate: ¿cómo es? Si responde a esa pregunta, es un adjetivo.',
  ],
  verbo: [
    'Los verbos dicen lo que hace alguien o lo que pasa.',
    'Fíjate en la palabra que cambia cuando cambia el momento: ahora, antes o después.',
    'Pregúntate: ¿qué hace? Si responde a esa pregunta, es un verbo.',
  ],
  articulo: [
    'Son palabras muy cortas que van justo delante del nombre.',
    'Mira lo que viene detrás: ¿es uno o son varios?',
    'Pregúntate: ¿qué palabrita corta está pegada al nombre?',
  ],
}

function tapChips(ex: LngTapWordsExercise): string[] {
  const words = new Set(ex.words.map(lower))
  const fresh = (w: string) => !words.has(lower(w))
  switch (ex.wanted) {
    case 'sustantivo': return spread(NOUNS.map((n) => n.sg), ex.id, 4, fresh)
    case 'adjetivo': return spread(ADJECTIVES.map((a) => a.m), ex.id, 4, fresh)
    case 'verbo': return spread(VERBS, ex.id, 3, (v) => fresh(v.pres) && fresh(v.pas) && fresh(v.fut)).map((v) => `${v.pres} · ${v.pas} · ${v.fut}`)
    // The article is the blank the child must find: the chips never show it.
    case 'articulo': return spread(NOUNS, ex.id, 4, (n) => fresh(n.sg)).map((n) => `___ ${n.sg}`)
  }
}

const PART_TEXT: Record<LngSentencePartsExercise['part'], [string, string, string]> = {
  sujeto: [
    'Dice quién hace algo en esta frase: ¿quién salta, canta o pinta?',
    'Pregúntate: ¿quién hace esto?',
    'Suele estar al principio, antes del verbo: ¿qué palabras son?',
  ],
  predicado: [
    'Dice qué hace o qué pasa, lo que viene tras quien lo hace.',
    'Pregúntate: ¿qué hace? ¿qué pasa?',
    'Viene después y cuenta lo que pasa: ¿qué palabras son?',
  ],
}

type ClassifyTopic = 'clase' | 'genero' | 'numero' | 'verbo'
const CLASSIFY_TEXT: Record<ClassifyTopic, [string, string, string]> = {
  clase: [
    'Hay nombres que valen para muchos seres iguales, y otros que son de uno solo.',
    'Pregúntate: ¿nombra a una persona concreta, a alguien por su nombre?',
    'Mira: ¿es el nombre de alguien en particular o de cualquiera de su clase?',
  ],
  genero: [
    'Cada nombre tiene un género: puede ser de niño o de niña, aunque sea una cosa.',
    'Pregúntate: ¿qué artículo le iría delante, el o la?',
    'Fíjate en cómo termina la palabra, pero hay excepciones: ¿qué artículo suena bien delante?',
  ],
  numero: [
    'Mira si hay uno o si hay varios.',
    'Pregúntate: ¿cuántos son? Imagina que hay uno, y luego que hay dos.',
    '¿Habla de uno o de varios? Prueba a poner «un» o «dos» delante.',
  ],
  verbo: [
    'El verbo cambia según cuándo pasa la acción: ahora, antes o después.',
    'Mira cómo termina la palabra: cada momento tiene su terminación.',
    '¿Pasa ahora, ya pasó o pasará? Prueba a poner «ayer», «hoy» o «mañana» delante.',
  ],
}

function classifyTopic(ex: LngClassifyExercise): ClassifyTopic {
  if (ex.options.includes('común')) return 'clase'
  if (ex.options.includes('masculino')) return 'genero'
  if (ex.options.includes('singular')) return 'numero'
  return 'verbo'
}

function classifyChips(ex: LngClassifyExercise): string[] {
  const topic = classifyTopic(ex)
  const fresh = (w: string) => lower(w) !== lower(ex.word)
  if (topic === 'clase') return spread([...PROPER_NAMES, ...NOUNS.map((n) => n.sg)], ex.id, 4, fresh)
  if (topic === 'genero') return spread(NOUNS, ex.id, 4, (n) => fresh(n.sg)).map((n) => `${article(n)} ${n.sg}`)
  if (topic === 'numero') {
    return spread(NOUNS, ex.id, 3, (n) => fresh(n.sg) && fresh(n.pl))
      .map((n) => `${n.g === 'm' ? 'un' : 'una'} ${n.sg} · dos ${n.pl}`)
  }
  const v = spread(VERBS, ex.id, 1, (x) => fresh(x.pres) && fresh(x.pas) && fresh(x.fut))[0]
  return v ? [`ahora: ${v.pres}`, `antes: ${v.pas}`, `después: ${v.fut}`] : []
}

const TRANSFORM_TEXT: Record<Change, [string, string, string]> = {
  femenino: [
    'Según sea una chica o un chico, una cosa o un animal, la palabra puede cambiar su final.',
    'Mira estos ejemplos y fíjate en cómo termina cada palabra.',
    'Piensa: si hablas de una niña o de una cosa así, ¿cómo termina la palabra?',
  ],
  plural: [
    'Para hablar de varios, la palabra cambia su final.',
    'Mira estos ejemplos y fíjate en cómo termina cada palabra.',
    '¿Termina en vocal o en consonante? ¿Qué le toca al final para hablar de varios?',
  ],
  singular: [
    'Piensa si es uno solo o si son varios: al revés que el plural.',
    'Mira estos ejemplos y fíjate en cómo termina cada palabra.',
    '¿Cómo termina la palabra cuando hablas de uno solo?',
  ],
  pasado: [
    'Pasado es lo que ya pasó: el verbo cambia su terminación.',
    'Mira estos ejemplos y fíjate en el final de cada verbo.',
    '¿De qué grupo es el verbo, -ar, -er o -ir? ¿Cómo termina en pasado cada grupo?',
  ],
  futuro: [
    'Futuro es lo que todavía no pasa: el verbo cambia su final.',
    'Mira estos ejemplos y fíjate en cómo termina cada verbo.',
    'Imagina que es mañana: ¿qué palabra usarías? Piensa en el infinitivo.',
  ],
  presente: [
    'Presente es lo que pasa ahora: el verbo cambia su final.',
    'Mira estos ejemplos y fíjate en cómo termina cada verbo.',
    '¿Qué pasa ahora? ¿Cómo termina el verbo cuando la acción pasa ahora: en -a o en -e?',
  ],
}

function transformChips(ex: LngTransformExercise): string[] {
  const fresh = (...ws: string[]) => ws.every((w) => lower(w) !== lower(ex.word) && lower(w) !== lower(ex.answer))
  const pairs: [string, string][] = []
  switch (ex.change) {
    case 'femenino':
      for (const n of NOUNS) if (n.f) pairs.push([n.sg, n.f.sg])
      for (const a of ADJECTIVES) if (a.m.endsWith('o')) pairs.push([a.m, a.f])
      break
    case 'plural':
      for (const n of NOUNS) pairs.push([n.sg, n.pl])
      for (const a of ADJECTIVES) pairs.push([a.m, a.mPl])
      break
    case 'singular':
      for (const n of NOUNS) pairs.push([n.pl, n.sg])
      break
    case 'pasado':
      for (const v of VERBS) pairs.push([v.pres, v.pas])
      break
    case 'futuro':
      for (const v of VERBS) pairs.push([v.pres, v.fut])
      break
    case 'presente':
      for (const v of VERBS) pairs.push([v.pas, v.pres])
      break
  }
  return spread(pairs, ex.id, 3, ([a, b]) => fresh(a, b)).map(([a, b]) => `${a} → ${b}`)
}

/** Three hints, from the idea to the step before the answer. None names the word or the answer. */
export function hintsGrammar(ex: GrammarExercise): Hint[] {
  switch (ex.kind) {
    case 'lng-tap-words': {
      const [a, b, c] = TAP_TEXT[ex.wanted]
      return [hint(1, a), hint(2, b, 'words', { words: tapChips(ex) }), hint(3, c)]
    }
    case 'lng-sentence-parts': {
      const [a, b, c] = PART_TEXT[ex.part]
      const chips = ex.part === 'sujeto' ? ['¿quién?', '¿qué hace?'] : ['¿qué hace?', '¿qué pasa?']
      return [hint(1, a), hint(2, b, 'words', { words: chips }), hint(3, c)]
    }
    case 'lng-classify': {
      const [a, b, c] = CLASSIFY_TEXT[classifyTopic(ex)]
      return [hint(1, a), hint(2, b, 'words', { words: classifyChips(ex) }), hint(3, c)]
    }
    case 'lng-transform': {
      const [a, b, c] = TRANSFORM_TEXT[ex.change]
      return [hint(1, a), hint(2, b, 'words', { words: transformChips(ex) }), hint(3, c)]
    }
  }
}
