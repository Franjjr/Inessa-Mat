import { describe, expect, it } from 'vitest'
import { plainMixed } from '@/audio/sayMixed'
import { mergeProgress } from '@/data/merge'
import type { ProgressState } from '@/types'
import {
  allTopics, applyNodeResult, classForTopic, getGuardian, getLesson, getNode, getStory, getWorld, guardianForWorld, initialProgress, INGLES_CLASSES,
  ISLAND_ID, ISLAND_STAGES, ISLAND_STOP_PX, islandGuardians, islandWorld, isNodeUnlocked, isWorldUnlocked, lettersOf,
  switchSeason, getSeason,
} from '@/content'
import { INGLES3_STAGES, INGLES3_SYLLABUS } from '../../syllabus/ingles3'
import { ISLAND_KINDS } from '../island'
import { ISLAND_STORIES } from '../stories'

const NOW = new Date('2026-11-06T10:00:00Z')
const CHILD = 'child-1'
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1000, height: 490 },
  { width: 1366, height: 657 },
]

/** The island's stops in map order (each stage group, its guardian last). */
const stops = islandWorld.nodes

/** A progress with the given island stops done (the order of the map). */
function withDone(progress: ProgressState, ids: string[]): ProgressState {
  const nodes = Object.fromEntries(ids.map((id) => [id, { done: true, stars: 3, completedAt: NOW.toISOString() }]))
  return { ...progress, worlds: { ...progress.worlds, [ISLAND_ID]: { unlocked: true, crystal: false, nodes } } }
}

/** Words of a story as the child reads them: the marks dropped, every placeholder one word. */
function wordsOf(text: string): number {
  return plainMixed(text).replace(/\{[^}]+\}/g, 'X').split(/\s+/).filter(Boolean).length
}

describe('La Isla de las Palabras: the world', () => {
  it('is the island world, index 1, always open, and resolves whatever the season', () => {
    expect(islandWorld.id).toBe(ISLAND_ID)
    expect(islandWorld.index).toBe(1)
    expect(getWorld(ISLAND_ID, 's1')).toBe(islandWorld)
    expect(getWorld(ISLAND_ID, 'c2')).toBe(islandWorld)
    expect(isWorldUnlocked(initialProgress(CHILD, NOW), ISLAND_ID)).toBe(true)
  })

  it('has one stop group per stage of the syllabus, in order, and its last stop is a guardian', () => {
    expect(ISLAND_STAGES.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    const guardians = stops.filter((n) => n.kind === 'guardian')
    expect(guardians).toHaveLength(8)
    expect(stops[stops.length - 1].kind).toBe('guardian')
    expect(stops[stops.length - 1].ref).toBe(islandGuardians[7].id)
  })

  it('has stable, unique stop ids, and every stop resolves through getNode', () => {
    const ids = stops.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const n of stops) expect(getNode(ISLAND_ID, n.id)?.id, n.id).toBe(n.id)
  })

  // A stop's icon is 76 px: two stops closer than 90 px would touch each other.
  it('spreads the stops over the stage: no two stops closer than 90 px on any of the three viewports', () => {
    for (const v of VIEWPORTS) {
      const height = stops.length * ISLAND_STOP_PX
      const pts = stops.map((n) => ({ x: n.pos.x * v.width, y: n.pos.y * height }))
      let min = Infinity
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        min = Math.min(min, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y))
      }
      expect(min, `${v.width}×${v.height}`).toBeGreaterThanOrEqual(90)
    }
  })

  it('keeps every stop inside the map', () => {
    for (const n of stops) {
      expect(n.pos.x).toBeGreaterThanOrEqual(0)
      expect(n.pos.x).toBeLessThanOrEqual(1)
      expect(n.pos.y).toBeGreaterThanOrEqual(0)
      expect(n.pos.y).toBeLessThanOrEqual(1)
    }
  })
})

describe('La Isla de las Palabras: teaching order', () => {
  it('teaches each topic in a lesson stop before any activity or guardian of its stage uses it', () => {
    stops.forEach((n, i) => {
      if (n.kind !== 'activity' && n.kind !== 'guardian') return
      const stage = ISLAND_STAGES.find((s) => n.id.startsWith(`s${s.n}-`))
      expect(stage, n.id).toBeDefined()
      for (const l of stage!.lessons) {
        const at = stops.findIndex((x) => x.kind === 'lesson' && x.ref === l.id)
        expect(at, `${n.id} needs ${l.id} before it`).toBeGreaterThanOrEqual(0)
        expect(at, `${n.id} needs ${l.id} before it`).toBeLessThan(i)
      }
    })
  })

  it('every skill of an activity or a guardian is a skill of its stage', () => {
    for (const stage of ISLAND_STAGES) {
      const own = new Set([...stage.words, ...stage.phrases, ...stage.numbers])
      const act = stops.find((n) => n.id === `s${stage.n}-practica`)!.activity!
      for (const sk of act.selector.skills ?? []) expect(own.has(sk), `${stage.name}: ${sk}`).toBe(true)
    }
  })

  it('cross-checks each stage with the syllabus: its lessons are the classes of its topics, its skills are the topics skills', () => {
    expect(ISLAND_STAGES.length).toBe(INGLES3_STAGES.length)
    const topicsOf = allTopics(INGLES3_SYLLABUS)
    ISLAND_STAGES.forEach((stage, i) => {
      const syl = INGLES3_STAGES[i]
      // ops has only listening exercises: no stop of its own (see island.ts), so it is left out of both sides.
      const topics = syl.topics.filter((id) => id !== 'eng-ops').map((id) => topicsOf.find((t) => t.id === id)!)
      expect(stage.lessons.map((l) => l.id), syl.id).toEqual(
        topics.map((t) => classForTopic(t.id, 3, 'english')?.lesson.id),
      )
      const islandSkills = [...stage.words, ...stage.phrases, ...stage.numbers].sort()
      const syllabusSkills = topics.flatMap((t) => t.skills).sort()
      expect(islandSkills, syl.id).toEqual(syllabusSkills)
    })
  })

  it('has a lesson stop for every English class except ops (listening only, taught with the sound on)', () => {
    const lessonStops = stops.filter((n) => n.kind === 'lesson')
    const classIds = INGLES_CLASSES.map((c) => c.lesson.id).filter((id) => id !== 'eng3-ops')
    expect(lessonStops.map((n) => n.ref).sort()).toEqual(classIds.sort())
    for (const n of lessonStops) expect(getLesson(n.ref!)?.id, n.ref).toBe(n.ref)
  })

  it('a lesson stop is the English class: its lesson is the class lesson, with Lumi and five phases', () => {
    const stop = stops.find((n) => n.kind === 'lesson')!
    const cls = INGLES_CLASSES.find((c) => c.lesson.id === stop.ref)!
    expect(getLesson(stop.ref!)).toBe(cls.lesson)
    expect(cls.lesson.steps.length).toBeGreaterThan(4)
  })
})

describe('La Isla de las Palabras: activities and guardians never need the sound', () => {
  it('every activity and guardian round uses only kinds that do not listen', () => {
    for (const n of stops.filter((x) => x.kind === 'activity')) {
      for (const k of n.activity!.selector.kinds ?? []) expect(ISLAND_KINDS, `${n.id}: ${k}`).toContain(k)
    }
    for (const g of islandGuardians) {
      for (const r of g.rounds) for (const k of r.selector.kinds ?? []) expect(ISLAND_KINDS, `${g.id}: ${k}`).toContain(k)
    }
  })

  it('every guardian: 6 items in rounds, passes with all but one, no spell, no letter of the secret word', () => {
    for (const g of islandGuardians) {
      expect(g.rounds.reduce((s, r) => s + r.count, 0), g.id).toBe(6)
      expect(g.passMin, g.id).toBe(5)
      expect(g.spell, g.id).toBeUndefined()
      expect(g.letter, g.id).toBe('')
      expect(getGuardian(g.id)).toBe(g)
    }
  })

  it('every guardian has its rescue story, and the stop ids of its stage', () => {
    for (const g of islandGuardians) expect(getStory(g.rescueStory), g.rescueStory).toBeDefined()
    for (const stage of ISLAND_STAGES) {
      const guard = stops.find((n) => n.id === `s${stage.n}-guardian`)
      expect(guard?.ref).toBe(`isla-${stage.n}-guardian`)
    }
  })
})

describe('La Isla de las Palabras: stories', () => {
  it('has 80–180 words in every story, and every paragraph is at most 400 characters', () => {
    expect(ISLAND_STORIES.length).toBe(24)
    for (const st of ISLAND_STORIES) {
      let words = 0
      for (const scene of st.scenes) {
        for (const line of scene.lines) {
          expect(line.text.length, `${st.id}: ${line.text.slice(0, 30)}`).toBeLessThanOrEqual(400)
          words += wordsOf(line.text)
        }
      }
      expect(words, st.id).toBeGreaterThanOrEqual(80)
      expect(words, st.id).toBeLessThanOrEqual(180)
    }
  })

  it('every story has English to listen to, between asterisks, and no English outside them', () => {
    for (const st of ISLAND_STORIES) {
      const lines = st.scenes.flatMap((s) => s.lines.map((l) => l.text))
      expect(lines.some((t) => /\*[^*]+\*/.test(t)), st.id).toBe(true)
      for (const t of lines) expect(t.split('*').length % 2, `${st.id}: ${t}`).toBe(1)
    }
  })

  it('every story node of the island has its story', () => {
    for (const n of stops.filter((x) => x.kind === 'story')) expect(getStory(n.ref!), n.id).toBeDefined()
  })
})

describe('La Isla de las Palabras: unlocks are the sequence within the island, never the maths path', () => {
  it('the first stop is open at the start, and each stop opens when the one before it in the island is done', () => {
    const p = initialProgress(CHILD, NOW)
    expect(isNodeUnlocked(p, ISLAND_ID, stops[0].id)).toBe(true)
    expect(isNodeUnlocked(p, ISLAND_ID, stops[1].id)).toBe(false)
    const after = withDone(p, [stops[0].id])
    expect(isNodeUnlocked(after, ISLAND_ID, stops[1].id)).toBe(true)
    expect(isNodeUnlocked(after, ISLAND_ID, stops[2].id)).toBe(false)
  })

  it('the maths crystals do not open the island, and the island does not touch them', () => {
    const maths = getSeason('s1').worlds.reduce((acc, w) => ({ ...acc, [w.id]: { unlocked: true, nodes: {}, crystal: true } }), {} as ProgressState['worlds'])
    const p: ProgressState = { ...initialProgress(CHILD, NOW), worlds: maths }
    expect(isNodeUnlocked(p, ISLAND_ID, stops[1].id)).toBe(false)
    const done = applyNodeResult(p, ISLAND_ID, stops[0].id, { stars: 3, passed: true }, NOW)
    expect(done.worlds.w1).toEqual(p.worlds.w1)
    expect(lettersOf(done)).toEqual(lettersOf(p))
  })

  it('an island guardian that is not the last stop passes the stop but gives no crystal', () => {
    const guard = stops.find((n) => n.id === 's1-guardian')!
    const p = withDone(initialProgress(CHILD, NOW), stops.slice(0, stops.indexOf(guard)).map((n) => n.id))
    const after = applyNodeResult(p, ISLAND_ID, guard.id, { stars: 3, passed: true, letter: '' }, NOW)
    expect(after.worlds[ISLAND_ID]!.nodes[guard.id]!.done).toBe(true)
    expect(after.worlds[ISLAND_ID]!.crystal).toBe(false)
    expect(after.worlds.w1?.crystal ?? false).toBe(false)
  })

  it('the last stop (the last guardian) gives the island crystal', () => {
    const last = stops[stops.length - 1]
    const p = withDone(initialProgress(CHILD, NOW), stops.slice(0, -1).map((n) => n.id))
    const after = applyNodeResult(p, ISLAND_ID, last.id, { stars: 3, passed: true }, NOW)
    expect(after.worlds[ISLAND_ID]!.crystal).toBe(true)
    expect(guardianForWorld(ISLAND_ID)?.id).toBe(islandGuardians[islandGuardians.length - 1].id)
  })

  it('switching the season keeps the island progress and resets the maths map', () => {
    const p = withDone(initialProgress(CHILD, NOW, 's1'), [stops[0].id, stops[1].id])
    const switched = switchSeason(p, 'c2', NOW)
    expect(switched.seasonId).toBe('c2')
    expect(switched.worlds[ISLAND_ID]).toEqual(p.worlds[ISLAND_ID])
    expect(switched.worlds.w1).toEqual({ unlocked: true, nodes: {}, crystal: false })
  })

  it('merging two devices keeps the island progress of both', () => {
    const a = withDone(initialProgress(CHILD, NOW), [stops[0].id])
    const b = withDone(initialProgress(CHILD, NOW), [stops[0].id, stops[1].id, stops[2].id])
    const merged = mergeProgress(a, b)
    expect(Object.keys(merged.worlds[ISLAND_ID]!.nodes).sort()).toEqual([stops[0].id, stops[1].id, stops[2].id].sort())
    expect(merged.worlds[ISLAND_ID]!.nodes[stops[0].id]!.done).toBe(true)
  })
})
