import { describe, expect, it } from 'vitest'
import type { ErrorType, ReactionKind } from '@/types'
import { COMPANION_SPECIES } from '@/types'
import {
  ACCESSORY_IDS, accessories, companions, describeStickerRule, ERROR_PHRASES, getCompanionDef, getNode, getWorld,
  parseStickerRule, PHRASES, pickPhrase, pickPhraseFor, renderTemplate, season1, stickers,
} from '@/content'

const KINDS: ReactionKind[] = ['correct', 'wrong', 'streak', 'hint', 'thinking', 'celebrate', 'encourage']
const ERRORS: ErrorType[] = ['fact', 'carry-forgot', 'carry-wrong', 'borrow-forgot', 'smaller-from-larger', 'zero-borrow',
  'misaligned', 'remainder-too-big', 'quotient-off', 'operation', 'incomplete', 'recognition']

const seq = (...values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]
}

describe('companions', () => {
  it('cover the 8 species with noun forms, personality, 8 names and the art colorways', () => {
    expect(companions.map((c) => c.species).sort()).toEqual([...COMPANION_SPECIES].sort())
    for (const c of companions) {
      expect(getCompanionDef(c.species)).toBe(c)
      expect(c.noun).toHaveLength(3)
      expect(c.articleNoun).toHaveLength(3)
      c.articleNoun.forEach((a, i) => {
        expect(a.endsWith(c.noun[i]), c.species).toBe(true)
        expect(a, c.species).toMatch(/^(el|la) /)
      })
      expect(c.articleNoun[2], `${c.species}: neutral uses the generic form`).toBe(c.articleNoun[1])
      expect(c.personality.length).toBeGreaterThan(10)
      expect(c.suggestedNames).toHaveLength(8)
      expect(new Set(c.suggestedNames).size).toBe(8)
      expect(c.colorways).toEqual(['default', 'sunny', 'berry', 'mint'])
    }
  })

  it('avoid unkind forms and do not reuse the names of the cast', () => {
    const all = companions.flatMap((c) => [...c.noun, ...c.articleNoun]).join(' ')
    expect(all).not.toMatch(/zorra|zorrita/)
    expect(getCompanionDef('fox')!.noun).toEqual(['zorrito', 'zorrito', 'zorrito'])
    const cast = /^(Lumi|Borrón|Nieve|Chispa|Iris|Aurora|Octavio|Inessa)$/
    for (const c of companions) for (const n of c.suggestedNames) expect(n, c.species).not.toMatch(cast)
  })
})

describe('accessories', () => {
  it('are exactly the 18 ids the art module draws, with names, slots and prices', () => {
    expect(accessories.map((a) => a.id).sort()).toEqual([...ACCESSORY_IDS].sort())
    expect(accessories).toHaveLength(18)
    expect(ACCESSORY_IDS).toEqual(['crown', 'wizard-hat', 'flower-crown', 'cap', 'bow', 'beanie', 'star-glasses', 'sunglasses',
      'scarf', 'bowtie', 'medal', 'cape', 'fairy-wings', 'backpack', 'wand', 'balloon', 'lollipop', 'paintbrush'])
    const slots = { crown: 'head', 'wizard-hat': 'head', 'flower-crown': 'head', cap: 'head', bow: 'head', beanie: 'head',
      'star-glasses': 'face', sunglasses: 'face', scarf: 'neck', bowtie: 'neck', medal: 'neck', cape: 'back',
      'fairy-wings': 'back', backpack: 'back', wand: 'held', balloon: 'held', lollipop: 'held', paintbrush: 'held' }
    for (const a of accessories) {
      expect(a.slot, a.id).toBe(slots[a.id as keyof typeof slots])
      expect(a.name.length).toBeGreaterThan(2)
      expect(Number.isInteger(a.price) && a.price > 0).toBe(true)
      if (a.requiresWorld) expect(getWorld(a.requiresWorld), a.id).toBeDefined()
    }
    expect(accessories.filter((a) => a.requiresWorld).length).toBeGreaterThanOrEqual(6)
    expect(accessories.filter((a) => !a.requiresWorld && a.price <= 10).length, 'cheap first buys').toBeGreaterThanOrEqual(3)
  })
})

describe('stickers', () => {
  it('about 24 world stickers (3 per world) plus a few specials, with valid rules', () => {
    const ids = stickers.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const w of season1.worlds) expect(stickers.filter((s) => s.worldId === w.id), w.id).toHaveLength(3)
    expect(stickers.length).toBeGreaterThanOrEqual(24)
    expect(stickers.length).toBeLessThanOrEqual(30)
    for (const s of stickers) {
      expect(s.emoji, s.id).toBeTruthy()
      const r = parseStickerRule(s.earnedBy)
      expect(r, `${s.id}: ${s.earnedBy}`).not.toBeNull()
      if (r!.type === 'node' || r!.type === 'stars') {
        expect(getNode(r!.worldId, r!.nodeId), s.earnedBy).toBeDefined()
        expect(r!.worldId).toBe(s.worldId)
      }
      if (r!.type === 'world') expect(r!.worldId).toBe(s.worldId)
    }
  })

  it('parse and describe rules', () => {
    expect(parseStickerRule('node:w1:groups')).toEqual({ type: 'node', worldId: 'w1', nodeId: 'groups' })
    expect(parseStickerRule('stars:w1:array:3')).toEqual({ type: 'stars', worldId: 'w1', nodeId: 'array', stars: 3 })
    expect(parseStickerRule('streak:3')).toEqual({ type: 'days', days: 3 })
    for (const bad of ['', 'node:w1', 'stars:w1:x:9', 'days:0', 'magic:1', 'world:']) expect(parseStickerRule(bad), bad).toBeNull()
    const title = (w: string, n: string) => getNode(w, n)?.title
    const name = (w: string) => getWorld(w)?.name
    expect(describeStickerRule('world:w1', title, name)).toBe('Gana el cristal del Bosque de los Grupos.')
    expect(describeStickerRule('world:w3', title, name)).toBe('Gana el cristal de la Cueva del Seis.')
    expect(describeStickerRule('stars:w1:array:3', title, name)).toBe('Consigue 3 estrellas en «Filas de flores».')
    expect(describeStickerRule('days:3')).toBe('Juega 3 días distintos.')
  })
})

describe('phrases', () => {
  it('have at least 10 varied phrases per reaction kind', () => {
    for (const k of KINDS) {
      expect(PHRASES[k].length, k).toBeGreaterThanOrEqual(10)
      expect(new Set(PHRASES[k]).size, k).toBe(PHRASES[k].length)
      expect(PHRASES[k].some((p) => p.includes('{child}')), `${k} uses {child}`).toBe(true)
    }
    expect(Object.values(PHRASES).flat().some((p) => p.includes('{pet}'))).toBe(true)
  })

  it('have specific clues for every diagnosed error type', () => {
    for (const e of ERRORS) expect(ERROR_PHRASES[e]?.length ?? 0, e).toBeGreaterThanOrEqual(2)
  })

  it('praise effort and strategy, never "being clever"', () => {
    const all = [...Object.values(PHRASES).flat(), ...Object.values(ERROR_PHRASES).flat()].join(' ')
    expect(all).not.toMatch(/\b(lista|listo|inteligente|tonta|tonto|mal hecho|fatal)\b/i)
    expect(PHRASES.correct.some((p) => /truco|pensado|cuidado|calma/.test(p))).toBe(true)
  })

  it('pickPhrase is deterministic, covers the whole bank and uses error clues', () => {
    expect(pickPhrase('correct', seq(0))).toBe(PHRASES.correct[0])
    expect(pickPhrase('correct', seq(0.9999))).toBe(PHRASES.correct[PHRASES.correct.length - 1])
    expect(pickPhrase('correct', seq(1))).toBe(PHRASES.correct[PHRASES.correct.length - 1])
    expect(pickPhrase('wrong', seq(Number.NaN))).toBe(PHRASES.wrong[0])
    expect(pickPhrase('wrong', seq(0), 'carry-forgot')).toBe(ERROR_PHRASES['carry-forgot']![0])
    expect(pickPhrase('hint', seq(0.6), 'zero-borrow')).toBe(ERROR_PHRASES['zero-borrow']![1])
    expect(pickPhrase('correct', seq(0), 'carry-forgot')).toBe(PHRASES.correct[0])
    expect(pickPhrase('wrong', seq(0), 'other')).toBe(PHRASES.wrong[0])
    const seen = new Set<string>()
    for (let i = 0; i < PHRASES.streak.length; i++) seen.add(pickPhrase('streak', seq((i + 0.5) / PHRASES.streak.length)))
    expect(seen.size).toBe(PHRASES.streak.length)
  })

  it('the companion never talks about itself in the third person', () => {
    for (const k of KINDS) {
      for (let i = 0; i < 40; i++) expect(pickPhraseFor('companion', k, seq(i / 40))).not.toContain('{pet}')
    }
    expect(pickPhraseFor('lumi', 'correct', seq(0))).toBe(PHRASES.correct[0])
  })

  it('render with a real context', () => {
    const ctx = { childName: 'Inessa', childGender: 'f' as const, petName: 'Bigotes', petGender: 'm' as const, petSpecies: 'cat' as const }
    expect(renderTemplate(pickPhrase('correct', seq(0)), ctx)).toBe('¡Bien hecho, Inessa!')
  })
})
