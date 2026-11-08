/* Canciones de las tablas: the pure part. The verses of a table (with the rhymes of the tricks that really rhyme), the
   gaps of «¡Tu turno!» (the facts this child finds hard, more of them at each level), the stars kept as progress flags,
   and the three bubbles. Design: docs/superpowers/specs/2026-11-08-canciones-tablas-design.md. */
import { mulSkill, strategyForFact } from '@/engine'
import { numberWords } from '@/activities/facts/shared/speak'
import type { MasteryMap } from '@/types'

export type SongLine =
  | { kind: 'fact'; table: number; n: number; answer: number; show: string; say: string; lead: string; result: string }
  | { kind: 'rhyme'; show: string; say: string }

export type FactLine = Extract<SongLine, { kind: 'fact' }>

export const SONG_INTRO = '¡Canta conmigo!'
export const SONG_TURN = '¡Ahora tú! Yo empiezo y tú terminas.'
export const songEnd = (table: number): string => `¡Tabla del ${numberWords(table)} cantada!`

const ALL_TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10]
const GRADE2_TABLES = [2, 3, 4, 5, 10]
/** Without data, the facts that are usually hardest go first. */
const PRIORITY = [7, 8, 6, 9, 4, 3, 5, 2]
/** Only the tricks that are sung, not explained (spec: «sin inventar letras nuevas»). */
const RHYME_IDS = new Set(['square-rhyme', 'five-six-seven-eight', 'even-six-rhyme'])
/** Gaps per level: level 1 takes the hard ones (2 to 4), level 2 five, level 3 every fact but × 1 and × 10. */
const LEVEL_GAPS = { 2: 5, 3: 8 } as const

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

export function songTables(grade: number | undefined): number[] {
  return grade === 2 ? [...GRADE2_TABLES] : [...ALL_TABLES]
}

/** The rhyme of a fact, when its trick is one of the sung ones (6 × 8 rhymes in the table of the 6 and of the 8). */
function rhymeOf(a: number, b: number): string | null {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const s = strategyForFact(lo, hi)
  if (!RHYME_IDS.has(s.id)) return null
  // «Los pares que riman» is sung once, at 6 × 8 (the plan's single verse for it), not at every even fact of the 6.
  if (s.id === 'even-six-rhyme' && !(lo === 6 && hi === 8)) return null
  return s.text
}

export function songLines(table: number): SongLine[] {
  const lines: SongLine[] = []
  for (let n = 1; n <= 10; n++) {
    const answer = table * n
    const t = cap(numberWords(table))
    lines.push({
      kind: 'fact', table, n, answer,
      show: `${table} × ${n} = ${answer}`,
      say: `${t} por ${numberWords(n)}, ${numberWords(answer)}`,
      lead: `${t} por ${numberWords(n)}…`,
      result: `¡${cap(numberWords(answer))}!`,
    })
    const rhyme = rhymeOf(table, n)
    if (rhyme) lines.push({ kind: 'rhyme', show: `♪ ${rhyme}`, say: rhyme })
  }
  return lines
}

/** The n of the gaps (× n of the table), in song order: the hardest for this child first, as many as the level asks. */
export function songGaps(table: number, mastery: MasteryMap, level: 1 | 2 | 3): number[] {
  const candidates = [2, 3, 4, 5, 6, 7, 8, 9]
  const info = (n: number) => mastery[mulSkill(table, n)]
  const rank = (n: number) => {
    const s = info(n)
    const p = PRIORITY.indexOf(n)
    return [s ? s.box : 0, s?.lastError ? 0 : 1, p === -1 ? 99 : p]
  }
  const sorted = [...candidates].sort((x, y) => {
    const a = rank(x)
    const b = rank(y)
    return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]
  })
  let count: number
  if (level === 1) {
    const hard = sorted.filter((n) => (info(n)?.box ?? 0) <= 1).length
    count = Math.min(4, Math.max(2, hard))
  } else {
    count = LEVEL_GAPS[level]
  }
  return sorted.slice(0, count).sort((a, b) => a - b)
}

export function songFlagKey(table: number, star: 1 | 2 | 3): string {
  return `cancion:${table}:${star}`
}

export function songStars(flags: Record<string, boolean> | undefined, table: number): 0 | 1 | 2 | 3 {
  let stars = 0
  for (const s of [1, 2, 3] as const) if (flags?.[songFlagKey(table, s)]) stars = s
  return stars as 0 | 1 | 2 | 3
}

export function songLevel(stars: number): 1 | 2 | 3 {
  return Math.min(3, Math.max(1, stars + 1)) as 1 | 2 | 3
}

function shuffle<T>(xs: T[], rng: () => number): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** The answer and two numbers that really confuse: the facts next to it and the sum (7 × 8: 49, 63, 15). */
export function bubbleChoices(table: number, n: number, rng: () => number): number[] {
  const answer = table * n
  const pool = [...new Set([table * (n - 1), table * (n + 1), table + n, answer + table, answer - 1])]
    .filter((x) => x > 0 && x !== answer)
  // The three real confusions first; the extras only when one of them is not usable (× 1: 0 is out).
  const main = pool.slice(0, 3)
  const picked = shuffle(main.length >= 2 ? main : pool, rng).slice(0, 2)
  return shuffle([answer, ...picked], rng)
}

/** Everything the voice says in the song of this table, to preload before it starts. */
export function songTexts(table: number): string[] {
  const out = new Set<string>([SONG_INTRO, SONG_TURN, songEnd(table)])
  for (const l of songLines(table)) {
    out.add(l.say)
    if (l.kind === 'fact') {
      out.add(l.lead)
      out.add(l.result)
      out.add(strategyForFact(table, l.n).text)
    }
  }
  return [...out]
}
