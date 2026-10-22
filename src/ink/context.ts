/* Shared context of the ink module: recogniser, input mode, child preferences and the learning store. */
import { createContext, useContext } from 'react'
import type { AnswerInputPreference, DigitRecognition, DigitRecognizer, InkSample, InputMode } from '@/types'
import { addInkSample } from '@/data'
import { createRecognizer } from './ml/recognizer'
import { PENDING_TTL_MS } from './constants'
import { hasEmbedding, makeSample, selectPersonalSamples, selectSamples, type PersonalSampleLite } from './learning'
import { detectTouchDevice, forgetPenSeen, readPenSeen, resolveInputMode } from './policy'

/** What the ink UI needs from a recogniser (src/ink/ml/recognizer.ts provides it; tests/gallery may fake it). */
export type Recognizer = DigitRecognizer & { setPersonalSamples(samples: PersonalSampleLite[]): void }

// ------------------------------------------------------------------------------------------ recogniser singleton

let shared: Recognizer | null = null
const loads = new WeakMap<object, Promise<boolean>>()

/** One recogniser per app (the CNN weights are a few hundred KB; never load them twice). */
export function getSharedRecognizer(): Recognizer {
  if (!shared) shared = createRecognizer()
  return shared
}

/** Loads a recogniser once; resolves to its readiness. A failed load can be retried by a later call. */
export function loadRecognizer(r: Recognizer): Promise<boolean> {
  let p = loads.get(r)
  if (!p) {
    p = Promise.resolve()
      .then(() => r.load())
      .then(() => !!r.ready)
      .catch((err: unknown) => {
        console.warn('[ink] digit recogniser failed to load', err)
        loads.delete(r)
        return false
      })
    loads.set(r, p)
  }
  return p
}

// ------------------------------------------------------------------------------------------ learning store

interface Pending { digit: number; rec: DigitRecognition; at: number }

/**
 * Collects recognitions of the cells used since the last confirm/discard. After a correct answer the activity
 * calls confirm(): those digits become 'confirmed' personal samples. Picking an alternative chip stores a
 * 'corrected' sample right away (the child told us what they meant) and counts as a recognition fix.
 */
export class LearningStore {
  private pending = new Map<string, Pending>()
  private fixes = 0
  samples: InkSample[] = []
  childId: string | null = null
  recognizer: Recognizer | null = null

  /** Points the store at the active child and recogniser (clears pending work and samples). */
  configure(childId: string | null, recognizer: Recognizer | null): void {
    this.childId = childId
    this.recognizer = recognizer
    this.discard()
    this.setSamples([])
  }

  report(key: string, digit: number, rec: DigitRecognition): void {
    if (!hasEmbedding(rec)) return
    this.prune()
    this.pending.set(key, { digit, rec, at: Date.now() })
  }

  forget(key: string): void {
    this.pending.delete(key)
  }

  forgetPrefix(prefix: string): void {
    for (const k of [...this.pending.keys()]) if (k.startsWith(prefix)) this.pending.delete(k)
  }

  countFix(): void {
    this.fixes++
  }

  recognitionFixes(): number {
    return this.fixes
  }

  corrected(digit: number, rec: DigitRecognition | null): void {
    if (rec) this.store(digit, rec, 'corrected')
  }

  /**
   * Stores a calibration sample. `childId` is the child being calibrated (onboarding may run before that child
   * is the active one); it defaults to the store's child.
   */
  calibration(digit: number, rec: DigitRecognition, childId: string | null = this.childId): boolean {
    return this.store(digit, rec, 'calibration', true, childId)
  }

  confirm(): void {
    this.prune()
    for (const p of this.pending.values()) this.store(p.digit, p.rec, 'confirmed', false)
    this.pending.clear()
    this.fixes = 0
    this.push()
  }

  discard(): void {
    this.pending.clear()
    this.fixes = 0
  }

  /** Replaces the in-memory set (e.g. loaded from the database); only the newest samples per digit are kept. */
  setSamples(list: readonly InkSample[]): void {
    this.samples = selectSamples(list)
    this.push()
  }

  private store(digit: number, rec: DigitRecognition, source: InkSample['source'], push = true, childId = this.childId): boolean {
    if (!hasEmbedding(rec) || !Number.isInteger(digit) || digit < 0 || digit > 9) return false
    const sample = makeSample(childId ?? 'local', digit, rec, source)
    if (childId) addInkSample(sample).catch((err: unknown) => console.warn('[ink] could not store sample', err))
    // Only the active child's samples personalise the shared recogniser (none active: the child being calibrated).
    if (this.childId == null || childId === this.childId) {
      this.samples = selectSamples([...this.samples, sample])
      if (push) this.push()
    }
    return true
  }

  private push(): void {
    try {
      this.recognizer?.setPersonalSamples(selectPersonalSamples(this.samples))
    } catch (err) {
      console.warn('[ink] setPersonalSamples failed', err)
    }
  }

  private prune(): void {
    const limit = Date.now() - PENDING_TTL_MS
    for (const [k, p] of this.pending) if (p.at < limit) this.pending.delete(k)
    while (this.pending.size > 64) this.pending.delete(this.pending.keys().next().value as string)
  }
}

// ------------------------------------------------------------------------------------------ context

export interface InkContextValue {
  recognizer: Recognizer | null
  ready: boolean
  childId: string | null
  mode: InputMode
  preference: AnswerInputPreference
  setPreferred(pref: AnswerInputPreference): void
  isTouchDevice: boolean
  penSeen: boolean
  /** Forget that a pen was used on this device (fingers write again). For adult settings. */
  forgetPen(): void
  /** A physical keyboard digit was typed (auto mode on tablets switches to 'keyboard'). */
  noteKeyboard(): void
  bigCells: boolean
  handedness: 'left' | 'right'
  learning: LearningStore
  /** True inside an <InkProvider>. */
  provided: boolean
}

const fallbackLearning = new LearningStore()

function fallbackValue(): InkContextValue {
  const penSeen = readPenSeen()
  const isTouchDevice = detectTouchDevice()
  return {
    recognizer: null,
    ready: false,
    childId: null,
    mode: resolveInputMode({ preference: 'auto', penSeen, isTouchDevice }),
    preference: 'auto',
    setPreferred() {},
    isTouchDevice,
    penSeen,
    forgetPen: forgetPenSeen,
    noteKeyboard() {},
    bigCells: false,
    handedness: 'right',
    learning: fallbackLearning,
    provided: false,
  }
}

const fallbackHolder: { value: InkContextValue | null } = { value: null }
function getFallback(): InkContextValue {
  if (!fallbackHolder.value) fallbackHolder.value = fallbackValue()
  return fallbackHolder.value
}

export const InkContext = createContext<InkContextValue | null>(null)

/** Ink context; outside an <InkProvider> a static fallback (no recogniser, auto input mode) is used. */
export function useInk(): InkContextValue {
  return useContext(InkContext) ?? getFallback()
}
