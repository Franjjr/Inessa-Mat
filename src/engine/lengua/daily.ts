/* The 15-minute Lengua session («Mi sesión de Lengua»). Pure: no React, no I/O.
     Calentamiento (2 min)  learnt Lengua skills, most urgent first, no hints
     Lo nuevo               the current topic: its class comes first (plan.classTopicId) when it has one and the child has
                            not done it; then up to 6 items of the topic
     Lectura                one story with its questions: the next unread one, or a re-read; the text is shown first
     Mezcla                 spelling and vocabulary review, filled up to the practice time
   At least 12 of the 15 minutes are exercises or reading. Dictation needs the sound (R16): without it the planner leaves
   the dictation skill out. Lengua has no problem block and no worked example. */
import { classForTopic, isClassDone } from '@/content/classes'
import { availableSkills, currentTopic, type Syllabus } from '@/content/syllabus'
import { STORY_READINGS } from '@/content/lengua/stories'
import type { ChildProfile, Exercise, MasteryMap, ProgressState, ReadingDef, Rng, SkillKey, SkillMastery } from '@/types'
import { generate } from '../generate'
import { createRng, hashString } from '../rng'
import { parseSkill } from '../skills'
import { masteryOf } from '../subjects'
import { estimateSeconds, urgencyOrder, type DailyItem, type DailyPlan } from '../daily'
import { readingExercise } from './reading'
import { makable, teachableCourse } from './teachable'

export const LENGUA_WARMUP_MAX = 4
/** «Lo nuevo»: up to six items of the topic (its skills taken in turn). */
export const LENGUA_NEW_MAX = 6
export const LENGUA_MIX_MIN = 3
/** The mix fills the practice time, up to this many items (a short history of skills cycles). */
export const LENGUA_MIX_MAX = 16
/** The exercises and the reading must fill this much of the session (at least 12 of 15 minutes). */
export const LENGUA_PRACTICE_TARGET_SECONDS = 12 * 60
/** Reading the text of a story before its questions. */
export const PASSAGE_SECONDS = 90

export interface LenguaPlanInput {
  child: ChildProfile
  mastery: MasteryMap
  syllabus: Syllabus
  now: Date
  /** The child's progress: its flags tell the classes done and the stories read. Without it nothing counts as done. */
  progress?: ProgressState
  /** A Spanish voice can read the dictation on this device (speech.available()). Default true. Without it no dictation is planned (R27). */
  voice?: boolean
  rng?: Rng
}

/** The Lengua area of a skill (`lng:<area>:…`), or null for any other key. */
function areaOf(skill: SkillKey): string | null {
  const p = parseSkill(skill)
  return p?.type === 'lengua' ? p.area : null
}

/** The guided writing is done once per topic (completion only): it is taught in «Lo nuevo» and never repeated as warm-up or review. */
const GUIDED_SKILL: SkillKey[] = ['lng:escr:guiada']

/** The flag that says a story has been read to its last question. */
export const storyFlag = (readingId: string) => `lectura:${readingId}`

const dayKey = (now: Date) => now.toISOString().slice(0, 10)

function secondsOf(items: DailyItem[]): number {
  return items.reduce((sum, i) => sum + estimateSeconds(i), 0)
}

/** Builds today's Lengua session. The same child and day give the same plan (seeded). */
export function planLenguaSession(input: LenguaPlanInput): DailyPlan {
  const { child, now, progress } = input
  // The dictation can be heard: the sound is on and a voice reads it (R16, R27). Without that no dictation is planned.
  const sound = (child.settings?.sound ?? true) && (input.voice ?? true)
  const mastery = masteryOf(input.mastery, 'language')
  const course = teachableCourse(input.syllabus, sound)
  const today = dayKey(now)
  const rng = input.rng ?? createRng(hashString(`lengua:${child.id}:${today}`))
  const used: string[] = []
  const make = (skill: SkillKey, seedRng: Rng): Exercise | null => {
    const [ex] = generate({ skills: [skill] }, 1, { rng: seedRng, now, mastery, avoidIds: used })
    if (ex) used.push(ex.id)
    return ex ?? null
  }
  const canMake = (skill: SkillKey) => generate({ skills: [skill] }, 1, { rng: createRng(hashString(`step:${today}:${skill}`)), now, mastery }).length > 0

  // 1. Calentamiento: learnt skills not seen today, the most urgent first. Readings are practised in the story, not here.
  const seenBeforeToday = (m: SkillMastery) => m.box >= 1 && (m.lastSeenAt ?? '').slice(0, 10) < today
  const learnt = urgencyOrder(mastery, now).filter(seenBeforeToday).map((m) => m.skill)
    .filter((s) => makable(s, sound) && areaOf(s) !== 'lect' && areaOf(s) !== 'lit' && !GUIDED_SKILL.includes(s))
  const warmup: DailyItem[] = []
  for (const s of learnt.slice(0, LENGUA_WARMUP_MAX)) {
    const ex = make(s, rng)
    if (ex) warmup.push({ exercise: ex, block: 'warmup', scaffold: false, isNew: false })
  }

  // 2. Lo nuevo: the current topic (its class first when it has one and it is not done), unmastered skills first.
  const topic = currentTopic(course, mastery)
  const cls = topic ? classForTopic(topic.id, child.grade, 'language') : undefined
  const classTopicId = topic && cls && !(progress && isClassDone(progress, cls)) ? topic.id : null
  const newItems: DailyItem[] = []
  if (topic) {
    const open = topic.skills.filter((s) => (mastery[s]?.box ?? -1) < 2)
    // An ordered topic's skills are steps: only the first open one the generator can make is taught now.
    const candidates = topic.ordered
      ? open.filter(canMake).slice(0, 1)
      : open.sort((x, y) => Number(!mastery[x]) - Number(!mastery[y]) || (mastery[x]?.box ?? 0) - (mastery[y]?.box ?? 0))
    for (let i = 0; candidates.length && newItems.length < LENGUA_NEW_MAX && i < LENGUA_NEW_MAX * 3; i++) {
      const skill = candidates[i % candidates.length]
      const ex = make(skill, rng)
      if (ex) newItems.push({ exercise: ex, block: 'new', scaffold: false, isNew: !mastery[skill] })
    }
  }

  // 3. Lectura: the next story not read yet, or a seeded one of them all when every story is read.
  const unread = STORY_READINGS.filter((r) => !progress?.flags?.[storyFlag(r.id)])
  const reading: ReadingDef = unread[0] ?? STORY_READINGS[Math.floor(rng() * STORY_READINGS.length)]
  const storyItems: DailyItem[] = reading.questions.map((_, i) => {
    const exercise = readingExercise(reading, i)
    used.push(exercise.id)
    return {
      exercise, block: 'story', scaffold: false, isNew: false,
      ...(i === 0 ? { passage: reading } : {}),
      ...(i === reading.questions.length - 1 ? { finishesReading: reading.id } : {}),
    }
  })

  // 4. Mezcla: the spelling, vocabulary and copies the child has learnt; when none yet, those the syllabus has.
  const spelling = (s: SkillKey) => ['orto', 'voc', 'escr'].includes(areaOf(s) ?? '') && !GUIDED_SKILL.includes(s)
  const review = learnt.filter(spelling)
  const pool = review.length ? review : availableSkills(course).filter((s) => makable(s, sound) && spelling(s))
  const fixedSeconds = secondsOf([...warmup, ...newItems, ...storyItems]) + PASSAGE_SECONDS
  const mixItems: DailyItem[] = []
  for (let k = 0; pool.length && k < 60; k++) {
    const enough = mixItems.length >= LENGUA_MIX_MIN && fixedSeconds + secondsOf(mixItems) >= LENGUA_PRACTICE_TARGET_SECONDS
    if (mixItems.length >= LENGUA_MIX_MAX || enough) break
    const ex = make(pool[k % pool.length], rng)
    if (ex) mixItems.push({ exercise: ex, block: 'mix', scaffold: false, isNew: false })
  }

  const blocks: DailyPlan['blocks'] = [
    { id: 'warmup', items: warmup },
    { id: 'new', items: newItems },
    { id: 'story', items: storyItems },
    { id: 'mix', items: mixItems },
  ]
  const practiceSeconds = secondsOf(blocks.flatMap((b) => b.items)) + PASSAGE_SECONDS
  return { topic, example: null, blocks, practiceSeconds, newFactCount: 0, classTopicId }
}
