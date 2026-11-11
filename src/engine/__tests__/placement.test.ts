import { describe, expect, it } from 'vitest'
import type { AttemptRecord } from '@/types'
import { GRADE2_SYLLABUS, GRADE3_SYLLABUS } from '@/content/syllabus'
import { initialProgress } from '@/content'
import { PLACEMENT_ACTIVITY, PLACEMENT_CLEAR_MIN, PLACEMENT_COUNT, buildPlacement, placementBlockOf, placementKnownTopics, summarizePlacement } from '../placement'
import { placementRunFlags, topicOfToday } from '../topicOfToday'

const now = new Date('2026-10-22T10:00:00.000Z')

describe('buildPlacement (prueba inicial)', () => {
  it('has about twenty items in the eight blocks, one of each need (the newer blocks: one item each)', () => {
    const items = buildPlacement('child-1|2026-10-22', now)
    expect(items).toHaveLength(PLACEMENT_COUNT)
    const blocks = new Set(items.map((i) => i.block))
    expect([...blocks].sort()).toEqual(['dinero-medida', 'dividir', 'fracciones-geometria', 'numeros', 'problemas', 'sumas-restas', 'tablas', 'tiempo'].sort())
    // The newer blocks add one item each, so the placement stays about ten minutes.
    for (const block of ['tiempo', 'fracciones-geometria', 'dinero-medida']) expect(items.filter((i) => i.block === block)).toHaveLength(1)
    expect(items.find((i) => i.block === 'dinero-medida')?.exercise.kind).toBe('money')
    expect(items.filter((i) => i.block === 'tablas').length).toBe(4)
    expect(items.filter((i) => i.block === 'problemas').every((i) => i.exercise.kind === 'bar-problem')).toBe(true)
  })

  it('is deterministic for a seed, and its items are real exercises with answers', () => {
    const a = buildPlacement('x', now).map((i) => i.exercise.id)
    const b = buildPlacement('x', now).map((i) => i.exercise.id)
    expect(a).toEqual(b)
    for (const { exercise } of buildPlacement('x', now)) expect(typeof exercise.skill).toBe('string')
  })

  it('the 3.º and 4.º placements keep their twenty items', () => {
    for (const grade of [3, 4]) expect(buildPlacement(`child-${grade}|2026-10-22`, now, grade), `grade ${grade}`).toHaveLength(PLACEMENT_COUNT)
  })

  it('the 4.º placement asks numbers up to 99 999 and reading a decimal', () => {
    const skills = buildPlacement('child-4|2026-10-22', now, 4).map((i) => i.exercise.skill)
    expect(skills).toContain('num:place:words:99999')
    expect(skills).toContain('dec:read:1')
    expect(skills).not.toContain('num:place:words')
    expect(skills).not.toContain('frac:of:4')
  })

  it('maps the newer skills to the block of their subject, so the adult summary counts them', () => {
    expect(placementBlockOf('dec:read:1')).toBe('fracciones-geometria')
    expect(placementBlockOf('dec:add:2')).toBe('fracciones-geometria')
    expect(placementBlockOf('num:ordinal:10')).toBe('numeros')
    expect(placementBlockOf('mul:col:2x2')).toBe('tablas')
    expect(placementBlockOf('div:3x2:round')).toBe('dividir')
    expect(placementBlockOf('check:div')).toBe('dividir')
    expect(placementBlockOf('check:sub')).toBe('sumas-restas')
    expect(placementBlockOf('chart:freq')).toBe('problemas')
    expect(placementBlockOf('mental:combinadas')).toBeNull()
  })

  it('maps every skill to its block', () => {
    expect(placementBlockOf('add:3d:c1')).toBe('sumas-restas')
    expect(placementBlockOf('sub:3d:b0')).toBe('sumas-restas')
    expect(placementBlockOf('mul:6x7')).toBe('tablas')
    expect(placementBlockOf('div:42/6')).toBe('dividir')
    expect(placementBlockOf('div:2x1:exact')).toBe('dividir')
    expect(placementBlockOf('word:add')).toBe('problemas')
    expect(placementBlockOf('concept:placevalue')).toBe('numeros')
    expect(placementBlockOf('concept:groups')).toBeNull()
  })
})

describe('summarizePlacement', () => {
  const attempt = (skill: string, correct: boolean, i: number, activity: string | undefined = PLACEMENT_ACTIVITY): AttemptRecord => ({
    id: `a${i}`, childId: 'c', sessionId: null, skill, kind: 'fact-mul', correct, given: '', expected: '', ms: 1000,
    inputMode: 'keypad', hintsUsed: 0, context: activity ? { activity } : {}, createdAt: now.toISOString(),
  })

  it('counts per block for the latest run only, ignoring other activities', () => {
    const list = [
      attempt('mul:6x7', true, 1), attempt('mul:3x4', false, 2), attempt('add:3d:c1', true, 3),
      attempt('mul:2x2', true, 4, 'facts'), attempt('sub:3d:b0', false, 5),
    ]
    const s = summarizePlacement(list)
    expect(s.answered).toBe(4)
    expect(s.complete).toBe(false)
    const tablas = s.blocks.find((b) => b.id === 'tablas')!
    expect(tablas).toMatchObject({ correct: 1, total: 2 })
    expect(s.blocks.find((b) => b.id === 'sumas-restas')).toMatchObject({ correct: 1, total: 2 })
  })

  it('counts the «No lo sé» answers apart: they are the topics to work on first', () => {
    const list = [
      { ...attempt('mul:6x7', false, 1), errorType: 'dont-know' as const }, attempt('mul:3x4', false, 2),
      { ...attempt('div:42/6', false, 3), errorType: 'dont-know' as const },
    ]
    const s = summarizePlacement(list)
    expect(s.dontKnow).toBe(2)
    expect(s.blocks.find((b) => b.id === 'tablas')).toMatchObject({ correct: 0, total: 2, dontKnow: 1 })
    expect(s.blocks.find((b) => b.id === 'dividir')).toMatchObject({ dontKnow: 1 })
  })

  it('a full run is complete', () => {
    const list = Array.from({ length: PLACEMENT_COUNT }, (_, i) => attempt('mul:6x7', i % 2 === 0, i))
    expect(summarizePlacement(list).complete).toBe(true)
  })
})

describe('placementKnownTopics (the test places the child)', () => {
  const answersOf = (grade: number | undefined, right: (block: string, skill: string) => boolean) =>
    buildPlacement(`child-${grade}|2026-11-11`, now, grade).map((i) => ({ block: i.block, skill: i.exercise.skill, correct: right(i.block, i.exercise.skill) }))

  it('all right in 3.º: only the topics whose every skill was asked are known, never a table from one fact', () => {
    const known = placementKnownTopics(GRADE3_SYLLABUS, answersOf(3, () => true))
    expect(known).toEqual(expect.arrayContaining(['suma-3d-sin-llevar', 'resta-3d-sin-llevar']))
    // The test never asks the place value with blocks (num:place:blocks): descomponer is still taught as usual.
    expect(known).not.toContain('descomponer-9999')
    expect(known.some((id) => id.startsWith('tabla-'))).toBe(false)
    const progress = { ...initialProgress('c', now), flags: placementRunFlags('math', '1', known) }
    expect(topicOfToday(GRADE3_SYLLABUS, {}, progress, now)?.id).toBe('descomponer-9999')
  })

  it('a topic with one skill the test did not ask is not set aside', () => {
    // suma-3d-llevando has add:3d:c1, add:3d:c2 and add:3d:c3: two of them right is not enough.
    const right = (skill: string) => ({ block: 'sumas-restas', skill, correct: true })
    expect(placementKnownTopics(GRADE3_SYLLABUS, [right('add:3d:c1'), right('add:3d:c2')])).not.toContain('suma-3d-llevando')
    expect(placementKnownTopics(GRADE3_SYLLABUS, [right('add:3d:c1'), right('add:3d:c2'), right('add:3d:c3')])).toContain('suma-3d-llevando')
  })

  it('«No lo sé» and wrong answers never count as known', () => {
    expect(placementKnownTopics(GRADE3_SYLLABUS, answersOf(3, () => false))).toEqual([])
  })

  it('one wrong answer in a block leaves its topics to practise as usual', () => {
    const answers = answersOf(3, () => true)
    const firstNumber = answers.findIndex((a) => a.block === 'numeros')
    answers[firstNumber] = { ...answers[firstNumber], correct: false }
    const known = placementKnownTopics(GRADE3_SYLLABUS, answers)
    expect(known).not.toContain('descomponer-9999')
    expect(known).toContain('suma-3d-sin-llevar')
  })

  it('a block of one item says nothing clearly', () => {
    expect(placementKnownTopics(GRADE3_SYLLABUS, [{ block: 'tiempo', skill: 'clock:read:15', correct: true }])).toEqual([])
    expect(PLACEMENT_CLEAR_MIN).toBe(2)
  })

  it('works for 2.º too, with its own temario', () => {
    const known = placementKnownTopics(GRADE2_SYLLABUS, answersOf(2, () => true))
    expect(known.length).toBeGreaterThan(0)
    expect(known.every((id) => GRADE2_SYLLABUS.blocks.some((b) => b.topics.some((t) => t.id === id)))).toBe(true)
    // The session starts with what the child does not know yet.
    const progress = { ...initialProgress('c', now), flags: placementRunFlags('math', '1', known) }
    const first = topicOfToday(GRADE2_SYLLABUS, {}, progress, now)
    expect(first).not.toBeNull()
    expect(known).not.toContain(first?.id)
  })
})
