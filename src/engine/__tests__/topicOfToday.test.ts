import { describe, expect, it } from 'vitest'
import type { MasteryMap, ProgressState, SkillMastery } from '@/types'
import { GRADE2_SYLLABUS, GRADE3_SYLLABUS, GRADE4_SYLLABUS, currentTopic, stageOfTopic, teachingOrder, type Syllabus } from '@/content/syllabus'
import { initialProgress, nextNode, switchSeason } from '@/content'
import { newMastery } from '../mastery'
import { isPlacedTopic, markClassToday, placementKnownKey, stageOfCurrentWorld, topicOfToday } from '../topicOfToday'

const now = new Date('2026-11-11T10:00:00.000Z')

function known(skill: string, box = 2, attempts = 3, correct = attempts): SkillMastery {
  return { ...newMastery(skill, now), box: box as SkillMastery['box'], attempts, correct, streak: correct }
}

/** Every skill of the given topics at the mastered box. */
function mastered(course: Syllabus, topicIds: string[]): MasteryMap {
  const out: MasteryMap = {}
  for (const t of teachingOrder(course).filter((t) => topicIds.includes(t.id))) for (const s of t.skills) out[s] = known(s)
  return out
}

/** A progress with the crystals of the first `n` worlds (the next world open), as the guardians leave it. */
function withCrystals(n: number, seasonId = 's1'): ProgressState {
  const p = initialProgress('c', now, seasonId)
  const worlds = { ...p.worlds }
  for (let i = 1; i <= n; i++) worlds[`w${i}`] = { unlocked: true, nodes: {}, crystal: true }
  worlds[`w${n + 1}`] = { unlocked: true, nodes: {}, crystal: false }
  return { ...p, worlds }
}

const stageTopics = (course: Syllabus, id: string) => course.stages!.find((st) => st.id === id)!.topics

describe('one path: today\'s topic follows the world of the map (3.º)', () => {
  it('a new child: the first topic of etapa 1, the same as before, and the map is on world 1', () => {
    const p = initialProgress('c', now)
    expect(nextNode(p)?.worldId).toBe('w1')
    expect(topicOfToday(GRADE3_SYLLABUS, {}, p, now)?.id).toBe('descomponer-9999')
  })

  it('crystals of w1 and w2 won with the temario behind: «Hoy» teaches etapa 3, the stage of world 3', () => {
    const p = withCrystals(2)
    expect(nextNode(p)?.worldId).toBe('w3')
    expect(currentTopic(GRADE3_SYLLABUS, {})?.id).toBe('descomponer-9999') // the temario alone would go back to etapa 1
    const topic = topicOfToday(GRADE3_SYLLABUS, {}, p, now)!
    expect(stageOfTopic(GRADE3_SYLLABUS, topic.id)?.worldId).toBe('w3')
    expect(topic.id).toBe(stageTopics(GRADE3_SYLLABUS, 'etapa-3')[0])
  })

  it('half way through a world: the first topic of its stage not mastered yet', () => {
    const p = withCrystals(1)
    const [first, second] = stageTopics(GRADE3_SYLLABUS, 'etapa-2')
    expect(topicOfToday(GRADE3_SYLLABUS, mastered(GRADE3_SYLLABUS, [first]), p, now)?.id).toBe(second)
  })

  it('the temario ahead of the map: with the stage of the world mastered, the next topic of the temario', () => {
    const p = initialProgress('c', now) // still in world 1
    const mastery = mastered(GRADE3_SYLLABUS, [...stageTopics(GRADE3_SYLLABUS, 'etapa-1'), ...stageTopics(GRADE3_SYLLABUS, 'etapa-2')])
    expect(topicOfToday(GRADE3_SYLLABUS, mastery, p, now)?.id).toBe(stageTopics(GRADE3_SYLLABUS, 'etapa-3')[0])
  })

  it('the whole temario mastered: no topic (as before), whatever the map', () => {
    const all = mastered(GRADE3_SYLLABUS, teachingOrder(GRADE3_SYLLABUS).map((t) => t.id))
    expect(topicOfToday(GRADE3_SYLLABUS, all, withCrystals(3), now)).toBeNull()
  })

  it('the adventure won: the temario decides alone', () => {
    const p = withCrystals(7)
    p.worlds.w8 = { unlocked: true, nodes: {}, crystal: true }
    expect(nextNode(p)).toBeNull()
    expect(topicOfToday(GRADE3_SYLLABUS, {}, p, now)?.id).toBe(currentTopic(GRADE3_SYLLABUS, {})?.id)
  })

  it('the world the child was last in wins, as on the map', () => {
    const p = { ...withCrystals(1), worlds: { ...withCrystals(1).worlds, w3: { unlocked: true, nodes: {}, crystal: false } }, lastNode: { worldId: 'w2', nodeId: 'x' } }
    expect(nextNode(p)?.worldId).toBe('w2')
    expect(stageOfCurrentWorld(GRADE3_SYLLABUS, p)?.worldId).toBe('w2')
  })

  it('a class done today still keeps its topic', () => {
    const p = markClassToday(withCrystals(2), 'tabla-2', now)
    expect(topicOfToday(GRADE3_SYLLABUS, {}, p, now)?.id).toBe('tabla-2')
  })

  it('without the progress (an adult view) it is the current topic', () => {
    expect(topicOfToday(GRADE3_SYLLABUS, {}, undefined, now)?.id).toBe(currentTopic(GRADE3_SYLLABUS, {})?.id)
  })
})

describe('one path in 2.º and the courses without worlds', () => {
  it('2.º follows the world of its own adventure (c2)', () => {
    const p = withCrystals(2, 'c2')
    expect(topicOfToday(GRADE2_SYLLABUS, {}, p, now)?.id).toBe(stageTopics(GRADE2_SYLLABUS, 'etapa-3')[0])
  })

  it('a 2.º temario on a half won 3.º map (the course changed) does not mix the two: the temario decides', () => {
    const p = withCrystals(2, 's1')
    expect(switchSeason(p, 'c2')).toBe(p)
    expect(stageOfCurrentWorld(GRADE2_SYLLABUS, p)).toBeUndefined()
    expect(topicOfToday(GRADE2_SYLLABUS, {}, p, now)?.id).toBe(currentTopic(GRADE2_SYLLABUS, {})?.id)
  })

  it('4.º (its stages have no worlds) keeps the temario order, even on the 3.º map', () => {
    const p = withCrystals(4)
    expect(stageOfCurrentWorld(GRADE4_SYLLABUS, p)).toBeUndefined()
    expect(topicOfToday(GRADE4_SYLLABUS, {}, p, now)?.id).toBe(currentTopic(GRADE4_SYLLABUS, {})?.id)
  })
})

describe('topics the placement showed as known', () => {
  const p = (ids: string[]) => {
    const base = initialProgress('c', now)
    return { ...base, flags: Object.fromEntries(ids.map((id) => [placementKnownKey(id), true])) }
  }

  it('wait after the other topics of the stage: the session starts with the first one not known', () => {
    const [first, second, third] = stageTopics(GRADE3_SYLLABUS, 'etapa-1')
    expect(topicOfToday(GRADE3_SYLLABUS, {}, p([first, second]), now)?.id).toBe(third)
  })

  it('come back when every other topic of the stage is mastered (still to be confirmed, never skipped for good)', () => {
    const topics = stageTopics(GRADE3_SYLLABUS, 'etapa-1')
    const mastery = mastered(GRADE3_SYLLABUS, topics.slice(1))
    expect(topicOfToday(GRADE3_SYLLABUS, mastery, p([topics[0]]), now)?.id).toBe(topics[0])
  })

  it('a wrong answer on one of its skills brings the topic back to normal practice', () => {
    const [first] = stageTopics(GRADE3_SYLLABUS, 'etapa-1')
    const topic = teachingOrder(GRADE3_SYLLABUS).find((t) => t.id === first)!
    const right: MasteryMap = { [topic.skills[0]]: known(topic.skills[0], 1, 2, 2) }
    expect(isPlacedTopic(topic, right, p([first]))).toBe(true)
    const wrong: MasteryMap = { [topic.skills[0]]: known(topic.skills[0], 1, 3, 2) }
    expect(isPlacedTopic(topic, wrong, p([first]))).toBe(false)
    expect(topicOfToday(GRADE3_SYLLABUS, wrong, p([first]), now)?.id).toBe(first)
  })

  it('a flag alone never masters a topic', () => {
    const [first] = stageTopics(GRADE3_SYLLABUS, 'etapa-1')
    const all = stageTopics(GRADE3_SYLLABUS, 'etapa-1')
    // Every topic of the stage flagged: the first one is still taught (nothing is mastered by the test).
    expect(topicOfToday(GRADE3_SYLLABUS, {}, p(all), now)?.id).toBe(first)
  })
})
