/* The Caligrafía curriculum (letra ligada): what is practised, in teaching order. Pure data, no I/O.
   Letters go by family of stroke (redondas, bucles, puentes, otras), then the two-letter links, the words, the
   sentences and, last, the capitals. Every text must be drawable by joinWord (src/ink/cursive/join.ts). */
import type { SkillKey } from '@/types'

export type CalKind = 'letra' | 'mayus' | 'enlace' | 'palabra' | 'frase'
export type CalFamily = 'redondas' | 'bucles' | 'puentes' | 'otras'

export interface CalItem {
  skill: SkillKey
  text: string
  kind: CalKind
  family?: CalFamily
}

const letters = (family: CalFamily, chars: string[]): CalItem[] =>
  chars.map((c) => ({ skill: `calig:letra:${c}`, text: c, kind: 'letra', family }))

const REDONDAS = letters('redondas', ['a', 'o', 'd', 'g', 'q', 'c'])
const BUCLES = letters('bucles', ['l', 'b', 'h', 'k', 'f'])
const PUENTES = letters('puentes', ['m', 'n', 'ñ', 'v', 'w'])
const OTRAS = letters('otras', ['e', 'i', 'j', 'p', 'r', 's', 't', 'u', 'x', 'y', 'z'])

const ENLACES: CalItem[] = ['br', 'bl', 'os', 'ar', 'la', 'el', 'mo', 'ca'].map((t) => ({
  skill: `calig:enlace:${t}`, text: t, kind: 'enlace',
}))

const PALABRAS: CalItem[] = ['sol', 'mamá', 'casa', 'gato', 'libro', 'perro', 'árbol', 'mariposa'].map((t) => ({
  skill: `calig:palabra:${t}`, text: t, kind: 'palabra',
}))

const FRASES: CalItem[] = [
  { id: 'mi-gato-come', text: 'Mi gato come.' },
  { id: 'la-luna-sale', text: 'La luna sale.' },
  { id: 'me-gusta-leer', text: 'Me gusta leer.' },
].map((f) => ({ skill: `calig:frase:${f.id}`, text: f.text, kind: 'frase' }))

const MAYUSCULAS: CalItem[] = [...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'].map((c) => ({
  skill: `calig:mayus:${c}`, text: c, kind: 'mayus',
}))

/** The whole curriculum in teaching order. */
export const CAL_CURRICULUM: CalItem[] = [
  ...REDONDAS, ...BUCLES, ...PUENTES, ...OTRAS, ...ENLACES, ...PALABRAS, ...FRASES, ...MAYUSCULAS,
]

/** The skill keys of the curriculum (a Set for membership checks). */
export const CAL_SKILLS: ReadonlySet<SkillKey> = new Set(CAL_CURRICULUM.map((i) => i.skill))
