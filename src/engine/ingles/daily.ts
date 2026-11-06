/* The English session («Mi sesión de Inglés»): about ten minutes. Pure: no React, no I/O.
     Calentamiento (about 2 min)  learnt English skills not seen today, most urgent first, no hints
     Lo nuevo                     today's topic (topicOfToday: the topic of today's class, else the current topic): its
                                  class comes first (classTopicId) when the child has not done it; then 3 to 5 items of the topic
     Mezcla                       the skills of the words the child failed (newest first), then the learnt ones
     Juego                        one final game on the topic of the day: eng-memory or eng-scramble (memory only when the
                                  theme has its pictures), or a number game (eng-num-write, eng-num-listen, eng-op-listen)
                                  when the topic is a numbers topic. Always present.
   The listening kinds (eng-listen-pick, eng-num-listen, eng-op-listen) are only planned with the sound on: the planner
   leaves them out otherwise, and the operations topic is not taught then (teachableEnglishCourse). The stars and the day
   key are the English ones (sessionRewardKey(now, 'english')). */
import { classForTopic, isClassDone } from '@/content/classes'
import { availableTopics, type Syllabus, type SyllabusTopic } from '@/content/syllabus'
import type { AttemptRecord, ChildProfile, Exercise, ExerciseKind, MasteryMap, ProgressState, Rng, SkillKey, SkillMastery } from '@/types'
import { generate } from '../generate'
import { createRng, hashString } from '../rng'
import { masteryOf, ENGLISH_SESSION_MINUTES } from '../subjects'
import { estimateSeconds, urgencyOrder, type DailyItem, type DailyPlan } from '../daily'
import { ENGLISH_LISTENING_KINDS, speakExercise } from './exercises'
import { englishKindsFor, makableEnglish, teachableEnglishCourse } from './teachable'
import { SPEAK_DAILY_MAX, SPEAK_PER_SESSION_MAX, speakAttemptsToday, speakOffKey, speakingAvailable } from './speaking'
import { ENGLISH_WORDS } from './words'
import { topicOfToday } from '../topicOfToday'

/** The warm-up: at most this many items and about this many seconds. */
export const ENGLISH_WARMUP_MAX = 3
export const ENGLISH_WARMUP_SECONDS = 120
/** «Lo nuevo»: between three and five items of the topic. */
export const ENGLISH_NEW_MIN = 3
export const ENGLISH_NEW_MAX = 5
/** The mix: at least three items, and it fills the time with the rest (at most twelve, a safety cap). */
export const ENGLISH_MIX_MIN = 3
export const ENGLISH_MIX_MAX = 12
/** Most skills of failed words the mix starts with. */
export const ENGLISH_FAILED_MAX = 3
/** The exercises (not the class nor the transitions) fill this much of the ten minutes. */
export const ENGLISH_PRACTICE_TARGET_SECONDS = Math.round(ENGLISH_SESSION_MINUTES * 60 * 0.9)

/** The games a numbers topic can end with, the richest first (the listening ones only with the sound on). */
const NUMBER_GAME_KINDS: ExerciseKind[] = ['eng-op-listen', 'eng-num-listen', 'eng-num-write']

export interface EnglishPlanInput {
  child: ChildProfile
  mastery: MasteryMap
  /** The child's attempts, newest first (listAttempts order): the failed words come back in the mix. */
  attempts: readonly AttemptRecord[]
  syllabus: Syllabus
  now: Date
  /** The child's progress: its flags tell the classes done. Without it nothing counts as done. */
  progress?: ProgressState
  /** The sound is on and a voice can speak English: the listening kinds are planned only then. Default true. */
  sound?: boolean
  /** A microphone exists on this device («Ahora dilo tú» is planned only then). Default: navigator.mediaDevices. */
  mic?: boolean
  rng?: Rng
}

const dayKey = (now: Date) => now.toISOString().slice(0, 10)

function secondsOf(items: DailyItem[]): number {
  return items.reduce((sum, i) => sum + estimateSeconds(i), 0)
}

/** The English word a word exercise is about (its answer, or the word it says), when it has one. */
function wordOf(ex: Exercise): string | null {
  if (ex.kind === 'eng-write-word' || ex.kind === 'eng-scramble') return ex.answer
  if (ex.kind === 'eng-listen-pick') return ex.word
  return null
}

/** «Ahora dilo tú» right after an item of the same word, at most `max` of them, in the order of the items. */
function speakingAfterWords(items: DailyItem[], max: number): { items: DailyItem[]; added: number } {
  const out: DailyItem[] = []
  let added = 0
  for (const item of items) {
    out.push(item)
    const en = wordOf(item.exercise)
    const word = en ? ENGLISH_WORDS.find((w) => w.en === en) : undefined
    if (word && added < max) {
      out.push({ exercise: speakExercise(item.exercise.skill, word), block: item.block, scaffold: false, isNew: false })
      added++
    }
  }
  return { items: out, added }
}

/** The speaking items allowed now: the speaking is available, the service has not failed today, and the day's limit is not reached. */
function speakingLeft(child: ChildProfile, progress: ProgressState | undefined, now: Date, mic: boolean): number {
  if (!speakingAvailable(child, mic) || progress?.flags?.[speakOffKey(now)]) return 0
  const left = SPEAK_DAILY_MAX - speakAttemptsToday(progress?.flags, now)
  return Math.max(0, Math.min(SPEAK_PER_SESSION_MAX, left))
}

/** The English skills of the failed words, newest first, each once (only those the planner can make). */
function failedSkills(attempts: readonly AttemptRecord[], sound: boolean): SkillKey[] {
  const out: SkillKey[] = []
  for (const a of attempts) {
    if (a.correct || !a.skill.startsWith('eng:') || out.includes(a.skill) || !makableEnglish(a.skill, sound)) continue
    out.push(a.skill)
    if (out.length >= ENGLISH_FAILED_MAX) break
  }
  return out
}

/** Builds today's English session. The same child and day give the same plan (seeded). */
export function planEnglishSession(input: EnglishPlanInput): DailyPlan {
  const { child, now, progress, attempts } = input
  const sound = input.sound ?? true
  const mic = input.mic ?? (typeof navigator !== 'undefined' && !!navigator.mediaDevices)
  const mastery = masteryOf(input.mastery, 'english')
  const course = teachableEnglishCourse(input.syllabus, sound)
  const today = dayKey(now)
  const rng = input.rng ?? createRng(hashString(`english:${child.id}:${today}`))
  const used: string[] = []

  /** One exercise of a skill, among the kinds it can make now (never a listening one without the sound). */
  const make = (skill: SkillKey, kinds: ExerciseKind[], seedRng: Rng): Exercise | null => {
    const allowed = kinds.filter((k) => englishKindsFor(skill, sound).includes(k))
    if (allowed.length === 0) return null
    const [ex] = generate({ skills: [skill], kinds: allowed }, 1, { rng: seedRng, now, mastery, avoidIds: used })
    if (!ex || (!sound && ENGLISH_LISTENING_KINDS.includes(ex.kind))) return null
    used.push(ex.id)
    return ex
  }

  // 1. Calentamiento: learnt English skills not seen today, the most urgent first.
  const seenBeforeToday = (m: SkillMastery) => m.box >= 1 && (m.lastSeenAt ?? '').slice(0, 10) < today
  const learnt = urgencyOrder(mastery, now).filter(seenBeforeToday).map((m) => m.skill).filter((s) => makableEnglish(s, sound))
  const warmup: DailyItem[] = []
  for (const skill of learnt) {
    if (warmup.length >= ENGLISH_WARMUP_MAX || secondsOf(warmup) >= ENGLISH_WARMUP_SECONDS) break
    const ex = make(skill, englishKindsFor(skill, sound), rng)
    if (ex) warmup.push({ exercise: ex, block: 'warmup', scaffold: false, isNew: false })
  }

  // 2. Lo nuevo: the current topic (its class first when the child has not done it); an ordered topic teaches one step.
  const topic = topicOfToday(course, mastery, progress, now)
  const cls = topic ? classForTopic(topic.id, child.grade, 'english') : undefined
  const classTopicId = topic && cls && !(progress && isClassDone(progress, cls)) ? topic.id : null
  const newItems: DailyItem[] = []
  if (topic) {
    // A topic its class has already mastered (today's topic) still teaches its own skills, so «Lo nuevo» never comes out empty.
    const open = topic.skills.filter((s) => (mastery[s]?.box ?? -1) < 2)
    const toTeach = open.length ? open : [...topic.skills]
    const candidates = topic.ordered ? toTeach.slice(0, 1) : toTeach.sort((x, y) => Number(!mastery[x]) - Number(!mastery[y]) || (mastery[x]?.box ?? 0) - (mastery[y]?.box ?? 0))
    for (let i = 0; candidates.length && newItems.length < ENGLISH_NEW_MAX && i < ENGLISH_NEW_MAX * 3; i++) {
      const skill = candidates[i % candidates.length]
      const ex = make(skill, englishKindsFor(skill, sound), rng)
      if (ex) newItems.push({ exercise: ex, block: 'new', scaffold: false, isNew: !mastery[skill] })
    }
  }

  // 4. Juego: one game on the topic of the day, always present (the first available topic when all are mastered).
  const gameTopic: SyllabusTopic | undefined = topic ?? availableTopics(course)[0]
  const gameItems: DailyItem[] = []
  if (gameTopic) {
    const game = gameFor(gameTopic, sound, rng, make)
    if (game) gameItems.push({ exercise: game, block: 'game', scaffold: false, isNew: false })
  }

  // 3. Mezcla: the failed words' skills first, then the learnt ones, up to the practice time.
  const failed = failedSkills(attempts, sound)
  const pool = [...new Set([...failed, ...learnt, ...availableSkills(course, sound)])]
  const fixedSeconds = secondsOf([...warmup, ...newItems, ...gameItems])
  const mixItems: DailyItem[] = []
  for (let k = 0; pool.length && k < 60; k++) {
    const enough = mixItems.length >= ENGLISH_MIX_MIN && fixedSeconds + secondsOf(mixItems) >= ENGLISH_PRACTICE_TARGET_SECONDS
    if (mixItems.length >= ENGLISH_MIX_MAX || enough) break
    const skill = pool[k % pool.length]
    const ex = make(skill, englishKindsFor(skill, sound), rng)
    if (ex) mixItems.push({ exercise: ex, block: 'mix', scaffold: false, isNew: false })
  }

  // «Ahora dilo tú»: up to two, each right after a word of its own (new first, then the mix), when the child may speak.
  // A speaking item needs a word to follow: when the session has too few word items, a vocabulary word joins the mix.
  const left = speakingLeft(child, progress, now, mic)
  const wordItems = () => [...newItems, ...mixItems].filter((i) => wordOf(i.exercise) !== null).length
  for (const skill of pool.filter((s) => s.startsWith('eng:voc:'))) {
    if (wordItems() >= left) break
    const ex = make(skill, ['eng-write-word'], rng)
    if (ex) mixItems.push({ exercise: ex, block: 'mix', scaffold: false, isNew: false })
  }
  const speakNew = speakingAfterWords(newItems, left)
  const speakMix = speakingAfterWords(mixItems, left - speakNew.added)

  const blocks: DailyPlan['blocks'] = [
    { id: 'warmup', items: warmup },
    { id: 'new', items: speakNew.items },
    { id: 'mix', items: speakMix.items },
    { id: 'game', items: gameItems },
  ]
  const practiceSeconds = secondsOf(blocks.flatMap((b) => b.items))
  return { topic, example: null, blocks, practiceSeconds, newFactCount: 0, classTopicId }
}

/** The final game of a topic: a number game on a numbers topic (the richest kind the topic has), otherwise the memory game
    when the theme has its pictures, else the scramble. Deterministic: the same topic always ends with the same kind. */
function gameFor(
  topic: SyllabusTopic, sound: boolean, rng: Rng,
  make: (skill: SkillKey, kinds: ExerciseKind[], seedRng: Rng) => Exercise | null,
): Exercise | null {
  const skillsOf = (kinds: ExerciseKind[]) => topic.skills.filter((s) => englishKindsFor(s, sound).some((k) => kinds.includes(k)))
  if (topic.skills.some((s) => s.startsWith('eng:num:'))) {
    for (const kind of NUMBER_GAME_KINDS) {
      const skill = skillsOf([kind])[0]
      if (skill) return make(skill, [kind], rng)
    }
    return null
  }
  const vocSkill = topic.skills.find((s) => s.startsWith('eng:voc:'))
  if (!vocSkill) return null
  const kind: ExerciseKind = englishKindsFor(vocSkill, sound).includes('eng-memory') ? 'eng-memory' : 'eng-scramble'
  return make(vocSkill, [kind], rng)
}

/** Every English skill of the available topics the planner can make (the mix goes on with them). */
function availableSkills(course: Syllabus, sound: boolean): SkillKey[] {
  return availableTopics(course).flatMap((t) => t.skills).filter((s) => makableEnglish(s, sound))
}
