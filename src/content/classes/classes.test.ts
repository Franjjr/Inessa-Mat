import { describe, expect, it } from 'vitest'
import { COMPLETION_STARS, getLesson, initialProgress, isNodeUnlocked } from '@/content'
import type { SyllabusTopic } from '@/content'
import { topicTitle } from '@/content/syllabus/helpers'
import { w4Borrow } from '@/content/lessons/w4'
import { tryIt } from '@/content/lessons/dsl'
import { LENGUA3_SYLLABUS, syllabusFor, syllabusForGrade, allTopics } from '@/content/syllabus'
import { createRng, generate, kindsForSkill } from '@/engine'
import { syllabify } from '@/engine/lengua/syllables'
import { clase, CLASSES, classForTopic, isClassDone, LENGUA_CLASSES, markClassDone } from './index'

const sola = tryIt('borrow', { a: 352, b: 127 }, '¡Tu turno!', { kinds: ['column-sub'], digits: 3, regroup: 'one', zeros: false })

const fixture = clase({
  id: 'clase-resta-prestando',
  topicId: 'resta-3d-prestando',
  title: 'Restar prestando',
  mapLessonId: 'w4-borrow',
  para: w4Borrow.steps.slice(0, 2),
  ejemplo: w4Borrow.steps.slice(2, 5),
  guiada: [sola],
  sola: [sola],
  cierre: w4Borrow.steps[8],
})

describe('clase()', () => {
  it('puts the phases in order and takes the hints off the «sola» tries', () => {
    const { phases, lesson } = fixture
    expect(phases).toEqual({ para: 2, ejemplo: 3, guiada: 1, sola: 1, cierre: 1 })
    expect(lesson.steps.length).toBe(phases.para + phases.ejemplo + phases.guiada + phases.sola + 1)
    expect(lesson.steps[0]).toEqual(w4Borrow.steps[0])
    expect(lesson.steps[2]).toEqual(w4Borrow.steps[2])
    const soloSteps = lesson.steps.slice(-2, -1)
    for (const step of soloSteps) {
      expect(step.interaction).toBe('try')
      expect(step.hints).toBe(false)
    }
    expect(lesson.steps[lesson.steps.length - 1]).toEqual(w4Borrow.steps[8])
    const guided = lesson.steps.slice(phases.para + phases.ejemplo, phases.para + phases.ejemplo + phases.guiada)
    for (const step of guided) expect(step).not.toHaveProperty('hints')
  })
})

describe('isClassDone / markClassDone', () => {
  it('a class is done by its flag or by its map lesson already played', () => {
    const progress = initialProgress('child-1', new Date('2026-10-27'))
    expect(isClassDone(progress, fixture)).toBe(false)
    expect(isClassDone({ ...progress, flags: { 'clase:resta-3d-prestando': true } }, fixture)).toBe(true)
    const played = { ...progress, worlds: { ...progress.worlds, w4: { unlocked: true, crystal: false, nodes: { 'lesson-borrow': { done: true, stars: 3 } } } } }
    expect(isClassDone(played, fixture)).toBe(true)
  })

  it('markClassDone sets the flag and marks the unlocked map lesson, never a locked one', () => {
    const progress = initialProgress('child-1', new Date('2026-10-27'))
    // w4 is locked for a child who has not finished w1–w3: only the flag changes.
    const locked = markClassDone(progress, fixture, 'lesson')
    expect(locked.flags['clase:resta-3d-prestando']).toBe(true)
    expect(locked.worlds).toEqual(progress.worlds)
    expect(isClassDone(locked, fixture)).toBe(true)

    // Open the world 4 path: the crystal of world 3 is won, so the map lesson is unlocked.
    const opened = { ...progress, worlds: { ...progress.worlds, w3: { unlocked: true, crystal: true, nodes: {} }, w4: { unlocked: true, crystal: false, nodes: { arrival: { done: true, stars: 3 } } } } }
    expect(isNodeUnlocked(opened, 'w4', 'lesson-borrow')).toBe(true)
    const marked = markClassDone(opened, fixture, 'lesson')
    expect(marked.flags['clase:resta-3d-prestando']).toBe(true)
    expect(marked.worlds.w4.nodes['lesson-borrow']).toMatchObject({ done: true, stars: COMPLETION_STARS })
  })
})

describe('markClassDone by «Ya lo sé» (skip)', () => {
  it('sets the flag only: the unlocked map lesson keeps its state, with no stars and no last node', () => {
    const progress = initialProgress('child-1', new Date('2026-10-27'))
    const opened = { ...progress, worlds: { ...progress.worlds, w3: { unlocked: true, crystal: true, nodes: {} }, w4: { unlocked: true, crystal: false, nodes: { arrival: { done: true, stars: 3 } } } } }
    expect(isNodeUnlocked(opened, 'w4', 'lesson-borrow')).toBe(true)
    const skipped = markClassDone(opened, fixture, 'skip')
    expect(skipped.flags['clase:resta-3d-prestando']).toBe(true)
    expect(skipped.worlds).toEqual(opened.worlds)
    expect(skipped.stars).toBe(opened.stars)
    expect(skipped.lastNode).toEqual(opened.lastNode)
    expect(isClassDone(skipped, fixture)).toBe(true)
  })
})

describe('one map lesson per class', () => {
  it('no two classes share a map lesson, so finishing one never makes another done', () => {
    const lessons = CLASSES.map((c) => c.mapLessonId).filter((id): id is string => !!id)
    expect(new Set(lessons).size).toBe(lessons.length)
  })

  it('finishing the exacta class does not make the resto class done', () => {
    const exacta = classForTopic('div-exacta', 3)!
    const resto = classForTopic('div-resto', 3)!
    const progress = initialProgress('child-1', new Date('2026-10-27'))
    const opened = { ...progress, worlds: { ...progress.worlds, w7: { unlocked: true, crystal: true, nodes: {} }, w8: { unlocked: true, crystal: false, nodes: {} } } }
    const finished = markClassDone(opened, exacta, 'lesson')
    expect(isClassDone(finished, exacta)).toBe(true)
    expect(isClassDone(finished, resto)).toBe(false)
  })
})

describe('classForTopic', () => {
  it('finds a class by its syllabus topic, and none for a topic without one', () => {
    expect(classForTopic('resta-3d-prestando', 3)?.topicId).toBe('resta-3d-prestando')
    expect(classForTopic('graficos-tablas', 3)).toBeUndefined()
  })

  it('gives no class to a child of another grade, even for a topic id that repeats (mul-3x1 is in 4.º too)', () => {
    expect(classForTopic('mul-3x1', 3)?.topicId).toBe('mul-3x1')
    expect(classForTopic('mul-3x1', 4)).toBeUndefined()
    expect(classForTopic('mul-3x1', 2)).toBeUndefined()
  })

  it('a child without a grade follows the 3.º syllabus, so gets the 3.º class', () => {
    expect(classForTopic('resta-3d-prestando')?.topicId).toBe('resta-3d-prestando')
    expect(classForTopic('mul-3x1', undefined)?.topicId).toBe('mul-3x1')
  })
})

describe('clases de sumar y restar (3.º)', () => {
  const topicIds = ['suma-2d', 'suma-3d-sin-llevar', 'suma-3d-llevando', 'suma-4d', 'resta-3d-sin-llevar', 'resta-3d-prestando', 'resta-con-ceros', 'resta-4d']

  it('sumar y restar have their classes', () => {
    for (const id of topicIds) expect(classForTopic(id, 3), id).toBeDefined()
  })

  it('dividir has its classes', () => {
    for (const id of ['div-con-tablas', 'div-exacta', 'div-resto', 'div-larga', 'div-3x1']) expect(classForTopic(id, 3), id).toBeDefined()
  })

  it('multiplicar has its classes', () => {
    for (const id of ['mul-2x1-sin-llevar', 'mul-2x1-llevando', 'mul-3x1', 'mul-10-100', 'mul-2-cifras-intro']) expect(classForTopic(id, 3), id).toBeDefined()
  })

  it('every class keeps the five-phase shape and its tries generate exercises of its own topic', () => {
    const everyClass = [
      ...CLASSES.map((cls) => ({ cls, syllabus: syllabusForGrade(3) })),
      ...LENGUA_CLASSES.map((cls) => ({ cls, syllabus: syllabusFor('language', 3) })),
    ]
    expect(new Set(everyClass.map((e) => e.cls.lesson.id)).size).toBe(everyClass.length)
    for (const { cls, syllabus } of everyClass) {
      const { phases, lesson } = cls
      expect(phases.para, cls.lesson.id).toBeGreaterThanOrEqual(1)
      expect(phases.para, cls.lesson.id).toBeLessThanOrEqual(2)
      expect(phases.ejemplo, cls.lesson.id).toBeGreaterThanOrEqual(3)
      expect(phases.ejemplo, cls.lesson.id).toBeLessThanOrEqual(6)
      expect(phases.guiada, cls.lesson.id).toBe(2)
      expect(phases.sola, cls.lesson.id).toBeGreaterThanOrEqual(3)
      expect(phases.sola, cls.lesson.id).toBeLessThanOrEqual(4)
      expect(phases.cierre).toBe(1)

      const block = syllabus.blocks.find((b) => b.topics.some((t) => t.id === cls.topicId))
      expect(block, cls.topicId).toBeDefined()
      const earlier = block!.topics.slice(0, block!.topics.findIndex((t) => t.id === cls.topicId))
      const allowed = new Set([...earlier.flatMap((t) => t.skills), ...block!.topics.find((t) => t.id === cls.topicId)!.skills])

      if (cls.mapLessonId) expect(getLesson(cls.mapLessonId), cls.lesson.id).toBeDefined()

      const tries = lesson.steps.filter((s) => s.interaction === 'try')
      expect(tries.length, cls.lesson.id).toBe(phases.guiada + phases.sola)
      for (const step of tries) {
        for (let seed = 1; seed <= 20; seed++) {
          const [exercise] = generate(step.trySelector!, 1, { rng: createRng(seed) })
          expect(allowed.has(exercise.skill), `${cls.lesson.id}: ${exercise.skill} (seed ${seed})`).toBe(true)
          if (cls.topicId.startsWith('lng-')) {
            expect(kindsForSkill(exercise.skill), `${cls.lesson.id}: ${exercise.skill}`).toContain(exercise.kind)
          }
        }
      }
    }
  })
})

describe('topicTitle', () => {
  it('drops the example in brackets', () => {
    expect(topicTitle({ name: 'Descomponer (4 325 = 4 000 + 300 + 20 + 5)' } as SyllabusTopic)).toBe('Descomponer')
  })
  it('keeps plain names unchanged', () => {
    expect(topicTitle({ name: 'Resta de 3 cifras pidiendo prestado' } as SyllabusTopic)).toBe('Resta de 3 cifras pidiendo prestado')
  })
})

describe('clases de Lengua de 3.º', () => {
  const lengua = allTopics(LENGUA3_SYLLABUS)
  const withClass = lengua.filter((t) => t.id.startsWith('lng-') && LENGUA_CLASSES.some((c) => c.topicId === t.id))
  const blockOf = (topicId: string) => LENGUA3_SYLLABUS.blocks.find((b) => b.topics.some((t) => t.id === topicId))!.id

  it('every grammar, spelling and vocabulary topic has its class', () => {
    const expected = LENGUA3_SYLLABUS.blocks
      .filter((b) => ['gramatica', 'ortografia', 'vocabulario'].includes(b.id))
      .flatMap((b) => b.topics.map((t) => t.id))
    expect(expected.length).toBe(18)
    for (const id of expected) expect(classForTopic(id, 3, 'language'), id).toBeDefined()
    expect(withClass.map((t) => t.id).sort()).toEqual(expected.slice().sort())
  })

  it('reading, literature and writing have no class', () => {
    for (const t of lengua.filter((x) => ['lectura', 'literatura', 'escritura'].includes(blockOf(x.id)))) {
      expect(classForTopic(t.id, 3, 'language'), t.id).toBeUndefined()
    }
  })

  it('a Lengua topic id gives no maths class, and a maths topic id gives no Lengua class', () => {
    expect(classForTopic('lng-silabas', 3)).toBeUndefined()
    expect(classForTopic('suma-2d', 3, 'language')).toBeUndefined()
    expect(classForTopic('lng-silabas', 3, 'math')).toBeUndefined()
  })

  it('a child of another grade gets no Lengua class', () => {
    expect(classForTopic('lng-silabas', 4, 'language')).toBeUndefined()
    expect(classForTopic('lng-silabas', 2, 'language')).toBeUndefined()
    expect(classForTopic('lng-silabas', undefined, 'language')?.topicId).toBe('lng-silabas')
  })

  it('the two guiada tries use the syllabus topic’s first skill and keep their hints; the sola tries after them have none (R19)', () => {
    const topics = allTopics(LENGUA3_SYLLABUS)
    for (const cls of LENGUA_CLASSES) {
      const topic = topics.find((t) => t.id === cls.topicId)!
      const tries = cls.lesson.steps.filter((st) => st.interaction === 'try')
      const guiada = tries.slice(0, 2)
      const sola = tries.slice(2)
      expect(guiada.every((st) => st.trySelector!.skills![0] === topic.skills[0]), cls.lesson.id).toBe(true)
      expect(guiada.every((st) => st.hints !== false), cls.lesson.id).toBe(true)
      // sola starts where guiada ends: its own tries, three or four of them, all without hints.
      expect(sola.length, cls.lesson.id).toBeGreaterThanOrEqual(3)
      expect(sola.every((st) => st.hints === false), cls.lesson.id).toBe(true)
    }
  })

  it('each Lengua class has its own lesson id', () => {
    expect(new Set(LENGUA_CLASSES.map((c) => c.lesson.id)).size).toBe(LENGUA_CLASSES.length)
  })

  it('the syllables of a word in a lesson are the syllabifier’s syllables; morpheme parts use «+»', () => {
    for (const cls of LENGUA_CLASSES) {
      for (const st of cls.lesson.steps) {
        if (st.visual !== 'lng-word') continue
        const word = String(st.params!.word)
        const parts = st.params!.parts === undefined ? undefined : String(st.params!.parts)
        const mark = st.params!.mark === undefined ? undefined : String(st.params!.mark)
        if (parts !== undefined) {
          expect(parts.replace(/[-+]/g, ''), `${cls.lesson.id}: ${word}`).toBe(word)
          if (parts.includes('-')) expect(parts.split('-'), `${cls.lesson.id}: ${word}`).toEqual(syllabify(word))
          if (mark !== undefined) expect(parts.split(/[-+]/), `${cls.lesson.id}: ${word} mark ${mark}`).toContain(mark)
        } else {
          expect(mark, `${cls.lesson.id}: ${word}`).toBeUndefined()
        }
      }
    }
  })
})
