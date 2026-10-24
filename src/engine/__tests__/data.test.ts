/* Gráficos, probabilidad, series y posición: every generated item is verified with independent reasoning, the right
   answer is accepted, a wrong one is not, and no hint gives the answer away. */
import { describe, expect, it } from 'vitest'
import { bare, check, createRng, describeSkill, generate, hintsFor, isValidSkill, makeRelative, statementOf } from '@/engine'
import type { Answer, ChanceExercise, ChartExercise, Exercise, PatternExercise, PositionExercise } from '@/types'

const SKILLS = [
  'chart:pict', 'chart:pict:x', 'chart:bars', 'chart:table', 'chart:freq', 'chart:mode', 'prob:chance', 'prob:likely',
  'pattern:shapes', 'pattern:numbers', 'pattern:predict', 'pos:relative', 'pos:next', 'pos:route',
]

const choiceKinds = (ex: Exercise) =>
  ex.kind === 'chance' || ex.kind === 'position' || (ex.kind === 'pattern' && ex.mode === 'shapes') || (ex.kind === 'chart' && ex.options.length > 0)

function right(ex: Exercise): Answer {
  const a = (ex as { answer: number }).answer
  return choiceKinds(ex) ? { type: 'choice', index: a } : { type: 'number', value: a }
}
function wrong(ex: Exercise): Answer {
  const a = (ex as { answer: number }).answer
  return choiceKinds(ex) ? { type: 'choice', index: a === 0 ? 1 : 0 } : { type: 'number', value: a + 1 }
}

function verifyChart(ex: ChartExercise): void {
  if (ex.mode === 'table') {
    const t = ex.table!
    const [r, c] = t.at
    expect(ex.answer, ex.id).toBe(t.cells[r][c])
    expect(ex.question, ex.id).toBe(`¿Cuántos niños de ${t.rows[r]} prefieren ${t.cols[c].label}?`)
    expect(t.cells.every((row) => row.length === t.cols.length), ex.id).toBe(true)
    expect(t.cells.flat().every((v) => v >= 1 && v <= 9), ex.id).toBe(true)
    return
  }
  if (ex.mode === 'tally') {
    const target = Number(ex.question.match(/sale el (\d)\?/)![1])
    expect(ex.answer, ex.id).toBe(ex.data.filter((v) => v === target).length)
    expect(ex.answer, ex.id).toBeGreaterThanOrEqual(2)
    return
  }
  if (ex.mode === 'data') {
    const counts = new Map<number, number>()
    for (const v of ex.data) counts.set(v, (counts.get(v) ?? 0) + 1)
    const top = Math.max(...counts.values())
    expect([...counts.entries()].filter(([, c]) => c === top).map(([v]) => v)).toEqual([ex.answer])
    return
  }
  const values = ex.categories.map((c) => c.value)
  expect(new Set(values).size, ex.id).toBe(values.length)
  for (const v of values) expect(v % ex.per, ex.id).toBe(0)
  if (ex.ask === 'total') expect(ex.answer).toBe(values.reduce((s, v) => s + v, 0))
  if (ex.ask === 'most') expect(values[ex.answer]).toBe(Math.max(...values))
  if (ex.ask === 'least') expect(values[ex.answer]).toBe(Math.min(...values))
  if (ex.ask === 'count') expect(values).toContain(ex.answer)
  if (ex.ask === 'difference') expect(ex.answer).toBeGreaterThan(0)
}

function verifyChance(ex: ChanceExercise): void {
  if (ex.skill === 'prob:likely') {
    const counts = ex.bag.map((b) => b.count)
    // The amounts are distinct, so there is never a tie for the most (or the least) likely colour.
    expect(new Set(counts).size, ex.id).toBe(counts.length)
    expect(ex.options, ex.id).toEqual(ex.bag.map((b) => bare(b.label)))
    expect(counts[ex.answer], ex.id).toBe(ex.ask === 'less' ? Math.min(...counts) : Math.max(...counts))
    expect(ex.question, ex.id).toBe(ex.ask === 'less' ? '¿Qué es menos probable sacar?' : '¿Qué es más probable sacar?')
    return
  }
  const colour = ex.question.match(/que sea (\w+)\?/)![1]
  const n = ex.bag.find((b) => b.label === colour)?.count ?? 0
  const total = ex.bag.reduce((s, b) => s + b.count, 0)
  expect(ex.options[ex.answer]).toBe(n === 0 ? 'Imposible' : n === total ? 'Seguro' : 'Posible')
}

function verifyPattern(ex: PatternExercise): void {
  if (ex.mode === 'shapes') {
    const shown = ex.items.slice(0, -1) as string[]
    // The shortest period that explains the row decides the next figure.
    let period = 1
    while (!shown.every((v, i) => v === shown[i % period])) period++
    expect(period, ex.id).toBeLessThan(shown.length / 1.5)
    expect(ex.options[ex.answer]).toBe(shown[shown.length % period])
    expect(new Set(ex.options).size).toBe(ex.options.length)
    return
  }
  const nums = ex.items.map((v) => (v === null ? null : Number(v)))
  if (ex.mode === 'numbers') {
    const gap = nums.indexOf(null)
    expect(gap).toBeGreaterThanOrEqual(2)
    expect(ex.answer).toBe((nums[0] as number) + gap * ex.step)
    for (const v of [...nums, ex.answer]) if (v !== null) expect(v).toBeGreaterThanOrEqual(0)
  } else {
    expect(ex.answer).toBe((nums[0] as number) + (ex.position! - 1) * ex.step)
    expect(ex.answer).toBeLessThanOrEqual(9999)
  }
}

function verifyPosition(ex: PositionExercise): void {
  const name = (k: number) => ex.cells[k].name.replace(/^(el|la) /, '').replace(/^./, (x) => x.toUpperCase())
  const occupied = new Set(ex.cells.map((c) => `${c.row},${c.col}`))
  expect(occupied.size).toBe(ex.cells.length)
  if (ex.mode === 'route') {
    let r = ex.cells[ex.start!].row
    let c = ex.cells[ex.start!].col
    for (const m of ex.moves) {
      for (let k = 0; k < m.n; k++) {
        r += m.dir === 'up' ? -1 : m.dir === 'down' ? 1 : 0
        c += m.dir === 'left' ? -1 : m.dir === 'right' ? 1 : 0
        expect(r >= 0 && c >= 0 && r < ex.rows && c < ex.cols, ex.id).toBe(true)
      }
    }
    const end = ex.cells.findIndex((x) => x.row === r && x.col === c)
    expect(ex.options[ex.answer]).toBe(name(end))
  }
  expect(new Set(ex.options).size).toBe(ex.options.length)
}

describe('gráficos, probabilidad, series y posición', () => {
  it.each(SKILLS)('%s: verified answers, right accepted, wrong refused, hints without the answer', (skill) => {
    expect(isValidSkill(skill)).toBe(true)
    expect(describeSkill(skill)).not.toBe(skill)
    for (let seed = 1; seed <= 60; seed++) {
      for (const ex of generate({ skills: [skill] }, 4, { rng: createRng(seed) })) {
        expect(ex.skill).toBe(skill)
        if (ex.kind === 'chart') verifyChart(ex)
        if (ex.kind === 'chance') verifyChance(ex)
        if (ex.kind === 'pattern') verifyPattern(ex)
        if (ex.kind === 'position') verifyPosition(ex)
        expect(check(ex, right(ex)).correct, ex.id).toBe(true)
        const w = check(ex, wrong(ex))
        expect(w.correct, ex.id).toBe(false)
        expect(w.feedback?.length).toBeGreaterThan(0)
        const hints = hintsFor(ex)
        expect(hints.map((h) => h.level)).toEqual([1, 2, 3])
        if (!choiceKinds(ex)) {
          const answer = String((ex as { answer: number }).answer)
          // «Cada dibujo vale 5» names the scale, not the answer, even when the answer is 5.
          if (ex.kind === 'chart' && ex.answer === ex.per) continue
          for (const h of hints) expect(h.text.split(/\D+/), `${ex.id} ${h.text}`).not.toContain(answer)
        }
        expect(statementOf(ex)).not.toBe(ex.skill)
      }
    }
  })

  it('a left–right slip is named as such, and the hint does not assume the child writes with the right hand', () => {
    const cells = [{ row: 0, col: 0, emoji: '🐱', name: 'el gato' }, { row: 0, col: 2, emoji: '⚽', name: 'la pelota' }]
    const ex = makeRelative(3, 4, cells, 1, 0)
    expect(ex.options[ex.answer]).toBe('A su derecha')
    const r = check(ex, { type: 'choice', index: 0 })
    expect(r).toMatchObject({ correct: false, errorType: 'left-right' })
    for (const h of hintsFor(ex)) expect(h.text).not.toMatch(/escribes|escribir/)
  })

  it('the table, the frequency and the most likely colour: 300 seeds, the answer read right and no hint gives it away', () => {
    const asks = new Set<string>()
    for (const skill of ['chart:table', 'chart:freq', 'prob:likely']) {
      for (let seed = 1; seed <= 300; seed++) {
        const [ex] = generate({ skills: [skill] }, 1, { rng: createRng(seed) })
        const hints = hintsFor(ex)
        expect(hints.map((h) => h.level)).toEqual([1, 2, 3])
        if (ex.kind === 'chart') {
          verifyChart(ex)
          asks.add(ex.ask)
          for (const h of hints) expect(h.text.split(/\D+/), `${ex.id} ${h.text}`).not.toContain(String(ex.answer))
        }
        if (ex.kind === 'chance') {
          verifyChance(ex)
          asks.add(ex.ask!)
          const answer = ex.options[ex.answer].toLowerCase()
          for (const h of hints) expect(h.text.toLowerCase(), `${ex.id} ${h.text}`).not.toMatch(new RegExp(`\\b${answer}`))
        }
        expect(check(ex, right(ex)).correct, ex.id).toBe(true)
        expect(check(ex, wrong(ex)).correct, ex.id).toBe(false)
      }
    }
    expect([...asks].sort()).toEqual(['cell', 'freq', 'less', 'more'])
  })
})
