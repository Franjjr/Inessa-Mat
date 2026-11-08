import { describe, expect, it } from 'vitest'
import type { MasteryMap, SkillMastery } from '@/types'
import {
  SONG_INTRO, SONG_TURN, bubbleChoices, songEnd, songFlagKey, songGaps, songLevel, songLines, songStars, songTables, songTexts,
} from './logic'

const m = (skill: string, box: SkillMastery['box']): SkillMastery => ({
  skill, box, attempts: 3, correct: 1, streak: 0, avgMs: null, lastSeenAt: null, dueAt: null, updatedAt: '2026-11-01T00:00:00Z',
})
const rngOf = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

describe('songTables', () => {
  it('2.º sings its five tables; 3.º, 4.º and no grade sing 2 to 10', () => {
    expect(songTables(2)).toEqual([2, 3, 4, 5, 10])
    for (const g of [3, 4, undefined]) expect(songTables(g)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})

describe('songLines', () => {
  it('the 7: ten facts and the rhymes of 7 × 7 and 7 × 8 right after them', () => {
    const lines = songLines(7)
    expect(lines).toHaveLength(12)
    const i = lines.findIndex((l) => l.kind === 'fact' && l.n === 8)
    expect(lines[i]).toMatchObject({ show: '7 × 8 = 56', say: 'Siete por ocho, cincuenta y seis', lead: 'Siete por ocho…', result: '¡Cincuenta y seis!' })
    expect(lines[i + 1]).toMatchObject({ kind: 'rhyme', say: '5, 6, 7, 8: ¡cincuenta y seis es siete por ocho!' })
    const j = lines.findIndex((l) => l.kind === 'fact' && l.n === 7)
    expect(lines[j + 1].kind).toBe('rhyme')
    expect(lines[0]).toMatchObject({ kind: 'fact', say: 'Siete por uno, siete' })
  })

  it('the 8 has the rhymes of 7 × 8 and 6 × 8; the 2 has none', () => {
    expect(songLines(8).filter((l) => l.kind === 'rhyme')).toHaveLength(2)
    expect(songLines(2).every((l) => l.kind === 'fact')).toBe(true)
  })
})

describe('songGaps', () => {
  it('a new child: 7, 8, 6 and 9 first, in song order', () => {
    expect(songGaps(7, {}, 1)).toEqual([6, 7, 8, 9])
  })

  it('the hard ones from the mastery, between 2 and 4', () => {
    const map: MasteryMap = {}
    for (let n = 1; n <= 10; n++) map[n <= 7 ? `mul:${n}x7` : `mul:7x${n}`] = m('x', 5)
    map['mul:7x8'] = m('mul:7x8', 0)
    const gaps = songGaps(7, map, 1)
    expect(gaps).toContain(8)
    expect(gaps.length).toBeGreaterThanOrEqual(2)
    expect(gaps.length).toBeLessThanOrEqual(4)
  })

  it('level 2 has 5 gaps, level 3 all but × 1 and × 10', () => {
    expect(songGaps(7, {}, 2)).toHaveLength(5)
    expect(songGaps(7, {}, 3)).toEqual([2, 3, 4, 5, 6, 7, 8, 9])
    for (const lv of [1, 2, 3] as const) {
      expect(songGaps(4, {}, lv)).not.toContain(1)
      expect(songGaps(4, {}, lv)).not.toContain(10)
    }
  })
})

describe('stars and level', () => {
  it('stars come from the flags; the level is one more, up to 3', () => {
    expect(songFlagKey(7, 1)).toBe('cancion:7:1')
    expect(songStars({ 'cancion:7:1': true, 'cancion:7:2': true }, 7)).toBe(2)
    expect(songStars(undefined, 7)).toBe(0)
    expect(songLevel(0)).toBe(1)
    expect(songLevel(2)).toBe(3)
    expect(songLevel(3)).toBe(3)
  })
})

describe('bubbleChoices', () => {
  it('the answer and two real confusions, shuffled', () => {
    const seen = new Set<string>()
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const c = bubbleChoices(7, 8, rngOf(seed))
      expect(c).toHaveLength(3)
      expect(c).toContain(56)
      expect(new Set(c).size).toBe(3)
      for (const x of c.filter((x) => x !== 56)) expect([49, 63, 15]).toContain(x)
      seen.add(c.join(','))
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it('never zero or negative', () => {
    expect(bubbleChoices(3, 1, rngOf(9)).every((x) => x > 0)).toBe(true)
  })
})

describe('songTexts', () => {
  it('everything the voice will say, for the preload', () => {
    const t = songTexts(7)
    for (const l of songLines(7)) {
      expect(t).toContain(l.say)
      if (l.kind === 'fact') {
        expect(t).toContain(l.lead)
        expect(t).toContain(l.result)
      }
    }
    expect(t).toEqual(expect.arrayContaining([SONG_INTRO, SONG_TURN, songEnd(7)]))
  })
})
