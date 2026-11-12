/* The openings of the table classes say the same as the «known-facts» drawing (review: the 6, 7 and 8 contradicted it):
   every «Ya sabes…» fact is marked known on the drawing, and every «quedan / nuevas» fact is marked new. */
import { cleanup, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CLASSES } from '@/content/classes'
import { LESSON_VISUALS } from '@/activities/lesson/visuals'

const factsIn = (text: string, table: number): number[] =>
  [...text.matchAll(new RegExp(`${table}\\s×\\s(\\d+)`, 'g'))].map((m) => Number(m[1]))

function knownOnDrawing(table: number): Set<number> {
  const V = LESSON_VISUALS['known-facts']
  const r = render(<V params={{ table }} phase={0} runLength={1} reduced />)
  const known = new Set<number>()
  r.container.querySelectorAll('[data-known]').forEach((el, i) => {
    if (el.getAttribute('data-known') === 'yes') known.add(i + 1)
  })
  cleanup()
  return known
}

describe('clases-tablas: the sentences agree with the known-facts drawing', () => {
  it.each([6, 7, 8])('table %i', (table) => {
    const cls = CLASSES.find((c) => c.lesson.id === `c3-tabla-${table}`)!
    expect(cls).toBeDefined()
    const known = knownOnDrawing(table)
    const texts = cls.lesson.steps.filter((s) => s.interaction !== 'try').map((s) => s.text)
    let checked = 0
    for (const t of texts) {
      for (const m of t.matchAll(/Ya sabes([^.!]*)/g)) {
        for (const k of factsIn(m[1], table)) { expect(known.has(k), `${t} → ${table} × ${k} no está marcada como sabida`).toBe(true); checked++ }
      }
      for (const m of t.matchAll(/(?:quedan|nuevas:?)([^.!]*)/g)) {
        for (const k of factsIn(m[1], table)) { expect(known.has(k), `${t} → ${table} × ${k} sí está marcada como sabida`).toBe(false); checked++ }
      }
    }
    expect(checked).toBeGreaterThan(0)
  })
})
