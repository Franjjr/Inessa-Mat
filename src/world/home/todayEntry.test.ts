import { describe, expect, it } from 'vitest'
import { initialProgress } from '@/content'
import { classForTopic, markClassDone } from '@/content/classes'
import { allTopics, currentTopic, INGLES3_SYLLABUS, LENGUA3_SYLLABUS, syllabusFor, syllabusForGrade, topicTitle } from '@/content/syllabus'
import { createRng, markClassToday, planLenguaSession, teachableCourse, type LessonSubject } from '@/engine'
import type { ChildProfile, MasteryMap, ProgressState, SkillMastery, SubjectId } from '@/types'
import { sessionDoneKey } from '@/world/session/logic'
import { homeSubject, homeSubjects, placementBannerOf, todayEntry } from './todayEntry'

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
    // Every 3.º topic has its class now, so the topic is a 4.º one: its class is for 3.º only.
    const mastery = masteryUntilCurrent(4, 'probabilidad-probable')
    expect(currentTopic(syllabusForGrade(4), mastery)?.id).toBe('probabilidad-probable')
    const entry = todayEntry({ grade: 4, mastery, progress: progress() })
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

describe('English on the home', () => {
  it('the English «Hoy» opens the class of its first topic', () => {
    expect(todayEntry({ grade: 3, mastery: {}, progress: progress(), subject: 'english' })).toEqual({
      kind: 'clase', topicId: 'eng-saludos', title: 'Saludos y yo', to: '/play/clase/eng-saludos',
    })
  })

  it('with the sound off the English «Hoy» never names the operations topic (no listening item is taught)', () => {
    const before = ['eng-saludos', 'eng-num-0-20', 'eng-num-decenas', 'eng-num-21-100', 'eng-colores', 'eng-animales', 'eng-familia',
      'eng-comida', 'eng-ropa', 'eng-cole', 'eng-casa', 'eng-cuerpo', 'eng-tiempo', 'eng-dias']
    const mastery: MasteryMap = {}
    for (const block of INGLES3_SYLLABUS.blocks) for (const t of block.topics) {
      if (!before.includes(t.id)) continue
      for (const skill of t.skills) mastery[skill] = { skill, box: 5, attempts: 5, correct: 5, streak: 5, avgMs: null, lastSeenAt: null, dueAt: null, updatedAt: NOW }
    }
    const withSound = todayEntry({ grade: 3, mastery, progress: { ...progress(), flags: { 'clase:eng-ops': true } }, subject: 'english', sound: true })
    expect(withSound).toEqual({ kind: 'sesion', title: 'Plus, minus y times', to: '/play/ingles' })
    const noSound = todayEntry({ grade: 3, mastery, progress: { ...progress(), flags: { 'clase:eng-ops': true } }, subject: 'english', sound: false })
    expect(noSound.title).not.toBe('Plus, minus y times')
  })

  it('after the English class the English «Hoy» is the session, which opens at /play/ingles', () => {
    const done = { ...progress(), flags: { 'clase:eng-saludos': true } }
    expect(todayEntry({ grade: 3, mastery: {}, progress: done, subject: 'english' })).toEqual({
      kind: 'sesion', title: 'Saludos y yo', to: '/play/ingles',
    })
  })

  it('homeSubject: the subsets of the subjects on, in the order math, Lengua, English', () => {
    const at = new Date(NOW)
    const done = (...subjects: LessonSubject[]) => ({ ...progress(), flags: Object.fromEntries(subjects.map((s) => [sessionDoneKey(at, s), true])) })
    // Only one subject on: it is the one.
    expect(homeSubject(['math'], progress(), at)).toBe('math')
    expect(homeSubject(['language'], progress(), at)).toBe('language')
    expect(homeSubject(['english'], progress(), at)).toBe('english')
    // Two on: the first not done today; with both done, the last one.
    expect(homeSubject(['math', 'english'], progress(), at)).toBe('math')
    expect(homeSubject(['math', 'english'], done('math'), at)).toBe('english')
    expect(homeSubject(['math', 'english'], done('math', 'english'), at)).toBe('english')
    expect(homeSubject(['language', 'english'], progress(), at)).toBe('language')
    expect(homeSubject(['language', 'english'], done('language'), at)).toBe('english')
    // All three on: math, then Lengua, then English.
    expect(homeSubject(['english', 'language', 'math'], progress(), at)).toBe('math')
    expect(homeSubject(['english', 'language', 'math'], done('math'), at)).toBe('language')
    expect(homeSubject(['english', 'language', 'math'], done('math', 'language'), at)).toBe('english')
    expect(homeSubject(['english', 'language', 'math'], done('math', 'language', 'english'), at)).toBe('english')
  })

  it('the home subjects: English is offered to 3.º only and a disabled chip when on outside it', () => {
    expect(homeSubjects(['math', 'english'], 3)).toEqual({ subjects: ['math', 'english'], chips: ['math', 'english'] })
    expect(homeSubjects(['math', 'english'], 4)).toEqual({ subjects: ['math'], chips: ['math', 'language', 'english'] })
    expect(homeSubjects(['english'], undefined)).toEqual({ subjects: ['english'], chips: ['english'] })
  })

  it('a maths child outside 3.º sees the same chips as before English existed', () => {
    expect(homeSubjects(['math'], 4).chips).toEqual(['math', 'language'])
    expect(homeSubjects(['math'], 2).chips).toEqual(['math', 'language'])
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

describe('placement banner on the home', () => {
  const ALL: SubjectId[] = ['math', 'language', 'english']
  const pendingOnly = (...ids: LessonSubject[]) => Object.fromEntries(ids.map((id) => [id, true])) as Partial<Record<LessonSubject, boolean>>

  it('shows the banner of the view\'s own subject while its test is pending', () => {
    expect(placementBannerOf('math', pendingOnly('math'), ALL)).toBe('math')
    expect(placementBannerOf('language', pendingOnly('language', 'math'), ALL)).toBe('language')
    expect(placementBannerOf('english', pendingOnly('english', 'language'), ALL)).toBe('english')
  })

  it('shows the next pending subject after the view, and never another view\'s maths banner', () => {
    // Maths done, Lengua pending: the banner shows on the maths view (the next one).
    expect(placementBannerOf('math', pendingOnly('language'), ALL)).toBe('language')
    // Maths and Lengua done, English pending: the banner shows on the Lengua and maths views.
    expect(placementBannerOf('language', pendingOnly('english'), ALL)).toBe('english')
    expect(placementBannerOf('math', pendingOnly('english'), ALL)).toBe('english')
    // Maths still pending: nothing shows on another view.
    expect(placementBannerOf('language', pendingOnly('math', 'english'), ALL)).toBeNull()
  })

  it('never shows the Lengua banner on the English home once English is done', () => {
    expect(placementBannerOf('english', pendingOnly('language'), ALL)).toBeNull()
    expect(placementBannerOf('english', {}, ALL)).toBeNull()
  })

  it('leaves out a subject that is not on for the child', () => {
    expect(placementBannerOf('math', pendingOnly('language', 'english'), ['math', 'english'])).toBe('english')
    expect(placementBannerOf('math', pendingOnly('language'), ['math'])).toBeNull()
  })
})

describe('todayEntry: English keeps the topic of today\'s class', () => {
  it('after the class, the home still names its topic and leads to the session (not to the next topic\'s class)', () => {
    const numbers = INGLES3_SYLLABUS.blocks.flatMap((b) => b.topics).find((t) => t.id === 'eng-num-0-20')!
    const learnt = Object.fromEntries(numbers.skills.map((skill) => [skill, { skill, box: 5, attempts: 5, correct: 5, streak: 5, avgMs: null, lastSeenAt: null, dueAt: null, updatedAt: NOW } satisfies SkillMastery]))
    const done = markClassToday(markClassDone(progress(), classForTopic('eng-num-0-20', 3, 'english')!, 'lesson'), 'eng-num-0-20', new Date(NOW))
    expect(todayEntry({ grade: 3, mastery: learnt, progress: done, subject: 'english', now: new Date(NOW) })).toEqual({
      kind: 'sesion', title: topicTitle(numbers), to: '/play/ingles',
    })
  })
})

describe('todayEntry: maths and Lengua keep the topic of today\'s class', () => {
  const box2 = (skills: string[]) => Object.fromEntries(skills.map((skill) => [skill, { skill, box: 2, attempts: 5, correct: 5, streak: 5, avgMs: null, lastSeenAt: null, dueAt: null, updatedAt: NOW } satisfies SkillMastery]))
  it('after a class that masters its topic, the home leads to the session, not to the next topic\'s class', () => {
    for (const [subject, topicId, to] of [['math', 'descomponer-9999', '/play/sesion'], ['language', 'lng-silabas', '/play/lengua']] as const) {
      const topic = allTopics(syllabusFor(subject, 3)).find((t) => t.id === topicId)!
      const done = markClassToday(markClassDone(progress(), classForTopic(topicId, 3, subject)!, 'lesson'), topicId, new Date(NOW))
      expect(todayEntry({ grade: 3, mastery: box2(topic.skills), progress: done, subject, now: new Date(NOW) })).toEqual({ kind: 'sesion', title: topicTitle(topic), to })
      // Without today's mark the home moves on to the next topic and offers its class (the cause).
      expect(todayEntry({ grade: 3, mastery: box2(topic.skills), progress: markClassDone(progress(), classForTopic(topicId, 3, subject)!, 'lesson'), subject, now: new Date(NOW) }).kind).toBe('clase')
    }
  })
})
