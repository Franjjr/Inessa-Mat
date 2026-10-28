/* GameHostProvider: the real ActivityHost for everything below a game node (activities, lessons, guardian, review).
   - reportAttempt → engine.updateMastery → data.saveMastery + data.recordAttempt (stored locally, synced later)
   - a play session for the active child (start, touch every minute, end on unmount)
   - react() → companion/Lumi reaction events (CompanionBuddy) + sound and haptics
   - t() renders child-facing templates with the child's names and grammatical genders
   Activities never import this file; they use useActivityHost() from @/activities. */
import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { ActivityHostProvider } from '@/activities'
import { FALLBACK_CHILD_NAME, pickPhraseFor, renderTemplate, templateContext } from '@/content'
import type { TemplateContext } from '@/content'
import { createRng, isCompletionOnly, normaliseDivMethod, normaliseSubMethod, normaliseTableMethod, updateMastery } from '@/engine'
import { getMastery, recordAttempt, saveMastery, startSession, touchSession, endSession, updateChild, useActiveChild } from '@/data'
import { haptics, sfx } from '@/audio'
import type {
  ActivityHost, AttemptRecord, ChildProfile, ErrorType, MasteryMap, ReactionKind, Rng, SessionRecord,
  SfxName,
} from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import type { GameHostProviderProps } from '../contracts'


export interface ReactionEvent {
  id: number
  kind: ReactionKind
  /** Already rendered (child-facing, companion voice). */
  phrase: string
  errorType?: ErrorType
}

type Listener = (e: ReactionEvent) => void

interface BuddyBus {
  subscribe(listener: Listener): () => void
}

const BuddyBusContext = createContext<BuddyBus | null>(null)

/** Used by CompanionBuddy to receive reactions. Null outside a GameHostProvider. */
export function useBuddyBus(): BuddyBus | null {
  return useContext(BuddyBusContext)
}

const FALLBACK_CONTEXT: TemplateContext = {
  childName: FALLBACK_CHILD_NAME,
  childGender: 'm',
  petName: 'Bigotes',
  petGender: 'm',
  petSpecies: 'cat',
}

const SESSION_TOUCH_MS = 60_000

/** Sound and haptics for each reaction kind. Gentle: no buzzing on mistakes. */
function feedbackFor(kind: ReactionKind): { sfx?: SfxName; haptic?: 'success' | 'tap' } {
  switch (kind) {
    case 'correct': return { sfx: 'correct', haptic: 'success' }
    case 'streak': return { sfx: 'streak', haptic: 'success' }
    case 'celebrate': return { sfx: 'fanfare', haptic: 'success' }
    case 'wrong': return { sfx: 'wrong', haptic: 'tap' }
    case 'hint': return { sfx: 'hint' }
    default: return {}
  }
}

function hashSeed(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function contextOf(child: ChildProfile | null): TemplateContext {
  return child ? templateContext(child) : FALLBACK_CONTEXT
}

function prefsOf(child: ChildProfile | null) {
  const s = child?.settings ?? DEFAULT_CHILD_SETTINGS
  return {
    timedActivities: s.timedActivities,
    bigCells: s.bigCells,
    voice: s.voice,
    handedness: s.handedness,
    subMethod: normaliseSubMethod(s.subMethod),
    divMethod: normaliseDivMethod(s.divMethod),
    tableMethod: normaliseTableMethod(s.tableMethod),
  }
}

function reportError(where: string, e: unknown) {
  if (import.meta.env.DEV) console.warn(`[game-host] ${where}`, e)
}

export function GameHostProvider({ worldId, nodeId, activity, subject = 'math', children }: GameHostProviderProps) {
  const { child } = useActiveChild()
  const childId = child?.id ?? null

  // Latest child without re-creating the host object on every live-query tick.
  const childRef = useRef<ChildProfile | null>(child)
  childRef.current = child

  const masteryRef = useRef<MasteryMap>({})
  const sessionRef = useRef<{ id: string | null; startedAt: number; attempts: number; correct: number }>({
    id: null, startedAt: Date.now(), attempts: 0, correct: 0,
  })
  const listenersRef = useRef(new Set<Listener>())
  const eventIdRef = useRef(0)
  const bus = useMemo<BuddyBus>(() => ({
    subscribe(listener) {
      listenersRef.current.add(listener)
      return () => { listenersRef.current.delete(listener) }
    },
  }), [])

  // Mastery for this child (loaded once per child).
  useEffect(() => {
    let cancelled = false
    masteryRef.current = {}
    if (!childId) return
    getMastery(childId)
      .then((m) => { if (!cancelled) masteryRef.current = m })
      .catch((e) => reportError('getMastery', e))
    return () => { cancelled = true }
  }, [childId])

  // Play session for this child: started on mount, touched every minute, ended on unmount.
  useEffect(() => {
    if (!childId) return
    const session = sessionRef.current
    session.startedAt = Date.now()
    session.attempts = 0
    session.correct = 0
    session.id = null
    let open = true
    let timer: ReturnType<typeof setInterval> | undefined
    startSession(childId, subject)
      .then((s: SessionRecord) => {
        if (!open) {
          // Unmounted before the session was created: close it right away.
          void endSession(s.id, null).catch((e) => reportError('endSession', e))
          return
        }
        session.id = s.id
        timer = setInterval(() => {
          if (!session.id) return
          const minutes = Math.max(0, Math.round((Date.now() - session.startedAt) / 60_000))
          void touchSession(session.id, { minutes }).catch((e) => reportError('touchSession', e))
        }, SESSION_TOUCH_MS)
      })
      .catch((e) => reportError('startSession', e))
    return () => {
      open = false
      if (timer) clearInterval(timer)
      const id = session.id
      session.id = null
      if (id) {
        const minutes = Math.max(0, Math.round((Date.now() - session.startedAt) / 60_000))
        void endSession(id, {
          attempts: session.attempts,
          correct: session.correct,
          starsEarned: 0,
          nodesCompleted: [],
          ...(subject === 'language' ? { subject } : {}),
        }).catch((e) => reportError('endSession', e))
        void touchSession(id, { minutes }).catch(() => undefined)
      }
    }
  }, [childId, subject])

  const host = useMemo<ActivityHost>(() => {
    const ctx = contextOf(child)
    // Seeded from who plays and where, so one activity run is reproducible for its seed.
    const rng: Rng = createRng(hashSeed(`${childId ?? 'none'}|${worldId ?? ''}|${nodeId ?? ''}|${activity ?? ''}|${Date.now()}`))
    const phraseRng: Rng = createRng(hashSeed(`${childId ?? 'none'}|phrase|${nodeId ?? ''}`))
    const t = (template: string) => renderTemplate(template, ctx)

    const reportAttempt: ActivityHost['reportAttempt'] = (attempt) => {
      const c = childRef.current
      if (!c) return
      const { exercise, check, ms, inputMode, hintsUsed, recognitionFixes, method, retries, solvedOnRetry, graded = true } = attempt
      const skill = exercise.skill
      const now = new Date()
      // A retry (graded: false) is saved with its retries, but only the first answer grades mastery and the session.
      // A completion-only text (escritura guiada) is not graded, but finishing it counts as done: its mastery moves.
      const next = graded || isCompletionOnly(exercise.kind) ? updateMastery(
        masteryRef.current[skill],
        { skill, correct: check.correct, ms, inputMode, hintsUsed, errorType: check.errorType ?? null },
        now,
      ) : null
      if (next) masteryRef.current = { ...masteryRef.current, [skill]: next }

      const session = sessionRef.current
      if (graded) {
        session.attempts += 1
        if (check.correct) session.correct += 1
      }

      const record: AttemptRecord = {
        id: crypto.randomUUID(),
        childId: c.id,
        sessionId: session.id,
        skill,
        kind: exercise.kind,
        correct: check.correct,
        given: check.given,
        expected: check.expected,
        ms,
        inputMode,
        hintsUsed,
        errorType: check.errorType ?? null,
        recognitionFixes: recognitionFixes ?? 0,
        ...(retries ? { retries } : {}),
        ...(solvedOnRetry ? { solvedOnRetry } : {}),
        ...(graded ? {} : { graded: false }),
        context: {
          ...(worldId ? { worldId } : {}),
          ...(nodeId ? { nodeId } : {}),
          ...(activity ? { activity } : {}),
          ...(worldId ? {} : { free: true }),
          ...(method ? { method } : {}),
        },
        createdAt: now.toISOString(),
      }
      recordAttempt(record).catch((e) => reportError('recordAttempt', e))
      if (next) saveMastery(c.id, [next]).catch((e) => reportError('saveMastery', e))
    }

    const react: ActivityHost['react'] = (kind, detail) => {
      const fx = feedbackFor(kind)
      if (fx.sfx) sfx.play(fx.sfx)
      if (fx.haptic === 'success') haptics.success()
      else if (fx.haptic === 'tap') haptics.tap()
      const c = childRef.current
      const phrase = c
        ? renderTemplate(pickPhraseFor('companion', kind, phraseRng, detail?.errorType), contextOf(c))
        : ''
      eventIdRef.current += 1
      const event: ReactionEvent = { id: eventIdRef.current, kind, phrase, errorType: detail?.errorType }
      listenersRef.current.forEach((l) => l(event))
    }

    const setPreference: NonNullable<ActivityHost['setPreference']> = (key, value) => {
      const c = childRef.current
      if (!c) return
      updateChild(c.id, { settings: { ...c.settings, [key]: value } }).catch((e) => reportError('setPreference', e))
    }

    return {
      reportAttempt,
      react,
      rng,
      get mastery() { return masteryRef.current },
      t,
      prefs: prefsOf(child),
      setPreference,
    }
    // The child's name and genders feed t(); the ids decide persistence and seeds.
  }, [childId, worldId, nodeId, activity, child?.nickname, child?.gender, child?.companion?.name,
    child?.companion?.gender, child?.companion?.species, child?.settings?.timedActivities,
    child?.settings?.bigCells, child?.settings?.voice, child?.settings?.handedness, child?.settings?.subMethod, child?.settings?.divMethod, child?.settings?.tableMethod])

  return (
    <BuddyBusContext.Provider value={bus}>
      <ActivityHostProvider value={host}>{children}</ActivityHostProvider>
    </BuddyBusContext.Provider>
  )
}

export default GameHostProvider
