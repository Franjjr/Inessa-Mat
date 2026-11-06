/* The English session planner (Mi sesión de Inglés, 10 minutes): its blocks, the class before «Lo nuevo», the failed words
   in the mix, the final game of every session, and that the listening kinds are left out without sound. */
import { describe, expect, it } from 'vitest'
import { initialProgress } from '@/content'
import { INGLES3_SYLLABUS, currentTopic } from '@/content/syllabus'
import { DEFAULT_CHILD_SETTINGS, type AttemptRecord, type ChildProfile, type MasteryMap, type ProgressState, type SkillMastery } from '@/types'
import { createRng } from '../../rng'
import { ENGLISH_LISTENING_KINDS } from '../exercises'
import { ENGLISH_WORDS } from '../words'
import { ENGLISH_PRACTICE_TARGET_SECONDS, planEnglishSession } from '../daily'
import { ENGLISH_SESSION_MINUTES } from '../../subjects'

const NOW = new Date('2026-11-06T10:00:00.000Z')
const child = (): ChildProfile => ({
  id: 'child-ingles', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS, subjects: ['math', 'language', 'english'] },
  createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z',
})
const progress = (flags: Record<string, boolean> = {}): ProgressState => ({
  ...initialProgress('child-ingles', new Date('2026-10-01T10:00:00.000Z')), flags,
})
const row = (skill: string, box: 0 | 1 | 2 | 3 | 4 | 5, lastSeenAt: string | null): SkillMastery => ({
  skill, box, attempts: 5, correct: 5, streak: 5, avgMs: null, lastSeenAt, dueAt: null, updatedAt: '2026-11-01T09:00:00.000Z',
})
/** Learnt rows (box 5, seen before today) for the given skills: the warm-up reviews them. */
const learnt = (skills: string[]): MasteryMap => Object.fromEntries(skills.map((s) => [s, row(s, 5, '2026-11-02T09:00:00.000Z')]))
/** Every skill of the given topics at box 5: they count as mastered. */
const masteredTopics = (topicIds: string[]): MasteryMap => {
  const skills = INGLES3_SYLLABUS.blocks.flatMap((b) => b.topics).filter((t) => topicIds.includes(t.id)).flatMap((t) => t.skills)
  return learnt(skills)
}
const attempt = (skill: string, correct: boolean): AttemptRecord => ({
  id: `a-${skill}-${correct}`, childId: 'child-ingles', sessionId: null, skill, kind: 'eng-write-word', correct,
  given: '', expected: '', ms: 1000, inputMode: 'keyboard', hintsUsed: 0, context: {}, createdAt: '2026-11-05T09:00:00.000Z',
} as unknown as AttemptRecord)

const plan = (opts: { mastery?: MasteryMap; attempts?: AttemptRecord[]; progress?: ProgressState; sound?: boolean; seed?: number } = {}) =>
  planEnglishSession({
    child: child(), mastery: opts.mastery ?? {}, attempts: opts.attempts ?? [], syllabus: INGLES3_SYLLABUS, now: NOW,
    progress: opts.progress ?? progress(), sound: opts.sound ?? true, rng: createRng(opts.seed ?? 7),
  })

const kindsOf = (p: ReturnType<typeof plan>) => p.blocks.flatMap((b) => b.items).map((i) => i.exercise.kind)

describe('planEnglishSession', () => {
  it('has the blocks warm-up, new, mix and game, in that order, and about ten minutes of practice', () => {
    const p = plan()
    expect(p.blocks.map((b) => b.id)).toEqual(['warmup', 'new', 'mix', 'game'])
    expect(p.example).toBeNull()
    expect(p.practiceSeconds).toBeGreaterThanOrEqual(ENGLISH_PRACTICE_TARGET_SECONDS)
    expect(p.practiceSeconds).toBeLessThanOrEqual(ENGLISH_SESSION_MINUTES * 60 + 60)
  })

  it('the warm-up reviews learnt English skills only, and the new block has 3 to 5 items of the topic', () => {
    const p = plan({ mastery: learnt(['eng:voc:colores', 'eng:frase:saludos']) })
    const warm = p.blocks[0].items.map((i) => i.exercise.skill)
    expect(warm.length).toBeGreaterThan(0)
    expect(warm.every((s) => s.startsWith('eng:') && (s === 'eng:voc:colores' || s === 'eng:frase:saludos'))).toBe(true)
    const fresh = plan()
    expect(fresh.topic?.id).toBe('eng-saludos')
    expect(fresh.blocks[1].items.length).toBeGreaterThanOrEqual(3)
    expect(fresh.blocks[1].items.length).toBeLessThanOrEqual(5)
    expect(fresh.blocks[1].items.every((i) => i.exercise.skill.startsWith('eng:voc:saludos') || i.exercise.skill.startsWith('eng:frase:saludos'))).toBe(true)
  })

  it('the class of the topic comes before «Lo nuevo» when the child has not done it, and not after', () => {
    expect(plan().classTopicId).toBe('eng-saludos')
    expect(plan({ progress: progress({ 'clase:eng-saludos': true }) }).classTopicId).toBeNull()
  })

  it('the failed words come first in the mix', () => {
    const p = plan({ attempts: [attempt('eng:voc:animales', false), attempt('eng:voc:comida', true)] })
    const mix = p.blocks[2].items
    expect(mix.length).toBeGreaterThanOrEqual(3)
    expect(mix[0].exercise.skill).toBe('eng:voc:animales')
  })

  it('the final game is always one, on the topic of the day: the memory game when the theme has its pictures, else a scramble', () => {
    const pictures = (theme: string) => ENGLISH_WORDS.filter((w) => w.theme === theme && w.emoji).length
    const animals = plan({ mastery: masteredTopics(['eng-saludos', 'eng-num-0-20', 'eng-colores', 'eng-num-decenas']), seed: 4 })
    expect(animals.topic?.id).toBe('eng-animales')
    const game = animals.blocks[3].items
    expect(game).toHaveLength(1)
    expect(game[0].exercise.kind).toBe(pictures('animales') >= 6 ? 'eng-memory' : 'eng-scramble')
    expect(game[0].exercise.skill).toBe('eng:voc:animales')
    const saludos = plan({ seed: 5 })
    expect(saludos.topic?.id).toBe('eng-saludos')
    expect(saludos.blocks[3].items[0].exercise.kind).toBe(pictures('saludos') >= 6 ? 'eng-memory' : 'eng-scramble')
  })

  it('a numbers topic ends with a number game: the listening one with the sound on, the written one without', () => {
    const numbers = masteredTopics(['eng-saludos', 'eng-colores', 'eng-animales', 'eng-familia'])
    const withSound = plan({ mastery: numbers, sound: true }).blocks[3].items
    expect(withSound).toHaveLength(1)
    expect(withSound[0].exercise.kind).toBe('eng-num-listen')
    expect(plan({ mastery: numbers, sound: false }).blocks[3].items[0].exercise.kind).toBe('eng-num-write')
  })

  it('with the sound off no listening kind is planned, and the operations topic is not taught', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const kinds = kindsOf(plan({ sound: false, seed }))
      expect(kinds.some((k) => ENGLISH_LISTENING_KINDS.includes(k))).toBe(false)
    }
    // Every topic before the operations mastered: with the sound on the operations come next, without it nothing is taught.
    const before = ['eng-saludos', 'eng-num-0-20', 'eng-num-decenas', 'eng-num-21-100', 'eng-colores', 'eng-animales', 'eng-familia',
      'eng-comida', 'eng-ropa', 'eng-cole', 'eng-casa', 'eng-cuerpo', 'eng-tiempo', 'eng-dias']
    const mastery = masteredTopics(before)
    expect(plan({ mastery, sound: true }).topic?.id).toBe('eng-ops')
    expect(plan({ mastery, sound: false }).topic?.id).not.toBe('eng-ops')
  })

  it('the day has its own seed: the same child and day give the same plan', () => {
    const a = planEnglishSession({ child: child(), mastery: {}, attempts: [], syllabus: INGLES3_SYLLABUS, now: NOW, progress: progress() })
    const b = planEnglishSession({ child: child(), mastery: {}, attempts: [], syllabus: INGLES3_SYLLABUS, now: NOW, progress: progress() })
    expect(b.blocks).toEqual(a.blocks)
    expect(currentTopic(INGLES3_SYLLABUS, {})?.id).toBe('eng-saludos')
  })
})
