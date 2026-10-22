/* Dinero (docs/curriculum/PLAN_DOCENTE.md §1.9 and §5.8, 3.º de Primaria). Pure: generators, checks and hints for
   recognising coins and notes, paying an exact price, giving the change, adding prices, comparing them and converting
   euros and céntimos (1 € = 100 céntimos). Amounts are céntimos (integers): 3,40 € = 340.
   Ladder: coins on screen (pay, recognise) → prices written (add, compare) → word problem (change, add in a story).
   Hints guide the strategy and never state the answer: no level-3 hint contains the result. */
import type {
  Answer, CheckResult, Exercise, Hint, MoneyAddExercise, MoneyChangeExercise, MoneyCompareExercise, MoneyConvertExercise,
  MoneyItem, MoneyMode, MoneyPayExercise, MoneyRecogniseExercise, Rng,
} from '@/types'
import { pick, randInt, shuffle } from './rng'
import { moneySkill } from './skills'

/** Coins and notes, in céntimos (the 12 pieces of the euro). */
export const PIECES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000] as const
export type Piece = (typeof PIECES)[number]
/** Notes of the 3.º ladder start at 5 €; a 100 € note is not used. */
export const NOTES = [500, 1000, 2000, 5000] as const

/** Decimal comma, euro sign, and the céntimos written as two digits: 340 → '3,40 €', 500 → '5 €', 5 → '0,05 €'. */
export function euros(cents: number): string {
  const e = Math.floor(cents / 100)
  const c = cents % 100
  return c === 0 ? `${e} €` : `${e},${String(c).padStart(2, '0')} €`
}

/** A piece as a child names it: '50 céntimos', '1 céntimo', '2 €'. */
export function pieceName(cents: number): string {
  if (cents >= 100) return euros(cents)
  return cents === 1 ? '1 céntimo' : `${cents} céntimos`
}

/** Amount written as the two boxes of an answer: [euros, céntimos]. */
export function splitCents(cents: number): [number, number] {
  return [Math.floor(cents / 100), cents % 100]
}

/** Notes are the pieces from 5 € up; the rest are coins. */
export function isNote(cents: number): boolean {
  return cents >= 500
}

// ---------------------------------------------------------------- catalog of the stories

/** Things a child buys: the name with its article, its emoji and the price in céntimos. */
export const SHOP: MoneyItem[] = [
  { name: 'un bocadillo', emoji: '🥪', price: 250 },
  { name: 'un zumo', emoji: '🧃', price: 135 },
  { name: 'un cuaderno', emoji: '📓', price: 180 },
  { name: 'un lápiz', emoji: '✏️', price: 45 },
  { name: 'una goma', emoji: '🧽', price: 30 },
  { name: 'un helado', emoji: '🍦', price: 120 },
  { name: 'una pelota', emoji: '⚽', price: 495 },
  { name: 'un cómic', emoji: '📚', price: 650 },
  { name: 'un peluche', emoji: '🧸', price: 760 },
  { name: 'una bolsa de gominolas', emoji: '🍬', price: 215 },
  { name: 'un globo', emoji: '🎈', price: 90 },
  { name: 'una manzana', emoji: '🍎', price: 55 },
  { name: 'un plátano', emoji: '🍌', price: 40 },
  { name: 'un vaso de leche', emoji: '🥛', price: 110 },
  { name: 'un pincel', emoji: '🖌️', price: 75 },
]

const CHANGE_TEMPLATES = [
  '{child} compra {item} que cuesta {price}. Paga con {paid}. ¿Cuánto le devuelven?',
  '{child} paga con {paid} {item} que cuesta {price}. ¿Cuánto le dan de cambio?',
]

// ---------------------------------------------------------------- makers

const fresh = <T extends Exercise>(make: () => T, used: Set<string>, tries = 14): T => {
  let last = make()
  for (let i = 0; i < tries && used.has(last.id); i++) last = make()
  return last
}

export function makeRecognise(piece: number, options: number[]): MoneyRecogniseExercise {
  return {
    id: `money:recognise:${piece}:${options.join('.')}`, kind: 'money', skill: moneySkill('recognise'),
    difficulty: piece <= 50 ? 1 : 2, mode: 'recognise', piece, options: [...options], answer: piece,
  }
}

export function makePay(price: number): MoneyPayExercise {
  return {
    id: `money:pay:${price}`, kind: 'money', skill: moneySkill('pay'),
    difficulty: price < 200 ? 1 : price < 1000 ? 2 : 3, mode: 'pay', price, answer: price,
  }
}

export function makeChange(price: number, paid: number, item: string): MoneyChangeExercise {
  const text = CHANGE_TEMPLATES[price % CHANGE_TEMPLATES.length]
    .replace('{item}', item).replace('{price}', euros(price)).replace('{paid}', euros(paid))
  return {
    id: `money:change:${price}:${paid}`, kind: 'money', skill: moneySkill('change'), difficulty: 3, mode: 'change',
    price, paid, text, answer: paid - price,
  }
}

/** The sentence of a story problem, or the prices written on cards when `story` is false. */
export function addText(items: MoneyItem[]): string {
  const list = items.map((it) => `${it.name} que cuesta ${euros(it.price)}`)
  const joined = list.length <= 1 ? list.join('') : `${list.slice(0, -1).join(', ')} y ${list[list.length - 1]}`
  return `{child} compra ${joined}. ¿Cuánto tiene que pagar en total?`
}

export function makeAdd(items: MoneyItem[], story: boolean): MoneyAddExercise {
  const answer = items.reduce((sum, it) => sum + it.price, 0)
  return {
    id: `money:add:${items.map((it) => it.price).join('+')}:${story ? 's' : 'c'}`, kind: 'money', skill: moneySkill('add'),
    difficulty: story ? 3 : 2, mode: 'add', items: [...items], story, text: story ? addText(items) : 'Estos son los precios. ¿Cuánto cuestan todos juntos?',
    answer,
  }
}

export function makeCompare(items: MoneyItem[], question: 'more' | 'less'): MoneyCompareExercise {
  const [a, b] = items
  const best = question === 'more' ? (a.price > b.price ? a : b) : (a.price < b.price ? a : b)
  return {
    id: `money:compare:${items.map((it) => it.name).join('|')}:${question}`, kind: 'money', skill: moneySkill('compare'),
    difficulty: 2, mode: 'compare', items: [...items], question, answer: best.name,
  }
}

export function makeConvert(direction: 'to-cents' | 'to-euros', amount: number): MoneyConvertExercise {
  return {
    id: `money:convert:${direction}:${amount}`, kind: 'money', skill: moneySkill('convert'),
    difficulty: direction === 'to-cents' && amount % 100 === 0 ? 1 : direction === 'to-cents' ? 2 : 3,
    mode: 'convert', direction, amount,
    answer: direction === 'to-cents' ? amount : splitCents(amount),
  }
}

// ---------------------------------------------------------------- generation

export function buildMoney(mode: MoneyMode, rng: Rng, used: Set<string>): Exercise {
  switch (mode) {
    case 'recognise':
      return fresh(() => {
        const piece = pick(rng, PIECES)
        const others = shuffle(rng, PIECES.filter((p) => p !== piece)).slice(0, 3)
        return makeRecognise(piece, shuffle(rng, [piece, ...others]))
      }, used)
    case 'pay':
      return fresh(() => makePay(rng() < 0.4 ? randInt(rng, 1, 40) * 5 : randInt(rng, 41, 400) * 5), used)
    case 'change':
      return fresh(() => {
        const price = randInt(rng, 10, 380) * 5
        const paid = pick(rng, NOTES.filter((n) => n - price >= 10 && n > price))
        if (!paid) return makeChange(100, 500, pick(rng, SHOP).name)
        return makeChange(price, paid, pick(rng, SHOP).name)
      }, used)
    case 'add':
      return fresh(() => {
        const n = rng() < 0.6 ? 2 : 3
        let items: MoneyItem[] = shuffle(rng, SHOP).slice(0, n)
        for (let k = 0; k < 6 && items.reduce((s, it) => s + it.price, 0) > 2500; k++) items = shuffle(rng, SHOP).slice(0, n)
        return makeAdd(items, rng() < 0.5)
      }, used)
    case 'compare':
      return fresh(() => {
        let [a, b] = shuffle(rng, SHOP).slice(0, 2)
        while (Math.abs(a.price - b.price) < 20) [a, b] = shuffle(rng, SHOP).slice(0, 2)
        return makeCompare(shuffle(rng, [a, b]), rng() < 0.5 ? 'more' : 'less')
      }, used)
    case 'convert':
      return fresh(() => {
        if (rng() < 0.5) return makeConvert('to-cents', randInt(rng, 1, 19) * 100 + (rng() < 0.6 ? randInt(rng, 1, 99) : 0))
        return makeConvert('to-euros', randInt(rng, 1, 19) * 100 + randInt(rng, 1, 99))
      }, used)
  }
}

// ---------------------------------------------------------------- statements (daily plan, adult reports)

/** Human statement of a money exercise: names the question, never the answer. */
export function moneyStatement(ex: Exercise): string {
  if (ex.kind !== 'money') return ex.skill
  switch (ex.mode) {
    case 'recognise': return 'Di cuánto vale la moneda o el billete'
    case 'pay': return `Paga ${euros(ex.price)} con monedas y billetes`
    case 'change': return ex.text
    case 'add': return ex.story ? ex.text : 'Suma los precios'
    case 'compare': return ex.question === 'more' ? '¿Qué cuesta más?' : '¿Qué cuesta menos?'
    case 'convert': return ex.direction === 'to-cents' ? `¿Cuántos céntimos son ${euros(ex.amount)}?` : `¿Cuántos euros son ${ex.amount} céntimos?`
  }
}

// ---------------------------------------------------------------- checks

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const res = (correct: boolean, given: string, expected: string, extra: Partial<CheckResult> = {}): CheckResult =>
  ({ correct, given, expected, ...extra })

/** An amount in céntimos from the two boxes [euros, céntimos] or one number (céntimos). null = empty; undefined = wrong shape. */
function centsFrom(answer: Answer): number | null | undefined {
  if (answer.type === 'number') return isNum(answer.value) ? answer.value : null
  if (answer.type === 'numbers') {
    const [e, c] = answer.values
    if (!isNum(e) || !isNum(c)) return null
    return e * 100 + c
  }
  return undefined
}

function judgeAmount(expected: number, answer: Answer): CheckResult {
  const exp = euros(expected)
  const v = centsFrom(answer)
  if (v === undefined) return res(false, '', exp, { errorType: 'other', feedback: 'Escribe los euros y los céntimos.' })
  if (v === null) return res(false, '?', exp, { errorType: 'incomplete', feedback: 'Escribe la cantidad completa.' })
  const given = euros(v)
  if (v === expected) return res(true, given, exp, { feedback: '¡Muy bien! Has contado bien el dinero.' })
  const feedback = (v - expected) % 100 === 0
    ? '¡Casi! Los céntimos están bien, revisa los euros.'
    : '¡Casi! Revisa los céntimos: cuenta cuántos faltan para el euro siguiente.'
  return res(false, given, exp, { errorType: 'other', feedback })
}

function checkRecognise(ex: MoneyRecogniseExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  if (answer.type !== 'choice') return res(false, '', expected, { errorType: 'other', feedback: 'Elige una de las opciones.' })
  if (answer.value === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Elige una opción.' })
  if (answer.value === expected) return res(true, pieceName(ex.answer), pieceName(ex.answer), { feedback: `¡Muy bien! Es ${pieceName(ex.answer)}.` })
  return res(false, answer.value, expected, { errorType: 'other', feedback: '¡Casi! Lee el número que tiene impreso la moneda o el billete.' })
}

function checkPay(ex: MoneyPayExercise, answer: Answer): CheckResult {
  const expected = euros(ex.price)
  if (answer.type !== 'pieces') return res(false, '', expected, { errorType: 'other', feedback: 'Pon monedas o billetes en la bandeja.' })
  if (answer.pieces.length === 0) return res(false, '0', expected, { errorType: 'incomplete', feedback: 'Pon monedas o billetes en la bandeja.' })
  const total = answer.pieces.reduce((s, p) => s + p, 0)
  const given = answer.pieces.map(pieceName).join(' + ')
  if (total === ex.price) return res(true, given, expected, { feedback: '¡Muy bien! Has pagado justo.' })
  const feedback = total < ex.price
    ? '¡Casi! Te falta dinero: añade alguna moneda o billete.'
    : '¡Casi! Te has pasado: quita alguna pieza y mira otra vez.'
  return res(false, given, expected, { errorType: 'other', feedback })
}

function checkChange(ex: MoneyChangeExercise, answer: Answer): CheckResult {
  return judgeAmount(ex.answer, answer)
}

function checkAdd(ex: MoneyAddExercise, answer: Answer): CheckResult {
  const r = judgeAmount(ex.answer, answer)
  if (!r.correct && r.errorType === 'other' && r.given !== '?' && r.given !== '') {
    return { ...r, feedback: r.feedback === '¡Casi! Revisa los céntimos: cuenta cuántos faltan para el euro siguiente.'
      ? '¡Casi! Suma primero los céntimos: si pasan de 100, cambia 100 céntimos por 1 €.'
      : r.feedback }
  }
  return r
}

function checkCompare(ex: MoneyCompareExercise, answer: Answer): CheckResult {
  if (answer.type !== 'choice') return res(false, '', ex.answer, { errorType: 'other', feedback: 'Elige una de las dos cosas.' })
  if (answer.value === null) return res(false, '?', ex.answer, { errorType: 'incomplete', feedback: 'Elige una opción.' })
  if (answer.value === ex.answer) return res(true, answer.value, ex.answer, { feedback: '¡Muy bien! Has comparado los precios.' })
  return res(false, answer.value, ex.answer, { errorType: 'other', feedback: '¡Casi! Compara primero los euros de cada precio y, si son iguales, los céntimos.' })
}

function checkConvert(ex: MoneyConvertExercise, answer: Answer): CheckResult {
  if (ex.direction === 'to-euros') {
    const expected = euros(ex.amount)
    const r = judgeAmount(ex.amount, answer)
    if (r.correct) return r
    return { ...r, feedback: '¡Casi! Cada 100 céntimos son 1 €: cuenta cuántos grupos de cien caben, y lo que sobra son céntimos.', expected }
  }
  const expected = String(ex.answer)
  const v = answer.type === 'number' ? answer.value : answer.type === 'numbers' && answer.values.length === 1 ? answer.values[0] : undefined
  if (v === undefined) return res(false, '', expected, { errorType: 'other', feedback: 'Escribe solo el número de céntimos.' })
  if (v === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Escribe el número de céntimos.' })
  if (v === ex.answer) return res(true, String(v), expected, { feedback: '¡Muy bien! Ya sabes cambiar euros por céntimos.' })
  return res(false, String(v), expected, { errorType: 'other', feedback: '¡Casi! Recuerda que un euro tiene cien céntimos.' })
}

/** Grades a money exercise. Pure and deterministic. */
export function checkMoney(ex: Exercise, answer: Answer): CheckResult {
  if (ex.kind !== 'money') return res(false, '', '', { errorType: 'other', feedback: 'Revisa tu respuesta.' })
  switch (ex.mode) {
    case 'recognise': return checkRecognise(ex, answer)
    case 'pay': return checkPay(ex, answer)
    case 'change': return checkChange(ex, answer)
    case 'add': return checkAdd(ex, answer)
    case 'compare': return checkCompare(ex, answer)
    case 'convert': return checkConvert(ex, answer)
  }
}

// ---------------------------------------------------------------- hints

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'] = 'none'): Hint => ({ level, text, visual })

/** Progressive hints for the money exercises. Level 3 works one step and never gives the result. */
export function hintsMoney(ex: Exercise): Hint[] | null {
  if (ex.kind !== 'money') return null
  switch (ex.mode) {
    case 'recognise': return [
      hint(1, 'Mira el número que lleva impreso: ahí está el valor.'),
      hint(2, 'Las monedas pequeñas son de cobre; las de 10, 20 y 50 céntimos son doradas; los billetes son de colores y valen más que las monedas.'),
      hint(3, 'Compara el tamaño y el color con las monedas y billetes que ya conoces.'),
    ]
    case 'pay': return [
      hint(1, 'Empieza por la pieza más grande que quepa en el precio, y sigue con las que faltan.', 'none'),
      hint(2, 'Ve poniendo piezas en la bandeja. Cuando creas que está bien, compruébalo cuenta a cuenta.', 'none'),
      hint(3, 'Si te pasas, toca una pieza de la bandeja para quitarla. Si te quedas corto, añade otra moneda.', 'none'),
    ]
    case 'change': return [
      hint(1, 'Cuenta hacia arriba desde el precio hasta lo que paga, en vez de restar de golpe.'),
      hint(2, 'Primero cuenta los céntimos que faltan para el euro siguiente, y después de euro en euro hasta lo que paga.'),
      hint(3, 'Suma las partes que has contado: los céntimos de la primera parte y los euros de la segunda.'),
    ]
    case 'add': return [
      hint(1, 'Suma primero los euros y después los céntimos.'),
      hint(2, 'Pon los precios uno debajo de otro, con las comas en la misma columna.'),
      hint(3, 'Si los céntimos pasan de cien, cambia cien céntimos por un euro y sigue sumando los euros.'),
    ]
    case 'compare': return [
      hint(1, 'Mira los euros de cada precio: el que tiene más euros es el más caro.'),
      hint(2, 'Si tienen los mismos euros, mira los céntimos.'),
      hint(3, `Pregúntate: ${ex.question === 'more' ? '¿cuál de los dos precios es más alto?' : '¿cuál de los dos precios es más bajo?'} Compara primero los euros.`),
    ]
    case 'convert': return ex.direction === 'to-cents'
      ? [
        hint(1, 'Para pasar de euros a céntimos hay que contar los céntimos de cada euro.'),
        hint(2, 'Cada euro tiene cien céntimos: cuenta cuántos euros hay y después añade los céntimos que ya están escritos.'),
        hint(3, 'Haz dos cuentas: los euros por cien, y después suma los céntimos de la coma.'),
      ]
      : [
        hint(1, 'Agrupa los céntimos de cien en cien: cada grupo de cien es un euro.'),
        hint(2, 'Cuenta cuántos grupos de cien caben: son los euros. Lo que sobra son los céntimos.'),
        hint(3, 'Las dos últimas cifras del número son los céntimos y las de delante son los euros.'),
      ]
  }
}

/** The chosen answer of a money mode, for the grid of the gallery and the tests (kept with the generators). */
export const MONEY_MODES: MoneyMode[] = ['recognise', 'pay', 'change', 'add', 'compare', 'convert']
