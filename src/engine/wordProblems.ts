/* Bank of Spanish story-problem templates featuring the Numeria cast. {a} and {b} are filled by the engine with
   numbers; {child} and {pet} stay as template placeholders for content/renderTemplate.
   Conventions per operation:
     add  {a} + {b}
     sub  {a} − {b}  ({a} is always the larger number)
     mul  {a} groups of {b}  ({a} is a single digit; {b} may be 2-digit in 2×1 problems)
     div  {a} ÷ {b}  ({a} dividend, {b} divisor)
   Also the «¿tiene sentido?» problems (word:sense, 4.º): a story with a proposed answer that the child judges (genWordSense). */
import type { Answer, CheckResult, Rng, ShapeChoiceExercise } from '@/types'
import { pick, randInt, shuffle } from './rng'
import { WORD_SENSE_SKILL, type WordOp } from './skills'

export interface WordTemplate {
  id: string
  op: WordOp
  text: string
  /** Unit word for the answer line (plural). */
  unit: string
  /** Operand sizes (digits of the largest operand) that read naturally in this story. */
  minDigits: number
  maxDigits: number
  /** Story-fixed {b} (6 legs of a ladybug, 8 tentacles, 7 days a week, 4 wheels...). */
  fixed?: number
  /** «Datos» of the notebook: the child-facing name of {a} and of {b} («Quiere colgar», «Ya ha colgado»). */
  data: [string, string]
  /** The solution as a sentence, {n} the result: «Le faltan {n} banderines por colgar.» */
  say: string
}

export const WORD_TEMPLATES: WordTemplate[] = [
  // ---------------------------------------------------------------- add
  { id: 'add-peces', data: ['Peces dorados', 'Peces azules'], say: 'Hay {n} peces en total.', op: 'add', unit: 'peces', minDigits: 2, maxDigits: 4,
    text: 'En el río nadan {a} peces dorados y {b} peces azules. ¿Cuántos peces hay en total?' },
  { id: 'add-nenufares', data: ['Por la mañana', 'Por la tarde'], say: 'Ha contado {n} nenúfares en total.', op: 'add', unit: 'nenúfares', minDigits: 2, maxDigits: 3,
    text: 'La Rana Saltarina ha contado {a} nenúfares por la mañana y {b} por la tarde. ¿Cuántos nenúfares ha contado en total?' },
  { id: 'add-estrellas', data: ['El lunes', 'El martes'], say: 'Ha encendido {n} estrellas en los dos días.', op: 'add', unit: 'estrellas', minDigits: 2, maxDigits: 4,
    text: 'Lumi ha encendido {a} estrellas el lunes y {b} estrellas el martes. ¿Cuántas estrellas ha encendido en los dos días?' },
  { id: 'add-conchas', data: ['{child} encuentra', '{pet} encuentra'], say: 'Tienen {n} conchas entre los dos.', op: 'add', unit: 'conchas', minDigits: 2, maxDigits: 3,
    text: '{child} y {pet} recogen conchas en la orilla del lago. {child} encuentra {a} y {pet} encuentra {b}. ¿Cuántas conchas tienen entre los dos?' },
  { id: 'add-libros', data: ['Libros que hay', 'Le regalan'], say: 'Ahora tiene {n} libros.', op: 'add', unit: 'libros', minDigits: 2, maxDigits: 4,
    text: 'En la biblioteca del Búho Sabio hay {a} libros. Hoy le regalan {b} libros más. ¿Cuántos libros tiene ahora?' },
  { id: 'add-herraduras', data: ['El año pasado', 'Este año'], say: 'Ha forjado {n} herraduras en total.', op: 'add', unit: 'herraduras', minDigits: 3, maxDigits: 4,
    text: 'La dragona Chispa forjó {a} herraduras el año pasado y {b} este año. ¿Cuántas herraduras ha forjado en total?' },
  { id: 'add-margaritas', data: ['Margaritas rojas', 'Margaritas amarillas'], say: 'Hay {n} margaritas.', op: 'add', unit: 'margaritas', minDigits: 2, maxDigits: 4,
    text: 'En el Jardín del Arcoíris han florecido {a} margaritas rojas y {b} margaritas amarillas. ¿Cuántas margaritas hay?' },
  { id: 'add-borron', data: ['Primero escondió', 'Después escondió'], say: 'Ha escondido {n} números en total.', op: 'add', unit: 'números', minDigits: 2, maxDigits: 3,
    text: 'Borrón escondió {a} números en la niebla y después escondió {b} más. ¿Cuántos números ha escondido en total?' },
  // ---------------------------------------------------------------- sub
  { id: 'sub-tazas', data: ['Tenía', 'Ha vendido'], say: 'Le quedan {n} tazas.', op: 'sub', unit: 'tazas', minDigits: 3, maxDigits: 4,
    text: 'La osa Nieve tenía {a} tazas de chocolate y ha vendido {b}. ¿Cuántas tazas le quedan?' },
  { id: 'sub-copos', data: ['Había', 'El sol ha derretido'], say: 'Quedan {n} copos.', op: 'sub', unit: 'copos', minDigits: 2, maxDigits: 4,
    text: 'En la cima de la montaña había {a} copos de nieve. El sol ha derretido {b}. ¿Cuántos copos quedan?' },
  { id: 'sub-luces', data: ['Brillan', 'Apaga'], say: 'Siguen encendidas {n} luces.', op: 'sub', unit: 'luces', minDigits: 2, maxDigits: 3,
    text: 'En el castillo brillan {a} luces. Borrón sopla y apaga {b}. ¿Cuántas luces siguen encendidas?' },
  { id: 'sub-perlas', data: ['Tiene', 'Regala'], say: 'Le quedan {n} perlas.', op: 'sub', unit: 'perlas', minDigits: 2, maxDigits: 3,
    text: 'El pulpo Octavio tiene {a} perlas y regala {b} a sus amigos. ¿Cuántas perlas le quedan?' },
  { id: 'sub-saltos', data: ['Saltos de la Rana', 'Saltos de {pet}'], say: 'La Rana ha dado {n} saltos más.', op: 'sub', unit: 'saltos', minDigits: 2, maxDigits: 3,
    text: 'La Rana Saltarina ha dado {a} saltos y {pet} ha dado {b}. ¿Cuántos saltos más ha dado la Rana?' },
  { id: 'sub-banderines', data: ['Quiere colgar', 'Ya ha colgado'], say: 'Le faltan {n} banderines por colgar.', op: 'sub', unit: 'banderines', minDigits: 2, maxDigits: 3,
    text: 'La Reina Aurora quiere colgar {a} banderines en el castillo. Ya ha colgado {b}. ¿Cuántos le faltan por colgar?' },
  { id: 'sub-paginas', data: ['Páginas del libro', 'Ya ha leído'], say: 'Le quedan {n} páginas por leer.', op: 'sub', unit: 'páginas', minDigits: 2, maxDigits: 3,
    text: '{child} lee un libro de magia de {a} páginas. Ya ha leído {b}. ¿Cuántas páginas le quedan por leer?' },
  { id: 'sub-pasos', data: ['Hay que andar', 'Ya han andado'], say: 'Les faltan {n} pasos.', op: 'sub', unit: 'pasos', minDigits: 3, maxDigits: 4,
    text: 'Para llegar a la Forja del Dragón hay que andar {a} pasos. {child} y {pet} ya han andado {b}. ¿Cuántos pasos les faltan?' },
  // ---------------------------------------------------------------- mul
  { id: 'mul-mariquitas', data: ['Mariquitas', 'Patas de cada mariquita'], say: 'Hay {n} patas en la pista.', op: 'mul', unit: 'patas', minDigits: 1, maxDigits: 1, fixed: 6,
    text: 'En la pista de baile de la cueva hay {a} mariquitas. Cada mariquita tiene {b} patas. ¿Cuántas patas hay en la pista?' },
  { id: 'mul-pulpos', data: ['Pulpos', 'Tentáculos de cada pulpo'], say: 'Hay {n} tentáculos en la salida.', op: 'mul', unit: 'tentáculos', minDigits: 1, maxDigits: 1, fixed: 8,
    text: 'En la salida de la carrera del lago hay {a} pulpos. Cada pulpo tiene {b} tentáculos. ¿Cuántos tentáculos hay en la salida?' },
  { id: 'mul-arcoiris', data: ['Arcoíris', 'Colores de cada arcoíris'], say: 'Pinta {n} franjas de color.', op: 'mul', unit: 'franjas', minDigits: 1, maxDigits: 1, fixed: 7,
    text: 'El Hada Iris pinta {a} arcoíris. Cada arcoíris tiene {b} colores. ¿Cuántas franjas de color pinta en total?' },
  { id: 'mul-semanas', data: ['Semanas de excursión', 'Días de una semana'], say: 'La excursión dura {n} días.', op: 'mul', unit: 'días', minDigits: 1, maxDigits: 1, fixed: 7,
    text: 'Una semana tiene {b} días. {pet} se va de excursión {a} semanas. ¿Cuántos días dura la excursión?' },
  { id: 'mul-ruedas', data: ['Carrozas', 'Ruedas de cada carroza'], say: 'Hay {n} ruedas.', op: 'mul', unit: 'ruedas', minDigits: 1, maxDigits: 1, fixed: 4,
    text: 'Delante del castillo hay {a} carrozas. Cada carroza tiene {b} ruedas. ¿Cuántas ruedas hay?' },
  { id: 'mul-setas', data: ['Cestas', 'Setas en cada cesta'], say: 'Hay {n} setas en total.', op: 'mul', unit: 'setas', minDigits: 1, maxDigits: 1,
    text: '{pet} ha encontrado {a} cestas con {b} setas en cada una. ¿Cuántas setas hay en total?' },
  { id: 'mul-flores', data: ['Filas', 'Flores en cada fila'], say: 'Planta {n} flores.', op: 'mul', unit: 'flores', minDigits: 1, maxDigits: 2,
    text: 'Lumi planta {a} filas de flores con {b} flores en cada fila. ¿Cuántas flores planta?' },
  { id: 'mul-escudos', data: ['Escudos', 'Piedras de cada escudo'], say: 'Necesita {n} piedras.', op: 'mul', unit: 'piedras', minDigits: 1, maxDigits: 2,
    text: 'La dragona Chispa fabrica {a} escudos. Cada escudo lleva {b} piedras brillantes. ¿Cuántas piedras necesita?' },
  { id: 'mul-gemas', data: ['Cajas', 'Gemas en cada caja'], say: 'Son {n} gemas en total.', op: 'mul', unit: 'gemas', minDigits: 2, maxDigits: 2,
    text: 'Chispa necesita {a} cajas con {b} gemas cada una. ¿Cuántas gemas son en total?' },
  { id: 'mul-cromos', data: ['Sobres', 'Cromos en cada sobre'], say: 'Tiene {n} cromos.', op: 'mul', unit: 'cromos', minDigits: 1, maxDigits: 2,
    text: '{child} tiene {a} sobres de cromos mágicos. En cada sobre hay {b} cromos. ¿Cuántos cromos tiene?' },
  // ---------------------------------------------------------------- div
  { id: 'div-hadas', data: ['Estrellas que reparte', 'Hadas'], say: 'Cada hada recibe {n} estrellas.', op: 'div', unit: 'estrellas', minDigits: 1, maxDigits: 2,
    text: 'La Reina Aurora reparte {a} estrellas entre {b} hadas, las mismas para cada una. ¿Cuántas estrellas recibe cada hada?' },
  { id: 'div-torres', data: ['Estrellas que tiene', 'Torres'], say: 'Pondrá {n} estrellas en cada torre.', op: 'div', unit: 'estrellas', minDigits: 2, maxDigits: 2,
    text: 'La reina tiene {a} estrellas y quiere repartirlas por igual entre las {b} torres del castillo. ¿Cuántas estrellas pondrá en cada torre?' },
  { id: 'div-mariquitas', data: ['Patas que se ven', 'Patas de cada mariquita'], say: 'Hay {n} mariquitas.', op: 'div', unit: 'mariquitas', minDigits: 1, maxDigits: 2, fixed: 6,
    text: 'En la cueva se ven {a} patas de mariquita. Cada mariquita tiene {b} patas. ¿Cuántas mariquitas hay?' },
  { id: 'div-pulpos', data: ['Tentáculos que cuenta', 'Tentáculos de cada pulpo'], say: 'Hay {n} pulpos.', op: 'div', unit: 'pulpos', minDigits: 1, maxDigits: 2, fixed: 8,
    text: 'Octavio cuenta {a} tentáculos en el agua. Cada pulpo tiene {b} tentáculos. ¿Cuántos pulpos hay?' },
  { id: 'div-semanas', data: ['Días que faltan', 'Días de una semana'], say: 'Faltan {n} semanas.', op: 'div', unit: 'semanas', minDigits: 1, maxDigits: 2, fixed: 7,
    text: 'Faltan {a} días para la gran fiesta de Numeria. Una semana tiene {b} días. ¿Cuántas semanas faltan?' },
  { id: 'div-conchas', data: ['Conchas', 'Conchas en cada bolsa'], say: 'Llena {n} bolsas.', op: 'div', unit: 'bolsas', minDigits: 1, maxDigits: 2,
    text: 'El pulpo Octavio guarda {a} conchas en bolsas de {b} conchas. ¿Cuántas bolsas llena?' },
  { id: 'div-galletas', data: ['Galletas', 'Amigos'], say: 'A cada uno le tocan {n} galletas.', op: 'div', unit: 'galletas', minDigits: 1, maxDigits: 2,
    text: '{child} reparte {a} galletas entre {b} amigos, a partes iguales. ¿Cuántas galletas le tocan a cada uno?' },
  { id: 'div-libros', data: ['Libros', 'Estanterías'], say: 'Pone {n} libros en cada estantería.', op: 'div', unit: 'libros', minDigits: 1, maxDigits: 2,
    text: 'El Búho Sabio coloca {a} libros en {b} estanterías, los mismos en cada una. ¿Cuántos libros pone en cada estantería?' },
  { id: 'div-chuches', data: ['Chuches', 'Montones'], say: 'Hay {n} chuches en cada montón.', op: 'div', unit: 'chuches', minDigits: 1, maxDigits: 2,
    text: '{pet} tiene {a} chuches y hace {b} montones iguales. ¿Cuántas chuches hay en cada montón?' },
]

export function templatesFor(op: WordOp, digits: number, fixedAllowed: (n: number) => boolean): WordTemplate[] {
  return WORD_TEMPLATES.filter((t) =>
    t.op === op && digits >= t.minDigits && digits <= t.maxDigits && (t.fixed === undefined || fixedAllowed(t.fixed)))
}

export function fillTemplate(text: string, a: number, b: number): string {
  return text.replace(/\{a\}/g, String(a)).replace(/\{b\}/g, String(b))
}

export function getWordTemplate(id: string): WordTemplate | undefined {
  return WORD_TEMPLATES.find((t) => t.id === id)
}

/** One «dato» of the story: its name and its number. */
export interface WordDatum { label: string; value: number }

/** The notebook of a story problem: its «Datos» (in the order the story tells them), its question, and the solution
    sentence. Null for a story that is not from the bank (no names for its numbers). */
export interface WordNotebook {
  data: [WordDatum, WordDatum]
  question: string
  /** «Le faltan 28 banderines por colgar.»; with a remainder, «… y sobran 2.». */
  sentence: (n: number, rest?: number) => string
  /** The sentence around the result box: [«Le faltan», «banderines por colgar.»]. */
  parts: [string, string]
}

export function wordNotebook(ex: { id: string; text: string; operands: [number, number] }): WordNotebook | null {
  // Ids of the bank: word-problem:<template>:<a>,<b>
  const t = getWordTemplate(ex.id.split(':')[1] ?? '')
  if (!t) return null
  const [a, b] = ex.operands
  const first: WordDatum = { label: t.data[0], value: a }
  const second: WordDatum = { label: t.data[1], value: b }
  // The order of the story: «Una semana tiene {b} días. … {a} semanas» tells {b} first.
  const bFirst = t.text.indexOf('{b}') < t.text.indexOf('{a}')
  const question = (ex.text.match(/¿[^¿?]*\?/g) ?? []).at(-1) ?? ''
  return {
    data: bFirst ? [second, first] : [first, second],
    question,
    sentence: (n, rest) => {
      const base = t.say.replace('{n}', String(n))
      return rest ? `${base.replace(/\.$/, '')} y sobran ${rest}.` : base
    },
    parts: [t.say.split('{n}')[0].trim(), (t.say.split('{n}')[1] ?? '').trim()],
  }
}

// ---------------------------------------------------------------- ¿tiene sentido? (word:sense, 4.º)

/** The stories of word:sense: the bank's stories without a placeholder (the question is shown as text, not rendered). */
const SENSE_STORIES = WORD_TEMPLATES.filter((t) => !/\{(child|pet)\}/.test(t.text))

const SENSE_OPTIONS = ['Sí, tiene sentido', 'No, no tiene sentido'] as const
/** A close proposal (a slip of 10 or 100) has a sensible size: the question is whether it is right, not whether it makes sense. */
const EXACT_OPTIONS = ['Sí, es correcta', 'No, no es correcta'] as const

/** The hints of the ordinary proposals: the strategy, the rounding, and a worked example in words (other numbers). */
const SENSE_HINTS: [string, string, string] = [
  'Antes de calcular, piensa si la respuesta tiene un tamaño razonable para lo que cuenta el cuento.',
  'Redondea los números del cuento a decenas o a centenas, haz la cuenta de cabeza y mira si la respuesta que dan está cerca de ese resultado o muy lejos.',
  'Ejemplo con otros números: dos mil más tres mil son unos cinco mil; diez mil sería demasiado. Compara igual la respuesta con esa cuenta redondeada.',
]

/** The hints of a close proposal (a forgotten carry, a digit slip): rounding cannot tell it apart, so the method is the full calculation.
    The worked examples use thousands only, which no story gives (a story's result is under 2 000), so they never spell out an answer. */
const SENSE_HINTS_CLOSE: [string, string, string] = [
  'Antes de calcular, piensa si la respuesta tiene un tamaño razonable para lo que cuenta el cuento.',
  'Haz la cuenta completa, columna a columna y sin redondear, y compara con la respuesta. Fíjate sobre todo en las cifras donde más se suele fallar.',
  'Ejemplo con otros números: dos mil más dos mil son cuatro mil. La estimación solo sirve para ver el tamaño; la cuenta completa da el resultado.',
]

/** A wrong answer for the story, and whether it is close to the right result. Absurd ones: off by an order of magnitude
    (×10, or ÷10 when that stays whole), or impossible for the story. Close ones: a step away from the right result in the
    tens or the hundreds (a forgotten carry, a digit slip), or by one when the result is small. */
function wrongAnswer(rng: Rng, op: WordOp, a: number, b: number, right: number, close: boolean): { value: number; close: boolean } {
  if (!close) {
    const absurd = [right * 10]
    if (right % 10 === 0 && right >= 20) absurd.push(right / 10)
    if (op === 'add') absurd.push(randInt(rng, 1, Math.max(a, b) - 1)) // a total smaller than one of its parts
    else if (op === 'sub') absurd.push(a + randInt(rng, 1, a)) // more left than there was to start with
    else if (op === 'mul') absurd.push(randInt(rng, 1, b - 1)) // fewer than one group
    else absurd.push(a + randInt(rng, 1, a)) // each share bigger than the whole
    // «Absurd» is about the size: a number within 10 % of the result does not look absurd, so it is left out.
    const far = absurd.filter((v) => v > 0 && Math.abs(v - right) / right > 0.1)
    return { value: pick(rng, far.length ? far : [right * 10]), close: false }
  }
  const step = right < 10 ? 1 : right < 100 ? 10 : pick(rng, [10, 100])
  const down = right - step
  const value = down > 0 && rng() < 0.5 ? down : right + step
  return { value, close: true }
}

/** Thousands with a space, as the book writes them: 3770 → 3 770. */
const withSpaces = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

/** A word:sense problem with its facts: the operands, the true result and the proposed one. */
export interface SenseProblem {
  op: WordOp
  a: number
  b: number
  /** The true result of the story. */
  right: number
  /** The answer the story's character gives: right, or a wrong one (see wrongAnswer). */
  shown: number
  /** The wrong answer is close to the right one (a slip, not an absurd number). */
  near: boolean
  exercise: ShapeChoiceExercise
}

/**
 * A story with a proposed answer. The child decides whether the answer makes sense: half of the proposals are the true
 * result, the rest are absurd (see wrongAnswer). The options are «Sí» and «No», in a random order.
 */
export function genWordSense(rng: Rng): ShapeChoiceExercise {
  return buildSense(rng).exercise
}

export function buildSense(rng: Rng): SenseProblem {
  const t = pick(rng, SENSE_STORIES)
  const op = t.op
  let a: number
  let b: number
  let right: number
  if (op === 'add') {
    a = randInt(rng, 10, 999)
    b = randInt(rng, 10, 999)
    right = a + b
  } else if (op === 'sub') {
    a = randInt(rng, 20, 999)
    b = randInt(rng, 2, a - 2)
    right = a - b
  } else if (op === 'mul') {
    a = randInt(rng, 2, 9)
    b = t.fixed ?? randInt(rng, 2, 9)
    right = a * b
  } else {
    b = t.fixed ?? randInt(rng, 2, 9)
    right = randInt(rng, 2, 19)
    a = b * right
  }
  // Two kinds of item, with the same question for the right answer and the wrong one, so the question never gives it
  // away: «¿Tiene sentido?» (the wrong proposals are absurd in size) and «¿Es correcta?» (the wrong ones are a slip away).
  const exact = rng() < 0.5
  const wrong = rng() < 0.5 ? null : wrongAnswer(rng, op, a, b, right, exact)
  const shown = wrong ? wrong.value : right
  const near = wrong?.close === true
  const story = fillTemplate(t.text, a, b)
  const ask = exact ? '¿Es correcta la respuesta de Lumi?' : '¿Tiene sentido esa respuesta?'
  const question = `${story} Lumi responde: «${withSpaces(shown)} ${t.unit}». ${ask}`
  const order = shuffle(rng, [0, 1])
  const correct = shown === right ? 0 : 1
  const labels = exact ? EXACT_OPTIONS : SENSE_OPTIONS
  const exercise: ShapeChoiceExercise = {
    id: `word-sense:${t.id}:${a}.${b}:${shown}`, kind: 'shape-choice', skill: WORD_SENSE_SKILL, difficulty: 3,
    question, figures: [], options: order.map((i) => labels[i]), answer: order.indexOf(correct),
    hints: exact ? SENSE_HINTS_CLOSE : SENSE_HINTS,
  }
  return { op, a, b, right, shown, near, exercise }
}

/** Grades a word:sense answer: the option tapped against the right one. */
export function checkSense(ex: ShapeChoiceExercise, answer: Answer): CheckResult {
  const expected = ex.options[ex.answer]
  if (answer.type !== 'choice') return { correct: false, given: '', expected, errorType: 'other', feedback: '¿Me lo escribes otra vez?' }
  if (answer.index === null || answer.index === undefined) {
    return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: 'Elige una respuesta antes de comprobar.' }
  }
  const given = ex.options[answer.index] ?? '?'
  if (answer.index === ex.answer) return { correct: true, given, expected, feedback: '¡Muy bien! Has comparado la respuesta con el cuento.' }
  return {
    correct: false, given, expected, errorType: 'other',
    feedback: '¡Casi! Haz la cuenta completa y compara con la respuesta que da Lumi.',
  }
}
