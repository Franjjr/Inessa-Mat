/* Every English topic, in the order of the syllabus, sound on and off: the planner teaches it (its class first when it is not
   done) and the session always ends with one final game. The session length has one source: ENGLISH_SESSION_MINUTES. */
import { describe, expect, it } from 'vitest'
import { initialProgress } from '@/content'
import { INGLES3_SYLLABUS, availableTopics, currentTopic, type SyllabusTopic } from '@/content/syllabus'
import { SUBJECT_LIMIT_SECONDS } from '@/world/session/logic'
import { DEFAULT_CHILD_SETTINGS, type ChildProfile, type MasteryMap, type SkillMastery } from '@/types'
import { createRng } from '../../rng'
import { ENGLISH_LISTENING_KINDS } from '../exercises'
import { ENGLISH_PRACTICE_TARGET_SECONDS, planEnglishSession } from '../daily'
import { teachableEnglishCourse } from '../teachable'
import { ENGLISH_SESSION_MINUTES } from '../../subjects'

const NOW = new Date('2026-11-06T10:00:00.000Z')
const child: ChildProfile = {
  id: 'child-ingles', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS, subjects: ['math', 'language', 'english'] },
  createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z',
}
const GAME_KINDS = ['eng-memory', 'eng-scramble', 'eng-num-write', 'eng-num-listen', 'eng-op-listen']

const topics: SyllabusTopic[] = INGLES3_SYLLABUS.blocks.flatMap((b) => b.topics)

/** Every skill of the given topics at box 5 (learnt, seen before today): the child has finished those topics. */
function learntTopics(done: SyllabusTopic[]): MasteryMap {
  const out: MasteryMap = {}
  for (const t of done) {
    for (const skill of t.skills) {
      const row: SkillMastery = { skill, box: 5, attempts: 5, correct: 5, streak: 5, avgMs: null, lastSeenAt: '2026-11-02T09:00:00.000Z', dueAt: null, updatedAt: '2026-11-01T09:00:00.000Z' }
      out[skill] = row
    }
  }
  return out
}

describe('the English session, every topic', () => {
  for (const sound of [true, false]) {
    describe(sound ? 'with the sound on' : 'with the sound off', () => {
      const course = teachableEnglishCourse(INGLES3_SYLLABUS, sound)
      /** The order the child meets the topics: the current topic of each step once the earlier ones are learnt. */
      const order: SyllabusTopic[] = []
      for (let mastery = learntTopics([]); order.length < topics.length; ) {
        const next = currentTopic(course, mastery)
        if (!next) break
        order.push(next)
        mastery = learntTopics(order)
      }

      it('the walk through the course reaches every topic the planner can teach, once each', () => {
        expect(order.length).toBeGreaterThan(0)
        expect(new Set(order.map((t) => t.id)).size).toBe(order.length)
        expect(order.map((t) => t.id)).toEqual(availableTopics(course).map((t) => t.id))
      })

      for (const [index, target] of order.entries()) {
        it(`${target.id}: taught as the topic of the day, ends with one final game`, () => {
          // Every earlier topic of the course is learnt, so the target is the current one.
          const mastery = learntTopics(order.slice(0, index))
          expect(currentTopic(course, mastery)?.id).toBe(target.id)

          const plan = planEnglishSession({
            child, mastery, attempts: [], syllabus: INGLES3_SYLLABUS, now: NOW, sound, rng: createRng(11),
            progress: { ...initialProgress(child.id, new Date('2026-10-01T10:00:00.000Z')), flags: {} },
          })
          expect(plan.topic?.id).toBe(target.id)
          expect(plan.blocks.map((b) => b.id)).toEqual(['warmup', 'new', 'mix', 'game'])

          const game = plan.blocks[3].items
          expect(game, 'the session always ends with a final game').toHaveLength(1)
          expect(GAME_KINDS).toContain(game[0].exercise.kind)
          expect(game[0].exercise.skill.startsWith('eng:')).toBe(true)

          const kinds = plan.blocks.flatMap((b) => b.items).map((i) => i.exercise.kind)
          if (!sound) expect(kinds.some((k) => ENGLISH_LISTENING_KINDS.includes(k))).toBe(false)
          expect(plan.practiceSeconds).toBeGreaterThanOrEqual(ENGLISH_PRACTICE_TARGET_SECONDS)
          expect(plan.practiceSeconds).toBeLessThanOrEqual(ENGLISH_SESSION_MINUTES * 60 + 60)
        })
      }
    })
  }

  it('one source for the session length: the English limit of the session is ENGLISH_SESSION_MINUTES', () => {
    expect(SUBJECT_LIMIT_SECONDS.english).toBe(ENGLISH_SESSION_MINUTES * 60)
    expect(ENGLISH_SESSION_MINUTES).toBe(10)
  })
})
