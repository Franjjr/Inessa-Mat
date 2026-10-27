/* PUBLIC API of the content module (agent: content). Season 1 story, lessons, guardians, companions,
   accessories, stickers, phrases, templating and progression rules. Data + pure functions only.
   The data lives in sibling files (worlds/, stories/, lessons/, guardians.ts, …); see README.md for the
   activity params each ActivityConfig uses. Contract signatures are unchanged; extras are listed at the end. */
import type {
  AccessoryDef, ChildProfile, CompanionDef, CompanionSpecies, ErrorType, GuardianDef, LessonDef,
  NodeDef, ProgressState, ReactionKind, SeasonDef, StickerDef, StoryDef, TemplateString, WorldDef,
} from '@/types'
import { accessories as ACCESSORIES } from './accessories'
import { companions as COMPANIONS, getCompanionDef as companionDef } from './companions'
import { pickPhrase as pick } from './phrases'
import * as progression from './progression'
import * as seasonData from './season'
import { stickers as STICKERS } from './stickers'
import { renderTemplate as render, templateContext as ctxOf, type TemplateContext } from './template'

export type { TemplateContext } from './template'

export const season1: SeasonDef = seasonData.season1
/** The 2.º adventure: the same maps with the stops, stories and guardians of 2.º (src/content/c2). */
export const seasonC2: SeasonDef = seasonData.seasonC2
export const SEASONS: SeasonDef[] = seasonData.SEASONS
export function getSeason(id?: string): SeasonDef { return seasonData.getSeason(id) }
/** The season a progress plays. */
export function seasonOf(progress: Pick<ProgressState, 'seasonId'> | null | undefined): SeasonDef { return seasonData.getSeason(progress?.seasonId) }
export function seasonIdForGrade(grade?: number): string { return seasonData.seasonIdForGrade(grade) }

/** World and node lookups take the season id ('s1', the 3.º adventure, by default). */
export function getWorld(id: string, seasonId?: string): WorldDef | undefined { return seasonData.getWorld(id, seasonId) }
export function getNode(worldId: string, nodeId: string, seasonId?: string): NodeDef | undefined { return seasonData.getNode(worldId, nodeId, seasonId) }
export function getStory(id: string): StoryDef | undefined { return seasonData.getStory(id) }
export function getLesson(id: string): LessonDef | undefined { return seasonData.getLesson(id) }
export function getGuardian(id: string): GuardianDef | undefined { return seasonData.getGuardian(id) }

/** Prologue shown once after onboarding (Lumi + the companion meet the child, Borrón blows the fog). */
export const PROLOGUE_STORY_ID = 'prologue'
/** Finale after the 8th crystal (horn lights up, Borrón's redemption, the chest). */
export const FINALE_STORY_ID = 'finale'
/** The finale of a season: the 2.º adventure has its own (the trick Borrón learns is from 2.º). */
export function finaleStoryId(seasonId?: string): string { return seasonId === 'c2' ? 'c2-finale' : FINALE_STORY_ID }

export const companions: CompanionDef[] = COMPANIONS
export function getCompanionDef(species: CompanionSpecies): CompanionDef | undefined { return companionDef(species) }

export const accessories: AccessoryDef[] = ACCESSORIES
export const stickers: StickerDef[] = STICKERS

export function templateContext(child: ChildProfile): TemplateContext { return ctxOf(child) }

/** Render a TemplateString (see types/content.ts for the placeholder syntax). */
export function renderTemplate(text: TemplateString, ctx: TemplateContext): string { return render(text, ctx) }

/** Child-facing reaction phrases (companion / Lumi), picked by kind and optional error type. */
export function pickPhrase(kind: ReactionKind, rng: () => number, errorType?: ErrorType): TemplateString {
  return pick(kind, rng, errorType)
}

/** Initial progress for a new child (world 1 unlocked). */
export function initialProgress(childId: string, now: Date = new Date(), seasonId?: string): ProgressState {
  return progression.initialProgress(childId, now, seasonId)
}

export function isNodeUnlocked(progress: ProgressState, worldId: string, nodeId: string): boolean {
  return progression.isNodeUnlocked(progress, worldId, nodeId)
}
export function nextNode(progress: ProgressState): { worldId: string; nodeId: string } | null {
  return progression.nextNode(progress)
}

/** Apply the result of finishing a node (stars, unlocks, crystal/letter/stickers). Pure: returns a new state. */
export function applyNodeResult(
  progress: ProgressState,
  worldId: string,
  nodeId: string,
  result: { stars: number; ms?: number; passed?: boolean; letter?: string },
  now: Date = new Date(),
): ProgressState {
  return progression.applyNodeResult(progress, worldId, nodeId, result, now)
}

/** Suggested starting world for a child's school grade (1º–3º → w1; 4º–6º → w3, see unlockThroughWorld). */
export function startingWorldForGrade(grade?: number): string { return progression.startingWorldForGrade(grade) }

// ---------------------------------------------------------------- extras (content extensions)

/** Progression helpers: world unlocks, stickers diff, crystals/letters for LumiHorn, shop purchase rules. */
export {
  buyAccessory, canBuyAccessory, COMPLETION_STARS, crystalsOf, isWorldUnlocked, lettersOf, localDay, MAX_RECORDS,
  newStickers, spendableStars, switchSeason, unlockThroughWorld,
} from './progression'
export type { BuyCheck } from './progression'
/** Lookups beyond the contract. */
export { guardianForWorld, guardians, lessons, nextWorldId, stories } from './season'
export { getAccessory, ACCESSORY_IDS } from './accessories'
export type { AccessoryId } from './accessories'
export { COMPANION_COLORWAYS, speciesNoun } from './companions'
export { describeStickerRule, getSticker, parseStickerRule, stickerRuleMet } from './stickers'
export type { StickerRule } from './stickers'
/** Phrase banks and a speaker-aware picker (the companion never names itself in the third person). */
export { ERROR_PHRASES, PHRASES, pickPhraseFor } from './phrases'
export { FALLBACK_CHILD_NAME, TEMPLATE_PLACEHOLDERS } from './template'
/** Guardian spell codes (workbook scroll) and Borrón's decoy letters. */
export { SPELL_CODES, SPELL_DECOYS } from './guardians'
/** Finale extras: optional teach-back activity, season-2 teaser, diploma and chest copy. */
export { CHEST_TEXT, DIPLOMA_BODY_C2, DIPLOMA_TEXT, SEASON2_TEASER, TEACH_BACK_ACTIVITY } from './meta'

/** Temarios de 2.º, 3.º y 4.º as data and their pure queries (src/content/syllabus). */
export { GRADE2_SYLLABUS, GRADE2_STAGES, GRADE4_SYLLABUS, GRADE4_STAGES, syllabusForGrade, GRADE3_SYLLABUS, MASTERED_BOX, MASTERED_SHARE, availableSkills, availableTopics, currentTopic, isTopicMastered, topicProgress, blockIdOfTopic, allTopics, teachingOrder, stageOfTopic, GRADE3_STAGES, SYLLABUS_RUNGS, topicTitle } from './syllabus'
/** Clases: a lesson in five phases per syllabus topic (src/content/classes). */
export { CLASSES, classForTopic, clase, findLessonNode, isClassDone, markClassDone } from './classes'
export type { ClassDef, ClassInput } from './classes'
export type { Syllabus, SyllabusBlock, SyllabusRung, SyllabusStage, SyllabusTopic } from './syllabus'
