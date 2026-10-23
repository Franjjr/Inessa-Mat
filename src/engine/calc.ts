/* Cálculo mental exprés and signo igual flexible (PLAN_DOCENTE §5 and §8). Pure: generators, makers, checks and hints.
   Mental items are short answers (no columns): doubles and halves, complements to 10/100/1000, decenas and centenas,
   compensation (+9 = +10 − 1). The equation items are balances: 5 + 3 = __ + 6, 7 = 3 + __.
   Hints never contain the answer: level 3 works one step and leaves the final number to the child. */
import type {
  Answer, CheckResult, EqTerm, EquationExercise, Exercise, Hint, MentalExercise, MentalFamily, Rng, SkillKey,
} from '@/types'
import { pick, randInt, shuffle } from './rng'
import { fmt } from './numeric'
import { MENTAL_FAMILIES, mentalSkill } from './skills'

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'] = 'none'): Hint => ({ level, text, visual })

// ---------------------------------------------------------------- mental

const DIFFICULTY: Record<MentalFamily, number> = {
  dobles: 2, mitades: 2, completar10: 1, completar100: 2, completar1000: 3, decenas: 2, centenas: 2, compensar: 3, por10: 2, romanos: 3,
}

/** Makes a mental item; `a` and `b` carry the numbers the hints work with (see mentalHints). */
export function makeMental(family: MentalFamily, a: number, b: number, answer: number, prompt: string): MentalExercise {
  return {
    id: `mental:${family}:${a}:${b}`, kind: 'mental', skill: mentalSkill(family), difficulty: DIFFICULTY[family],
    family, prompt, a, b, answer,
  }
}

const sign = (ex: MentalExercise) => (ex.answer >= ex.a ? '+' : '−')

/** One mental item of a family. Numbers stay small enough to be done in the head. */
function mentalItem(family: MentalFamily, rng: Rng): MentalExercise {
  switch (family) {
    case 'dobles': {
      const n = rng() < 0.3 ? 10 * randInt(rng, 1, 6) : randInt(rng, 2, 60)
      return makeMental(family, n, 0, 2 * n, `¿Cuánto es el doble de ${n}?`)
    }
    case 'mitades': {
      const n = 2 * randInt(rng, 1, 49)
      return makeMental(family, n, 0, n / 2, `¿Cuánto es la mitad de ${n}?`)
    }
    case 'completar10': {
      const n = rng() < 0.2 ? 10 * randInt(rng, 1, 9) : randInt(rng, 1, 99)
      const target = (Math.floor(n / 10) + 1) * 10
      return makeMental(family, n, target, target - n, `¿Cuánto le falta a ${n} para llegar a ${target}?`)
    }
    case 'completar100': {
      const n = rng() < 0.5 ? 10 * randInt(rng, 1, 9) : randInt(rng, 11, 99)
      return makeMental(family, n, 100, 100 - n, `¿Cuánto le falta a ${n} para llegar a 100?`)
    }
    case 'completar1000': {
      const n = rng() < 0.7 ? 10 * randInt(rng, 11, 99) : 100 * randInt(rng, 1, 9)
      return makeMental(family, n, 1000, 1000 - n, `¿Cuánto le falta a ${fmt(n)} para llegar a 1 000?`)
    }
    case 'decenas': {
      const a = 10 * randInt(rng, 10, 88)
      const plus = rng() < 0.5
      const b = 10 * randInt(rng, 2, 9)
      const answer = plus ? a + b : a - b
      return makeMental(family, a, b, answer, `${fmt(a)} ${plus ? '+' : '−'} ${b} = ?`)
    }
    case 'centenas': {
      const a = 10 * randInt(rng, 10, 88)
      const h = Math.floor(a / 100)
      const plus = h < 9 && (h < 2 || rng() < 0.5)
      const k = plus ? randInt(rng, 1, 9 - h) : randInt(rng, 1, h - 1)
      const b = 100 * k
      const answer = plus ? a + b : a - b
      return makeMental(family, a, b, answer, `${fmt(a)} ${plus ? '+' : '−'} ${b} = ?`)
    }
    case 'compensar': {
      const b = rng() < 0.5 ? 9 : 19
      const plus = rng() < 0.6
      const a = plus ? randInt(rng, 11, 89) : randInt(rng, b + 2, 89)
      const answer = plus ? a + b : a - b
      return makeMental(family, a, b, answer, `${a} ${plus ? '+' : '−'} ${b} = ?`)
    }
    case 'por10': {
      // a × b or (a × b) : b, with b = 10, 100 or 1 000; the result stays in 4 digits.
      const b = pick(rng, [10, 10, 100, 100, 1000])
      const a = b === 10 ? randInt(rng, 2, 99) * (rng() < 0.3 ? 10 : 1) : b === 100 ? randInt(rng, 2, 99) : randInt(rng, 2, 9)
      // 10, 100 and 1 000 are named in the hints: they are never the answer.
      if (a * b > 9999 || [10, 100, 1000].includes(a) || [10, 100, 1000].includes(a * b)) return mentalItem(family, rng)
      if (rng() < 0.65) return makeMental(family, a, b, a * b, `${fmt(a)} × ${fmt(b)} = ?`)
      return makeMental(family, a * b, b, a, `${fmt(a * b)} : ${fmt(b)} = ?`)
    }
    case 'romanos': {
      // A single letter (I, V, X, L, C) is its own value in the hints: never asked alone.
      const n = rng() < 0.4 ? randInt(rng, 2, 20) : randInt(rng, 21, 99)
      if ([5, 10, 50].includes(n)) return mentalItem(family, rng)
      return makeMental(family, n, 0, n, `¿Qué número es ${toRoman(n)}?`)
    }
  }
}

const ROMAN: [number, string][] = [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]

/** 47 → 'XLVII' (1..399). */
export function toRoman(n: number): string {
  let out = ''
  let rest = n
  for (const [v, s] of ROMAN) while (rest >= v) { out += s; rest -= v }
  return out
}

/** The pieces a Roman numeral is read in, from the left: 'XLVII' → ['XL', 'V', 'I', 'I']. */
function romanPieces(r: string): string[] {
  const pieces: string[] = []
  let rest = r
  while (rest) {
    const hit = ROMAN.find(([, s]) => rest.startsWith(s))!
    pieces.push(hit[1])
    rest = rest.slice(hit[1].length)
  }
  return pieces
}

/** A mental item of one of the families (the skill fixes the family). */
export function buildMental(family: MentalFamily, rng: Rng, used: Set<string>): MentalExercise {
  let ex = mentalItem(family, rng)
  for (let i = 0; i < 12 && used.has(ex.id); i++) ex = mentalItem(family, rng)
  return ex
}

export function mentalSkillsOf(): SkillKey[] {
  return MENTAL_FAMILIES.map(mentalSkill)
}

const TIP: Record<MentalFamily, string> = {
  dobles: 'Parte el número en decenas y unidades, y dobla cada parte.',
  mitades: 'Reparte el número en dos partes iguales: primero las decenas, luego las unidades.',
  completar10: 'Cuenta hasta el número redondo: primero las unidades, luego las decenas.',
  completar100: 'Completa primero hasta la decena siguiente y después hasta 100.',
  completar1000: 'Cuenta de cien en cien hasta 1 000.',
  decenas: 'Cambian solo las decenas: las unidades se quedan igual.',
  centenas: 'Cambian solo las centenas: las decenas y las unidades se quedan igual.',
  compensar: 'Usa el número redondo cercano y después corrige con 1.',
  por10: 'Multiplicar por 10 es poner un cero a la derecha; por 100, dos ceros; por 1 000, tres. Dividir los quita.',
  romanos: 'I vale 1, V vale 5, X vale 10, L vale 50 y C vale 100.',
}

/** Hints of a mental item. Level 3 works one step and never writes the final answer. */
export function mentalHints(ex: MentalExercise): Hint[] {
  const { a, b, family } = ex
  switch (family) {
    case 'dobles': {
      if (a % 10 === 0) {
        return [
          hint(1, 'Para el doble de unas decenas, piensa en cuántas decenas hay.'),
          hint(2, `${fmt(a)} son ${a / 10} decenas. Cuenta el doble de decenas.`),
          hint(3, `Dobla las decenas: ${a / 10} decenas + ${a / 10} decenas = ? decenas.`),
        ]
      }
      if (a < 10) {
        return [
          hint(1, 'Doblar un número es sumarlo consigo mismo.'),
          hint(2, `${a} + ${a}: ¿cuánto da?`),
          hint(3, `Cuenta: ${a} y otros ${a} más. ¿Cuánto da ${a} + ${a}?`),
        ]
      }
      const t = a - (a % 10)
      const u = a % 10
      return [
        hint(1, TIP.dobles),
        hint(2, `${a} = ${t} + ${u}. Dobla cada parte.`),
        hint(3, `Dobla las decenas: ${t} + ${t} = ?. Después dobla las unidades: ${u} + ${u}.`),
      ]
    }
    case 'mitades': {
      if (a % 10 === 0) {
        return [
          hint(1, 'Para la mitad de unas decenas, piensa en cuántas decenas hay y repártelas.'),
          hint(2, `${fmt(a)} son ${a / 10} decenas. Repártelas entre dos.`),
          hint(3, 'Si sobra una decena, cámbiala por unidades y sigue repartiendo.'),
        ]
      }
      if (a < 10) {
        return [
          hint(1, 'Repartir en dos mitades es dar lo mismo a cada parte.'),
          hint(2, `Haz dos montones iguales con ${a} objetos.`),
          hint(3, `Cada montón: ${a} entre 2 = ?`),
        ]
      }
      const t = a - (a % 10)
      const u = a % 10
      return [
        hint(1, TIP.mitades),
        hint(2, `${a} = ${t} + ${u}. Reparte cada parte entre dos.`),
        hint(3, `La mitad de ${t} es ${t / 2}. Ahora la mitad de ${u}: ¿cuánto es?`),
      ]
    }
    case 'completar10': {
      const u = a % 10
      if (u === 0) {
        return [
          hint(1, TIP.completar10),
          hint(2, `${a} ya es una decena exacta. Mira cuál es la siguiente.`),
          hint(3, `Cuenta de uno en uno desde ${a} hasta ${b}: ¿cuántos números dices?`),
        ]
      }
      return [
        hint(1, TIP.completar10),
        hint(2, `${a} tiene ${u} unidades. ¿Cuánto le falta a ${u} para llegar a 10?`),
        hint(3, `${u} + ? = 10. Ese número es lo que le falta a ${a} para llegar a ${b}.`),
      ]
    }
    case 'completar100': {
      const next = Math.ceil(a / 10) * 10
      return [
        hint(1, TIP.completar100),
        hint(2, next === a ? `Desde ${a}, cuenta decenas hasta 100: ¿cuántas decenas hay?` : `Primero, ¿cuánto le falta a ${a} para la decena siguiente, ${next}?`),
        hint(3, `Desde ${next} cuenta decena a decena hasta 100. ¿Cuántas decenas son?`),
      ]
    }
    case 'completar1000': {
      const nextCent = Math.ceil(a / 100) * 100
      return [
        hint(1, TIP.completar1000),
        hint(2, `Cuenta de cien en cien desde ${fmt(a)} hasta 1 000: ¿cuántas centenas hay?`),
        hint(3, nextCent === a
          ? `Desde ${fmt(a)} cuenta centena a centena hasta 1 000. ¿Cuántas centenas son?`
          : `Primero llega a ${fmt(nextCent)} y después cuenta centenas hasta 1 000.`),
      ]
    }
    case 'decenas': {
      const op = sign(ex)
      return [
        hint(1, TIP.decenas),
        hint(2, `${fmt(a)} tiene ${a / 10} decenas. Cambia solo las decenas.`),
        hint(3, `Haz la cuenta con las decenas: ${a / 10} ${op} ${b / 10} = ? decenas.`),
      ]
    }
    case 'centenas': {
      const op = sign(ex)
      return [
        hint(1, TIP.centenas),
        hint(2, `${fmt(a)} tiene ${Math.floor(a / 100)} centenas. Cambia solo las centenas.`),
        hint(3, `Haz la cuenta con las centenas: ${Math.floor(a / 100)} ${op} ${b / 100} = ? centenas.`),
      ]
    }
    case 'compensar': {
      const plus = sign(ex) === '+'
      const round = b + 1
      return [
        hint(1, plus ? `Sumar ${b} es sumar ${round} y quitar 1.` : `Restar ${b} es restar ${round} y sumar 1.`),
        hint(2, `${a} ${plus ? '+' : '−'} ${round} = ?. Después ${plus ? 'quita' : 'suma'} 1.`),
        hint(3, `Tienes ${plus ? a + round : a - round} y ${plus ? 'quitas' : 'sumas'} 1. ¿Cuánto queda?`),
      ]
    }
    case 'por10': {
      // The count of zeros in words: a digit could be the answer itself (3 000 : 1 000).
      const zeros = ['', 'un cero', 'dos ceros', 'tres ceros'][String(b).length - 1]
      const times = ex.prompt.includes('×')
      return [
        hint(1, TIP.por10),
        hint(2, times ? `Por ${fmt(b)} se ponen ${zeros} a la derecha.` : `Entre ${fmt(b)} se quitan ${zeros} de la derecha.`),
        hint(3, times ? `Escribe ${fmt(a)} y después ${zeros === 'un cero' ? 'el cero' : 'los ceros'}.` : `Tapa con el dedo ${zeros === 'un cero' ? 'el último cero' : `los ${zeros.replace(' ceros', '')} últimos ceros`} de ${fmt(a)} y lee lo que queda.`),
      ]
    }
    case 'romanos': {
      const pieces = romanPieces(toRoman(a))
      return [
        hint(1, TIP.romanos),
        hint(2, `Si una letra pequeña va delante de una más grande, se resta: ${[4, 40].includes(a) ? 'IX es 9 y XC es 90' : 'IV es 4 y XL es 40'}.`),
        hint(3, `Lee por trozos, de izquierda a derecha: ${pieces.join(' + ')}. Después suma los trozos.`),
      ]
    }
  }
}

// ---------------------------------------------------------------- equation

const NUM = (v: EqTerm): v is number => typeof v === 'number'

/** Balanced equation with one blank: 'T = p + q' (blank p or q, sides swapped at random) or 'p + q = r + s'. */
export function buildEquation(rng: Rng, used: Set<string>): EquationExercise {
  let ex = equationItem(rng)
  for (let i = 0; i < 12 && used.has(ex.id); i++) ex = equationItem(rng)
  return ex
}

function equationItem(rng: Rng): EquationExercise {
  const shape = rng()
  if (shape < 0.45) {
    // Single side against two terms: 7 = 3 + __, 9 = 12 − __, __ + 4 = 10.
    const minus = rng() < 0.35
    let p: number
    let q: number
    let total: number
    if (minus) {
      p = randInt(rng, 5, 20)
      q = randInt(rng, 1, p - 1)
      total = p - q
    } else {
      p = randInt(rng, 1, 15)
      q = randInt(rng, 1, 15)
      total = p + q
    }
    const blankFirst = rng() < 0.5
    const answer = blankFirst ? p : q
    const sumTerms: EqTerm[] = blankFirst ? [null, minus ? '−' : '+', q] : [p, minus ? '−' : '+', null]
    // The one-number side must not give the blank away (9 = 12 − 3 is fine, 6 = 12 − 6 is not).
    if (answer === total) return equationItem(rng)
    const single: EqTerm[] = [total]
    return rng() < 0.5 ? mk(single, sumTerms, answer) : mk(sumTerms, single, answer)
  }
  // Two sides with two terms: 5 + 3 = __ + 6 (both sides total the same).
  const total = randInt(rng, 4, 20)
  const r = randInt(rng, 1, total - 1)
  const s = total - r
  const p = randInt(rng, 1, total - 1)
  const q = total - p
  // Each side keeps its own pair (p + q on one side, r + s on the other), in a random order.
  const [a1, a2] = shuffle(rng, [p, q])
  const [b1, b2] = shuffle(rng, [r, s])
  const left: EqTerm[] = [a1, '+', a2]
  const right: EqTerm[] = [b1, '+', b2]
  // One of the four numbers becomes the blank: left[0], left[2], right[0] or right[2].
  const slots: [EqTerm[], number][] = [[left, 0], [left, 2], [right, 0], [right, 2]]
  const [side, idx] = slots[randInt(rng, 0, 3)]
  const answer = side[idx] as number
  side[idx] = null
  return mk(left, right, answer)
}

function mk(left: EqTerm[], right: EqTerm[], answer: number): EquationExercise {
  const id = `equation:${[...left].map(show).join(' ')}=${[...right].map(show).join(' ')}`
  return {
    id, kind: 'equation', skill: 'eq:flex', difficulty: 2, left: [...left], right: [...right], answer,
  }
}

const show = (t: EqTerm) => (t === null ? '?' : typeof t === 'number' ? String(t) : t)

/** Value of one side with the blank filled by `x`. */
function sideValue(side: EqTerm[], x: number): number {
  let total = 0
  let op: '+' | '−' = '+'
  for (const t of side) {
    if (t === '+' || t === '−') op = t
    else {
      const v = t === null ? x : t
      total = op === '+' ? total + v : total - v
    }
  }
  return total
}

/** Whether the equation holds with the blank = x. */
export function holds(ex: EquationExercise, x: number): boolean {
  return sideValue(ex.left, x) === sideValue(ex.right, x)
}

// ---------------------------------------------------------------- checks

const res = (correct: boolean, given: string, expected: string, extra: Partial<CheckResult> = {}): CheckResult =>
  ({ correct, given, expected, ...extra })

export function checkMental(ex: MentalExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  if (answer.type !== 'number') return res(false, '', expected, { errorType: 'other', feedback: 'Escribe solo el número.' })
  if (answer.value === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Escribe el número.' })
  const v = answer.value
  const given = String(v)
  if (v === ex.answer) return res(true, given, expected, { feedback: '¡Muy bien, de cabeza!' })
  const near = Math.abs(v - ex.answer) === 1
  const feedback = near ? `¡Casi! Revisa la cuenta: ${TIP[ex.family]}` : `¡Casi! ${TIP[ex.family]}`
  return res(false, given, expected, { errorType: near ? 'fact' : 'other', feedback })
}

export function checkEquation(ex: EquationExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  if (answer.type !== 'number') return res(false, '', expected, { errorType: 'other', feedback: 'Escribe el número que falta.' })
  if (answer.value === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Escribe el número que falta.' })
  const v = answer.value
  const given = String(v)
  if (v === ex.answer) return res(true, given, expected, { feedback: '¡Muy bien! Los dos lados valen lo mismo.' })
  const visible = [...ex.left, ...ex.right].filter(NUM).reduce((s, n) => s + n, 0)
  const feedback = v === visible
    ? '¡Casi! Has sumado todos los números. El signo = pide que los dos lados valgan lo mismo.'
    : '¡Casi! Calcula primero el lado que está completo. Después mira qué número hace que el otro lado valga lo mismo.'
  return res(false, given, expected, { errorType: v === visible ? 'operation' : 'other', feedback })
}

/** Check of the calc kinds (mental and equation). */
export function checkCalc(ex: Exercise, answer: Answer): CheckResult | null {
  if (ex.kind === 'mental') return checkMental(ex, answer)
  if (ex.kind === 'equation') return checkEquation(ex, answer)
  return null
}

export function hintsCalc(ex: Exercise): Hint[] | null {
  if (ex.kind === 'mental') return mentalHints(ex)
  if (ex.kind === 'equation') return equationHints(ex)
  return null
}

function equationHints(ex: EquationExercise): Hint[] {
  const complete = ex.left.every((t) => t !== null) ? ex.left : ex.right
  const total = sideValue(complete, 0)
  return [
    hint(1, 'El signo = es una balanza: lo que hay a un lado vale lo mismo que lo que hay al otro.'),
    hint(2, 'Calcula primero el lado que no tiene huecos: ¿cuánto vale?'),
    hint(3, `Ese lado vale ${total}. El otro lado también tiene que valer ${total}: ¿qué número falta?`),
  ]
}
