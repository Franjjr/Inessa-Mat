/* The voice says what a teacher would say: numbers with spaces, hours, fractions, money, signs, agreement.
   Cases come from the audit of the maths module (voice findings V1 to V10 and V15). */
import { SAFE_TEXT } from '../../../api/tts'
import { toSpeakable } from '../speechText'

const cases: [string, string][] = [
  // V1: thousands written with a space
  ['2 475', 'dos mil cuatrocientos setenta y cinco'],
  ['2 475', 'dos mil cuatrocientos setenta y cinco'],
  ['2 475', 'dos mil cuatrocientos setenta y cinco'],
  ['2 475', 'dos mil cuatrocientos setenta y cinco'],
  ['el 1 000 se lee mil', 'el mil se lee mil'],
  ['2 kg = 2 000 g', 'dos kilos son dos mil gramos'],
  ['12 345 + 1 000', 'doce mil trescientos cuarenta y cinco más mil'],
  // V3: "un" only before a noun
  ['presta 1 a las unidades', 'presta uno a las unidades'],
  ['Por 1 es facilísimo', 'Por uno es facilísimo'],
  ['Por 21 es facilísimo', 'Por veintiuno es facilísimo'],
  ['de las 12 a la 1', 'de las doce a la una'],
  ['Desde 500 cuenta', 'Desde quinientos cuenta'],
  ['Hay 21 cristales', 'Hay veintiún cristales'],
  ['Tienes 1 estrella', 'Tienes una estrella'],
  ['Escribe 1 suma', 'Escribe una suma'],
  ['5 sumas', 'cinco sumas'],
  // V4: hours and ratios
  ['07:05', 'las siete y cinco'],
  ['a las 07:05', 'a las siete y cinco'],
  ['12:00', 'las doce en punto'],
  ['1:00', 'la una en punto'],
  ['18:45', 'las dieciocho cuarenta y cinco'],
  ['19:00', 'las diecinueve horas'],
  ['19:05', 'las diecinueve cero cinco'],
  ['00:30', 'las cero treinta'],
  ['12 : 3', 'doce entre tres'],
  // V5: fractions
  ['1/2', 'un medio'],
  ['1/3', 'un tercio'],
  ['3/4', 'tres cuartos'],
  ['5/6', 'cinco sextos'],
  ['1/12', 'un doceavo'],
  ['2/7 + 3/7 = ?', '¿dos séptimos más tres séptimos son…?'],
  ['1/2 kg', 'medio kilo'],
  ['3/4 l', 'tres cuartos de litro'],
  // V6: money
  ['2,50 €', 'dos euros con cincuenta céntimos'],
  ['0,50 €', 'cincuenta céntimos'],
  ['1,05 €', 'un euro con cinco céntimos'],
  ['1 €', 'un euro'],
  ['3,00 €', 'tres euros'],
  ['6,50 € + 3,50 € = 10 €', 'seis euros con cincuenta céntimos más tres euros con cincuenta céntimos son diez euros'],
  // V7: signs
  ['El signo > significa mayor que', 'El signo mayor que significa mayor que'],
  ['El signo < significa menor que', 'El signo menor que significa menor que'],
  ['El signo = significa igual', 'El signo igual significa igual'],
  ['5 > 3', 'cinco mayor que tres'],
  ['3 < 5', 'tres menor que cinco'],
  ['cociente × divisor + resto = dividendo', 'cociente por divisor más resto es igual a dividendo'],
  ['son 14 cm', 'son catorce centímetros'],
  ['3 cm + 4 cm = 7 cm', 'tres centímetros más cuatro centímetros son siete centímetros'],
  ['2 dm y 5 mm', 'dos decímetros y cinco milímetros'],
  ['3 m²', 'tres metros cuadrados'],
  ['5 ≠ 6', 'cinco distinto de seis'],
  // V8: arrows
  ['Pulsa →', 'Pulsa flecha a la derecha'],
  ['← vuelve', 'flecha a la izquierda vuelve'],
  ['Sube ↑', 'Sube flecha hacia arriba'],
  ['Baja ↓', 'Baja flecha hacia abajo'],
  ['→ → →', 'tres flechas a la derecha'],
  ['⬅️ ⬅️', 'dos flechas a la izquierda'],
  // V9: second equals of a chain
  ['2 × 8 = 8 + 8 = 16', 'dos por ocho son ocho más ocho, que son dieciséis'],
  ['2 × 8 = 8 + 8 = ?', '¿dos por ocho son ocho más ocho, que son…?'],
  // V10: gender
  ['522 margaritas', 'quinientas veintidós margaritas'],
  ['213 magdalenas', 'doscientas trece magdalenas'],
  ['201 días', 'doscientos un días'],
  ['101 problemas', 'ciento un problemas'],
  // V15: capitals
  ['RESTAR', 'restar'],
  ['Hoy toca RESTAR con ABN', 'Hoy toca restar con ABN'],
]

describe('voz natural', () => {
  it.each(cases)('%s → %s', (input, out) => {
    expect(toSpeakable(input)).toBe(out)
  })

  it('a feminine gender reaches the numbers that have no noun behind them', () => {
    expect(toSpeakable('Hay 200', 'es', { gender: 'f' })).toBe('Hay doscientas')
    expect(toSpeakable('Hay 200')).toBe('Hay doscientos')
  })

  it('English keeps its digits', () => {
    expect(toSpeakable('Seven 7', 'en')).toContain('7')
  })

  it('a comparison is not taken for an HTML tag', () => {
    expect(toSpeakable('3 < 5 y 7 > 2')).toBe('tres menor que cinco y siete mayor que dos')
  })

  it('nothing the voice service refuses is left after toSpeakable', () => {
    const texts = [
      '6 × 7 = 42', 'a > b y a < b', '¡Muy bien! → sigue ➡️ ⬅️ ⬆️ ⬇️', '2 475 + 1 000 = 3 475', '5 ≠ 6 y 6 ≥ 5 y 4 ≤ 9',
      '3 % de 200', 'Mira 3/4 y 7/12', 'cm² m² 2,5 m', '[enlace](http://x.es) <b>negrita</b>', 'Hora: 07:05 y 18:45',
      '≈ 30', 'A & B', '{child} ha hecho 5 · 3', '−5 °C', '"citas" «latinas» (paréntesis)', 'tab\tnueva\nlínea',
      '☆ ★ ✓ ✗ • ◆', '7 – 3', '1,5 € + 2,25 €', '👍 ¡Genial! 🎉',
    ]
    for (const t of texts) {
      const out = toSpeakable(t)
      expect(SAFE_TEXT.test(out) || out === '', `${t} → ${out}`).toBe(true)
      expect(out, t).not.toMatch(/[×÷=<>+]/)
    }
  })
})
