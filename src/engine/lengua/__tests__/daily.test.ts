/* The Lengua session planner: its blocks and timings, the class before «Lo nuevo», the story of the day, the dictation
   left out without sound (R16), and that only Lengua skills reach the plan. */
import { describe, expect, it } from 'vitest'
import { STORY_READINGS } from '@/content/lengua/stories'
import { LENGUA3_SYLLABUS } from '@/content/syllabus'
import { initialProgress } from '@/content'
import { DEFAULT_CHILD_SETTINGS, type ChildProfile, type MasteryMap, type ProgressState, type SkillMastery } from '@/types'
import { LENGUA_PRACTICE_TARGET_SECONDS, planLenguaSession, storyFlag } from '../daily'
import { createRng } from '../../rng'

const NOW = new Date('2026-10-27T10:00:00.000Z')
const child = (settings: Partial<ChildProfile['settings']> = {}): ChildProfile => ({
  id: 'child-lengua', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS, subjects: ['math', 'language'], ...settings },
  createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z',
})
const progress = (flags: Record<string, boolean> = {}): ProgressState => ({
  ...initialProgress('child-lengua', new Date('2026-10-01T10:00:00.000Z')), flags,
})
/** Learnt rows: box 5, seen three days ago, for the given skills (so the warm-up reviews them). */
const learnt = (skills: string[]): MasteryMap => Object.fromEntries(skills.map((skill) => [skill, {
  skill, box: 5, attempts: 5, correct: 5, streak: 5, avgMs: null, lastSeenAt: '2026-10-24T09:00:00.000Z', dueAt: null,
  updatedAt: '2026-10-24T09:00:00.000Z',
} satisfies SkillMastery]))

const plan = (opts: { c?: ChildProfile; mastery?: MasteryMap; progress?: ProgressState } = {}) => planLenguaSession({
  child: opts.c ?? child(), mastery: opts.mastery ?? {}, syllabus: LENGUA3_SYLLABUS, now: NOW, progress: opts.progress ?? progress(),
})

describe('planLenguaSession', () => {
  it('has the blocks warm-up, new, story and mix, in that order, with at least 12 minutes of practice and reading', () => {
    const p = plan()
    expect(p.blocks.map((b) => b.id)).toEqual(['warmup', 'new', 'story', 'mix'])
    expect(p.example).toBeNull()
    expect(p.practiceSeconds).toBeGreaterThanOrEqual(LENGUA_PRACTICE_TARGET_SECONDS)
    expect(p.practiceSeconds).toBeLessThanOrEqual(15 * 60)
  })

  it('the warm-up reviews learnt skills (no reading) and the story comes after them', () => {
    const p = plan({ mastery: learnt(['lng:gram:articulo', 'lng:orto:mayusculas', 'lng:voc:abecedario', 'lng:lect:preguntas']) })
    const warm = p.blocks[0].items.map((i) => i.exercise.skill)
    expect(warm.length).toBeGreaterThan(0)
    expect(warm.every((s) => s.startsWith('lng:') && !s.startsWith('lng:lect'))).toBe(true)
  })

  it('the new block has up to 6 items of the current topic, and its class first when the child has not done it', () => {
    const p = plan()
    expect(p.topic?.id).toBe('lng-silabas')
    const items = p.blocks[1].items
    expect(items.length).toBe(6)
    expect(items.every((i) => i.exercise.skill.startsWith('lng:gram:silabas'))).toBe(true)
    expect(p.classTopicId).toBe('lng-silabas')
  })

  it('no class to show once the child has done the class of the topic', () => {
    const p = plan({ progress: progress({ 'clase:lng-silabas': true }) })
    expect(p.classTopicId).toBeNull()
  })

  it('the story is the next unread one, and the next session after reading it is another one', () => {
    const first = plan()
    const story = first.blocks[2].items
    expect(story.length).toBeGreaterThanOrEqual(3)
    expect(story.length).toBeLessThanOrEqual(5)
    expect(story[0].passage?.id).toBe(STORY_READINGS[0].id)
    expect(story.filter((i) => i.passage).length).toBe(1)
    expect(story[story.length - 1].finishesReading).toBe(STORY_READINGS[0].id)
    expect(story.every((i) => i.exercise.kind.startsWith('lng-read-'))).toBe(true)

    const next = plan({ progress: progress({ [storyFlag(STORY_READINGS[0].id)]: true }) })
    expect(next.blocks[2].items[0].passage?.id).toBe(STORY_READINGS[1].id)
  })

  it('re-reads a story when every story is read', () => {
    const flags = Object.fromEntries(STORY_READINGS.map((r) => [storyFlag(r.id), true]))
    const p = plan({ progress: progress(flags) })
    const id = p.blocks[2].items[0].passage?.id
    expect(STORY_READINGS.map((r) => r.id)).toContain(id)
  })

  it('the mix is spelling and vocabulary only', () => {
    const p = plan({ mastery: learnt(['lng:gram:articulo', 'lng:orto:mayusculas', 'lng:voc:abecedario']) })
    const mix = p.blocks[3].items
    expect(mix.length).toBeGreaterThanOrEqual(3)
    expect(mix.every((i) => /^lng:(orto|voc):/.test(i.exercise.skill))).toBe(true)
  })

  it('without sound the planner leaves dictation out of every block (R16)', () => {
    const quiet = child({ sound: false })
    for (let seed = 0; seed < 3; seed++) {
      const p = planLenguaSession({
        child: quiet, mastery: learnt(['lng:gram:silabas', 'lng:orto:mayusculas']), syllabus: LENGUA3_SYLLABUS,
        now: new Date(NOW.getTime() + seed * 86_400_000), progress: progress(),
        rng: createRng(seed + 1),
      })
      const kinds = p.blocks.flatMap((b) => b.items.map((i) => i.exercise.kind))
      expect(kinds).not.toContain('lng-dictation')
      expect(p.blocks.flatMap((b) => b.items.map((i) => i.exercise.skill))).not.toContain('lng:escr:dictado')
    }
  })

  it('the same child and day give the same plan, and the plan never holds a maths skill', () => {
    const a = plan({ mastery: learnt(['lng:gram:articulo']) })
    const b = plan({ mastery: learnt(['lng:gram:articulo']) })
    expect(a.blocks.flatMap((x) => x.items.map((i) => i.exercise.id))).toEqual(b.blocks.flatMap((x) => x.items.map((i) => i.exercise.id)))
    for (const block of a.blocks) for (const item of block.items) expect(item.exercise.skill.startsWith('lng:')).toBe(true)
  })
})
