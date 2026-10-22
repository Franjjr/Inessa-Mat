import type { GrammaticalGender, ID, ISODate } from './common'

/** The 8 companion animals a child can pick during setup. Art lives in src/art/companions. */
export type CompanionSpecies =
  | 'cat'      // gatito / gatita
  | 'dog'      // perrito / perrita
  | 'fox'      // zorrito (always masculine noun; use the pet name + {pg:…} for gender)
  | 'bunny'    // conejito / conejita
  | 'panda'    // osito panda / osita panda
  | 'penguin'  // pingüino / pingüina
  | 'dragon'   // dragoncito / dragoncita (baby dragon)
  | 'unicorn'  // unicornio bebé (baby unicorn; Lumi is the grown-up guide)

export const COMPANION_SPECIES: CompanionSpecies[] = [
  'cat', 'dog', 'fox', 'bunny', 'panda', 'penguin', 'dragon', 'unicorn',
]

/** The child's companion: chosen and named in onboarding. Gets into trouble in every world; the child rescues it. */
export interface Companion {
  species: CompanionSpecies
  name: string
  gender: GrammaticalGender
  /** Optional colour variant id understood by the art module (e.g. 'default', 'pink', 'blue', 'gold'). */
  colorway: string
  /** Accessory ids currently worn (see content/accessories). */
  equipped: string[]
}

export type AnswerInputPreference = 'auto' | 'pen' | 'keyboard' | 'keypad'

/** School subjects. Only 'math' has content today; the others are announced as «Próximamente». */
export type SubjectId = 'math' | 'language' | 'english' | 'science' | 'history'

export const SUBJECTS: { id: SubjectId; name: string; available: boolean }[] = [
  { id: 'math', name: 'Matemáticas', available: true },
  { id: 'language', name: 'Lengua', available: false },
  { id: 'english', name: 'Inglés', available: false },
  { id: 'science', name: 'Ciencias', available: false },
  { id: 'history', name: 'Historia', available: false },
]

export interface ChildSettings {
  /** 'auto' = pen/touch writing on tablets, keyboard on computers. */
  inputPreference: AnswerInputPreference
  /** Target daily session length in minutes (default 15). */
  sessionMinutes: number
  sound: boolean
  music: boolean
  /** Lumi reads instructions aloud (Web Speech API). Stories are meant to be read by the child; a "listen" button stays available. */
  voice: boolean
  /** Allow timed activities (race). Parents can disable time pressure entirely. */
  timedActivities: boolean
  handedness: 'right' | 'left'
  /** Larger writing cells for younger children / finger writing. */
  bigCells: boolean
  /** Subjects the adult has enabled for this child (adult area). The child only sees these. */
  subjects: SubjectId[]
}

export const DEFAULT_CHILD_SETTINGS: ChildSettings = {
  inputPreference: 'auto',
  sessionMinutes: 15,
  sound: true,
  music: true,
  voice: true,
  timedActivities: true,
  handedness: 'right',
  bigCells: false,
  subjects: ['math'],
}

export interface ChildProfile {
  /** Client-generated UUID (crypto.randomUUID) so profiles can be created offline. */
  id: ID
  /** Owning organization (family or school). null while the device is in local-only mode. */
  orgId: ID | null
  nickname: string
  gender: GrammaticalGender
  birthYear?: number
  /** School year in Spanish primary: 1..6 (1º–6º de Primaria). Used to choose a starting point. */
  grade?: number
  companion: Companion
  settings: ChildSettings
  createdAt: ISODate
  updatedAt: ISODate
  deletedAt?: ISODate | null
}

export type NewChildInput = Pick<ChildProfile, 'nickname' | 'gender' | 'birthYear' | 'grade' | 'companion'> & {
  settings?: Partial<ChildSettings>
}
