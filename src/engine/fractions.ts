/* Fracciones (3.º de Primaria, block E; docs/curriculum/PLAN_DOCENTE.md §1.8 and §5.10). Ladder: colour the parts of a
   figure → read the fraction → name it → compare with drawings → fraction of a quantity (objects in groups first,
   then numbers, then a short story). Denominators 2 to 12 (FRACTION_DENOMINATORS), focus mitad, tercio, cuarto.
   Figures are data (src/types/exercise.ts FractionFigure); the SVG is drawn in src/activities/views/FigureSvg.tsx.
   Hints guide the strategy and never state the answer. Pure: no React. */
import type {
  Answer, CheckResult, ErrorType, Figure, FractionEqualExercise, FractionFigure, FractionOfExercise, FractionReadExercise,
  FractionShadeExercise, Hint, Rng, ShapeChoiceExercise,
} from '@/types'
import { pick, randInt, range, shuffle } from './rng'
import { fractionSkill, FRACTION_DENOMINATORS } from './skills'

/** Plural of the Spanish fraction word for each denominator: [one, many]. Masculine throughout. */
const FRACTION_WORDS: Record<number, [string, string]> = {
  2: ['medio', 'medios'], 3: ['tercio', 'tercios'], 4: ['cuarto', 'cuartos'], 5: ['quinto', 'quintos'],
  6: ['sexto', 'sextos'], 8: ['octavo', 'octavos'], 10: ['décimo', 'décimos'], 12: ['doceavo', 'doceavos'],
}
const NUM_WORDS = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once']

/** The Spanish name of a fraction: (1, 4) → «un cuarto», (3, 4) → «tres cuartos», (1, 2) → «un medio». */
export function fractionName(n: number, d: number): string {
  const words = FRACTION_WORDS[d]
  if (!words) return `${n}/${d}`
  return n === 1 ? `un ${words[0]}` : `${NUM_WORDS[n]} ${words[1]}`
}

const DIFFICULTY_OF_D = (d: number) => (d <= 4 ? 1 : d <= 6 ? 2 : 3)

/** Unequal parts: the biggest at least twice the smallest, so the difference is visible. */
export function unequalWeights(rng: Rng, d: number): number[] {
  for (let attempt = 0; attempt < 60; attempt++) {
    const w = range(0, d - 1).map(() => randInt(rng, 1, 3))
    const lo = Math.min(...w)
    const hi = Math.max(...w)
    if (hi >= 2 * lo && hi > lo) return w
  }
  return [...range(0, d - 2).map(() => 1), 2]
}

/** A figure with d parts: equal (fair) or not, with the given parts coloured. */
export function fractionFigure(rng: Rng, d: number, fair: boolean, colored: number[] = []): FractionFigure {
  return {
    type: 'fraction',
    shape: pick(rng, ['circle', 'rect', 'bar'] as const),
    weights: fair ? range(0, d - 1).map(() => 1) : unequalWeights(rng, d),
    colored: [...colored].sort((a, b) => a - b),
    axis: pick(rng, ['x', 'y'] as const),
  }
}

/** n coloured parts out of d, at random places. */
function someParts(rng: Rng, d: number, n: number): number[] {
  return shuffle(rng, range(0, d - 1)).slice(0, n).sort((a, b) => a - b)
}

// ---------------------------------------------------------------- generators

/** Colour n parts of a figure split in d equal parts: the child taps the parts (fraction-shade). */
export function genFractionShade(rng: Rng, d: number): FractionShadeExercise {
  const n = randInt(rng, 1, d - 1)
  const figure = fractionFigure(rng, d, true)
  return {
    id: `fraction-shade:${n}/${d}:${figure.shape}:${figure.axis}`,
    kind: 'fraction-shade', skill: fractionSkill('shade', d), difficulty: DIFFICULTY_OF_D(d),
    numerator: n, denominator: d, figure: { ...figure, colored: [] },
  }
}

/** A figure with n of its d equal parts coloured: the child writes the fraction (fraction-read). */
export function genFractionRead(rng: Rng, d: number): FractionReadExercise {
  const n = randInt(rng, 1, d - 1)
  const figure = fractionFigure(rng, d, true, someParts(rng, d, n))
  return {
    id: `fraction-read:${n}/${d}:${figure.shape}:${figure.colored.join('.')}:${figure.axis}`,
    kind: 'fraction-read', skill: fractionSkill('read', d), difficulty: DIFFICULTY_OF_D(d) + 1,
    numerator: n, denominator: d, figure,
  }
}

/** Three distractor names for a fraction name, all different from the right one. */
function nameDistractors(rng: Rng, n: number, d: number): string[] {
  const right = fractionName(n, d)
  const others = shuffle(rng, (FRACTION_DENOMINATORS as readonly number[]).filter((x) => x !== d))
  // Same parts with another numerator, then other denominators (a denominator 2 has only one name for n = 1).
  const pool = [fractionName(d - n, d), ...(n > 1 ? [fractionName(n - 1, d)] : []), fractionName(Math.min(d - 1, n + 1), d)]
  for (const x of others) pool.push(fractionName(n, x), fractionName(1, x))
  const candidates = [...new Set(pool)].filter((name) => name !== right)
  return candidates.slice(0, 3)
}

/** A figure with n of d parts coloured: the child says how it is called («tres cuartos») among four names. */
export function genFractionName(rng: Rng, d: number): ShapeChoiceExercise {
  for (let attempt = 0; attempt < 40; attempt++) {
    const n = randInt(rng, 1, d - 1)
    const options = nameDistractors(rng, n, d)
    if (options.length < 3) continue
    const right = fractionName(n, d)
    const all = shuffle(rng, [right, ...options])
    const figure = fractionFigure(rng, d, true, someParts(rng, d, n))
    return {
      id: `shape-choice:frac-name:${n}/${d}:${figure.colored.join('.')}:${figure.shape}`,
      kind: 'shape-choice', skill: fractionSkill('name', d), difficulty: DIFFICULTY_OF_D(d) + 1,
      question: '¿Cómo se dice la parte de color?',
      figures: [figure as Figure],
      options: all,
      answer: all.indexOf(right),
      hints: [
        'Mira primero el número de abajo: ¿en cuántas partes iguales está partida la figura?',
        'El número de arriba cuenta las partes de color. Con una parte se dice «un», con varias, «dos», «tres»…',
        `Las partes de ${d} se llaman «${FRACTION_WORDS[d][1]}». Escoge la palabra que lleva el número de arriba.`,
      ],
    }
  }
  throw new Error(`fractions: no name for denominator ${d}`)
}

const COMPARE_HINTS = {
  unit: [
    'Cuanto más partes tiene el todo, más pequeña es cada parte.',
    'Mira el número de abajo de cada barra: ¿en cuántas partes está partida?',
    'Compara cuánto ocupa una sola parte en cada barra.',
  ],
  same: [
    'Si el número de abajo es el mismo, gana la fracción con más partes de color.',
    'Cuenta las partes coloreadas de cada barra.',
    'Compara los números de arriba: ¿cuál es mayor?',
  ],
  equal: [
    'Mira las dos barras: ¿cubren lo mismo, aunque estén partidas de forma distinta?',
    'Si una barra tiene el doble de partes y el doble de color, ocupa lo mismo.',
    'Mira cuánta parte de cada barra está coloreada.',
  ],
} as const

/** Two fractions drawn as bars, and the child says if the first is smaller, equal or bigger (shape-choice). */
export function genFractionCompare(rng: Rng): ShapeChoiceExercise {
  const kind = pick(rng, ['unit', 'same', 'equal'] as const)
  let n1: number, d1: number, n2: number, d2: number
  if (kind === 'unit') {
    const [a, b] = shuffle(rng, [2, 3, 4, 6, 8]).slice(0, 2)
    n1 = 1; d1 = a; n2 = 1; d2 = b
  } else if (kind === 'same') {
    d1 = d2 = pick(rng, [3, 4, 5, 6, 8])
    n1 = randInt(rng, 1, d1 - 1)
    do { n2 = randInt(rng, 1, d1 - 1) } while (n2 === n1)
  } else {
    const base = pick(rng, [2, 3, 4])
    const k = pick(rng, [2, 3])
    n1 = 1; d1 = base; n2 = k; d2 = base * k
  }
  const value1 = n1 / d1
  const value2 = n2 / d2
  const word = value1 < value2 ? 'menor' : value1 > value2 ? 'mayor' : 'igual'
  const options = shuffle(rng, ['menor', 'igual', 'mayor'])
  const first: FractionFigure = { type: 'fraction', shape: 'bar', weights: range(0, d1 - 1).map(() => 1), colored: range(0, n1 - 1), axis: 'x' }
  const second: FractionFigure = { type: 'fraction', shape: 'bar', weights: range(0, d2 - 1).map(() => 1), colored: range(0, n2 - 1), axis: 'x' }
  return {
    id: `shape-choice:frac-compare:${n1}/${d1}:${n2}/${d2}`,
    kind: 'shape-choice', skill: fractionSkill('compare'), difficulty: kind === 'equal' ? 3 : 2,
    question: '¿Cómo es la primera fracción comparada con la segunda?',
    figures: [first, second],
    options: [...options],
    answer: options.indexOf(word),
    hints: [...COMPARE_HINTS[kind]] as [string, string, string],
  }
}

/** Two to four figures, some split in equal parts and some not: the child taps the ones NOT in equal parts. */
export function genFractionEqual(rng: Rng): FractionEqualExercise {
  for (let attempt = 0; attempt < 60; attempt++) {
    const count = pick(rng, [3, 4])
    const figures: FractionFigure[] = []
    for (let i = 0; i < count; i++) figures.push(fractionFigure(rng, pick(rng, [2, 3, 4, 6, 8]), rng() < 0.5))
    const unequal = figures.flatMap((f, i) => (f.weights.every((w) => w === f.weights[0]) ? [] : [i]))
    if (unequal.length === 0 || unequal.length === count) continue
    return {
      id: `fraction-equal:${figures.map((f) => `${f.shape}${f.weights.join('')}`).join('-')}`,
      kind: 'fraction-equal', skill: fractionSkill('equal'), difficulty: 2,
      figures, unequal,
    }
  }
  throw new Error('fractions: no mixed set of figures could be built')
}

const STORY_NOUN: Record<string, { plural: string; feminine: boolean }> = {
  '🍬': { plural: 'caramelos', feminine: false },
  '🌸': { plural: 'flores', feminine: true },
}

function storyFor(rng: Rng, n: number, d: number, total: number, emoji: string): string {
  const noun = STORY_NOUN[emoji] ?? { plural: 'objetos', feminine: false }
  const frac = fractionName(n, d)
  const Frac = frac.charAt(0).toUpperCase() + frac.slice(1)
  const verb = n === 1 ? 'es' : 'son'
  if (noun.feminine) {
    return pick(rng, [
      `En el jardín hay ${total} ${noun.plural}. ${Frac} de ellas ${verb} rojas. ¿Cuántas son rojas?`,
      `Lumi ha cogido ${total} ${noun.plural}, y ${frac} de ellas son amarillas. ¿Cuántas son amarillas?`,
    ])
  }
  return pick(rng, [
    `Lumi tiene ${total} ${noun.plural} en una bolsa. Regala ${frac} de ellos a su amigo. ¿Cuántos regala?`,
    `En la caja hay ${total} ${noun.plural}. ${Frac} de ellos ${verb} de fresa. ¿Cuántos son de fresa?`,
  ])
}

/** A fraction of a quantity, 20 → ¼ of 20 = 5. Drawing mode: the objects are already in equal groups and the child
    counts the groups asked for. Numbers mode: the calculation, sometimes inside a short story. */
export function genFractionOf(rng: Rng, d: number, mode: 'drawing' | 'numbers', emoji: string): FractionOfExercise {
  const n = randInt(rng, 1, d - 1)
  const k = randInt(rng, Math.ceil(8 / d), Math.floor(40 / d))
  const total = d * k
  const story = mode === 'numbers' && rng() < 0.5 ? storyFor(rng, n, d, total, emoji) : null
  return {
    id: `fraction-of:${n}/${d}:${total}:${mode}:${story ? 's' : 'b'}`,
    kind: 'fraction-of', skill: fractionSkill('of', d), difficulty: mode === 'drawing' ? 2 : 3,
    numerator: n, denominator: d, total, mode, emoji, story, answer: n * k,
  }
}

// ---------------------------------------------------------------- grading

const FB = {
  right: '¡Muy bien! Has sabido ver la fracción.',
  incomplete: 'Escribe el número de arriba y el de abajo.',
  tooMany: 'Has coloreado más partes de las que dice el número de arriba. Cuenta otra vez.',
  tooFew: 'Te faltan partes por colorear. Cuenta las que dice el número de arriba.',
  reversed: 'Los números están al revés: el de abajo cuenta todas las partes iguales.',
  under: 'El número de abajo cuenta todas las partes iguales de la figura.',
  above: 'El número de arriba cuenta solo las partes de color.',
  equalMarkedFair: 'Esa figura sí está partida en partes iguales: no la toques.',
  missedUnequal: 'Mira otra vez: hay una figura con partes de distinto tamaño que no has tocado.',
  of: 'Revisa cuántos grupos iguales hay y cuántos son de la fracción.',
  ofWhole: 'Has contado el total, no la parte. Mira qué fracción te piden.',
}

const wrongShape = (expected: string): CheckResult => ({ correct: false, given: '', expected, errorType: 'other', feedback: '¿Me lo escribes otra vez?' })

export function checkFractionShade(ex: FractionShadeExercise, answer: Answer): CheckResult {
  const expected = `${ex.numerator} de ${ex.denominator}`
  if (answer.type !== 'shade') return wrongShape(expected)
  const chosen = [...new Set(answer.chosen)].filter((i) => Number.isInteger(i) && i >= 0 && i < ex.denominator)
  const given = `${chosen.length} de ${ex.denominator}`
  if (chosen.length === ex.numerator) return { correct: true, given, expected, feedback: FB.right }
  const errorType: ErrorType = 'fraction-count'
  return { correct: false, given, expected, errorType, feedback: chosen.length > ex.numerator ? FB.tooMany : FB.tooFew }
}

export function checkFractionRead(ex: FractionReadExercise, answer: Answer): CheckResult {
  const expected = `${ex.numerator}/${ex.denominator}`
  if (answer.type !== 'fraction') return wrongShape(expected)
  const { numerator: n, denominator: d } = answer
  if (n === null || d === null) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: FB.incomplete }
  const given = `${n}/${d}`
  if (n === ex.numerator && d === ex.denominator) return { correct: true, given, expected, feedback: FB.right }
  if (n === ex.denominator && d === ex.numerator) return { correct: false, given, expected, errorType: 'fraction-count', feedback: FB.reversed }
  if (d !== ex.denominator) return { correct: false, given, expected, errorType: 'fraction-count', feedback: FB.under }
  return { correct: false, given, expected, errorType: 'fraction-count', feedback: FB.above }
}

export function checkFractionEqual(ex: FractionEqualExercise, answer: Answer): CheckResult {
  const expected = ex.unequal.map((i) => i + 1).join(', ')
  if (answer.type !== 'marks') return wrongShape(expected)
  const marked = [...new Set(answer.marked)].filter((i) => Number.isInteger(i) && i >= 0 && i < ex.figures.length).sort((a, b) => a - b)
  const given = marked.map((i) => i + 1).join(', ') || '—'
  const same = marked.length === ex.unequal.length && marked.every((v, i) => v === ex.unequal[i])
  if (same) return { correct: true, given, expected, feedback: FB.right }
  const tappedFair = marked.some((i) => !ex.unequal.includes(i))
  return { correct: false, given, expected, errorType: 'fraction-parts', feedback: tappedFair ? FB.equalMarkedFair : FB.missedUnequal }
}

export function checkFractionOf(ex: FractionOfExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  if (answer.type !== 'number') return wrongShape(expected)
  if (answer.value === null || answer.value === undefined) return { correct: false, given: '?', expected, errorType: 'incomplete', feedback: FB.incomplete }
  const given = String(answer.value)
  if (answer.value === ex.answer) return { correct: true, given, expected, feedback: FB.right }
  if (answer.value === ex.total) return { correct: false, given, expected, errorType: 'fraction-count', feedback: FB.ofWhole }
  const oneGroup = answer.value === ex.total / ex.denominator
  return { correct: false, given, expected, errorType: oneGroup ? 'fraction-count' : 'other', feedback: FB.of }
}

// ---------------------------------------------------------------- hints

const hint = (level: 1 | 2 | 3, text: string): Hint => ({ level, text, visual: 'none' })

/** Hints of the fraction exercises: the strategy first, then the step, never the answer. */
export function fractionHints(ex: FractionShadeExercise | FractionReadExercise | FractionOfExercise | FractionEqualExercise): Hint[] {
  switch (ex.kind) {
    case 'fraction-shade':
      return [
        hint(1, 'El número de abajo dice en cuántas partes iguales se parte la figura. Cuéntalas.'),
        hint(2, 'El número de arriba dice cuántas partes se colorean. Toca una parte cada vez y cuenta en voz baja.'),
        hint(3, `Cada parte es ${fractionName(1, ex.denominator)} de la figura: colorea tantas como diga el número de arriba.`),
      ]
    case 'fraction-read':
      return [
        hint(1, 'Primero cuenta todas las partes iguales de la figura: ese número va abajo.'),
        hint(2, 'Ahora cuenta solo las partes de color: ese número va arriba.'),
        hint(3, 'Arriba, las partes de color. Abajo, todas las partes. Escribe los dos números en la barra.'),
      ]
    case 'fraction-equal':
      return [
        hint(1, 'Mira si todas las partes de cada figura son del mismo tamaño.'),
        hint(2, 'Compara la parte más grande con la más pequeña de la misma figura.'),
        hint(3, 'Si una parte se ve más grande que otra, la figura no está partida en partes iguales.'),
      ]
    case 'fraction-of': {
      if (ex.mode === 'drawing') {
        return [
          hint(1, `Los objetos están en ${ex.denominator} grupos iguales: cada grupo es una parte.`),
          hint(2, 'Cuenta cuántos objetos tiene un solo grupo.'),
          hint(3, ex.numerator === 1 ? 'Con un solo grupo, la respuesta es lo que tiene ese grupo.' : `Son ${ex.numerator} grupos: cuenta los objetos de ${ex.numerator} grupos.`),
        ]
      }
      return [
        hint(1, `Partir en ${ex.denominator} partes iguales es dividir entre ${ex.denominator}.`),
        hint(2, `Calcula primero una parte: ${ex.total} ÷ ${ex.denominator} = ?`),
        hint(3, ex.numerator === 1 ? 'Con una sola parte, la respuesta es esa cuenta.' : `Para ${ex.numerator} partes, suma ${ex.numerator} veces esa cantidad.`),
      ]
    }
  }
}
