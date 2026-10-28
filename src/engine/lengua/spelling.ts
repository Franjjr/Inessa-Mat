/* Ortografía de Lengua de 3.º: la letra que falta (c/qu, g/gu/gü, r/rr, mp/mb y la mayúscula inicial), los signos de una
   frase (. , ¿? ¡!) y el dictado (una palabra o una frase que dice la voz de la app). Los bancos son propios y están
   elegidos para que, cambiando el hueco por otra opción, no salga otra palabra real («pe_o» con pero o perro no sirve).
   Las pistas nunca dan la letra ni la palabra: el nivel 1 recuerda cómo escuchar, el 2 enseña otras palabras, el 3 manda
   probar. Nunca escriben una letra suelta («la c»): se dice «la ce». */
import type {
  Answer, CheckResult, Hint, LngDictationExercise, LngMissingLetterExercise, LngPunctuationExercise, Rng, SkillKey,
} from '@/types'
import { hashString, pick, shuffle } from '../rng'
import { parseSkill } from '../skills'
import { compareText, missingMark, normalizeAnswer } from './text'

type Group = 'c-qu' | 'g-gu' | 'r-rr' | 'mp-mb' | 'mayusculas'

/** A word and the letters of its gap: word.slice(from, to) is the right group, options[0] is that group. */
interface GapItem { word: string; from: number; to: number; options: string[] }

const GAPS: Record<Group, GapItem[]> = {
  'c-qu': [
    { word: 'casa', from: 0, to: 1, options: ['c', 'qu'] },
    { word: 'queso', from: 0, to: 2, options: ['qu', 'c'] },
    { word: 'cosa', from: 0, to: 1, options: ['c', 'qu'] },
    { word: 'pequeño', from: 2, to: 4, options: ['qu', 'c'] },
    { word: 'barco', from: 3, to: 4, options: ['c', 'qu'] },
    { word: 'cabeza', from: 0, to: 1, options: ['c', 'qu'] },
    { word: 'máquina', from: 2, to: 4, options: ['qu', 'c'] },
    { word: 'cuchara', from: 0, to: 1, options: ['c', 'qu'] },
    { word: 'química', from: 0, to: 2, options: ['qu', 'c'] },
  ],
  'g-gu': [
    { word: 'guitarra', from: 0, to: 2, options: ['gu', 'g'] },
    { word: 'gato', from: 0, to: 1, options: ['g', 'gu'] },
    { word: 'gorro', from: 0, to: 1, options: ['g', 'gu'] },
    { word: 'guerra', from: 0, to: 2, options: ['gu', 'g'] },
    { word: 'águila', from: 1, to: 3, options: ['gu', 'g'] },
    { word: 'hoguera', from: 2, to: 4, options: ['gu', 'g'] },
    { word: 'pingüino', from: 3, to: 5, options: ['gü', 'gu'] },
    { word: 'vergüenza', from: 3, to: 5, options: ['gü', 'gu'] },
    { word: 'gente', from: 0, to: 1, options: ['g', 'gu'] },
    { word: 'guisante', from: 0, to: 2, options: ['gu', 'g'] },
  ],
  'r-rr': [
    { word: 'carretera', from: 2, to: 4, options: ['rr', 'r'] },
    { word: 'rama', from: 0, to: 1, options: ['r', 'rr'] },
    { word: 'rosa', from: 0, to: 1, options: ['r', 'rr'] },
    { word: 'correr', from: 2, to: 4, options: ['rr', 'r'] },
    { word: 'tierra', from: 3, to: 5, options: ['rr', 'r'] },
    { word: 'ahorro', from: 3, to: 5, options: ['rr', 'r'] },
    { word: 'ratón', from: 0, to: 1, options: ['r', 'rr'] },
    { word: 'carretilla', from: 2, to: 4, options: ['rr', 'r'] },
  ],
  'mp-mb': [
    { word: 'lámpara', from: 2, to: 4, options: ['mp', 'mb'] },
    { word: 'tambor', from: 2, to: 4, options: ['mb', 'mp'] },
    { word: 'campana', from: 2, to: 4, options: ['mp', 'mb'] },
    { word: 'sombrero', from: 2, to: 4, options: ['mb', 'mp'] },
    { word: 'bombilla', from: 2, to: 4, options: ['mb', 'mp'] },
    { word: 'empanada', from: 1, to: 3, options: ['mp', 'mb'] },
    { word: 'hombro', from: 2, to: 4, options: ['mb', 'mp'] },
    { word: 'imprenta', from: 1, to: 3, options: ['mp', 'mb'] },
  ],
  // The capital of a name or a place: the lowercase form is not a word.
  mayusculas: [
    { word: 'Pablo', from: 0, to: 1, options: ['P', 'p'] },
    { word: 'Mario', from: 0, to: 1, options: ['M', 'm'] },
    { word: 'Elena', from: 0, to: 1, options: ['E', 'e'] },
    { word: 'Hugo', from: 0, to: 1, options: ['H', 'h'] },
    { word: 'Daniel', from: 0, to: 1, options: ['D', 'd'] },
    { word: 'Julia', from: 0, to: 1, options: ['J', 'j'] },
    { word: 'Sara', from: 0, to: 1, options: ['S', 's'] },
    { word: 'Madrid', from: 0, to: 1, options: ['M', 'm'] },
  ],
}

const groupOf = (skill: SkillKey): Group => {
  const p = parseSkill(skill)
  if (!p || p.type !== 'lengua') throw new Error(`spelling: '${skill}' is not a Lengua skill`)
  const item = p.item === 'mayusculas' ? 'mayusculas' : p.item
  if (item in GAPS) return item as Group
  throw new Error(`spelling: '${skill}' has no letter gap`)
}

/** The word with each gap shown as «_» (one per missing letter). */
const shownOf = (word: string, from: number, to: number) => `${word.slice(0, from)}${'_'.repeat(to - from)}${word.slice(to)}`

export function buildMissingLetter(skill: SkillKey, rng: Rng, box: number): LngMissingLetterExercise {
  const group = groupOf(skill)
  const item = pick(rng, GAPS[group])
  const answer = item.word.slice(item.from, item.to)
  const mode = box >= 2 ? 'type' : 'choose'
  return {
    id: `lng-missing-letter:${mode}:${item.word}`, kind: 'lng-missing-letter', skill, difficulty: mode === 'type' ? 3 : 2,
    word: item.word, shown: shownOf(item.word, item.from, item.to), mode,
    options: mode === 'choose' ? shuffle(rng, item.options) : [],
    answer: mode === 'choose' ? answer : item.word,
  }
}

// ---------------------------------------------------------------- punctuation

/** Sentences of the class, capitals kept. Each one has the marks it needs; the skill picks the sentences with its mark. */
export const PUNCTUATION_SENTENCES: string[] = [
  'Ana come una manzana roja.', 'Hola, ¿cómo estás?', '¡Qué bonito día hace!', 'Lucía tiene un gato, un perro y un pez.',
  '¿Dónde está mi libro?', '¡Vaya susto me has dado!', 'Mario compra pan, leche y huevos.', '¿Quieres venir al parque?',
  '¡Cuidado con el perro!', 'En el bosque, los animales duermen.', 'Hoy hace frío, así que me pongo el abrigo.',
  '¿Cuántos años tienes?', '¡Qué alegría verte!', 'El sol brilla en el cielo azul.', 'Pablo, ven aquí.',
  '¿Te gusta la sopa?', '¡Ya llegó el tren!', 'Los niños juegan en el patio.', 'Elena, ¿dónde vives?',
  'Mi perro se llama Canela.', '¡Muy bien, lo has conseguido!', 'Compramos naranjas, peras y uvas.',
  '¿Vienes conmigo al mercado?', 'La luna brilla por la noche.',
]

const MARK_OF_SKILL: Record<string, RegExp> = {
  punto: /\./, coma: /,/, pregunta: /¿/, exclamacion: /¡/,
}

const bareOf = (s: string) => s.replace(/[.,¿?¡!]/g, '').replace(/\s+/g, ' ').trim()

export function buildPunctuation(skill: SkillKey, rng: Rng): LngPunctuationExercise {
  const p = parseSkill(skill)
  const focus = p && p.type === 'lengua' && p.level ? MARK_OF_SKILL[p.level] : undefined
  const pool = focus ? PUNCTUATION_SENTENCES.filter((s) => focus.test(s)) : PUNCTUATION_SENTENCES
  const answer = pick(rng, pool)
  return {
    id: `lng-punctuation:${answer}`, kind: 'lng-punctuation', skill, difficulty: 3, bare: bareOf(answer), answer,
  }
}

// ---------------------------------------------------------------- dictation

/** Words a child hears in 3.º, with the spellings that are doubtful (b/v, h, g/j, c/z, y/ll, r/rr, x). Checked by hand: no
    word of the list sounds the same as another common word (vaca/baca is why vaca is not here). */
export const DICTATION_WORDS: string[] = [
  'lobo', 'burro', 'bonito', 'vestido', 'hielo', 'hormiga', 'gigante', 'jirafa', 'cocina', 'zapato', 'cereza', 'caballo',
  'escoba', 'lluvia', 'árbol', 'lápiz', 'ventana', 'camión', 'abeja', 'murciélago', 'pingüino', 'guitarra', 'cigarra',
  'carretera', 'lámpara', 'sombrero', 'corazón', 'cebolla', 'gallina', 'elefante', 'jabón', 'mariposa', 'ratón',
]

/** Sentences for dictation: capitals and the final mark are part of what is written. */
export const DICTATION_SENTENCES: string[] = [
  'El perro come pan.', 'Mi abuela hace una tarta de manzana.', 'Hoy llueve mucho en el campo.',
  'La jirafa come hojas de los árboles.', '¿Dónde está mi gorro azul?', '¡Qué día tan bonito hace hoy!',
  'Mario tiene una bicicleta roja.', 'Los niños juegan en el parque.', 'El gato duerme en el sofá.',
  'Mañana vamos al zoo con la clase.', '¿Quieres jugar conmigo?', '¡Cuidado con el perro!',
  'Lucía lee un libro de aventuras.', 'La abeja vuela entre las flores.',
]

export function buildDictation(skill: SkillKey, rng: Rng, box: number): LngDictationExercise {
  const sentence = box >= 2
  const answer = sentence ? pick(rng, DICTATION_SENTENCES) : pick(rng, DICTATION_WORDS)
  return {
    id: `lng-dictation:${answer}`, kind: 'lng-dictation', skill, difficulty: sentence ? 3 : 2, answer,
  }
}

/** The rule of a dictation: a sentence is written exactly (capitals and marks); one word ignores its capital. */
export const dictationRule = (answer: string): 'exact' | 'ignore-case' => (/\s/.test(answer) ? 'exact' : 'ignore-case')

// ---------------------------------------------------------------- check

const CHILD = '¡Muy bien, {child}!'

/** «¡Casi! Mira la tilde.» or, for the ü of güe/güi, «¡Casi! Mira la diéresis: las dos puntos de la ü.» */
const accentFeedback = (given: string, expected: string) =>
  missingMark(given, expected) === 'diéresis' ? '¡Casi! Mira la diéresis: las dos puntos de la ü.' : '¡Casi! Mira la tilde.'
const isCapital = (ex: LngMissingLetterExercise) => ex.skill.endsWith(':mayusculas')

function checkMissing(ex: LngMissingLetterExercise, answer: Answer): CheckResult {
  const capital = isCapital(ex)
  if (ex.mode === 'choose') {
    if (answer.type !== 'choice' || answer.index === null) return { correct: false, given: '', expected: ex.answer, errorType: 'incomplete', feedback: 'Elige una letra.' }
    const given = ex.options[answer.index] ?? ''
    if (given === ex.answer) return { correct: true, given, expected: ex.answer, feedback: CHILD }
    return capital
      ? { correct: false, given, expected: ex.answer, errorType: 'capital', feedback: 'Mira la primera letra: ¿es el nombre de una persona o de un lugar?' }
      : { correct: false, given, expected: ex.answer, errorType: 'spelling', feedback: 'Di la palabra despacio y mira otra vez la letra que falta.' }
  }
  if (answer.type !== 'text') return { correct: false, given: '', expected: ex.answer, errorType: 'other', feedback: 'Escribe la palabra completa.' }
  const value = normalizeAnswer(answer.value ?? '')
  if (!value) return { correct: false, given: '', expected: ex.answer, errorType: 'incomplete', feedback: 'Escribe la palabra completa.' }
  // R12: the capital is graded only in the mayúscula item; the letters of c/qu, g/gu/gü, r/rr, mp/mb ignore case, keep accents.
  const r = compareText(value, ex.answer, capital ? 'exact' : 'ignore-case')
  if (r.correct) return { correct: true, given: value, expected: ex.answer, feedback: CHILD }
  if (r.caseOnly) return { correct: false, given: value, expected: ex.answer, errorType: 'capital', feedback: 'Revisa la mayúscula.' }
  if (r.accentOnly) return { correct: false, given: value, expected: ex.answer, errorType: 'spelling', feedback: accentFeedback(value, ex.answer) }
  return { correct: false, given: value, expected: ex.answer, errorType: capital ? 'capital' : 'spelling', feedback: 'Revisa las letras que faltan.' }
}

const stripMarks = (s: string) => s.replace(/[.,¿?¡!]/g, '')

function checkPunctuation(ex: LngPunctuationExercise, answer: Answer): CheckResult {
  if (answer.type !== 'text') return { correct: false, given: '', expected: ex.answer, errorType: 'other', feedback: 'Escribe la frase.' }
  const value = normalizeAnswer(answer.value ?? '')
  if (!value) return { correct: false, given: '', expected: ex.answer, errorType: 'incomplete', feedback: 'Escribe la frase con sus signos.' }
  const r = compareText(value, ex.answer, 'exact')
  if (r.correct) return { correct: true, given: value, expected: ex.answer, feedback: CHILD }
  if (stripMarks(value) === stripMarks(ex.answer)) {
    return { correct: false, given: value, expected: ex.answer, errorType: 'punctuation', feedback: 'Las letras están bien. Revisa los signos: ¿falta alguno o sobra?' }
  }
  if (r.caseOnly) return { correct: false, given: value, expected: ex.answer, errorType: 'capital', feedback: 'Revisa las mayúsculas: al empezar y en los nombres.' }
  return { correct: false, given: value, expected: ex.answer, errorType: 'spelling', feedback: 'Revisa las letras de la frase.' }
}

function checkDictation(ex: LngDictationExercise, answer: Answer): CheckResult {
  if (answer.type !== 'text') return { correct: false, given: '', expected: ex.answer, errorType: 'other', feedback: 'Escribe lo que oyes.' }
  const value = normalizeAnswer(answer.value ?? '')
  if (!value) return { correct: false, given: '', expected: ex.answer, errorType: 'incomplete', feedback: 'Escribe lo que oyes.' }
  const r = compareText(value, ex.answer, dictationRule(ex.answer))
  if (r.correct) return { correct: true, given: value, expected: ex.answer, feedback: CHILD }
  if (r.caseOnly) return { correct: false, given: value, expected: ex.answer, errorType: 'capital', feedback: 'Revisa la mayúscula.' }
  if (r.accentOnly) return { correct: false, given: value, expected: ex.answer, errorType: 'dictation', feedback: accentFeedback(value, ex.answer) }
  return { correct: false, given: value, expected: ex.answer, errorType: 'dictation', feedback: 'Escucha otra vez y piensa en cómo se escribe cada sonido.' }
}

/** Checks a letter, a sentence with its marks, or a dictation. */
export function checkSpelling(ex: LngMissingLetterExercise | LngPunctuationExercise | LngDictationExercise, answer: Answer): CheckResult {
  switch (ex.kind) {
    case 'lng-missing-letter': return checkMissing(ex, answer)
    case 'lng-punctuation': return checkPunctuation(ex, answer)
    case 'lng-dictation': return checkDictation(ex, answer)
  }
}

// ---------------------------------------------------------------- hints

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'] = 'none', params?: Hint['params']): Hint =>
  params ? { level, text, visual, params } : { level, text, visual }

const GAP_TEXT: Record<Group, [string, string]> = {
  'c-qu': [
    'Este sonido «k» se puede escribir de dos formas. Di la palabra despacio y mira la vocal que viene justo después del hueco.',
    'Escribe la palabra con cada una de las formas y di en voz alta. ¿Cuál suena como la que conoces?',
  ],
  'g-gu': [
    'Esta letra puede sonar fuerte o suave según la vocal que venga después. Fíjate si la u se oye o no se oye.',
    'Una u que se oye con la e o con la i lleva dos puntos encima. Prueba las dos formas. ¿Cuál es la correcta?',
  ],
  'r-rr': [
    'Di la palabra en voz alta: ¿la erre suena fuerte, como un motor, o suave, como en pera? Mira dónde está el hueco.',
    'Piensa dónde está el hueco: ¿entre dos vocales, o al principio de la palabra? ¿Qué suena allí, fuerte o suave?',
  ],
  'mp-mb': [
    'Di la palabra despacio y escucha la letra que va justo antes de la p o de la b.',
    'Antes de la p o de la b, ¿qué letra de la nasal suena? ¿Cuál de las dos opciones escribirías?',
  ],
  mayusculas: [
    'Las palabras que nombran a una persona o a un lugar empiezan con mayúscula. ¿La que falta es una de ellas?',
    'Los nombres de personas y de lugares se escriben con mayúscula. ¿Es el nombre de una persona o de un lugar?',
  ],
}

export function hintsSpelling(ex: LngMissingLetterExercise | LngPunctuationExercise | LngDictationExercise): Hint[] {
  switch (ex.kind) {
    case 'lng-missing-letter': {
      const group = groupOf(ex.skill)
      const [a, c] = GAP_TEXT[group]
      // Other words of the same group, as examples: never the one asked, and never one that starts with the answer's
      // letters (a capital item would otherwise show its letter on the card).
      const lead = ex.answer.toLocaleLowerCase('es')
      const others = GAPS[group].filter((g) => g.word !== ex.word && !g.word.toLocaleLowerCase('es').startsWith(lead)).map((g) => g.word)
      const off = hashString(ex.id) % others.length
      const examples = [0, 1, 2].map((i) => others[(off + i) % others.length])
      return [hint(1, a), hint(2, 'Estas palabras tienen el mismo sonido o la misma duda:', 'words', { words: examples }), hint(3, c)]
    }
    case 'lng-punctuation':
      return [
        hint(1, 'Lee la frase en voz alta y fíjate en cómo baja la voz al final, o en cómo sube al preguntar o al sentir algo.'),
        hint(2, 'Cada signo tiene su trabajo en la frase.', 'words', { words: ['¿ ? para preguntar', '¡ ! para sentir algo', ', para una pausa o una lista', '. para terminar una idea'] }),
        hint(3, '¿Quién habla? ¿Pregunta algo? ¿Siente algo muy fuerte? ¿Hay una lista de cosas? Así sabrás qué signos usar.'),
      ]
    case 'lng-dictation': {
      const sentence = /\s/.test(ex.answer)
      return sentence
        ? [
          hint(1, 'Escucha la frase entera y repite cada palabra en voz baja antes de escribirla.'),
          hint(2, 'Piensa en las letras que dudan y en los signos del principio y del final.', 'words', { words: ['b o v', 'h', 'g o j', 'c o z', '¿ ?', '¡ !'] }),
          hint(3, 'Escribe despacio y revisa cada palabra. ¿Has puesto la mayúscula al empezar y el signo al final?'),
        ]
        : [
          hint(1, 'Escucha la palabra y di en voz baja sus sílabas, una por una.'),
          hint(2, 'Estas letras son las que más dudas dan. Piensa en la palabra que ya sabes escribir con cada una.', 'words', { words: ['b o v', 'h', 'g o j', 'c o z'] }),
          hint(3, 'Escribe la palabra despacio y mira cada letra. ¿Es la que suena?'),
        ]
    }
  }
}

/** One line for the daily plan and for the adults. */
export function statementSpelling(ex: LngMissingLetterExercise | LngPunctuationExercise | LngDictationExercise): string {
  switch (ex.kind) {
    case 'lng-missing-letter': return `Escribe la letra que falta: ${ex.shown}`
    case 'lng-punctuation': return `Pon los signos a la frase: ${ex.bare}`
    case 'lng-dictation': return 'Dictado: escribe lo que oyes'
  }
}

