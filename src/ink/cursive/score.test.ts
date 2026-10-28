import { describe, expect, it } from 'vitest'
import { scoreCursive, fitPauta } from './score'
import { CURSIVE_THRESHOLDS } from './thresholds'
import { tipFor } from './tips'
import {
  PAUTA_H,
  PAUTA_W,
  bulgedStrokes,
  exactStrokes,
  fitOf,
  lateStartStrokes,
  mirroredAtStart,
  noisyStrokes,
  scaledStrokes,
  shiftedStrokes,
  shiftedX,
  shortTopStrokes,
  spikedStrokes,
  tallStrokes,
  targetOf,
  toInk,
  widenedStrokes,
  wobbledStrokes,
} from './fixtures'
import type { ModelStroke } from '../digitModels'

const WORDS = ['a', 'o', 'l', 'g', 'os']

/** Scores what a child drew (model-space strokes) against the model of `text`. */
const scoreDrawn = (text: string, drawn: ModelStroke[], target = text) =>
  scoreCursive(targetOf(target), toInk(drawn, fitOf(target)), fitOf(target), target)

describe('fitPauta', () => {
  it('fits the whole pauta inside the area and keeps the aspect ratio', () => {
    const fit = fitPauta(PAUTA_W, PAUTA_H, 100)
    expect(fit.scale).toBeCloseTo(Math.min(PAUTA_W / 100, PAUTA_H / 95), 6)
    const top = 5 * fit.scale + fit.oy
    const bottom = 100 * fit.scale + fit.oy
    expect(top).toBeGreaterThanOrEqual(0)
    expect(bottom).toBeLessThanOrEqual(PAUTA_H)
    expect(fit.ox).toBeGreaterThanOrEqual(0)
    expect(100 * fit.scale + fit.ox).toBeLessThanOrEqual(PAUTA_W)
  })
})

describe('scoreCursive: exact and noisy-good', () => {
  for (const text of WORDS) {
    it(`exact "${text}" gets 3 stars with all four criteria passed`, () => {
      const s = scoreDrawn(text, exactStrokes(text))
      expect(s.stars).toBe(3)
      expect(s.passed).toEqual({ shape: true, line: true, size: true, start: true })
    })

    it(`noisy-good (±1.5 units) "${text}" still gets 3 stars`, () => {
      const s = scoreDrawn(text, noisyStrokes(exactStrokes(text), 1.5))
      expect(s.stars).toBe(3)
    })
  }
})

describe('scoreCursive: noisy-good over several seeds', () => {
  it('±1.5 jitter gets 3 stars for every seed and word tried', () => {
    for (const text of WORDS) {
      for (const seed of [1, 2, 3, 4, 5]) {
        const s = scoreDrawn(text, noisyStrokes(exactStrokes(text), 1.5, seed))
        expect(s.stars, `${text} seed ${seed}`).toBe(3)
      }
    }
  })
})

describe('scoreCursive: one criterion off', () => {
  it('scaled ×1.4 fails size, gets at most 2 stars and the tip says «grande»', () => {
    for (const text of WORDS) {
      const s = scoreDrawn(text, scaledStrokes(text, 1.4))
      expect(s.passed.size, text).toBe(false)
      expect(s.stars, text).toBeLessThanOrEqual(2)
      expect(s.worst, text).toBe('size')
      expect(s.tip, text).toContain('grande')
    }
  })

  it('shifted 8 units down fails line and gets at most 2 stars', () => {
    for (const text of WORDS) {
      const s = scoreDrawn(text, shiftedStrokes(exactStrokes(text), 8))
      expect(s.passed.line, text).toBe(false)
      expect(s.stars, text).toBeLessThanOrEqual(2)
      expect(s.worst, text).toBe('line')
    }
  })

  it('an o drawn clockwise fails start', () => {
    const s = scoreDrawn('o', mirroredAtStart(exactStrokes('o')))
    expect(s.passed.start).toBe(false)
    expect(s.stars).toBeLessThanOrEqual(2)
    expect(s.worst).not.toBeNull()
  })

  it('the letter e traced on an a target fails shape and gets 1 star', () => {
    const s = scoreDrawn('e', exactStrokes('e'), 'a')
    expect(s.passed.shape).toBe(false)
    expect(s.stars).toBe(1)
  })

  it('two criteria failing gets 1 star', () => {
    const s = scoreDrawn('a', shiftedStrokes(scaledStrokes('a', 1.4), 8))
    expect(s.passed.size).toBe(false)
    expect(s.passed.line).toBe(false)
    expect(s.stars).toBe(1)
  })
})

describe('scoreCursive: almost good (each criterion just past its limit gets at most 2 stars)', () => {
  it('size 15% too big', () => {
    for (const text of ['a', 'o', 'l']) {
      const s = scoreDrawn(text, scaledStrokes(text, 1.15))
      expect(s.passed.size, text).toBe(false)
      expect(s.stars, text).toBeLessThanOrEqual(2)
    }
  })

  it('a bit above the line (3 units up)', () => {
    for (const text of ['a', 'o', 'l']) {
      const s = scoreDrawn(text, shiftedStrokes(exactStrokes(text), -3))
      expect(s.passed.line, text).toBe(false)
      expect(s.stars, text).toBeLessThanOrEqual(2)
    }
  })

  it('starts a little late on the stroke', () => {
    for (const text of ['a', 'o', 'l']) {
      const s = scoreDrawn(text, lateStartStrokes(exactStrokes(text), 14))
      expect(s.passed.start, text).toBe(false)
      expect(s.stars, text).toBeLessThanOrEqual(2)
    }
  })

  it('a fatter hand (the letter swells 9 units sideways, height kept)', () => {
    for (const text of ['a', 'o', 'l']) {
      const s = scoreDrawn(text, bulgedStrokes(exactStrokes(text), 9))
      expect(s.passed.shape, text).toBe(false)
      expect(s.stars, text).toBeLessThanOrEqual(2)
    }
  })
})

describe('scoreCursive: empty ink and determinism', () => {
  it('no strokes gets 1 star and the start tip', () => {
    const s = scoreCursive(targetOf('a'), [], fitOf('a'), 'a')
    expect(s.stars).toBe(1)
    expect(s.passed).toEqual({ shape: false, line: false, size: false, start: false })
    expect(s.worst).toBe('start')
    expect(s.tip).toBe(tipFor('start', 'a'))
  })

  it('is deterministic for the same input', () => {
    const drawn = noisyStrokes(exactStrokes('g'), 1.5)
    expect(scoreDrawn('g', drawn)).toEqual(scoreDrawn('g', drawn))
  })
})

describe('scoreCursive: tips', () => {
  it('a too small letter gets the size tip for smaller letters', () => {
    const s = scoreDrawn('o', scaledStrokes('o', 0.6))
    expect(s.worst).toBe('size')
    expect(s.tip).toContain('pequeña')
    expect(s.tip).not.toContain('grande')
  })

  it('a line problem gets the line tip, with the letter named', () => {
    const s = scoreDrawn('l', shiftedStrokes(exactStrokes('l'), 8))
    expect(s.tip).toBe('Apoya la letra l en la línea de abajo.')
  })

  it('the shape tip for round letters says to close the top', () => {
    expect(tipFor('shape', 'o')).toBe('Cierra bien la letra o por arriba.')
    expect(tipFor('shape', 'a')).toBe('Cierra bien la letra a por arriba.')
  })

  it('every result has exactly one non-empty tip', () => {
    for (const s of [
      scoreDrawn('a', exactStrokes('a')),
      scoreDrawn('o', scaledStrokes('o', 1.4)),
      scoreDrawn('os', shiftedStrokes(exactStrokes('os'), 8)),
    ]) {
      expect(typeof s.tip).toBe('string')
      expect(s.tip.trim().length).toBeGreaterThan(10)
    }
  })

  it('uses the pass limits from the single thresholds file', () => {
    expect(CURSIVE_THRESHOLDS.size.min).toBeLessThan(1)
    expect(CURSIVE_THRESHOLDS.size.max).toBeGreaterThan(1)
    expect(CURSIVE_THRESHOLDS.stars.threeMaxFailed).toBe(0)
    expect(CURSIVE_THRESHOLDS.liveOffPath).toBeGreaterThan(0)
  })
})

describe('scoreCursive: review round 1', () => {
  it('a perfect letter gets 3 stars, no failed criterion and a praise tip, never «pequeña» or «grande»', () => {
    for (const text of ['a', 'p', 'os']) {
      const s = scoreDrawn(text, exactStrokes(text))
      expect(s.stars, text).toBe(3)
      expect(s.worst, text).toBeNull()
      expect(s.tip, text).not.toMatch(/pequeña|grande/)
      expect(s.tip.trim().length, text).toBeGreaterThan(5)
    }
  })

  it('the size tip names the direction from the real ratio', () => {
    expect(scoreDrawn('a', scaledStrokes('a', 1.4)).tip).toContain('grande')
    expect(scoreDrawn('a', scaledStrokes('a', 0.6)).tip).toContain('pequeña')
  })

  it('a body 10% taller fails size and gets at most 2 stars', () => {
    const s = scoreDrawn('a', tallStrokes(exactStrokes('a'), 1.1))
    expect(s.passed.size).toBe(false)
    expect(s.stars).toBeLessThanOrEqual(2)
  })

  it('an ascender 6 units short fails size and gets at most 2 stars', () => {
    const s = scoreDrawn('l', shortTopStrokes(exactStrokes('l'), 6))
    expect(s.passed.size).toBe(false)
    expect(s.stars).toBeLessThanOrEqual(2)
    expect(s.tip).toContain('pequeña')
  })

  it('an o widened by 20% fails shape and gets at most 2 stars', () => {
    const s = scoreDrawn('o', widenedStrokes(exactStrokes('o'), 1.2))
    expect(s.passed.shape).toBe(false)
    expect(s.stars).toBeLessThanOrEqual(2)
  })

  it('an l with a ±3 unit wobble gets at most 2 stars', () => {
    const s = scoreDrawn('l', wobbledStrokes(exactStrokes('l'), 3))
    expect(s.stars).toBeLessThanOrEqual(2)
    expect(s.passed.shape).toBe(false)
  })

  it('a 6-unit spike over 5 points gets at most 2 stars on a, o and l', () => {
    for (const text of ['a', 'o', 'l']) {
      const s = scoreDrawn(text, spikedStrokes(exactStrokes(text), 6, 5))
      expect(s.stars, text).toBeLessThanOrEqual(2)
    }
  })

  it('a letter placed sideways (any amount) still passes line', () => {
    for (const dx of [6, 12, 30]) {
      const s = scoreDrawn('a', shiftedX(exactStrokes('a'), dx))
      expect(s.passed.line, String(dx)).toBe(true)
      expect(s.stars, String(dx)).toBe(3)
    }
  })

  it('line is symmetric: 3 units up and 3 units down both fail line the same way', () => {
    for (const text of ['a', 'o', 'l']) {
      const up = scoreDrawn(text, shiftedStrokes(exactStrokes(text), -3))
      const down = scoreDrawn(text, shiftedStrokes(exactStrokes(text), 3))
      expect(up.passed.line, text).toBe(false)
      expect(down.passed.line, text).toBe(false)
      expect(up.stars, text).toBeLessThanOrEqual(2)
      expect(down.stars, text).toBeLessThanOrEqual(2)
      expect(Math.abs(up.line - down.line), text).toBeLessThan(0.02)
    }
  })

  it('the same ink on a bigger canvas (fit recomputed) scores the same', () => {
    const text = 'o'
    const strokes = scaledStrokes(text, 1.2)
    const small = scoreCursive(targetOf(text), toInk(strokes, fitOf(text)), fitOf(text), text)
    const big = fitPauta(PAUTA_W * 2, PAUTA_H * 2, targetOf(text).width)
    const large = scoreCursive(targetOf(text), toInk(strokes, big), big, text)
    expect(large).toEqual(small)
  })
})
