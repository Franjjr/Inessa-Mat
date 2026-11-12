/* The workbook "tricks" (los trucos de Lumi) for every multiplication fact 1..10 × 1..10.
   The text depends on the orientation shown to the child: 6 × 7 is "el 5 y uno más", while 7 × 6 is
   "el espejo" of 6 × 7 (learnt in the Cave), exactly as the workbook's world-6 table explains.
   Rules for every text: the strategy (hint 1) and the visuals never name the product, and the worked step (hint 3)
   ends in «= ?», so FactView can put the answer in that «?» when the child copies it. The three hints of a fact use one
   single trick: its rule, the drawing of that rule and the worked step of that rule (never the rule of one trick and the
   worked step of another). A favourite trick of the child (trickDetail) replaces the whole set, not only the first hint. */
import type { FactStrategy, Hint, HintVisual, TableMethod } from '@/types'
import { TABLE_METHODS } from './methods'

type Params = NonNullable<Hint['params']>

export interface StrategyDetail {
  strategy: FactStrategy
  /** Params for the strategy visual (hint level 2). */
  visualParams: Params
  /** Caption describing the visual (hint level 2). */
  visualText: string
  /** Worked step that leaves only the final answer for the child (hint level 3). */
  workedText: string
  workedVisual: HintVisual
  /** Params for the worked-step visual when it differs from the level-2 one. */
  workedParams?: Params
  /** For 'mirror': the oriented fact whose trick is being reused. */
  mirrorOf?: [number, number]
}

const EASY_ONE = 'Por 1 es facilísimo: el número se queda igual.'

function detail(a: number, b: number, allowMirror = true): StrategyDetail {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  // ---- easy tables first (×1, ×10, ×2, ×5)
  if (lo === 1) {
    return {
      strategy: { id: 'easy-one', text: EASY_ONE, visual: 'groups' },
      visualParams: { groups: a, perGroup: b },
      visualText: a === 1 ? `Mira: solo hay 1 grupo de ${b}.` : `Mira: ${a} grupos de 1.`,
      workedText: `Por 1, el número se queda igual: ${a} × ${b} = ?`,
      workedVisual: 'groups',
    }
  }
  if (a === 10 || b === 10) {
    const n = a === 10 ? b : a
    return {
      strategy: { id: 'ten', text: `Por 10, pon un 0 detrás del ${n}.`, visual: 'skip-count' },
      // The last chip is «?»: the jumps up to the one before the product, never the product itself.
      visualParams: { step: 10, count: n, index: n - 1, blank: 1 },
      visualText: 'Por 10 es contar de 10 en 10. Todos los números de esa cuenta acaban en 0.',
      workedText: `${a} × ${b}: escribe el ${n} y pon un 0 a su derecha. ${a} × ${b} = ?`,
      workedVisual: 'place-value',
    }
  }
  if (lo === 2) {
    const n = a === 2 ? b : a
    return doubleOf(n, a, b)
  }
  // ---- special tricks of the 7 table, and the 3 × 3 and 8 × 8 tricks
  if (lo === 7 && hi === 7) {
    return {
      strategy: { id: 'square-rhyme', text: 'Piensa en 7 × 5 y en 7 × 2, y súmalos.', visual: 'array' },
      visualParams: { rows: 7, cols: 7 },
      visualText: 'Mira el cuadrado: 7 filas de 7. Parte las filas en 5 y 2.',
      workedText: '7 × 7 = 7 × 5 + 7 × 2 = 35 + 14 = ?',
      workedVisual: 'array',
    }
  }
  if (lo === 7 && hi === 8) {
    return {
      // As 7 × 7: the 8 split in 5 and 3 (the rhyme «5, 6, 7, 8» is the answer itself, so it is sung, never a hint).
      strategy: { id: 'five-six-seven-eight', text: 'Parte el 8 en 5 y 3: piensa en 7 × 5 y en 7 × 3, y súmalos.', visual: 'array' },
      visualParams: { rows: 7, cols: 8 },
      visualText: 'Mira: 7 filas de 8. Parte cada fila en 5 y 3.',
      workedText: '7 × 8 = 7 × 5 + 7 × 3 = 35 + 21 = ?',
      workedVisual: 'array',
    }
  }
  if (lo === 3 && hi === 7) {
    return {
      strategy: { id: 'weeks', text: 'Una semana tiene 7 días: ¿cuántos días hay en 3 semanas?', visual: 'array' },
      visualParams: { rows: 3, cols: 7 },
      visualText: 'Mira el calendario: 3 semanas de 7 días.',
      workedText: '7 + 7 + 7 = 14 + 7 = ?',
      workedVisual: 'array',
    }
  }
  if (lo === 3 && hi === 3) {
    return {
      strategy: { id: 'double-and-one', text: 'El doble de 3, y otro 3 más.', visual: 'groups' },
      visualParams: { groups: 3, perGroup: 3 },
      visualText: 'Mira: 3 grupos de 3. Dos grupos son el doble de 3, y queda otro 3.',
      workedText: 'El doble de 3 es 3 + 3 = 6. Y 6 + 3 = ?',
      workedVisual: 'groups',
      workedParams: { groups: 3, perGroup: 3 },
    }
  }
  if (lo === 8 && hi === 8) {
    return {
      strategy: { id: 'ten-minus-two', text: 'Diez veces el 8, y quita dos veces el 8.', visual: 'double-chain' },
      // One doubling only: the chain shows 8 → 16 and never the product.
      visualParams: { start: 8, steps: 1 },
      visualText: 'Mira: dos veces el 8 es 16. Ahora piensa en diez veces el 8.',
      workedText: '8 × 10 = 80, y 8 × 2 = 16. 80 − 16 = ?',
      workedVisual: 'double-chain',
      workedParams: { start: 8, steps: 1 },
    }
  }
  if (a === 5 || b === 5) {
    const n = a === 5 ? b : a
    const seq = Array.from({ length: n - 1 }, (_, i) => 5 * (i + 1)).join(', ')
    const before = 5 * (n - 1)
    return {
      // One trick for the three hints: counting in fives (the rule, the jumps drawn, the jumps worked).
      strategy: { id: 'five', text: `Cuenta de 5 en 5, ${n} veces. En la tabla del 5 todo acaba en 0 o en 5.`, visual: 'skip-count' },
      // One chip less than the jumps: the last one is the answer, and it is not drawn.
      visualParams: { step: 5, count: n - 1 },
      visualText: 'Cuenta de 5 en 5: cada salto vale 5.',
      workedText: `${n} saltos de 5: ${seq}… y uno más: ${before} + 5 = ?`,
      workedVisual: 'skip-count',
    }
  }
  if (a === 9 || b === 9) {
    const n = a === 9 ? b : a
    // The trick of the lesson «El truco del 9»: one less in front, and the two digits add up to 9.
    return {
      strategy: { id: 'nine-trick', text: `Empieza por uno menos que ${n} (el ${n - 1}) y las dos cifras suman 9.`, visual: 'nine-trick' },
      visualParams: { a: n },
      visualText: `La primera cifra es uno menos que ${n}: el ${n - 1}. La segunda es la que suma 9 con el ${n - 1}.`,
      workedText: `Uno menos que ${n} es ${n - 1}, y ${n - 1} + ${10 - n} = 9. Junta las dos cifras: ${a} × ${b} = ?`,
      workedVisual: 'nine-trick',
    }
  }
  // ---- the 6 table (Cueva del Seis)
  if (a === 6 && b !== 6 && b % 2 === 1) return fivePlusOne(b)
  if (a === 6 && b % 2 === 0) return evenSix(b)
  // ---- 4 and 8: doubling chains (a×4 → doble y doble; ×8 → doble, doble y doble)
  if (a === 4) return doubling(b, 2)
  if (a === 8 && b !== 6) return doubling(b, 3)
  if (b === 4 && a !== 6) return doubling(a, 2)
  if (b === 8 && a !== 6) return doubling(a, 3)
  // ---- remaining reversed 6 facts: 3 × 6, 7 × 6, 8 × 6 → the mirror of the Cave's trick
  if (b === 6 && allowMirror) {
    const inner = detail(6, a, false)
    // The mirror turns the fact round and then uses the trick of 6 × a for all three hints (rule, drawing, worked step).
    return {
      strategy: {
        id: 'mirror',
        text: `El espejo: ${a} × 6 es lo mismo que 6 × ${a}. ${inner.strategy.text}`,
        visual: inner.strategy.visual,
      },
      visualParams: inner.visualParams,
      visualText: `Con el espejo, ${a} × 6 es 6 × ${a}. ${inner.visualText}`,
      workedText: `${a} × 6 es 6 × ${a}. ${inner.workedText}`,
      workedVisual: inner.workedVisual,
      workedParams: inner.workedParams ?? inner.visualParams,
      mirrorOf: [6, a],
    }
  }
  // Only the factors outside the tables reach here: count in groups.
  return {
    strategy: { id: 'known', text: `Cuenta de ${lo} en ${lo}: ${lo}, ${lo * 2}…`, visual: 'groups' },
    visualParams: { groups: a, perGroup: b },
    visualText: `Mira: ${a} grupos de ${b}.`,
    workedText: `${Array.from({ length: a }, () => String(b)).join(' + ')} = ?`,
    workedVisual: 'groups',
  }
}

function doubleOf(n: number, a: number, b: number): StrategyDetail {
  return {
    strategy: { id: 'double', text: `Es el doble: suma ${n} + ${n}.`, visual: 'groups' },
    visualParams: { groups: 2, perGroup: n },
    visualText: `El doble: dos grupos iguales de ${n}.`,
    workedText: `El doble de ${n} es ${n} + ${n}. ${a} × ${b} = ?`,
    workedVisual: 'groups',
  }
}

function fivePlusOne(n: number): StrategyDetail {
  return {
    strategy: { id: 'five-plus-one', text: `El 5 y uno más: 5 × ${n} + ${n}.`, visual: 'dots-five-plus-one' },
    visualParams: { a: 6, b: n },
    visualText: `Mira los puntos: 5 filas de ${n} (eso es 5 × ${n}) y una fila más de ${n}.`,
    workedText: `5 × ${n} = ${5 * n}. Y una fila más: ${5 * n} + ${n} = ?`,
    workedVisual: 'dots-five-plus-one',
  }
}

/* The 6 with an even factor: 6 × n = (the half of n, in front) + (n, behind), true for n = 2, 4, 6 and 8. The trick
   names the half and the number, never the product; its drawing is the rhyme itself (front and back), not the dots. */
function evenSix(n: number): StrategyDetail {
  return {
    strategy: {
      id: 'even-six-rhyme',
      text: `Con el 6 y un número par: la mitad de ${n} va delante y el ${n} detrás.`,
      visual: 'words',
    },
    visualParams: { words: [`delante, la mitad de ${n}`, `detrás, el ${n}`] },
    visualText: `Delante va la mitad de ${n}. Detrás va el ${n}.`,
    workedText: `La mitad de ${n} es ${n / 2}. Pon el ${n / 2} delante del ${n}: 6 × ${n} = ?`,
    workedVisual: 'words',
  }
}

/* Doubling chains: `steps` doublings of the factor n give the fact (×4: two, ×8: three). The visuals and the worked
   step show one doubling less than the product, so the answer is never on the drawing. */
function doubling(n: number, steps: 2 | 3): StrategyDetail {
  const last = n * 2 ** (steps - 1)
  const scaffold = { start: n, steps: steps - 1 }
  if (steps === 2) {
    return {
      strategy: { id: 'double-double', text: `Doble y doble: ${n} → ${n * 2} → …`, visual: 'double-chain' },
      visualParams: scaffold,
      visualText: `Dobla el ${n}: cada número es el doble del anterior.`,
      workedText: `El doble de ${n} es ${n * 2}. Y el doble de ${last}: ${last} + ${last} = ?`,
      workedVisual: 'double-chain',
      workedParams: scaffold,
    }
  }
  return {
    strategy: { id: 'double-double-double', text: `Doble, doble y doble: ${n} → ${n * 2} → ${n * 4} → …`, visual: 'double-chain' },
    visualParams: scaffold,
    visualText: `Dobla el ${n} tres veces, como el pulpo Octavio: cada número es el doble del anterior.`,
    workedText: `${n} → ${n * 2} → ${last}. Y el doble de ${last}: ${last} + ${last} = ?`,
    workedVisual: 'double-chain',
    workedParams: scaffold,
  }
}

/** Full strategy detail used by hints. Factors outside 1..10 fall back to repeated addition. */
export function strategyDetail(a: number, b: number): StrategyDetail {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < 1 || a > 10 || b > 10) {
    return {
      strategy: { id: 'known', text: `Piensa en ${a} grupos de ${b}.`, visual: 'groups' },
      visualParams: { groups: a, perGroup: b },
      visualText: `Mira: ${a} grupos de ${b}.`,
      workedText: `${a} × ${b} = ?`,
      workedVisual: 'groups',
    }
  }
  return detail(a, b)
}

const has = (a: number, b: number, n: number) => a === n || b === n

/**
 * The three hints of a fact worked with the child's favourite trick (ChildSettings.tableMethod, or the trick a lesson
 * teaches): the rule, the drawing of that rule and the worked step of that rule. Null when the trick does not apply to
 * the fact (a 9 trick for 6 × 7): the engine's own strategy is used then. The `strategy` keeps the engine's id, so the
 * praise and the report still name the fact's trick.
 */
export function trickDetail(method: TableMethod | null | undefined, a: number, b: number): StrategyDetail | null {
  const trick = method ? TABLE_METHODS.find((t) => t.id === method) : undefined
  if (!trick || !trick.applies(a, b)) return null
  const base = strategyDetail(a, b).strategy
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const other = (k: number) => (a === k ? b : a)
  const withText = (d: StrategyDetail, text: string): StrategyDetail => ({ ...d, strategy: { ...base, text, visual: d.strategy.visual } })
  switch (trick.id) {
    case 'double': {
      const n = other(2)
      return withText(doubleOf(n, a, b), `Es el doble: suma ${n} + ${n}.`)
    }
    case 'double-double': {
      const k = has(a, b, 4) ? 4 : 8
      const n = other(k)
      const d = doubling(n, k === 4 ? 2 : 3)
      return withText(d, k === 4 ? `Doble y doble: dobla el ${n} dos veces.` : `Doble, doble y doble: dobla el ${n} tres veces.`)
    }
    case 'half-ten': {
      const n = other(5)
      // 2 × 5 is 10 itself: «la mitad del 10» would say the answer. The double (the engine's strategy) explains it.
      if (n === 2) return null
      return {
        strategy: { ...base, text: `Con el 5: multiplica el ${n} por diez y toma la mitad.`, visual: 'skip-count' },
        visualParams: { step: 10, count: n },
        visualText: `Mira: ${n} veces 10. El 5 es la mitad del 10, así que el resultado es la mitad.`,
        workedText: `${n} × 10 = ${n * 10}. La mitad de ${n * 10}: ${n * 10} : 2 = ?`,
        workedVisual: 'skip-count',
      }
    }
    case 'ten-minus-one': {
      const n = other(9)
      return {
        strategy: { ...base, text: `Con el 9: calcula ${n} × 10 y quita un ${n}.`, visual: 'skip-count' },
        visualParams: { step: 10, count: n },
        visualText: `Mira: ${n} veces 10 es ${n * 10}. El 9 es uno menos que el 10: quita un ${n}.`,
        workedText: `${n} × 10 = ${n * 10}. ${n * 10} − ${n} = ?`,
        workedVisual: 'skip-count',
      }
    }
    case 'five-plus-one': {
      const k = has(a, b, 6) ? 6 : 7
      const n = other(k)
      if (k === 6) return withText(fivePlusOne(n), `Cinco veces el ${n}, y una vez más el ${n}.`)
      return {
        strategy: { ...base, text: `Cinco veces el ${n}, y dos veces más el ${n}.`, visual: 'dots-five-plus-one' },
        visualParams: { a: 7, b: n },
        visualText: `Mira los puntos: 5 filas de ${n} (eso es 5 × ${n}) y dos filas más de ${n}.`,
        workedText: `5 × ${n} = ${5 * n}. Y dos filas más: ${n} + ${n} = ${2 * n}. ${5 * n} + ${2 * n} = ?`,
        workedVisual: 'dots-five-plus-one',
      }
    }
    case 'mirror': {
      const before = lo * (hi - 1)
      return {
        strategy: { ...base, text: `Dale la vuelta: ${b} × ${a} da lo mismo. Piensa en la tabla del ${lo}.`, visual: 'array' },
        visualParams: { rows: b, cols: a },
        visualText: `Gira las filas: ${b} × ${a} da lo mismo que ${a} × ${b}.`,
        workedText: `${b} × ${a} da lo mismo. En la tabla del ${lo}: ${lo} × ${hi - 1} = ${before}, y un ${lo} más: ${before} + ${lo} = ?`,
        workedVisual: 'array',
      }
    }
  }
}

/** The workbook "trick" for a multiplication fact (6×7 → five-plus-one, 8×n → double-double-double, ...). */
export function strategyForFact(a: number, b: number): FactStrategy {
  return strategyDetail(a, b).strategy
}

/** The sung rhyme of the song of the tables, for the facts whose rhyme IS the result («siete por ocho, cincuenta y seis»).
    The song sings it right after the fact is shown, so it may name the result: it is never a hint. Null for the other facts. */
export function songRhyme(a: number, b: number): string | null {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  if (lo === 7 && hi === 7) return '¡Siete por siete, cuarenta y nueve, y el arcoíris llueve!'
  if (lo === 7 && hi === 8) return '5, 6, 7, 8: ¡cincuenta y seis es siete por ocho!'
  // «Los pares que riman» is sung once, at 6 × 8 (the plan's single verse for it).
  if (lo === 6 && hi === 8) return 'Los pares que riman: 6 × 8 acaba en 8, y delante va su mitad, el 4.'
  return null
}
