/* Shared context of the ink module: recogniser, input mode, child preferences and the learning store. */
import { createContext, useContext } from 'react'
import type { AnswerInputPreference, DigitRecognition, DigitRecognizer, InkSample, InputMode } from '@/types'
import { addInkSample } from '@/data'
import { createRecognizer } from './ml/recognizer'
import { ALT_CHIPS, PENDING_TTL_MS } from './constants'
import { hasEmbedding, makeSample, selectPersonalSamples, selectSamples, type PersonalSampleLite } from './learning'
import { detectPhone, detectTouchDevice, forgetPenSeen, readPenSeen, resolveInputMode } from './policy'

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

/** One handwritten digit as the app read it (kept while its ink is on screen, for the misread checks and the review log). */
export interface InkRead {
  digit: number
  confidence: number
  /** The next most likely digits (without `digit`), best first, at most ALT_CHIPS. */
  alternatives: number[]
  /** The probability of each alternative (same order). A read whose alternatives are all near 0 was clear. */
  altP: number[]
  /** A carry cell (the small one on top): not part of the number the child answers. */
  carry?: boolean
  /** The read needed the child's confirmation (low confidence or a confusable pair). */
  doubtful: boolean
  /** The child confirmed it or picked it. */
  confirmed: boolean
  /** 28×28 normalised image of the ink (0..1), when the recogniser gave one. */
  image28?: Float32Array
}

/** What an ink surface (a DigitCell, a NumberInput pad) lets the store do on it. */
export interface InkSurfaceApi {
  /** Recognise pending ink right now. Returns true when there was some. */
  flush(): boolean
  /** Erase this surface (or only the digit `readKey` of it) and give it the focus. */
  rewrite(readKey?: string): void
  /** Open the "¿Qué número es?" picker on the unread digit `readKey`. */
  pick(readKey?: string): void
  /** The child says the digit `readKey` is `digit` (as if she had picked it in the alternatives). */
  choose?(readKey: string | undefined, digit: number): void
}

/** A question the ink layer asks before grading (misread digit, reversed number, unread ink). */
export interface InkQuestion {
  kind: 'misread' | 'reversed' | 'unknown'
  text: string
  /** Who asked (an answer flow): when it moves on to another exercise or unmounts, its question goes. */
  owner?: object
  /** The digit (or surface) the question is about: when it leaves the screen, the question goes too. */
  key?: string
  /** Spoken version (the voice says it without symbols). */
  speak?: string
  /** The number shown in print, big ("He leído 47"). */
  shown?: string
  actions: { label: string; primary?: boolean; run: () => void }[]
}

/** The alternatives of a recognition without the digit itself, best first, with their probabilities. */
function altsOf(rec: DigitRecognition, digit: number): { digits: number[]; p: number[] } {
  const alts = rec.alternatives.filter((a) => a.digit !== digit).slice(0, ALT_CHIPS)
  return { digits: alts.map((a) => a.digit), p: alts.map((a) => a.p) }
}

/**
 * Collects recognitions of the cells used since the last confirm/discard. After a correct answer the activity
 * calls confirm(): those digits become 'confirmed' personal samples. Picking an alternative chip stores a
 * 'corrected' sample right away (the child told us what they meant) and counts as a recognition fix.
 */
export class LearningStore {
  private pending = new Map<string, Pending>()
  private fixes = 0
  /** Digits read with low confidence and not yet confirmed or rewritten by the child, by cell key. */
  private doubts = new Map<string, number>()
  private promptOpen = false
  /** Cells or pad digits whose ink could not be read ("?"), by key. */
  private unknowns = new Set<string>()
  /** Why a key could not be read, when the cell knows (two digits in one cell). */
  private unknownWhy = new Map<string, string>()
  /** Digits read from ink on screen, by key (`uid` of a cell, `uid:segment` of a pad digit). */
  private reads = new Map<string, InkRead>()
  /** Mounted ink surfaces, by uid. */
  private surfaces = new Map<string, InkSurfaceApi>()
  /** Surfaces with ink not recognised yet (writing, or waiting for the pause). */
  private busy = new Set<string>()
  private question: InkQuestion | null = null
  /** Mounted prompts (<DoubtPrompt/>): questions are only asked while someone shows them. */
  private prompts = 0
  /** Mounted answer bars with their own «Comprobar». */
  private bars = 0
  /** A digit was typed (keyboard or on-screen keypad) since the last confirm/discard. */
  private typedInput = false
  /** Random source of the masking questions (tests inject a seeded one). */
  random: () => number = Math.random
  private listeners = new Set<() => void>()
  /** Changes on every doubt change: subscribers read it through useSyncExternalStore. */
  version = 0
  samples: InkSample[] = []
  childId: string | null = null
  recognizer: Recognizer | null = null

  /** Points the store at the active child and recogniser (clears pending work and samples). */
  configure(childId: string | null, recognizer: Recognizer | null): void {
    this.childId = childId
    this.recognizer = recognizer
    this.discard()
    this.doubts.clear()
    this.unknowns.clear()
    this.reads.clear()
    this.question = null
    this.typedInput = false
    this.promptOpen = false
    this.setSamples([])
  }

  report(key: string, digit: number, rec: DigitRecognition): void {
    if (!hasEmbedding(rec)) return
    this.prune()
    this.pending.set(key, { digit, rec, at: Date.now() })
  }

  forget(key: string): void {
    this.pending.delete(key)
    this.reads.delete(key)
    this.known(key)
    this.settle(key)
  }

  forgetPrefix(prefix: string): void {
    for (const k of [...this.pending.keys()]) if (k.startsWith(prefix)) this.pending.delete(k)
    for (const k of [...this.reads.keys()]) if (k.startsWith(prefix)) this.reads.delete(k)
    for (const k of [...this.unknowns]) if (k.startsWith(prefix)) this.known(k)
    for (const k of [...this.doubts.keys()]) if (k.startsWith(prefix)) this.settle(k)
  }

  // ---------------------------------------------------------------------------------------- reads and surfaces

  /** A digit was read from ink (recorded also when the recogniser gives no embedding). */
  noteRead(key: string, rec: DigitRecognition, doubtful: boolean, opts: { carry?: boolean } = {}): void {
    if (rec.digit == null) return
    this.known(key)
    const alts = altsOf(rec, rec.digit)
    this.reads.set(key, {
      digit: rec.digit, confidence: rec.confidence, alternatives: alts.digits, altP: alts.p, doubtful, confirmed: false,
      ...(opts.carry ? { carry: true } : {}),
      ...(rec.image28 ? { image28: rec.image28 } : {}),
    })
  }

  /** The child picked (or confirmed) the digit of this read: it is hers now. */
  confirmRead(key: string, digit: number): void {
    const r = this.reads.get(key)
    if (r) this.reads.set(key, { ...r, digit, confidence: 1, confirmed: true })
  }

  private isLive(key: string): boolean {
    return this.surfaces.has(key) || this.surfaces.has(key.split(':')[0])
  }

  /** Reads of the surfaces still on screen, in the order they were written. */
  liveReads(): { key: string; read: InkRead }[] {
    return [...this.reads].filter(([k]) => this.isLive(k)).map(([key, read]) => ({ key, read }))
  }

  /** Ink that could not be read ("?"): grading waits until the child picks or rewrites the digit. */
  unknown(key: string, why?: string): void {
    this.reads.delete(key)
    if (why) this.unknownWhy.set(key, why)
    else this.unknownWhy.delete(key)
    if (this.unknowns.has(key)) return
    this.unknowns.add(key)
    this.changed()
  }

  /** This key is no longer an unread "?". */
  known(key: string): void {
    this.unknownWhy.delete(key)
    if (!this.unknowns.delete(key)) return
    if (this.question?.kind === 'unknown' && this.liveUnknowns().length === 0) this.question = null
    this.changed()
  }

  private liveUnknowns(): string[] {
    return [...this.unknowns].filter((k) => this.isLive(k))
  }

  registerSurface(uid: string, api: InkSurfaceApi): () => void {
    this.surfaces.set(uid, api)
    return () => {
      if (this.surfaces.get(uid) === api) this.surfaces.delete(uid)
      this.setBusy(uid, false)
      // A question about ink that left the screen has nothing to point at any more.
      const q = this.question
      if (q && ((q.key && !this.isLive(q.key)) || (q.kind === 'unknown' && this.liveUnknowns().length === 0))) this.closeQuestion()
    }
  }

  /** A surface has ink that is not recognised yet (true) or not any more (false). */
  setBusy(uid: string, busy: boolean): void {
    if (busy === this.busy.has(uid)) return
    if (busy) this.busy.add(uid)
    else this.busy.delete(uid)
    this.changed()
  }

  /** Some ink on screen is still being written or waiting to be read. */
  isBusy(): boolean {
    return this.busy.size > 0
  }

  /** Recognise every pending ink on screen right now (before grading). Returns true when something was read. */
  flushInk(): boolean {
    let flushed = false
    for (const s of [...this.surfaces.values()]) {
      try { flushed = s.flush() || flushed } catch (err) { console.warn('[ink] flush failed', err) }
    }
    return flushed
  }

  /** Erases the digit of a read (or a whole surface) and focuses it, so the child writes it again. */
  rewrite(key: string): void {
    const s = this.surfaces.get(key) ?? this.surfaces.get(key.split(':')[0])
    s?.rewrite(key.includes(':') ? key : undefined)
  }

  /** Sets the digit of a read to what the child says it is (a question's «No, el 7 es un 2»). */
  choose(key: string, digit: number): void {
    const s = this.surfaces.get(key) ?? this.surfaces.get(key.split(':')[0])
    s?.choose?.(key.includes(':') ? key : undefined, digit)
  }

  // ---------------------------------------------------------------------------------------- typed input

  noteTyped(): void {
    this.typedInput = true
  }

  /** A digit was typed (not written) since the last confirm/discard. */
  wasTyped(): boolean {
    return this.typedInput
  }

  // ---------------------------------------------------------------------------------------- questions

  /** <DoubtPrompt/> announces itself: questions are only asked while a prompt is mounted to show them. */
  mountPrompt(): () => void {
    this.prompts++
    return () => {
      this.prompts--
      if (this.prompts <= 0) this.question = null
    }
  }

  canAsk(): boolean {
    return this.prompts > 0
  }

  /** An answer bar with its own «Comprobar» mounts: pads hide their ✓ (one check button per screen). */
  mountBar(): () => void {
    this.bars++
    this.changed()
    return () => {
      this.bars--
      this.changed()
    }
  }

  hasBar(): boolean {
    return this.bars > 0
  }

  ask(q: InkQuestion): void {
    this.question = q
    this.changed()
  }

  currentQuestion(): InkQuestion | null {
    return this.question
  }

  /** Closes the open question. With `owner`, only a question that owner asked (a flow leaving its exercise). */
  closeQuestion(owner?: object): void {
    if (!this.question) return
    if (owner && this.question.owner !== owner) return
    this.question = null
    this.changed()
  }

  /** A digit was read below LOW_CONFIDENCE: the child must confirm it (or rewrite it) before the answer is graded. */
  doubt(key: string, digit: number): void {
    if (this.doubts.get(key) === digit) return
    this.doubts.set(key, digit)
    this.changed()
  }

  /** The child confirmed or rewrote this cell: its digit is no longer in doubt. */
  settle(key: string): void {
    if (!this.doubts.delete(key)) return
    if (this.doubts.size === 0) this.promptOpen = false
    this.changed()
  }

  /** Number of digits still in doubt (0 = every digit is certain, so the answer may be graded). */
  uncertain(): number {
    return this.doubts.size
  }

  /** The digits still in doubt, in the order they were written. */
  uncertainDigits(): number[] {
    return [...this.doubts.values()]
  }

  /** The keys of the digits still in doubt, in the order they were written. */
  uncertainKeys(): string[] {
    return [...this.doubts.keys()]
  }

  /** The child said the digits are right ("Sí, es así"): they count as certain now. */
  confirmDoubts(): void {
    if (this.doubts.size === 0 && !this.promptOpen) return
    for (const [k, d] of this.doubts) this.confirmRead(k, d)
    this.doubts.clear()
    this.promptOpen = false
    this.changed()
  }

  /**
   * Called when the child tries to grade while a digit is in doubt. Opens the "¿Has escrito…?" prompt and returns
   * true: the caller must not grade the answer.
   */
  requestConfirm(owner?: object): boolean {
    const unread = this.canAsk() ? this.liveUnknowns() : []
    if (unread.length) {
      // Ink that could not be read is never graded as an empty cell: the child says which digit it is.
      const key = unread[0]
      this.question = {
        kind: 'unknown',
        key,
        ...(owner ? { owner } : {}),
        text: this.unknownWhy.get(key) ?? 'No he entendido este número. Toca el que has escrito o escríbelo otra vez.',
        actions: [{ label: 'Lo escribo otra vez', run: () => { this.closeQuestion(); this.rewrite(key) } }],
      }
      this.changed()
      ;(this.surfaces.get(key) ?? this.surfaces.get(key.split(':')[0]))?.pick(key.includes(':') ? key : undefined)
      return true
    }
    if (this.question) return true
    if (this.doubts.size === 0) return false
    if (!this.promptOpen) {
      this.promptOpen = true
      this.changed()
    }
    return true
  }

  isPromptOpen(): boolean {
    return this.promptOpen
  }

  dismissPrompt(): void {
    if (!this.promptOpen) return
    this.promptOpen = false
    this.changed()
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private changed(): void {
    this.version++
    for (const fn of [...this.listeners]) fn()
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
    this.typedInput = false
    this.push()
  }

  discard(): void {
    this.pending.clear()
    this.fixes = 0
    this.typedInput = false
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
    mode: resolveInputMode({ preference: 'auto', penSeen, isTouchDevice, isPhone: detectPhone() }),
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
