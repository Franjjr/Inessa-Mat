import { describe, expect, it } from 'vitest'
import type { MeasureDimension, MeasureMode } from '@/types'
import {
  buildMeasure, check, checkMeasure, createRng, describeSkill, DIMENSION_NAME, hintsFor, kindsForSkill, measureStatement,
  parseSkill, THINGS, UNITS,
} from '@/engine'
import { measureSkill } from '@/engine/skills'

const SAMPLES = 120
const DIMS: MeasureDimension[] = ['length', 'mass', 'capacity']

function hintsLeak(texts: string[], answer: number): boolean {
  return texts.some((t) => new RegExp(`(^|\\D)${answer}(\\D|$)`).test(t.replace(/\s/g, '')))
}

describe('medida: skill keys', () => {
  it('parses unit and convert skills per dimension, and the single ones', () => {
    for (const dim of DIMS) {
      expect(parseSkill(measureSkill('unit', dim))).toEqual({ type: 'measure', mode: 'unit', dimension: dim })
      expect(parseSkill(measureSkill('convert', dim))).toEqual({ type: 'measure', mode: 'convert', dimension: dim })
    }
    expect(parseSkill('measure:ruler')).toEqual({ type: 'measure', mode: 'ruler', dimension: 'length' })
    expect(parseSkill('measure:add')).toEqual({ type: 'measure', mode: 'add', dimension: null })
    expect(parseSkill('measure:estimate')).toEqual({ type: 'measure', mode: 'estimate', dimension: null })
  })

  it('rejects unknown measure skills and maps every one to the measure kind', () => {
    expect(parseSkill('measure:unit:time')).toBeNull()
    expect(parseSkill('measure:unit')).toBeNull()
    for (const key of ['measure:unit:mass', 'measure:ruler', 'measure:add', 'measure:estimate']) {
      expect(kindsForSkill(key)).toEqual(['measure'])
      expect(describeSkill(key).length).toBeGreaterThan(3)
    }
  })

  it('every unit of the dimension appears in the things of that dimension', () => {
    for (const dim of DIMS) {
      expect(THINGS.some((t) => t.dimension === dim)).toBe(true)
      for (const t of THINGS.filter((x) => x.dimension === dim)) expect(UNITS[dim]).toContain(t.unit)
    }
    expect(DIMENSION_NAME.capacity).toBe('capacidad')
  })
})

describe('medida: generators are valid and grade their own answers', () => {
  it('unit: the right unit is among the options and the wrong ones say whether they are too big or too small', () => {
    for (const dim of DIMS) {
      const rng = createRng(40 + DIMS.indexOf(dim))
      for (let i = 0; i < SAMPLES / 3; i++) {
        const ex = buildMeasure('unit', dim, rng, new Set())
        if (ex.kind !== 'measure' || ex.mode !== 'unit') throw new Error('mode')
        expect(ex.options.map((o) => o.unit).sort()).toEqual([...UNITS[dim]].sort())
        expect(new Set(ex.options.map((o) => o.value)).size).toBe(1)
        expect(check(ex, { type: 'choice', value: ex.answer }).correct).toBe(true)
        for (const o of ex.options.filter((x) => x.unit !== ex.answer)) {
          const r = check(ex, { type: 'choice', value: o.unit })
          expect(r.correct).toBe(false)
          expect(r.feedback).toMatch(/demasiado (grande|pequeño)/)
        }
      }
    }
  })

  it('convert: the answer is the number of small units, and the halves and quarters are exact', () => {
    const rng = createRng(51)
    for (const dim of DIMS) {
      for (let i = 0; i < SAMPLES / 3; i++) {
        const ex = buildMeasure('convert', dim, rng, new Set())
        if (ex.kind !== 'measure' || ex.mode !== 'convert') throw new Error('mode')
        if (ex.fraction) expect(ex.answer * (ex.fraction === 'half' ? 2 : 4)).toBe(ex.factor)
        expect(check(ex, { type: 'number', value: ex.answer }).correct).toBe(true)
        expect(check(ex, { type: 'number', value: ex.answer + 1 }).correct).toBe(false)
        expect(check(ex, { type: 'number', value: null }).errorType).toBe('incomplete')
      }
    }
  })

  it('ruler: the answer is the length from where the object starts to where it ends, inside the ruler', () => {
    const rng = createRng(61)
    let offZero = 0
    for (let i = 0; i < SAMPLES; i++) {
      const ex = buildMeasure('ruler', null, rng, new Set())
      if (ex.kind !== 'measure' || ex.mode !== 'ruler') throw new Error('mode')
      expect(ex.start).toBeGreaterThanOrEqual(0)
      expect(ex.end).toBeLessThanOrEqual(ex.max)
      expect(ex.answer).toBe(ex.end - ex.start)
      expect(check(ex, { type: 'number', value: ex.answer }).correct).toBe(true)
      if (ex.start > 0) {
        offZero++
        const r = check(ex, { type: 'number', value: ex.end })
        expect(r.correct).toBe(false)
        expect(r.feedback).toContain(`empieza en ${ex.start} cm`)
      }
    }
    expect(offZero).toBeGreaterThan(0)
  })

  it('add: both measures are turned into the unit of the answer before adding', () => {
    const rng = createRng(71)
    for (let i = 0; i < SAMPLES; i++) {
      const dim = DIMS[i % 3]
      const ex = buildMeasure('add', dim, rng, new Set())
      if (ex.kind !== 'measure' || ex.mode !== 'add') throw new Error('mode')
      expect(ex.text).not.toContain('{')
      expect(ex.answer).toBeGreaterThan(0)
      expect(check(ex, { type: 'number', value: ex.answer }).correct).toBe(true)
      expect(check(ex, { type: 'number', value: ex.answer - 1 }).feedback).toContain(`${ex.unit}`)
    }
  })

  it('estimate: the verdict is graded, and a claim with a wrong unit is not reasonable', () => {
    const rng = createRng(81)
    let yes = 0
    let no = 0
    for (let i = 0; i < SAMPLES; i++) {
      const ex = buildMeasure('estimate', null, rng, new Set())
      if (ex.kind !== 'measure' || ex.mode !== 'estimate') throw new Error('mode')
      if (ex.answer) yes++
      else no++
      expect(check(ex, { type: 'verdict', ok: ex.answer, value: null }).correct).toBe(true)
      expect(check(ex, { type: 'verdict', ok: !ex.answer, value: null }).correct).toBe(false)
      expect(check(ex, { type: 'verdict', ok: null, value: null }).errorType).toBe('incomplete')
    }
    expect(yes).toBeGreaterThan(0)
    expect(no).toBeGreaterThan(0)
  })

  it('checks reject the wrong shape of each mode', () => {
    const unit = buildMeasure('unit', 'length', createRng(1), new Set())
    expect(checkMeasure(unit, { type: 'number', value: 3 }).correct).toBe(false)
    const ruler = buildMeasure('ruler', null, createRng(2), new Set())
    expect(checkMeasure(ruler, { type: 'choice', value: 'cm' }).correct).toBe(false)
  })
})

describe('medida: hints never give the result', () => {
  it('no hint of a conversion or a ruler exercise states the answer', () => {
    const rng = createRng(91)
    const modes: MeasureMode[] = ['convert', 'ruler', 'add']
    for (const mode of modes) {
      for (const dim of DIMS) {
        for (let i = 0; i < SAMPLES / 4; i++) {
          const ex = buildMeasure(mode, dim, rng, new Set())
          if (ex.kind !== 'measure' || ex.mode === 'unit' || ex.mode === 'estimate') throw new Error('mode')
          const hints = hintsFor(ex)
          expect(hints.map((h) => h.level)).toEqual([1, 2, 3])
          if (ex.answer >= 10) expect(hintsLeak(hints.map((h) => h.text), ex.answer), `${mode}: ${JSON.stringify(ex)}`).toBe(false)
        }
      }
    }
  })

  it('the unit and estimate hints give three levels without a number to copy', () => {
    const rng = createRng(92)
    for (let i = 0; i < 30; i++) {
      const unit = buildMeasure('unit', 'mass', rng, new Set())
      const est = buildMeasure('estimate', null, rng, new Set())
      expect(hintsFor(unit)).toHaveLength(3)
      expect(hintsFor(est)).toHaveLength(3)
      for (const h of hintsFor(est)) expect(h.text).not.toMatch(/\d/)
    }
  })

  it('statements of measure exercises name the question', () => {
    const ex = buildMeasure('convert', 'length', createRng(93), new Set())
    expect(measureStatement(ex)).toContain('= ?')
  })
})
