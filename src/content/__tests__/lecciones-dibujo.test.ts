/* The drawings of the lessons say what the voice says: at the last step of every run of column steps all the digits of
   the result are on the page (the borrowing, the struck digits and the carries too), and each step shows only what the
   text of that step has said so far. */
import { cleanup, render } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { LESSON_VISUALS } from '@/activities/lesson/visuals'
import { classKnownFactors } from '@/activities/lesson/visuals/tables'
import { FINAL, stateOf } from '@/activities/lesson/visuals/types'
import { computeRuns } from '@/activities/lesson/navigation'
import type { LessonDef, LessonVisualId } from '@/types'
import { c2Lessons } from '../c2/lessons'
import { CLASSES } from '../classes'
import { lessons } from '../lessons'

afterEach(cleanup)

const ALL: LessonDef[] = [...lessons, ...c2Lessons]
/** The lessons of the classes are drawn with the same visuals, so they follow the same rules. */
const WITH_CLASSES: LessonDef[] = [...ALL, ...CLASSES.map((c) => c.lesson)]

function draw(visual: LessonVisualId, params: Record<string, number | string>, phase: number, runLength: number) {
  const Visual = LESSON_VISUALS[visual]
  return render(createElement(Visual, { params, phase, runLength, reduced: true }))
}

/** The text of the digits that are written in the result row of a column visual, left to right. */
const resultDigits = (container: HTMLElement) =>
  [...container.querySelectorAll('[data-testid="result-cell"]')].map((n) => n.textContent ?? '').join('')

/** Every run of a lesson that is drawn (steps that are not answered), with the params of its first step. */
function runsOf(lesson: LessonDef) {
  const runs = computeRuns(lesson.steps)
  const out: { start: number; length: number; step: LessonDef['steps'][number] }[] = []
  for (const r of runs) if (r.phase === 0 && lesson.steps[r.start].interaction === 'tap') out.push({ start: r.start, length: r.length, step: lesson.steps[r.start] })
  return out
}

describe('stateOf: the last step of a run is the whole picture', () => {
  it('returns FINAL on the last phase (and when the step stands alone) and the phase before', () => {
    expect(stateOf({ phase: 0, runLength: 1 })).toBe(FINAL)
    expect(stateOf({ phase: 2, runLength: 3 })).toBe(FINAL)
    expect(stateOf({ phase: 1, runLength: 3 })).toBe(1)
    expect(stateOf({ phase: 0, runLength: 3 })).toBe(0)
  })
})

describe('the last step of every column run shows all the digits of the result', () => {
  it('carry, borrow, zero-borrow, sub-carry and column-mul: result complete, no empty box left', () => {
    let checked = 0
    for (const l of WITH_CLASSES) {
      for (const run of runsOf(l)) {
        const p = run.step.params as Record<string, number>
        const v = run.step.visual
        let expected: string | null = null
        if (v === 'carry') expected = String(p.a + p.b)
        else if (v === 'borrow' || v === 'zero-borrow' || v === 'sub-carry') expected = String(p.a - p.b)
        else if (v === 'column-mul') expected = String(p.top * p.bottom)
        if (expected === null) continue
        const { container, unmount } = draw(v, run.step.params ?? {}, run.length - 1, run.length)
        expect(resultDigits(container).replace(/\D/g, ''), `${l.id}#${run.start + run.length - 1}`).toBe(expected)
        expect(container.querySelectorAll('[class*="cellEmpty"]').length, `${l.id}: empty boxes at the last step`).toBe(0)
        unmount()
        checked++
      }
    }
    expect(checked).toBeGreaterThanOrEqual(10)
  })

  it('c2-w4-borrow ends on 25 and c2-w2-sum on 59', () => {
    const lastRun = (lesson: LessonDef, visual: LessonVisualId) => runsOf(lesson).filter((r) => r.step.visual === visual).pop()!
    const sum = lastRun(c2Lessons.find((x) => x.id === 'c2-w2-sum')!, 'carry')
    const a = draw('carry', sum.step.params ?? {}, sum.length - 1, sum.length)
    expect(resultDigits(a.container)).toBe('59')
    a.unmount()
    const sub = lastRun(c2Lessons.find((x) => x.id === 'c2-w4-borrow')!, 'borrow')
    const b = draw('borrow', sub.step.params ?? {}, sub.length - 1, sub.length)
    expect(resultDigits(b.container)).toBe('25')
    b.unmount()
  })

  it('w4-four-ways no longer has the old steps of the four ways', () => {
    const l = lessons.find((x) => x.id === 'w4-four-ways')!
    expect(l.title).toBe('Dos formas de restar del cole')
    expect(l.steps.some((s) => s.visual === 'sub-line' || s.visual === 'sub-parts')).toBe(false)
  })
})

describe('subtraction by columns, one column per step', () => {
  it('4352 − 1728: the intro shows no result and each step adds its column with the borrowing it needed', () => {
    const params = { a: 4352, b: 1728, byColumn: 1 }
    const at = (phase: number) => draw('borrow', params, phase, 5)
    const digitsAt = [0, 1, 2, 3, 4].map((ph) => {
      const r = at(ph)
      const out = { digits: resultDigits(r.container), struck: r.container.querySelectorAll('[data-testid="struck"]').length }
      r.unmount()
      return out
    })
    expect(digitsAt.map((d) => d.digits)).toEqual(['', '4', '24', '624', '2624'])
    // the units borrow shows from step 1; the second borrow (hundreds, from the millares) only from step 3
    expect(digitsAt.map((d) => d.struck)).toEqual([0, 2, 2, 4, 4])
  })

  it('503 − 128 keeps its older script: nothing is written until the last step', () => {
    const params = { a: 503, b: 128 }
    for (const [phase, expected] of [[0, ''], [1, ''], [2, ''], [3, '375']] as const) {
      const r = draw('zero-borrow', params, phase, 4)
      expect(resultDigits(r.container), `phase ${phase}`).toBe(expected)
      r.unmount()
    }
  })

  it('the first step of the lesson of subtracting does not show the result', () => {
    const l = lessons.find((x) => x.id === 'w4-borrow')!
    const first = runsOf(l)[0]
    const r = draw(first.step.visual, first.step.params ?? {}, 0, first.length)
    expect(resultDigits(r.container)).toBe('')
    expect(r.container.textContent).not.toContain('225')
    r.unmount()
  })
})

describe('«me llevo una» has the layout of the other columns', () => {
  it('352 − 127: the − sign is on the row of the number below, the = on the result row and the 5 is under the units', () => {
    const r = draw('sub-carry', { a: 352, b: 127 }, 3, 4)
    const grid = r.getByTestId('sub-carry-columns')
    const cells = [...grid.children].map((c) => c.textContent ?? '')
    // columns: sign + 3 digits. Row 0 carries, row 1 the number below with −, then the line, then the = row.
    expect(cells.slice(4, 8)).toEqual(['−', '1', '23', '7']) // the 2 struck and the 3 that replaces it
    expect(cells[8]).toBe('')
    expect(cells[9]).toBe('=')
    const result = [...r.container.querySelectorAll('[data-testid="result-cell"]')].map((n) => n.textContent)
    expect(result).toEqual(['2', '2', '5'])
    expect(cells.slice(9, 13)).toEqual(['=', '2', '2', '5'])
    r.unmount()
  })

  it('its four steps are: the units, the +1 on the 2, the tens and the hundreds', () => {
    const shown = [0, 1, 2, 3].map((ph) => {
      const r = draw('sub-carry', { a: 352, b: 127 }, ph, 4)
      const out = { digits: resultDigits(r.container), mark: r.container.querySelectorAll('[data-testid="sub-carry-mark"]').length }
      r.unmount()
      return out
    })
    expect(shown.map((x) => x.digits)).toEqual(['5', '5', '25', '225'])
    expect(shown.map((x) => x.mark)).toEqual([0, 1, 1, 1])
  })
})

describe('addition: the working line follows the order of the voice', () => {
  it('368 + 257: the tens step says 6 + 5 + 1 = 12', () => {
    const r = draw('carry', { a: 368, b: 257 }, 2, 5)
    expect(r.getByTestId('carry-work').textContent).toBe('6 + 5 + 1 = 12')
    r.unmount()
  })
})

describe('multiplication in columns', () => {
  it('23 × 3: the pieces show no product on the first step', () => {
    const l = lessons.find((x) => x.id === 'w7-split')!
    const r = draw('split-multiply', { n: 23, m: 3 }, 0, 3)
    expect(r.queryByTestId('split-products')).toBeNull()
    r.unmount()
    expect(l.steps[0].visual).toBe('split-multiply')
  })

  it('the working line reads the number below first: 3 × 2 = 6', () => {
    const r = draw('column-mul', { top: 23, bottom: 3 }, 1, 3)
    expect(r.getByTestId('work').textContent).toBe('3 × 2 = 6')
    r.unmount()
  })

  it('47 × 6: 282 only appears at the second step; the first one writes the 2 and the 4 it carries', () => {
    const run = (phase: number) => {
      const r = draw('column-mul', { top: 47, bottom: 6 }, phase, 4)
      const out = { digits: resultDigits(r.container), work: r.getByTestId('work').textContent, carry: r.container.querySelectorAll('[data-testid="carry"]').length }
      r.unmount()
      return out
    }
    expect(run(0)).toEqual({ digits: '2', work: '6 × 7 = 42', carry: 1 })
    expect(run(1).digits).toBe('2')
    expect(run(1).work).toBe('6 × 4 = 24 · 24 + 4 = 28')
    expect(run(2).digits).toBe('282')
    expect(run(3).digits).toBe('282')
  })

  it('41 × 3 written whole: 123', () => {
    const r = draw('column-mul', { top: 41, bottom: 3 }, 0, 1)
    expect(resultDigits(r.container)).toBe('123')
    r.unmount()
  })
})

describe('the bar of the problems', () => {
  it('step by step: the parts 5 and 3, then the whole 8', () => {
    const l = lessons.find((x) => x.id === 'w4-bars')!
    expect(l.steps).toHaveLength(8)
    const at = (phase: number) => draw('bar-model', { a: 5, b: 3, total: 8 }, phase, 3)
    const first = at(0)
    expect(first.container.textContent).not.toContain('8')
    first.unmount()
    const second = at(2)
    expect(second.container.textContent).toContain('3')
    expect(second.getByTestId('bar-total').textContent).toBe('5 + 3 = 8')
    second.unmount()
  })

  it('a take-away: the whole 13 is known, the other part is «?» until the last step', () => {
    const params = { a: 4, b: 0, total: 13 }
    const whole = draw('bar-model', params, 0, 3)
    expect(whole.getByTestId('bar-total').textContent).toContain('13')
    whole.unmount()
    const question = draw('bar-model', params, 1, 3)
    expect(question.getByTestId('bar-total').textContent).toContain('13')
    expect(question.getByTestId('bar-model').textContent).toContain('?')
    question.unmount()
    const answer = draw('bar-model', params, 2, 3)
    expect(answer.getByTestId('bar-total').textContent).toBe('13 − 4 = 9')
    expect(answer.getByTestId('bar-model').textContent).not.toContain('?')
    answer.unmount()
  })
})

describe('known facts of a table', () => {
  const rows = (container: HTMLElement) => [...container.querySelectorAll('[data-known]')].map((n) => n.getAttribute('data-known'))

  it('in the classes the table 8 does not mark 8 × 7 and does mark 8 × 3 and 8 × 4', () => {
    expect(classKnownFactors(8)).toEqual([1, 2, 3, 4, 5, 6, 10])
    const r = draw('known-facts', { table: 8 }, 0, 1)
    const known = rows(r.container)
    expect(known[6]).toBe('no') // 8 × 7
    expect(known[2]).toBe('yes') // 8 × 3
    expect(known[3]).toBe('yes') // 8 × 4
    r.unmount()
  })

  it('table 7: the second step lights 7 × 6 and 7 × 8, and «nueva» only appears with the new facts', () => {
    const second = draw('known-facts', { table: 7, map: 1 }, 1, 3)
    const lit = [...second.container.querySelectorAll('[data-known]')].map((n) => (n as HTMLElement).style.borderColor !== '')
    expect(lit.map((on, i) => (on ? i + 1 : 0)).filter(Boolean)).toEqual([6, 8])
    expect(second.queryByText('✨ nueva')).toBeNull()
    second.unmount()
    const third = draw('known-facts', { table: 7, map: 1 }, 2, 3)
    expect(third.getAllByText('✨ nueva')).toHaveLength(3)
    third.unmount()
  })

  it('the number of «nuevas» drawn is the number the text says', () => {
    let checked = 0
    for (const l of lessons) {
      for (const run of runsOf(l)) {
        if (run.step.visual !== 'known-facts') continue
        for (let k = 0; k < run.length; k++) {
          const text = l.steps[run.start + k].text
          const said = text.match(/(?:solo|Solo) (?:te )?quedan (\d+) nuevas/)
          if (!said) continue
          const r = draw('known-facts', run.step.params ?? {}, k, run.length)
          expect(rows(r.container).filter((x) => x === 'no').length, `${l.id}#${run.start + k}`).toBe(Number(said[1]))
          r.unmount()
          checked++
        }
      }
    }
    expect(checked).toBe(2) // w5-pattern (4) and w6-seven (3)
  })
})

describe('the houses of the numbers', () => {
  it('«¡Empieza aquí!» marks the units house when the values are read', () => {
    const r = draw('place-value', { n: 2486 }, 2, 3)
    const tags = r.getAllByText('¡Empieza aquí!')
    expect(tags).toHaveLength(1)
    const houses = r.getAllByTestId('house')
    expect(houses[houses.length - 1].textContent).toContain('¡Empieza aquí!')
    r.unmount()
  })

  it('with blocks, every house draws as many blocks as its digit (squares, bars, cubes)', () => {
    const r = draw('place-value', { n: 345, blocks: 1 }, 0, 1)
    const counts = r.getAllByTestId('blocks').map((b) => b.children.length)
    expect(counts).toEqual([3, 4, 5])
    r.unmount()
  })
})

describe('the double chain and the division pictures', () => {
  it('one doubling does not write «× 2 = × 2»', () => {
    const r = draw('double-chain', { start: 3, steps: 1 }, 0, 1)
    expect(r.container.textContent).not.toMatch(/× 2 = × 2/)
    r.unmount()
  })

  it('the galera of 84 : 4 goes beat by beat: the casita, the divisor, the 2, the subtraction, the 1 and the end', () => {
    const at = (phase: number) => {
      const r = draw('galera', { dividend: 84, divisor: 4, written: 1 }, phase, 6)
      const out = {
        divisor: r.getByTestId('divisor').textContent,
        quotient: r.getByTestId('quotient').textContent,
        remainder: r.getByTestId('remainder').textContent,
        steps: r.queryAllByTestId('galera-step').length,
        subtractions: r.container.textContent?.includes('− 8') ?? false,
      }
      r.unmount()
      return out
    }
    expect(at(0)).toMatchObject({ divisor: '', quotient: '', steps: 0 })
    expect(at(1)).toMatchObject({ divisor: '4', quotient: '', steps: 0 })
    expect(at(2)).toMatchObject({ quotient: '2', steps: 1, subtractions: false })
    expect(at(3)).toMatchObject({ quotient: '2', steps: 1, subtractions: true, remainder: '0' })
    expect(at(4)).toMatchObject({ quotient: '21', steps: 2 })
    expect(at(5)).toMatchObject({ quotient: '21', steps: 2, remainder: '0' })
  })

  it('no division label writes a : b = c with a remainder and no «sobra»', () => {
    const r = draw('galera', { dividend: 73, divisor: 3 }, 1, 2)
    const labels = [...r.getByTestId('galera-work').children].map((n) => n.textContent ?? '')
    expect(labels).toEqual(['7 : 3 = 2 y sobra 1', 'bajo el 3: 13 : 3 = 4 y sobra 1'])
    r.unmount()
    const parts = draw('div-parts', { dividend: 84, divisor: 4 }, 3, 5)
    expect(parts.container.textContent).not.toContain('÷')
    parts.unmount()
  })
})

describe('every galera of the lessons and the classes', () => {
  it('no label writes a : b = c with a remainder and no «sobra», and none uses «÷»', () => {
    let checked = 0
    for (const l of WITH_CLASSES) {
      for (const run of runsOf(l)) {
        if (run.step.visual !== 'galera') continue
        const r = draw('galera', run.step.params ?? {}, run.length - 1, run.length)
        const work = r.queryByTestId('galera-work')
        const labels = work ? [...work.children].map((n) => n.textContent ?? '') : []
        for (const label of labels) {
          expect(label, `${l.id}`).not.toContain('÷')
          const m = label.match(/(\d+) : (\d+) = (\d+)(.*)/)
          if (m && Number(m[1]) !== Number(m[2]) * Number(m[3])) expect(m[4], `${l.id}: ${label}`).toContain('sobra')
        }
        r.unmount()
        checked++
      }
    }
    expect(checked).toBeGreaterThanOrEqual(3)
  })
})

describe('«Los trucos de Lumi»: the 9 shows ten times minus one, not the digits trick of world 6', () => {
  it('the nine-trick step of w3-tricks draws 70 − 7 = 63 and never «6 + 3 = 9»', () => {
    const step = lessons.find((x) => x.id === 'w3-tricks')!.steps.find((x) => x.visual === 'nine-trick')!
    const r = draw('nine-trick', step.params ?? {}, 0, 1)
    expect(r.container.textContent).toContain('70 − 7 = 63')
    expect(r.container.textContent).not.toContain('6 + 3 = 9')
    expect(r.container.textContent).not.toMatch(/\b6\b.*\b3\b.*6 \+ 3/)
    r.unmount()
    // the lesson of world 6 does teach the digits trick
    const full = draw('nine-trick', { a: 7 }, 0, 1)
    expect(full.container.textContent).toContain('6 + 3 = 9')
    full.unmount()
  })
})

describe('the column script of the subtraction is explicit', () => {
  it('a run of width + 1 steps without byColumn keeps the older script (no column-by-column drawing)', () => {
    const withFlag = draw('borrow', { a: 52, b: 27, byColumn: 1 }, 1, 3)
    const without = draw('borrow', { a: 52, b: 27 }, 1, 3)
    // step 1 of the column script already shows the units result (5); the older script does not yet
    expect(resultDigits(withFlag.container)).toBe('5')
    expect(resultDigits(without.container)).not.toBe('5')
    withFlag.unmount()
    without.unmount()
  })
})
