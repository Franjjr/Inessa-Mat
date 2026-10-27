import { describe, expect, it } from 'vitest'
import { initialProgress } from '@/content'
import { currentTopic, syllabusForGrade } from '@/content/syllabus'
import type { MasteryMap, ProgressState, SkillMastery } from '@/types'
import { todayEntry } from './todayEntry'

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
    const entry = todayEntry({ grade: 3, mastery: {}, progress: progress() })
    expect(entry).toEqual({ kind: 'sesion', title: expect.any(String), to: '/play/sesion' })
  })

  it('a 4.º child gets no class for mul-3x1 (the id repeats in 4.º); a 3.º child with the same topic does', () => {
    const mastery4 = masteryUntilCurrent(4, 'mul-3x1')
    expect(currentTopic(syllabusForGrade(4), mastery4)?.id).toBe('mul-3x1')
    expect(todayEntry({ grade: 4, mastery: mastery4, progress: progress() }).kind).toBe('sesion')

    const mastery3 = masteryUntilCurrent(3, 'mul-3x1')
    expect(todayEntry({ grade: 3, mastery: mastery3, progress: progress() }).kind).toBe('clase')
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
