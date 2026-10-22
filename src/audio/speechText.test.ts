import { numberToSpanish, ordinalToSpanish } from './spanishNumbers'
import { chunkForSpeech, toSpeakable } from './speechText'

describe('numberToSpanish', () => {
  it.each([
    [0, 'cero'], [1, 'uno'], [7, 'siete'], [15, 'quince'], [16, 'dieciséis'], [21, 'veintiuno'], [22, 'veintidós'],
    [30, 'treinta'], [42, 'cuarenta y dos'], [49, 'cuarenta y nueve'], [56, 'cincuenta y seis'], [100, 'cien'],
    [101, 'ciento uno'], [116, 'ciento dieciséis'], [500, 'quinientos'], [700, 'setecientos'], [900, 'novecientos'],
    [1000, 'mil'], [1001, 'mil uno'], [2609, 'dos mil seiscientos nueve'], [3843, 'tres mil ochocientos cuarenta y tres'],
    [21000, 'veintiún mil'], [100000, 'cien mil'], [1_000_000, 'un millón'], [2_500_000, 'dos millones quinientos mil'],
  ])('%i → %s', (n, words) => {
    expect(numberToSpanish(n)).toBe(words)
  })

  it('agrees in gender and shortens before nouns', () => {
    expect(numberToSpanish(1, 'f')).toBe('una')
    expect(numberToSpanish(21, 'f')).toBe('veintiuna')
    expect(numberToSpanish(200, 'f')).toBe('doscientas')
    expect(numberToSpanish(31, 'apocope')).toBe('treinta y un')
    expect(numberToSpanish(21, 'apocope')).toBe('veintiún')
  })

  it('reads decimals and negatives', () => {
    expect(numberToSpanish(2.5)).toBe('dos coma cinco')
    expect(numberToSpanish(-3)).toBe('menos tres')
  })

  it('reads ordinals', () => {
    expect(ordinalToSpanish(1, false)).toBe('primero')
    expect(ordinalToSpanish(3, true)).toBe('tercera')
  })
})

describe('toSpeakable', () => {
  it.each([
    ['6 × 7 = 42', 'seis por siete son cuarenta y dos'],
    ['6×7=42', 'seis por siete son cuarenta y dos'],
    ['7 x 8 = 56', 'siete por ocho son cincuenta y seis'],
    ['6 × 7 = ?', '¿seis por siete son…?'],
    ['¿Cuánto es 7 × 8?', '¿Cuánto es siete por ocho?'],
    ['6 × ? = 42', 'seis por… ¿cuánto?… son cuarenta y dos'],
    ['3843 − 1234', 'tres mil ochocientos cuarenta y tres menos mil doscientos treinta y cuatro'],
    ['1.234 + 2.345', 'mil doscientos treinta y cuatro más dos mil trescientos cuarenta y cinco'],
    ['45 ÷ 5 = 9', 'cuarenta y cinco entre cinco son nueve'],
    ['12 : 3 = 4', 'doce entre tres son cuatro'],
    ['6 ✖️ 7 ➕ 1 🟰 43', 'seis por siete más uno son cuarenta y tres'],
  ])('reads maths like a teacher: %s', (input, out) => {
    expect(toSpeakable(input)).toBe(out)
  })

  it('makes numbers agree with the noun that follows', () => {
    expect(toSpeakable('Tienes 1 estrella y 21 cristales')).toBe('Tienes una estrella y veintiún cristales')
    expect(toSpeakable('Has ganado 21 estrellas')).toBe('Has ganado veintiuna estrellas')
    expect(toSpeakable('200 estrellas')).toBe('doscientas estrellas')
    expect(toSpeakable('1 cristal')).toBe('un cristal')
    expect(toSpeakable('Página 1')).toBe('Página uno')
  })

  it('strips emojis, markup and leftover placeholders', () => {
    expect(toSpeakable('¡Bien hecho, Inessa! 🎉✨🦄')).toBe('¡Bien hecho, Inessa!')
    expect(toSpeakable('**¡Muy bien!** Has usado el _truco_ del doble.')).toBe('¡Muy bien! Has usado el truco del doble.')
    expect(toSpeakable('<b>Hola</b><br>¿Qué tal?')).toBe('Hola. ¿Qué tal?')
    expect(toSpeakable('Hola {child}, vamos')).toBe('Hola, vamos')
    expect(toSpeakable('👩‍👧 Familia 🇪🇸')).toBe('Familia')
    expect(toSpeakable('Doble → 14 → 28')).toBe('Doble, catorce, veintiocho')
    expect(toSpeakable('⭐⭐⭐')).toBe('')
  })

  it('handles units, ranges and ordinals', () => {
    expect(toSpeakable('2,5 kg y 5 €')).toBe('dos coma cinco kilos y cinco euros')
    expect(toSpeakable('1 €')).toBe('un euro')
    expect(toSpeakable('100 %')).toBe('cien por ciento')
    expect(toSpeakable('Sumas de 3-4 cifras')).toBe('Sumas de tres a cuatro cifras')
    expect(toSpeakable('3º de Primaria')).toBe('tercero de Primaria')
    expect(toSpeakable('Eres la 1º')).toBe('Eres la primera')
    expect(toSpeakable('Vas el 2º')).toBe('Vas el segundo')
  })

  it('keeps Spanish punctuation that drives intonation', () => {
    expect(toSpeakable('¡Siete por siete, cuarenta y nueve, y el arcoíris llueve!')).toBe('¡Siete por siete, cuarenta y nueve, y el arcoíris llueve!')
    expect(toSpeakable('¿Me ayudas?')).toBe('¿Me ayudas?')
  })
})

describe('chunkForSpeech', () => {
  it('keeps short text whole', () => {
    expect(chunkForSpeech('Hola. ¿Qué tal?')).toEqual(['Hola. ¿Qué tal?'])
  })

  it('splits long text at sentence boundaries, then commas', () => {
    const long = Array.from({ length: 10 }, (_, i) => `Frase número ${i} con algunas palabras más.`).join(' ')
    const chunks = chunkForSpeech(long, 120)
    expect(chunks.length).toBeGreaterThan(2)
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(120)
      expect(c).toMatch(/\.$/)
    }
    const commas = chunkForSpeech(`${'uno, '.repeat(60)}fin.`, 100)
    for (const c of commas) expect(c.length).toBeLessThanOrEqual(100)
    expect(commas.join(' ')).toBe(`${'uno, '.repeat(60)}fin.`)
  })
})
