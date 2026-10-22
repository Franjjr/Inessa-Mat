/* Spanish descriptions for adult dashboards (families and teachers). */
import type { ErrorType, SkillKey } from '@/types'
import { parseSkill } from './skills'

const llevadas = (n: number) => (n === 0 ? 'sin llevadas' : n === 1 ? 'con 1 llevada' : `con ${n} llevadas`)
const prestamos = (n: number) => (n === 0 ? 'sin préstamos' : n === 1 ? 'con 1 préstamo' : `con ${n} préstamos`)

const CONCEPT_TEXT: Record<string, string> = {
  groups: 'Multiplicar es sumar grupos iguales',
  array: 'Multiplicar con filas y columnas (matrices)',
  commutative: 'Propiedad conmutativa (la regla del espejo)',
  share: 'Dividir es repartir a partes iguales',
  family: 'Familias de operaciones (multiplicación y división)',
  placevalue: 'Valor posicional (unidades, decenas, centenas, millares)',
}

const PLACE_TEXT: Record<string, string> = {
  blocks: 'Números con bloques de millar, centena, decena y unidad',
  expanded: 'Descomponer números (4 325 = 4 000 + 300 + 20 + 5)',
  words: 'Leer y escribir números hasta 9 999',
}

const MENTAL_TEXT: Record<string, string> = {
  dobles: 'Dobles (de cabeza)',
  mitades: 'Mitades (de cabeza)',
  completar10: 'Completar hasta 10 y 100',
  completar100: 'Completar hasta 100',
  completar1000: 'Completar hasta 1 000',
  decenas: 'Sumar y restar decenas',
  centenas: 'Sumar y restar centenas',
  compensar: 'Compensar (+9 = +10 − 1)',
}

const WORD_TEXT: Record<string, string> = {
  add: 'Problemas de sumar',
  sub: 'Problemas de restar',
  mul: 'Problemas de multiplicar',
  div: 'Problemas de dividir',
}

/** Human description of a skill for adults (Spanish): 'mul:6x7' → '6 × 7', 'sub:4d:z' → 'Restas de 4 cifras con ceros'. */
export function describeSkill(skill: SkillKey): string {
  const p = parseSkill(skill)
  if (!p) return skill
  switch (p.type) {
    case 'mul': return `${p.a} × ${p.b}`
    case 'div': return `${p.p} ÷ ${p.d}`
    case 'skip': return `Contar de ${p.n} en ${p.n}`
    case 'add': return `Sumas de ${p.digits} cifras ${llevadas(p.carries)}`
    case 'sub': return p.zero ? `Restas de ${p.digits} cifras con ceros` : `Restas de ${p.digits} cifras ${prestamos(p.borrows ?? 0)}`
    case 'mul2x1': return `Multiplicaciones de 2 cifras × 1 cifra ${p.carry ? 'con llevada' : 'sin llevadas'}`
    case 'div2x1':
      return p.variant === 'exact' ? 'Divisiones de 2 cifras entre 1 cifra (exactas)'
        : p.variant === 'rem' ? 'Divisiones con resto (cociente de 1 cifra)'
          : 'Divisiones de 2 cifras bajando cifras (nivel experto)'
    case 'concept': return CONCEPT_TEXT[p.name]
    case 'word': return WORD_TEXT[p.op]
    case 'place': return PLACE_TEXT[p.mode]
    case 'compare': return 'Comparar números hasta 9 999 con < > ='
    case 'order': return 'Ordenar números hasta 9 999'
    case 'round': return `Redondear a las ${p.to === 10 ? 'decenas' : 'centenas'}`
    case 'line': return `Recta numérica: saltos de ${p.step}`
    case 'mental': return MENTAL_TEXT[p.family]
    case 'equation': return 'Signo igual: los dos lados valen lo mismo'
    case 'div3x1': return p.variant === 'exact' ? 'Divisiones de 3 cifras entre 1 cifra (exactas)' : 'Divisiones de 3 cifras entre 1 cifra con resto'
    case 'bar': return p.op === 'two' ? 'Problemas de dos pasos con barras' : `Problemas con barras (${WORD_TEXT[p.op].toLowerCase()})`
    case 'hunt': return `Encuentra el error en cuentas de ${HUNT_TEXT[p.op]}`
    case 'check': return `Comprobar resultados de ${HUNT_TEXT[p.op === 'div' ? 'mul' : p.op]}`
    case 'clock-read': return CLOCK_READ_TEXT[p.step]
    case 'clock-set': return p.step === 30 ? 'Poner la hora en el reloj: en punto, y media, cuartos' : 'Poner la hora en el reloj de cinco en cinco minutos'
    case 'clock-convert': return 'Reloj digital de 24 horas y frases (mañana, tarde, noche)'
    case 'time-duration': return p.ask === 'end' ? 'Duraciones: a qué hora acaba' : 'Duraciones: cuántos minutos pasan'
    case 'calendar': return CALENDAR_TEXT[p.topic]
  }
}

const CLOCK_READ_TEXT: Record<30 | 15 | 5, string> = {
  30: 'Leer el reloj: en punto y media',
  15: 'Leer el reloj: cuartos (y cuarto, menos cuarto)',
  5: 'Leer el reloj de cinco en cinco minutos',
}
const CALENDAR_TEXT: Record<'units' | 'weekday' | 'month', string> = {
  units: 'Unidades de tiempo: hora, minuto, día, semana',
  weekday: 'Días de la semana: qué día será dentro de unos días',
  month: 'Días de cada mes',
}

const HUNT_TEXT: Record<'add' | 'sub' | 'mul', string> = { add: 'sumar', sub: 'restar', mul: 'multiplicar' }

const ERROR_TEXT: Record<ErrorType, string> = {
  'fact': 'Resultado de la tabla o cálculo básico incorrecto',
  'carry-forgot': 'Olvida sumar la llevada',
  'carry-wrong': 'Escribe mal la llevada (o la coloca en otra columna)',
  'borrow-forgot': 'Pide prestado pero no se lo resta a la vecina (o no lo pide)',
  'smaller-from-larger': 'Resta la cifra pequeña de la grande en vez de pedir prestado',
  'zero-borrow': 'Se lía al pedir prestado a un cero',
  'misaligned': 'Coloca las cifras en columnas equivocadas',
  'remainder-too-big': 'Deja un resto igual o mayor que el divisor',
  'quotient-off': 'El cociente sale uno de más o uno de menos',
  'operation': 'Elige la operación equivocada',
  'incomplete': 'Deja casillas sin completar',
  'recognition': 'La letra se reconoció mal (no es un error de cálculo)',
  'bar-placement': 'Pone una cantidad en la parte equivocada de la barra',
  'place-value': 'Escribe una cifra en una columna que no le toca (valor posicional)',
  'step': 'Se equivoca en el primer paso de un problema de dos pasos',
  'false-alarm': 'Dice que hay un error cuando la cuenta está bien',
  'other': 'Otro tipo de error',
  'clock-hour': 'Lee mal la hora del reloj (la aguja corta)',
  'clock-minute': 'Lee mal los minutos del reloj (la aguja larga, de cinco en cinco)',
  'clock-period': 'Confunde el momento del día (mañana, tarde o noche)',
}

/** Spanish description of an error type for adult dashboards. */
export function describeError(errorType: ErrorType): string {
  return ERROR_TEXT[errorType] ?? errorType
}
