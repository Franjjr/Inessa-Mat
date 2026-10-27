import { compareText, normalizeAnswer } from '../text'

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
