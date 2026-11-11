/* The class overview reads the activity of every subject (rpc child_activity, migration 0006) and falls back to the
   maths numbers of child_stats when the server does not have it yet. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getClassOverview } from '@/data'
import { FakeSupabase } from './fakeSupabase'
import { org, resetAll, signIn } from './helpers'

let fake: FakeSupabase
const SCHOOL = org('school-1', 'school', 'CEIP')
const now = () => new Date().toISOString()

beforeEach(async () => {
  fake = new FakeSupabase()
  await resetAll(fake)
  signIn('t1', [SCHOOL], 'teacher')
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  fake.rows('classes').push({ id: 'class-1', org_id: SCHOOL.id, name: '3ºC', grade: 3, join_code: 'K7M2QP', teacher_id: 't1', created_at: now(), archived_at: null })
  for (const [id, nickname] of [['k1', 'Lía'], ['k2', 'Dani'], ['k3', 'Noa']]) {
    fake.rows('children').push({ id, org_id: 'fam-1', nickname, gender: 'f', grade: 3, companion: { species: 'cat' }, settings: {}, created_at: now(), updated_at: now(), deleted_at: null })
    fake.rows('class_enrollments').push({ class_id: 'class-1', child_id: id, added_by: 'p1', created_at: now() })
  }
  // child_stats is maths only: Lía played Lengua alone, so she has no maths minutes.
  fake.rpcs.child_stats = () => ({
    data: [
      { child_id: 'k1', attempts: 0, correct: 0, minutes: 0, last_played_at: now(), top_errors: [] },
      { child_id: 'k2', attempts: 12, correct: 9, minutes: 10, last_played_at: now(), top_errors: [{ errorType: 'fact', count: 2 }] },
      { child_id: 'k3', attempts: 0, correct: 0, minutes: 0, last_played_at: null, top_errors: [] },
    ],
    error: null,
  })
})

const byName = <T extends { nickname: string }>(list: T[], name: string): T => list.find((c) => c.nickname === name)!

describe('class overview: activity of every subject', () => {
  it('with migration 0006, each pupil gets the minutes and answers of every subject they played', async () => {
    fake.rpcs.child_activity = () => ({
      data: [
        { child_id: 'k1', subject: 'language', attempts: 14, minutes: 8.4 },
        { child_id: 'k2', subject: 'math', attempts: 12, minutes: 10 },
        { child_id: 'k2', subject: 'handwriting', attempts: 3, minutes: 4 },
        { child_id: 'k2', subject: 'history', attempts: 1, minutes: 1 }, // unknown to this app: ignored
      ],
      error: null,
    })
    const { children } = await getClassOverview('class-1')
    expect(byName(children, 'Lía').weekBySubject).toEqual({ language: { minutes: 8, attempts: 14 } })
    expect(byName(children, 'Lía').minutesLast7Days).toBe(0) // still maths only
    expect(byName(children, 'Dani').weekBySubject).toEqual({ math: { minutes: 10, attempts: 12 }, handwriting: { minutes: 4, attempts: 3 } })
    expect(byName(children, 'Noa').weekBySubject).toEqual({})
    const call = fake.calls.find((c) => c.op === 'rpc' && c.table === 'child_activity')
    expect((call?.payload as { p_child_ids: string[] }).p_child_ids.sort()).toEqual(['k1', 'k2', 'k3'])
  })

  it('without migration 0006 (no child_activity), the overview still loads with the maths numbers only', async () => {
    const { children } = await getClassOverview('class-1')
    expect(children).toHaveLength(3)
    for (const c of children) expect(c.weekBySubject).toBeUndefined()
    expect(byName(children, 'Dani').minutesLast7Days).toBe(10)
  })
})
