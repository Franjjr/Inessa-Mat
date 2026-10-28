import { describe, expect, it } from 'vitest'
import { CURSIVE_LOWER, CURSIVE_UPPER, LINK_GAP, WORD_SPACE, XHEIGHT, BASELINE, type ModelStroke } from './models'
import { joinWord } from './join'

const bbox = (st: ModelStroke) => {
  const ys = st.map((p) => p.y)
  return { minY: Math.min(...ys), maxY: Math.max(...ys), h: Math.max(...ys) - Math.min(...ys) }
}
/** The joined pen path of a glyph (its first `main` strokes); the rest are marks: dots, tildes, crossbars, accents. */
const bodyOf = (g: { strokes: ModelStroke[]; main: number }) => g.strokes.slice(0, g.main)
const marksOf = (g: { strokes: ModelStroke[]; main: number }) => g.strokes.slice(g.main)
/** Number of separate runs where the stroke rises above the mid-line between x-height and baseline (one per arch). */
const archRuns = (st: ModelStroke) => {
  const mid = (XHEIGHT + BASELINE) / 2
  let runs = 0
  for (let i = 0; i < st.length; i++) if (st[i].y < mid && (i === 0 || st[i - 1].y >= mid)) runs++
  return runs
}
const signedArea = (st: ModelStroke) => {
  let a = 0
  for (let i = 0; i < st.length - 1; i++) a += st[i].x * st[i + 1].y - st[i + 1].x * st[i].y
  return a / 2
}

describe('letra ligada models', () => {
  it('every lowercase letter a–z and ñ and every uppercase A–Z and Ñ exist', () => {
    const lower = 'abcdefghijklmnopqrstuvwxyzñ'.split('')
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÑ'.split('')
    for (const ch of lower) expect(CURSIVE_LOWER[ch], ch).toBeDefined()
    for (const ch of upper) expect(CURSIVE_UPPER[ch], ch).toBeDefined()
    expect(Object.keys(CURSIVE_LOWER)).toHaveLength(33)
    expect(Object.keys(CURSIVE_UPPER)).toHaveLength(32) // A–Z, Ñ, and Á É Í Ó Ú
  })

  it('every stroke has at least 2 points, consecutive points at most 4 units apart, and positive width', () => {
    for (const g of [...Object.values(CURSIVE_LOWER), ...Object.values(CURSIVE_UPPER)]) {
      expect(g.width).toBeGreaterThan(0)
      for (const st of g.strokes) {
        expect(st.length).toBeGreaterThanOrEqual(2)
        for (let i = 1; i < st.length; i++) {
          expect(Math.hypot(st[i].x - st[i - 1].x, st[i].y - st[i - 1].y)).toBeLessThanOrEqual(4)
        }
      }
    }
  })

  it('x-height letters stay on the x-height band (marks excepted)', () => {
    for (const ch of 'acemnñorsuvwxi') {
      for (const st of bodyOf(CURSIVE_LOWER[ch])) {
        const { minY, maxY } = bbox(st)
        expect(minY, ch).toBeGreaterThanOrEqual(XHEIGHT - 2)
        expect(maxY, ch).toBeLessThanOrEqual(BASELINE + 2)
      }
    }
  })

  it('ascender letters reach above the x-height and descender letters below the baseline', () => {
    for (const ch of 'bdfhklt') {
      const top = Math.min(...CURSIVE_LOWER[ch].strokes.flatMap((st) => st.map((p) => p.y)))
      expect(top, ch).toBeLessThan(XHEIGHT - 15)
    }
    for (const ch of 'fgjpqyz') {
      const bottom = Math.max(...CURSIVE_LOWER[ch].strokes.flatMap((st) => st.map((p) => p.y)))
      expect(bottom, ch).toBeGreaterThan(BASELINE + 15)
    }
  })

  it('n has two arches (lead-in plus one), m has three', () => {
    expect(archRuns(CURSIVE_LOWER.n.strokes[0])).toBe(2)
    expect(archRuns(CURSIVE_LOWER.m.strokes[0])).toBe(3)
    expect(archRuns(CURSIVE_LOWER.ñ.strokes[0])).toBe(2)
    expect(archRuns(CURSIVE_LOWER.r.strokes[0])).toBe(1)
  })

  it('ñ has a visible wave above the x-height (a mark, not a dot)', () => {
    const wave = CURSIVE_LOWER.ñ.strokes.slice(CURSIVE_LOWER.ñ.main)
    expect(wave.length).toBeGreaterThan(0)
    const { h, maxY } = bbox(wave[0])
    expect(h).toBeGreaterThanOrEqual(4)
    expect(maxY).toBeLessThan(XHEIGHT)
  })

  it('accented vowels á é í ó ú ü exist, with a mark beyond the base glyph', () => {
    for (const ch of 'áéíóúü') {
      expect(CURSIVE_LOWER[ch], ch).toBeDefined()
      const base = CURSIVE_LOWER[{ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[ch] as string]
      expect(CURSIVE_LOWER[ch].strokes.length, ch).toBeGreaterThanOrEqual(base.strokes.length)
      expect(marksOf(CURSIVE_LOWER[ch]).length, ch).toBeGreaterThan(0)
    }
  })

  it('o is drawn counter-clockwise (on screen, y grows downwards: negative signed area)', () => {
    expect(signedArea(CURSIVE_LOWER.o.strokes[0])).toBeLessThan(0)
  })
})

describe('joinWord', () => {
  it('joins "os" into one pen stroke whose extent is the sum of the widths', () => {
    const w = joinWord('os')
    expect(w.strokes).toHaveLength(1)
    const xs = w.strokes[0].map((p) => p.x)
    const extent = Math.max(...xs) - Math.min(...xs)
    expect(extent).toBeCloseTo(CURSIVE_LOWER.o.width + LINK_GAP + CURSIVE_LOWER.s.width, 0)
    expect(w.width).toBeCloseTo(CURSIVE_LOWER.o.width + LINK_GAP + CURSIVE_LOWER.s.width, 1)
  })

  it('separates the words of "la casa" by a gap of one space', () => {
    const la = joinWord('la').width
    const casa = joinWord('casa').width
    expect(joinWord('la casa').width).toBeCloseTo(la + WORD_SPACE + casa, 1)
  })

  it('keeps consecutive points at most 4 units apart across the joins', () => {
    for (const st of joinWord('mariposa').strokes) {
      for (let i = 1; i < st.length; i++) {
        expect(Math.hypot(st[i].x - st[i - 1].x, st[i].y - st[i - 1].y)).toBeLessThanOrEqual(4.01)
      }
    }
  })
})

describe('joinWord body and marks', () => {
  const firstEntry = (text: string) => {
    const ch = text[0]
    return (CURSIVE_LOWER[ch] ?? CURSIVE_UPPER[ch]).entry
  }

  it.each(['is', 'tu', 'ñu', 'Fé', 'Árbol'])('"%s" starts its pen path on the body, not on a mark', (text) => {
    const w = joinWord(text)
    expect(w.strokes[0][0]).toEqual(firstEntry(text))
    expect(w.body).toBeGreaterThan(0)
  })

  it('"is" lists the body first and the i dot after it', () => {
    const w = joinWord('is')
    expect(w.body).toBe(1)
    expect(w.strokes.length).toBeGreaterThan(w.body)
  })

  it('í carries only its accent: no dot left from the base letter', () => {
    const g = CURSIVE_LOWER.í
    expect(g.strokes.length).toBe(g.main + 1)
    expect(marksOf(g)).toHaveLength(1)
  })

  it('Ñ has its tilde inside the model box (y ≥ 0)', () => {
    const wave = CURSIVE_UPPER.Ñ.strokes.slice(CURSIVE_UPPER.Ñ.main)
    expect(wave.length).toBeGreaterThan(0)
    for (const st of wave) for (const p of st) expect(p.y).toBeGreaterThanOrEqual(0)
  })

  it('capital accents Á É Í Ó Ú exist with a mark above the body', () => {
    for (const ch of 'ÁÉÍÓÚ') {
      const g = CURSIVE_UPPER[ch]
      expect(g, ch).toBeDefined()
      expect(g.strokes.length, ch).toBeGreaterThan(g.main)
    }
  })

  it('the curriculum punctuation is present and joins without being dropped', () => {
    expect(joinWord('Mi gato come.').missing).toEqual([])
    expect(joinWord('¿Qué?').missing).toEqual([])
    expect(joinWord('¡Hola!').missing).toEqual([])
    expect(joinWord('a,b').missing).toEqual([])
  })

  it('characters with no glyph are reported in missing, not silently dropped', () => {
    expect(joinWord('a€b').missing).toEqual(['€'])
    expect(joinWord('Árbol').missing).toEqual([])
  })
})
