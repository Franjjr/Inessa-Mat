/* PUBLIC API of the content module (agent: content). Season 1 story, lessons, guardians, companions,
   accessories, stickers, phrases, templating and progression rules. Data + pure functions only.
   Stub bodies exist only so the app compiles before the module is implemented. */
import type {
  AccessoryDef, ChildProfile, CompanionDef, CompanionSpecies, ErrorType, GrammaticalGender, GuardianDef, LessonDef,
  NodeDef, ProgressState, ReactionKind, SeasonDef, StickerDef, StoryDef, TemplateString, WorldDef,
} from '@/types'

export const season1: SeasonDef = { id: 's1', name: 'Numeria', secretWord: 'VALIENTE', worlds: [] }

export function getWorld(_id: string): WorldDef | undefined { return undefined }
export function getNode(_worldId: string, _nodeId: string): NodeDef | undefined { return undefined }
export function getStory(_id: string): StoryDef | undefined { return undefined }
export function getLesson(_id: string): LessonDef | undefined { return undefined }
export function getGuardian(_id: string): GuardianDef | undefined { return undefined }

/** Prologue shown once after onboarding (Lumi + the companion meet the child, Borrón blows the fog). */
export const PROLOGUE_STORY_ID = 'prologue'
/** Finale after the 8th crystal (horn lights up, Borrón's redemption, the chest). */
export const FINALE_STORY_ID = 'finale'

export const companions: CompanionDef[] = []
export function getCompanionDef(_species: CompanionSpecies): CompanionDef | undefined { return undefined }

export const accessories: AccessoryDef[] = []
export const stickers: StickerDef[] = []

export interface TemplateContext {
  childName: string
  childGender: GrammaticalGender
  petName: string
  petGender: GrammaticalGender
  petSpecies: CompanionSpecies
}

export function templateContext(child: ChildProfile): TemplateContext {
  return {
    childName: child.nickname, childGender: child.gender,
    petName: child.companion.name, petGender: child.companion.gender, petSpecies: child.companion.species,
  }
}

/** Render a TemplateString (see types/content.ts for the placeholder syntax). */
export function renderTemplate(text: TemplateString, ctx: TemplateContext): string {
  return text.replace(/\{child\}/g, ctx.childName).replace(/\{pet\}/g, ctx.petName)
}

/** Child-facing reaction phrases (companion / Lumi), picked by kind and optional error type. */
export function pickPhrase(_kind: ReactionKind, _rng: () => number, _errorType?: ErrorType): TemplateString {
  return ''
}

/** Initial progress for a new child (world 1 unlocked). */
export function initialProgress(childId: string, now: Date = new Date()): ProgressState {
  return {
    childId, seasonId: 's1', worlds: { w1: { unlocked: true, nodes: {}, crystal: false } }, stars: 0, starsSpent: 0,
    stickers: [], accessoriesOwned: [], chestOpened: false, daysPlayed: [], flags: {}, updatedAt: now.toISOString(),
  }
}

export function isNodeUnlocked(_progress: ProgressState, _worldId: string, _nodeId: string): boolean { return false }
export function nextNode(_progress: ProgressState): { worldId: string; nodeId: string } | null { return null }

/** Apply the result of finishing a node (stars, unlocks, crystal/letter/stickers). Pure: returns a new state. */
export function applyNodeResult(
  progress: ProgressState,
  _worldId: string,
  _nodeId: string,
  _result: { stars: number; ms?: number; passed?: boolean; letter?: string },
  _now: Date = new Date(),
): ProgressState {
  return progress
}

/** Suggested starting world for a child's school grade (e.g. 3º → world 1 still, but skip lessons?). */
export function startingWorldForGrade(_grade?: number): string { return 'w1' }
