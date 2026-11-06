import { numberToEnglish, operationToEnglish } from '../numbers'

describe('numberToEnglish', () => {
  it('writes the numbers of the 3.º range in English words', () => {
    expect(numberToEnglish(0)).toBe('zero')
    expect(numberToEnglish(7)).toBe('seven')
    expect(numberToEnglish(13)).toBe('thirteen')
    expect(numberToEnglish(15)).toBe('fifteen')
    expect(numberToEnglish(20)).toBe('twenty')
    expect(numberToEnglish(21)).toBe('twenty-one')
    expect(numberToEnglish(40)).toBe('forty')
    expect(numberToEnglish(99)).toBe('ninety-nine')
    expect(numberToEnglish(100)).toBe('one hundred')
  })
  it('rejects numbers outside 0–100 and decimals', () => {
    expect(() => numberToEnglish(101)).toThrow(RangeError)
    expect(() => numberToEnglish(-1)).toThrow(RangeError)
    expect(() => numberToEnglish(2.5)).toThrow(RangeError)
  })
})

describe('operationToEnglish', () => {
  it('reads plus, minus and times in English', () => {
    expect(operationToEnglish(3, '+', 4)).toBe('three plus four')
    expect(operationToEnglish(9, '-', 2)).toBe('nine minus two')
    expect(operationToEnglish(2, '×', 5)).toBe('two times five')
  })
  it('reads minus with the number words', () => {
    expect(operationToEnglish(20, '-', 1)).toBe('twenty minus one')
    expect(operationToEnglish(15, '-', 15)).toBe('fifteen minus fifteen')
  })
  it('uses the hyphenated number words inside the sum', () => {
    expect(operationToEnglish(21, '+', 10)).toBe('twenty-one plus ten')
  })
})
