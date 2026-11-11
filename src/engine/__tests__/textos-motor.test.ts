/* Textos del motor (P4-22): the hints, statements and messages of problems, fractions, decimals, money, measure, time,
   geometry, data and numeration read as a teacher would write them. No «= ?.», no capital after «Revisa la cuenta:», no
   «son 1 hora», no «tiene los/las», no «[object», no template brace left, no «undefined» or «NaN». */
import { describe, expect, it } from 'vitest'
import { check, createRng, generate, geoSkill, GEO_OPS, hintsFor, statementOf } from '@/engine'
import type { Answer, Exercise, SkillKey } from '@/types'

const SKILLS: SkillKey[] = [
  'bar:add', 'bar:sub', 'bar:mul', 'bar:div', 'bar:two', 'bar:three', 'word:sense',
  'hunt:add', 'hunt:sub', 'hunt:mul', 'check:add', 'check:sub', 'check:div',
  ...[2, 3, 4, 5, 6, 8, 10, 12].flatMap((d) => [`frac:shade:${d}`, `frac:read:${d}`, `frac:name:${d}`, `frac:of:${d}`]),
  'frac:equal', 'frac:compare', 'frac:add', 'frac:sub',
  'dec:shade:1', 'dec:shade:2', 'dec:read:1', 'dec:read:2', 'dec:compare', 'dec:money', 'dec:add:2', 'dec:sub:2',
  'money:recognise', 'money:pay', 'money:change', 'money:add', 'money:compare', 'money:convert', 'money:budget',
  'measure:unit:length', 'measure:unit:mass', 'measure:unit:capacity', 'measure:convert:length', 'measure:convert:mass',
  'measure:convert:capacity', 'measure:convert:length:all', 'measure:ruler', 'measure:add', 'measure:estimate',
  'clock:read:5', 'clock:set:5', 'clock:convert:day', 'time:end', 'time:elapsed', 'cal:units', 'cal:weekday', 'cal:month', 'time:seconds',
  ...GEO_OPS.map(geoSkill),
  'chart:pict', 'chart:pict:x', 'chart:bars', 'chart:table', 'chart:freq', 'chart:mode', 'prob:chance', 'prob:likely',
  'num:place:blocks', 'num:place:expanded', 'num:place:words', 'num:compare', 'num:order', 'num:round:10', 'num:round:100',
  'num:round:1000:99999', 'num:line:10', 'num:line:100', 'num:line:1000',
  ...['dobles', 'triples', 'mitades', 'completar10', 'completar100', 'decenas', 'centenas', 'compensar', 'por10', 'romanos',
    'combinadas', 'jerarquia', 'parentesis', 'asociativa', 'distributiva', 'estimar'].map((f) => `mental:${f}`),
  'eq:flex', 'eq:same', 'num:ordinal:10', 'num:ordinal:30', 'pos:relative', 'pos:next', 'pos:route',
]

/** A few answers that make the checks speak: empty, a number, another choice. */
const PROBES: Answer[] = [
  { type: 'number', value: 1 }, { type: 'number', value: 999 }, { type: 'numbers', values: [1, 2, 3] }, { type: 'choice', index: 0 },
  { type: 'choice', index: 1 }, { type: 'time', hour: 3, minute: 10 }, { type: 'fraction', numerator: 1, denominator: 3 },
  { type: 'option', value: 'x' }, { type: 'sign', sign: '<' }, { type: 'hunt', ok: false, column: 0, value: 7 },
  { type: 'verdict', ok: true, value: 5 }, { type: 'bar', placed: [], ops: ['add', 'add', 'add'], results: [5, 6, 7] },
]

const RULES: [string, RegExp][] = [
  ['«= ?.»', /\?\./],
  ['mayúscula tras «Revisa la cuenta:»', /Revisa la cuenta: [A-ZÁÉÍÓÚ]/],
  ['«son 1 …» (singular con «son»)', /\bson 1 (?!€)[a-záéíóú]/],
  ['«tiene los/las …»', /tiene (los|las) /],
  ['«[object»', /\[object/],
  ['llave de plantilla', /\{(?!child\}|pet\}|name\})/],
  ['«undefined» o «NaN»', /undefined|NaN/],
  ['dos espacios', / {2}/],
  ['«cuántos saltos»', /cuántos saltos/],
  ['«Cuanto más partes»', /Cuanto más partes/],
  ['«un medio de»', /un medio de/i],
  ['«Mira otra vez la figura con calma.»', /Mira otra vez la figura con calma/],
  ['«presta una decena»', /presta una decena/],
]

function textsOf(ex: Exercise): string[] {
  const out = [statementOf(ex), ...hintsFor(ex).map((h) => h.text)]
  for (const a of PROBES) {
    try {
      const fb = check(ex, a).feedback
      if (fb) out.push(fb)
    } catch {
      // A probe of another shape: the dispatcher only answers the shapes it knows.
    }
  }
  return out
}

describe('textos del motor (P4-22)', () => {
  it('ninguna pista, enunciado o mensaje rompe las reglas de escritura', () => {
    const bad: string[] = []
    let total = 0
    for (const skill of SKILLS) {
      for (let seed = 1; seed <= 6; seed++) {
        for (const ex of generate({ skills: [skill] }, 4, { rng: createRng(seed * 101 + 7) })) {
          for (const t of textsOf(ex)) {
            total++
            for (const [name, re] of RULES) if (re.test(t)) bad.push(`${name} · ${ex.id}: ${t}`)
          }
        }
      }
    }
    expect(total).toBeGreaterThan(5000)
    expect([...new Set(bad)].slice(0, 12)).toEqual([])
  })

  it('las reescrituras pedidas están en su sitio', () => {
    const one = (skill: SkillKey) => generate({ skills: [skill] }, 1, { rng: createRng(3) })[0]
    const units = generate({ skills: ['cal:units'] }, 20, { rng: createRng(5) }).find((e) => e.kind === 'calendar' && e.units?.amount === 1)
    if (units) expect(hintsFor(units)[1].text).toMatch(/^El problema habla de 1 /)
    const cmp = one('frac:compare')
    if (cmp.kind === 'shape-choice' && hintsFor(cmp)[0].text.startsWith('Cuant')) expect(hintsFor(cmp)[0].text).toMatch(/^Cuantas más partes/)
    const shade2 = generate({ skills: ['frac:shade:2'] }, 1, { rng: createRng(1) })[0]
    expect(hintsFor(shade2)[2].text).toContain('Cada parte es la mitad de la figura')
  })
})
