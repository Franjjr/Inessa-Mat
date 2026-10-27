/* Comparing what a child typed with the expected word. Spaces at the ends and doubled spaces do not count; capitals and
   accents count only where the item asks for them ('exact'), and 'ignore-case' still counts accents. */

/** Trims the ends and collapses runs of spaces into one. */
export function normalizeAnswer(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

const fold = (s: string) => normalizeAnswer(s).normalize('NFC')
const lower = (s: string) => s.toLocaleLowerCase('es')
/** Drops the acute and diaeresis marks only (ñ keeps its tilde, so «caña» and «cana» differ). */
const unaccent = (s: string) => s.normalize('NFD').replace(/[̀́̈]/g, '').normalize('NFC')

export interface TextComparison {
  correct: boolean
  /** Wrong only because of capitals («árbol» for «Árbol»). */
  caseOnly: boolean
  /** Wrong only because of accents («arbol» for «árbol»): feedback can say «¡Casi! Mira la tilde». */
  accentOnly: boolean
}

/** 'exact': spelling and punctuation items (capitals and accents count). 'ignore-case': comprehension items (only
    capitals are forgiven). */
export function compareText(given: string, expected: string, rule: 'exact' | 'ignore-case'): TextComparison {
  const g = fold(given)
  const e = fold(expected)
  const sameLetters = lower(g) === lower(e)
  const sameWithoutAccents = unaccent(lower(g)) === unaccent(lower(e))
  if (rule === 'ignore-case') {
    const correct = sameLetters
    return { correct, caseOnly: false, accentOnly: !correct && sameWithoutAccents }
  }
  const correct = g === e
  return {
    correct,
    caseOnly: !correct && sameLetters,
    accentOnly: !correct && !sameLetters && sameWithoutAccents,
  }
}
