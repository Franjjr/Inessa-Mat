/* Spanish names of the digits, for the questions the voice says ("¿Has escrito un siete?"). */
const WORDS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']

export function digitWord(d: number): string {
  return WORDS[d] ?? String(d)
}
