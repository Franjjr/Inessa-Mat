import type { ID, InputMode } from './common'

/**
 * Skill keys — the unit of mastery tracking. Format (owned by src/engine/skills.ts):
 *   mul:A×B        multiplication fact, normalised with A <= B, 1..10 (e.g. 'mul:6x7' covers 6×7 and 7×6)
 *   div:P/D        division fact P ÷ D with P = D×Q, D,Q in 1..10 (e.g. 'div:42/6')
 *   skip:N         skip counting by N (N 2..10)
 *   add:3d:c0|c1|c2|c3   column addition, 3 or 4 digit operands, number of carries
 *   add:4d:c0..c4
 *   sub:3d:b0|b1|b2|z    column subtraction, number of borrows, z = borrow across a zero
 *   sub:4d:b0..b3|z
 *   mul:2x1:c0|c1        2-digit × 1-digit, without / with carry
 *   div:2x1:exact|rem|long   2-digit ÷ 1-digit: digit-by-digit exact, with remainder (1-digit quotient), long (bring down)
 *   concept:groups | concept:array | concept:commutative | concept:share | concept:family | concept:placevalue
 *   num:place:blocks|expanded|words   numbers up to 9 999: blocks, expanded form, reading the words
 *   num:compare | num:order           compare with < > = ; order 3–4 numbers
 *   num:round:10|100                  round to decenas or centenas
 *   num:line:10|100|1000|10000        number line with jumps (tick missing, or jump from a point)
 *   <key>:19999 | <key>:99999         the same number keys up to 19 999 (3.º) or 99 999 (4.º); num:round:1000:99999
 *   mental:<family>                   cálculo mental exprés (dobles, triples, mitades, completar10|100|1000, decenas, centenas, compensar)
 *   eq:flex                           signo igual flexible: 5 + 3 = __ + 6, 7 = 3 + __
 *   bar:add|sub|mul|div|two   problem on a bar diagram (two = two steps), with and without the bar (ladder)
 *   hunt:add|sub|mul          encuentra el error: a worked column calculation that may be wrong
 *   check:add|sub|div         comprobar: is the claim right? (the check operation is written)
 *   div:3x1:exact|rem         3-digit dividend ÷ 1-digit divisor
 *   clock:read:30|15|5        analogue clock: read it (en punto y media / cuarto / cada 5 minutos)
 *   clock:set:30|5            analogue clock: set the hands (drag or tap)
 *   clock:convert:day        digital 24 h ↔ the phrase with mañana, tarde, noche
 *   time:end | time:elapsed  duration problems: end time, or the minutes that pass (time line)
 *   time:units | cal:weekday | cal:month   units of time, days of the week, days of a month
 *   frac:shade:D|read:D|name:D|of:D  fractions with denominator D (2|3|4|5|6|8|10|12): colour, read, name, fraction of a quantity
 *   frac:equal | frac:compare        figures not split in equal parts; comparing two fractions with drawings
 *   frac:add | frac:sub              adding and subtracting fractions with the same denominator (4.º)
 *   geo:poly:name|sides, geo:line:type|rel|kind, geo:angle:type|tap|class, geo:circle|circle:parts, geo:solid:name|roll|faces|count,
 *   geo:perimeter, geo:tri:sides|angles, geo:quad:name, geo:translate
 *                                    geometry (3.º and 4.º, block E): polygons, lines, angles, circle, solids, perimeter, triangles,
 *                                    quadrilaterals, translation
 *   money:recognise|pay|change|add|compare|convert   dinero (3.º, block C): euros and céntimos (1 € = 100 céntimos)
 *   measure:unit:length|mass|capacity                 choose the unit of a real object
 *   measure:convert:length|mass|capacity              simple conversions (1 m = 100 cm, medio kilo = 500 g)
 *   measure:ruler                                     read a measure on an on-screen ruler (start not always 0)
 *   measure:word                                      add two measures (mixed units) in a word problem
 *   measure:estimate                                  ¿es razonable? a claimed measure
 *   mul:col:2x2|3x2|3x3                               multiplicar en columna, con filas parciales (4.º, src/engine/longmul.ts)
 *   num:ordinal:10|20|30                              ordinales (3.º): tocar el n-.º de una fila (10), leer y escribir el ordinal (20, 30)
 *   dec:shade:1|2 | dec:read:1|2                      décimas (1) and centésimas (2): colour the bar or the grid of 100, read the words and write the number
 *   dec:compare | dec:money                           comparing two decimals with < = >; euros with céntimos as a decimal (2,45 € = 2 euros y 45 céntimos)
 *   dec:add:1|2 | dec:sub:1|2                         adding and subtracting decimals in columns, comma under comma, never negative (4.º)
 */
export type SkillKey = string

export type ExerciseKind =
  | 'fact-mul'        // a × b = ?
  | 'fact-div'        // p ÷ d = ?
  | 'missing-factor'  // a × ? = p   or  ? × b = p
  | 'skip-count'      // fill missing values in a sequence n, 2n, 3n...
  | 'groups'          // n groups of k objects → write n × k = ?
  | 'array'           // r rows × c columns of objects
  | 'double-chain'    // n → 2n → 4n → 8n
  | 'fact-family'     // triangle a, b, p → write the 4 related facts
  | 'column-add'      // vertical addition with carries
  | 'column-sub'      // vertical subtraction with borrows
  | 'column-mul'      // vertical 2-digit × 1-digit
  | 'division'        // Spanish "galera" layout: dividend | divisor, quotient + remainder
  | 'word-problem'    // short story problem resolving to one operation
  | 'place-value'     // numbers up to 9 999: blocks → expanded form → words (num:place:*)
  | 'compare'         // two numbers, the child taps < > = (num:compare)
  | 'order'           // 3–4 numbers written in order (num:order)
  | 'round'           // round to decenas or centenas (num:round:*)
  | 'number-line'     // number line with jumps of 10, 100 or 1 000 (num:line:*)
  | 'mental'          // cálculo mental exprés, short answer (mental:*)
  | 'equation'        // signo igual flexible (eq:flex)
  | 'bar-problem'     // story problem solved on a bar diagram (with the bar first, then without it)
  | 'error-hunt'      // encuentra el error: a worked column calculation; the child decides and fixes it
  | 'check-calc'      // comprobar: a claimed result; the child writes the check operation and decides
  | 'clock-read'      // analogue clock: choose the phrase, or write the hour and the minutes (clock:read:*)
  | 'clock-set'       // analogue clock: set the hands by dragging or with the +/− buttons (clock:set:*)
  | 'time-convert'    // digital 24 h ↔ phrase with mañana / tarde / noche (clock:convert:day)
  | 'time-duration'   // start + duration → end time, or minutes that pass, on a time line (time:end, time:elapsed)
  | 'calendar'        // days of the week, days of a month, units of time (cal:weekday, cal:month, time:units)
  | 'fraction-shade'  // colour n parts of a figure split in d equal parts (frac:shade:D)
  | 'fraction-read'   // write the fraction that is coloured: numerator over denominator (frac:read:D)
  | 'fraction-of'     // a fraction of a quantity: with the objects in groups first, then with numbers (frac:of:D)
  | 'fraction-equal'  // tap the figures that are NOT split in equal parts (frac:equal)
  | 'shape-choice'    // a figure and a question with options: name, line type, angle, solid, fraction name or compare
  | 'angle-tap'       // tap the corners of a figure that are right angles (geo:angle:tap)
  | 'perimeter'       // perimeter of a figure with its side lengths, or a garden problem (geo:perimeter)
  | 'shape-count'     // how many sides (or corners) a polygon has (geo:poly:sides)
  | 'money'           // dinero: recognise, pay, change, add prices, compare, convert (money:*)
  | 'measure'         // medida: unit, conversion, ruler, add, estimate (measure:*)
  | 'chart'           // gráficos: read a pictogram or a bar chart, or find the moda of a list (chart:*)
  | 'chance'          // probabilidad: seguro, posible o imposible (prob:chance)
  | 'pattern'         // series: the next figure of a pattern, the missing number, or a later term (pattern:*)
  | 'position'        // posición: left, right, above, below on a grid, and routes with arrows (pos:*)
  | 'mul-parts'       // multiplicar por dos cifras por partes: 23 × 14 = 23 × 4 + 23 × 10 (mul:2dx2d, mul:3dx2d)
  | 'area'            // área: count the unit squares of a figure on a grid (geo:area)
  | 'fraction-add'    // sumar y restar fracciones de igual denominador: 2/7 + 3/7 = ? (frac:add, frac:sub)
  | 'long-mul'        // multiplicar en columna con filas parciales: 23 × 14 = 92 + 230 (mul:col:AxB)
  | 'ordinal'         // ordinales (3.º): the n-.º of a row, or the word and the number of an ordinal (num:ordinal:*)
  | 'decimal'         // décimas y centésimas: shade, read, compare, money (dec:shade|read:D, dec:compare, dec:money)
  | 'decimal-op'      // sumar y restar decimales en columna (dec:add|sub:D)

interface ExerciseBase {
  id: ID
  kind: ExerciseKind
  skill: SkillKey
  /** 1 (easiest) .. 5 (hardest) — engine's estimate, used for sequencing. */
  difficulty: number
}

export interface FactMulExercise extends ExerciseBase { kind: 'fact-mul'; a: number; b: number; answer: number }
export interface FactDivExercise extends ExerciseBase { kind: 'fact-div'; dividend: number; divisor: number; answer: number }
export interface MissingFactorExercise extends ExerciseBase {
  kind: 'missing-factor'; a: number; b: number; product: number; missing: 'a' | 'b'; answer: number
}
export interface SkipCountExercise extends ExerciseBase {
  kind: 'skip-count'; step: number; values: number[]; hiddenIndexes: number[]; answer: number[] /* values at hiddenIndexes, same order */
}
export interface GroupsExercise extends ExerciseBase {
  kind: 'groups'; groups: number; perGroup: number; emoji: string; answer: number
}
export interface ArrayExercise extends ExerciseBase {
  kind: 'array'; rows: number; cols: number; emoji: string; answer: number
}
export interface DoubleChainExercise extends ExerciseBase {
  kind: 'double-chain'; start: number; steps: number; answer: number[] /* each doubling, e.g. 3 → [6,12,24] */
}
export interface FactFamilyExercise extends ExerciseBase {
  kind: 'fact-family'; a: number; b: number; product: number
  /** The 4 facts in canonical order: a×b, b×a, p÷a, p÷b. Answers are checked as a set per operation type. */
  answer: [string, string, string, string]
}
export interface ColumnAddExercise extends ExerciseBase {
  kind: 'column-add'; operands: number[]; answer: number
  /** carries[i] = carry written above column i (i=0 units). carries[0] is always 0. */
  carries: number[]
}
export interface ColumnSubExercise extends ExerciseBase {
  kind: 'column-sub'; minuend: number; subtrahend: number; answer: number
  /** borrowed[i] = true when column i needed to borrow from column i+1 (i=0 units). */
  borrowed: boolean[]
}
export interface ColumnMulExercise extends ExerciseBase {
  kind: 'column-mul'; top: number; bottom: number; answer: number; carries: number[]
}
export interface DivisionExercise extends ExerciseBase {
  kind: 'division'; dividend: number; divisor: number; quotient: number; remainder: number
  /** 'exact' digit-by-digit, 'rem' one-digit quotient with remainder, 'long' requires bringing down. */
  variant: 'exact' | 'rem' | 'long'
}
export type PlaceMode = 'blocks' | 'expanded' | 'words'
export type MentalFamily = 'dobles' | 'triples' | 'mitades' | 'completar10' | 'completar100' | 'completar1000' | 'decenas' | 'centenas' | 'compensar' | 'por10' | 'romanos'
/** A term of an equation side: a number, an operator, or null for the blank the child fills. */
export type EqTerm = number | '+' | '−' | null

export interface PlaceValueExercise extends ExerciseBase {
  kind: 'place-value'; mode: PlaceMode; value: number
  /** Expanded form, thousands first, zeros included: 4 025 → [4000, 0, 20, 5]. */
  parts: number[]
  /** Answer: the number (blocks, words) or the four parts (expanded). */
  answer: number | number[]
}
export interface CompareExercise extends ExerciseBase { kind: 'compare'; left: number; right: number; answer: '<' | '>' | '=' }
export interface OrderExercise extends ExerciseBase {
  kind: 'order'; values: number[] /* as shown */; direction: 'asc' | 'desc'; answer: number[] /* in the order to write */
}
export interface RoundExercise extends ExerciseBase { kind: 'round'; value: number; to: 10 | 100 | 1000; answer: number }
export interface NumberLineExercise extends ExerciseBase {
  kind: 'number-line'
  mode: 'tick' | 'jump'
  step: 10 | 100 | 1000 | 10000
  /** Five labelled marks, consecutive multiples of step. */
  ticks: number[]
  /** tick mode: index in ticks of the blank mark. */
  blank: number
  /** jump mode: the point the child starts from (not on a labelled mark) and the jump (+step or −step). */
  start: number | null
  jump: number
  answer: number
}
export interface MentalExercise extends ExerciseBase {
  kind: 'mental'; family: MentalFamily; prompt: string; a: number; b: number; answer: number
}
export interface EquationExercise extends ExerciseBase {
  kind: 'equation'; left: EqTerm[]; right: EqTerm[]; answer: number
}

export interface WordProblemExercise extends ExerciseBase {
  kind: 'word-problem'
  /** Template string (see content/template.ts) — may use {child} {pet} etc. */
  text: string
  op: 'add' | 'sub' | 'mul' | 'div'
  operands: [number, number]
  answer: number
  remainder?: number
  /** Unit word for the answer line, e.g. 'estrellas'. */
  unit: string
}

export type BarOp = 'add' | 'sub' | 'mul' | 'div'
export type BarProblemKind = 'change' | 'compare' | 'combine' | 'share' | 'two-step'

/** One piece of a bar diagram. value null = the unknown (no chip for it; the answer goes there). */
export interface BarSlot {
  id: string
  /** Child-facing name written on the piece ('Tenía', 'Le dan', 'Total'). */
  name: string
  /** Which bar of the drawing (0 = the first; two-step problems have one bar per step). */
  row: number
  /** segment = a piece of the bar; total = the bracket over the whole bar; count = how many groups (a badge). */
  kind: 'segment' | 'total' | 'count'
  value: number | null
}

/** One operation of the solution. The result of the last step is the answer. */
export interface BarStep { op: BarOp; a: number; b: number; result: number }

export interface BarProblemExercise extends ExerciseBase {
  kind: 'bar-problem'
  /** Template string (may use {child}, {pet}). */
  text: string
  problem: BarProblemKind
  /** true: the child first places the numbers on the bar. false: the same problem without the drawing. */
  withBar: boolean
  bar: BarSlot[]
  /** Number of bars drawn (rows of the diagram). */
  rows: number
  steps: BarStep[]
  answer: number
  /** Unit word for the answer line. */
  unit: string
}

/** encuentra el error: operands and the claimed result of a column calculation. */
export interface ErrorHuntExercise extends ExerciseBase {
  kind: 'error-hunt'
  op: 'add' | 'sub' | 'mul'
  /** Top row (sub: the minuend; mul: the 2- or 3-digit number). */
  top: number
  /** Bottom row (the subtrahend; mul: the single digit). */
  bottom: number
  /** The result written in the calculation (may be wrong). */
  shown: number
  /** The right result. */
  answer: number
  /** Column (0 = units) where the written result first differs from the right one; null when it is right. */
  wrongColumn: number | null
  /** The error the calculation carries, tagged for the report; null when the calculation is right. */
  errorType: ErrorType | null
}

/** comprobar: a claim «left op right = claimed» and the check the child writes. */
export interface CheckCalcExercise extends ExerciseBase {
  kind: 'check-calc'
  op: 'add' | 'sub' | 'div'
  left: number
  right: number
  claimed: number
  /** Division only: the remainder claimed (left = right × claimed + remainder). */
  remainder?: number
  /** The number the check gives, the answer of the exercise: claimed − right (add), claimed + right (sub), right × claimed + remainder (div). */
  answer: number
  /** Whether the claim is true. */
  ok: boolean
  /** The error the claim carries when it is false, tagged for the report; null when true. */
  errorType: ErrorType | null
}

// ---------------------------------------------------------------- tiempo (3.º, block D: reloj, duraciones, calendario)

/** A clock time. On the analogue face hour is 1..12 (12 = the 12 of the clock); digital 24 h uses 0..23. Minute 0..59. */
export interface ClockTime { hour: number; minute: number }

/** clock:read — the child reads the clock: picks the phrase (mode 'phrase', `options`, right one at `correct`) or writes
    the hour and the minutes (mode 'write'). `answer` is the time on the face. */
export interface ClockReadExercise extends ExerciseBase {
  kind: 'clock-read'; hour: number; minute: number; mode: 'phrase' | 'write'
  options: string[]; correct: number; answer: ClockTime
}
/** clock:set — the child sets the hands to the phrase in `prompt` (drag, or +/− buttons). */
export interface ClockSetExercise extends ExerciseBase {
  kind: 'clock-set'; prompt: string; answer: ClockTime
}
/** clock:convert:day — to-digital: the phrase is shown and the child writes 24 h time; to-phrase: the 24 h time is shown
    and the child picks the phrase (`options`, right one at `correct`). `answer` is always the 24 h time. */
export interface TimeConvertExercise extends ExerciseBase {
  kind: 'time-convert'; direction: 'to-digital' | 'to-phrase'; phrase: string; options: string[]; correct: number
  answer: ClockTime
}
/** time:end — start + duration, the child writes the end time (answer: ClockTime on the face).
    time:elapsed — start and end shown, the child writes the minutes that pass (answer: minutes). Both draw a time line. */
export interface TimeDurationExercise extends ExerciseBase {
  kind: 'time-duration'; ask: 'end' | 'elapsed'; start: ClockTime; duration: number; end: ClockTime
  answer: ClockTime | number
}
/** cal:weekday — weekday choice (`options`, answer = index); cal:month and time:units — a number (answer). */
export interface CalendarExercise extends ExerciseBase {
  kind: 'calendar'; topic: 'units' | 'weekday' | 'month'; prompt: string
  options: string[]
  answer: number
  /** weekday: index of today (0 = lunes) and the days to count. */
  week?: { today: number; days: number }
  /** units: the fact shown as a chip, e.g. 1 hora → minutos. */
  units?: { amount: number; from: string; to: string }
  /** month: the month asked about. */
  month?: string
}

// ---------------------------------------------------------------- fractions and geometry (3.º, block E)
// Engine: src/engine/fractions.ts and src/engine/geometry.ts. Figures are data; src/activities/views/FigureSvg.tsx draws them.

/** A figure split into parts (fractions). weights = relative size of each part; all equal = a fair split. */
export interface FractionFigure {
  type: 'fraction'
  shape: 'circle' | 'rect' | 'bar'
  weights: number[]
  /** Parts already coloured (indexes, 0 = first part). */
  colored: number[]
  /** rect and bar: 'x' = the cuts run side by side (columns), 'y' = one above the other (rows). */
  axis: 'x' | 'y'
}
/** A closed polygon in free coordinates (the view fits it to the box). labels: text on each side, side i joins point i and i+1. */
export interface PolygonFigure { type: 'polygon'; points: [number, number][]; labels?: string[] }
/** highlight: the part drawn in red (radio, diámetro, cuerda or arco); turn: degrees the highlighted part is turned round. */
export interface CircleFigure { type: 'circle'; filled: boolean; highlight?: 'radius' | 'diameter' | 'chord' | 'arc'; turn?: number }
/** straight: 2 points, a recta (arrows at both ends); ray: 2 points, a dot at the first and an arrow at the second;
    segment: 2 points, a dot at each; curve: 3 points (the middle one is the control point); broken: the points joined in order. */
export interface LineFigure { type: 'line'; kind: 'straight' | 'curve' | 'broken' | 'ray' | 'segment'; points: [number, number][] }
/** Two straight segments, each two points. */
export interface LinesFigure { type: 'lines'; segments: [[number, number], [number, number]][] }
/** An angle with its vertex at the centre: one ray horizontal, the other `deg` degrees from it; the whole turned by `rotation`. */
export interface AngleFigure { type: 'angle'; deg: number; rotation: number }
export type SolidName = 'cubo' | 'prisma' | 'piramide' | 'cilindro' | 'cono' | 'esfera'
export interface SolidFigure { type: 'solid'; name: SolidName }
/** Squares on a grid (área, simetría, traslación). filled: [row, col] of the coloured squares. axis: a dashed line between
    columns (v, at = the column boundary) or rows (h). ghost: a figure before it was moved, drawn as a dashed outline
    (filled is then the moved copy). */
export interface GridFigure {
  type: 'grid'; rows: number; cols: number; filled: [number, number][]
  axis?: { dir: 'v' | 'h'; at: number }
  ghost?: [number, number][]
}
export type Figure = FractionFigure | PolygonFigure | CircleFigure | LineFigure | LinesFigure | AngleFigure | SolidFigure | GridFigure

export interface FractionShadeExercise extends ExerciseBase {
  kind: 'fraction-shade'; numerator: number; denominator: number; figure: FractionFigure
}
export interface FractionReadExercise extends ExerciseBase {
  kind: 'fraction-read'; numerator: number; denominator: number; figure: FractionFigure
}
export interface FractionOfExercise extends ExerciseBase {
  kind: 'fraction-of'
  numerator: number; denominator: number
  /** The whole quantity (a multiple of the denominator). */
  total: number
  /** drawing: the objects in equal groups, the child counts; numbers: only the calculation. */
  mode: 'drawing' | 'numbers'
  emoji: string
  /** Short story around the calculation (numbers mode, sometimes); null = bare fraction. */
  story: string | null
  answer: number
}
export interface FractionEqualExercise extends ExerciseBase {
  kind: 'fraction-equal'; figures: FractionFigure[]
  /** Indexes of the figures that are not split in equal parts (the ones to tap). */
  unequal: number[]
}
export interface ShapeChoiceExercise extends ExerciseBase {
  kind: 'shape-choice'
  question: string
  figures: Figure[]
  options: string[]
  /** Index in options. */
  answer: number
  /** Hints, from the strategy (level 1) to the worked step (level 3). Never the answer. */
  hints: [string, string, string]
}
export interface AngleTapExercise extends ExerciseBase {
  kind: 'angle-tap'; figure: PolygonFigure
  /** Corners (indexes into figure.points) that are right angles. May be empty. */
  rightCorners: number[]
}
export interface PerimeterExercise extends ExerciseBase {
  kind: 'perimeter'
  mode: 'drawing' | 'story'
  figure: PolygonFigure
  /** The side lengths in order (the figure carries them as labels in drawing mode). */
  sides: number[]
  unit: string
  /** Story text (story mode). */
  text: string | null
  answer: number
}
export interface ShapeCountExercise extends ExerciseBase {
  kind: 'shape-count'; figure: PolygonFigure; ask: 'sides' | 'vertices'; answer: number
}

// ---------------------------------------------------------------- dinero and medida (3.º, block C)

/** Money mode: recognise a coin or note, pay exactly, give the change, add prices, compare, convert. */
export type MoneyMode = 'recognise' | 'pay' | 'change' | 'add' | 'compare' | 'convert'
/** A priced thing of a story or a shop card. price in céntimos. */
export interface MoneyItem { name: string; emoji: string; price: number }

/** Amounts are céntimos (integers): 3,40 € = 340. The views show them with a decimal comma. */
export interface MoneyRecogniseExercise extends ExerciseBase {
  kind: 'money'; mode: 'recognise'; piece: number; options: number[]; answer: number
}
export interface MoneyPayExercise extends ExerciseBase {
  kind: 'money'; mode: 'pay'; price: number; answer: number
  /** Whole euros (2.º): no céntimos in the price. */
  whole?: boolean
}
export interface MoneyChangeExercise extends ExerciseBase {
  kind: 'money'; mode: 'change'; price: number; paid: number; text: string
  /** The change in céntimos (paid − price). */
  answer: number
}
export interface MoneyAddExercise extends ExerciseBase {
  kind: 'money'; mode: 'add'; items: MoneyItem[]; story: boolean; text: string
  /** Sum in céntimos. */
  answer: number
  /** Whole euros (2.º): the answer has a single box, the euros. */
  whole?: boolean
}
export interface MoneyCompareExercise extends ExerciseBase {
  kind: 'money'; mode: 'compare'; items: MoneyItem[]; question: 'more' | 'less'
  /** Name of the item that is the answer. */
  answer: string
}
export interface MoneyConvertExercise extends ExerciseBase {
  kind: 'money'; mode: 'convert'; direction: 'to-cents' | 'to-euros'; amount: number
  /** to-cents: céntimos. to-euros: [euros, céntimos]. */
  answer: number | number[]
}

/** Measure mode: unit of an object, simple conversion, ruler reading, adding measures, estimate. */
export type MeasureMode = 'unit' | 'convert' | 'ruler' | 'add' | 'estimate'
export type MeasureDimension = 'length' | 'mass' | 'capacity'

export interface MeasureUnitExercise extends ExerciseBase {
  kind: 'measure'; mode: 'unit'; dimension: MeasureDimension; object: string; emoji: string
  /** The three (or two) readings of the same number in different units; one unit is the right one. */
  options: { value: number; unit: string }[]
  /** The unit that fits the object. */
  answer: string
}
export interface MeasureConvertExercise extends ExerciseBase {
  kind: 'measure'; mode: 'convert'; dimension: MeasureDimension
  /** The given amount, written as the child reads it: '1 m', '300 cm', 'medio kilo', 'un cuarto de litro'. */
  given: string
  /** Unit of the blank (the answer). */
  unit: string
  /** Number of small units in one big unit (100, 1 000) and the fraction of the big unit given, if any. */
  factor: number
  fraction: 'half' | 'quarter' | null
  /** true when the blank is the big unit (300 cm = ___ m). */
  toBig: boolean
  answer: number
}
export interface MeasureRulerExercise extends ExerciseBase {
  kind: 'measure'; mode: 'ruler'; start: number; end: number; max: number
  /** Length in cm: end − start. */
  answer: number
}
export interface MeasureAddExercise extends ExerciseBase {
  kind: 'measure'; mode: 'add'; dimension: MeasureDimension; text: string
  /** Unit of the answer (the smaller one). */
  unit: string
  answer: number
}
export interface MeasureEstimateExercise extends ExerciseBase {
  kind: 'measure'; mode: 'estimate'; object: string; emoji: string; claim: string
  /** true when the claim is reasonable. */
  answer: boolean
}

export type Exercise =
  | FactMulExercise | FactDivExercise | MissingFactorExercise | SkipCountExercise | GroupsExercise
  | ArrayExercise | DoubleChainExercise | FactFamilyExercise | ColumnAddExercise | ColumnSubExercise
  | ColumnMulExercise | DivisionExercise | WordProblemExercise | BarProblemExercise | ErrorHuntExercise | CheckCalcExercise
  | PlaceValueExercise | CompareExercise | OrderExercise | RoundExercise | NumberLineExercise | MentalExercise
  | EquationExercise
  | ClockReadExercise | ClockSetExercise | TimeConvertExercise | TimeDurationExercise | CalendarExercise
  | EquationExercise | FractionShadeExercise | FractionReadExercise | FractionOfExercise | FractionEqualExercise
  | ShapeChoiceExercise | AngleTapExercise | PerimeterExercise | ShapeCountExercise
  | MoneyRecogniseExercise | MoneyPayExercise | MoneyChangeExercise | MoneyAddExercise | MoneyCompareExercise | MoneyConvertExercise
  | MeasureUnitExercise | MeasureConvertExercise | MeasureRulerExercise | MeasureAddExercise | MeasureEstimateExercise
  | ChartExercise | ChanceExercise | PatternExercise | PositionExercise | MulPartsExercise | AreaExercise | FractionAddExercise
  | LongMulExercise | OrdinalExercise | DecimalExercise | DecimalOpExercise

// ---- 4.º: multiplicar por dos cifras por partes, y el área en cuadraditos (src/engine/bigops.ts, geometry.ts)

export interface MulPartsExercise extends ExerciseBase {
  kind: 'mul-parts'
  top: number
  /** The two-digit multiplier and its parts: 14 → units 4, tens 10. */
  bottom: number
  units: number
  tens: number
  /** [top × units, top × tens]. */
  partials: [number, number]
  answer: number
}
/** Multiplicar en columna (4.º): top × bottom with one partial row per digit of the bottom, each already shifted. */
export interface LongMulExercise extends ExerciseBase {
  kind: 'long-mul'
  top: number
  bottom: number
  /** top × each digit of bottom, units first, already shifted: 23 × 14 → [92, 230]. */
  partials: number[]
  answer: number
}
/** Ordinales (3.º, src/engine/ordinals.ts). row: tap the n-th object of a queue (answer = its position, 0-based).
    read: the number is shown, the child picks its word. write: the word is shown, the child picks the number. */
export interface OrdinalExercise extends ExerciseBase {
  kind: 'ordinal'
  mode: 'row' | 'read' | 'write'
  n: number
  /** row: the objects of the queue, all alike; empty in read and write. */
  items: string[]
  /** read: the words; write: the numerals («7.º»); empty in row. */
  options: string[]
  answer: number
}
export interface AreaExercise extends ExerciseBase { kind: 'area'; figure: GridFigure; answer: number }
/** a/d + b/d or a/d − b/d. Drawing mode shows the bars (two for a sum, one for a subtraction); the child writes the
    numerator and the denominator of the result. */
export interface FractionAddExercise extends ExerciseBase {
  kind: 'fraction-add'
  op: 'add' | 'sub'
  a: number; b: number; denominator: number
  mode: 'drawing' | 'numbers'
  figures: FractionFigure[]
  /** The numerator of the result (the denominator stays). */
  answer: number
}

// ---- gráficos, probabilidad, series y posición (src/engine/data.ts, patterns.ts, position.ts)

export interface ChartCategory { label: string; emoji: string; value: number }
export interface ChartExercise extends ExerciseBase {
  kind: 'chart'
  /** pictogram: rows of icons; bars: a bar chart with a scale; data: a list of values (the moda). */
  mode: 'pictogram' | 'bars' | 'data'
  title: string
  categories: ChartCategory[]
  /** Pictogram: what one icon is worth (1, 2, 5 or 10). Bars: the step of the scale. */
  per: number
  /** data mode: the values in the list. */
  data: number[]
  ask: 'count' | 'difference' | 'total' | 'most' | 'least' | 'mode'
  question: string
  /** most / least: the labels to choose from (the answer is an index). Empty when a number is written. */
  options: string[]
  answer: number
}
export interface ChanceExercise extends ExerciseBase {
  kind: 'chance'
  /** What is in the bag (or on the spinner), with how many of each. */
  bag: { label: string; emoji: string; count: number }[]
  question: string
  /** Always ['Seguro', 'Posible', 'Imposible']; the answer is an index. */
  options: string[]
  answer: number
}
export interface PatternExercise extends ExerciseBase {
  kind: 'pattern'
  /** shapes: a row of figures, choose the next one; numbers: a series with a gap; predict: a term further on. */
  mode: 'shapes' | 'numbers' | 'predict'
  /** The terms shown; null is the gap (numbers) or the next one (shapes). */
  items: (string | number | null)[]
  /** numbers / predict: the constant step of the series (negative when it goes down). 0 for shapes. */
  step: number
  /** predict: the position asked (1-based). */
  position: number | null
  /** shapes: the figures to choose from (the answer is an index). Empty when a number is written. */
  options: string[]
  answer: number
}
export interface PositionCell { row: number; col: number; emoji: string; name: string }
export interface PositionExercise extends ExerciseBase {
  kind: 'position'
  /** relative: where one thing is from another; next: what is beside a thing; route: where a walk ends. */
  mode: 'relative' | 'next' | 'route'
  rows: number
  cols: number
  cells: PositionCell[]
  question: string
  /** route: the moves, in order. */
  moves: { dir: 'up' | 'down' | 'left' | 'right'; n: number }[]
  /** route: where the walk starts (a cell index). */
  start: number | null
  options: string[]
  /** Index in options. */
  answer: number
}

/**
 * A child's answer. Single-number kinds use { value }. Column kinds send the digits written in each cell so the
 * engine can diagnose errors (e.g. forgot the carry). Division sends quotient and remainder.
 */
export type Answer =
  | { type: 'number'; value: number | null }
  | { type: 'numbers'; values: (number | null)[] }                       // skip-count, double-chain
  | { type: 'digits'; digits: (number | null)[]; carries?: (number | null)[]; method?: SubMethod } // column ops; digits[0] = units. carries = written steps (resta: marks)
  | { type: 'steps'; method: 'parts' | 'line'; values: (number | null)[]; total?: number | null }   // resta por partes / saltos
  | { type: 'division'; quotient: number | null; remainder: number | null }
  | { type: 'facts'; facts: string[] }                                     // fact-family, e.g. '6x7=42', '42/6=7'
  | { type: 'sign'; sign: '<' | '>' | '=' | null }                          // compare: the sign the child tapped
  | { type: 'bar'; placed: (number | null)[]; ops: (BarOp | null)[]; results: (number | null)[] } // bar: per slot, per step
  | { type: 'hunt'; ok: boolean | null; column: number | null; value: number | null }  // encuentra el error
  | { type: 'verdict'; ok: boolean | null; value: number | null }          // comprobar: the verdict and the check
  | { type: 'division-parts'; parts: (number | null)[]; quotient: number | null; remainder: number | null } // repartir por partes
  | { type: 'climb'; products: (number | null)[]; remainder: number | null } // multiplicar hacia arriba
  | { type: 'time'; hour: number | null; minute: number | null }        // reloj: the hour and the minutes
  | { type: 'choice'; index: number | null }                             // reloj (frases), días de la semana, shape-choice
  | { type: 'shade'; chosen: number[] }                                    // fraction-shade: the parts the child coloured
  | { type: 'fraction'; numerator: number | null; denominator: number | null } // fraction-read: written over and under
  | { type: 'marks'; marked: number[] }                                    // fraction-equal, angle-tap: what was tapped
  | { type: 'option'; value: string | null }                               // dinero and medida: the option tapped
  | { type: 'pieces'; pieces: number[] }                                   // dinero pay: coins and notes in the tray (céntimos)
  | { type: 'long-mul'; rows: (number | null)[][]; total: (number | null)[] } // multiplicar en columna: partial rows and the total, units first

/**
 * Subtraction methods a child can learn (see src/engine/methods.ts for labels and the registry of methods per
 * operation). 'borrow' = pedir prestado arriba (default), 'carry' = me llevo una abajo (compensación),
 * 'parts' = por partes (352 − 100 − 20 − 7), 'line' = saltos en la recta numérica (contar hacia delante).
 */
export type SubMethod = 'borrow' | 'carry' | 'parts' | 'line'

/**
 * Division methods a child can learn (src/engine/methods.ts). 'galera' = the galera with the subtractions written,
 * 'galera-short' = the galera without them (la galera sin restas), 'div-parts' = repartir por partes
 * (84 ÷ 4 = 80 ÷ 4 + 4 ÷ 4), 'climb' = multiplicar hacia arriba («¿qué número por 4 da 28?»).
 */
export type DivMethod = 'galera' | 'galera-short' | 'div-parts' | 'climb'

/** Tables tricks a child can pick as the favourite strategy (the Lumi tricks, src/engine/methods.ts). */
export type TableMethod = 'double' | 'double-double' | 'half-ten' | 'ten-minus-one' | 'five-plus-one' | 'mirror'

export type ErrorType =
  | 'fact'                 // wrong times-table fact (or wrong single-digit addition/subtraction inside a column)
  | 'carry-forgot'         // did not add the carry in the next column
  | 'carry-wrong'          // wrote the carry wrongly (e.g. wrote 15 in one cell)
  | 'borrow-forgot'        // borrowed but did not reduce the neighbour, or didn't borrow at all
  | 'smaller-from-larger'  // subtracted top from bottom in a column (|a-b| error)
  | 'zero-borrow'          // mistake when borrowing across a zero
  | 'misaligned'           // digits placed in the wrong columns
  | 'remainder-too-big'    // remainder >= divisor
  | 'quotient-off'         // quotient off by one with consistent remainder logic
  | 'operation'            // used the wrong operation in a word problem
  | 'incomplete'           // left cells empty
  | 'recognition'          // child said the handwriting was misread (not a maths error!)
  | 'bar-placement'        // a quantity put on the wrong piece of the bar
  | 'place-value'          // a digit written in the wrong column (valor posicional), or a shifted result
  | 'clock-hour'           // reloj: the hour is wrong (the hand that says the hour)
  | 'clock-minute'         // reloj: the minutes are wrong (the long hand, counted in fives)
  | 'clock-period'         // reloj de 24 h: the period of the day (mañana, tarde, noche) is wrong
  | 'step'                 // the first step of a two-step problem is wrong
  | 'false-alarm'          // the child said there was an error in a right calculation
  | 'fraction-parts'       // took as equal parts a split that is not equal, or the other way round
  | 'fraction-count'       // counted the coloured parts or the parts of the whole wrongly (numerator or denominator)
  | 'geo-name'             // confused a figure, a line, an angle or a solid with another one
  | 'geo-perimeter'        // the perimeter did not add every side
  | 'left-right'           // posición: left and right (or above and below) swapped
  | 'other'

export interface CheckResult {
  correct: boolean
  /** Normalised representation of what was given / expected, for logs and parent dashboards. */
  given: string
  expected: string
  errorType?: ErrorType
  /** For column ops: indexes (0 = units) of the columns that are wrong, to highlight gently. */
  wrongColumns?: number[]
  /** Short child-facing feedback in Spanish (template string), e.g. "¡Casi! Revisa la llevada de las decenas." */
  feedback?: string
}

export type HintVisual =
  | 'groups' | 'array' | 'dots-five-plus-one' | 'double-chain' | 'mirror' | 'nine-trick' | 'skip-count'
  | 'place-value' | 'carry' | 'borrow' | 'times-ten-minus' | 'share' | 'family' | 'none'
  | 'clock' | 'time-line' | 'week' | 'units'

export interface Hint {
  level: 1 | 2 | 3            // 1 = strategy reminder, 2 = visual scaffold, 3 = worked step
  text: string                // template string
  visual: HintVisual
  /** Parameters for the visual (e.g. { a: 6, b: 7 }). */
  params?: Record<string, number | string | number[]>
}

/** Mental strategy (the "tricks" of the workbook) for a multiplication fact. */
export interface FactStrategy {
  id: 'easy-one' | 'double' | 'five' | 'ten' | 'mirror' | 'five-plus-one' | 'even-six-rhyme' | 'double-double'
     | 'double-double-double' | 'nine-trick' | 'square-rhyme' | 'five-six-seven-eight' | 'weeks' | 'known'
  text: string
  visual: HintVisual
}

/** Describes which exercises to generate. Used by content (world nodes) and free play. All fields optional. */
export interface SkillSelector {
  kinds?: ExerciseKind[]
  /** Explicit skills to draw from (e.g. ['mul:6x7','mul:6x8']). */
  skills?: SkillKey[]
  /** Times tables to draw facts from (e.g. [6] or [6,7,8]). Applies to fact-mul, fact-div, missing-factor, skip-count. */
  tables?: number[]
  /** Second factor range for facts, default [1,10]. */
  factorRange?: [number, number]
  /** Column ops: number of digits of the operands. */
  digits?: 2 | 3 | 4
  /** Column ops: carries/borrows wanted. */
  regroup?: 'none' | 'one' | 'many' | 'any'
  /** Subtraction: include borrowing across zeros. */
  zeros?: boolean
  /** Division variants allowed. */
  divisionVariants?: DivisionExercise['variant'][]
  /** Prefer items the child has not mastered yet (requires mastery passed to generate). */
  adaptive?: boolean
}

/** Everything an activity needs to log after the child answers one exercise. */
export interface AttemptInput {
  exercise: Exercise
  check: CheckResult
  ms: number
  inputMode: InputMode
  hintsUsed: number
  /** Number of times the child corrected a misread digit before submitting. */
  recognitionFixes?: number
  /** Method used for this exercise when the operation has several (e.g. 'borrow' for a column subtraction). */
  method?: string
}

// ---- 4.º: décimas y centésimas (src/engine/decimals.ts). Values are whole hundredths: 2,45 → 245.

export type DecimalMode = 'shade' | 'read' | 'compare' | 'money'
/** The writing cells: 1 = décimas (one digit after the comma), 2 = décimas and centésimas (one digit each, see decimalFromCells). */
export type DecimalPlaces = 1 | 2
/** shade: the bar of 10 or the grid of 100 with the parts coloured → write the number. read: the words («tres décimas»)
    → write the number. compare: two decimals → < = >. money: 2,45 € → euros and céntimos. */
export interface DecimalExercise extends ExerciseBase {
  kind: 'decimal'
  mode: DecimalMode
  places: DecimalPlaces
  /** The number in hundredths (shade, read, money) or the first of the two (compare). */
  value: number
  /** compare only: the second number, in hundredths. */
  other?: number
  answer: number | '<' | '>' | '='
}
/** A ± B in a column with the commas aligned. Both operands and the result in hundredths; the result is never negative. */
export interface DecimalOpExercise extends ExerciseBase {
  kind: 'decimal-op'
  op: 'add' | 'sub'
  places: DecimalPlaces
  left: number
  right: number
  answer: number
}
