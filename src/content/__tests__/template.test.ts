import { describe, expect, it } from 'vitest'
import type { ChildProfile, CompanionSpecies, GrammaticalGender } from '@/types'
import { COMPANION_SPECIES, DEFAULT_CHILD_SETTINGS } from '@/types'
import { FALLBACK_CHILD_NAME, renderTemplate, templateContext, type TemplateContext } from '@/content'
import { allCopy } from './helpers'

const GENDERS: GrammaticalGender[] = ['f', 'm', 'n']

const ctx = (over: Partial<TemplateContext> = {}): TemplateContext => ({
  childName: 'Inessa', childGender: 'f', petName: 'Bigotes', petGender: 'm', petSpecies: 'cat', ...over,
})

function child(over: Partial<ChildProfile> = {}, companion: Partial<ChildProfile['companion']> = {}): ChildProfile {
  return {
    id: 'c1', orgId: null, nickname: 'Inessa', gender: 'f', grade: 2,
    companion: { species: 'fox', name: 'Canelo', gender: 'm', colorway: 'default', equipped: [], ...companion },
    settings: DEFAULT_CHILD_SETTINGS, createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-01T10:00:00.000Z', ...over,
  }
}

describe('renderTemplate', () => {
  it('fills the simple placeholders', () => {
    expect(renderTemplate('¡Hola, {child}! Soy {pet}.', ctx())).toBe('¡Hola, Inessa! Soy Bigotes.')
    expect(renderTemplate('{pet_species} / {el_pet_species}', ctx({ petGender: 'f' }))).toBe('gatita / la gatita')
    expect(renderTemplate('{pet_species} / {el_pet_species}', ctx({ petGender: 'm' }))).toBe('gatito / el gatito')
    expect(renderTemplate('{pet_species} / {el_pet_species}', ctx({ petGender: 'n' }))).toBe('gatito / el gatito')
  })

  it('contracts a/de + el and capitalises on request', () => {
    expect(renderTemplate('Mira {al_pet_species}.', ctx())).toBe('Mira al gatito.')
    expect(renderTemplate('Mira {al_pet_species}.', ctx({ petGender: 'f' }))).toBe('Mira a la gatita.')
    expect(renderTemplate('La cola {del_pet_species}.', ctx())).toBe('La cola del gatito.')
    expect(renderTemplate('La cola {del_pet_species}.', ctx({ petGender: 'f' }))).toBe('La cola de la gatita.')
    expect(renderTemplate('{El_pet_species} salta.', ctx({ petGender: 'f' }))).toBe('La gatita salta.')
    expect(renderTemplate('{Pet_species}.', ctx({ petSpecies: 'panda' }))).toBe('Osito panda.')
    expect(renderTemplate('{Al_pet_species}', ctx())).toBe('Al gatito')
  })

  it('picks gendered forms by child and by companion', () => {
    const t = '{cg:Querida|Querido|Hola} {child}, tu {pg:amiga|amigo|compañero} {pet}'
    expect(renderTemplate(t, ctx({ childGender: 'f', petGender: 'f' }))).toBe('Querida Inessa, tu amiga Bigotes')
    expect(renderTemplate(t, ctx({ childGender: 'm', petGender: 'm' }))).toBe('Querido Inessa, tu amigo Bigotes')
    expect(renderTemplate(t, ctx({ childGender: 'n', petGender: 'n' }))).toBe('Hola Inessa, tu compañero Bigotes')
  })

  it('supports placeholders nested inside gender options, and 1- or 2-option selectors', () => {
    expect(renderTemplate('{cg:Querida {child}|Querido {child}|Hola, {child}}', ctx({ childGender: 'n' }))).toBe('Hola, Inessa')
    expect(renderTemplate('{cg:lista|listo}', ctx({ childGender: 'n' }))).toBe('listo')
    expect(renderTemplate('{cg:valiente}', ctx({ childGender: 'm' }))).toBe('valiente')
    expect(renderTemplate('{pg:a||c}', ctx({ petGender: 'm' }))).toBe('')
  })

  it('never re-parses user values and keeps unknown placeholders visible', () => {
    expect(renderTemplate('Hola {child}', ctx({ childName: '{pet} $& {cg:x|y|z}' }))).toBe('Hola {pet} $& {cg:x|y|z}')
    expect(renderTemplate('{pet}', ctx({ petName: '$1' }))).toBe('$1')
    expect(renderTemplate('Hola {nombre} y {a}', ctx())).toBe('Hola {nombre} y {a}')
    expect(renderTemplate('llave { suelta', ctx())).toBe('llave { suelta')
    expect(renderTemplate('', ctx())).toBe('')
    expect(renderTemplate('sin llaves', ctx())).toBe('sin llaves')
  })

  it('uses the fox noun for every gender (no unkind feminine form)', () => {
    for (const g of GENDERS) {
      expect(renderTemplate('{el_pet_species}', ctx({ petSpecies: 'fox', petGender: g }))).toBe('el zorrito')
    }
  })
})

describe('templateContext', () => {
  it('maps a child profile', () => {
    expect(templateContext(child())).toEqual({ childName: 'Inessa', childGender: 'f', petName: 'Canelo', petGender: 'm', petSpecies: 'fox' })
  })
  it('falls back gracefully on empty names', () => {
    const c = templateContext(child({ nickname: '  ' }, { name: '', species: 'bunny', gender: 'f' }))
    expect(c.childName).toBe(FALLBACK_CHILD_NAME)
    expect(c.petName).toBe('Conejita')
  })
})

describe('every content template renders cleanly', () => {
  const copy = allCopy()
  it('collects a lot of copy', () => expect(copy.length).toBeGreaterThan(400))

  for (const cg of GENDERS) {
    for (const pg of GENDERS) {
      it(`child ${cg} × pet ${pg} × 8 species`, () => {
        for (const species of COMPANION_SPECIES as CompanionSpecies[]) {
          const c = ctx({ childGender: cg, petGender: pg, petSpecies: species, childName: 'Inessa', petName: 'Luna' })
          for (const { where, text } of copy) {
            const out = renderTemplate(text, c)
            const id = `${where} [${cg}/${pg}/${species}]: "${out}"`
            expect(out, id).not.toMatch(/[{}|]/)
            expect(out, id).not.toMatch(/undefined|null|NaN/)
            expect(out, id).not.toMatch(/ {2}|^\s|\s$/)
            expect(out, id).not.toMatch(/\b(a|de) el\b/i)
            expect(out.length, id).toBeGreaterThan(0)
          }
        }
      })
    }
  }

  it('neutral child options ({cg:…|…|N}) avoid gendered praise words', () => {
    const GENDERED = /\b(lista|listo|guapa|guapo|campeona|campeón|maga|mago|niña|niño|querida|querido|sola|solo|solita|solito|experta|experto|heroína|héroe|amiga|amigo|artista)\b/i
    for (const { where, text } of copy) {
      for (const m of text.matchAll(/\{cg:([^{}]*)\}/g)) {
        const opts = m[1].split('|')
        expect(opts, `${where}: give all three forms`).toHaveLength(3)
        expect(opts[2], `${where}: "${opts[2]}"`).not.toMatch(GENDERED)
      }
    }
  })
})
