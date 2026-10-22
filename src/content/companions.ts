/* The 8 companion species a child can pick. Noun forms are [feminine, masculine].
   Species whose feminine form is unnatural or unkind in Spanish keep one form for every gender
   (fox → "zorrito", baby unicorn → "unicornio bebé"); copy that needs gender agreement uses the pet's NAME
   with {pg:…}, never the species noun. Colorway ids are implemented by the art module. */
import type { CompanionDef, CompanionSpecies, GrammaticalGender } from '@/types'

/** Exactly these ids are drawn by src/art/companions. */
export const COMPANION_COLORWAYS = ['default', 'sunny', 'berry', 'mint'] as const

export const companions: CompanionDef[] = [
  {
    species: 'cat',
    noun: ['gatita', 'gatito'],
    articleNoun: ['la gatita', 'el gatito'],
    personality: '¡Le encantan los ovillos y las siestas al sol!',
    suggestedNames: ['Bigotes', 'Misi', 'Luna', 'Pelusa', 'Garbanzo', 'Canela', 'Tigre', 'Minino'],
    colorways: [...COMPANION_COLORWAYS],
  },
  {
    species: 'dog',
    noun: ['perrita', 'perrito'],
    articleNoun: ['la perrita', 'el perrito'],
    personality: 'Mueve la cola cada vez que aciertas.',
    suggestedNames: ['Toby', 'Lola', 'Coco', 'Bruno', 'Pipa', 'Galleta', 'Trufa', 'Rayo'],
    colorways: [...COMPANION_COLORWAYS],
  },
  {
    species: 'fox',
    noun: ['zorrito', 'zorrito'],
    articleNoun: ['el zorrito', 'el zorrito'],
    personality: 'Tiene una cola enorme y mil ideas traviesas.',
    suggestedNames: ['Canelo', 'Mandarina', 'Rufo', 'Lía', 'Otoño', 'Pimienta', 'Kira', 'Brasa'],
    colorways: [...COMPANION_COLORWAYS],
  },
  {
    species: 'bunny',
    noun: ['conejita', 'conejito'],
    articleNoun: ['la conejita', 'el conejito'],
    personality: 'Da saltos altísimos… ¡y se come todas las zanahorias!',
    suggestedNames: ['Copito', 'Tambor', 'Pompón', 'Algodón', 'Mora', 'Lulú', 'Saltarín', 'Bolita'],
    colorways: [...COMPANION_COLORWAYS],
  },
  {
    species: 'panda',
    noun: ['osita panda', 'osito panda'],
    articleNoun: ['la osita panda', 'el osito panda'],
    personality: 'Da los abrazos más fuertes y come bambú a todas horas.',
    suggestedNames: ['Bambú', 'Mochi', 'Pandi', 'Lin', 'Tofu', 'Panchito', 'Nube', 'Kiwi'],
    colorways: [...COMPANION_COLORWAYS],
  },
  {
    species: 'penguin',
    noun: ['pingüina', 'pingüino'],
    articleNoun: ['la pingüina', 'el pingüino'],
    personality: 'Resbala sobre la barriga y le encanta el hielo.',
    suggestedNames: ['Copo', 'Frac', 'Cubito', 'Glaciar', 'Pinpín', 'Polo', 'Nita', 'Escarcha'],
    colorways: [...COMPANION_COLORWAYS],
  },
  {
    species: 'dragon',
    noun: ['dragoncita', 'dragoncito'],
    articleNoun: ['la dragoncita', 'el dragoncito'],
    personality: 'Echa chispitas de colores cuando se emociona.',
    suggestedNames: ['Fueguito', 'Ascua', 'Rubí', 'Draco', 'Volcán', 'Llamita', 'Jade', 'Tizón'],
    colorways: [...COMPANION_COLORWAYS],
  },
  {
    species: 'unicorn',
    noun: ['unicornio bebé', 'unicornio bebé'],
    articleNoun: ['el unicornio bebé', 'el unicornio bebé'],
    personality: 'Su cuerno todavía es pequeñito, ¡pero brilla un montón!',
    suggestedNames: ['Estrella', 'Arcoíris', 'Purpurina', 'Algodón de Azúcar', 'Cielo', 'Brillo', 'Perla', 'Lucero'],
    colorways: [...COMPANION_COLORWAYS],
  },
]

const BY_SPECIES = new Map(companions.map((c) => [c.species, c]))

export function getCompanionDef(species: CompanionSpecies): CompanionDef | undefined {
  return BY_SPECIES.get(species)
}

const GENDER_INDEX: Record<GrammaticalGender, 0 | 1> = { f: 0, m: 1 }

/** Species noun + noun-with-article for a pet gender. Unknown species fall back to the cat. */
export function speciesNoun(species: CompanionSpecies, gender: GrammaticalGender): { noun: string; articleNoun: string } {
  const def = BY_SPECIES.get(species) ?? companions[0]
  const i = GENDER_INDEX[gender] ?? 1
  return { noun: def.noun[i], articleNoun: def.articleNoun[i] }
}
