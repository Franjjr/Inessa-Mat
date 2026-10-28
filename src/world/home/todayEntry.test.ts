import { describe, expect, it } from 'vitest'
import { initialProgress } from '@/content'
import { currentTopic, LENGUA3_SYLLABUS, syllabusForGrade, topicTitle } from '@/content/syllabus'
import { createRng, planLenguaSession, teachableCourse } from '@/engine'
import type { ChildProfile, MasteryMap, ProgressState, SkillMastery } from '@/types'
import { homeSubject, homeSubjects, todayEntry } from './todayEntry'

const NOW = '2026-10-27T10:00:00.000Z'

/** Masters the topics in teaching order until `target` is the current one (mastered = every skill at box 5). */
function masteryUntilCurrent(grade: number, target: string): MasteryMap {
  const syllabus = syllabusForGrade(grade)
  const mastery: MasteryMap = {}
  for (let i = 0; i < 300; i++) {
    const topic = currentTopic(syllabus, mastery)
    if (!topic || topic.id === target) break
    for (const skill of topic.skills) {
      mastery[skill] = { skill, box: 5, attempts: 5, correct: 5, streak: 5, avgMs: null, lastSeenAt: null, dueAt: null, updatedAt: NOW } satisfies SkillMastery
    }
  }
  return mastery
}

const progress = (): ProgressState => initialProgress('child-1', new Date(NOW))

describe('todayEntry', () => {
  it('a 3.º child whose current topic has a class not done gets the class', () => {
    const mastery = masteryUntilCurrent(3, 'resta-3d-prestando')
    expect(currentTopic(syllabusForGrade(3), mastery)?.id).toBe('resta-3d-prestando')
    const entry = todayEntry({ grade: 3, mastery, progress: progress() })
    expect(entry).toEqual({ kind: 'clase', topicId: 'resta-3d-prestando', title: 'Resta de 3 cifras pidiendo prestado', to: '/play/clase/resta-3d-prestando' })
  })

  it('the class done (flag or map lesson) gives the session', () => {
    const mastery = masteryUntilCurrent(3, 'resta-3d-prestando')
    const done = { ...progress(), flags: { 'clase:resta-3d-prestando': true } }
    expect(todayEntry({ grade: 3, mastery, progress: done }).kind).toBe('sesion')
  })

  it('a topic without class gives the session', () => {
    const mastery = masteryUntilCurrent(3, 'decenas-centenas')
    expect(currentTopic(syllabusForGrade(3), mastery)?.id).toBe('decenas-centenas')
    const entry = todayEntry({ grade: 3, mastery, progress: progress() })
    expect(entry).toEqual({ kind: 'sesion', title: expect.any(String), to: '/play/sesion' })
  })

  it('a 4.º child gets no class for mul-3x1 (the id repeats in 4.º); a 3.º child with the same topic does', () => {
    const mastery4 = masteryUntilCurrent(4, 'mul-3x1')
    expect(currentTopic(syllabusForGrade(4), mastery4)?.id).toBe('mul-3x1')
    expect(todayEntry({ grade: 4, mastery: mastery4, progress: progress() }).kind).toBe('sesion')

    const mastery3 = masteryUntilCurrent(3, 'mul-3x1')
    expect(todayEntry({ grade: 3, mastery: mastery3, progress: progress() }).kind).toBe('clase')
  })

  it('a child without a grade follows the 3.º course: the class of the current topic', () => {
    const mastery = masteryUntilCurrent(3, 'resta-3d-prestando')
    expect(todayEntry({ grade: undefined, mastery, progress: progress() })).toEqual({
      kind: 'clase', topicId: 'resta-3d-prestando', title: 'Resta de 3 cifras pidiendo prestado', to: '/play/clase/resta-3d-prestando',
    })
  })

  it('a 2.º child gives the session', () => {
    expect(todayEntry({ grade: 2, mastery: {}, progress: progress() }).kind).toBe('sesion')
  })

  it('the title is the topic name without the example in brackets', () => {
    const entry = todayEntry({ grade: 3, mastery: {}, progress: progress() })
    const topic = currentTopic(syllabusForGrade(3), {})!
    expect(entry.title).toBe(topic.name.replace(/\s*\(.*\)\s*$/, ''))
    expect(entry.title).not.toMatch(/[()]/)
  })
})

describe('Lengua on the home', () => {
  const lenguaMastery = {} as MasteryMap

  it('the Lengua «Hoy» is the class of the first Lengua topic, and after the class the Lengua session', () => {
    expect(todayEntry({ grade: 3, mastery: lenguaMastery, progress: progress(), subject: 'language' })).toEqual({
      kind: 'clase', topicId: 'lng-silabas', title: 'Letras, sílabas y palabras', to: '/play/clase/lng-silabas',
    })
    const done = { ...progress(), flags: { 'clase:lng-silabas': true } }
    expect(todayEntry({ grade: 3, mastery: lenguaMastery, progress: done, subject: 'language' })).toEqual({
      kind: 'sesion', title: 'Letras, sílabas y palabras', to: '/play/lengua',
    })
  })

  it('a maths-only child opens on maths: the home view is maths until today\'s maths session is done', () => {
    expect(homeSubject(['math'], progress(), new Date(NOW))).toBe('math')
    expect(homeSubject(['math', 'language'], progress(), new Date(NOW))).toBe('math')
  })

  it('with both on, the home moves to Lengua once today\'s maths session is done', () => {
    const mathDone = { ...progress(), flags: { 'sesion-hecha:2026-10-27': true } }
    expect(homeSubject(['math', 'language'], mathDone, new Date(NOW))).toBe('language')
    expect(homeSubject(['language'], progress(), new Date(NOW))).toBe('language')
  })
})

describe('the home for each child (R22, R23)', () => {
  it('a maths-only 3.º child sees maths and no picker', () => {
    expect(homeSubjects(['math'], 3)).toEqual({ subjects: ['math'], chips: ['math'] })
  })

  it('a Lengua-only 3.º child is on Lengua alone, and the home opens on Lengua', () => {
    const r = homeSubjects(['language'], 3)
    expect(r).toEqual({ subjects: ['language'], chips: ['language'] })
    expect(homeSubject(r.subjects, { ...progress() })).toBe('language')
  })

  it('a 2.º child with Lengua only falls back to maths, and sees Lengua as a disabled chip', () => {
    const r = homeSubjects(['language'], 2)
    expect(r.subjects).toEqual(['math'])
    expect(r.chips).toEqual(['math', 'language'])
    expect(homeSubject(r.subjects, progress())).toBe('math')
  })

  it('a 4.º child with maths shows Lengua as a disabled chip too', () => {
    expect(homeSubjects(['math'], 4).chips).toEqual(['math', 'language'])
  })

  it('the home moves to Lengua on the maths day marker, not on the stars key (a run cut by the time counts)', () => {
    const withStars = { ...progress(), flags: { 'sesion:2026-10-27': true } }
    expect(homeSubject(['math', 'language'], withStars, new Date(NOW))).toBe('math')
    const cut = { ...progress(), flags: { 'sesion-hecha:2026-10-27': true } }
    expect(homeSubject(['math', 'language'], cut, new Date(NOW))).toBe('language')
  })

  it('Lengua names the topic its planner teaches (the same teachable view), with the sound on or off', () => {
    const lengua = (mastery: MasteryMap) => ({ grade: 3, mastery, progress: progress(), subject: 'language' as const })
    // Lengua topics mastered in teaching order up to the sustantivo: «Hoy» names what the planner teaches.
    const mastery: MasteryMap = {}
    for (const skill of ['lng:gram:silabas', 'lng:orto:mayusculas', 'lng:voc:abecedario']) {
      mastery[skill] = { skill, box: 5, attempts: 5, correct: 5, streak: 5, avgMs: null, lastSeenAt: null, dueAt: null, updatedAt: NOW } satisfies SkillMastery
    }
    const child = { id: 'child-1', name: 'Lía', grade: 3, settings: { sound: true, voice: false } } as unknown as ChildProfile
    const plan = planLenguaSession({ child, mastery, syllabus: LENGUA3_SYLLABUS, now: new Date(NOW), progress: progress(), rng: createRng(3) })
    const entry = todayEntry(lengua(mastery))
    expect(entry.kind === 'clase' || entry.kind === 'sesion').toBe(true)
    expect(entry.title).toBe(plan.topic ? topicTitle(plan.topic) : 'Lengua de hoy')
  })

  it('with the sound off a dictation-only topic is not taught, so «Hoy» does not name it', () => {
    const teachableSound = teachableCourse(LENGUA3_SYLLABUS, true)
    const teachableMute = teachableCourse(LENGUA3_SYLLABUS, false)
    const skillsOf = (c: typeof teachableSound) => c.blocks.flatMap((b) => b.topics).flatMap((t) => t.skills)
    expect(skillsOf(teachableSound)).toContain('lng:escr:dictado')
    expect(skillsOf(teachableMute)).not.toContain('lng:escr:dictado')
    // The topic is named by currentTopic over the same view: never the one with no skill left.
    expect(teachableMute.blocks.flatMap((b) => b.topics).filter((t) => t.skills.length === 0).map((t) => t.id)).toEqual(['lng-dictado'])
  })
})
