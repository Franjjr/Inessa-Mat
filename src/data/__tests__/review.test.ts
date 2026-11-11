import { beforeEach, describe, expect, it } from 'vitest'
import type { AttemptRecord } from '@/types'
import { recordAttempt, startSession, createChild, deleteChild, getChild } from '@/data'
import { db } from '../db'
import { REVIEW_LIMIT, clearWrongAnswerNotes, listWrongAnswerNotes, noteWrongAnswer } from '../review'
import { isErasedChild } from '../erasure'
import { LUNA, resetAll, signIn, org } from './helpers'
import { META } from '../meta'

beforeEach(async () => {
  await resetAll()
  signIn('u1', [org('fam-a')])
})

const attempt = (childId: string, over: Partial<AttemptRecord> = {}): AttemptRecord => ({
  id: crypto.randomUUID(), childId, sessionId: null, skill: 'mul:6x7', kind: 'fact-mul', correct: false, given: '48',
  expected: '42', ms: 3200, inputMode: 'pen', hintsUsed: 0, errorType: 'fact', context: { worldId: 'w3' },
  createdAt: new Date().toISOString(), ...over,
})

describe('review log of wrong answers (this device only)', () => {
  it('keeps the wrong answer with what was written and what was expected', async () => {
    await noteWrongAnswer(attempt('c1', { given: '48', expected: '42', skill: 'mul:6x7', kind: 'fact-mul', errorType: 'fact', inputMode: 'pen' }))
    const [n] = await listWrongAnswerNotes()
    expect(n).toMatchObject({ skill: 'mul:6x7', kind: 'fact-mul', errorType: 'fact', given: '48', expected: '42', inputMode: 'pen' })
    expect(typeof n.appVersion).toBe('string')
    expect(n.at).toBeTruthy()
  })

  it('never stores the child or the family', async () => {
    await noteWrongAnswer(attempt('child-secret-id'))
    const [n] = await listWrongAnswerNotes()
    expect(JSON.stringify(n)).not.toContain('child-secret-id')
    expect(Object.keys(n)).not.toContain('childId')
    expect(Object.keys(n)).not.toContain('orgId')
  })

  it('ignores right answers and ungraded retries', async () => {
    await noteWrongAnswer(attempt('c1', { correct: true, given: '42' }))
    await noteWrongAnswer(attempt('c1', { graded: false }))
    expect(await listWrongAnswerNotes()).toEqual([])
  })

  it('is filled by recordAttempt for wrong, graded answers only', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const s = await startSession(c.id)
    await recordAttempt(attempt(c.id, { sessionId: s.id, correct: true, given: '42' }))
    await recordAttempt(attempt(c.id, { sessionId: s.id, correct: false, given: '48' }))
    await recordAttempt(attempt(c.id, { sessionId: s.id, correct: false, given: '41', graded: false }))
    const notes = await listWrongAnswerNotes()
    expect(notes.map((n) => n.given)).toEqual(['48'])
  })

  it('keeps only the newest REVIEW_LIMIT notes, so it cannot grow without end', async () => {
    const total = REVIEW_LIMIT + 5
    for (let i = 0; i < total; i++) await noteWrongAnswer(attempt('c1', { given: String(i) }))
    expect(await db.reviewNotes.count()).toBe(REVIEW_LIMIT)
    const notes = await listWrongAnswerNotes()
    expect(notes[0].given).toBe(String(total - 1)) // newest first
    expect(notes[notes.length - 1].given).toBe('5') // the five oldest were dropped
  })

  it('clips long answers so one note stays small', async () => {
    await noteWrongAnswer(attempt('c1', { given: 'x'.repeat(500) }))
    const [n] = await listWrongAnswerNotes()
    expect(n.given.length).toBeLessThanOrEqual(80)
  })

  it('can be cleared', async () => {
    await noteWrongAnswer(attempt('c1'))
    await clearWrongAnswerNotes()
    expect(await listWrongAnswerNotes()).toEqual([])
  })

  it('deleting a child also clears the log: the notes carry no child id, so they cannot be told apart', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await noteWrongAnswer(attempt(c.id))
    await deleteChild(c.id)
    expect(await listWrongAnswerNotes()).toEqual([])
  })

  it('deleting one of two children clears the notes of both, on purpose (no child id to tell them apart)', async () => {
    const a = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const b = await createChild({ nickname: 'Luis', gender: 'm', companion: LUNA })
    await noteWrongAnswer(attempt(a.id, { given: '48' }))
    await noteWrongAnswer(attempt(b.id, { given: '41' }))
    await deleteChild(a.id)
    expect(await listWrongAnswerNotes()).toEqual([])
    expect(await getChild(b.id)).toBeTruthy()
  })

  it('an erased child leaves no note on this device', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await db.meta.put({ key: META.erased(c.id), value: true })
    expect(await isErasedChild(c.id)).toBe(true)
    await recordAttempt(attempt(c.id, { correct: false }))
    expect(await listWrongAnswerNotes()).toEqual([])
  })
})
