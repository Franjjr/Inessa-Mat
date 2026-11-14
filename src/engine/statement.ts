/* What an exercise says to the child, written to be read aloud: «¿Cuánto es 6 × 7?», «Resta en columna: 352 − 127.».
   One sentence or two, in a teacher's words for a 7-8-year-old. It may carry digits and signs: the voice turns them into
   words (src/audio/speechText.ts). Used by the «Escuchar» button of every exercise (src/activities/shared/ListenButton.tsx). */
import { numberToSpanish } from '@/audio/spanishNumbers'
import { decimalWords } from './decimals'
import { ordinalWord } from './ordinals'
import { FALLBACK_CHILD_NAME, renderTemplate, type TemplateContext } from '@/content/template'
import type { Exercise, ClockTime } from '@/types'

/** Names for the templates ({child}, {pet}) when the caller has no profile. */
const DEFAULT_CONTEXT: TemplateContext = {
  childName: FALLBACK_CHILD_NAME, childGender: 'm', petName: 'Bigotes', petGender: 'm', petSpecies: 'cat',
}

const SIGN = { add: '+', sub: '−', mul: '×', div: '÷' } as const

/** 1234 → «1 234»; the voice joins the groups again. */
const fmt = (n: number): string => String(Math.trunc(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

/** Céntimos → «3,40 €». */
function euros(cents: number): string {
  const e = Math.floor(cents / 100)
  const c = cents % 100
  return c === 0 ? `${e} €` : `${e},${String(c).padStart(2, '0')} €`
}

/** Hundredths → «0,45» (places 2) or «0,4» (places 1, value in hundredths too). */
function decimal(hundredths: number, places: 1 | 2): string {
  const value = hundredths / 100
  return value.toFixed(places).replace('.', ',')
}

const digital = (t: ClockTime): string => `${t.hour}:${String(t.minute).padStart(2, '0')}`

/** A sentence closed with its sign: texts that already end in ? ! or . stay as they are. */
function sentence(text: string): string {
  const t = text.trim()
  return /[.!?…:]$/.test(t) ? t : `${t}.`
}

/** Unit abbreviations of the measure exercises, said in full. */
const UNIT_NAME: Record<string, string> = {
  km: 'kilómetros', hm: 'hectómetros', dam: 'decámetros', m: 'metros', dm: 'decímetros', cm: 'centímetros', mm: 'milímetros',
  kg: 'kilos', g: 'gramos', mg: 'miligramos', t: 'toneladas', kl: 'kilolitros', l: 'litros', dl: 'decilitros', cl: 'centilitros', ml: 'mililitros',
}

const ROUND_PLACE: Record<number, string> = { 10: 'las decenas', 100: 'las centenas', 1000: 'los millares' }

/** The sentence to read for an exercise. Never empty. `ctx` fills {child} and {pet} in the stories. */
export function statementFor(ex: Exercise, ctx: TemplateContext = DEFAULT_CONTEXT): string {
  const story = (t: string) => sentence(renderTemplate(t, ctx))
  switch (ex.kind) {
    case 'fact-mul': return `¿Cuánto es ${ex.a} × ${ex.b}?`
    case 'fact-div': return `¿Cuánto es ${ex.dividend} ÷ ${ex.divisor}?`
    case 'missing-factor':
      return ex.missing === 'b'
        ? `¿Por qué número hay que multiplicar el ${ex.a} para llegar a ${ex.product}?`
        : `¿Qué número, multiplicado por ${ex.b}, da ${ex.product}?`
    case 'skip-count': {
      const shown = ex.values.map((v, i) => (ex.hiddenIndexes.includes(i) ? 'un hueco' : String(v))).join(', ')
      return `Cuenta de ${ex.step} en ${ex.step}. Escribe los números que faltan: ${shown}.`
    }
    case 'groups': return `Hay ${ex.groups} grupos de ${ex.perGroup}. ¿Cuántos hay en total?`
    case 'array': return `Hay ${ex.rows} filas y ${ex.cols} columnas. ¿Cuántos hay en total?`
    case 'double-chain': return `Empieza en ${ex.start} y haz el doble, ${ex.steps} veces. Escribe cada resultado.`
    case 'fact-family':
      return `Con los números ${ex.a}, ${ex.b} y ${ex.product}, escribe las cuatro operaciones de la familia: dos de multiplicar y dos de dividir.`
    case 'column-add': return `Suma en columna: ${ex.operands.map(fmt).join(' + ')}.`
    case 'column-sub': return `Resta en columna: ${fmt(ex.minuend)} − ${fmt(ex.subtrahend)}.`
    case 'column-mul': return `Multiplica en columna: ${fmt(ex.top)} × ${fmt(ex.bottom)}.`
    case 'division':
      return ex.variant === 'exact'
        ? `Divide ${fmt(ex.dividend)} entre ${ex.divisor}. Escribe el cociente.`
        : `Divide ${fmt(ex.dividend)} entre ${ex.divisor}. Escribe el cociente y el resto.`
    case 'word-problem': return story(ex.text)
    case 'bar-problem': return story(ex.text)
    case 'error-hunt':
      return `Dani ha hecho esta cuenta: ${fmt(ex.top)} ${SIGN[ex.op]} ${fmt(ex.bottom)} = ${fmt(ex.shown)}. ¿Está bien hecha? Si tiene un error, tócalo.`
    case 'check-calc': {
      const rest = ex.remainder ? ` y sobra${ex.remainder === 1 ? '' : 'n'} ${ex.remainder}` : ''
      return `Dani dice que ${fmt(ex.left)} ${SIGN[ex.op]} ${fmt(ex.right)} = ${fmt(ex.claimed)}${rest}. Escribe la cuenta para comprobarlo y di si está bien.`
    }
    case 'place-value':
      if (ex.mode === 'blocks') return 'Cuenta los bloques y escribe el número.'
      if (ex.mode === 'expanded') return `Descompón el número ${fmt(ex.value)}: cuántos millares, centenas, decenas y unidades tiene.`
      return `Escribe con cifras este número: ${numberToSpanish(ex.value)}.`
    case 'compare': return `¿Qué signo va entre ${fmt(ex.left)} y ${fmt(ex.right)}? Elige mayor que, menor que o igual.`
    case 'order':
      return `Ordena estos números de ${ex.direction === 'asc' ? 'menor a mayor' : 'mayor a menor'}: ${ex.values.map(fmt).join(', ')}.`
    case 'round': return `Redondea ${fmt(ex.value)} a ${ROUND_PLACE[ex.to]}.`
    case 'number-line':
      return ex.mode === 'tick'
        ? 'Mira la recta numérica. ¿Qué número falta en la marca vacía?'
        : `Empieza en ${fmt(ex.start ?? 0)} y salta ${ex.jump > 0 ? 'hacia delante' : 'hacia atrás'} ${fmt(ex.step)}. ¿En qué número caes?`
    case 'mental': return ex.prompt ? sentence(ex.prompt) : 'Calcula de cabeza y escribe el resultado.'
    case 'equation': {
      const side = (terms: (number | '+' | '−' | null)[]) => terms.map((t) => (t === null ? 'un hueco' : String(t))).join(' ')
      return ex.mode === 'same'
        ? `¿Dan lo mismo estas dos cuentas, ${side(ex.left)} y ${side(ex.right)}? Elige igual o distinto.`
        : `Busca el número que cabe en el hueco: ${side(ex.left)} es igual a ${side(ex.right)}.`
    }
    case 'clock-read': return ex.mode === 'phrase' ? 'Mira el reloj. ¿Qué hora es? Elige la frase.' : 'Mira el reloj. ¿Qué hora es? Escribe la hora y los minutos.'
    case 'clock-set': return `Pon las agujas del reloj a ${ex.prompt}.`
    case 'time-convert':
      return ex.direction === 'to-digital'
        ? `Escribe con números, como en un reloj digital: ${ex.phrase}.`
        : `En un reloj digital pone ${digital(ex.answer)}. ¿Qué frase es? Elige una.`
    case 'time-duration':
      return ex.ask === 'end'
        ? `Empieza a las ${digital(ex.start)} y dura ${ex.duration} minutos. ¿A qué hora termina?`
        : `Empieza a las ${digital(ex.start)} y termina a las ${digital(ex.end)}. ¿Cuántos minutos pasan?`
    case 'calendar': return sentence(ex.prompt)
    case 'fraction-shade': return `Colorea ${ex.numerator}/${ex.denominator} de la figura.`
    case 'fraction-read': return '¿Qué fracción está coloreada? Escribe el numerador arriba y el denominador abajo.'
    case 'fraction-of':
      return ex.story ? story(ex.story) : `Calcula ${ex.numerator}/${ex.denominator} de ${fmt(ex.total)}.`
    case 'fraction-equal': return 'Toca las figuras que no están partidas en partes iguales.'
    case 'shape-choice': return sentence(renderTemplate(ex.question, ctx))
    case 'angle-tap': return 'Toca las esquinas que son ángulos rectos. Puede que no haya ninguna.'
    case 'perimeter':
      return ex.mode === 'story' && ex.text ? story(ex.text) : 'Calcula el perímetro: suma todos los lados de la figura.'
    case 'shape-count': return `¿Cuántos ${ex.ask === 'sides' ? 'lados' : 'vértices'} tiene esta figura?`
    case 'money':
      switch (ex.mode) {
        case 'recognise': return '¿Cuánto vale esta moneda o este billete?'
        case 'pay': return `Paga ${euros(ex.price)} justos con monedas y billetes.`
        case 'change': return story(ex.text)
        case 'add': return ex.story ? story(ex.text) : 'Suma los precios. ¿Cuánto cuesta todo?'
        case 'compare': return ex.question === 'more' ? '¿Cuál cuesta más?' : '¿Cuál cuesta menos?'
        case 'convert':
          return ex.direction === 'to-cents'
            ? 'Cambia estos euros a céntimos y escribe cuántos céntimos son.'
            : 'Cambia estos céntimos a euros y céntimos, y escríbelos.'
        case 'budget': return `${sentence(ex.text)} ${sentence(ex.question)}`
      }
      break
    case 'measure':
      switch (ex.mode) {
        case 'unit': return `¿Con qué unidad se mide ${ex.object}?`
        case 'convert': return `Cambia ${ex.given} a ${UNIT_NAME[ex.unit] ?? ex.unit}.`
        case 'ruler': return 'Mira la regla. ¿Cuántos centímetros mide el objeto? Fíjate en dónde empieza.'
        case 'add': return story(ex.text)
        case 'estimate': return `¿Tiene sentido esto? ${sentence(ex.claim)}`
      }
      break
    case 'chart': return sentence(ex.question)
    case 'chance': return sentence(ex.question)
    case 'pattern':
      if (ex.mode === 'shapes') return 'Mira la serie. ¿Qué figura viene después?'
      if (ex.mode === 'numbers') return 'Mira la serie de números. ¿Qué número falta?'
      return ex.position === null ? 'Mira la serie de números. ¿Qué número va más adelante?' : `Mira la serie de números. ¿Qué número va en el lugar ${ex.position}?`
    case 'position': return sentence(ex.question)
    case 'mul-parts':
      return `Multiplica ${ex.top} × ${ex.bottom} por partes: primero ${ex.top} × ${ex.units}, luego ${ex.top} × ${ex.tens}, y suma los dos resultados.`
    case 'area': return 'Cuenta los cuadraditos que ocupa la figura. ¿Cuánto mide su área?'
    case 'fraction-add':
      return `Calcula ${ex.a}/${ex.denominator} ${SIGN[ex.op]} ${ex.b}/${ex.denominator}. Escribe el numerador y el denominador del resultado.`
    case 'long-mul': return `Multiplica en columna: ${fmt(ex.top)} × ${fmt(ex.bottom)}. Escribe cada fila y el total.`
    case 'ordinal':
      if (ex.mode === 'row') return `Toca el ${ex.n}.º de la fila.`
      // The numeral is on the screen: saying it (or its word) would give the answer away.
      if (ex.mode === 'read') return 'Mira el número con la o pequeña. ¿Cómo se dice? Elige la palabra.'
      return `¿Qué número es el ${ordinalWord(ex.n)}? Elígelo.`
    case 'decimal':
      switch (ex.mode) {
        case 'shade': return 'Mira lo que está coloreado. ¿Qué número decimal es? Escríbelo.'
        case 'read': return `Escribe con cifras: ${decimalWords(ex)}.`
        case 'compare': return `¿Qué signo va entre ${decimal(ex.value, ex.places)} y ${decimal(ex.other ?? 0, ex.places)}? Elige mayor que, menor que o igual.`
        case 'money': return 'Mira la cantidad. ¿Cuántos euros y cuántos céntimos son? Escríbelos.'
      }
      break
    case 'decimal-op':
      return `${ex.op === 'add' ? 'Suma' : 'Resta'} en columna, con la coma debajo de la coma: ${decimal(ex.left, ex.places)} ${SIGN[ex.op]} ${decimal(ex.right, ex.places)}.`
    // Lengua
    case 'lng-tap-words': {
      const what = { sustantivo: 'los sustantivos', adjetivo: 'los adjetivos', verbo: 'los verbos', articulo: 'los artículos' }[ex.wanted]
      return `Toca ${what} de la frase: ${ex.words.join(' ')}.`
    }
    case 'lng-sentence-parts': return `Toca el ${ex.part} de la frase: ${ex.words.join(' ')}.`
    case 'lng-classify': return sentence(ex.question)
    case 'lng-transform': return `Escribe la palabra ${ex.word} cambiada: ${ex.change === 'femenino' ? 'en femenino' : ex.change === 'plural' ? 'en plural' : ex.change === 'singular' ? 'en singular' : `en ${ex.change}`}.`
    case 'lng-missing-letter': return 'Falta una letra. Completa la palabra.'
    case 'lng-punctuation': return `Escribe la frase con sus signos: ${ex.bare}`
    case 'lng-stress': return `Toca la sílaba que se dice más fuerte: ${ex.syllables.join(', ')}.`
    case 'lng-syllables': return ex.mode === 'count' ? `¿Cuántas sílabas tiene ${ex.word}?` : `¿Cómo se separa ${ex.word} en sílabas?`
    case 'lng-dictation': return 'Escucha con atención y escribe lo que oyes.'
    case 'lng-alphabet': return ex.mode === 'first' ? 'Toca la palabra que va antes en el diccionario.' : 'Ordena las palabras por el abecedario.'
    case 'lng-pair-words': return sentence(ex.question)
    case 'lng-read-choice': return sentence(ex.question)
    case 'lng-read-text': return sentence(ex.question)
    case 'lng-read-order': return sentence(ex.question)
    case 'lng-copy': return `Copia esta frase con el teclado: ${ex.answer}`
    case 'lng-guided': return sentence(ex.task)
    // Inglés
    case 'eng-listen-pick': return 'Escucha la palabra en inglés y toca su tarjeta.'
    case 'eng-match': return 'Une cada palabra en inglés con su dibujo.'
    case 'eng-write-word': return 'Escribe en inglés la palabra del dibujo.'
    case 'eng-complete': return 'Elige la palabra que completa la frase.'
    case 'eng-num-write': return 'Escribe este número en inglés.'
    case 'eng-num-listen': return 'Escucha el número en inglés y escríbelo con cifras.'
    case 'eng-op-listen': return 'Escucha la operación en inglés y escribe el resultado.'
    case 'eng-memory': return 'Encuentra las parejas de dibujo y palabra.'
    case 'eng-scramble': return 'Ordena las letras y escribe la palabra del dibujo.'
    case 'eng-speak': return 'Ahora dilo tú: di la palabra en voz alta.'
  }
  return 'Mira el ejercicio y escribe tu respuesta.'
}
