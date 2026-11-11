/* Registry of the methods for each operation. One method per operation, the one of the child's school, chosen by the
   grown-up (never by the child): by default «pedir prestado» and «la galera con restas». The correct final answer is
   always right, whatever the method. The preference (ChildSettings), the attempt log (context.method), the lessons and
   the adult report read this same registry. The pattern is documented in docs/PEDAGOGY.md («Un método por operación»).
   Method ids are unique across operations, because the attempt log and the report key their tallies by id.
   Retired methods (resta por partes, saltos en la recta, repartir por partes, multiplicar hacia arriba) stay in the
   SubMethod/DivMethod types so that old settings and old attempt logs still load: the normalisers turn them into the
   default method, and RETIRED_METHODS lets the adult area tell the family once. */
import type { DivMethod, SubMethod, TableMethod } from '@/types'

export interface MethodInfo<Id extends string> {
  id: Id
  /** Child-facing name, as the lesson and the settings show it. */
  label: string
  /** One line for the grown-ups (settings, report), always visible next to the option. */
  summary: string
}

/** A school method with its notebook example: the settings show the sentence under a small drawing of it. */
export interface SchoolMethodInfo<Id extends string> extends MethodInfo<Id> {
  /** The worked example drawn in the settings (MethodSketch), e.g. «52 − 27». */
  example: string
  /** How the example looks in the notebook, in words (visible under the drawing, and its accessible name). */
  notebook: string
}

export const SUB_METHODS: readonly SchoolMethodInfo<SubMethod>[] = [
  { id: 'borrow', label: 'Pedir prestado arriba', summary: 'Se tacha la cifra de arriba, se le quita uno y la de al lado pasa a ser +10.',
    example: '52 − 27', notebook: 'Se tacha el 5 y se pone 4; el 2 pasa a ser 12. 12 − 7 = 5 y 4 − 2 = 2: da 25.' },
  { id: 'carry', label: 'Me llevo una abajo', summary: 'Se suma 10 arriba y 1 a la cifra de abajo de la columna siguiente.',
    example: '52 − 27', notebook: 'El 2 pasa a ser 12 y se pone un 1 pequeño junto al 2 de abajo. 12 − 7 = 5 y 5 − 3 = 2: da 25.' },
] as const

export const DIV_METHODS: readonly SchoolMethodInfo<DivMethod>[] = [
  { id: 'galera', label: 'La galera con restas', summary: 'Se escriben las restas debajo de cada paso: cociente, producto, resto.',
    example: '96 ÷ 4', notebook: 'Debajo del 9 se escribe −8 y sobra 1; se baja el 6: 16, se escribe −16 y sobra 0. El cociente es 24.' },
  { id: 'galera-short', label: 'La galera sin restas', summary: 'Solo se escriben las cifras del cociente y lo que sobra: las restas se hacen de cabeza.',
    example: '96 ÷ 4', notebook: 'Debajo del 9 solo se escribe lo que sobra, 1; se baja el 6: 16, y sobra 0. El cociente es 24.' },
] as const

/** Methods the app no longer teaches, with the name the report shows for old attempts. Saved settings with them still
    load and become the default method. */
export const RETIRED_METHODS: { sub: readonly MethodInfo<SubMethod>[]; div: readonly MethodInfo<DivMethod>[] } = {
  sub: [
    { id: 'parts', label: 'Por partes', summary: 'Ya no se usa: ahora se resta en columna, como en el cole.' },
    { id: 'line', label: 'Saltos en la recta', summary: 'Ya no se usa: ahora se resta en columna, como en el cole.' },
  ],
  div: [
    { id: 'div-parts', label: 'Repartir por partes', summary: 'Ya no se usa: ahora se divide con la galera.' },
    { id: 'climb', label: 'Multiplicar hacia arriba', summary: 'Ya no se usa: ahora se divide con la galera.' },
  ],
}

/** Which operations of the saved settings name a retired method. Read the raw settings, before normalising them. */
export function retiredMethodsIn(settings: { subMethod?: unknown; divMethod?: unknown } | null | undefined): { sub: boolean; div: boolean } {
  return {
    sub: RETIRED_METHODS.sub.some((m) => m.id === settings?.subMethod),
    div: RETIRED_METHODS.div.some((m) => m.id === settings?.divMethod),
  }
}

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
  { id: 'five-plus-one', label: 'El 5 y uno más', summary: 'Con 6 y 7: cinco veces el otro número, y una o dos veces más.', applies: (a, b) => has(a, b, 6) || has(a, b, 7),
    // The text says which factor is the one with the trick: a 6 adds one more, a 7 adds two more.
    hint: (a, b) => {
      const k = has(a, b, 6) ? 6 : 7
      const o = a === k ? b : a
      return k === 6 ? `Cinco veces el ${o}, y una vez más el ${o}.` : `Cinco veces el ${o}, y dos veces más el ${o}.`
    } },
  { id: 'mirror', label: 'El espejo', summary: 'Se cambia el orden: 7 × 6 es lo mismo que 6 × 7. Vale para cualquier hecho con dos factores distintos.', applies: (a, b) => a !== b,
    hint: (a, b) => `Dale la vuelta: ${b} × ${a} da lo mismo. Piensa en la tabla del número más pequeño, el ${Math.min(a, b)}.` },
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
  // Old attempt logs may name a retired method: the report still shows its name.
  const retired: readonly MethodInfo<string>[] = op === 'sub' ? RETIRED_METHODS.sub : op === 'div' ? RETIRED_METHODS.div : []
  const found = methodsOf(op).find((m) => m.id === id) ?? retired.find((m) => m.id === id)
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

/** The method of the child's school for an operation, as the exercises must use it: the one the grown-up saved, or
    the default (pedir prestado, la galera con restas). Never a retired method, whatever old data says. */
export function methodFor(op: 'sub', prefs: { subMethod?: unknown } | null | undefined): SubMethod
export function methodFor(op: 'div', prefs: { divMethod?: unknown } | null | undefined): DivMethod
export function methodFor(op: 'sub' | 'div', prefs: { subMethod?: unknown; divMethod?: unknown } | null | undefined): SubMethod | DivMethod {
  return op === 'sub' ? normaliseSubMethod(prefs?.subMethod) : normaliseDivMethod(prefs?.divMethod)
}

/** No favourite yet is null (not a default trick): the hints keep the engine's own strategy. */
export function normaliseTableMethod(value: unknown): TableMethod | null {
  return isTableMethod(value) ? value : null
}

/** The tricks that apply to a multiplication fact, in registry order. */
export function tricksFor(a: number, b: number): TableTrick[] {
  return TABLE_METHODS.filter((t) => t.applies(a, b))
}
