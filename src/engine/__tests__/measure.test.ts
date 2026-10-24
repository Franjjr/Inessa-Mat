import { describe, expect, it } from 'vitest'
import type { MeasureDimension, MeasureMode } from '@/types'
import {
  buildMeasure, check, checkMeasure, createRng, describeSkill, DIMENSION_NAME, generate, hintsFor, kindsForSkill, measureStatement,
  newMastery, parseSkill, THINGS, UNITS,
} from '@/engine'
import type { MasteryMap } from '@/types'
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
        expect(check(ex, { type: 'option', value: ex.answer }).correct).toBe(true)
        for (const o of ex.options.filter((x) => x.unit !== ex.answer)) {
          const r = check(ex, { type: 'option', value: o.unit })
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
    expect(checkMeasure(ruler, { type: 'option', value: 'cm' }).correct).toBe(false)
  })
})

/** The ladder of each dimension, biggest first (as the child sees it on the chart). */
const LADDER: Record<MeasureDimension, string[]> = {
  length: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'],
  mass: ['kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg'],
  capacity: ['kl', 'hl', 'dal', 'l', 'dl', 'cl', 'ml'],
}

describe('medida: múltiplos y submúltiplos (:all)', () => {
  it('parses the :all keys of the conversions only', () => {
    for (const dim of DIMS) {
      expect(parseSkill(measureSkill('convert', dim, true))).toEqual({ type: 'measure', mode: 'convert', dimension: dim, all: true })
      expect(kindsForSkill(measureSkill('convert', dim, true))).toEqual(['measure'])
      expect(describeSkill(measureSkill('convert', dim, true)).length).toBeGreaterThan(3)
    }
    expect(parseSkill('measure:unit:length:all')).toBeNull()
    expect(parseSkill('measure:convert:time:all')).toBeNull()
  })

  it('300 items: whole numbers, one target unit on the same ladder, one or several steps', () => {
    const rng = createRng(101)
    const steps = new Set<number>()
    for (let i = 0; i < 300; i++) {
      const dim = DIMS[i % 3]
      const ex = buildMeasure('convert', dim, rng, new Set(), true, true)
      if (ex.kind !== 'measure' || ex.mode !== 'convert' || !ex.ladder) throw new Error('mode')
      const [, value, from] = ex.given.match(/^([\d ]+) (\S+)$/) ?? []
      expect(value, ex.given).toBeDefined()
      const given = Number(value.replace(/ /g, ''))
      const { steps: n } = ex.ladder
      steps.add(n)
      expect(from).toBe(ex.ladder.from)
      expect(LADDER[dim]).toContain(from)
      expect(LADDER[dim]).toContain(ex.unit)
      expect(Math.abs(LADDER[dim].indexOf(from) - LADDER[dim].indexOf(ex.unit))).toBe(n)
      expect(ex.factor).toBe(10 ** n)
      expect(Number.isInteger(ex.answer)).toBe(true)
      expect(Number.isInteger(given)).toBe(true)
      // The amount in the big unit times the factor is the amount in the small one, both whole.
      const bigAmount = ex.toBig ? ex.answer : given
      const smallAmount = ex.toBig ? given : ex.answer
      expect(smallAmount, ex.given).toBe(bigAmount * ex.factor)
      expect(Number.isInteger(bigAmount), ex.given).toBe(true)
      expect(ex.answer).toBeLessThanOrEqual(9999)
      expect(check(ex, { type: 'number', value: ex.answer }).correct).toBe(true)
      expect(check(ex, { type: 'number', value: ex.answer * 10 }).correct).toBe(false)
    }
    expect([...steps].sort()).toEqual([1, 2, 3])
  })

  it('the ladder feedback names the rungs when the answer is a power of ten away', () => {
    const rng = createRng(102)
    const ex = buildMeasure('convert', 'length', rng, new Set(), true)
    if (ex.kind !== 'measure' || ex.mode !== 'convert') throw new Error('mode')
    const r = check(ex, { type: 'number', value: ex.toBig ? ex.answer * 10 : ex.answer / 10 })
    expect(r.correct).toBe(false)
    expect(r.feedback).toContain('escalón')
  })

  it('no hint of a :all item states the answer, plain or with spaces (3000 or 3 000), in 300 items', () => {
    const rng = createRng(103)
    for (let i = 0; i < 300; i++) {
      const dim = DIMS[i % 3]
      const ex = buildMeasure('convert', dim, rng, new Set(), true, i % 2 === 0)
      if (ex.kind !== 'measure' || ex.mode !== 'convert') throw new Error('mode')
      const hints = hintsFor(ex)
      expect(hints.map((h) => h.level)).toEqual([1, 2, 3])
      if (ex.answer >= 10) {
        // The answer as the child may type it (3000) and as the pad shows it (3 000): neither appears in a hint.
        const formatted = ex.answer.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
        for (const h of hints) {
          expect(new RegExp(`(^|\\D)${formatted}(\\D|$)`).test(h.text), JSON.stringify(ex)).toBe(false)
        }
        expect(hintsLeak(hints.map((h) => h.text), ex.answer), JSON.stringify(ex)).toBe(false)
      }
    }
  })

  it('the first hint is the ladder of units, and the third works another example', () => {
    const rng = createRng(104)
    const ex = buildMeasure('convert', 'capacity', rng, new Set(), true)
    const hints = hintsFor(ex)
    expect(hints[0].text).toContain('kl hl dal l dl cl ml')
    expect(hints[2].text).toMatch(/^Ejemplo:/)
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

describe('medida: :all se aprende por escalones (un salto antes que varios)', () => {
  const countSteps = (learnt: boolean, seed: number) => {
    const rng = createRng(seed)
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 }
    for (let i = 0; i < 300; i++) {
      const ex = buildMeasure('convert', DIMS[i % 3], rng, new Set(), true, learnt)
      if (ex.kind !== 'measure' || ex.mode !== 'convert' || !ex.ladder) throw new Error('mode')
      counts[ex.ladder.steps]++
    }
    return counts
  }

  it('not learnt (no mastery): only one-step conversions, 300 items', () => {
    expect(countSteps(false, 110)).toEqual({ 1: 300, 2: 0, 3: 0 })
  })

  it('learnt: two and three steps appear, and a share of one-step items is kept (about 30%)', () => {
    const counts = countSteps(true, 111)
    expect(counts[2]).toBeGreaterThan(0)
    expect(counts[3]).toBeGreaterThan(0)
    expect(counts[1] / 300).toBeGreaterThan(0.15)
    expect(counts[1] / 300).toBeLessThan(0.45)
  })

  it('the level-3 example has as many steps as the item (one step: one ×10 or ÷10)', () => {
    const rng = createRng(112)
    for (let i = 0; i < 300; i++) {
      const ex = buildMeasure('convert', DIMS[i % 3], rng, new Set(), true, true)
      if (ex.kind !== 'measure' || ex.mode !== 'convert' || !ex.ladder) throw new Error('mode')
      const example = hintsFor(ex)[2].text
      expect(example.match(/diez/g)?.length ?? 0, example).toBe(ex.ladder.steps)
    }
  })

  it('through generate: no mastery gives one-step items; a mastered skill (box 2) gives several steps', () => {
    const now = new Date('2026-10-24T10:00:00Z')
    const skill = 'measure:convert:length:all'
    const plain = generate({ skills: [skill] }, 60, { rng: createRng(113), mastery: {}, now })
    expect(plain.every((e) => e.kind === 'measure' && e.mode === 'convert' && e.ladder?.steps === 1)).toBe(true)
    const mastered = { [skill]: { ...newMastery(skill, now), box: 2 } } as MasteryMap
    const learnt = generate({ skills: [skill] }, 60, { rng: createRng(113), mastery: mastered, now })
    const steps = new Set(learnt.map((e) => (e.kind === 'measure' && e.mode === 'convert' ? e.ladder?.steps : 0)))
    expect(steps.has(2) || steps.has(3)).toBe(true)
  })
})
