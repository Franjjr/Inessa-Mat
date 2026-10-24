/* Cálculo mental exprés and signo igual flexible (PLAN_DOCENTE §5 and §8). Pure: generators, makers, checks and hints.
   Mental items are short answers (no columns): doubles and halves, complements to 10/100/1000, decenas and centenas,
   compensation (+9 = +10 − 1), 4.º: combined operations and their order, brackets, the associative and distributive
   properties, estimating. The equation items are balances: 5 + 3 = __ + 6, 7 = 3 + __; and eq:same asks = or ≠ between
   two expressions. Hints never contain the answer nor a result one trivial step away: level 3 works another example
   with other numbers (or one step with no numbers) and leaves the asked result to the child. */
import type {
  Answer, CheckResult, EqTerm, EquationExercise, Exercise, Hint, MentalExercise, MentalFamily, Rng, SkillKey,
} from '@/types'
import { hashString, pick, randInt, shuffle } from './rng'
import { fmt } from './numeric'
import { MENTAL_FAMILIES, mentalSkill } from './skills'

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'] = 'none'): Hint => ({ level, text, visual })

// ---------------------------------------------------------------- mental

const DIFFICULTY: Record<MentalFamily, number> = {
  dobles: 2, triples: 2, mitades: 2, completar10: 1, completar100: 2, completar1000: 3, decenas: 2, centenas: 2, compensar: 3, por10: 2, romanos: 3,
  combinadas: 2, jerarquia: 3, parentesis: 3, asociativa: 2, distributiva: 3, estimar: 3,
}

/** Makes a mental item; `a` and `b` carry the numbers the hints work with (see mentalHints). `extra` carries the third
 *  number (c) or the rounding place of estimar. */
export function makeMental(
  family: MentalFamily, a: number, b: number, answer: number, prompt: string, extra: { c?: number; place?: 10 | 100 } = {},
): MentalExercise {
  const id = ['mental', family, a, b, extra.c, extra.place].filter((v) => v !== undefined).join(':')
  return { id, kind: 'mental', skill: mentalSkill(family), difficulty: DIFFICULTY[family], family, prompt, a, b, answer, ...extra }
}

const sign = (ex: MentalExercise) => (ex.answer >= ex.a ? '+' : '−')

/** One mental item of a family. Numbers stay small enough to be done in the head. */
function mentalItem(family: MentalFamily, rng: Rng): MentalExercise {
  switch (family) {
    case 'dobles': {
      const n = rng() < 0.3 ? 10 * randInt(rng, 1, 6) : randInt(rng, 2, 60)
      return makeMental(family, n, 0, 2 * n, `¿Cuánto es el doble de ${n}?`)
    }
    case 'triples': {
      // Up to 30, and the tens up to 90: the triple never passes 270.
      const n = rng() < 0.3 ? 10 * randInt(rng, 1, 9) : randInt(rng, 2, 30)
      return makeMental(family, n, 0, 3 * n, `¿Cuánto es el triple de ${n}?`)
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
    case 'combinadas': {
      // a + b − c, from left to right: a + b stays up to 1 000 and the answer is never negative.
      const a = randInt(rng, 10, 890)
      const b = randInt(rng, 10, 1000 - a)
      const c = randInt(rng, 1, Math.min(a + b - 1, 199))
      return makeMental(family, a, b, a + b - c, `${fmt(a)} + ${fmt(b)} − ${fmt(c)} = ?`, { c })
    }
    case 'jerarquia': {
      // a + b × c, or a − b : c: the × or the : goes first. Results up to 200; the division is exact.
      const c = randInt(rng, 2, 9)
      if (rng() < 0.6) {
        const a = randInt(rng, 2, 99)
        const b = randInt(rng, 2, 9)
        return makeMental(family, a, b, a + b * c, `${a} + ${b} × ${c} = ?`, { c })
      }
      const k = randInt(rng, 2, 9)
      const b = c * k
      const a = randInt(rng, k + 1, 99)
      return makeMental(family, a, b, a - k, `${a} − ${b} : ${c} = ?`, { c })
    }
    case 'parentesis': {
      // (a + b) × c: the sum inside the brackets goes first; the result is up to 200.
      const c = randInt(rng, 2, 9)
      const s = randInt(rng, 4, Math.floor(200 / c))
      const a = randInt(rng, 2, s - 2)
      return makeMental(family, a, s - a, s * c, `(${a} + ${s - a}) × ${c} = ?`, { c })
    }
    case 'asociativa': {
      // 5 × y × x with y = 2 or 4: the 5 and the even factor make a round number (10 or 20), then the rest is easy.
      const y = pick(rng, [2, 4])
      const x = pick(rng, [2, 3, 4, 6, 7, 8, 9])
      const [f1, f2, f3] = shuffle(rng, [5, y, x])
      return makeMental(family, y, x, 5 * y * x, `${f1} × ${f2} × ${f3} = ?`)
    }
    case 'distributiva': {
      // a × b = a × t + __, with b = t + u: the blank is the second partial product a × u. u differs from a, and the
      // answer is none of the numbers the hints name (a, b, t), so no level points at it.
      for (;;) {
        const a = randInt(rng, 2, 9)
        const t = 10 * randInt(rng, 1, 4)
        const u = randInt(rng, 1, 9)
        const answer = a * u
        if (u === a || [a, t + u, t].includes(answer)) continue
        return makeMental(family, a, t + u, answer, `${a} × ${t + u} = ${a} × ${t} + __`)
      }
    }
    case 'estimar': {
      // Two numbers rounded to the decena or the centena, then added or subtracted: the answer is the estimate.
      const place = pick(rng, [10, 100] as const)
      const plus = rng() < 0.6
      const lo = place === 10 ? 11 : 101
      const hi = place === 10 ? 99 : 898
      const a = plus ? randInt(rng, lo, hi) : randInt(rng, lo + 1, hi)
      const b = plus ? randInt(rng, lo, Math.min(hi, 999 - a)) : randInt(rng, lo, a - 1)
      const answer = plus ? roundToPlace(a, place) + roundToPlace(b, place) : roundToPlace(a, place) - roundToPlace(b, place)
      const word = place === 10 ? 'decenas' : 'centenas'
      return makeMental(family, a, b, answer, `Estima redondeando a las ${word}: ${fmt(a)} ${plus ? '+' : '−'} ${fmt(b)} = ?`, { place })
    }
  }
}

/** Rounds to the nearest multiple of `place` (halves go up): 47 → 50 with 10, 340 → 300 with 100. */
const roundToPlace = (n: number, place: number) => Math.round(n / place) * place

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
  combinadas: 'Se calcula de izquierda a derecha: primero la primera suma o resta, y con ese resultado la siguiente.',
  jerarquia: 'Primero se multiplica y se divide; después se suma y se resta.',
  parentesis: 'Primero se hace lo que está entre paréntesis; después, lo demás.',
  asociativa: 'Puedes agrupar los factores como quieras: busca los que sean fáciles de juntar.',
  distributiva: 'Un número se puede partir en dos sumandos: multiplicar cada uno por el otro factor y sumar los dos productos da el mismo resultado.',
  estimar: 'Redondea los dos números al lugar que pide el enunciado y opera con los redondeados.',
  dobles: 'Parte el número en decenas y unidades, y dobla cada parte.',
  triples: 'Parte el número en decenas y unidades, y triplica cada parte.',
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

/** Every tuple of the given ranges, in order: the candidates of a worked example. */
function* tuples(...ranges: number[][]): Generator<number[]> {
  if (ranges.length === 0) {
    yield []
    return
  }
  const [first, ...rest] = ranges
  for (const v of first) for (const tail of tuples(...rest)) yield [v, ...tail]
}

/** The numbers from lo to hi, step by step. */
const span = (lo: number, hi: number, step = 1): number[] => Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step)

/** A worked example of level 3 with other numbers: the first candidate that shares no number with the asked item
 *  (its operands, intermediate results and answer). `build` returns null for an example that would not be valid.
 *  With `seed`, one of the free candidates is chosen by it (deterministic per exercise, varied across exercises). */
function workedExample(
  candidates: Iterable<number[]>, asked: number[], build: (t: number[]) => { text: string; nums: number[] } | null, seed?: number,
): string {
  let first: string | null = null
  const free: string[] = []
  for (const t of candidates) {
    const example = build(t)
    if (!example) continue
    if (first === null) first = example.text
    if (example.nums.every((n) => !asked.includes(n))) {
      if (seed === undefined) return example.text
      free.push(example.text)
    }
  }
  if (free.length) return free[seed! % free.length]
  return first ?? ''
}

const DECENAS = span(12, 98)
const CENTENAS = span(120, 980, 10)

/** Hints of a mental item. Level 3 works one step and never writes the final answer. */
export function mentalHints(ex: MentalExercise): Hint[] {
  const { a, b, family } = ex
  const c = ex.c ?? 0
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
    case 'triples': {
      if (a % 10 === 0) {
        return [
          hint(1, 'Para el triple de unas decenas, piensa en cuántas decenas hay.'),
          hint(2, `${fmt(a)} son ${a / 10} decenas. Cuenta el triple de decenas.`),
          hint(3, `Son tres veces ${a / 10} decenas. Cuenta cuántas decenas hay en total.`),
        ]
      }
      if (a < 10) {
        return [
          hint(1, 'El triple es sumar el mismo número tres veces.'),
          hint(2, 'Piensa en el doble y después en uno más: el triple es el doble más otro igual.'),
          hint(3, `Dobla ${a} y después suma otro ${a}: ¿qué número sale?`),
        ]
      }
      const t = a - (a % 10)
      const u = a % 10
      return [
        hint(1, TIP.triples),
        hint(2, `${a} = ${t} + ${u}. Triplica cada parte.`),
        hint(3, 'Triplica las decenas y las unidades por separado, y después suma las dos partes.'),
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
    case 'combinadas': {
      const asked = [a, b, c, a + b, a + b - c]
      const example = workedExample(tuples(span(20, 120, 10), span(20, 120, 10), span(10, 60, 5)), asked, ([x, y, z]) => {
        if (z >= x + y) return null
        return {
          text: `Ejemplo: ${fmt(x)} + ${fmt(y)} − ${fmt(z)}. Primero ${fmt(x)} + ${fmt(y)} = ${fmt(x + y)}; después ${fmt(x + y)} − ${fmt(z)} = ${fmt(x + y - z)}.`,
          nums: [x, y, z, x + y, x + y - z],
        }
      }, hashString(ex.id))
      return [
        hint(1, TIP.combinadas),
        hint(2, `Empieza por ${fmt(a)} + ${fmt(b)}. Después quita ${fmt(c)} al resultado.`),
        hint(3, example),
      ]
    }
    case 'jerarquia': {
      const times = ex.prompt.includes('×')
      const asked = times ? [a, b, c, b * c, a + b * c] : [a, b, c, b / c, a - b / c]
      const example = times
        ? workedExample(tuples(span(11, 29), span(2, 12), span(2, 12)), asked, ([x, y, z]) => ({
          text: `Ejemplo: ${x} + ${y} × ${z}. Primero ${y} × ${z} = ${y * z}; después ${x} + ${y * z} = ${x + y * z}.`,
          nums: [x, y, z, y * z, x + y * z],
        }))
        : workedExample(tuples(span(11, 49), span(2, 9), span(2, 12)), asked, ([x, z, k]) => {
          const y = z * k
          if (x <= k) return null
          return {
            text: `Ejemplo: ${x} − ${y} : ${z}. Primero ${y} : ${z} = ${k}; después ${x} − ${k} = ${x - k}.`,
            nums: [x, y, z, k, x - k],
          }
        })
      return [
        hint(1, TIP.jerarquia),
        hint(2, times ? 'Busca primero la multiplicación: va antes que la suma.' : 'Busca primero la división: va antes que la resta.'),
        hint(3, example),
      ]
    }
    case 'parentesis': {
      const asked = [a, b, c, a + b, (a + b) * c]
      const example = workedExample(tuples(span(11, 29), span(2, 12), span(2, 9)), asked, ([x, y, z]) => ({
        text: `Ejemplo: (${x} + ${y}) × ${z}. Primero ${x} + ${y} = ${x + y}; después ${x + y} × ${z} = ${(x + y) * z}.`,
        nums: [x, y, z, x + y, (x + y) * z],
      }))
      return [
        hint(1, TIP.parentesis),
        hint(2, 'Haz primero la suma de dentro del paréntesis, sin mirar lo que hay fuera.'),
        hint(3, example),
      ]
    }
    case 'asociativa':
      return [
        hint(1, TIP.asociativa),
        hint(2, 'Mira si hay un 5: un 5 y un número par, juntos, dan una decena exacta.'),
        hint(3, 'Agrupa primero el 5 con el número par y multiplica después el resultado por el otro factor.'),
      ]
    case 'distributiva': {
      // The asked item: a × b with b = t + u; the blank is the partial product a × u (u is the units digit of b).
      const u = b % 10
      const t = b - u
      const asked = [a, b, t, u, ex.answer]
      const example = workedExample(tuples(span(11, 19), span(20, 90, 10), span(1, 9)), asked, ([x, tens, v]) => {
        const y = tens + v
        return {
          text: `Ejemplo: ${x} × ${y} = ${x} × ${tens} + ${x} × ${v}. Como ${x} × ${tens} = ${x * tens} y ${x} × ${v} = ${x * v}, el total es ${x * y}.`,
          nums: [x, y, tens, v, x * tens, x * v, x * y],
        }
      })
      return [
        hint(1, TIP.distributiva),
        hint(2, `Parte el ${fmt(b)} en ${t} y otro número; el hueco es lo que da multiplicar ${a} por ese otro número.`),
        hint(3, example),
      ]
    }
    case 'estimar': {
      const place = ex.place ?? 10
      const ra = roundToPlace(a, place)
      const rb = roundToPlace(b, place)
      const plus = ex.prompt.includes(' + ')
      const op = plus ? '+' : '−'
      const word = place === 10 ? 'decenas' : 'centenas'
      const asked = [a, b, ra, rb, ex.answer]
      const candidates = place === 10
        ? tuples(DECENAS, DECENAS)
        : tuples(CENTENAS, CENTENAS)
      const example = workedExample(candidates, asked, ([x, y]) => {
        if (!plus && x <= y) return null
        const rx = roundToPlace(x, place)
        const ry = roundToPlace(y, place)
        const res = plus ? rx + ry : rx - ry
        return {
          text: `Ejemplo: ${fmt(x)} ${op} ${fmt(y)}. Redondeados a las ${word}: ${fmt(rx)} ${op} ${fmt(ry)} = ${fmt(res)}.`,
          nums: [x, y, rx, ry, res],
        }
      })
      return [
        hint(1, TIP.estimar),
        hint(2, place === 10
          ? 'Mira la cifra de las unidades de cada número: de cinco en adelante, la decena sube; si no, se queda.'
          : 'Mira las decenas de cada número: desde cincuenta en adelante, la centena sube; si no, se queda.'),
        hint(3, example),
      ]
    }
  }
}

// ---------------------------------------------------------------- equation

const NUM = (v: EqTerm): v is number => typeof v === 'number'

/** Balanced equation with one blank: 'T = p + q' (blank p or q, sides swapped at random) or 'p + q = r + s'.
 *  mode same: two expressions and the child says = or ≠ (eq:same). */
export function buildEquation(rng: Rng, used: Set<string>, mode: 'fill' | 'same' = 'fill'): EquationExercise {
  const make = () => (mode === 'same' ? sameItem(rng) : equationItem(rng))
  let ex = make()
  for (let i = 0; i < 12 && used.has(ex.id); i++) ex = make()
  return ex
}

/** Two expressions of one operation each, equal or a little apart: 4 + 2 and 9 − 1. Half of them are equal. */
function sameItem(rng: Rng): EquationExercise {
  for (;;) {
    const v = randInt(rng, 2, 40)
    const equal = rng() < 0.5
    const w = equal ? v : v + pick(rng, [-3, -2, -1, 1, 2, 3, 10])
    if (w < 2) continue
    const left = sameExpr(rng, v)
    const right = sameExpr(rng, w)
    const text = (side: EqTerm[]) => side.map(show).join(' ')
    if (text(left) === text(right)) continue
    const id = `equation:same:${text(left)}?${text(right)}`
    return {
      id, kind: 'equation', skill: 'eq:same', difficulty: 2, mode: 'same', left, right, answer: equal ? '=' : '≠',
    }
  }
}

/** A two-term side worth `value` (≥ 2): a sum, or a difference that stays above zero. */
function sameExpr(rng: Rng, value: number): EqTerm[] {
  if (rng() < 0.5) {
    const p = randInt(rng, 1, value - 1)
    return [p, '+', value - p]
  }
  const q = randInt(rng, 1, 15)
  return [value + q, '−', q]
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

/** eq:same: the child taps = or ≠. The feedback never names the right sign. */
function checkSame(ex: EquationExercise, answer: Answer): CheckResult {
  const expected = String(ex.answer)
  if (answer.type !== 'sign') return res(false, '', expected, { errorType: 'other', feedback: 'Elige = o ≠.' })
  if (answer.sign === null) return res(false, '?', expected, { errorType: 'incomplete', feedback: 'Elige el signo: = o ≠.' })
  if (answer.sign === ex.answer) return res(true, answer.sign, expected, { feedback: '¡Muy bien! Has comparado los dos lados.' })
  return res(false, answer.sign, expected, { errorType: 'other', feedback: '¡Casi! Calcula cuánto vale cada lado y compáralos.' })
}

export function checkEquation(ex: EquationExercise, answer: Answer): CheckResult {
  if (ex.mode === 'same') return checkSame(ex, answer)
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

/** eq:same hints: the two sides are worked out one by one. They never say = or ≠, nor whether the sides agree.
 *  The worked example is equal or not by the id's hash (about half each), so it never cues the answer. */
function sameHints(ex: EquationExercise): Hint[] {
  const leftValue = sideValue(ex.left, 0)
  const rightValue = sideValue(ex.right, 0)
  // The worked example uses other numbers and values: none of the asked numbers or side values.
  const asked = [...ex.left, ...ex.right].filter(NUM).concat([leftValue, rightValue])
  const wantEqual = hashString(ex.id) % 2 === 0
  const example = workedExample(tuples(span(2, 12), span(1, 9), span(6, 20), span(1, 9)), asked, ([x, y, r, q]) => {
    if (r - q <= 0 || (x + y === r - q) !== wantEqual) return null
    return {
      text: `Ejemplo con otros números: ${x} + ${y} vale ${x + y}, y ${r} − ${q} vale ${r - q}. Haz lo mismo con los tuyos y compara los dos resultados.`,
      nums: [x, y, r, q, x + y, r - q],
    }
  })
  return [
    hint(1, 'Calcula cuánto vale cada lado por separado, antes de decidir.'),
    hint(2, 'Empieza por el lado de la izquierda: haz sus cuentas y guarda el resultado.'),
    hint(3, example),
  ]
}

function equationHints(ex: EquationExercise): Hint[] {
  if (ex.mode === 'same') return sameHints(ex)
  const complete = ex.left.every((t) => t !== null) ? ex.left : ex.right
  const total = sideValue(complete, 0)
  return [
    hint(1, 'El signo = es una balanza: lo que hay a un lado vale lo mismo que lo que hay al otro.'),
    hint(2, 'Calcula primero el lado que no tiene huecos: ¿cuánto vale?'),
    hint(3, `Ese lado vale ${total}. El otro lado también tiene que valer ${total}: ¿qué número falta?`),
  ]
}
