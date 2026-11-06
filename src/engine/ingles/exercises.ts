/* Inglés de 3.º: los nueve ejercicios en inglés (eng-*): generar, comprobar, pistas y enunciado. Puro: sin React ni audio.
   Los de oír (eng-listen-pick, eng-num-listen, eng-op-listen) los dice la voz en inglés; su texto nunca va en el enunciado.
   Las pistas tienen tres niveles (la idea, una pregunta, un paso) y nunca dan la respuesta. Un error muestra la respuesta
   correcta; una palabra a una letra de distancia es «¡Casi!», nunca «¡Mal!». */
import type {
  Answer, CheckResult, EnglishCard, EnglishExercise, ExerciseKind, Hint, Rng, SkillKey,
  EngCompleteExercise, EngListenPickExercise, EngMatchExercise, EngNumListenExercise, EngNumWriteExercise,
  EngOpListenExercise, EngWriteWordExercise, EngMemoryExercise, EngScrambleExercise,
} from '@/types'
import { parseSkill } from '../skills'
import { pick, randInt, range, shuffle } from '../rng'
import { ENGLISH_WORDS, MEMORY_PAIRS, type EnglishTheme, type EnglishWord } from './words'
import { numberToEnglish, operationToEnglish } from './numbers'
import { compareEnglish } from './text'
import { PHRASE_IDEAS, PHRASES } from './phrases'

export const ENGLISH_KINDS: ExerciseKind[] = [
  'eng-listen-pick', 'eng-match', 'eng-write-word', 'eng-complete', 'eng-num-write', 'eng-num-listen', 'eng-op-listen',
  'eng-memory', 'eng-scramble',
]

/** The kinds that the voice reads: none of them is planned, nor shown, with the sound off. */
export const ENGLISH_LISTENING_KINDS: ExerciseKind[] = ['eng-listen-pick', 'eng-num-listen', 'eng-op-listen']

/** The name of each theme in the hints («Es una palabra del tema «animales»»). */
export const THEME_NAME: Record<string, string> = {
  saludos: 'saludos', colores: 'colores y formas', animales: 'animales', familia: 'familia', comida: 'comida', ropa: 'ropa',
  cole: 'el cole', casa: 'la casa', cuerpo: 'el cuerpo', tiempo: 'el tiempo', dias: 'días y meses',
}

/** The numbers of each English number skill (eng:num:<item>). */
const NUMBERS: Record<string, () => number[]> = {
  '0-20': () => range(0, 20),
  decenas: () => range(3, 10).map((d) => d * 10),
  '21-100': () => range(21, 100),
}

const OPERATIONS: Record<string, '+' | '-' | '×'> = { plus: '+', minus: '-', times: '×' }

/** The letters of an English text, lower case, without spaces, hyphens and marks. */
const letters = (s: string) => s.replace(/[^\p{L}]/gu, '').toLowerCase()
/** «1 letra», «3 letras»: the count in a hint, with its plural. */
const letrasDe = (n: number) => `${n} ${n === 1 ? 'letra' : 'letras'}`
const cardOf = (w: EnglishWord): EnglishCard => ({ en: w.en, es: w.es, theme: w.theme, ...(w.emoji ? { emoji: w.emoji } : {}) })
/** What a card shows as its picture: the emoji, or the Spanish word when the theme has no picture. */
const faceOf = (c: EnglishCard) => c.emoji ?? c.es

function themeOf(item: string): EnglishTheme {
  const theme = ENGLISH_WORDS.find((w) => w.theme === item)?.theme
  if (!theme) throw new Error(`ingles: '${item}' is not a theme of the vocabulary`)
  return theme
}
const wordsOf = (theme: EnglishTheme) => ENGLISH_WORDS.filter((w) => w.theme === theme)
/** Every letter of a one-word English word, in order, as a tile of the scramble (lower case). */
const tilesOf = (en: string) => [...letters(en)]
/** The tiles in a shuffled order that is never the word itself (a word of one repeated letter gets its tiles rotated). */
function scrambledTiles(rng: Rng, en: string): string[] {
  const target = tilesOf(en).join('')
  for (let tries = 0; tries < 50; tries++) {
    const tiles = shuffle(rng, tilesOf(en))
    if (tiles.join('') !== target) return tiles
  }
  const [first, ...rest] = tilesOf(en)
  return [...rest, first]
}

// ---------------------------------------------------------------- generation

function buildListenPick(skill: SkillKey, theme: EnglishTheme, rng: Rng): EngListenPickExercise {
  const target = pick(rng, wordsOf(theme))
  const others = shuffle(rng, wordsOf(theme).filter((w) => w.en !== target.en))
  const count = randInt(rng, 3, 4)
  const cards = shuffle(rng, [target, ...others.slice(0, count - 1)].map(cardOf))
  return { id: `eng-listen-pick:${skill}:${target.en}`, kind: 'eng-listen-pick', skill, difficulty: 1, word: target.en, theme, cards, answer: cards.findIndex((c) => c.en === target.en) }
}

function buildMatch(skill: SkillKey, theme: EnglishTheme, rng: Rng): EngMatchExercise {
  const four = shuffle(rng, wordsOf(theme)).slice(0, 4)
  const cards = shuffle(rng, four.map(cardOf))
  const words = shuffle(rng, four.map((w) => w.en))
  const answer = words.map((en) => cards.findIndex((c) => c.en === en))
  return { id: `eng-match:${skill}:${[...words].sort().join(',')}`, kind: 'eng-match', skill, difficulty: 2, words, cards, answer }
}

function buildWriteWord(skill: SkillKey, theme: EnglishTheme, rng: Rng): EngWriteWordExercise {
  const w = pick(rng, wordsOf(theme))
  return { id: `eng-write-word:${skill}:${w.en}`, kind: 'eng-write-word', skill, difficulty: 2, card: cardOf(w), answer: w.en, alts: w.alts ?? [] }
}

/** Six words of the theme with a picture; the deck holds each pair twice (the picture and the word), shuffled. */
function buildMemory(skill: SkillKey, theme: EnglishTheme, rng: Rng): EngMemoryExercise {
  const words = shuffle(rng, wordsOf(theme).filter((w) => w.emoji)).slice(0, MEMORY_PAIRS)
  if (words.length < MEMORY_PAIRS) throw new Error(`ingles: '${theme}' has fewer than ${MEMORY_PAIRS} pictures`)
  const pairs = words.map(cardOf)
  const deck = shuffle(rng, pairs.flatMap((_, pair) => [{ pair, side: 'picture' as const }, { pair, side: 'word' as const }]))
  return { id: `eng-memory:${skill}:${[...words.map((w) => w.en)].sort().join(',')}`, kind: 'eng-memory', skill, difficulty: 2, theme, pairs, deck }
}

/** One word of the theme without a space (the tiles are its letters); the picture is its emoji or its Spanish word. */
function buildScramble(skill: SkillKey, theme: EnglishTheme, rng: Rng): EngScrambleExercise {
  const w = pick(rng, wordsOf(theme).filter((x) => !x.en.includes(' ')))
  return {
    id: `eng-scramble:${skill}:${w.en}`, kind: 'eng-scramble', skill, difficulty: 2, card: cardOf(w), answer: w.en, alts: w.alts ?? [],
    tiles: scrambledTiles(rng, w.en),
  }
}

function buildComplete(skill: SkillKey, rng: Rng): EngCompleteExercise {
  const items = PHRASES[skill]
  if (!items) throw new Error(`ingles: no phrases for '${skill}'`)
  const item = pick(rng, items)
  const options = shuffle(rng, [item.answer, ...item.distractors])
  return {
    id: `eng-complete:${skill}:${item.sentence}`, kind: 'eng-complete', skill, difficulty: 2, sentence: item.sentence, options,
    answer: options.indexOf(item.answer), ...(item.es ? { es: item.es } : {}),
  }
}

function buildNumWrite(skill: SkillKey, item: string, rng: Rng): EngNumWriteExercise {
  const value = pick(rng, NUMBERS[item]())
  return { id: `eng-num-write:${skill}:${value}`, kind: 'eng-num-write', skill, difficulty: 1, value, answer: numberToEnglish(value) }
}

function buildNumListen(skill: SkillKey, item: string, rng: Rng): EngNumListenExercise {
  const value = pick(rng, NUMBERS[item]())
  return { id: `eng-num-listen:${skill}:${value}`, kind: 'eng-num-listen', skill, difficulty: 1, value, spoken: numberToEnglish(value), answer: value }
}

/** plus and minus keep the result between 0 and 20; times uses the tables of 2, 5 and 10. */
function buildOpListen(skill: SkillKey, level: string, rng: Rng): EngOpListenExercise {
  const op = OPERATIONS[level]
  if (!op) throw new Error(`ingles: '${level}' is not an operation`)
  let a: number
  let b: number
  let answer: number
  if (op === '+') {
    a = randInt(rng, 1, 19)
    b = randInt(rng, 1, 20 - a)
    answer = a + b
  } else if (op === '-') {
    a = randInt(rng, 2, 20)
    b = randInt(rng, 1, a - 1)
    answer = a - b
  } else {
    a = pick(rng, [2, 5, 10])
    b = randInt(rng, 1, 10)
    answer = a * b
  }
  return {
    id: `eng-op-listen:${skill}:${a}${op}${b}`, kind: 'eng-op-listen', skill, difficulty: 3,
    a, op, b, spoken: operationToEnglish(a, op, b), answer,
  }
}

/** One exercise of an English kind for one English skill (src/engine/skills.ts englishKinds). */
export function buildEnglish(kind: ExerciseKind, skill: SkillKey, rng: Rng): EnglishExercise {
  const p = parseSkill(skill)
  if (!p || p.type !== 'ingles') throw new Error(`ingles: '${skill}' is not an English skill`)
  switch (kind) {
    case 'eng-listen-pick': return buildListenPick(skill, themeOf(p.item), rng)
    case 'eng-match': return buildMatch(skill, themeOf(p.item), rng)
    case 'eng-write-word': return buildWriteWord(skill, themeOf(p.item), rng)
    case 'eng-memory': return buildMemory(skill, themeOf(p.item), rng)
    case 'eng-scramble': return buildScramble(skill, themeOf(p.item), rng)
    case 'eng-complete': return buildComplete(skill, rng)
    case 'eng-num-write': return buildNumWrite(skill, p.item, rng)
    case 'eng-num-listen': return buildNumListen(skill, p.item, rng)
    case 'eng-op-listen': return buildOpListen(skill, p.level ?? '', rng)
    default: throw new Error(`ingles: '${kind}' is not an English kind`)
  }
}

// ---------------------------------------------------------------- checking

/** A tap on one of the choices: the index must be the right one. */
function checkChoice(answer: Answer, expected: number, label: string, feedback: string): CheckResult {
  const picked = answer.type === 'choice' ? answer.index : null
  if (picked === null) return { correct: false, given: '', expected: label, errorType: 'other', feedback: 'Toca una respuesta.' }
  if (picked === expected) return { correct: true, given: label, expected: label }
  return { correct: false, given: String(picked), expected: label, errorType: 'other', feedback }
}

/** A typed English word or phrase: a letter away is «¡Casi!», anything else shows the right word. */
function checkText(answer: Answer, expected: string, alts: string[] = []): CheckResult {
  const value = answer.type === 'text' ? (answer.value ?? '') : ''
  const cmp = compareEnglish(value, expected, alts)
  if (cmp.correct) return { correct: true, given: value.trim(), expected }
  return {
    correct: false, given: value.trim(), expected,
    errorType: cmp.nearMiss ? 'spelling' : 'other',
    feedback: cmp.nearMiss ? `¡Casi! Se escribe «${expected}».` : `Se escribe «${expected}».`,
  }
}

/** Digits: the number the child wrote must be the number of the exercise. */
function checkNumber(answer: Answer, expected: number): CheckResult {
  const value = answer.type === 'number' ? answer.value : null
  const label = String(expected)
  if (value === expected) return { correct: true, given: label, expected: label }
  return {
    correct: false, given: value === null ? '' : String(value), expected: label, errorType: 'other',
    feedback: `La respuesta es ${expected}.`,
  }
}

/** Pairs: marks[i] is the card the child put with word i. Every pair must be right. */
function checkMatch(ex: EngMatchExercise, answer: Answer): CheckResult {
  const marked = answer.type === 'marks' ? answer.marked : []
  const pairs = ex.words.map((w, i) => `${w} ${faceOf(ex.cards[ex.answer[i]])}`).join(', ')
  const ok = ex.answer.every((card, i) => marked[i] === card)
  if (ok) return { correct: true, given: pairs, expected: pairs }
  return { correct: false, given: marked.join(','), expected: pairs, errorType: 'other', feedback: `Las parejas son: ${pairs}.` }
}

/** The memory game is one attempt. A turn is two cards turned; right when every pair is found in at most 2 × pairs + 4 turns. */
function checkMemory(ex: EngMemoryExercise, answer: Answer): CheckResult {
  const pairs = ex.pairs.length
  const limit = 2 * pairs + 4
  const turns = answer.type === 'memory' ? answer.turns : 0
  const found = answer.type === 'memory' ? answer.found : 0
  const expected = `${pairs} parejas en ${limit} turnos o menos`
  if (found === pairs && turns <= limit) return { correct: true, given: `${turns} turnos`, expected }
  const feedback = found < pairs
    ? 'Aún quedan parejas por encontrar.'
    : `Has encontrado las ${pairs} parejas en ${turns} turnos. Para acertar hay que hacerlo en ${limit} o menos.`
  return { correct: false, given: `${turns} turnos`, expected, errorType: 'other', feedback }
}

export function checkEnglish(ex: EnglishExercise, answer: Answer): CheckResult {
  switch (ex.kind) {
    case 'eng-memory': return checkMemory(ex, answer)
    case 'eng-scramble': return checkText(answer, ex.answer, ex.alts)
    case 'eng-listen-pick':
      return checkChoice(answer, ex.answer, ex.word, `La palabra es «${ex.word}».`)
    case 'eng-complete': {
      const filled = ex.sentence.replace('___', ex.options[ex.answer])
      return checkChoice(answer, ex.answer, ex.options[ex.answer], `Va «${ex.options[ex.answer]}»: ${filled}`)
    }
    case 'eng-match': return checkMatch(ex, answer)
    case 'eng-write-word': return checkText(answer, ex.answer, ex.alts)
    case 'eng-num-write': return checkText(answer, ex.answer)
    case 'eng-num-listen':
    case 'eng-op-listen': return checkNumber(answer, ex.answer)
  }
}

// ---------------------------------------------------------------- hints (three levels, never the answer)

const hint = (level: Hint['level'], text: string): Hint => ({ level, text, visual: 'none' })

/** The hints of a word to spell (eng-write-word, eng-scramble). Short words: the hints never reveal all but one letter.
    Two letters or fewer: the count and a cue, no letter. Three: the count, then the first letter. Longer: the first
    letter, then the count and the last letter. */
function spellingHints(en: string, theme: string): Hint[] {
  const n = letters(en).length
  const themeHint = hint(1, `Es una palabra del tema «${THEME_NAME[theme]}».`)
  if (n <= 2) return [themeHint, hint(2, `Tiene ${letrasDe(n)}.`), hint(3, 'Es una palabra muy corta: escríbela como la dices.')]
  if (n === 3) return [themeHint, hint(2, `Tiene ${letrasDe(n)}.`), hint(3, `Empieza por «${letters(en)[0]}».`)]
  return [themeHint, hint(2, `Empieza por «${letters(en)[0]}».`), hint(3, `Tiene ${n} letras y acaba en «${letters(en).slice(-1)}».`)]
}

/** The idea of a number, in Spanish: the English ending that gives it away, never the word itself. */
function numberIdea(n: number): string {
  if (n === 100) return 'Es el número más grande de la lista, y se escribe con dos palabras.'
  if (n <= 12) return 'Es un número corto: hay que aprenderlo de memoria.'
  if (n >= 13 && n <= 19) return 'Los números del 13 al 19 acaban en «-teen».'
  if (n % 10 === 0) return 'Las decenas exactas acaban en «-ty».'
  return 'Las decenas acaban en «-ty» y la unidad va después, con un guion.'
}

export function hintsEnglish(ex: EnglishExercise): Hint[] {
  switch (ex.kind) {
    case 'eng-listen-pick': {
      const first = letters(ex.word)[0]
      return [
        hint(1, `Es una palabra del tema «${THEME_NAME[ex.theme]}».`),
        hint(2, `Empieza por «${first}».`),
        hint(3, `Empieza por «${first}» y tiene ${letrasDe(letters(ex.word).length)}.`),
      ]
    }
    case 'eng-match':
      return [
        hint(1, 'Empareja primero las palabras que ya conoces.'),
        hint(2, 'Mira cada dibujo y piensa cómo se dice en inglés; después busca su palabra.'),
        hint(3, 'Si te quedan dos sin pareja, prueba a cambiarlas entre ellas.'),
      ]
    case 'eng-write-word': return spellingHints(ex.answer, ex.card.theme)
    case 'eng-scramble': return spellingHints(ex.answer, ex.card.theme)
    case 'eng-memory':
      return [
        hint(1, 'Cada dibujo tiene su palabra en inglés: busca las parejas.'),
        hint(2, 'Mira el dibujo, piensa cómo se dice en inglés y busca esa palabra.'),
        hint(3, 'Si una carta no encaja, fíjate dónde estaba su pareja antes de girarla.'),
      ]
    case 'eng-complete': {
      const word = ex.options[ex.answer]
      return [
        hint(1, PHRASE_IDEAS[ex.skill] ?? 'Lee la frase entera.'),
        hint(2, 'Prueba cada opción en el hueco y di cuál suena natural en inglés.'),
        // A one- or two-letter answer («a», «an») is the first letter itself: the hint counts its letters instead.
        hint(3, letters(word).length > 2 ? `Empieza por «${letters(word)[0]}».` : `La palabra tiene ${letrasDe(letters(word).length)}.`),
      ]
    }
    case 'eng-num-write':
      return [
        hint(1, numberIdea(ex.value)),
        hint(2, 'Si hay decena y unidad, escribe primero la decena, luego un guion y la unidad.'),
        hint(3, `Empieza por «${letters(ex.answer)[0]}» y tiene ${letters(ex.answer).length} letras sin contar el guion.`),
      ]
    case 'eng-num-listen':
      return [
        hint(1, 'Escucha otra vez y fíjate en la primera palabra que oyes.'),
        hint(2, 'Si oyes «-teen», el número está entre trece y diecinueve; si oyes «-ty», es una decena exacta.'),
        hint(3, 'Escribe primero la cifra de las decenas y después la de las unidades.'),
      ]
    case 'eng-op-listen':
      return [
        hint(1, 'Plus es sumar, minus es restar y times es multiplicar.'),
        hint(2, 'Haz la cuenta con los dos números que oyes: ¿sumas, restas o multiplicas?'),
        hint(3, 'Si es times, usa la tabla del dos, del cinco o del diez; si no, cuenta hacia delante o hacia atrás.'),
      ]
  }
}

// ---------------------------------------------------------------- statement (the question, never the spoken text)

export function statementEnglish(ex: EnglishExercise): string {
  switch (ex.kind) {
    case 'eng-listen-pick': return 'Escucha la palabra y toca su dibujo.'
    case 'eng-match': return 'Une cada palabra en inglés con su dibujo.'
    case 'eng-write-word': return `Escribe en inglés: ${ex.card.es}`
    case 'eng-complete': return `Completa la frase: ${ex.sentence}${ex.es ? ` (${ex.es})` : ''}`
    case 'eng-num-write': return `Escribe en inglés el número ${ex.value}`
    case 'eng-num-listen': return 'Escucha el número y escríbelo con cifras.'
    case 'eng-op-listen': return 'Escucha la operación y escribe el resultado.'
    case 'eng-memory': return 'Gira las cartas y encuentra las parejas: cada dibujo con su palabra en inglés.'
    case 'eng-scramble': return 'Toca las letras en orden y escribe la palabra en inglés.'
  }
}
