/* Accessory catalogue for the companion (bought with stars in the shop). Ids are drawn by src/art/companions:
   do not rename them. Prices are in stars; the whole shop costs a bit less than the stars a child earns by
   finishing the season with good results, so everything is reachable without farming replays (replays never
   pay twice: see progression.ts). `requiresWorld` = the world whose crystal unlocks it in the shop. */
import type { AccessoryDef } from '@/types'

export const ACCESSORY_IDS = [
  'crown', 'wizard-hat', 'flower-crown', 'cap', 'bow', 'beanie', 'star-glasses', 'sunglasses', 'scarf', 'bowtie',
  'medal', 'cape', 'fairy-wings', 'backpack', 'wand', 'balloon', 'lollipop', 'paintbrush',
] as const

export type AccessoryId = (typeof ACCESSORY_IDS)[number]

export const accessories: AccessoryDef[] = [
  // ---- cheap first buys (available from the start)
  { id: 'lollipop', name: 'Piruleta', slot: 'held', price: 5 },
  { id: 'bow', name: 'Lazo', slot: 'head', price: 6 },
  { id: 'balloon', name: 'Globo', slot: 'held', price: 6 },
  { id: 'cap', name: 'Gorra', slot: 'head', price: 8 },
  { id: 'bowtie', name: 'Pajarita', slot: 'neck', price: 8 },
  { id: 'sunglasses', name: 'Gafas de sol', slot: 'face', price: 10 },
  // ---- unlocked by the world where they appear in the story
  { id: 'flower-crown', name: 'Corona de flores', slot: 'head', price: 10, requiresWorld: 'w1' }, // the fairies' garden
  { id: 'wand', name: 'Varita mágica', slot: 'held', price: 12, requiresWorld: 'w1' },
  { id: 'backpack', name: 'Mochila', slot: 'back', price: 12, requiresWorld: 'w2' },           // "la mochila" = the carry
  { id: 'medal', name: 'Medalla', slot: 'neck', price: 14, requiresWorld: 'w2' },
  { id: 'wizard-hat', name: 'Sombrero mágico', slot: 'head', price: 18, requiresWorld: 'w3' },
  { id: 'beanie', name: 'Gorro de lana', slot: 'head', price: 12, requiresWorld: 'w4' },       // the snowy mountain
  { id: 'scarf', name: 'Bufanda', slot: 'neck', price: 12, requiresWorld: 'w4' },             // like Nieve's
  { id: 'paintbrush', name: 'Pincel', slot: 'held', price: 14, requiresWorld: 'w5' },         // one of Octavio's things
  { id: 'star-glasses', name: 'Gafas de estrella', slot: 'face', price: 16, requiresWorld: 'w6' },
  { id: 'fairy-wings', name: 'Alas de hada', slot: 'back', price: 20, requiresWorld: 'w6' },  // like Iris's wings
  { id: 'cape', name: 'Supercapa', slot: 'back', price: 22, requiresWorld: 'w7' },
  { id: 'crown', name: 'Corona real', slot: 'head', price: 25, requiresWorld: 'w8' },         // Queen Aurora's gift
]

const BY_ID = new Map(accessories.map((a) => [a.id, a]))

export function getAccessory(id: string): AccessoryDef | undefined {
  return BY_ID.get(id)
}
