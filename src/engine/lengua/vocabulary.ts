/* Vocabulario de Lengua de 3.º: ordenar palabras por el abecedario (voc:abecedario) y las preguntas de pares (voc:sinonimos,
   antonimos, familias, diminutivos, aumentativos, compuestas). Las opciones que no sirven son palabras que no cumplen la
   relación: ningún distractor es sinónimo, antónimo ni de la familia que se pregunta. Los diminutivos y aumentativos
   que se escriben tienen una sola forma corriente. Las pistas no dan la palabra. */
import type { Answer, CheckResult, Hint, LngAlphabetExercise, LngPairWordsExercise, Rng, SkillKey } from '@/types'
import { hashString, pick, shuffle } from '../rng'
import { parseSkill } from '../skills'
import { compareText, normalizeAnswer } from './text'

/** Sets of words for the alphabet exercise (3 to 4 words, initial letters or second letters that differ). */
export const ALPHABET_SETS: string[][] = [
  ['sol', 'luna', 'mar'], ['gato', 'perro', 'vaca', 'caballo'], ['árbol', 'casa', 'flor', 'sol'], ['ñandú', 'nube', 'oso'],
  ['tigre', 'elefante', 'jirafa'], ['libro', 'lápiz', 'regla'], ['pato', 'pan', 'pizza'], ['cuento', 'cabra', 'codo'],
  ['bola', 'barco', 'bufanda'], ['dedo', 'dado', 'dama'], ['fresa', 'falda', 'fuego'], ['hormiga', 'helado', 'hielo'],
  ['mesa', 'manzana', 'melón'], ['vela', 'vaca', 'viento'], ['zapato', 'zorro', 'zumo'], ['queso', 'pez', 'rana'],
  ['gallina', 'jamón', 'jugo'], ['uva', 'oso', 'elefante'], ['abeja', 'araña', 'ardilla'], ['nido', 'ñu', 'noche', 'oveja'],
]

/** A key that puts the words in the order of the alphabet: no accents, and ñ after n (as in the dictionary). */
export const alphabetKey = (w: string) => w.toLocaleLowerCase('es').replace(/ñ/g, 'n{').normalize('NFD').replace(/[̀-ͯ]/g, '')

/** The words of a set in alphabetical order. */
export const inAlphabetOrder = (words: string[]) => [...words].sort((a, b) => (alphabetKey(a) < alphabetKey(b) ? -1 : alphabetKey(a) > alphabetKey(b) ? 1 : 0))

export function buildAlphabet(skill: SkillKey, rng: Rng): LngAlphabetExercise {
  const set = pick(rng, ALPHABET_SETS)
  const sorted = inAlphabetOrder(set)
  const shown = shuffle(rng, set)
  return {
    id: `lng-alphabet:${set.join(',')}`, kind: 'lng-alphabet', skill, difficulty: 2,
    words: shown, targets: sorted.map((w) => shown.indexOf(w)),
  }
}

// ---------------------------------------------------------------- pairs

interface PairItem { word: string; answer: string; options?: string[] }

const SYNONYMS: PairItem[] = [
  { word: 'grande', answer: 'enorme', options: ['enorme', 'pequeño', 'feo'] },
  { word: 'feliz', answer: 'contento', options: ['contento', 'triste', 'cansado'] },
  { word: 'rápido', answer: 'veloz', options: ['veloz', 'lento', 'bonito'] },
  { word: 'bonito', answer: 'hermoso', options: ['hermoso', 'feo', 'sucio'] },
  { word: 'cansado', answer: 'agotado', options: ['agotado', 'alegre', 'fuerte'] },
  { word: 'comenzar', answer: 'empezar', options: ['empezar', 'acabar', 'mirar'] },
  { word: 'pequeño', answer: 'diminuto', options: ['diminuto', 'enorme', 'rico'] },
  { word: 'casa', answer: 'hogar', options: ['hogar', 'calle', 'coche'] },
  { word: 'miedo', answer: 'temor', options: ['temor', 'valor', 'alegría'] },
  { word: 'andar', answer: 'caminar', options: ['caminar', 'comer', 'dormir'] },
  { word: 'hablar', answer: 'charlar', options: ['charlar', 'callar', 'cantar'] },
  { word: 'enfadado', answer: 'enojado', options: ['enojado', 'contento', 'tranquilo'] },
]
const ANTONYMS: PairItem[] = [
  { word: 'alto', answer: 'bajo', options: ['bajo', 'ancho', 'grande'] },
  { word: 'día', answer: 'noche', options: ['noche', 'sol', 'luna'] },
  { word: 'frío', answer: 'caliente', options: ['caliente', 'lleno', 'sucio'] },
  { word: 'abierto', answer: 'cerrado', options: ['cerrado', 'claro', 'lleno'] },
  { word: 'subir', answer: 'bajar', options: ['bajar', 'correr', 'saltar'] },
  { word: 'entrar', answer: 'salir', options: ['salir', 'mirar', 'cantar'] },
  { word: 'limpio', answer: 'sucio', options: ['sucio', 'dulce', 'grande'] },
  { word: 'ganar', answer: 'perder', options: ['perder', 'llorar', 'comer'] },
  { word: 'joven', answer: 'viejo', options: ['viejo', 'pequeño', 'bonito'] },
  { word: 'dulce', answer: 'amargo', options: ['amargo', 'duro', 'lento'] },
  { word: 'lleno', answer: 'vacío', options: ['vacío', 'pesado', 'claro'] },
]
const FAMILIES: PairItem[] = [
  { word: 'pan', answer: 'panadería', options: ['panadería', 'pastel', 'paloma'] },
  { word: 'flor', answer: 'florero', options: ['florero', 'fresa', 'flecha'] },
  { word: 'zapato', answer: 'zapatero', options: ['zapatero', 'zanahoria', 'zumo'] },
  { word: 'mar', answer: 'marinero', options: ['marinero', 'martillo', 'mano'] },
  { word: 'libro', answer: 'librería', options: ['librería', 'lápiz', 'leche'] },
  { word: 'sol', answer: 'soleado', options: ['soleado', 'sopa', 'sombrero'] },
  { word: 'casa', answer: 'casero', options: ['casero', 'cesta', 'cama'] },
  { word: 'perro', answer: 'perrito', options: ['perrito', 'pelota', 'pez'] },
]
/** The diminutive has one usual form: it is written, not chosen. */
const DIMINUTIVES: PairItem[] = [
  { word: 'casa', answer: 'casita' }, { word: 'gato', answer: 'gatito' }, { word: 'libro', answer: 'librito' },
  { word: 'perro', answer: 'perrito' }, { word: 'pato', answer: 'patito' },
]
const AUGMENTATIVES: PairItem[] = [
  { word: 'casa', answer: 'casona', options: ['casona', 'casita', 'casilla'] },
  { word: 'libro', answer: 'librote', options: ['librote', 'librito', 'libreta'] },
  { word: 'mano', answer: 'manota', options: ['manota', 'manita', 'manito'] },
  { word: 'gato', answer: 'gatazo', options: ['gatazo', 'gatito', 'gatica'] },
]
const COMPOUNDS: PairItem[] = [
  { word: 'lava+platos', answer: 'lavaplatos', options: ['lavaplatos', 'platolava', 'lavadora'] },
  { word: 'abre+latas', answer: 'abrelatas', options: ['abrelatas', 'latasabre', 'pelota'] },
  { word: 'pasa+tiempo', answer: 'pasatiempo', options: ['pasatiempo', 'tiempopasa', 'pelota'] },
  { word: 'cumple+años', answer: 'cumpleaños', options: ['cumpleaños', 'añoscumple', 'sol'] },
  { word: 'rompe+cabezas', answer: 'rompecabezas', options: ['rompecabezas', 'cabezarompe', 'mapa'] },
  { word: 'saca+corchos', answer: 'sacacorchos', options: ['sacacorchos', 'corchosaca', 'tijera'] },
]

const BANK: Record<string, PairItem[]> = {
  sinonimos: SYNONYMS, antonimos: ANTONYMS, familias: FAMILIES, diminutivos: DIMINUTIVES, aumentativos: AUGMENTATIVES, compuestas: COMPOUNDS,
}

const QUESTION: Record<string, (w: string) => string> = {
  sinonimos: (w) => `¿Qué palabra significa lo mismo que «${w}»?`,
  antonimos: (w) => `¿Qué palabra significa lo contrario de «${w}»?`,
  familias: (w) => `¿Cuál de estas palabras es de la familia de «${w}»?`,
  diminutivos: (w) => `Escribe el diminutivo de «${w}»: la forma pequeña y cariñosa.`,
  aumentativos: (w) => `¿Cuál es el aumentativo de «${w}», la forma más grande?`,
  compuestas: (w) => {
    const [a, b] = w.split('+')
    return `¿Qué palabra nueva se forma uniendo «${a}» y «${b}»?`
  },
}

const pairArea = (skill: SkillKey): string => {
  const p = parseSkill(skill)
  if (!p || p.type !== 'lengua' || !(p.item in BANK)) throw new Error(`vocabulary: '${skill}' is not a pair skill`)
  return p.item
}

export function buildPair(skill: SkillKey, rng: Rng): LngPairWordsExercise {
  const area = pairArea(skill)
  const item = pick(rng, BANK[area])
  const text = item.options === undefined
  const options = item.options ? shuffle(rng, item.options) : []
  return {
    id: `lng-pair-words:${area}:${item.word}`, kind: 'lng-pair-words', skill, difficulty: 2,
    question: QUESTION[area](item.word), mode: text ? 'text' : 'choice', options, answer: item.answer,
  }
}

// ---------------------------------------------------------------- check

const CHILD = '¡Muy bien, {child}!'

export function checkAlphabet(ex: LngAlphabetExercise, answer: Answer): CheckResult {
  const expected = inAlphabetOrder(ex.words).join(', ')
  if (answer.type !== 'marks') return { correct: false, given: '', expected, errorType: 'other', feedback: 'Toca las palabras en orden.' }
  const given = answer.marked.map((i) => ex.words[i]).join(', ') || '—'
  if (answer.marked.length === ex.targets.length && answer.marked.every((v, i) => v === ex.targets[i])) return { correct: true, given, expected, feedback: CHILD }
  if (answer.marked.length < ex.targets.length) return { correct: false, given, expected, errorType: 'incomplete', feedback: 'Te faltan palabras: sigue con las que quedan.' }
  return { correct: false, given, expected, errorType: 'alphabet', feedback: 'Mira la primera letra de cada palabra. Si empiezan igual, mira la segunda.' }
}

export function checkPair(ex: LngPairWordsExercise, answer: Answer): CheckResult {
  if (ex.mode === 'choice') {
    if (answer.type !== 'choice' || answer.index === null) return { correct: false, given: '', expected: ex.answer, errorType: 'incomplete', feedback: 'Elige una palabra.' }
    const given = ex.options[answer.index] ?? ''
    if (given === ex.answer) return { correct: true, given, expected: ex.answer, feedback: CHILD }
    return { correct: false, given, expected: ex.answer, errorType: 'word-pair', feedback: 'Piensa en lo que quiere decir la palabra y vuelve a mirar las opciones.' }
  }
  if (answer.type !== 'text') return { correct: false, given: '', expected: ex.answer, errorType: 'other', feedback: 'Escribe la palabra.' }
  const value = normalizeAnswer(answer.value ?? '')
  if (!value) return { correct: false, given: '', expected: ex.answer, errorType: 'incomplete', feedback: 'Escribe la palabra.' }
  const r = compareText(value, ex.answer, 'ignore-case')
  if (r.correct) return { correct: true, given: value, expected: ex.answer, feedback: CHILD }
  if (r.accentOnly) return { correct: false, given: value, expected: ex.answer, errorType: 'word-pair', feedback: '¡Casi! Mira la tilde.' }
  return { correct: false, given: value, expected: ex.answer, errorType: 'word-pair', feedback: 'Piensa si la palabra se hace más pequeña o más grande, y cómo termina.' }
}

// ---------------------------------------------------------------- hints

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'] = 'none', params?: Hint['params']): Hint =>
  params ? { level, text, visual, params } : { level, text, visual }

const PAIR_TEXT: Record<string, [string, string]> = {
  sinonimos: ['Busca la palabra que quiere decir casi lo mismo.', 'Di cada opción en una frase en lugar de la palabra: ¿suena igual?'],
  antonimos: ['Busca la palabra que quiere decir lo contrario.', 'Piensa en lo que es lo opuesto a lo que dice la pregunta. ¿Cuál tiene el sentido contrario?'],
  familias: ['Las palabras de una familia vienen de la misma raíz: se parecen en el principio.', 'Mira qué palabra empieza igual y tiene la misma parte que la de la pregunta. ¿Cuál tiene la misma raíz?'],
  compuestas: ['Una palabra compuesta une dos palabras en una sola.', 'Di las dos palabras seguidas, sin pausa. ¿Cuál de ellas es una palabra de verdad?'],
  diminutivos: ['Piensa si la palabra se hace más pequeña y cariñosa.', 'Quita la última vocal de la palabra y prueba a ponerle la terminación de lo pequeño. ¿Cuál suena bien?'],
  aumentativos: ['Piensa si la palabra se hace más grande.', 'Quita la última vocal de la palabra y prueba a ponerle la terminación de lo grande. ¿Cuál suena bien?'],
}

export function hintsVocabulary(ex: LngAlphabetExercise | LngPairWordsExercise): Hint[] {
  if (ex.kind === 'lng-alphabet') {
    return [
      hint(1, 'Ordenar por el abecedario es mirar la primera letra de cada palabra. Si es la misma, se mira la segunda.'),
      hint(2, 'Este es el orden de las letras. Mira en él cuál va antes.', 'words', { words: ['a b c d e f g h i j k l m n ñ o p q r s t u v w x y z'] }),
      hint(3, 'Compara las palabras de dos en dos: ¿qué letra va antes en el abecedario?'),
    ]
  }
  const area = pairArea(ex.skill)
  const [a, c] = PAIR_TEXT[area]
  // The examples never use a word of the question (a compound's parts count as words of it).
  const others = BANK[area].filter((i) => !i.word.split('+').some((part) => ex.question.includes(`«${part}»`)))
  const off = hashString(ex.id) % others.length
  const examples = [0, 1, 2].map((i) => {
    const it = others[(off + i) % others.length]
    if (area === 'compuestas') return `${it.word.replace('+', ' + ')} → ${it.answer}`
    if (area === 'diminutivos' || area === 'aumentativos') return `${it.word} → ${it.answer}`
    return `${it.word} · ${it.answer}`
  })
  return [hint(1, a), hint(2, 'Mira otras palabras que siguen la misma idea:', 'words', { words: examples }), hint(3, c)]
}

export function statementVocabulary(ex: LngAlphabetExercise | LngPairWordsExercise): string {
  return ex.kind === 'lng-alphabet' ? `Ordena por el abecedario: ${ex.words.join(', ')}` : ex.question
}
