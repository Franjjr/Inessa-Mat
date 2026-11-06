import { compareEnglish } from '../text'

describe('compareEnglish', () => {
  it('ignores capitals and spaces at the ends and in the middle', () => {
    expect(compareEnglish('Twenty one', 'twenty-one').correct).toBe(true)
    expect(compareEnglish('  twenty   one ', 'twenty-one').correct).toBe(true)
  })
  it('treats the typographic apostrophe as the plain one', () => {
    expect(compareEnglish('what’s', "what's").correct).toBe(true)
  })
  it('accepts any of the alternatives', () => {
    expect(compareEnglish('gray', 'grey', ['gray']).correct).toBe(true)
    expect(compareEnglish('grey', 'grey', ['gray']).correct).toBe(true)
  })
  it('a wrong word one edit away is a near miss', () => {
    expect(compareEnglish('tree', 'three')).toEqual({ correct: false, nearMiss: true })
  })
  it('a wrong word further away is not a near miss', () => {
    expect(compareEnglish('cat', 'dog')).toEqual({ correct: false, nearMiss: false })
  })
  it('a right answer is never a near miss', () => {
    expect(compareEnglish('three', 'three')).toEqual({ correct: true, nearMiss: false })
  })
})
