import { describe, expect, it } from 'vitest'
import type { Answer, Exercise, MasteryMap } from '@/types'
import {
  buildClock, checkClock, clockSkillsOf, expectedClock, hintsClock, makeCalendarSeconds, makeClockRead, makeTimeConvert, makeTimeDuration,
  statementClock,
} from '../clock'
import { check, createRng, describeSkill, generate, kindsForSkill, newMastery, parseSkill, placementBlockOf, planDailySession } from '../index'
import { availableSkills, GRADE3_SYLLABUS } from '@/content/syllabus'
import { clockPhrase, digital } from '../time'

const KEYS = [
  'clock:read:30', 'clock:read:15', 'clock:read:5', 'clock:set:30', 'clock:set:5', 'clock:convert:day',
  'time:end', 'time:elapsed', 'time:units', 'cal:weekday', 'cal:month',
]

/** Deterministic PRNG for the tests (mulberry32). */
function rngOf(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sample(n: number): Exercise[] {
  const out: Exercise[] = []
  let seed = 1
  for (const key of KEYS) {
    for (let i = 0; i < n; i++) {
      const rng = rngOf(seed++)
      const ex = buildClock(key, rng, new Set(), i % 2 === 0)
      if (!ex) throw new Error(`no exercise for ${key}`)
      out.push(ex)
    }
  }
  return out
}

describe('skill keys of the tiempo block', () => {
  it('parses every key and maps it to its kind', () => {
    for (const key of KEYS) expect(parseSkill(key), key).not.toBeNull()
    expect(kindsForSkill('clock:read:5')).toEqual(['clock-read'])
    expect(kindsForSkill('clock:set:30')).toEqual(['clock-set'])
    expect(kindsForSkill('clock:convert:day')).toEqual(['time-convert'])
    expect(kindsForSkill('time:end')).toEqual(['time-duration'])
    expect(kindsForSkill('time:elapsed')).toEqual(['time-duration'])
    expect(kindsForSkill('time:units')).toEqual(['calendar'])
    expect(kindsForSkill('cal:weekday')).toEqual(['calendar'])
    expect(kindsForSkill('cal:month')).toEqual(['calendar'])
  })

  it('rejects keys outside the block', () => {
    expect(parseSkill('clock:read:10')).toBeNull()
    expect(parseSkill('clock:set:15')).toBeNull()
    expect(parseSkill('time:years')).toBeNull()
    expect(parseSkill('cal:year')).toBeNull()
  })

  it('describes every key for adults and places them in the tiempo block of the placement', () => {
    for (const key of KEYS) expect(describeSkill(key).length, key).toBeGreaterThan(5)
    expect(placementBlockOf('clock:read:5')).toBe('tiempo')
    expect(placementBlockOf('time:units')).toBe('tiempo')
    expect(clockSkillsOf('clock-read')).toEqual(['clock:read:30', 'clock:read:15', 'clock:read:5'])
  })

  it('is taught in the syllabus as available topics that the planner can use', () => {
    const skills = availableSkills(GRADE3_SYLLABUS)
    for (const key of KEYS) expect(skills, key).toContain(key)
    const plan = planDailySession({
      child: { id: 'c1' } as never, mastery: {}, syllabus: GRADE3_SYLLABUS, now: new Date('2026-10-22T09:00:00Z'),
    })
    expect(plan.blocks.flatMap((b) => b.items).length).toBeGreaterThan(0)
    const exs = generate({ skills: ['clock:read:30', 'time:units'] }, 4, { rng: createRng(5), now: new Date('2026-10-22T09:00:00Z') })
    expect(exs).toHaveLength(4)
    expect(exs.every((e) => e.kind === 'clock-read' || e.kind === 'calendar')).toBe(true)
  })
})

describe('generators', () => {
  const items = sample(60)

  it('makes valid items for every kind', () => {
    for (const ex of items) {
      switch (ex.kind) {
        case 'clock-read': {
          expect(ex.hour).toBeGreaterThanOrEqual(1)
          expect(ex.hour).toBeLessThanOrEqual(12)
          expect(ex.minute % 5).toBe(0)
          if (ex.mode === 'phrase') {
            expect(ex.options).toHaveLength(3)
            expect(new Set(ex.options).size).toBe(3)
            expect(ex.options[ex.correct]).toBe(clockPhrase(ex.hour, ex.minute))
          }
          break
        }
        case 'clock-set':
          expect(ex.answer.minute % 5).toBe(0)
          expect(ex.prompt).toBe(clockPhrase(ex.answer.hour, ex.answer.minute))
          break
        case 'time-convert':
          expect(ex.answer.hour).toBeLessThanOrEqual(23)
          expect(ex.answer.minute % 5).toBe(0)
          if (ex.direction === 'to-phrase') {
            expect(new Set(ex.options).size).toBe(3)
            expect(ex.options[ex.correct]).toBe(clockPhrase(ex.answer.hour, ex.answer.minute, true))
          }
          break
        case 'time-duration': {
          expect([15, 20, 30, 40, 45, 60, 75, 90, 120]).toContain(ex.duration)
          if (ex.ask === 'end') expect(ex.answer).toEqual(ex.end)
          else expect(ex.answer).toBe(ex.duration)
          break
        }
        case 'calendar':
          if (ex.topic === 'weekday') {
            expect(new Set(ex.options).size).toBe(4)
            expect(ex.options[ex.answer]).toBeDefined()
            expect(ex.week).toBeDefined()
          } else {
            expect(ex.answer).toBeGreaterThan(0)
          }
          break
        default:
          throw new Error(`unexpected kind ${ex.kind}`)
      }
    }
  })

  it('keeps the child in the right step: phrases first, the minutes fives in clock:read:5', () => {
    const reads = items.filter((e) => e.kind === 'clock-read')
    expect(reads.some((e) => e.kind === 'clock-read' && e.mode === 'phrase')).toBe(true)
    expect(reads.some((e) => e.kind === 'clock-read' && e.mode === 'write')).toBe(true)
    const r30 = buildClock('clock:read:30', rngOf(9), new Set(), false)
    expect(r30 && r30.kind === 'clock-read' && [0, 30].includes(r30.minute)).toBe(true)
    const r15 = buildClock('clock:read:15', rngOf(10), new Set(), true)
    expect(r15 && r15.kind === 'clock-read' && [15, 45].includes(r15.minute)).toBe(true)
  })

  it('never asks for February (its length depends on the year)', () => {
    const months = items.filter((e) => e.kind === 'calendar' && e.topic === 'month')
    expect(months.every((e) => e.kind === 'calendar' && e.month !== 'febrero')).toBe(true)
  })
})

describe('hints never give the answer', () => {
  it('no hint states the time, the digital time or the number asked', () => {
    for (const ex of sample(40)) {
      const hints = hintsClock(ex)
      expect(hints, ex.kind).not.toBeNull()
      expect(hints).toHaveLength(3)
      const texts = (hints ?? []).map((h) => h.text)
      if (ex.kind === 'clock-read' || ex.kind === 'clock-set') {
        const phrase = clockPhrase(ex.answer.hour, ex.answer.minute)
        for (const t of texts) expect(t.includes(phrase), `${ex.id}: ${t}`).toBe(false)
      }
      if (ex.kind === 'time-convert') {
        for (const t of texts) expect(t.includes(digital(ex.answer.hour, ex.answer.minute)), t).toBe(false)
      }
      if (ex.kind === 'time-duration' && ex.ask === 'end') {
        for (const t of texts) expect(t.includes(clockPhrase(ex.end.hour, ex.end.minute)), t).toBe(false)
      }
      if (ex.kind === 'time-duration' && ex.ask === 'elapsed') {
        for (const t of texts) expect(new RegExp(`\\b${ex.duration}\\b`).test(t), `${ex.duration} in ${t}`).toBe(false)
      }
      if (ex.kind === 'calendar' && ex.topic !== 'weekday') {
        for (const t of texts) expect(new RegExp(`\\b${ex.answer}\\b`).test(t), `${ex.answer} in ${t}`).toBe(false)
      }
    }
  })
})

describe('checks', () => {
  const read = makeClockRead(3, 20, 'write', rngOf(1), 5)
  const phrase = makeClockRead(3, 20, 'phrase', rngOf(2), 5)

  it('judges a written time by its hour and its minutes, naming the mistake', () => {
    expect(check(read, { type: 'time', hour: 3, minute: 20 } as Answer)).toMatchObject({ correct: true })
    expect(check(read, { type: 'time', hour: 4, minute: 20 } as Answer)).toMatchObject({ correct: false, errorType: 'clock-hour' })
    expect(check(read, { type: 'time', hour: 3, minute: 25 } as Answer)).toMatchObject({ correct: false, errorType: 'clock-minute' })
    expect(check(read, { type: 'time', hour: null, minute: 20 } as Answer)).toMatchObject({ correct: false, errorType: 'incomplete' })
    expect(check(read, { type: 'time', hour: 0, minute: 20 } as Answer)).toMatchObject({ correct: false })
  })

  it('judges the chosen phrase and names the wrong part when it is wrong', () => {
    if (phrase.kind !== 'clock-read') throw new Error()
    expect(checkClock(phrase, { type: 'choice', index: phrase.correct })).toMatchObject({ correct: true })
    const wrong = phrase.options.findIndex((_, i) => i !== phrase.correct)
    const r = checkClock(phrase, { type: 'choice', index: wrong })
    expect(r?.correct).toBe(false)
    expect(['clock-hour', 'clock-minute']).toContain(r?.errorType)
    expect(checkClock(phrase, { type: 'choice', index: null })).toMatchObject({ errorType: 'incomplete' })
  })

  it('judges the 24 h digital time and tells a period mistake from an hour mistake', () => {
    const ex = makeTimeConvert(14, 30, 'to-digital', rngOf(3))
    expect(checkClock(ex, { type: 'time', hour: 14, minute: 30 } as Answer)).toMatchObject({ correct: true })
    expect(checkClock(ex, { type: 'time', hour: 2, minute: 30 } as Answer)).toMatchObject({ correct: false, errorType: 'clock-period' })
    expect(checkClock(ex, { type: 'time', hour: 15, minute: 30 } as Answer)).toMatchObject({ correct: false, errorType: 'clock-hour' })
    expect(checkClock(ex, { type: 'time', hour: 14, minute: 20 } as Answer)).toMatchObject({ correct: false, errorType: 'clock-minute' })
  })

  it('judges the end time of a duration and the minutes that pass', () => {
    const end = makeTimeDuration('end', { hour: 5, minute: 0 }, 90)
    expect(end.end).toEqual({ hour: 6, minute: 30 })
    expect(checkClock(end, { type: 'time', hour: 6, minute: 30 } as Answer)).toMatchObject({ correct: true })
    expect(checkClock(end, { type: 'time', hour: 5, minute: 30 } as Answer)).toMatchObject({ correct: false, errorType: 'clock-hour' })
    const el = makeTimeDuration('elapsed', { hour: 4, minute: 15 }, 45)
    expect(checkClock(el, { type: 'number', value: 45 } as Answer)).toMatchObject({ correct: true })
    expect(checkClock(el, { type: 'number', value: 60 } as Answer)).toMatchObject({ correct: false })
  })

  it('judges calendar answers: the weekday choice and the numbers of units and months', () => {
    const week = buildClock('cal:weekday', rngOf(4), new Set(), false)!
    if (week.kind !== 'calendar' || !week.week) throw new Error()
    expect(checkClock(week, { type: 'choice', index: week.answer } as Answer)).toMatchObject({ correct: true })
    const other = (week.answer + 1) % 4
    expect(checkClock(week, { type: 'choice', index: other } as Answer)).toMatchObject({ correct: false })
    const units = buildClock('time:units', rngOf(5), new Set(), false)!
    if (units.kind !== 'calendar') throw new Error()
    expect(checkClock(units, { type: 'number', value: units.answer } as Answer)).toMatchObject({ correct: true })
    expect(checkClock(units, { type: 'number', value: units.answer + 1 } as Answer)).toMatchObject({ correct: false })
    expect(expectedClock(units)).toBe(String(units.answer))
  })

  it('shows the right answer in the check for other kinds of answer shape', () => {
    const r = check(read, { type: 'number', value: 3 })
    expect(r.correct).toBe(false)
    expect(r.expected).toBe(clockPhrase(3, 20))
  })
})

describe('statements', () => {
  it('names the question of an item without giving the reading of the clock', () => {
    const read = makeClockRead(3, 20, 'phrase', rngOf(8), 5)
    expect(statementClock(read)).toBe('Mira el reloj y di qué hora es')
    const dur = makeTimeDuration('end', { hour: 5, minute: 0 }, 60)
    expect(statementClock(dur)).toContain('dura 60 minutos')
  })
})


describe('tiempo: time:seconds (minutos y segundos)', () => {
  const hintsLeakClock = (texts: string[], answer: number) =>
    texts.some((t) => new RegExp(`(^|\\D)${answer}(\\D|$)`).test(t.replace(/\s/g, '')))

  it('parses the key as a calendar item and describes it', () => {
    expect(parseSkill('time:seconds')).toEqual({ type: 'calendar', topic: 'seconds' })
    expect(kindsForSkill('time:seconds')).toEqual(['calendar'])
    expect(describeSkill('time:seconds').length).toBeGreaterThan(5)
    expect(placementBlockOf('time:seconds')).toBe('tiempo')
  })

  it('300 items: a minute has 60 seconds, the answers are whole, and no item goes past 10 minutes', () => {
    const rng = createRng(111)
    const forms = new Set<string>()
    for (let i = 0; i < 300; i++) {
      const ex = buildClock('time:seconds', rng, new Set(), false, true)
      if (!ex || ex.kind !== 'calendar' || !ex.seconds) throw new Error('calendar seconds')
      const item = ex.seconds
      forms.add(item.form)
      expect(Number.isInteger(ex.answer)).toBe(true)
      expect(ex.answer).toBeGreaterThan(0)
      if (item.form === 'min-to-s') {
        expect(item.minutes).toBeGreaterThanOrEqual(2)
        expect(item.minutes).toBeLessThanOrEqual(10)
        expect(ex.answer).toBe(item.minutes * 60)
      } else if (item.form === 'mixed') {
        expect(item.seconds % 5).toBe(0)
        expect(item.seconds).toBeGreaterThan(0)
        expect(item.seconds).toBeLessThan(60)
        expect(ex.answer).toBe(item.minutes * 60 + item.seconds)
      } else {
        expect(item.total % 60).toBe(0)
        expect(ex.answer * 60).toBe(item.total)
      }
      expect(ex.answer).toBeLessThanOrEqual(600)
      expect(check(ex, { type: 'number', value: ex.answer } as Answer)).toMatchObject({ correct: true })
      expect(check(ex, { type: 'number', value: ex.answer + 1 } as Answer)).toMatchObject({ correct: false })
      expect(expectedClock(ex)).toBe(String(ex.answer))
    }
    expect([...forms].sort()).toEqual(['min-to-s', 'mixed', 's-to-min'])
  })

  it('hints give three levels and never state the answer, plain or with spaces', () => {
    const rng = createRng(112)
    for (let i = 0; i < 300; i++) {
      const ex = buildClock('time:seconds', rng, new Set(), false, true)
      if (!ex || ex.kind !== 'calendar') throw new Error('calendar seconds')
      const hints = hintsClock(ex)
      expect(hints?.map((h) => h.level)).toEqual([1, 2, 3])
      if (ex.answer >= 10) {
        const texts = hints!.map((h) => h.text)
        expect(hintsLeakClock(texts, ex.answer), JSON.stringify(ex)).toBe(false)
        const formatted = ex.answer.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
        for (const t of texts) expect(t, JSON.stringify(ex)).not.toContain(formatted)
      }
    }
  })

  it('the minutes-to-seconds hint never gives the product for the item (2 min is never 2 × 60)', () => {
    const ex = makeCalendarSeconds({ form: 'min-to-s', minutes: 2 })
    const texts = hintsClock(ex)!.map((h) => h.text).join(' ')
    expect(texts).not.toMatch(/2 × 60|2 veces|dos minutos son/)
    expect(hintsClock(ex)![0].text).not.toContain('120')
  })

  it('before it is learnt, time:seconds is only minutes to seconds; learnt, it mixes the three forms', () => {
    const rng = createRng(113)
    const notLearnt = new Set<string>()
    for (let i = 0; i < 300; i++) {
      const ex = buildClock('time:seconds', rng, new Set(), false, false)
      if (!ex || ex.kind !== 'calendar' || !ex.seconds) throw new Error('calendar seconds')
      notLearnt.add(ex.seconds.form)
    }
    expect([...notLearnt]).toEqual(['min-to-s'])
    const learnt = new Set<string>()
    for (let i = 0; i < 300; i++) {
      const ex = buildClock('time:seconds', rng, new Set(), false, true)
      if (!ex || ex.kind !== 'calendar' || !ex.seconds) throw new Error('calendar seconds')
      learnt.add(ex.seconds.form)
    }
    expect([...learnt].sort()).toEqual(['min-to-s', 'mixed', 's-to-min'])
  })

  it('through generate: no mastery gives minutes to seconds; a mastered skill (box 2) gives the other forms', () => {
    const now = new Date('2026-10-24T10:00:00Z')
    const plain = generate({ skills: ['time:seconds'] }, 60, { rng: createRng(114), mastery: {}, now })
    expect(plain.every((e) => e.kind === 'calendar' && e.seconds?.form === 'min-to-s')).toBe(true)
    const mastered = { 'time:seconds': { ...newMastery('time:seconds', now), box: 2 } } as MasteryMap
    const learnt = generate({ skills: ['time:seconds'] }, 60, { rng: createRng(114), mastery: mastered, now })
    expect(learnt.some((e) => e.kind === 'calendar' && e.seconds?.form !== 'min-to-s')).toBe(true)
  })
})
