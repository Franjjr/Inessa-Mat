/* Números de 0 a 100 en inglés británico y operaciones leídas en inglés («three plus four»). */

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

/** 0 to 100, as the child reads them in the 3.º lessons. Out of range or decimals throw. */
export function numberToEnglish(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 100) throw new RangeError(`numberToEnglish: ${n} is outside 0–100`)
  if (n === 100) return 'one hundred'
  if (n < 20) return ONES[n]
  const tens = TENS[Math.floor(n / 10)]
  const ones = n % 10
  return ones === 0 ? tens : `${tens}-${ONES[ones]}`
}

const OPERATION_WORDS = { '+': 'plus', '-': 'minus', '×': 'times' } as const

/** `operationToEnglish(3, '+', 4)` is «three plus four». */
export function operationToEnglish(a: number, op: '+' | '-' | '×', b: number): string {
  return `${numberToEnglish(a)} ${OPERATION_WORDS[op]} ${numberToEnglish(b)}`
}
