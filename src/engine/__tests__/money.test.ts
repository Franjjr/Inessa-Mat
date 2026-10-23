import { describe, expect, it } from 'vitest'
import type { Answer, ChildProfile, Exercise, MasteryMap, MoneyMode } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { availableSkills, GRADE3_SYLLABUS, teachingOrder } from '@/content/syllabus'
import {
  buildMoney, check, checkMoney, createRng, describeSkill, euros, hintsFor, kindsForSkill, moneyStatement, parseSkill,
  PIECES, pieceName, planDailySession, splitCents, MONEY_MODES,
} from '@/engine'
import { newMastery } from '@/engine/mastery'
import { measureSkill, moneySkill } from '@/engine/skills'

const SAMPLES = 120

/** Greedy change with the euro pieces: a valid way to pay any amount (the child may use any combination). */
function greedy(cents: number): number[] {
  const out: number[] = []
  let rest = cents
  for (const p of [...PIECES].reverse()) {
    while (rest >= p) {
      out.push(p)
      rest -= p
    }
  }
  return out
}

/** Hints must never state the result: no run of digits equal to the answer (answers under 10 are too common to test). */
function hintsLeak(ex: Exercise, answer: number | number[]): boolean {
  const values = Array.isArray(answer) ? answer : [answer]
  const texts = hintsFor(ex).map((h) => h.text)
  return values.some((v) => v >= 10 && texts.some((t) => new RegExp(`(^|\\D)${v}(\\D|$)`).test(t.replace(/\s/g, ''))))
}

describe('dinero: money amounts and names', () => {
  it('writes amounts with a decimal comma and the euro sign', () => {
    expect(euros(340)).toBe('3,40 €')
    expect(euros(500)).toBe('5 €')
    expect(euros(5)).toBe('0,05 €')
    expect(euros(2000)).toBe('20 €')
  })

  it('names the coins and the notes as a child says them', () => {
    expect(pieceName(1)).toBe('1 céntimo')
    expect(pieceName(50)).toBe('50 céntimos')
    expect(pieceName(200)).toBe('2 €')
    expect(pieceName(5000)).toBe('50 €')
  })

  it('splits céntimos into euros and céntimos', () => {
    expect(splitCents(235)).toEqual([2, 35])
    expect(splitCents(100)).toEqual([1, 0])
  })
})

describe('dinero: skill keys', () => {
  it('parses every money skill and maps it to the money kind', () => {
    for (const mode of MONEY_MODES) {
      const key = moneySkill(mode)
      expect(parseSkill(key)).toEqual({ type: 'money', mode })
      expect(kindsForSkill(key)).toEqual(['money'])
      expect(describeSkill(key).length).toBeGreaterThan(3)
    }
  })

  it('rejects unknown money skills', () => {
    expect(parseSkill('money:tarjeta')).toBeNull()
    expect(parseSkill('money:')).toBeNull()
  })

  it('the syllabus blocks dinero and medida are available and generate exercises', () => {
    const skills = availableSkills(GRADE3_SYLLABUS)
    for (const mode of ['recognise', 'pay', 'change', 'add', 'compare', 'convert'] as MoneyMode[]) {
      expect(skills).toContain(moneySkill(mode))
    }
    for (const key of ['measure:unit:length', 'measure:convert:mass', 'measure:ruler', 'measure:add', 'measure:estimate']) {
      expect(skills).toContain(key)
      expect(parseSkill(key)).not.toBeNull()
    }
    expect(measureSkill('convert', 'capacity')).toBe('measure:convert:capacity')
  })
})

describe('dinero: generators are valid and grade their own answers', () => {
  it('recognise: four different options that include the piece', () => {
    const rng = createRng(11)
    for (let i = 0; i < SAMPLES; i++) {
      const ex = buildMoney('recognise', rng, new Set())
      if (ex.kind !== 'money' || ex.mode !== 'recognise') throw new Error('mode')
      expect(ex.options).toHaveLength(4)
      expect(new Set(ex.options).size).toBe(4)
      expect(ex.options).toContain(ex.piece)
      expect(PIECES).toContain(ex.piece)
      const right: Answer = { type: 'option', value: String(ex.piece) }
      expect(check(ex, right).correct).toBe(true)
      const wrong = ex.options.find((o) => o !== ex.piece)!
      expect(check(ex, { type: 'option', value: String(wrong) }).correct).toBe(false)
    }
  })

  it('pay: an exact tray is correct, a short or over tray is not (and the feedback says which)', () => {
    const rng = createRng(12)
    for (let i = 0; i < SAMPLES; i++) {
      const ex = buildMoney('pay', rng, new Set())
      if (ex.kind !== 'money' || ex.mode !== 'pay') throw new Error('mode')
      expect(ex.price % 5).toBe(0)
      expect(ex.price).toBeGreaterThanOrEqual(5)
      const exact = greedy(ex.price)
      expect(checkMoney(ex, { type: 'pieces', pieces: exact }).correct).toBe(true)
      // One piece less than an exact tray is short; a one-piece price can only be emptied.
      const short = checkMoney(ex, { type: 'pieces', pieces: exact.length > 1 ? exact.slice(0, -1) : [] })
      expect(short.correct).toBe(false)
      if (exact.length > 1) expect(short.feedback).toContain('Te falta')
      const over = checkMoney(ex, { type: 'pieces', pieces: [...exact, 5000] })
      expect(over.correct).toBe(false)
      expect(over.feedback).toContain('Te has pasado')
    }
  })

  it('pay: an empty tray is incomplete, and only pieces of the purse count', () => {
    const ex = buildMoney('pay', createRng(3), new Set()) as Exercise
    expect(check(ex, { type: 'pieces', pieces: [] }).errorType).toBe('incomplete')
    expect(check(ex, { type: 'number', value: ex.kind === 'money' && ex.mode === 'pay' ? ex.price : 0 }).correct).toBe(false)
  })

  it('change: the euros and céntimos boxes must match the change exactly', () => {
    const rng = createRng(13)
    for (let i = 0; i < SAMPLES; i++) {
      const ex = buildMoney('change', rng, new Set())
      if (ex.kind !== 'money' || ex.mode !== 'change') throw new Error('mode')
      expect(ex.paid).toBeGreaterThan(ex.price)
      expect(ex.answer).toBe(ex.paid - ex.price)
      expect(ex.text).toContain('{child}')
      const [e, c] = splitCents(ex.answer)
      expect(checkMoney(ex, { type: 'numbers', values: [e, c] }).correct).toBe(true)
      expect(checkMoney(ex, { type: 'numbers', values: [e + 1, c] }).correct).toBe(false)
      expect(checkMoney(ex, { type: 'numbers', values: [e, null] }).errorType).toBe('incomplete')
    }
  })

  it('add: the sum of the prices, in cards or in a story', () => {
    const rng = createRng(14)
    let stories = 0
    for (let i = 0; i < SAMPLES; i++) {
      const ex = buildMoney('add', rng, new Set())
      if (ex.kind !== 'money' || ex.mode !== 'add') throw new Error('mode')
      expect(ex.items.length === 2 || ex.items.length === 3).toBe(true)
      expect(ex.answer).toBe(ex.items.reduce((s, it) => s + it.price, 0))
      if (ex.story) {
        stories++
        expect(ex.text).toMatch(/¿Cuánto tiene que pagar/)
      }
      const [e, c] = splitCents(ex.answer)
      expect(checkMoney(ex, { type: 'numbers', values: [e, c] }).correct).toBe(true)
      expect(checkMoney(ex, { type: 'numbers', values: [e, (c + 50) % 100] }).correct).toBe(false)
    }
    expect(stories).toBeGreaterThan(0)
  })

  it('compare: the answer is the dearer (or cheaper) item, never a tie', () => {
    const rng = createRng(15)
    for (let i = 0; i < SAMPLES; i++) {
      const ex = buildMoney('compare', rng, new Set())
      if (ex.kind !== 'money' || ex.mode !== 'compare') throw new Error('mode')
      const [a, b] = ex.items
      expect(Math.abs(a.price - b.price)).toBeGreaterThanOrEqual(20)
      const best = ex.question === 'more' ? (a.price > b.price ? a : b) : (a.price < b.price ? a : b)
      expect(ex.answer).toBe(best.name)
      expect(checkMoney(ex, { type: 'option', value: best.name }).correct).toBe(true)
      const other = ex.items.find((it) => it.name !== best.name)!
      expect(checkMoney(ex, { type: 'option', value: other.name }).correct).toBe(false)
    }
  })

  it('convert: céntimos from euros, and euros plus céntimos from céntimos', () => {
    const rng = createRng(16)
    for (let i = 0; i < SAMPLES; i++) {
      const ex = buildMoney('convert', rng, new Set())
      if (ex.kind !== 'money' || ex.mode !== 'convert') throw new Error('mode')
      if (ex.direction === 'to-cents') {
        expect(ex.answer).toBe(ex.amount)
        expect(checkMoney(ex, { type: 'number', value: ex.amount }).correct).toBe(true)
        expect(checkMoney(ex, { type: 'number', value: ex.amount / 100 }).correct).toBe(false)
      } else {
        const [e, c] = splitCents(ex.amount)
        expect(checkMoney(ex, { type: 'numbers', values: [e, c] }).correct).toBe(true)
        if (e !== c) expect(checkMoney(ex, { type: 'numbers', values: [c, e] }).correct).toBe(false)
      }
    }
  })
})

describe('dinero: hints never give the result', () => {
  it('no hint of any money exercise states the answer', () => {
    const rng = createRng(21)
    for (const mode of MONEY_MODES) {
      for (let i = 0; i < SAMPLES; i++) {
        const ex = buildMoney(mode, rng, new Set())
        const hints = hintsFor(ex)
        expect(hints.map((h) => h.level)).toEqual([1, 2, 3])
        if (ex.kind !== 'money') throw new Error('kind')
        const answer = ex.mode === 'change' || ex.mode === 'add' ? ex.answer
          : ex.mode === 'pay' ? ex.price
            : ex.mode === 'convert' ? (ex.answer as number | number[])
              : null
        if (answer !== null && typeof answer !== 'string') {
          expect(hintsLeak(ex, answer), `${mode}: ${JSON.stringify(ex)}`).toBe(false)
        }
      }
    }
  })
})

describe('dinero and medida in the daily plan', () => {
  const now = new Date('2026-10-22T10:00:00.000Z')
  const child: ChildProfile = {
    id: 'child-money', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
    companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
    settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: now.toISOString(), updatedAt: now.toISOString(),
  }
  /** Every skill of the topics before `topicId` mastered (box 3), so that topic is the one taught today. */
  function masteredBefore(topicId: string): MasteryMap {
    const mastery: MasteryMap = {}
    for (const t of teachingOrder(GRADE3_SYLLABUS)) {
      if (t.id === topicId) break
      for (const s of t.skills) mastery[s] = { ...newMastery(s, now), box: 3, attempts: 5, correct: 5, dueAt: null, lastSeenAt: null }
    }
    return mastery
  }

  it('a child at the money or the measure topic is taught it in «Lo nuevo»', () => {
    for (const [topic, kind] of [['monedas-billetes', 'money'], ['unidades-longitud', 'measure']] as const) {
      const plan = planDailySession({ child, mastery: masteredBefore(topic), syllabus: GRADE3_SYLLABUS, now, attempts: [] })
      expect(plan.topic?.id).toBe(topic)
      const fresh = plan.blocks.find((b) => b.id === 'new')!.items
      expect(fresh.length).toBeGreaterThan(0)
      expect(fresh.every((i) => i.exercise.kind === kind)).toBe(true)
      expect(plan.example?.exercise.kind).toBe(kind)
    }
  })
})

describe('dinero: statements name the question, not the result', () => {
  it('the statement of a change or convert exercise never repeats the answer', () => {
    const rng = createRng(31)
    for (let i = 0; i < 40; i++) {
      const ex = buildMoney('convert', rng, new Set())
      if (ex.kind !== 'money' || ex.mode !== 'convert') throw new Error('mode')
      const answer = Array.isArray(ex.answer) ? ex.answer.join(',') : String(ex.answer)
      expect(moneyStatement(ex)).not.toContain(answer)
    }
  })
})
