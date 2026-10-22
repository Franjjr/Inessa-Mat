/* Spanish descriptions for adult dashboards (families and teachers). */
import type { ErrorType, SkillKey } from '@/types'
import { parseSkill } from './skills'

const llevadas = (n: number) => (n === 0 ? 'sin llevadas' : n === 1 ? 'con 1 llevada' : `con ${n} llevadas`)

const CONCEPT_TEXT: Record<string, string> = {
  groups: 'Multiplicar es sumar grupos iguales',
  array: 'Multiplicar con filas y columnas (matrices)',
  commutative: 'Propiedad conmutativa (la regla del espejo)',
  share: 'Dividir es repartir a partes iguales',
  family: 'Familias de operaciones (multiplicación y división)',
  placevalue: 'Valor posicional (unidades, decenas, centenas, millares)',
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
    case 'sub': return p.zero ? `Restas de ${p.digits} cifras con ceros` : `Restas de ${p.digits} cifras ${llevadas(p.borrows ?? 0)}`
    case 'mul2x1': return `Multiplicaciones de 2 cifras × 1 cifra ${p.carry ? 'con llevada' : 'sin llevadas'}`
    case 'div2x1':
      return p.variant === 'exact' ? 'Divisiones de 2 cifras entre 1 cifra (exactas)'
        : p.variant === 'rem' ? 'Divisiones con resto (cociente de 1 cifra)'
          : 'Divisiones de 2 cifras bajando cifras (nivel experto)'
    case 'concept': return CONCEPT_TEXT[p.name]
    case 'word': return WORD_TEXT[p.op]
  }
}

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
  'other': 'Otro tipo de error',
}

/** Spanish description of an error type for adult dashboards. */
export function describeError(errorType: ErrorType): string {
  return ERROR_TEXT[errorType] ?? errorType
}
