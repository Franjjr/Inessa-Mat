/* The workbook "tricks" (los trucos de Lumi) for every multiplication fact 1..10 × 1..10.
   The text depends on the orientation shown to the child: 6 × 7 is "el 5 y uno más", while 7 × 6 is
   "el espejo" of 6 × 7 (learnt in the Cave), exactly as the workbook's world-6 table explains. */
import type { FactStrategy, HintVisual } from '@/types'

export interface StrategyDetail {
  strategy: FactStrategy
  /** Params for the strategy visual (hint level 2). */
  visualParams: Record<string, number>
  /** Caption describing the visual (hint level 2). */
  visualText: string
  /** Worked step that leaves only the final answer for the child (hint level 3). */
  workedText: string
  workedVisual: HintVisual
  /** Params for the worked-step visual when it differs from the level-2 one (the 'mirror' reuses the Cave's visual). */
  workedParams?: Record<string, number>
  /** For 'mirror': the oriented fact whose trick is being reused. */
  mirrorOf?: [number, number]
}

const EASY_ONE = 'Por 1 es facilísimo: el número se queda igual.'

function detail(a: number, b: number, allowMirror = true): StrategyDetail {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  // ---- easy tables first (×1, ×10, ×2, ×5)
  if (lo === 1) {
    const n = a === 1 ? b : a
    return {
      strategy: { id: 'easy-one', text: EASY_ONE, visual: 'groups' },
      visualParams: { groups: a, perGroup: b },
      visualText: a === 1 ? `Mira: solo hay 1 grupo de ${b}.` : `Mira: ${a} grupos de 1.`,
      workedText: `${a} × ${b}: el ${n} se queda igual. ¿Cuánto es?`,
      workedVisual: 'groups',
    }
  }
  if (a === 10 || b === 10) {
    const n = a === 10 ? b : a
    return {
      strategy: { id: 'ten', text: `Por 10, pon un 0 detrás del ${n}.`, visual: 'skip-count' },
      visualParams: { step: 10, count: n },
      visualText: `Cuenta de 10 en 10, ${n} ${n === 1 ? 'salto' : 'saltos'}: 10, 20, 30…`,
      workedText: `Escribe el ${n} y pon un 0 a su derecha. ¿Qué número sale?`,
      workedVisual: 'place-value',
    }
  }
  if (lo === 2) {
    const n = a === 2 ? b : a
    return {
      strategy: { id: 'double', text: `Es el doble: suma ${n} + ${n}.`, visual: 'groups' },
      visualParams: { groups: 2, perGroup: n },
      visualText: `Dos grupos iguales de ${n}.`,
      workedText: `El doble de ${n} es ${n} + ${n} = ?`,
      workedVisual: 'groups',
    }
  }
  // ---- special rhymes of the 7 table
  if (lo === 7 && hi === 7) {
    return {
      strategy: { id: 'square-rhyme', text: '¡Siete por siete, cuarenta y nueve, y el arcoíris llueve!', visual: 'array' },
      visualParams: { rows: 7, cols: 7 },
      visualText: 'Mira el cuadrado mágico: 7 filas de 7.',
      workedText: '7 × 7 = 7 × 5 + 7 × 2 = 35 + 14 = ?',
      workedVisual: 'array',
    }
  }
  if (lo === 7 && hi === 8) {
    return {
      strategy: { id: 'five-six-seven-eight', text: '5, 6, 7, 8: ¡cincuenta y seis es siete por ocho!', visual: 'array' },
      visualParams: { rows: 7, cols: 8 },
      visualText: 'Los números van en orden: 5, 6, 7, 8. Los dos primeros forman el resultado.',
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
  if (a === 5 || b === 5) {
    const n = a === 5 ? b : a
    const seq = Array.from({ length: n - 1 }, (_, i) => 5 * (i + 1)).join(', ')
    return {
      strategy: { id: 'five', text: `La del 5 acaba en 0 o en 5: calcula ${n} × 10 = ${n * 10} y toma la mitad.`, visual: 'skip-count' },
      visualParams: { step: 5, count: n },
      visualText: `Cuenta de 5 en 5, ${n} saltos.`,
      workedText: `${seq}, ? (cuenta ${n} saltos de 5)`,
      workedVisual: 'skip-count',
    }
  }
  if (a === 9 || b === 9) {
    const n = a === 9 ? b : a
    return {
      strategy: { id: 'nine-trick', text: `Truco del 9: empieza por uno menos que ${n} (el ${n - 1}) y las dos cifras suman 9.`, visual: 'nine-trick' },
      visualParams: { a: n },
      visualText: `Con los dedos: baja el dedo número ${n}. Los dedos de la izquierda son las decenas y los de la derecha, las unidades.`,
      workedText: `${n} × 9 = ${n} × 10 − ${n} = ${n * 10} − ${n} = ?`,
      workedVisual: 'times-ten-minus',
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
    return {
      strategy: {
        id: 'mirror',
        text: `El espejo: ${a} × 6 es lo mismo que 6 × ${a}. ${inner.strategy.text}`,
        visual: 'mirror',
      },
      visualParams: { a, b },
      visualText: `Gira las filas: ${a} filas de 6 son lo mismo que 6 filas de ${a}.`,
      workedText: inner.workedText,
      workedVisual: inner.workedVisual,
      workedParams: inner.visualParams,
      mirrorOf: [6, a],
    }
  }
  // 3 × 3 (and any leftover): count in threes.
  return {
    strategy: { id: 'known', text: `Cuenta de ${lo} en ${lo}: ${lo}, ${lo * 2}…`, visual: 'groups' },
    visualParams: { groups: a, perGroup: b },
    visualText: `Mira: ${a} grupos de ${b}.`,
    workedText: `${Array.from({ length: a }, () => String(b)).join(' + ')} = ?`,
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

function evenSix(n: number): StrategyDetail {
  return {
    strategy: {
      id: 'even-six-rhyme',
      text: `Los pares que riman: 6 × ${n} acaba en ${n}, y delante va su mitad, el ${n / 2}.`,
      visual: 'dots-five-plus-one',
    },
    visualParams: { a: 6, b: n },
    visualText: `Mira los puntos: 5 filas de ${n} y una fila más de ${n}.`,
    workedText: `La mitad de ${n} es ${n / 2}. Pon el ${n / 2} delante del ${n}: ?`,
    workedVisual: 'dots-five-plus-one',
  }
}

function doubling(n: number, steps: 2 | 3): StrategyDetail {
  const chain = [n, n * 2, n * 4, n * 8].slice(0, steps)
  if (steps === 2) {
    return {
      strategy: { id: 'double-double', text: `Doble y doble: ${n} → ${n * 2} → …`, visual: 'double-chain' },
      visualParams: { start: n, steps: 2 },
      visualText: `Dobla el ${n} dos veces: cada número es el doble del anterior.`,
      workedText: `${chain.join(' → ')} → ? (el doble de ${n * 2})`,
      workedVisual: 'double-chain',
    }
  }
  return {
    strategy: { id: 'double-double-double', text: `Doble, doble y doble: ${n} → ${n * 2} → ${n * 4} → …`, visual: 'double-chain' },
    visualParams: { start: n, steps: 3 },
    visualText: `Dobla el ${n} tres veces, como el pulpo Octavio: cada número es el doble del anterior.`,
    workedText: `${chain.join(' → ')} → ? (el doble de ${n * 4})`,
    workedVisual: 'double-chain',
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

/** The workbook "trick" for a multiplication fact (6×7 → five-plus-one, 8×n → double-double-double, ...). */
export function strategyForFact(a: number, b: number): FactStrategy {
  return strategyDetail(a, b).strategy
}
