import type { SkillSelector } from './exercise'
import type { CompanionSpecies } from './child'

/**
 * TemplateString: Spanish copy with placeholders, rendered by content/template.ts → renderTemplate(text, ctx).
 *   {child}            child's nickname                       → "Inessa"
 *   {pet}              companion's name                       → "Bigotes"
 *   {pet_species}      species noun with gender               → "gatita"
 *   {el_pet_species}   with article                           → "la gatita"
 *   {cg:F|M|N}         pick by CHILD gender (f|m|n)           → "{cg:valiente|valiente|valiente}", "{cg:Querida|Querido|Hola}"
 *   {pg:F|M|N}         pick by COMPANION gender               → "tu {pg:amiga|amigo|amigo}"
 * N (neutral) must read naturally without gender, e.g. "{cg:lista|listo|una crack}".
 */
export type TemplateString = string

export type CharacterId =
  | 'lumi'        // unicorn guide (always present)
  | 'companion'   // the child's chosen animal (resolved at render time)
  | 'borron'      // the mischievous grey cloud-goblin who blew the Fog of Forgetting
  | 'owl' | 'frog' | 'ladybug' | 'polarbear' | 'octopus' | 'fairy' | 'dragon' | 'queen'
  | 'narrator'

export type Pose =
  | 'idle' | 'talk' | 'happy' | 'cheer' | 'sad' | 'worried' | 'scared' | 'think' | 'surprised' | 'sleep'

/** Visual trouble the companion is in; drawn by art/Predicament around the companion. */
export type PredicamentKind =
  | 'bubble'   // floating away in a soap bubble / river bubble
  | 'net'      // caught in a net / web
  | 'ice'      // frozen in an ice block
  | 'fog'      // swallowed by grey fog (colours drained)
  | 'vines'    // tangled in vines
  | 'cage'     // locked in a cage
  | 'ink'      // covered in octopus ink
  | 'stuck'    // stuck in a hole / between rocks
  | 'none'

export type BackgroundId =
  | 'home' | 'sky' | 'forest' | 'river' | 'cave' | 'mountain' | 'lake' | 'rainbow-garden' | 'volcano' | 'castle'

export interface StoryLine {
  speaker: CharacterId
  text: TemplateString
  pose?: Pose
  /** Sound effect to play when the line appears (audio/sfx name). */
  sfx?: string
}

export interface StoryScene {
  background: BackgroundId
  /** Characters on stage. 'companion' may carry a predicament. */
  cast: { id: CharacterId; pose: Pose; position: 'left' | 'center' | 'right'; predicament?: PredicamentKind }[]
  lines: StoryLine[]
}

export interface StoryDef {
  id: string
  title: TemplateString
  scenes: StoryScene[]
}

/** Animated lesson visuals implemented by src/activities/lesson/visuals. */
export type LessonVisualId =
  | 'groups'            // params: { groups, perGroup, emoji }
  | 'array-rotate'      // params: { rows, cols, emoji } — shows the mirror (commutative) rule
  | 'easy-tables'       // params: {} — ×1, ×2, ×5, ×10 rules
  | 'place-value'       // params: { n } — houses UM C D U
  | 'carry'             // params: { a, b } — animated column addition with carry jumping
  | 'borrow'            // params: { a, b } — animated subtraction, neighbour lends a ten
  | 'zero-borrow'       // params: { a, b }
  | 'sub-check'         // params: { a, b } — result + subtrahend = minuend
  | 'five-plus-one'     // params: { b } — 6×b = 5×b + b with dot array
  | 'even-six-rhyme'    // params: {}
  | 'double-chain'      // params: { start, steps }
  | 'pattern-units'     // params: { table } — units digits pattern
  | 'known-facts'       // params: { table } — table with "already known" ticks
  | 'nine-trick'        // params: { a }
  | 'square-rhyme'      // params: {} — 7×7=49 rhyme
  | 'five-six-seven-eight' // params: {}
  | 'split-multiply'    // params: { n, m } — 23×3 = 20×3 + 3×3
  | 'column-mul'        // params: { top, bottom }
  | 'share'             // params: { total, groups, emoji }
  | 'fact-family'       // params: { a, b }
  | 'galera'            // params: { dividend, divisor }
  | 'division-check'    // params: { dividend, divisor }

export interface LessonStep {
  visual: LessonVisualId
  params?: Record<string, number | string>
  /** What Lumi says on this step. */
  text: TemplateString
  speaker?: CharacterId
  /** 'tap' = tap to continue; 'try' = child must solve one mini exercise (generated from selector) to continue. */
  interaction?: 'tap' | 'try'
  trySelector?: SkillSelector
}

export interface LessonDef {
  id: string
  title: TemplateString
  steps: LessonStep[]
}

export type ActivityKind =
  // Activities A (facts-based)
  | 'facts' | 'race' | 'missing' | 'wheel' | 'necklace' | 'chain' | 'family' | 'maze' | 'pixel' | 'memory' | 'bubbles'
  // Activities B (structured ops & manipulatives)
  | 'groups' | 'array' | 'column' | 'division' | 'share' | 'word' | 'board'

export interface ActivityConfig {
  kind: ActivityKind
  title: TemplateString
  /** Short instruction shown (and optionally read aloud). */
  instructions: TemplateString
  selector: SkillSelector
  /** Number of items/rounds. */
  count?: number
  /** Kind-specific parameters (documented in each activity's README / index). */
  params?: Record<string, unknown>
  /** Stars thresholds as accuracy ratio, default [0.6, 0.8, 0.95]. */
  starThresholds?: [number, number, number]
}

export interface GuardianDef {
  id: string
  character: CharacterId
  title: TemplateString
  intro: TemplateString
  /** Item groups: each produces N exercises; rendered with the shared exercise views. */
  rounds: { selector: SkillSelector; count: number }[]
  /** Minimum correct answers to pass (out of the total of rounds). */
  passMin: number
  /** Final "Hechizo del Cristal": a single story problem; its result reveals the letter. */
  spell: { text: TemplateString; selector?: SkillSelector; fixed?: { kind: 'fact-mul' | 'column-add' | 'column-sub' | 'column-mul' | 'division'; a: number; b: number } }
  letter: string
  /** Rescue scene played on success (companion freed). */
  rescueStory: string
  /** Encouragement on failure (template). */
  retryText: TemplateString
}

export type NodeKind = 'story' | 'lesson' | 'activity' | 'guardian' | 'review'

export interface NodeDef {
  id: string
  kind: NodeKind
  title: TemplateString
  /** story → StoryDef.id, lesson → LessonDef.id, guardian → GuardianDef.id */
  ref?: string
  activity?: ActivityConfig
  /** Map position in world map, 0..1 coordinates. */
  pos: { x: number; y: number }
  /** Optional: node can be replayed for more stars. Default true. */
  replayable?: boolean
}

export interface WorldDef {
  id: string              // 'w1'..'w8'
  seasonId: string        // 's1'
  index: number           // 1..8
  name: TemplateString
  shortName: string
  /** CSS colour variables (e.g. 'var(--w1)') */
  color: string
  colorSoft: string
  background: BackgroundId
  guardian: CharacterId
  crystalName: string     // 'verde'
  /** What happens to the companion in this world (shown on the world map). */
  predicament: PredicamentKind
  /** One-line hook for the map: "¡{pet} se ha caído al río!" */
  hook: TemplateString
  skillsSummary: string   // for adults: "Sumas de 3 y 4 cifras"
  nodes: NodeDef[]
}

export interface SeasonDef {
  id: string
  name: TemplateString
  secretWord: string      // 'VALIENTE'
  worlds: WorldDef[]
}

export interface CompanionDef {
  species: CompanionSpecies
  /** Noun forms: [feminine, masculine, neutral-fallback]. e.g. ['gatita','gatito','gatito'] */
  noun: [string, string, string]
  articleNoun: [string, string, string] // ['la gatita','el gatito','el gatito']
  personality: string     // child-facing: "Curioso y juguetón"
  suggestedNames: string[]
  colorways: string[]
}

export interface AccessoryDef {
  id: string
  name: string
  slot: 'head' | 'neck' | 'face' | 'back' | 'held'
  price: number           // stars
  /** World that must be completed to unlock it in the shop (optional). */
  requiresWorld?: string
}

export interface StickerDef {
  id: string
  name: string
  worldId?: string
  emoji?: string
  /** How it is earned (for display): 'node:w1:n3' | 'world:w2' | 'streak:3' ... */
  earnedBy: string
}
