/* Two stops of a world never share a title (a lesson «Aprende» and its activity «Practica» say what each one is), and
   the lessons that explain a way of working say it in their title. */
import { describe, expect, it } from 'vitest'
import { season1, seasonC2 } from '../season'

const seasons = [
  { name: 's1', worlds: season1.worlds },
  { name: 'c2', worlds: seasonC2.worlds },
]

describe('titles of the stops of a world', () => {
  it.each(seasons.map((s) => [s.name, s.worlds] as const))('%s: no two stops of a world have the same title', (_name, worlds) => {
    const repeated = worlds.flatMap((w) => {
      const titles = w.nodes.map((n) => n.title.trim().toLowerCase())
      return titles.filter((t, i) => titles.indexOf(t) !== i).map((t) => `${w.id}: ${t}`)
    })
    expect(repeated).toEqual([])
  })

  it('world 4 says which stop teaches and which one practises the zeros', () => {
    const w4 = season1.worlds.find((w) => w.id === 'w4')!
    expect(w4.nodes.find((n) => n.id === 'lesson-zero')!.title).toBe('Aprende: la trampa del cero')
    expect(w4.nodes.find((n) => n.id === 'column-zero')!.title).toBe('Practica: restas con ceros')
  })

  it('the instructions of the subtraction stops do not depend on the way the family chose', () => {
    const w4 = season1.worlds.find((w) => w.id === 'w4')!
    for (const id of ['column-3d', 'column-zero']) {
      const text = w4.nodes.find((n) => n.id === id)!.activity!.instructions
      expect(text, id).not.toMatch(/vecina|llevo|prestad/i)
      expect(text, id).toContain('empezando por las unidades')
    }
  })
})
