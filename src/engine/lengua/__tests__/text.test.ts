import { compareText, missingMark, normalizeAnswer } from '../text'

describe('normalizeAnswer', () => {
  it('trims the ends and collapses spaces', () => {
    expect(normalizeAnswer('  el   perro ')).toBe('el perro')
    expect(normalizeAnswer('')).toBe('')
  })
})

describe('compareText exact', () => {
  it('a capital missing is wrong, and says so', () => {
    expect(compareText('árbol', 'Árbol', 'exact')).toEqual({ correct: false, caseOnly: true, accentOnly: false })
  })
  it('a missing accent is wrong, and says so', () => {
    expect(compareText('arbol', 'árbol', 'exact')).toEqual({ correct: false, caseOnly: false, accentOnly: true })
  })
  it('a wrong capital and a missing accent together set neither flag', () => {
    expect(compareText('arbol', 'Árbol', 'exact')).toEqual({ correct: false, caseOnly: false, accentOnly: false })
  })
  it('spaces at the ends do not count', () => {
    expect(compareText(' Árbol ', 'Árbol', 'exact')).toEqual({ correct: true, caseOnly: false, accentOnly: false })
  })
  it('ñ is a letter, not an accented n', () => {
    expect(compareText('cana', 'caña', 'exact')).toEqual({ correct: false, caseOnly: false, accentOnly: false })
  })
  it('ü counts as an accent mark', () => {
    expect(compareText('pinguino', 'pingüino', 'exact').accentOnly).toBe(true)
  })
})

describe('compareText ignore-case', () => {
  it('forgives capitals but not accents', () => {
    expect(compareText('ÁRBOL', 'árbol', 'ignore-case').correct).toBe(true)
    expect(compareText('arbol', 'árbol', 'ignore-case')).toEqual({ correct: false, caseOnly: false, accentOnly: true })
  })
})

describe('capital and accent directions (both ways round)', () => {
  it('a capital typed for a small letter, and a small letter for a capital, are both the capital only', () => {
    expect(compareText('Árbol', 'árbol', 'exact')).toEqual({ correct: false, caseOnly: true, accentOnly: false })
    expect(compareText('árbol', 'Árbol', 'exact')).toEqual({ correct: false, caseOnly: true, accentOnly: false })
    expect(compareText('ÁRBOL', 'árbol', 'exact').caseOnly).toBe(true)
  })

  it('a missing accent is the accent only, and a capital with a missing accent is neither', () => {
    expect(compareText('arbol', 'árbol', 'exact').accentOnly).toBe(true)
    expect(compareText('Arbol', 'árbol', 'exact')).toEqual({ correct: false, caseOnly: false, accentOnly: false })
  })

  it('the ü that is missing is named as the diéresis, even when a tilde was put on the u instead', () => {
    expect(missingMark('pinguino', 'pingüino')).toBe('diéresis')
    expect(missingMark('pinguíno', 'pingüino')).toBe('diéresis')
    expect(missingMark('pingüíno', 'pingüino')).toBe('tilde')
    expect(missingMark('arbol', 'árbol')).toBe('tilde')
  })
})
