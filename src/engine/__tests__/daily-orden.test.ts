/* The session never asks what has not been taught (audit p3-clases H1, H2, H3): a girl who gets everything right, forty days. */
import { describe, expect, it } from 'vitest'
import type { ChildProfile, MasteryMap, ProgressState } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { GRADE3_SYLLABUS, availableSkills, teachingOrder } from '@/content/syllabus'
import { classForTopic, markClassDone } from '@/content/classes'
import { initialProgress } from '@/content'
import { seasonIdForGrade } from '@/content/season'
import { planDailySession, statementOf, type DailyPlan } from '../daily'
import { updateMastery } from '../mastery'
import { generate } from '../generate'
import { createRng } from '../rng'

const start = new Date('2026-09-15T10:00:00.000Z')
const DAY = 86400000
const child: ChildProfile = {
  id: 'orden-child', orgId: null, nickname: 'Ina', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: start.toISOString(), updatedAt: start.toISOString(),
}
const order = teachingOrder(GRADE3_SYLLABUS)
const idxOfTopic = (id: string) => order.findIndex((t) => t.id === id)
const firstTopicIdx = (skill: string) => order.findIndex((t) => t.skills.includes(skill))
const stage5Start = idxOfTopic(GRADE3_SYLLABUS.stages![4].topics[0])
const HUNT_OP_TOPIC = { add: 'suma-3d-llevando', sub: 'resta-3d-prestando', mul: 'mul-2x1-llevando' } as const

interface Day { d: number; plan: DailyPlan; classesDone: Set<string>; todayIdx: number }

/** Forty days of a girl who answers everything right; she does the class of the topic whenever the plan asks for it first. */
function simulate(days = 200): Day[] {
  let mastery: MasteryMap = {}
  let progress: ProgressState = initialProgress(child.id, start, seasonIdForGrade(3))
  const out: Day[] = []
  for (let d = 0; d < days; d++) {
    const now = new Date(start.getTime() + d * DAY)
    let plan = planDailySession({ child, mastery, attempts: [], syllabus: GRADE3_SYLLABUS, now, progress })
    if (plan.classTopicId) {
      const cls = classForTopic(plan.classTopicId, 3)!
      progress = markClassDone(progress, cls, 'skip')
      plan = planDailySession({ child, mastery, attempts: [], syllabus: GRADE3_SYLLABUS, now, progress })
    }
    const done = new Set(Object.keys(progress.flags).filter((k) => k.startsWith('clase:')).map((k) => k.slice(6)))
    out.push({ d, plan, classesDone: done, todayIdx: plan.topic ? idxOfTopic(plan.topic.id) : -1 })
    for (const b of plan.blocks) for (const it of b.items) {
      mastery = { ...mastery, [it.exercise.skill]: updateMastery(mastery[it.exercise.skill], { skill: it.exercise.skill, correct: true, ms: 2000, hintsUsed: 0, inputMode: 'keypad' } as never, now) }
    }
  }
  return out
}

const sim = simulate()
const items = sim.flatMap((day) => day.plan.blocks.flatMap((b) => b.items.map((it) => ({ day, block: b.id, it }))))
const newProgress =() => initialProgress(child.id, start, seasonIdForGrade(3))

describe('daily-orden: nothing is asked before it is taught', () => {
  it('a new girl who gets everything right is never asked a skill of a topic after today\'s', () => {
    const late = items.filter(({ day, it }) => {
      const k = firstTopicIdx(it.exercise.skill)
      return k > day.todayIdx && !day.classesDone.has(order[k].id)
    })
    expect(late.map(({ day, block, it }) => `día ${day.d + 1} ${block} ${it.exercise.skill}`)).toEqual([])
  })

  it('the simulation reaches the problems and the hunts, so the checks below mean something', () => {
    expect(items.some(({ it }) => it.exercise.skill.startsWith('bar:'))).toBe(true)
    expect(items.some(({ it }) => it.exercise.skill.startsWith('hunt:'))).toBe(true)
  })

  it('no «encuentra el error» before its class and the class of its operation', () => {
    for (const { day, it } of items.filter(({ it }) => it.exercise.skill.startsWith('hunt:'))) {
      const op = it.exercise.skill.slice(5) as keyof typeof HUNT_OP_TOPIC
      expect(day.classesDone.has(HUNT_OP_TOPIC[op]), `día ${day.d + 1} ${it.exercise.skill}: clase de la operación`).toBe(true)
      expect(day.classesDone.has('encuentra-error'), `día ${day.d + 1} ${it.exercise.skill}: clase de encuentra-error`).toBe(true)
    }
  })

  it('no geometry angle or data-table exercise before stage 5', () => {
    for (const { day, it } of items) {
      if (day.todayIdx < 0 || day.todayIdx >= stage5Start) continue
      expect(it.exercise.skill, `día ${day.d + 1}`).not.toBe('geo:angle:class')
      expect(it.exercise.skill, `día ${day.d + 1}`).not.toBe('chart:table')
    }
  })

  it('no problem bar before the class «Problemas de juntar» is given', () => {
    for (const { day, it } of items) {
      if (!it.exercise.skill.startsWith('bar:')) continue
      expect(day.classesDone.has('prob-sumar'), `día ${day.d + 1} ${it.exercise.skill}`).toBe(true)
    }
  })

  it('a new girl has no problem block on day one, and the class of today\'s topic is named', () => {
    const plan = planDailySession({ child, mastery: {}, attempts: [], syllabus: GRADE3_SYLLABUS, now: start, progress: newProgress() })
    expect(plan.blocks.find((b) => b.id === 'problem')!.items).toHaveLength(0)
    expect(plan.classTopicId).toBe(plan.topic!.id)
  })

  it('the mix is shorter, not filled with later topics, when the girl has few taught skills', () => {
    const plan = planDailySession({ child, mastery: {}, attempts: [], syllabus: GRADE3_SYLLABUS, now: start, progress: newProgress() })
    const today = idxOfTopic(plan.topic!.id)
    for (const it of plan.blocks.find((b) => b.id === 'mix')!.items) expect(firstTopicIdx(it.exercise.skill)).toBeLessThanOrEqual(today)
  })
})

describe('daily-orden: statementOf', () => {
  it('never answers with the skill key, for any available maths skill', () => {
    const bad: string[] = []
    for (const skill of availableSkills(GRADE3_SYLLABUS)) {
      for (const ex of generate({ skills: [skill] }, 3, { rng: createRng(7), now: start })) {
        const text = statementOf(ex)
        if (!text || text === ex.skill) bad.push(`${ex.skill} (${ex.kind}) → ${text}`)
      }
    }
    expect([...new Set(bad)]).toEqual([])
  })
})
