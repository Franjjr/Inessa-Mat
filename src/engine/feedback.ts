/* Child-facing feedback copy (Spanish, Spain). Warm, short, concrete; errors are clues and the text names the
   strategy. Strings are TemplateStrings: they may contain {child}/{pet} for content/renderTemplate, never other
   placeholders (numbers are already filled in). Choices are deterministic (hash of a seed string). */
import type { FactStrategy } from '@/types'
import { hashString } from './rng'

export const COLUMN_NAMES = ['unidades', 'decenas', 'centenas', 'millares', 'decenas de millar']
/** The same columns with their article: «millares» is masculine, so «los millares». */
const COLUMN_WITH_ARTICLE = ['las unidades', 'las decenas', 'las centenas', 'los millares', 'las decenas de millar']
/** One unit of each column: «1 centena», «1 millar». */
const COLUMN_SINGULAR = ['unidad', 'decena', 'centena', 'millar', 'decena de millar']

export function columnName(i: number): string {
  return COLUMN_NAMES[i] ?? 'cifras de la izquierda'
}

/** The column with its article, for sentences after a preposition: «a las decenas», «a los millares». */
export function columnWithArticle(i: number): string {
  return COLUMN_WITH_ARTICLE[i] ?? 'las cifras de la izquierda'
}

/** "las decenas", "las decenas y las centenas", "las unidades, las decenas y las centenas". */
export function columnList(cols: number[]): string {
  const names = [...new Set(cols)].sort((a, b) => a - b).map((c) => columnWithArticle(c))
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

function choose(seed: string, options: string[]): string {
  return options[hashString(seed) % options.length]
}

const PRAISE = [
  '¡Bien hecho, {child}!',
  '¡Toma ya!',
  '¡Lo has clavado!',
  '¡Genial, {child}!',
  '¡Eso es!',
  '¡Fenomenal!',
  '¡Perfecto!',
]

export function praise(seed: string): string {
  return choose(seed, PRAISE)
}

const STRATEGY_PRAISE: Partial<Record<FactStrategy['id'], string>> = {
  'double': '¡Qué bien has usado el truco del doble!',
  'five': '¡La del 5, chupada!',
  'ten': '¡Por 10, pon un 0! ¡Muy bien!',
  'double-double': '¡Doble y doble! ¡Qué bien lo has pensado!',
  'double-double-double': '¡Doble, doble y doble, como el pulpo Octavio!',
  'five-plus-one': '¡El 5 y uno más funciona de maravilla!',
  'even-six-rhyme': '¡La mitad delante y el número detrás! ¡Qué bien!',
  'nine-trick': '¡El truco del 9 es pura magia!',
  'square-rhyme': '¡Siete por cinco y siete por dos! ¡Muy bien!',
  'five-six-seven-eight': '¡5, 6, 7, 8! ¡Lo has clavado!',
  'weeks': '¡Tres semanas, veintiún días! ¡Genial!',
  'mirror': '¡El truco del espejo! ¡Muy bien pensado!',
  'double-and-one': '¡El doble y uno más! ¡Muy bien!',
  'ten-minus-two': '¡Diez veces el 8 menos dos veces el 8! ¡Qué buena idea!',
}

/** Praise for a right fact. A strategy is named only when the child asked for its trick (`usedTrick`): the praise must
    not name a trick the child has not used. */
export function praiseFact(seed: string, strategy: FactStrategy, usedTrick = false): string {
  const s = usedTrick ? STRATEGY_PRAISE[strategy.id] : undefined
  if (s && hashString(`${seed}:s`) % 2 === 0) return s
  return praise(seed)
}

export const FEEDBACK = {
  incomplete: '¡Te falta alguna casilla por rellenar! Complétalas todas y vuelve a probar.',
  empty: '¡Escribe tu respuesta! Tómate tu tiempo.',
  factWrong: (strategy: FactStrategy) => `¡Casi! Prueba el truco. ${strategy.text}`,
  /** The child wrote the product of a neighbouring fact: it names that fact's table, then the trick of the asked fact
      (which never gives its result). */
  factNeighbour: (given: number, a: number, b: number, strategy: FactStrategy) => {
    const tables = a === b ? `la tabla del ${a}` : `la tabla del ${a} y del ${b}`
    return `¡Casi! ${given} es ${a} × ${b}: ese resultado es de ${tables}. Prueba el truco. ${strategy.text}`
  },
  factAdded: (a: number, b: number) => `¡Ojo! Has sumado ${a} + ${b}. Multiplicar es hacer ${a} grupos de ${b}.`,
  divWrong: (dividend: number, divisor: number) =>
    `¡Casi! Piensa en la tabla del ${divisor}: ¿${divisor} por cuánto da ${dividend}?`,
  divOperation: (dividend: number, divisor: number) =>
    `¡Ojo! Aquí hay que dividir: ¿cuántas veces cabe el ${divisor} en el ${dividend}?`,
  missingWrong: (known: number, product: number) =>
    `¡Casi! ¿${known} por cuánto da ${product}? Cuenta de ${known} en ${known} hasta llegar.`,
  missingProduct: (product: number) => `¡Ojo! El ${product} ya está escrito: busca el número que falta en la multiplicación.`,
  skipWrong: (step: number) => `¡Casi! Cuenta de ${step} en ${step}: cada número es ${step} más que el anterior.`,
  chainWrong: 'Cada número es el doble del anterior: súmalo consigo mismo. ¡Tú puedes!',
  groupsWrong: (groups: number, per: number) => `¡Casi! Hay ${groups} grupos de ${per}. Cuenta de ${per} en ${per}.`,
  arrayWrong: (rows: number, cols: number) => `¡Casi! Hay ${rows} filas de ${cols}. Cuenta fila a fila.`,
  groupsAdded: 'Has sumado los dos números. ¡Mira bien: hay que contar todos los objetos!',
  familyFact: 'Revisa las cuentas: alguna no da el resultado correcto.',
  familyIncomplete: (a: number, b: number, p: number) =>
    `Con ${a}, ${b} y ${p} salen 4 operaciones: dos multiplicaciones y dos divisiones. ¡Te falta alguna!`,
  familyRepeated: 'Has escrito dos veces la misma. Usa el espejo: escribe la cuenta con los números al revés. El resultado es el mismo.',
  familyOther: (a: number, b: number, p: number) =>
    `Usa solo los números ${a}, ${b} y ${p}. En la división, el número grande va primero.`,
  carryForgot: (cols: number[]) =>
    cols.length ? `¡Ojo con la mochila! Te has dejado la llevada en ${columnList(cols)}.` : '¡Ojo con la mochila! No te olvides de sumar la llevada.',
  carryWrong: 'En cada casa solo cabe una cifra: escribe las unidades y la decena salta a la casa de al lado.',
  carryWrongMul: 'Primero multiplica y después suma la llevada. ¡La llevada no se multiplica!',
  /** Multiplication: a result cell holding a whole number (10 written in one box): its units stay, the rest is carried. */
  oneDigitMul: (value: number) =>
    Number.isInteger(value) && value > 9
      ? `En cada casa solo cabe una cifra: escribe el ${value % 10} y llévate el ${Math.floor(value / 10)} a la casa de al lado.`
      : 'En cada casa solo cabe una cifra. ¡Revisa la multiplicación casa por casa!',
  /** Subtraction: a result cell holding two digits (e.g. "15"). */
  oneDigitPerCell: 'En cada casa del resultado solo cabe una cifra. ¡Revisa la resta casa por casa!',
  mulAdded: (bottom: number) => `¡Ojo! Has sumado los números. Aquí hay que multiplicar cada cifra por ${bottom}.`,
  addFact: (cols: number[]) => `¡Casi! Revisa la suma de ${columnList(cols)}.`,
  misaligned: 'Coloca las cifras empezando por la derecha: unidades debajo de unidades, decenas debajo de decenas.',
  smallerFromLarger: 'Arriba hay un número más pequeño: ¡pide ayuda a la vecina!',
  borrowForgot: 'Si la vecina te presta, ella se queda con 1 menos. ¡Táchala y réstale 1!',
  /** The lender column is known (1 = decenas…): it lends one of its own units, worth 10 of the column on its right. */
  borrowForgotAt: (lender: number) =>
    lender >= 1 && lender < COLUMN_SINGULAR.length
      ? `La vecina de ${columnWithArticle(lender)} te presta 1 ${COLUMN_SINGULAR[lender]}, que son 10 ${columnName(lender - 1)}: tú ganas 10 y ella se queda con una menos. ¡Táchala y réstale 1!`
      : 'Si la vecina te presta, ella se queda con 1 menos. ¡Táchala y réstale 1!',
  /** A column that had to borrow and was not done (the neighbour is right): the column and its own subtraction. */
  borrowColumn: (col: number, top: number, bottom: number) =>
    `En ${columnWithArticle(col)}, ${top} es menos que ${bottom}: pide prestado a la vecina. ${top + 10} − ${bottom} = ?`,
  /** The same with «me llevo una»: the ten goes on top and the 1 to the bottom of the next column. */
  borrowColumnCarry: (col: number, top: number, bottom: number) =>
    `En ${columnWithArticle(col)}, ${top} es menos que ${bottom}: pon un 1 delante (${top + 10}) y me llevo una abajo.`,
  /** «Me llevo una» (the carry method): the ten goes to the top number and the 1 to the bottom of the next column. */
  carryForgotSub: 'Te has olvidado de sumar 1 a la cifra de abajo de la casa de al lado. ¡Me llevo una!',
  zeroBorrow: '¡Cuidado con el cero! No tiene nada que prestar: pide a la primera casa que no sea 0. Cada 0 que pases se convierte en 9.',
  subFact: (cols: number[]) => `¡Casi! Revisa la resta de ${columnList(cols)}. Puedes comprobarla sumando.`,
  subAdded: '¡Ojo! Es una resta: hay que quitar, no sumar.',
  mulFact: (cols: number[]) => `¡Casi! Revisa ${columnList(cols)}: multiplica cifra a cifra con calma.`,
  remainderTooBig: (divisor: number) => `Lo que sobra (el resto) tiene que ser más pequeño que ${divisor}. ¡Cabe una vez más!`,
  /** The leftover written is as big as the divisor or bigger: there is enough for one more in each group. */
  remainderTooBigBy: (rest: number, divisor: number) =>
    rest > divisor
      ? `Lo que sobra (${rest}) es más que ${divisor}: todavía puedes dar más a cada grupo.`
      : `Lo que sobra (${rest}) es igual que ${divisor}: todavía puedes dar uno más a cada grupo.`,
  /** An exact division with a leftover written. */
  remainderZero: 'Aquí no sobra nada: el resto es 0.',
  quotientTooBig: (q: number, divisor: number, dividend: number) =>
    `¡Te has pasado! ${q} × ${divisor} = ${q * divisor}, y solo hay ${dividend}. Prueba con uno menos.`,
  quotientTooSmall: '¡Todavía cabe una vez más! Prueba con uno más en lo que sale en cada grupo.',
  remainderWrong: (dividend: number, used: number) => `¡Lo que sale en cada grupo está bien! Ahora revisa lo que sobra: ${dividend} − ${used}.`,
  bringDown: 'Lo que sobra en las decenas se junta con las unidades: ¡bájalo y sigue repartiendo!',
  divisionStopped: '¡No te pares! Después de las decenas, baja las unidades y sigue repartiendo. Si no cabe ninguna vez, escribe un 0.',
  /** Stopped after the column `place` of the dividend (2 = centenas): the next one is brought down. */
  divisionStoppedAt: (place: number) =>
    `¡No te pares! Después de ${columnWithArticle(place)}, baja ${columnWithArticle(place - 1)} y sigue repartiendo. Si no cabe ninguna vez, escribe un 0.`,
  divisionReversed: '¡Casi! Las cifras del resultado van en orden: primero la de las decenas y, a su derecha, la de las unidades.',
  divisionOperation: (dividend: number, divisor: number) => `¡Ojo! Aquí hay que dividir: repartir ${dividend} entre ${divisor}.`,
  /** A divisor of two digits has no table to look in: the child tries a number and multiplies. */
  divisionNear: (divisor: number, dividend: number) =>
    divisor >= 10
      ? `¡Casi! Prueba un número: multiplícalo por ${divisor}. ¿Te pasas de ${dividend}? Prueba uno menos.`
      : `¡Casi! Busca en la tabla del ${divisor} el número que más se acerca a ${dividend} sin pasarse.`,
  divisionFact: (divisor: number) =>
    divisor >= 10
      ? `¡Casi! Reparte cifra a cifra. En cada paso, prueba un número y multiplícalo por ${divisor}: si te pasas, prueba uno menos.`
      : `¡Casi! Reparte cifra a cifra con la tabla del ${divisor}.`,
  divisionOther: 'Comprueba: multiplica lo que sale por el número por el que divides, y suma lo que sobra. Tiene que dar el número que has repartido.',
  wordOperation: {
    add: '¡Casi! Lee otra vez: aquí se juntan cosas. ¿Qué operación junta?',
    sub: '¡Casi! Lee otra vez: aquí se quitan o se comparan cosas. ¿Qué operación quita?',
    mul: '¡Casi! Lee otra vez: hay grupos iguales que se repiten. ¿Qué operación es?',
    div: '¡Casi! Lee otra vez: hay que repartir en partes iguales. ¿Qué operación reparte?',
  },
  wordFact: '¡Casi! La idea es buena: escribe la operación y revísala con calma.',
  wrongShape: 'Mmm, no he entendido tu respuesta. ¿La escribes otra vez?',
  /** Word problem with a leftover: the quotient is right and the «sobra» box is still empty. */
  wordRemainderMissing: 'Te falta escribir lo que sobra.',
  /** Tap games (bubbles…): a neutral message that does not guess what the child did. */
  tapWrong: (a: number, b: number) => `Ese no es. Piensa en ${a} grupos de ${b}.`,
  addCorrect: (carries: number, seed: string) =>
    carries > 0 ? choose(seed, ['¡Perfecto! Ninguna llevada se ha escapado de la mochila.', '¡Muy bien! Cada llevada en su casa.'])
      : choose(seed, ['¡Perfecto, {child}! Cada cifra en su casa.', '¡Suma perfecta!']),
  subCorrect: (borrows: number, seed: string) =>
    borrows > 0 ? choose(seed, ['¡Muy bien! La vecina te ha prestado justo lo que necesitabas.', '¡Resta perfecta, {child}!'])
      : choose(seed, ['¡Genial! Resta perfecta.', '¡Muy bien, {child}!']),
  mulCorrect: (seed: string) => choose(seed, ['¡Multiplicación perfecta! La forja de Chispa brilla.', '¡Toma ya! Cifra a cifra, sin fallos.']),
  divCorrect: (seed: string) => choose(seed, ['¡Reparto perfecto! Nadie se queda sin su parte.', '¡Muy bien! Un reparto justo, como el de la Reina Aurora.']),
  wordCorrect: (answer: number, unit: string) => `¡Muy bien! Son ${answer} ${unit}.`,
}
