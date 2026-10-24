/* Registry of the methods a child can learn for each operation. Adding a method is one more entry here: the
   preference (ChildSettings), the attempt log (context.method), the lessons and the adult report read this same
   registry. The pattern is documented in docs/PEDAGOGY.md («Varios métodos por operación»).
   Method ids are unique across operations, because the attempt log and the report key their tallies by id. */
import type { DivMethod, SubMethod, TableMethod } from '@/types'

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

export const DIV_METHODS: readonly MethodInfo<DivMethod>[] = [
  { id: 'galera', label: 'La galera con restas', summary: 'Se escriben las restas debajo de cada paso: cociente, producto, resto.' },
  { id: 'galera-short', label: 'La galera sin restas', summary: 'Solo se escriben las cifras del cociente y el resto final: las restas se hacen de cabeza.' },
  { id: 'div-parts', label: 'Repartir por partes', summary: 'El dividendo se parte en partes fáciles y se suman los cocientes: 84 ÷ 4 = 80 ÷ 4 + 4 ÷ 4.' },
  { id: 'climb', label: 'Multiplicar hacia arriba', summary: '«¿Qué número por el divisor da el dividendo?»: se sube fila a fila hasta llegar o pasarse.' },
] as const

/** A trick for the tables (the Lumi tricks). `applies` says for which facts the trick is the natural one. */
export interface TableTrick extends MethodInfo<TableMethod> {
  applies: (a: number, b: number) => boolean
  /** Child-facing first hint when the child's favourite trick applies to the fact. A function when the text depends on the
      fact: it names only the factor the trick works on, never the product (the answer). */
  hint: string | ((a: number, b: number) => string)
}

const has = (a: number, b: number, n: number) => a === n || b === n

export const TABLE_METHODS: readonly TableTrick[] = [
  { id: 'double', label: 'El doble', summary: 'Un factor es 2: es el doble del otro número.', applies: (a, b) => has(a, b, 2), hint: 'Es el doble: suma el otro número dos veces.' },
  { id: 'double-double', label: 'Doble y doble otra vez', summary: 'Con 4 y 8: se dobla dos veces (4) o tres veces (8).', applies: (a, b) => has(a, b, 4) || has(a, b, 8), hint: (a, b) => (has(a, b, 4) ? 'Dobla y dobla otra vez: el 4 son dos dobles del otro número.' : 'Dobla y dobla otra vez: el 8 son tres dobles del otro número.') },
  { id: 'half-ten', label: 'La mitad del 10', summary: 'Con 5: la mitad de la tabla del 10 con el mismo número.', applies: (a, b) => has(a, b, 5), hint: 'Con el 5: mira la tabla del diez con el otro número y parte ese resultado por la mitad.' },
  { id: 'ten-minus-one', label: 'Diez menos una vez', summary: 'Con 9: diez veces el número, menos una vez el número.', applies: (a, b) => has(a, b, 9), hint: 'Con el 9: diez veces el número, y quita una vez el número.' },
  { id: 'five-plus-one', label: 'El 5 y uno más', summary: 'Con 6 y 7: cinco veces el otro número, y una o dos veces más.', applies: (a, b) => has(a, b, 6) || has(a, b, 7), hint: 'Cinco veces el otro número, y una o dos veces más.' },
  { id: 'mirror', label: 'El espejo', summary: 'Se cambia el orden: 7 × 6 es lo mismo que 6 × 7. Vale para cualquier hecho con dos factores distintos.', applies: (a, b) => a !== b, hint: 'Dale la vuelta al hecho: el espejo sale igual y es más fácil de recordar.' },
] as const

/** Methods per operation. 'sub' = column subtraction, 'div' = division, 'tables' = the tricks of the times tables. */
export const METHODS = {
  sub: SUB_METHODS,
  div: DIV_METHODS,
  tables: TABLE_METHODS,
} as const

export type MethodOp = keyof typeof METHODS

export const DEFAULT_METHOD: { sub: SubMethod; div: DivMethod } = { sub: 'borrow', div: 'galera' }

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

export function isDivMethod(value: unknown): value is DivMethod {
  return DIV_METHODS.some((m) => m.id === value)
}

export function isTableMethod(value: unknown): value is TableMethod {
  return TABLE_METHODS.some((m) => m.id === value)
}

/** Stored settings may come from older versions: anything unknown falls back to the default method. */
export function normaliseSubMethod(value: unknown): SubMethod {
  return isSubMethod(value) ? value : DEFAULT_METHOD.sub
}

export function normaliseDivMethod(value: unknown): DivMethod {
  return isDivMethod(value) ? value : DEFAULT_METHOD.div
}

/** No favourite yet is null (not a default trick): the hints keep the engine's own strategy. */
export function normaliseTableMethod(value: unknown): TableMethod | null {
  return isTableMethod(value) ? value : null
}

/** The tricks that apply to a multiplication fact, in registry order. */
export function tricksFor(a: number, b: number): TableTrick[] {
  return TABLE_METHODS.filter((t) => t.applies(a, b))
}
