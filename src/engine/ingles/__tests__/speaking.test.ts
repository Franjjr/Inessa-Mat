/* «Ahora dilo tú»: the star bands, the day's record of results, and the planner: speaking items only when the adult switched
   the microphone on with consent, a microphone exists, the day's limit is not reached and the service has not failed. */
import { describe, expect, it } from 'vitest'
import { initialProgress } from '@/content'
import { INGLES3_SYLLABUS } from '@/content/syllabus'
import { DEFAULT_CHILD_SETTINGS, type ChildProfile, type MasteryMap, type ProgressState, type SkillMastery } from '@/types'
import { createRng } from '../../rng'
import { planEnglishSession } from '../daily'
import { hardToSay, pronunciationStars, speakAttemptKey, speakOffKey, speakingAvailable, type SpeakingRecord } from '../speaking'
import { SPEAK_DAILY_MAX } from '../speaking'

const NOW = new Date('2026-11-06T10:00:00.000Z')
const SPEAKING_ON = { on: true, consentAt: '2026-11-01T09:00:00.000Z' }

const child = (speaking?: ChildProfile['settings']['speaking'], subjects: ChildProfile['settings']['subjects'] = ['math', 'english']): ChildProfile => ({
  id: 'child-ingles', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS, subjects, ...(speaking ? { speaking } : {}) },
  createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z',
})
const progress = (flags: Record<string, boolean> = {}): ProgressState => ({ ...initialProgress('child-ingles', new Date('2026-10-01T10:00:00.000Z')), flags })
const row = (skill: string): SkillMastery => ({
  skill, box: 5, attempts: 5, correct: 5, streak: 5, avgMs: null, lastSeenAt: '2026-11-02T09:00:00.000Z', dueAt: null, updatedAt: '2026-11-01T09:00:00.000Z',
})
const learnt: MasteryMap = Object.fromEntries(INGLES3_SYLLABUS.blocks.flatMap((b) => b.topics).flatMap((t) => t.skills).map((s) => [s, row(s)]))

const plan = (c: ChildProfile, flags: Record<string, boolean> = {}, mic = true) =>
  planEnglishSession({ child: c, mastery: learnt, attempts: [], syllabus: INGLES3_SYLLABUS, now: NOW, progress: progress(flags), sound: true, mic, rng: createRng(7) })
const speakItems = (p: ReturnType<typeof plan>) => p.blocks.flatMap((b) => b.items).filter((i) => i.exercise.kind === 'eng-speak')

describe('pronunciationStars', () => {
  it('gives one star below 60, two below 85 and three from 85', () => {
    expect(pronunciationStars(0)).toBe(1)
    expect(pronunciationStars(59)).toBe(1)
    expect(pronunciationStars(60)).toBe(2)
    expect(pronunciationStars(84)).toBe(2)
    expect(pronunciationStars(85)).toBe(3)
    expect(pronunciationStars(100)).toBe(3)
  })
})

describe('hardToSay', () => {
  const r = (word: string, stars: 1 | 2 | 3, at: string): SpeakingRecord => ({ word, stars, at })

  it('lists the words whose last result was one star, the most recent first', () => {
    const records = [
      r('three', 1, '2026-11-01T10:00:00.000Z'),
      r('apple', 1, '2026-11-02T10:00:00.000Z'),
      r('apple', 3, '2026-11-03T10:00:00.000Z'),
      r('thirteen', 1, '2026-11-04T10:00:00.000Z'),
      r('green', 2, '2026-11-05T10:00:00.000Z'),
    ]
    expect(hardToSay(records)).toEqual(['thirteen', 'three'])
  })
})

describe('speakingAvailable', () => {
  it('needs English on, the switch on, the consent date and a microphone', () => {
    expect(speakingAvailable(child(SPEAKING_ON), true)).toBe(true)
    expect(speakingAvailable(child(SPEAKING_ON), false)).toBe(false)
    expect(speakingAvailable(child({ on: true }), true)).toBe(false)
    expect(speakingAvailable(child({ on: false, consentAt: SPEAKING_ON.consentAt }), true)).toBe(false)
    expect(speakingAvailable(child(SPEAKING_ON, ['math']), true)).toBe(false)
  })
})

describe('planEnglishSession: «Ahora dilo tú»', () => {
  it('plans none when speaking is off, the consent is missing, or there is no microphone', () => {
    expect(speakItems(plan(child()))).toHaveLength(0)
    expect(speakItems(plan(child({ on: true })))).toHaveLength(0)
    expect(speakItems(plan(child(SPEAKING_ON), {}, false))).toHaveLength(0)
  })

  it('plans at most two, each right after an item of the same word', () => {
    const p = plan(child(SPEAKING_ON))
    const items = p.blocks.flatMap((b) => b.items)
    const speak = items.map((item, i) => ({ item, i })).filter(({ item }) => item.exercise.kind === 'eng-speak')
    expect(speak.length).toBe(2)
    for (const { item, i } of speak) {
      const before = items[i - 1].exercise
      const word = before.kind === 'eng-listen-pick' ? before.word : before.kind === 'eng-write-word' || before.kind === 'eng-scramble' ? before.answer : null
      expect(word).not.toBeNull()
      expect(item.exercise.kind === 'eng-speak' && item.exercise.word).toBe(word)
    }
  })

  it('stops planning speaking at the day limit of attempts', () => {
    const used: Record<string, boolean> = {}
    for (let n = 1; n <= SPEAK_DAILY_MAX; n++) used[speakAttemptKey(NOW, n)] = true
    expect(speakItems(plan(child(SPEAKING_ON), used))).toHaveLength(0)
    // One attempt left: one item only.
    const almost: Record<string, boolean> = {}
    for (let n = 1; n <= SPEAK_DAILY_MAX - 1; n++) almost[speakAttemptKey(NOW, n)] = true
    expect(speakItems(plan(child(SPEAKING_ON), almost))).toHaveLength(1)
  })

  it('does not plan speaking after the service failed that day', () => {
    expect(speakItems(plan(child(SPEAKING_ON), { [speakOffKey(NOW)]: true }))).toHaveLength(0)
  })

  it('does not count yesterday\'s attempts against today', () => {
    const yesterday: Record<string, boolean> = {}
    for (let n = 1; n <= SPEAK_DAILY_MAX; n++) yesterday[speakAttemptKey(new Date('2026-11-05T10:00:00.000Z'), n)] = true
    expect(speakItems(plan(child(SPEAKING_ON), yesterday)).length).toBeGreaterThan(0)
  })
})
