/* Child-facing reaction phrases (companion / Lumi). Warm, short, Spanish (Spain). They praise effort and strategy
   rather than "being clever", and treat errors as clues (docs/PEDAGOGY.md). Phrases that mention {pet} in the
   third person are meant for Lumi: use pickPhraseFor('companion', …) to avoid the companion talking about itself. */
import type { ErrorType, ReactionKind, TemplateString } from '@/types'

export const PHRASES: Record<ReactionKind, TemplateString[]> = {
  correct: [
    '¡Bien hecho, {child}!',
    '¡Toma ya!',
    '¡Lo has clavado!',
    '¡Exacto! ¡Así se hace!',
    '¡Correcto! Se nota que lo has pensado.',
    '¡Sí! ¡Qué bien has usado el truco!',
    '¡Perfecto, {child}!',
    '¡Eso es! Paso a paso y con calma.',
    '¡Genial! Otro número vuelve a brillar en Numeria.',
    '¡Muy bien! Lo has hecho con mucho cuidado.',
    '¡Ahí está! Lo has encontrado tú {cg:solita|solito|sin ayuda}.',
    '¡Correctísimo! {pet} da saltos de alegría.',
    '¡Qué chulo! ¡Lo has resuelto!',
    '¡Bravo! Tu truco ha funcionado.',
  ],
  wrong: [
    '¡Uy, casi! Míralo otra vez con calma.',
    'No pasa nada. ¡Los errores son pistas!',
    '¡Casi lo tienes! Prueba otra vez.',
    'Hmm… algo se ha escapado. ¿Lo revisamos?',
    '¡Ánimo, {child}! Equivocarse también es aprender.',
    '¡Ese error es una pista! ¿Qué truco podemos usar?',
    'Respira hondo y vuelve a intentarlo. ¡Tú puedes!',
    '¡Por poquito! Mira bien cada número.',
    'Hasta Lumi se equivoca a veces. ¡Y así aprende!',
    '¡Sin prisa! Piénsalo otra vez, paso a paso.',
    '{pet} te guiña un ojo: ¡casi, casi!',
  ],
  streak: [
    '¡Racha mágica! ¡No hay quien te pare!',
    '¡Estás que te sales, {child}!',
    '¡Imparable!',
    '¡Qué racha! Tu magia brilla cada vez más.',
    '¡Una detrás de otra! ¡Qué concentración!',
    '¡Sigue así! {pet} no puede dejar de aplaudir.',
    '¡Estás en racha! Se nota que practicas.',
    '¡Otra más! ¡Vas como un cohete!',
    '¡Increíble! ¡Llevas un montón seguidas!',
    '¡Qué ritmo! Los números te hacen caso.',
    '¡Chispas mágicas! ¡Sigue, sigue!',
  ],
  hint: [
    '¡Buena idea pedir una pista!',
    'Pedir ayuda es de valientes. ¡Mira esta pista!',
    'Aquí tienes un truco de Lumi.',
    '¡Vamos a pensarlo paso a paso!',
    'Una pista mágica para ti, {child}.',
    'Mira bien… ¡la pista te ayuda!',
    '¿Recuerdas el truco? ¡Aquí lo tienes!',
    'Hasta Lumi usa pistas a veces.',
    'Piensa en lo que ya sabes. ¡Esta pista te lo recuerda!',
    'Poco a poco. Primero, esta pista.',
  ],
  thinking: [
    'Tómate tu tiempo. ¡Sin prisa!',
    'Hmm… ¿qué truco usamos aquí?',
    'Piensa con calma. ¡Tú puedes!',
    '{pet} también se ha puesto a pensar…',
    '¿Te ayuda el espejo?',
    'Despacito y con buena letra.',
    'Las buenas ideas a veces tardan un poquito.',
    'Respira… y piensa en lo que ya sabes.',
    '¿Quieres una pista? ¡Solo tienes que pedirla!',
    'Cuenta en tu cabeza, paso a paso.',
    '¡Qué bien te concentras, {child}!',
  ],
  celebrate: [
    '¡Lo has conseguido, {child}!',
    '¡Fiesta en Numeria! ¡Qué bien lo has hecho!',
    '¡Hurra! ¡Todo tu esfuerzo ha valido la pena!',
    '¡Eres {cg:una campeona|un campeón|pura magia}!',
    '¡Bravo! {pet} está dando volteretas de alegría.',
    '¡Qué trabajo tan bonito! Se nota que te has esforzado.',
    '¡Magia de la buena! ¡Has practicado un montón!',
    '¡Increíble! ¡Lumi está muy orgullosa de ti!',
    '¡Toma ya! ¡Misión cumplida!',
    '¡Qué bien! Hoy has aprendido algo nuevo.',
    '¡Chócala, {child}! ¡Lo has hecho genial!',
    '¡Lo has trabajado mucho y se nota!',
  ],
  encourage: [
    '¡No te rindas, {child}! Cada intento cuenta.',
    'Los errores son pistas. ¡Seguimos!',
    '¡Ánimo! Lo estás intentando muy bien.',
    'Poco a poco se llega muy lejos.',
    'Respira hondo. ¡Vamos a por la siguiente!',
    '{pet} cree en ti. ¡Y yo también!',
    'Hoy estás aprendiendo algo nuevo. ¡Eso es lo importante!',
    '¡Tú puedes! Usa un truco que conozcas.',
    'Equivocarse es aprender. ¡Otra vez!',
    '¡Qué bien que sigas intentándolo!',
    'Cada vez te sale mejor. ¡Sigue así!',
    '¡Paso a paso! Ya verás como lo consigues.',
  ],
}

/** Clue-style phrases for a diagnosed error (used for 'wrong', 'hint' and 'encourage' when an errorType is given). */
export const ERROR_PHRASES: Partial<Record<ErrorType, TemplateString[]>> = {
  fact: [
    '¡Casi! Prueba con el truco de esa tabla.',
    '¿Te acuerdas del espejo? A lo mejor ya te sabes la otra.',
    'Elige un truco: el doble, el 5 y uno más… ¡y vuelve a probar!',
  ],
  'carry-forgot': [
    '¡Ojo con la mochila! ¿Has sumado la llevada?',
    'Se te ha escapado una llevada. ¡Escríbela pequeñita arriba!',
    'La mochila de la llevada se ha quedado atrás. ¡Súmala!',
  ],
  'carry-wrong': [
    'En cada casa solo cabe una cifra. ¡La otra salta a la vecina!',
    '¡Ojo! Si sale 10 o más, escribe las unidades y llévate una.',
  ],
  'borrow-forgot': [
    'Cuando la vecina presta, ¡se queda con uno menos!',
    '¿Has pedido ayuda a la vecina? Acuérdate de quitarle uno.',
  ],
  'smaller-from-larger': [
    'Arriba hay un número más pequeño: ¡pide ayuda a la vecina!',
    'Siempre es el de arriba menos el de abajo. ¡La vecina te presta una decena!',
  ],
  'zero-borrow': [
    '¡La trampa del cero! Si la vecina es un 0, pide a la siguiente casa.',
    'El cero no tiene nada que prestar. ¡Pregunta a la casa de al lado!',
  ],
  misaligned: [
    'Cada cifra en su casa: unidades debajo de unidades.',
    'Coloca los números empezando por la derecha. ¡Cada uno en su casa!',
  ],
  'remainder-too-big': [
    'El resto tiene que ser más pequeño que el divisor. ¡Cabe una vez más!',
    'Si sobra tanto, ¡todavía puedes repartir otra vuelta!',
  ],
  'quotient-off': [
    'Comprueba: cociente por divisor más resto… ¿da el dividendo?',
    'Busca en la tabla el número que más se acerca sin pasarse.',
  ],
  operation: [
    'Vuelve a leer la historia: ¿hay que juntar, quitar, repetir o repartir?',
    '¡Ojo con la operación! ¿Qué pasa en el problema?',
  ],
  incomplete: [
    '¡Te falta alguna casilla por rellenar!',
    'Casi está. ¡Completa las casillas vacías!',
  ],
  recognition: [
    '¡Uy! No he leído bien tu número. ¿Lo escribes otra vez?',
    'Perdona, ¡no he entendido tu letra! Escríbelo un poco más grande.',
  ],
}

const pickFrom = (list: TemplateString[], rng: () => number): TemplateString => {
  const r = rng()
  const i = Math.min(list.length - 1, Math.max(0, Math.floor((Number.isFinite(r) ? r : 0) * list.length)))
  return list[i]
}

/** Child-facing reaction phrases (companion / Lumi), picked by kind and optional error type. */
export function pickPhrase(kind: ReactionKind, rng: () => number, errorType?: ErrorType): TemplateString {
  const specific = errorType && (kind === 'wrong' || kind === 'hint' || kind === 'encourage') ? ERROR_PHRASES[errorType] : undefined
  if (specific && specific.length) return pickFrom(specific, rng)
  return pickFrom(PHRASES[kind] ?? PHRASES.encourage, rng)
}

/** Same as pickPhrase, but when the companion speaks it never picks a phrase that names {pet} in the third person. */
export function pickPhraseFor(speaker: 'companion' | 'lumi', kind: ReactionKind, rng: () => number, errorType?: ErrorType): TemplateString {
  if (speaker === 'lumi') return pickPhrase(kind, rng, errorType)
  const specific = errorType && (kind === 'wrong' || kind === 'hint' || kind === 'encourage') ? ERROR_PHRASES[errorType] : undefined
  const pool = (specific && specific.length ? specific : PHRASES[kind] ?? PHRASES.encourage).filter((p) => !p.includes('{pet}'))
  return pickFrom(pool.length ? pool : PHRASES.encourage, rng)
}
