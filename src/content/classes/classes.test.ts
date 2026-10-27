import { describe, expect, it } from 'vitest'
import { COMPLETION_STARS, initialProgress, isNodeUnlocked } from '@/content'
import type { SyllabusTopic } from '@/content'
import { topicTitle } from '@/content/syllabus/helpers'
import { w4Borrow } from '@/content/lessons/w4'
import { tryIt } from '@/content/lessons/dsl'
import { clase, classForTopic, isClassDone, markClassDone } from './index'

const sola = tryIt('borrow', { a: 352, b: 127 }, '¡Tu turno!', { kinds: ['column-sub'], digits: 3, regroup: 'one', zeros: false })

const fixture = clase({
  id: 'clase-resta-prestando',
  topicId: 'resta-3d-prestando',
  title: 'Restar prestando',
  mapLessonId: 'w4-borrow',
  para: w4Borrow.steps.slice(0, 2),
  ejemplo: w4Borrow.steps.slice(2, 5),
  guiada: [sola],
  sola: [sola],
  cierre: w4Borrow.steps[8],
})

describe('clase()', () => {
  it('puts the phases in order and takes the hints off the «sola» tries', () => {
    const { phases, lesson } = fixture
    expect(phases).toEqual({ para: 2, ejemplo: 3, guiada: 1, sola: 1, cierre: 1 })
    expect(lesson.steps.length).toBe(phases.para + phases.ejemplo + phases.guiada + phases.sola + 1)
    expect(lesson.steps[0]).toEqual(w4Borrow.steps[0])
    expect(lesson.steps[2]).toEqual(w4Borrow.steps[2])
    const soloSteps = lesson.steps.slice(-2, -1)
    for (const step of soloSteps) {
      expect(step.interaction).toBe('try')
      expect(step.hints).toBe(false)
    }
    expect(lesson.steps[lesson.steps.length - 1]).toEqual(w4Borrow.steps[8])
    const guided = lesson.steps.slice(phases.para + phases.ejemplo, phases.para + phases.ejemplo + phases.guiada)
    for (const step of guided) expect(step).not.toHaveProperty('hints')
  })
})

describe('isClassDone / markClassDone', () => {
  it('a class is done by its flag or by its map lesson already played', () => {
    const progress = initialProgress('child-1', new Date('2026-10-27'))
    expect(isClassDone(progress, fixture)).toBe(false)
    expect(isClassDone({ ...progress, flags: { 'clase:resta-3d-prestando': true } }, fixture)).toBe(true)
    const played = { ...progress, worlds: { ...progress.worlds, w4: { unlocked: true, crystal: false, nodes: { 'lesson-borrow': { done: true, stars: 3 } } } } }
    expect(isClassDone(played, fixture)).toBe(true)
  })

  it('markClassDone sets the flag and marks the unlocked map lesson, never a locked one', () => {
    const progress = initialProgress('child-1', new Date('2026-10-27'))
    // w4 is locked for a child who has not finished w1–w3: only the flag changes.
    const locked = markClassDone(progress, fixture)
    expect(locked.flags['clase:resta-3d-prestando']).toBe(true)
    expect(locked.worlds).toEqual(progress.worlds)
    expect(isClassDone(locked, fixture)).toBe(true)

    // Open the world 4 path: the crystal of world 3 is won, so the map lesson is unlocked.
    const opened = { ...progress, worlds: { ...progress.worlds, w3: { unlocked: true, crystal: true, nodes: {} }, w4: { unlocked: true, crystal: false, nodes: { arrival: { done: true, stars: 3 } } } } }
    expect(isNodeUnlocked(opened, 'w4', 'lesson-borrow')).toBe(true)
    const marked = markClassDone(opened, fixture)
    expect(marked.flags['clase:resta-3d-prestando']).toBe(true)
    expect(marked.worlds.w4.nodes['lesson-borrow']).toMatchObject({ done: true, stars: COMPLETION_STARS })
  })
})

describe('classForTopic', () => {
  it('finds a class by its syllabus topic (none in the empty registry)', () => {
    expect(classForTopic('resta-3d-prestando')).toBeUndefined()
  })
})

describe('topicTitle', () => {
  it('drops the example in brackets', () => {
    expect(topicTitle({ name: 'Descomponer (4 325 = 4 000 + 300 + 20 + 5)' } as SyllabusTopic)).toBe('Descomponer')
  })
  it('keeps plain names unchanged', () => {
    expect(topicTitle({ name: 'Resta de 3 cifras pidiendo prestado' } as SyllabusTopic)).toBe('Resta de 3 cifras pidiendo prestado')
  })
})
