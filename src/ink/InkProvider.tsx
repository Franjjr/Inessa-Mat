/* <InkProvider childId?> — wraps the app. Loads the digit recogniser once, loads the child's personal
   handwriting samples into it, tracks pen usage (palm rejection) and resolves the answer input mode. */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AnswerInputPreference } from '@/types'
import { listInkSamples, updateChild, useActiveChild } from '@/data'
import { InkContext, LearningStore, getSharedRecognizer, loadRecognizer, type InkContextValue, type Recognizer } from './context'
import { DoubtPrompt } from './DoubtPrompt'
import { detectPhone, detectTouchDevice, forgetPenSeen, persistPenSeen, persistTouchSeen, trackPenEvent, readPenSeen, readTouchSeen, resolveInputMode } from './policy'

export interface InkProviderProps {
  children: ReactNode
  childId?: string | null
  /** Inject a recogniser (tests, gallery demos). Defaults to the app-wide one from src/ink/ml. */
  recognizer?: Recognizer
  /** Force "a pen has been used on this device" for this subtree (tests, gallery demos); not persisted. */
  penSeen?: boolean
}

export function InkProvider({ children, childId = null, recognizer: injected, penSeen: forcedPenSeen }: InkProviderProps) {
  const recognizer = useMemo(() => injected ?? getSharedRecognizer(), [injected])
  const [ready, setReady] = useState<boolean>(() => !!recognizer.ready)
  const [learning] = useState(() => new LearningStore())

  // ---- recogniser
  useEffect(() => {
    let alive = true
    loadRecognizer(recognizer).then((ok) => { if (alive) setReady(ok) })
    return () => { alive = false }
  }, [recognizer])

  // ---- personal samples of the active child
  useEffect(() => {
    const store = learning
    store.configure(childId, recognizer)
    if (!childId) return
    let alive = true
    listInkSamples(childId)
      .then((list) => { if (alive) store.setSamples(list) })
      .catch((err: unknown) => console.warn('[ink] could not load handwriting samples', err))
    return () => { alive = false }
  }, [childId, recognizer, learning])

  // ---- child preferences
  const { child } = useActiveChild()
  const settings = child && child.id === childId ? child.settings : null
  // setPreferred() applies at once; the stored setting wins again as soon as it changes (saved, or edited by an adult).
  const [override, setOverride] = useState<{ childId: string | null; pref: AnswerInputPreference; base: AnswerInputPreference | undefined } | null>(null)
  const stored = settings?.inputPreference
  const preference: AnswerInputPreference =
    override && override.childId === childId && override.base === stored ? override.pref : stored ?? 'auto'

  const childRef = useRef(child)
  useEffect(() => { childRef.current = child }, [child])

  const setPreferred = useCallback((pref: AnswerInputPreference) => {
    const c0 = childRef.current
    setOverride({ childId, pref, base: c0 && c0.id === childId ? c0.settings.inputPreference : undefined })
    const c = childRef.current
    if (childId && c && c.id === childId && c.settings.inputPreference !== pref) {
      updateChild(childId, { settings: { ...c.settings, inputPreference: pref } }).catch((err: unknown) =>
        console.warn('[ink] could not save input preference', err),
      )
    }
  }, [childId])

  // ---- pen detection (palm rejection) and physical keyboard detection
  const [detectedPenSeen, setPenSeen] = useState<boolean>(readPenSeen)
  const penSeen = forcedPenSeen ?? detectedPenSeen
  const penSeenRef = useRef(detectedPenSeen)
  // A finger on the screen of a computer with a touch screen: from then on it answers like a tablet.
  const [isTouchDevice, setTouchDevice] = useState<boolean>(() => detectTouchDevice() || readTouchSeen())
  const touchSeenRef = useRef(isTouchDevice)
  useEffect(() => {
    const onPen = (e: PointerEvent) => trackPenEvent(e)
    const onDown = (e: PointerEvent) => {
      trackPenEvent(e)
      if (e.pointerType === 'pen' && e.isTrusted && !penSeenRef.current) {
        penSeenRef.current = true
        persistPenSeen()
        setPenSeen(true)
      }
      if (e.pointerType === 'touch' && e.isTrusted && !touchSeenRef.current) {
        touchSeenRef.current = true
        persistTouchSeen()
        setTouchDevice(true)
      }
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('pointermove', onPen, { capture: true, passive: true })
    window.addEventListener('pointerup', onPen, true)
    window.addEventListener('pointercancel', onPen, true)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('pointermove', onPen, { capture: true })
      window.removeEventListener('pointerup', onPen, true)
      window.removeEventListener('pointercancel', onPen, true)
    }
  }, [])

  const forgetPen = useCallback(() => {
    forgetPenSeen()
    penSeenRef.current = false
    setPenSeen(false)
  }, [])

  const [keyboardUsed, setKeyboardUsed] = useState(false)
  const noteKeyboard = useCallback(() => setKeyboardUsed(true), [])

  const [isPhone] = useState(detectPhone)
  const mode = resolveInputMode({ preference, penSeen, isTouchDevice, keyboardUsed, isPhone })

  // Lets the styles know how the child answers (the keypad mode uses smaller cells).
  useEffect(() => {
    const root = document.documentElement
    root.dataset.inputMode = mode
    return () => { delete root.dataset.inputMode }
  }, [mode])

  const bigCells = settings?.bigCells ?? false
  const handedness = settings?.handedness ?? 'right'

  const value = useMemo<InkContextValue>(() => ({
    recognizer,
    ready,
    childId,
    mode,
    preference,
    setPreferred,
    isTouchDevice,
    penSeen,
    forgetPen,
    noteKeyboard,
    bigCells,
    handedness,
    learning,
    provided: true,
  }), [recognizer, ready, childId, mode, preference, setPreferred, isTouchDevice, penSeen, forgetPen, noteKeyboard, bigCells, handedness, learning])

  return (
    <InkContext.Provider value={value}>
      {children}
      <DoubtPrompt />
    </InkContext.Provider>
  )
}
