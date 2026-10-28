import type { SkillSelector } from './exercise'
import type { CompanionSpecies } from './child'
import type { DivMethod, SubMethod } from './exercise'

/**
 * TemplateString: Spanish copy with placeholders, rendered by content/template.ts → renderTemplate(text, ctx).
 *   {child}            child's nickname                       → "Inessa"
 *   {pet}              companion's name                       → "Bigotes"
 *   {pet_species}      species noun with gender               → "gatita"
 *   {el_pet_species}   with article                           → "la gatita"
 *   {cg:F|M}           pick by CHILD gender (f|m)             → "{cg:valiente|valiente}", "{cg:Querida|Querido}"
 *   {pg:F|M}           pick by COMPANION gender               → "tu {pg:amiga|amigo}"
 * One option is used for every gender, e.g. "{cg:valiente}".
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
  | 'galera'            // params: { dividend, divisor, written? (1: the steps with their products and remainders written) }
  | 'division-check'    // params: { dividend, divisor }
  | 'sub-carry'         // params: { a, b } — subtraction "me llevo una abajo": the subtrahend's next digit gets +1
  | 'sub-parts'         // params: { a, b } — subtraction by parts: a − hundreds − tens − units
  | 'sub-line'          // params: { a, b } — subtraction on the number line: jumps from b up to a
  | 'bar-model'         // params: { a, b, total } — part-part-whole bar (a and b are the parts, total the whole)
  | 'div-parts'         // params: { dividend, divisor } — repartir por partes: 84 ÷ 4 = 80 ÷ 4 + 4 ÷ 4
  | 'div-climb'         // params: { divisor, quotient } — multiplicar hacia arriba: the multiples of the divisor
  | 'lng-sentence'      // Lengua: params { text, highlight?, mark? } — a sentence on a card; mark noun, adj, verb or art colours the highlight
  | 'lng-word'          // Lengua: params { word, parts?, mark? } — a word cut into parts (ma-ri-po-sa, abre+latas); mark is a class or a part
  | 'big-text'          // params: { text, sub? } — one or two lines of large text (a rule, an equality), sub under it
  | 'number-line'       // params: { from, to, step, mark?, jump? } — ruler with ticks; mark highlights a number, jump draws an arc from mark to mark + jump

export interface LessonStep {
  visual: LessonVisualId
  params?: Record<string, number | string>
  /** What Lumi says on this step. */
  text: TemplateString
  speaker?: CharacterId
  /** 'tap' = tap to continue; 'try' = child must solve one mini exercise (generated from selector) to continue;
   *  'choose' = the child picks one of `choices` (the pick is saved through the host, e.g. the favourite method). */
  interaction?: 'tap' | 'try' | 'choose'
  trySelector?: SkillSelector
  /** 'try' steps: the subtraction method the exercise must be solved with. */
  method?: SubMethod
  /** 'try' steps: the division method the exercise must be solved with. */
  divMethod?: DivMethod
  /** 'choose' steps: the options. */
  choices?: { label: TemplateString; value: string }[]
  /** 'choose' steps: which favourite the pick is saved as (default subMethod). */
  preference?: 'subMethod' | 'divMethod' | 'tableMethod'
  /** 'try' steps: `false` shows the exercise without the hint button (the child solves it alone). */
  hints?: false
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
  // Activities C (mixed exercise kinds: bars, encuentra el error, comprobar)
  | 'exercises'

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
  /** Noun forms: [feminine, masculine]. e.g. ['gatita','gatito'] */
  noun: [string, string]
  articleNoun: [string, string] // ['la gatita','el gatito']
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
