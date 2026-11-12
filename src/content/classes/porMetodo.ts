/* A class as the child's school teaches it. The method of subtracting and of dividing is the grown-up's choice
   (methodFor, engine/methods.ts): the tries of a class are solved with it, and a class that teaches the method itself
   (restar pidiendo prestado) has its own version for «me llevo una abajo». Pure: the class registry is never changed. */
import type { DivMethod, LessonDef, LessonStep, SubMethod } from '@/types'
import type { ClassDef } from './dsl'
import { restarPrestandoLlevando } from './grade3'

export interface ClassMethods {
  subMethod: SubMethod
  divMethod: DivMethod
}

/** Classes with their own version for a subtraction method (same id and topic, the example said the other way). */
const SUB_VARIANTS: Record<string, Partial<Record<SubMethod, ClassDef>>> = {
  'c3-resta-prestando': { carry: restarPrestandoLlevando },
}

const isSubTry = (st: LessonStep) =>
  !!st.trySelector && (!!st.trySelector.kinds?.includes('column-sub') || !!st.trySelector.skills?.some((k) => k.startsWith('sub:')))

const isDivTry = (st: LessonStep) =>
  !!st.trySelector && (!!st.trySelector.kinds?.includes('division') || !!st.trySelector.skills?.some((k) => /^div:\d+x\d+/.test(k)))

/** The galera without subtractions writes only what is left over: a try that asks to write each subtraction says so. */
function divText(text: string, method: DivMethod): string {
  if (method !== 'galera-short') return text
  return text
    .replace(/Escribe cada resta debajo del paso\./, 'Haz cada resta de cabeza y escribe solo lo que sobra.')
    .replace(/Cada resta debajo del paso\./, 'Las restas, de cabeza: escribe solo lo que sobra.')
}

/** The class for this child's methods: its version for her subtraction method when it has one, and every try of
    subtracting or dividing solved with her methods (a step that names its own method keeps it). */
export function classForMethods(cls: ClassDef, methods: ClassMethods): ClassDef {
  const base = SUB_VARIANTS[cls.lesson.id]?.[methods.subMethod] ?? cls
  const steps = base.lesson.steps.map((st): LessonStep => {
    if (st.interaction !== 'try') return st
    if (isSubTry(st) && !st.method) return { ...st, method: methods.subMethod }
    if (isDivTry(st) && !st.divMethod) return { ...st, divMethod: methods.divMethod, text: divText(st.text, methods.divMethod) }
    return st
  })
  const lesson: LessonDef = { ...base.lesson, steps }
  return { ...base, lesson }
}
