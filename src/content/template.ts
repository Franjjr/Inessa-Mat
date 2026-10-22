/* Template rendering for child-facing Spanish copy.

   Syntax (contract in src/types/content.ts, plus a few documented extensions):
     {child}             child's nickname                         → "Inessa"
     {pet}               companion's name                         → "Bigotes"
     {pet_species}       species noun inflected by pet gender     → "gatita"
     {el_pet_species}    with article                             → "la gatita"
     {al_pet_species}    with "a" + article (a + el → al)         → "a la gatita" / "al gatito"     (extension)
     {del_pet_species}   with "de" + article (de + el → del)      → "de la gatita" / "del gatito"   (extension)
     {Pet_species} {El_pet_species} {Al_pet_species} {Del_pet_species}
                         same, first letter upper-cased (sentence start)                          (extension)
     {cg:F|M|N}          pick by CHILD gender (f|m|n)
     {pg:F|M|N}          pick by COMPANION gender
   Gender selectors may contain the simple placeholders above ("{cg:Querida {child}|Querido {child}|Hola, {child}}").
   With two options the neutral form falls back to the second (masculine-generic) one; with one option it is used
   for every gender. Unknown placeholders are left untouched so mistakes are visible during development.
   User-provided values (names) are inserted verbatim and never re-parsed. */
import type { ChildProfile, CompanionSpecies, GrammaticalGender, TemplateString } from '@/types'
import { speciesNoun } from './companions'

export interface TemplateContext {
  childName: string
  childGender: GrammaticalGender
  petName: string
  petGender: GrammaticalGender
  petSpecies: CompanionSpecies
}

/** Affectionate, gender-free fallback when a nickname is missing. */
export const FALLBACK_CHILD_NAME = 'Peque'

const GENDER_INDEX: Record<GrammaticalGender, 0 | 1 | 2> = { f: 0, m: 1, n: 2 }

function genderIndex(g: GrammaticalGender | undefined): 0 | 1 | 2 {
  return g ? GENDER_INDEX[g] ?? 2 : 2
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toLocaleUpperCase('es-ES') + s.slice(1) : s
}

export function templateContext(child: ChildProfile): TemplateContext {
  const species: CompanionSpecies = child.companion?.species ?? 'cat'
  const petGender: GrammaticalGender = child.companion?.gender ?? 'n'
  const childName = (child.nickname ?? '').trim() || FALLBACK_CHILD_NAME
  const petName = (child.companion?.name ?? '').trim() || capitalize(speciesNoun(species, petGender).noun)
  return {
    childName,
    childGender: child.gender ?? 'n',
    petName,
    petGender,
    petSpecies: species,
  }
}

/** Resolve one simple placeholder name (without braces) or return null when it is not a known placeholder. */
function simpleValue(name: string, ctx: TemplateContext): string | null {
  switch (name) {
    case 'child': return ctx.childName
    case 'pet': return ctx.petName
  }
  const lower = name.charAt(0).toLowerCase() + name.slice(1)
  const upper = name !== lower
  const forms = speciesNoun(ctx.petSpecies, ctx.petGender)
  let value: string | null
  switch (lower) {
    case 'pet_species': value = forms.noun; break
    case 'el_pet_species': value = forms.articleNoun; break
    case 'al_pet_species': value = forms.articleNoun.startsWith('el ') ? `al ${forms.articleNoun.slice(3)}` : `a ${forms.articleNoun}`; break
    case 'del_pet_species': value = forms.articleNoun.startsWith('el ') ? `del ${forms.articleNoun.slice(3)}` : `de ${forms.articleNoun}`; break
    default: value = null
  }
  return value !== null && upper ? capitalize(value) : value
}

/** Index of the brace closing the one opened at `open`, honouring nesting; -1 when unbalanced. */
function matchingBrace(text: string, open: number): number {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    const ch = text[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** Split gender options at top-level '|' (pipes inside nested braces are kept). */
function splitOptions(body: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === '{') depth++
    else if (ch === '}') depth--
    else if (ch === '|' && depth === 0) {
      out.push(body.slice(start, i))
      start = i + 1
    }
  }
  out.push(body.slice(start))
  return out
}

function pickOption(options: string[], idx: 0 | 1 | 2): string {
  if (options.length === 1) return options[0]
  if (options.length === 2) return options[idx === 2 ? 1 : idx]
  return options[idx] ?? options[options.length - 1]
}

/** Render a TemplateString (see the syntax at the top of this file). Single pass, never re-parses inserted values. */
export function renderTemplate(text: TemplateString, ctx: TemplateContext): string {
  if (!text || text.indexOf('{') < 0) return text ?? ''
  let out = ''
  let i = 0
  while (i < text.length) {
    const open = text.indexOf('{', i)
    if (open < 0) {
      out += text.slice(i)
      break
    }
    out += text.slice(i, open)
    const close = matchingBrace(text, open)
    if (close < 0) {
      out += text.slice(open)
      break
    }
    const inner = text.slice(open + 1, close)
    const sel = /^(cg|pg):/.exec(inner)
    if (sel) {
      const idx = sel[1] === 'cg' ? genderIndex(ctx.childGender) : genderIndex(ctx.petGender)
      out += renderTemplate(pickOption(splitOptions(inner.slice(3)), idx), ctx)
    } else {
      const v = /^[A-Za-z_]+$/.test(inner) ? simpleValue(inner, ctx) : null
      out += v ?? text.slice(open, close + 1)
    }
    i = close + 1
  }
  return out
}

/** Placeholder names understood by renderTemplate (for lint-style tests and other modules). */
export const TEMPLATE_PLACEHOLDERS = [
  'child', 'pet', 'pet_species', 'el_pet_species', 'al_pet_species', 'del_pet_species',
  'Pet_species', 'El_pet_species', 'Al_pet_species', 'Del_pet_species',
] as const
