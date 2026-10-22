/* Child-facing feedback copy (Spanish, Spain). Warm, short, concrete; errors are clues and the text names the
   strategy. Strings are TemplateStrings: they may contain {child}/{pet} for content/renderTemplate, never other
   placeholders (numbers are already filled in). Choices are deterministic (hash of a seed string). */
import type { FactStrategy } from '@/types'
import { hashString } from './rng'

export const COLUMN_NAMES = ['unidades', 'decenas', 'centenas', 'unidades de mil', 'decenas de mil']

export function columnName(i: number): string {
  return COLUMN_NAMES[i] ?? 'cifras de la izquierda'
}

/** "las decenas", "las decenas y las centenas", "las unidades, las decenas y las centenas". */
export function columnList(cols: number[]): string {
  const names = [...new Set(cols)].sort((a, b) => a - b).map((c) => `las ${columnName(c)}`)
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
  'even-six-rhyme': '¡Los pares que riman! ¡Qué oído tienes!',
  'nine-trick': '¡El truco del 9 es pura magia!',
  'square-rhyme': '¡Y el arcoíris llueve! ¡Muy bien!',
  'five-six-seven-eight': '¡5, 6, 7, 8! ¡Lo has clavado!',
  'weeks': '¡Tres semanas, veintiún días! ¡Genial!',
  'mirror': '¡El truco del espejo! ¡Muy bien pensado!',
}

export function praiseFact(seed: string, strategy: FactStrategy): string {
  const s = STRATEGY_PRAISE[strategy.id]
  if (s && hashString(`${seed}:s`) % 2 === 0) return s
  return praise(seed)
}

export const FEEDBACK = {
  incomplete: '¡Te falta alguna casilla por rellenar! Complétalas todas y vuelve a probar.',
  empty: '¡Escribe tu respuesta! Tómate tu tiempo.',
  factWrong: (strategy: FactStrategy) => `¡Casi! Prueba el truco. ${strategy.text}`,
  factNeighbour: (given: number, a: number, b: number, strategy: FactStrategy) =>
    `¡Casi! ${given} es ${a} × ${b}, la de al lado. Prueba el truco. ${strategy.text}`,
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
  familyRepeated: 'Has escrito dos veces la misma. Usa el espejo: si cambias el orden, sale otra.',
  familyOther: (a: number, b: number, p: number) =>
    `Usa solo los números ${a}, ${b} y ${p}. En la división, el número grande va primero.`,
  carryForgot: (cols: number[]) =>
    cols.length ? `¡Ojo con la mochila! Te has dejado la llevada en ${columnList(cols)}.` : '¡Ojo con la mochila! No te olvides de sumar la llevada.',
  carryWrong: 'En cada casa solo cabe una cifra: escribe las unidades y la decena salta a la casa de al lado.',
  carryWrongMul: 'Primero multiplica y después suma la llevada. ¡La llevada no se multiplica!',
  /** Subtraction: a result cell holding two digits (e.g. "15"). */
  oneDigitPerCell: 'En cada casa del resultado solo cabe una cifra. ¡Revisa la resta casa por casa!',
  mulAdded: (bottom: number) => `¡Ojo! Has sumado los números. Aquí hay que multiplicar cada cifra por ${bottom}.`,
  addFact: (cols: number[]) => `¡Casi! Revisa la suma de ${columnList(cols)}.`,
  misaligned: 'Coloca las cifras empezando por la derecha: unidades debajo de unidades, decenas debajo de decenas.',
  smallerFromLarger: 'Arriba hay un número más pequeño: ¡pide ayuda a la vecina!',
  borrowForgot: 'Si la vecina te presta una decena, ella se queda con una menos. ¡Táchala y réstale 1!',
  zeroBorrow: '¡Cuidado con el cero! No tiene nada que prestar: primero pide a la casa de al lado y el 0 se convierte en 9.',
  subFact: (cols: number[]) => `¡Casi! Revisa la resta de ${columnList(cols)}. Puedes comprobarla sumando.`,
  subAdded: '¡Ojo! Es una resta: hay que quitar, no sumar.',
  mulFact: (cols: number[]) => `¡Casi! Revisa ${columnList(cols)}: multiplica cifra a cifra con calma.`,
  remainderTooBig: (divisor: number) => `El resto tiene que ser más pequeño que ${divisor}. ¡Cabe una vez más!`,
  quotientTooBig: (q: number, divisor: number, dividend: number) =>
    `¡Te has pasado! ${q} × ${divisor} = ${q * divisor}, y solo hay ${dividend}. Prueba con uno menos.`,
  quotientTooSmall: '¡Todavía cabe una vez más! Prueba con uno más en el cociente.',
  remainderWrong: (dividend: number, used: number) => `¡El cociente está bien! Ahora revisa el resto: ${dividend} − ${used}.`,
  bringDown: 'Lo que sobra en las decenas se junta con las unidades: ¡bájalo y sigue repartiendo!',
  divisionStopped: '¡No te pares! Después de las decenas, baja las unidades y sigue repartiendo. Si no cabe ninguna vez, escribe un 0.',
  divisionReversed: '¡Casi! Las cifras del cociente van en orden: primero la de las decenas y, a su derecha, la de las unidades.',
  divisionOperation: (dividend: number, divisor: number) => `¡Ojo! Aquí hay que dividir: repartir ${dividend} entre ${divisor}.`,
  divisionNear: (divisor: number, dividend: number) =>
    `¡Casi! Busca en la tabla del ${divisor} el número que más se acerca a ${dividend} sin pasarse.`,
  divisionFact: (divisor: number) => `¡Casi! Reparte cifra a cifra con la tabla del ${divisor}.`,
  divisionOther: 'Comprueba tu división: cociente × divisor + resto tiene que dar el dividendo.',
  wordOperation: {
    add: '¡Casi! Lee otra vez: aquí se juntan cosas. ¿Qué operación junta?',
    sub: '¡Casi! Lee otra vez: aquí se quitan o se comparan cosas. ¿Qué operación quita?',
    mul: '¡Casi! Lee otra vez: hay grupos iguales que se repiten. ¿Qué operación es?',
    div: '¡Casi! Lee otra vez: hay que repartir en partes iguales. ¿Qué operación reparte?',
  },
  wordFact: '¡Casi! La idea es buena: escribe la operación y revísala con calma.',
  wrongShape: 'Mmm, no he entendido tu respuesta. ¿La escribes otra vez?',
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
