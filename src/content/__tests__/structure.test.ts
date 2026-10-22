import { describe, expect, it } from 'vitest'
import type { ActivityKind, CharacterId, ExerciseKind, LessonVisualId, SkillSelector } from '@/types'
import {
  FINALE_STORY_ID, PROLOGUE_STORY_ID, getGuardian, getLesson, getNode, getStory, getWorld, guardians, lessons, season1,
  stories, SPELL_CODES,
} from '@/content'
import { allActivities, allCopy, allSelectors, wordCount } from './helpers'

/** Worlds that gained method content (see the node count test). */
const MAX_NODES: Record<string, number> = { w3: 11, w4: 12, w8: 11 }
const EXERCISE_KINDS: ExerciseKind[] = [
  'fact-mul', 'fact-div', 'missing-factor', 'skip-count', 'groups', 'array', 'double-chain', 'fact-family',
  'column-add', 'column-sub', 'column-mul', 'division', 'word-problem', 'bar-problem', 'error-hunt', 'check-calc',
]
const CHARACTERS: CharacterId[] = ['lumi', 'companion', 'borron', 'owl', 'frog', 'ladybug', 'polarbear', 'octopus', 'fairy', 'dragon', 'queen', 'narrator']
const SKILL_RE = /^(mul:([1-9]|10)x([1-9]|10)|div:\d+\/\d+|skip:\d+|add:[34]d:c[0-4]|add:2d:c[0-2]|sub:[34]d:(b[0-3]|z)|sub:2d:b[01]|mul:2x1:c[01]|div:2x1:(exact|rem|long)|div:3x1:(exact|rem)|concept:(groups|array|commutative|share|family|placevalue)|word:(add|sub|mul|div)|bar:(add|sub|mul|div|two)|hunt:(add|sub|mul)|check:(add|sub|div))$/

/** Required params of every lesson visual (src/types/content.ts). */
const VISUAL_PARAMS: Record<LessonVisualId, string[]> = {
  groups: ['groups', 'perGroup', 'emoji'],
  'array-rotate': ['rows', 'cols', 'emoji'],
  'easy-tables': [],
  'place-value': ['n'],
  carry: ['a', 'b'],
  borrow: ['a', 'b'],
  'zero-borrow': ['a', 'b'],
  'sub-check': ['a', 'b'],
  'sub-carry': ['a', 'b'],
  'sub-parts': ['a', 'b'],
  'sub-line': ['a', 'b'],
  'five-plus-one': ['b'],
  'even-six-rhyme': [],
  'double-chain': ['start', 'steps'],
  'pattern-units': ['table'],
  'known-facts': ['table'],
  'nine-trick': ['a'],
  'square-rhyme': [],
  'five-six-seven-eight': [],
  'split-multiply': ['n', 'm'],
  'column-mul': ['top', 'bottom'],
  share: ['total', 'groups', 'emoji'],
  'fact-family': ['a', 'b'],
  galera: ['dividend', 'divisor'],
  'division-check': ['dividend', 'divisor'],
  'bar-model': ['a', 'b', 'total'],
  'div-parts': ['dividend', 'divisor'],
  'div-climb': ['divisor', 'quotient'],
}

function checkSelector(where: string, sel: SkillSelector) {
  const ctx = `${where}: ${JSON.stringify(sel)}`
  expect(sel.kinds?.length || sel.skills?.length, ctx).toBeTruthy()
  for (const k of sel.kinds ?? []) expect(EXERCISE_KINDS, ctx).toContain(k)
  for (const s of sel.skills ?? []) expect(s, ctx).toMatch(SKILL_RE)
  for (const t of sel.tables ?? []) expect(Number.isInteger(t) && t >= 1 && t <= 10, ctx).toBe(true)
  if (sel.factorRange) {
    const [lo, hi] = sel.factorRange
    expect(lo >= 1 && hi <= 10 && lo <= hi, ctx).toBe(true)
  }
  if (sel.digits !== undefined) expect([2, 3, 4], ctx).toContain(sel.digits)
  if (sel.regroup !== undefined) expect(['none', 'one', 'many', 'any'], ctx).toContain(sel.regroup)
  for (const v of sel.divisionVariants ?? []) expect(['exact', 'rem', 'long'], ctx).toContain(v)
  // Every kind must be told enough to generate the intended items.
  const kinds = sel.kinds ?? []
  const facty = kinds.some((k) => ['fact-mul', 'fact-div', 'missing-factor', 'skip-count', 'double-chain', 'fact-family'].includes(k))
  if (facty) expect(sel.tables?.length || sel.skills?.length, `${ctx} needs tables or skills`).toBeTruthy()
  if (kinds.includes('column-add') || kinds.includes('column-sub')) {
    expect(sel.digits !== undefined || sel.skills?.length, `${ctx} needs digits or skills`).toBeTruthy()
  }
  if (kinds.includes('division')) expect(sel.divisionVariants?.length || sel.skills?.length, `${ctx} needs variants`).toBeTruthy()
  if (kinds.includes('bar-problem') || kinds.includes('error-hunt') || kinds.includes('check-calc')) {
    expect(sel.skills?.length, `${ctx} new kinds use explicit skills`).toBeTruthy()
  }
  if (kinds.includes('word-problem')) expect(sel.skills?.length, `${ctx} word problems use explicit skills`).toBeTruthy()
  if (sel.skills?.length && kinds.length) {
    // explicit skills must be producible by the listed kinds
    for (const s of sel.skills) {
      const ok =
        (s.startsWith('mul:') && !s.startsWith('mul:2x1') && kinds.some((k) => ['fact-mul', 'missing-factor', 'double-chain'].includes(k))) ||
        (s.startsWith('div:') && !s.startsWith('div:2x1') && !s.startsWith('div:3x1') && kinds.includes('fact-div')) ||
        (s.startsWith('div:3x1') && kinds.includes('division')) ||
        (s.startsWith('bar:') && kinds.includes('bar-problem')) ||
        (s.startsWith('hunt:') && kinds.includes('error-hunt')) ||
        (s.startsWith('check:') && kinds.includes('check-calc')) ||
        (s.startsWith('add:') && kinds.some((k) => k === 'column-add' || k === 'word-problem')) ||
        (s.startsWith('sub:') && kinds.some((k) => k === 'column-sub' || k === 'word-problem')) ||
        (s.startsWith('mul:2x1') && kinds.some((k) => k === 'column-mul' || k === 'word-problem')) ||
        (s.startsWith('div:2x1') && kinds.some((k) => k === 'division' || k === 'word-problem')) ||
        s.startsWith('concept:') || s.startsWith('skip:') || s.startsWith('word:')
      expect(ok, `${ctx}: skill ${s} does not fit kinds`).toBe(true)
    }
  }
}

describe('season 1 structure', () => {
  it('has 8 worlds w1..w8 in order with the right metadata', () => {
    expect(season1.id).toBe('s1')
    expect(season1.secretWord).toBe('VALIENTE')
    expect(season1.worlds.map((w) => w.id)).toEqual(['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8'])
    season1.worlds.forEach((w, i) => {
      expect(w.index).toBe(i + 1)
      expect(w.seasonId).toBe('s1')
      expect(w.color).toBe(`var(--${w.id})`)
      expect(w.colorSoft).toBe(`var(--${w.id}-soft)`)
      expect(getWorld(w.id)).toBe(w)
    })
    expect(season1.worlds.map((w) => w.predicament)).toEqual(['vines', 'bubble', 'stuck', 'ice', 'ink', 'fog', 'cage', 'net'])
    expect(season1.worlds.map((w) => w.guardian)).toEqual(['owl', 'frog', 'ladybug', 'polarbear', 'octopus', 'fairy', 'dragon', 'queen'])
    expect(season1.worlds.map((w) => w.crystalName)).toEqual(['verde', 'azul', 'rojo', 'celeste', 'violeta', 'rosa', 'naranja', 'dorado'])
    expect(season1.worlds.map((w) => w.background)).toEqual(['forest', 'river', 'cave', 'mountain', 'lake', 'rainbow-garden', 'volcano', 'castle'])
  })

  it('every world has 7–10 nodes (11–12 where the new methods are): arrival story first, guardian last, 3–5 varied activities', () => {
    for (const w of season1.worlds) {
      expect(w.nodes.length, w.id).toBeGreaterThanOrEqual(7)
      // w4 keeps «Cuatro caminos para restar» and adds «Dibujar la historia» (the bars). w3 adds «Los trucos de Lumi»,
      // w8 «Cuatro caminos para dividir». Every other world keeps the planning cap of 10 nodes.
      expect(w.nodes.length, w.id).toBeLessThanOrEqual(MAX_NODES[w.id] ?? 10)
      expect(w.nodes[0].kind, w.id).toBe('story')
      expect(w.nodes[0].ref, w.id).toBe(`${w.id}-arrival`)
      expect(w.nodes[w.nodes.length - 1].kind, w.id).toBe('guardian')
      expect(w.nodes.filter((n) => n.kind === 'guardian')).toHaveLength(1)
      expect(w.nodes.some((n) => n.kind === 'lesson'), w.id).toBe(true)
      const acts = w.nodes.filter((n) => n.kind === 'activity')
      expect(acts.length, w.id).toBeGreaterThanOrEqual(3)
      expect(acts.length, w.id).toBeLessThanOrEqual(5)
      expect(new Set(acts.map((n) => n.activity!.kind)).size, `${w.id} varied kinds`).toBeGreaterThanOrEqual(3)
    }
  })

  it('node ids are unique per world and every getNode resolves', () => {
    for (const w of season1.worlds) {
      const ids = w.nodes.map((n) => n.id)
      expect(new Set(ids).size, w.id).toBe(ids.length)
      for (const n of w.nodes) {
        expect(n.id).toMatch(/^[a-z0-9-]+$/)
        expect(getNode(w.id, n.id)).toBe(n)
      }
    }
    expect(getNode('w1', 'nope')).toBeUndefined()
    expect(getNode('w9', 'arrival')).toBeUndefined()
  })

  it('every ref resolves to the right kind of definition', () => {
    for (const w of season1.worlds) {
      for (const n of w.nodes) {
        const where = `${w.id}/${n.id}`
        switch (n.kind) {
          case 'story': expect(getStory(n.ref!), where).toBeDefined(); break
          case 'lesson': expect(getLesson(n.ref!), where).toBeDefined(); break
          case 'guardian': expect(getGuardian(n.ref!), where).toBeDefined(); break
          case 'activity': expect(n.activity, where).toBeDefined(); expect(n.ref, where).toBeUndefined(); break
          case 'review': expect(n.ref, where).toBeUndefined(); expect(n.activity, where).toBeUndefined(); break
        }
        if (n.kind !== 'activity') expect(n.activity, where).toBeUndefined()
        if (n.activity) expect(n.title, where).toBe(n.activity.title)
      }
    }
    expect(getStory(PROLOGUE_STORY_ID)).toBeDefined()
    expect(getStory(FINALE_STORY_ID)).toBeDefined()
    for (const g of guardians) expect(getStory(g.rescueStory), g.id).toBeDefined()
  })

  it('story, lesson and guardian ids are unique and all are used', () => {
    const sIds = stories.map((s) => s.id)
    const lIds = lessons.map((l) => l.id)
    const gIds = guardians.map((g) => g.id)
    for (const ids of [sIds, lIds, gIds]) expect(new Set(ids).size).toBe(ids.length)
    const refs = new Set(season1.worlds.flatMap((w) => w.nodes.map((n) => n.ref).filter(Boolean)))
    for (const id of lIds) expect(refs.has(id), `lesson ${id} unused`).toBe(true)
    for (const id of gIds) expect(refs.has(id), `guardian ${id} unused`).toBe(true)
    const rescue = new Set(guardians.map((g) => g.rescueStory))
    for (const id of sIds) expect(refs.has(id) || rescue.has(id) || id === PROLOGUE_STORY_ID || id === FINALE_STORY_ID, `story ${id} unused`).toBe(true)
  })

  it('map positions lie inside the map, along a non-crossing path, and never overlap on tablets', () => {
    const cross = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }) => {
      const o = (p: typeof a, q: typeof a, r: typeof a) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x))
      return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b)
    }
    for (const w of season1.worlds) {
      const pts = w.nodes.map((n) => n.pos)
      for (const p of pts) {
        expect(p.x, w.id).toBeGreaterThanOrEqual(0.1)
        expect(p.x, w.id).toBeLessThanOrEqual(0.9)
        expect(p.y, w.id).toBeGreaterThanOrEqual(0.1)
        expect(p.y, w.id).toBeLessThanOrEqual(0.9)
      }
      for (const [W, H, min] of [[1180, 820, 120], [820, 1180, 100], [1280, 800, 120]] as const) {
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const d = Math.hypot((pts[i].x - pts[j].x) * W, (pts[i].y - pts[j].y) * H)
            expect(d, `${w.id} nodes ${i}-${j} at ${W}x${H}`).toBeGreaterThanOrEqual(min)
          }
        }
      }
      for (let i = 0; i < pts.length - 1; i++) {
        for (let j = i + 2; j < pts.length - 1; j++) {
          expect(cross(pts[i], pts[i + 1], pts[j], pts[j + 1]), `${w.id} segments ${i} and ${j} cross`).toBe(false)
        }
      }
    }
  })
})

describe('activities', () => {
  const KNOWN: Record<ActivityKind, Record<string, 'boolean' | 'number' | 'string' | 'other'>> = {
    facts: { showTrick: 'boolean', helper: 'string' },
    race: {},
    missing: {},
    wheel: { center: 'number', numbers: 'other' },
    necklace: { beads: 'number' },
    chain: {},
    family: {},
    maze: { table: 'number', rows: 'number', cols: 'number' },
    pixel: { picture: 'other', legend: 'other' },
    memory: {},
    bubbles: { choices: 'number' },
    groups: { showSum: 'boolean' },
    array: { mirror: 'boolean' },
    column: { guided: 'boolean', proof: 'boolean', place: 'boolean', split: 'boolean' },
    division: { guided: 'boolean', proof: 'boolean' },
    share: { emoji: 'string', container: 'string' },
    word: { chooseOp: 'boolean' },
    board: { squares: 'number', opponent: 'string', specials: 'other' },
    exercises: { guided: 'boolean' },
  }

  it('every activity has a title, instructions, a selector and a sensible count', () => {
    for (const { where, config } of allActivities()) {
      expect(config.title.trim().length, where).toBeGreaterThan(2)
      expect(config.instructions.trim().length, where).toBeGreaterThan(10)
      expect(config.count, where).toBeGreaterThanOrEqual(1)
      expect(config.count, where).toBeLessThanOrEqual(24)
    }
  })

  it('params only use documented keys with the right types', () => {
    for (const { where, config } of allActivities()) {
      const schema = KNOWN[config.kind]
      for (const [k, v] of Object.entries(config.params ?? {})) {
        expect(schema[k], `${where}: undocumented param ${k}`).toBeDefined()
        if (schema[k] !== 'other') expect(typeof v, `${where}.${k}`).toBe(schema[k])
      }
    }
  })

  it('kind-specific params are consistent with the selector', () => {
    for (const { where, config } of allActivities()) {
      const p = (config.params ?? {}) as Record<string, unknown>
      const sel = config.selector
      switch (config.kind) {
        case 'wheel': {
          expect(sel.tables, where).toContain(p.center)
          const nums = p.numbers as number[]
          expect(nums.length, where).toBe(config.count)
          expect(new Set(nums).size, where).toBe(nums.length)
          for (const n of nums) expect(n >= (sel.factorRange?.[0] ?? 1) && n <= (sel.factorRange?.[1] ?? 10), where).toBe(true)
          break
        }
        case 'maze':
          expect(sel.tables, where).toContain(p.table)
          expect(p.rows as number).toBeGreaterThanOrEqual(4)
          expect(p.cols as number).toBeGreaterThanOrEqual(4)
          break
        case 'pixel': {
          const pic = p.picture as string[]
          const legend = p.legend as Record<string, { product?: number; color: string; name: string }>
          expect(pic.length, where).toBeGreaterThanOrEqual(4)
          for (const row of pic) expect(row.length, where).toBe(pic[0].length)
          const chars = new Set(pic.join(''))
          for (const ch of chars) expect(legend[ch], `${where} legend for '${ch}'`).toBeDefined()
          const [lo, hi] = sel.factorRange ?? [1, 10]
          const products = new Set((sel.tables ?? []).flatMap((t) => Array.from({ length: hi - lo + 1 }, (_, i) => t * (lo + i))))
          for (const e of Object.values(legend)) {
            expect(e.color, where).toMatch(/^var\(--[a-z0-9-]+\)$/)
            expect(e.name.length).toBeGreaterThan(2)
            if (e.product !== undefined) expect(products.has(e.product), `${where} product ${e.product}`).toBe(true)
          }
          expect(Object.values(legend).filter((e) => e.product === undefined), `${where} needs one "other" colour`).toHaveLength(1)
          break
        }
        case 'bubbles':
          expect(p.choices as number).toBeGreaterThanOrEqual(2)
          expect(p.choices as number).toBeLessThanOrEqual(6)
          break
        case 'board': {
          const squares = p.squares as number
          expect(CHARACTERS).toContain(p.opponent)
          const specials = p.specials as { at: number; emoji: string; text: string; move: number }[]
          const at = specials.map((s) => s.at)
          expect(new Set(at).size, where).toBe(at.length)
          for (const s of specials) {
            expect(s.at > 1 && s.at < squares, where).toBe(true)
            expect(s.at + s.move > 1 && s.at + s.move < squares, where).toBe(true)
            expect(specials.some((o) => o.at === s.at + s.move), `${where}: special chains into another special`).toBe(false)
            expect(s.emoji.length).toBeGreaterThan(0)
          }
          break
        }
        case 'memory':
          expect(config.count as number).toBeGreaterThanOrEqual(3)
          expect(config.count as number).toBeLessThanOrEqual(10)
          break
      }
    }
  })

  it('every selector is well-formed', () => {
    for (const { where, selector } of allSelectors()) checkSelector(where, selector)
  })
})

describe('lessons', () => {
  it('use the visuals with exactly the documented params, Lumi narration and some try steps', () => {
    for (const l of lessons) {
      expect(l.steps.length, l.id).toBeGreaterThanOrEqual(4)
      // «Cuatro caminos para restar» shows four methods (two steps and a try each) and the choice: 14 steps.
      expect(l.steps.length, l.id).toBeLessThanOrEqual(l.id === 'w4-four-ways' ? 14 : 12)
      const tries = l.steps.filter((s) => s.interaction === 'try')
      expect(tries.length, `${l.id} has try steps`).toBeGreaterThanOrEqual(1)
      expect(l.steps[l.steps.length - 1].interaction === 'try' || l.steps.length > 1).toBe(true)
      for (const [i, s] of l.steps.entries()) {
        const where = `${l.id}#${i}`
        expect(Object.keys(VISUAL_PARAMS), where).toContain(s.visual)
        expect(Object.keys(s.params ?? {}).sort(), where).toEqual([...VISUAL_PARAMS[s.visual]].sort())
        for (const v of Object.values(s.params ?? {})) expect(['number', 'string'], where).toContain(typeof v)
        if (s.speaker) expect(CHARACTERS, where).toContain(s.speaker)
        if (s.interaction === 'try') expect(s.trySelector, where).toBeDefined()
        else expect(s.trySelector, where).toBeUndefined()
      }
    }
  })

  it('numbers shown in the visuals are pedagogically right', () => {
    for (const l of lessons) {
      for (const [i, s] of l.steps.entries()) {
        const p = (s.params ?? {}) as Record<string, number>
        const where = `${l.id}#${i}`
        if (s.visual === 'borrow' || s.visual === 'zero-borrow' || s.visual === 'sub-check') expect(p.a > p.b, where).toBe(true)
        if (s.visual === 'zero-borrow') expect(String(p.a)).toContain('0')
        if (s.visual === 'carry') expect((p.a % 10) + (p.b % 10) >= 10, `${where} must carry`).toBe(true)
        if (s.visual === 'galera' || s.visual === 'division-check') expect(p.dividend > p.divisor && p.divisor >= 2, where).toBe(true)
        if (s.visual === 'share') expect(p.total % p.groups, where).toBe(0)
        if (s.visual === 'split-multiply') expect(p.n >= 10 && p.n < 100 && p.m >= 2 && p.m <= 9, where).toBe(true)
      }
    }
  })
})

describe('guardians', () => {
  it('have 6–8 items, pass with all but one, the workbook spells and letters VALIENTE', () => {
    const letters: string[] = []
    for (const w of season1.worlds) {
      const node = w.nodes[w.nodes.length - 1]
      const g = getGuardian(node.ref!)!
      expect(g.character).toBe(w.guardian)
      const total = g.rounds.reduce((s, r) => s + r.count, 0)
      expect(total, g.id).toBeGreaterThanOrEqual(6)
      expect(total, g.id).toBeLessThanOrEqual(8)
      expect(g.passMin, g.id).toBe(total - 1)
      expect(g.rescueStory).toBe(`${w.id}-rescue`)
      expect(g.retryText).toContain('{child}')
      expect(g.spell.fixed, g.id).toBeDefined()
      letters.push(g.letter)
      const f = g.spell.fixed!
      const result = f.kind === 'fact-mul' || f.kind === 'column-mul' ? f.a * f.b
        : f.kind === 'column-add' ? f.a + f.b
        : f.kind === 'column-sub' ? f.a - f.b
        : f.a / f.b
      expect(result, g.id).toBe(SPELL_CODES[g.id].result)
      expect(g.letter).toBe(SPELL_CODES[g.id].letter)
      // the spell text shows (or tells) the numbers of the operation
      expect(g.spell.text, g.id).toContain(String(f.a))
      expect(g.spell.text, g.id).toContain(String(f.b))
    }
    expect(letters.join('')).toBe(season1.secretWord)
    const spells = guardians.map((g) => g.spell.fixed!)
    expect(spells.map((s) => `${s.kind}:${s.a}:${s.b}`)).toEqual([
      'fact-mul:7:5', 'column-add:2486:1357', 'fact-mul:7:6', 'column-sub:4521:1367',
      'fact-mul:8:7', 'fact-mul:7:7', 'column-mul:47:6', 'division:63:3',
    ])
  })
})

describe('stories', () => {
  it('scenes have a valid cast (unique positions), speakers on stage and known poses', () => {
    for (const s of stories) {
      expect(s.scenes.length, s.id).toBeGreaterThanOrEqual(1)
      for (const [i, sc] of s.scenes.entries()) {
        const where = `${s.id}/s${i}`
        expect(sc.lines.length, where).toBeGreaterThanOrEqual(1)
        const pos = sc.cast.map((c) => c.position)
        expect(new Set(pos).size, where).toBe(pos.length)
        const ids = sc.cast.map((c) => c.id)
        expect(new Set(ids).size, where).toBe(ids.length)
        for (const c of sc.cast) expect(CHARACTERS, where).toContain(c.id)
        for (const c of sc.cast) if (c.predicament) expect(c.id, where).toBe('companion')
        for (const l of sc.lines) if (l.speaker !== 'narrator') expect(ids, `${where}: ${l.speaker} speaks off stage`).toContain(l.speaker)
      }
    }
  })

  it('each world: arrival puts {pet} in its predicament, mid keeps it, rescue frees it and thanks the child', () => {
    for (const w of season1.worlds) {
      const arrival = getStory(`${w.id}-arrival`)!
      const last = arrival.scenes[arrival.scenes.length - 1]
      expect(last.cast.find((c) => c.id === 'companion')?.predicament, w.id).toBe(w.predicament)
      expect(arrival.scenes.some((sc) => sc.cast.some((c) => c.id === w.guardian)), `${w.id} guardian appears`).toBe(true)
      const mid = getStory(`${w.id}-mid`)
      if (mid) {
        for (const sc of mid.scenes) {
          const comp = sc.cast.find((c) => c.id === 'companion')
          if (comp) expect(comp.predicament, `${w.id}-mid`).toBe(w.predicament)
        }
        expect(mid.scenes.some((sc) => sc.cast.some((c) => c.id === 'borron')), `${w.id}-mid has Borrón`).toBe(true)
      }
      const rescue = getStory(`${w.id}-rescue`)!
      expect(rescue.scenes[0].cast.find((c) => c.id === 'companion')?.predicament, w.id).toBe(w.predicament)
      const end = rescue.scenes[rescue.scenes.length - 1]
      expect(end.cast.find((c) => c.id === 'companion')?.predicament, w.id).toBeUndefined()
      const lines = rescue.scenes.flatMap((sc) => sc.lines)
      expect(lines.some((l) => l.speaker === 'companion' && /gracias, \{child\}/i.test(l.text)), `${w.id} thanks {child}`).toBe(true)
      const letter = getGuardian(`${w.id}-guardian`)!.letter
      expect(lines.some((l) => l.text.includes(`la ${letter}.`) || l.text.includes(`la ${letter}!`)), `${w.id} reveals ${letter}`).toBe(true)
      expect(lines.some((l) => l.sfx === 'crystal'), `${w.id} crystal sfx`).toBe(true)
      expect(lines.some((l) => l.text.includes(w.crystalName)), `${w.id} names the crystal`).toBe(true)
    }
  })

  it('the prologue and the finale tell the whole frame story', () => {
    const p = getStory(PROLOGUE_STORY_ID)!
    expect(p.scenes[0].background).toBe('home')
    const pText = p.scenes.flatMap((s) => s.lines.map((l) => l.text)).join(' ')
    for (const k of ['libro', 'Lumi', 'Numeria', 'Niebla del Olvido', 'Borrón', '¡Vamos!', 'cristales']) expect(pText).toContain(k)
    const f = getStory(FINALE_STORY_ID)!
    const fLines = f.scenes.flatMap((s) => s.lines)
    const fText = fLines.map((l) => l.text).join(' ')
    for (const k of ['ocho cristales', 'VALIENTE', 'Gran Cofre', 'diploma', 'Islas de las Fracciones', 'truco']) expect(fText).toContain(k)
    expect(fLines.some((l) => l.speaker === 'borron' && l.pose === 'sad')).toBe(true)
    expect(fLines.some((l) => l.sfx === 'chest-open')).toBe(true)
  })

  it('sound effects are real audio SfxNames', () => {
    const SFX = ['tap', 'select', 'write', 'erase', 'correct', 'wrong', 'streak', 'hint', 'star', 'crystal', 'levelup',
      'unlock', 'rescue', 'whoosh', 'pop', 'sparkle', 'page', 'dice', 'step', 'chest-open', 'fanfare', 'tick', 'timeup', 'coin']
    for (const s of stories) for (const sc of s.scenes) for (const l of sc.lines) if (l.sfx) expect(SFX, s.id).toContain(l.sfx)
  })
})

describe('copy for early readers', () => {
  it('story lines and lesson steps are short (≤ 20 words)', () => {
    for (const c of allCopy()) {
      if (c.type === 'line' || c.type === 'step') expect(wordCount(c.text), `${c.where}: "${c.text}"`).toBeLessThanOrEqual(20)
    }
  })

  it('uses Spanish punctuation: balanced ¡! ¿? «» and dialogue dashes', () => {
    for (const c of allCopy()) {
      const t = c.text
      for (const [open, close] of [['¡', '!'], ['¿', '?'], ['«', '»']]) {
        let depth = 0
        for (const ch of t) {
          if (ch === open) depth++
          else if (ch === close) depth--
          expect(depth, `${c.where}: "${t}" (${open}${close})`).toBeGreaterThanOrEqual(0)
        }
        expect(depth, `${c.where}: "${t}" (${open}${close})`).toBe(0)
      }
      if (t.startsWith('—')) expect((t.match(/—/g) ?? []).length, `${c.where}: dialogue needs an inciso`).toBeGreaterThanOrEqual(2)
      expect(t, c.where).not.toMatch(/ {2}/)
      expect(t, c.where).not.toMatch(/ [,.;:!?…»]/)
      expect(t, c.where).not.toMatch(/\.\.\./) // use the single ellipsis character
      expect(t.trim(), c.where).toBe(t)
    }
  })

  it('never builds "a el"/"de el" around the species noun, nor agrees adjectives with it', () => {
    for (const c of allCopy()) {
      expect(c.text, c.where).not.toMatch(/\b(a|de) \{el_pet_species\}/i)
      if (/pet_species\}/i.test(c.text)) expect(c.text, `${c.where}: use {pet} for gender agreement`).not.toMatch(/\{pg:/)
    }
  })
})
