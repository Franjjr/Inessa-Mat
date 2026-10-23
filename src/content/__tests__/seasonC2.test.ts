/* The 2.º adventure (season 'c2'): the same maps as 3.º with the stops, stories and guardians of the 2.º temario, and
   the progress follows the season of the child's course. */
import { describe, expect, it } from 'vitest'
import { check, generate, isValidSkill, makeExercise } from '@/engine'
import {
  SPELL_CODES, applyNodeResult, getGuardian, getLesson, getNode, getStory, getWorld, guardianForWorld, initialProgress,
  finaleStoryId, isNodeUnlocked, nextNode, season1, seasonC2, seasonIdForGrade, stickers, switchSeason,
} from '@/content'
import { GRADE2_STAGES, GRADE2_SYLLABUS, allTopics } from '@/content/syllabus'
import { c2Stories } from '../c2/stories'
import { C2_FINALE_SWAPS } from '../c2/finale'
import { finale } from '../stories/finale'

const now = new Date('2026-10-22T10:00:00.000Z')

function skillsUpTo(stageIndex: number): Set<string> {
  const byId = new Map(allTopics(GRADE2_SYLLABUS).map((t) => [t.id, t]))
  return new Set(GRADE2_STAGES.slice(0, stageIndex + 1).flatMap((st) => st.topics.flatMap((id) => byId.get(id)!.skills)))
}

describe('the 2.º season', () => {
  it('has the same maps, guardians, crystals and predicaments as 3.º', () => {
    expect(seasonC2.worlds.map((w) => w.id)).toEqual(season1.worlds.map((w) => w.id))
    seasonC2.worlds.forEach((w, i) => {
      const s1 = season1.worlds[i]
      expect(w.seasonId).toBe('c2')
      expect([w.index, w.background, w.guardian, w.crystalName, w.predicament, w.color]).toEqual([s1.index, s1.background, s1.guardian, s1.crystalName, s1.predicament, s1.color])
    })
    expect(seasonC2.secretWord).toBe(season1.secretWord)
  })

  it('every story, lesson and guardian it names exists, and its guardian is the c2 one', () => {
    for (const w of seasonC2.worlds) {
      for (const n of w.nodes) {
        if (n.kind === 'story') expect(getStory(n.ref!), `${w.id}/${n.id}`).toBeDefined()
        if (n.kind === 'lesson') expect(getLesson(n.ref!), `${w.id}/${n.id}`).toBeDefined()
        if (n.kind === 'guardian') expect(n.ref).toBe(`c2-${w.id}-guardian`)
      }
      expect(guardianForWorld(w.id, 'c2')?.id).toBe(`c2-${w.id}-guardian`)
      expect(getWorld(w.id, 'c2')).toBe(w)
    }
    expect(c2Stories).toHaveLength(24)
  })

  it('each world only asks the 2.º skills of its stage or earlier ones, and they all generate', () => {
    seasonC2.worlds.forEach((w, i) => {
      const allowed = skillsUpTo(i)
      for (const n of w.nodes) {
        const sel = n.activity?.selector
        if (!sel) continue
        for (const s of sel.skills ?? []) {
          expect(isValidSkill(s), s).toBe(true)
          expect(allowed.has(s), `${w.id}/${n.id} asks ${s}`).toBe(true)
        }
        for (const t of sel.tables ?? []) expect(i >= 6 || [2, 5, 10].includes(t), `${w.id}/${n.id} table ${t}`).toBe(true)
        expect(generate(sel, 3, { now }).length, `${w.id}/${n.id}`).toBe(3)
      }
      const g = getGuardian(`c2-${w.id}-guardian`)!
      for (const r of g.rounds) for (const s of r.selector.skills ?? []) expect(allowed.has(s), `${g.id} asks ${s}`).toBe(true)
      const total = g.rounds.reduce((n, r) => n + r.count, 0)
      expect(total).toBeGreaterThanOrEqual(6)
      expect(total).toBeLessThanOrEqual(8)
      expect(g.passMin).toBe(total - 1)
      expect(g.letter).toBe(season1.secretWord[i])
      expect(getStory(g.rescueStory)).toBeDefined()
      const spell = makeExercise(g.spell.fixed!.kind, g.spell.fixed!.a, g.spell.fixed!.b)
      expect(check(spell, { type: 'number', value: SPELL_CODES[g.id].result }).correct, g.id).toBe(true)
    })
  })

  it('every sticker of a world can be won in the 2.º adventure too', () => {
    for (const st of stickers) {
      const m = st.earnedBy.match(/^(?:node|stars):(w\d):([^:]+)/)
      if (m) expect(getNode(m[1], m[2], 'c2'), st.id).toBeDefined()
    }
  })

  it('its stories stay within 2.º: no division, no tables of 6 to 9, no four-digit numbers, no céntimos', () => {
    const text = JSON.stringify(c2Stories)
    expect(text).not.toMatch(/divid|divisi/i)
    expect(text).not.toMatch(/tabla del [6-9]/i)
    expect(text).not.toMatch(/\b\d{4}\b/)
    expect(text).not.toMatch(/céntimo/i)
  })
})

describe('the 2.º finale', () => {
  it('changes only the lines of the 3.º trick, and keeps every other line', () => {
    const lines3 = finale.scenes.flatMap((sc) => sc.lines.map((l) => l.text))
    for (const t of C2_FINALE_SWAPS) expect(lines3, t).toContain(t)
    const c2 = getStory(finaleStoryId('c2'))!
    expect(c2.id).toBe('c2-finale')
    const lines2 = c2.scenes.flatMap((sc) => sc.lines.map((l) => l.text))
    expect(lines2).toHaveLength(lines3.length)
    expect(JSON.stringify(lines2)).not.toMatch(/tabla del 7|7 × 8/)
    expect(finaleStoryId('s1')).toBe('finale')
  })
})

describe('the season follows the course', () => {
  it('1.º and 2.º play the 2.º adventure, the rest the 3.º one', () => {
    expect([1, 2, 3, 4, undefined].map((g) => seasonIdForGrade(g))).toEqual(['c2', 'c2', 's1', 's1', 's1'])
  })

  it('a 2.º progress walks the 2.º stops', () => {
    let p = initialProgress('kid', now, 'c2')
    expect(nextNode(p)).toEqual({ worldId: 'w1', nodeId: 'arrival' })
    p = applyNodeResult(p, 'w1', 'arrival', { stars: 3 }, now)
    expect(nextNode(p)).toEqual({ worldId: 'w1', nodeId: seasonC2.worlds[0].nodes[1].id })
    expect(isNodeUnlocked(p, 'w1', 'lesson-tens')).toBe(true)
    p = applyNodeResult(p, 'w1', 'guardian', { stars: 3, passed: true }, now)
    expect(p.worlds.w1.letter).toBe('V')
    expect(p.worlds.w2?.unlocked).toBe(true)
  })

  it('switching season keeps stars and stickers, and never drops a season half won', () => {
    const fresh = { ...initialProgress('kid', now), stars: 40, stickers: ['dias-3'] }
    const moved = switchSeason(fresh, 'c2', now)
    expect(moved).toMatchObject({ seasonId: 'c2', stars: 40, stickers: ['dias-3'] })
    expect(moved.worlds).toEqual({ w1: { unlocked: true, nodes: {}, crystal: false } })
    const half = { ...fresh, worlds: { ...fresh.worlds, w1: { unlocked: true, nodes: {}, crystal: true, letter: 'V' } } }
    expect(switchSeason(half, 'c2', now)).toBe(half)
    const all = { ...fresh, worlds: Object.fromEntries(season1.worlds.map((w) => [w.id, { unlocked: true, nodes: {}, crystal: true }])) }
    expect(switchSeason(all, 'c2', now).seasonId).toBe('c2')
    expect(switchSeason(fresh, 's1', now)).toBe(fresh)
  })
})
