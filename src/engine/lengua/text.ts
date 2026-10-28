/* Comparing what a child typed with the expected word. Spaces at the ends and doubled spaces do not count; capitals and
   accents count only where the item asks for them ('exact'), and 'ignore-case' still counts accents. */

/** Trims the ends and collapses runs of spaces into one. */
export function normalizeAnswer(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

const fold = (s: string) => normalizeAnswer(s).normalize('NFC')
const lower = (s: string) => s.toLocaleLowerCase('es')
/** Drops the acute, grave and diaeresis marks only (ñ keeps its tilde, so «caña» and «cana» differ). */
const unaccent = (s: string) => s.normalize('NFD').replace(/[̀́̈]/g, '').normalize('NFC')

/** The mark that is missing when a word is only wrong in accents: «tilde», or «diéresis» when the only difference is the ü
    of güe/güi. Feedback names it («Mira la diéresis»), so the child looks at the right sign. */
export function missingMark(given: string, expected: string): 'tilde' | 'diéresis' {
  // A word that has the ü of expected but not the ü at all (pinguíno for pingüino) is about the diéresis, even when the
  // child also put a tilde on the u. Only the marks differ: the letters without any mark are the same.
  const bare = (s: string) => fold(s).normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
  const lacksDiaeresis = fold(expected).includes('ü') && !fold(given).includes('ü')
  return lacksDiaeresis && bare(given) === bare(expected) ? 'diéresis' : 'tilde'
}

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
  if (rule === 'ignore-case') {
    const correct = lower(g) === lower(e)
    return { correct, caseOnly: false, accentOnly: !correct && unaccent(lower(g)) === unaccent(lower(e)) }
  }
  // A flag is set only when that one difference is the whole mistake: «Arbol» for «Árbol» is neither.
  const correct = g === e
  return {
    correct,
    caseOnly: !correct && lower(g) === lower(e),
    accentOnly: !correct && unaccent(g) === unaccent(e),
  }
}
