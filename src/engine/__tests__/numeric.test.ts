/* Numbers up to 9 999, cálculo mental exprés and signo igual flexible (3.º, block A). */
import { describe, expect, it } from 'vitest'
import type { Exercise, ExerciseKind, MasteryMap, SkillKey } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { GRADE3_SYLLABUS, allTopics } from '@/content/syllabus'
import { buildPlacement, placementBlockOf } from '../placement'
import {
  check, createRng, expandedParts, fmt, generate, hintsFor, holds, numberWords, roundTo, planDailySession,
} from '@/engine'
import { isMentalSkill, isValidSkill, kindsForSkill, mentalSkill, parseSkill, placeSkill, roundSkill, lineSkill } from '../skills'
import { newMastery } from '../mastery'
import { correctAnswer } from './helpers'
import type { ChildProfile } from '@/types'
import { buildMental, makeMental } from '../calc'
import { makePlaceValue } from '../numeric'

const NEW_KINDS: ExerciseKind[] = ['place-value', 'compare', 'order', 'round', 'number-line', 'mental', 'equation']

const NEW_SKILLS: SkillKey[] = [
  placeSkill('blocks'), placeSkill('expanded'), placeSkill('words'),
  'num:compare', 'num:order', roundSkill(10), roundSkill(100),
  lineSkill(10), lineSkill(100), lineSkill(1000),
  mentalSkill('dobles'), mentalSkill('mitades'), mentalSkill('completar10'), mentalSkill('completar100'),
  mentalSkill('completar1000'), mentalSkill('decenas'), mentalSkill('centenas'), mentalSkill('compensar'),
  'eq:flex',
]

const now = new Date('2026-10-22T10:00:00.000Z')
const SEEDS = [1, 2, 3, 5, 8, 13]

/** Numbers of a hint text without spaces or dots: '4 000' → '4000'. */
const squash = (text: string) => text.replace(/[\s.]/g, '')

describe('skill keys of the new kinds', () => {
  it('every new key parses, is valid and maps to its kind', () => {
    const expectKind: Record<string, ExerciseKind> = {
      place: 'place-value', compare: 'compare', order: 'order', round: 'round', line: 'number-line', mental: 'mental', equation: 'equation',
    }
    for (const key of NEW_SKILLS) {
      const p = parseSkill(key)
      expect(p, key).not.toBeNull()
      expect(isValidSkill(key), key).toBe(true)
      expect(kindsForSkill(key)[0], key).toBe(expectKind[p!.type])
    }
  })

  it('rejects malformed keys', () => {
    for (const key of ['num:place:roman', 'num:round:50', 'num:line:20', 'mental:triple', 'mental:', 'eq:x', 'num:compare:2']) {
      expect(isValidSkill(key), key).toBe(false)
    }
  })

  it('isMentalSkill only accepts the mental families', () => {
    expect(isMentalSkill('mental:dobles')).toBe(true)
    expect(isMentalSkill('mul:6x7')).toBe(false)
  })
})

describe('syllabus: the new topics teach the new skills', () => {
  it('numeros, cálculo mental and igualdad are available and every skill parses', () => {
    const topics = allTopics(GRADE3_SYLLABUS)
    const ids = topics.filter((t) => t.status === 'disponible').map((t) => t.id)
    for (const id of ['descomponer-9999', 'leer-escribir-9999', 'comparar-ordenar-9999', 'redondear', 'dobles-mitades', 'completar', 'decenas-centenas', 'compensar', 'igualdad']) {
      expect(ids, id).toContain(id)
    }
    for (const t of topics.filter((x) => NEW_SKILLS.some((s) => x.skills.includes(s)))) {
      for (const s of t.skills) expect(isValidSkill(s), `${t.id}: ${s}`).toBe(true)
    }
  })

  it('the numbers block comes first in the curriculum order (blocks, then words, then compare, then round)', () => {
    const ids = allTopics(GRADE3_SYLLABUS).map((t) => t.id)
    expect(ids.indexOf('descomponer-9999')).toBeLessThan(ids.indexOf('leer-escribir-9999'))
    expect(ids.indexOf('leer-escribir-9999')).toBeLessThan(ids.indexOf('comparar-ordenar-9999'))
    expect(ids.indexOf('comparar-ordenar-9999')).toBeLessThan(ids.indexOf('redondear'))
  })
})

describe('number helpers', () => {
  it('writes numbers in Spanish words', () => {
    expect(numberWords(4325)).toBe('cuatro mil trescientos veinticinco')
    expect(numberWords(1000)).toBe('mil')
    expect(numberWords(1021)).toBe('mil veintiuno')
    expect(numberWords(100)).toBe('cien')
    expect(numberWords(101)).toBe('ciento uno')
    expect(numberWords(200)).toBe('doscientos')
    expect(numberWords(16)).toBe('dieciséis')
    expect(numberWords(31)).toBe('treinta y uno')
    expect(numberWords(9999)).toBe('nueve mil novecientos noventa y nueve')
  })

  it('splits a number into its expanded form, zeros included', () => {
    expect(expandedParts(4325)).toEqual([4000, 300, 20, 5])
    expect(expandedParts(4025)).toEqual([4000, 0, 20, 5])
    expect(expandedParts(325)).toEqual([300, 20, 5])
  })

  it('rounds half up to decenas and centenas', () => {
    expect(roundTo(3745, 10)).toBe(3750)
    expect(roundTo(3744, 10)).toBe(3740)
    expect(roundTo(3745, 100)).toBe(3700)
    expect(roundTo(3750, 100)).toBe(3800)
    expect(roundTo(9995, 10)).toBe(10000)
  })

  it('formats thousands with a space', () => {
    expect(fmt(4325)).toBe('4 325')
    expect(fmt(325)).toBe('325')
    expect(fmt(1000)).toBe('1 000')
  })
})

describe('generators: every new kind yields valid, self-consistent exercises', () => {
  for (const skill of NEW_SKILLS) {
    it(`${skill} generates exercises whose correct answer checks as correct`, () => {
      for (const seed of SEEDS) {
        const items = generate({ skills: [skill] }, 12, { rng: createRng(seed), now })
        expect(items.length).toBe(12)
        for (const ex of items) {
          expect(ex.skill).toBe(skill)
          expect(ex.kind).toBe(kindsForSkill(skill)[0])
          const r = check(ex, correctAnswer(ex))
          expect(r.correct, `${ex.id}: ${JSON.stringify(correctAnswer(ex))}`).toBe(true)
          expect(ex.difficulty).toBeGreaterThanOrEqual(1)
          expect(ex.difficulty).toBeLessThanOrEqual(5)
        }
      }
    })
  }

  it('the new kinds can be requested by kind alone (free play and tests)', () => {
    for (const kind of NEW_KINDS) {
      const items = generate({ kinds: [kind] }, 6, { rng: createRng(4), now })
      expect(items.length, kind).toBe(6)
      expect(items.every((ex) => ex.kind === kind), kind).toBe(true)
    }
  })

  it('never repeats an item in one call when there is room', () => {
    const items = generate({ skills: [mentalSkill('dobles')] }, 10, { rng: createRng(9), now })
    expect(new Set(items.map((ex) => ex.id)).size).toBe(items.length)
  })

  it('place-value expanded parts add up to the number', () => {
    for (const ex of generate({ skills: [placeSkill('expanded')] }, 40, { rng: createRng(3), now })) {
      if (ex.kind !== 'place-value' || !Array.isArray(ex.answer)) throw new Error('expected expanded')
      expect(ex.answer.reduce((a, b) => a + b, 0)).toBe(ex.value)
    }
  })

  it('the order items are a permutation of the values, sorted in the requested direction', () => {
    for (const ex of generate({ skills: ['num:order'] }, 40, { rng: createRng(6), now })) {
      if (ex.kind !== 'order') throw new Error('expected order')
      expect([...ex.values].sort((a, b) => a - b)).toEqual([...ex.answer].sort((a, b) => a - b))
      const sorted = [...ex.answer]
      const ok = ex.direction === 'asc' ? sorted.every((v, i) => i === 0 || sorted[i - 1] <= v) : sorted.every((v, i) => i === 0 || sorted[i - 1] >= v)
      expect(ok).toBe(true)
    }
  })

  it('compare items cover the three signs', () => {
    const signs = new Set(generate({ skills: ['num:compare'] }, 80, { rng: createRng(12), now }).map((ex) => (ex.kind === 'compare' ? ex.answer : '')))
    expect([...signs].sort()).toEqual(['<', '=', '>'])
  })

  it('number-line tick items have a blank that is a labelled step of the line', () => {
    for (const ex of generate({ skills: [lineSkill(100)] }, 40, { rng: createRng(7), now })) {
      if (ex.kind !== 'number-line') throw new Error('expected line')
      expect(ex.ticks.length).toBe(5)
      expect(ex.ticks.every((t) => t % ex.step === 0)).toBe(true)
      if (ex.mode === 'tick') expect(ex.ticks[ex.blank]).toBe(ex.answer)
      else expect(ex.answer - (ex.start ?? 0)).toBe(ex.jump)
    }
  })

  it('round items: the answer is a multiple of the target', () => {
    for (const to of [10, 100] as const) {
      for (const ex of generate({ skills: [roundSkill(to)] }, 30, { rng: createRng(to), now })) {
        if (ex.kind !== 'round') throw new Error('expected round')
        expect(ex.answer % to).toBe(0)
        expect(Math.abs(ex.answer - ex.value)).toBeLessThanOrEqual(to / 2)
      }
    }
  })
})

describe('cálculo mental: arithmetic and families', () => {
  it('each family computes the right answer', () => {
    expect(makeMental('dobles', 35, 0, 70, '').answer).toBe(70)
    expect(makeMental('mitades', 80, 0, 40, '').answer).toBe(40)
    expect(makeMental('completar10', 47, 50, 3, '').answer).toBe(3)
    expect(makeMental('completar100', 60, 100, 40, '').answer).toBe(40)
    expect(makeMental('completar1000', 640, 1000, 360, '').answer).toBe(360)
  })

  it('generated items are arithmetically right for their family', () => {
    for (const family of ['dobles', 'mitades', 'completar10', 'completar100', 'completar1000', 'decenas', 'centenas', 'compensar'] as const) {
      for (const ex of generate({ skills: [mentalSkill(family)] }, 40, { rng: createRng(21), now })) {
        if (ex.kind !== 'mental') throw new Error('expected mental')
        switch (family) {
          case 'dobles': expect(ex.answer).toBe(2 * ex.a); break
          case 'mitades': expect(ex.answer * 2).toBe(ex.a); break
          case 'completar10': expect(ex.a + ex.answer).toBe(ex.b); break
          case 'completar100': expect(ex.a + ex.answer).toBe(100); break
          case 'completar1000': expect(ex.a + ex.answer).toBe(1000); break
          default: expect([ex.a + ex.b, ex.a - ex.b]).toContain(ex.answer)
        }
        expect(ex.answer).toBeGreaterThanOrEqual(0)
        expect(ex.answer).toBeLessThan(1000)
      }
    }
  })

  it('the buildMental helper avoids ids already used', () => {
    const rng = createRng(2)
    const used = new Set<string>()
    for (let i = 0; i < 5; i++) used.add(buildMental('completar10', rng, used).id)
    expect(used.size).toBe(5)
  })
})

describe('signo igual flexible: the balance holds', () => {
  it('every generated equation holds with its answer, with exactly one blank', () => {
    for (const ex of generate({ skills: ['eq:flex'] }, 120, { rng: createRng(17), now })) {
      if (ex.kind !== 'equation') throw new Error('expected equation')
      const blanks = [...ex.left, ...ex.right].filter((t) => t === null).length
      expect(blanks).toBe(1)
      expect(holds(ex, ex.answer), ex.id).toBe(true)
      expect(ex.answer).toBeGreaterThanOrEqual(1)
    }
  })

  it('the equation shapes include both sides as a single number and sums on both sides', () => {
    const items = generate({ skills: ['eq:flex'] }, 120, { rng: createRng(18), now })
    const single = items.some((ex) => ex.kind === 'equation' && (ex.left.length === 1 || ex.right.length === 1))
    const both = items.some((ex) => ex.kind === 'equation' && ex.left.length === 3 && ex.right.length === 3)
    expect(single).toBe(true)
    expect(both).toBe(true)
  })
})

describe('checks: wrong and empty answers', () => {
  const place = generate({ skills: [placeSkill('blocks')] }, 1, { rng: createRng(1), now })[0]
  const compare = generate({ skills: ['num:compare'] }, 1, { rng: createRng(2), now })[0]
  const mental = generate({ skills: [mentalSkill('compensar')] }, 1, { rng: createRng(3), now })[0]
  const equation = generate({ skills: ['eq:flex'] }, 1, { rng: createRng(4), now })[0]

  it('a wrong number gets a warm, non-empty feedback and no answer leak in it', () => {
    if (place.kind !== 'place-value') throw new Error('expected place')
    const wrong = place.value + 1
    const r = check(place, { type: 'number', value: wrong })
    expect(r.correct).toBe(false)
    expect(r.feedback && r.feedback.length).toBeGreaterThan(5)
  })

  it('an empty answer is incomplete', () => {
    const r = check(place, { type: 'number', value: null })
    expect(r.correct).toBe(false)
    expect(r.errorType).toBe('incomplete')
  })

  it('compare checks the sign, and a missing sign is incomplete', () => {
    if (compare.kind !== 'compare') throw new Error('expected compare')
    const other = compare.answer === '=' ? '<' : '='
    expect(check(compare, { type: 'sign', sign: compare.answer }).correct).toBe(true)
    expect(check(compare, { type: 'sign', sign: other }).correct).toBe(false)
    expect(check(compare, { type: 'sign', sign: null }).errorType).toBe('incomplete')
  })

  it('expanded form flags the wrong box and the empty ones', () => {
    const ex = makePlaceValue(4325, 'expanded')
    const bad = check(ex, { type: 'numbers', values: [4000, 30, 20, 5] })
    expect(bad.correct).toBe(false)
    expect(bad.wrongColumns).toEqual([1])
    expect(check(ex, { type: 'numbers', values: [4000, null, 20, 5] }).errorType).toBe('incomplete')
  })

  it('a mental answer one away is flagged as a near miss', () => {
    if (mental.kind !== 'mental') throw new Error('expected mental')
    const r = check(mental, { type: 'number', value: mental.answer + 1 })
    expect(r.correct).toBe(false)
    expect(r.errorType).toBe('fact')
  })

  it('an equation written as the sum of all visible numbers is an operation slip', () => {
    if (equation.kind !== 'equation') throw new Error('expected equation')
    const visible = [...equation.left, ...equation.right].filter((t): t is number => typeof t === 'number').reduce((a, b) => a + b, 0)
    if (visible === equation.answer) return
    expect(check(equation, { type: 'number', value: visible }).errorType).toBe('operation')
  })
})

describe('hints never give the answer away', () => {
  /** The statement the child already sees: a number there is not a leak. */
  const statementOf = (ex: Exercise): string => {
    switch (ex.kind) {
      case 'mental': return ex.prompt
      case 'equation': return `${ex.left.join(' ')} ${ex.right.join(' ')}`
      case 'round': return String(ex.value)
      case 'compare': return `${ex.left} ${ex.right}`
      case 'order': return ex.values.join(' ')
      // What is written on screen: the words, the expanded value, or nothing (blocks show no digits).
      case 'place-value': return ex.mode === 'words' ? numberWords(ex.value) : ex.mode === 'expanded' ? String(ex.value) : ''
      case 'number-line': return ex.mode === 'jump' ? String(ex.start) : ex.ticks.filter((_, i) => i !== ex.blank).join(' ')
      default: return ''
    }
  }

  for (const kind of NEW_KINDS) {
    it(`${kind}: three levels, and level 3 never contains the answer`, () => {
      const items = generate({ kinds: [kind] }, 60, { rng: createRng(31), now })
      for (const ex of items) {
        const hints = hintsFor(ex)
        expect(hints.map((h) => h.level), ex.id).toEqual([1, 2, 3])
        const statement = squash(statementOf(ex))
        const answers: string[] = Array.isArray((ex as { answer?: unknown }).answer)
          ? (ex as { answer: number[] }).answer.map(String)
          : typeof (ex as { answer?: unknown }).answer === 'number' ? [String((ex as { answer: number }).answer)] : []
        for (const h of hints) {
          for (const a of answers) {
            // Whole numbers only (15 is not 5), with or without the thousands space; short answers that the child
            // already sees on screen are not a leak.
            if (a.length < 2 || squash(statement).includes(a)) continue
            const whole = new RegExp(`(^|[^\\d])${a.split('').join('\\s?')}(?!\\d)`)
            expect(whole.test(h.text), `${ex.id} L${h.level}: ${h.text}`).toBe(false)
          }
        }
      }
    })
  }

  it('compare and equation hints never name the sign or the blank value', () => {
    for (const ex of generate({ skills: ['eq:flex'] }, 60, { rng: createRng(40), now })) {
      if (ex.kind !== 'equation') continue
      for (const h of hintsFor(ex)) expect(h.text).not.toMatch(new RegExp(`(^|\\D)${ex.answer}(\\D|$)`))
    }
  })
})

describe('warm-up of the daily session takes cálculo mental once it is learnt', () => {
  const child: ChildProfile = {
    id: 'child-mental', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
    companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
    settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: now.toISOString(), updatedAt: now.toISOString(),
  }
  const yesterday = new Date(now.getTime() - 86400000).toISOString()

  it('a learnt mental skill seen before today comes back in the warm-up, without hints, and never as a new skill', () => {
    const mastery: MasteryMap = {}
    for (const s of [mentalSkill('dobles'), mentalSkill('completar10')]) {
      mastery[s] = { ...newMastery(s, now), box: 2, attempts: 4, correct: 4, dueAt: yesterday, lastSeenAt: yesterday }
    }
    const plan = planDailySession({ child, mastery, attempts: [], syllabus: GRADE3_SYLLABUS, now })
    const warm = plan.blocks.find((b) => b.id === 'warmup')!.items
    expect(warm.length).toBeGreaterThan(0)
    expect(warm.some((i) => i.exercise.kind === 'mental')).toBe(true)
    expect(warm.every((i) => !i.isNew)).toBe(true)
  })
})

describe('placement: números hasta 9 999 are part of the numeros block', () => {
  it('the numbers block has the new items and the placement maps them to numeros', () => {
    const items = buildPlacement('test-seed', now)
    const numeros = items.filter((i) => i.block === 'numeros').map((i) => i.exercise.skill)
    expect(numeros.some((s) => parseSkill(s)?.type === 'place')).toBe(true)
    expect(numeros.some((s) => s === 'num:compare')).toBe(true)
    expect(numeros.some((s) => s === roundSkill(10))).toBe(true)
    expect(placementBlockOf('num:compare')).toBe('numeros')
    expect(placementBlockOf(mentalSkill('dobles'))).toBeNull()
  })
})
