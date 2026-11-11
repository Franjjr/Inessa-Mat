import { describe, expect, it } from 'vitest'
import { createRng, generate } from '@/engine'
import { MISSION_DONE_ATTEMPTS } from '@/data'
import { ASSIGNMENT_PRESETS, presetSelector } from '@/adult/school/presets'
import type { Assignment } from '@/types'
import { currentMission, isMissionCurrent, missionConfig, missionDoneFlag, missionKicker } from './logic'

const mission = (over: Partial<Assignment> = {}): Assignment => ({
  id: 'as-1', classId: 'class-1', title: 'Tabla del 7', selector: { skills: ['mul:7x8'] },
  startsAt: '2026-11-01T00:00:00.000Z', dueAt: null, createdBy: 't1', ...over,
})

describe('currentMission', () => {
  it('is the newest current mission (the list comes newest first), or none', () => {
    expect(currentMission([mission({ id: 'new' }), mission({ id: 'old' })])?.id).toBe('new')
    expect(currentMission([])).toBeNull()
  })
})

describe('isMissionCurrent', () => {
  it('is on from its start to its due date (or for ever without one)', () => {
    const now = Date.parse('2026-11-10T12:00:00.000Z')
    expect(isMissionCurrent(mission(), now)).toBe(true)
    expect(isMissionCurrent(mission({ dueAt: '2026-11-12T00:00:00.000Z' }), now)).toBe(true)
    expect(isMissionCurrent(mission({ dueAt: '2026-11-09T00:00:00.000Z' }), now)).toBe(false)
    expect(isMissionCurrent(mission({ startsAt: '2026-11-11T00:00:00.000Z' }), now)).toBe(false)
  })
})

describe('missionKicker', () => {
  it('says «¡Hecha!» only for the mission the child finished', () => {
    expect(missionKicker(undefined, 'as-1')).toBe('Misión de tu profe')
    expect(missionKicker({ [missionDoneFlag('as-2')]: true }, 'as-1')).toBe('Misión de tu profe')
    expect(missionKicker({ [missionDoneFlag('as-1')]: true }, 'as-1')).toBe('Misión de tu profe · ¡Hecha!')
  })
})

describe('missionConfig: one run makes the mission «hecha» for the teacher', () => {
  it('plays as many rounds as the teacher counts, with the mission title', () => {
    const config = missionConfig(mission())
    expect(config).toMatchObject({ kind: 'exercises', title: 'Tabla del 7', count: MISSION_DONE_ATTEMPTS })
    expect(missionConfig(mission({ selector: undefined as never })).selector).toEqual({})
  })

  // The server counts a pupil's answers on the mission's skills: every round of a run must be one of those skills.
  it.each(ASSIGNMENT_PRESETS.map((p) => [p.label, p.id] as const))('«%s»: every round is one of the mission skills', (_label, id) => {
    const selector = presetSelector(id)!
    const config = missionConfig(mission({ selector }))
    const rounds = generate({ ...config.selector, adaptive: true }, config.count!, { rng: createRng(7) })
    expect(rounds).toHaveLength(MISSION_DONE_ATTEMPTS)
    for (const r of rounds) expect(selector.skills).toContain(r.skill)
  })
})
