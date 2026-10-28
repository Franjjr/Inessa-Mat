/* One concrete Spanish tip per criterion (masculino genérico), named after the letter, word or phrase. */
import type { Criterion } from './thresholds'

const ROUND = new Set(['a', 'c', 'd', 'g', 'o', 'q'])
const LOOPS = new Set(['b', 'f', 'h', 'k', 'l'])

/** «letra o», «palabra sol», «frase «…»»: the noun after the article «la» in the tips. */
export function nombreDe(text: string): string {
  const t = text.trim()
  if (/\s/.test(t)) return `frase «${t}»`
  return t.length === 1 ? `letra ${t}` : `palabra ${t}`
}

export interface TipHint {
  /** For size: true when the child's letter is bigger than the model. */
  tooBig?: boolean
}

export function tipFor(criterion: Criterion, text: string, hint: TipHint = {}): string {
  const n = nombreDe(text)
  const single = text.trim().length === 1 ? text.trim() : ''
  switch (criterion) {
    case 'size':
      return hint.tooBig === false
        ? `La ${n} te ha salido muy pequeña: hazla hasta la línea de arriba.`
        : `La ${n} te ha salido muy grande: que llegue solo hasta la línea de arriba.`
    case 'line':
      return `Apoya la ${n} en la línea de abajo.`
    case 'start':
      return `Empieza la ${n} por el punto verde y sigue la flecha.`
    case 'shape':
      if (ROUND.has(single)) return `Cierra bien la ${n} por arriba.`
      if (LOOPS.has(single)) return `Haz bien el bucle de la ${n} y no lo abras por arriba.`
      return `Sigue la forma de la ${n} que marca el modelo.`
  }
}
