/* A class practises only what it has shown (audit p3-clases H11): every variant its tries can generate has its worked example
   before. Two checks: the size of the numbers (a 4-digit practice needs a 4-digit example) and a list of the variants that
   need a sentence of their own (the «19» of compensar, the «1 000» of completar, the ordinals above 12…). */
import { describe, expect, it } from 'vitest'
import { CLASSES } from '@/content/classes'
import type { ClassDef } from '@/content/classes'

/** Digits of the biggest number the practice of a skill can use (add:4d, sub:3d, mul:3x1, div:3x1…), or 0. */
function digitsOfSkill(skill: string): number {
  let m = skill.match(/^(?:add|sub):(\d)d(?::|$)/)
  if (m) return Number(m[1])
  m = skill.match(/^(?:mul|div):(\d)x1(?::|$)/)
  return m ? Number(m[1]) : 0
}

/** The biggest number of digits among the numbers the class shows in its drawings (a, top, dividend, n). */
function digitsShown(cls: ClassDef): number {
  let most = 0
  for (const step of cls.lesson.steps) {
    if (step.interaction === 'try') continue
    for (const key of ['a', 'top', 'dividend', 'n']) {
      const v = step.params?.[key]
      if (typeof v === 'number') most = Math.max(most, String(Math.trunc(v)).length)
    }
  }
  return most
}

/** Variants that need their own worked sentence: class id → what its example must say, and which practice needs it. */
const DECLARED: { id: string; needs: RegExp; why: string }[] = [
  { id: 'c3-ordinales', needs: /undécimo.*duodécimo/s, why: 'num:ordinal:20 (11.º y 12.º)' },
  { id: 'c3-ordinales', needs: /decimotercero.*decimonoveno/s, why: 'num:ordinal:20 (13.º a 19.º)' },
  { id: 'c3-ordinales', needs: /vigésimo primero.*trigésimo/s, why: 'num:ordinal:30' },
  { id: 'c3-compensar', needs: /Con 19 se usa el 20/, why: 'mental:compensar con 19' },
  { id: 'c3-completar', needs: /470.*500.*530/s, why: 'mental:completar1000' },
  { id: 'c3-decenas-centenas', needs: /430 \+ 300.*730/s, why: 'mental:centenas' },
  { id: 'c3-decenas-centenas', needs: /De mil en mil/, why: 'num:line:1000' },
  { id: 'c3-dobles-mitades', needs: /La mitad de 56/, why: 'mental:mitades con números de dos cifras' },
  { id: 'c3-mul-10-100', needs: /340 : 10 = 34.*3 400 : 100 = 34.*6 000 : 1 000 = 6/s, why: 'mental:por10 al dividir' },
  { id: 'c3-mul-10-100', needs: /5 × 1 000/, why: 'mental:por10 con 1 000' },
  { id: 'c3-leer-escribir', needs: /dos mil quince/, why: 'num:place:words al revés, con un cero' },
  { id: 'c3-descomponer', needs: /bloque grande vale 1 000/, why: 'num:place:blocks' },
  { id: 'c3-redondear', needs: /3 432 a las decenas/, why: 'num:round:10 hacia abajo' },
  { id: 'c3-encuentra-error', needs: /47 \+ 35.*512 − 247.*23 × 4/s, why: 'hunt:add, hunt:sub y hunt:mul' },
  { id: 'c3-comprobar', needs: /47 \+ 35 = 82.*82 − 35 = 47/s, why: 'check:add' },
  { id: 'c3-resta-ceros', needs: /6 003 − 2 178/, why: 'sub:4d:z' },
  { id: 'c3-mul-3x1', needs: /247 × 3 = 741/, why: 'mul:3x1:c1 con llevadas' },
  { id: 'c3-mul-2x2-partes', needs: /23 × 34 = 782/, why: 'mul:col:2x2 con dos filas' },
  { id: 'c3-div-resto', needs: /es más pequeño que 5/, why: 'div:2x1:rem, el resto menor que el divisor' },
  { id: 'c3-prob-sumar', needs: /Toca el 14.*Juntar/s, why: 'bar:add, la barra vacía' },
  { id: 'c3-prob-multiplicar', needs: /Repetir/, why: 'bar:mul, el botón' },
  { id: 'c3-tabla-8', needs: /doble de 3 es 6, el de 6 es 12, el de 12 es 24/, why: 'tabla del 8: dobla tres veces' },
]

describe('clases-cobertura', () => {
  it('every class practises with numbers no bigger than the ones it has shown', () => {
    const short: string[] = []
    for (const cls of CLASSES) {
      const practised = cls.lesson.steps.filter((s) => s.interaction === 'try').flatMap((s) => s.trySelector?.skills ?? [])
      const need = Math.max(0, ...practised.map(digitsOfSkill))
      const shown = digitsShown(cls)
      if (need > shown) short.push(`${cls.lesson.id}: practica con ${need} cifras y solo enseña ${shown}`)
    }
    expect(short).toEqual([])
  })

  it.each(DECLARED)('$id enseña antes lo que practica: $why', ({ id, needs }) => {
    const cls = CLASSES.find((c) => c.lesson.id === id)!
    expect(cls, id).toBeDefined()
    const shown = cls.lesson.steps.slice(0, cls.phases.para + cls.phases.ejemplo).map((s) => s.text).join(' ')
    expect(shown).toMatch(needs)
  })

  it('the 2 × 2 class practises the column (long-mul)', () => {
    const cls = CLASSES.find((c) => c.lesson.id === 'c3-mul-2x2-partes')!
    for (const step of cls.lesson.steps.filter((s) => s.interaction === 'try')) expect(step.trySelector?.kinds).toEqual(['long-mul'])
  })
})
