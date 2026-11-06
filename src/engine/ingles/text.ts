/* Comprobación de la respuesta en inglés escrita con el teclado. Reutiliza la normalización de Lengua (recortar y
   juntar espacios). Sin distinguir mayúsculas; «’» es «'»; el guion es un espacio («twenty-one» = «twenty one»);
   vale cualquiera de las alternativas. Un error a una letra de distancia es «¡Casi!». */
import { normalizeAnswer } from '../lengua/text'

export interface EnglishComparison {
  correct: boolean
  /** Wrong, but one edit (insert, delete or replace one letter) away from an accepted answer: «¡Casi!». */
  nearMiss: boolean
}

const canon = (s: string) => normalizeAnswer(s).replace(/’/g, "'").replace(/-/g, ' ').toLowerCase()

/** Levenshtein distance, stopping early once it passes 1. */
function withinOneEdit(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    if (Math.min(...cur) > 1) return false
    prev = cur
  }
  return prev[b.length] <= 1
}

export function compareEnglish(given: string, expected: string, alts: string[] = []): EnglishComparison {
  const g = canon(given)
  const accepted = [expected, ...alts].map(canon)
  if (accepted.includes(g)) return { correct: true, nearMiss: false }
  return { correct: false, nearMiss: accepted.some((a) => withinOneEdit(g, a)) }
}
