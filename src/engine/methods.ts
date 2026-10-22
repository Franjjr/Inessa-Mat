/* Registry of the methods a child can learn for each operation. Adding a method for another operation (division,
   tables) is one more entry here: the preference (ChildSettings), the attempt log (context.method) and the adult
   report read this same registry. The pattern is documented in docs/PEDAGOGY.md («Varios métodos por operación»). */
import type { SubMethod } from '@/types'

export interface MethodInfo<Id extends string> {
  id: Id
  /** Child-facing name, as the lesson and the settings show it. */
  label: string
  /** One line for the grown-ups (settings, report). */
  summary: string
}

export const SUB_METHODS: readonly MethodInfo<SubMethod>[] = [
  { id: 'borrow', label: 'Pedir prestado arriba', summary: 'Se tacha la cifra de arriba, se le quita uno y la de al lado pasa a ser +10.' },
  { id: 'carry', label: 'Me llevo una abajo', summary: 'Se suma 10 arriba y 1 a la cifra de abajo de la columna siguiente.' },
  { id: 'parts', label: 'Por partes', summary: 'El número de abajo se separa en centenas, decenas y unidades: 352 − 100 − 20 − 7.' },
  { id: 'line', label: 'Saltos en la recta', summary: 'Desde el número de abajo se cuenta hasta el de arriba, con saltos que caen en números redondos.' },
] as const

/** Methods per operation. Only 'sub' has content today; 'div' and 'mul' will follow the same shape. */
export const METHODS = {
  sub: SUB_METHODS,
} as const

export type MethodOp = keyof typeof METHODS

export const DEFAULT_METHOD: { sub: SubMethod } = { sub: 'borrow' }

export function methodsOf(op: MethodOp): readonly MethodInfo<string>[] {
  return METHODS[op]
}

export function methodLabel(op: MethodOp, id: string | undefined | null): string {
  const found = methodsOf(op).find((m) => m.id === id)
  return found ? found.label : id ?? ''
}

export function isSubMethod(value: unknown): value is SubMethod {
  return SUB_METHODS.some((m) => m.id === value)
}

/** Stored settings may come from older versions: anything unknown falls back to the default method. */
export function normaliseSubMethod(value: unknown): SubMethod {
  return isSubMethod(value) ? value : DEFAULT_METHOD.sub
}
