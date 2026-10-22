/* The shared Web Audio engine: one AudioContext, a small mixing graph and the iOS/Chrome unlock dance.

   Graph:  sfx voices ──► sfxBus ─────────────┐
           music voices ► theme ► musicBus ► duck ─┤► master ► limiter ► destination
           sends ───────► reverbIn ► convolver ► reverbTone ► reverbOut ┘

   Autoplay rules: a context may only start inside a user activation. Chrome counts pointerup/touchend/click/keydown
   (not a touch pointerdown) and iOS counts touchend/click, so besides the app calling unlockAudio() we keep cheap
   capture listeners that resume the context whenever it is not running (iOS also "interrupts" it after calls, Siri
   or backgrounding). We never create the context before the page has seen a gesture, which avoids console noise
   and avoids a backlog of sounds firing at once on resume. */
import { clamp } from './notes'

export interface AudioEngine {
  ctx: AudioContext
  master: GainNode
  limiter: DynamicsCompressorNode
  sfxBus: GainNode
  musicBus: GainNode
  duck: GainNode
  reverbIn: GainNode
  noise: AudioBuffer
}

export const DEFAULT_LEVELS = { master: 1, sfx: 1, music: 0.28 } as const

/** Fixed makeup on the effects bus (+3 dB) so voices can keep their own gains <= 1 while matching speech loudness. */
const SFX_MAKEUP = 1.4

type StateListener = (state: string) => void
type VisibilityListener = (visible: boolean) => void
type GestureHook = () => void

let engine: AudioEngine | null = null
let gestureSeen = false
let listenersInstalled = false
let suspendedByUs = false
let hiddenTimer: ReturnType<typeof setTimeout> | undefined
let levels: { master: number; sfx: number; music: number } = { ...DEFAULT_LEVELS }
let analyser: AnalyserNode | null = null
/** False when both effects and music are off: no context is created/kept running (saves battery on tablets). */
let wanted = true
let idleTimer: ReturnType<typeof setTimeout> | undefined
const stateListeners = new Set<StateListener>()
const visibilityListeners = new Set<VisibilityListener>()
const gestureHooks = new Set<GestureHook>()

type AudioContextCtor = new (opts?: AudioContextOptions) => AudioContext

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

export function audioSupported(): boolean {
  return audioContextCtor() !== null
}

function hasBeenActive(): boolean {
  if (gestureSeen) return true
  const ua = (typeof navigator !== 'undefined' ? (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation : undefined)
  return !!ua?.hasBeenActive
}

function makeNoise(ctx: BaseAudioContext): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * 1.5)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/** Small, soft synthetic room (no files): decaying stereo noise with a gentle fade-in. */
function makeImpulse(ctx: BaseAudioContext, seconds = 1.6, decay = 3.4): AudioBuffer {
  const rate = ctx.sampleRate
  const len = Math.max(1, Math.floor(rate * seconds))
  const buf = ctx.createBuffer(2, len, rate)
  const fadeIn = Math.floor(rate * 0.012)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      const env = Math.exp(-decay * (i / len) * 2.2)
      const fi = i < fadeIn ? i / fadeIn : 1
      d[i] = (Math.random() * 2 - 1) * env * fi * 0.5
    }
  }
  return buf
}

/** Build the mixing graph on any context (the offline renderer reuses it). */
export function buildGraph(ctx: AudioContext): AudioEngine {
  const limiter = ctx.createDynamicsCompressor()
  // A transparent safety limiter: near 0 dB with a tiny knee, so the compressor's automatic makeup gain stays ~1
  // and only rare summed peaks are caught.
  limiter.threshold.value = -2
  limiter.knee.value = 2
  limiter.ratio.value = 20
  limiter.attack.value = 0.003
  limiter.release.value = 0.2
  limiter.connect(ctx.destination)

  const master = ctx.createGain()
  master.gain.value = levels.master
  master.connect(limiter)

  const sfxBus = ctx.createGain()
  sfxBus.gain.value = levels.sfx * SFX_MAKEUP
  sfxBus.connect(master)

  const duck = ctx.createGain()
  duck.gain.value = 1
  duck.connect(master)
  const musicBus = ctx.createGain()
  musicBus.gain.value = levels.music
  musicBus.connect(duck)

  const reverbIn = ctx.createGain()
  reverbIn.gain.value = 1
  const reverbOut = ctx.createGain()
  reverbOut.gain.value = 0.55
  reverbOut.connect(master)
  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = Math.min(5200, ctx.sampleRate * 0.45)
  tone.connect(reverbOut)
  if (typeof ctx.createConvolver === 'function') {
    const conv = ctx.createConvolver()
    reverbIn.connect(conv)
    conv.connect(tone)
    // Fill the impulse off the gesture path (a few ms of maths on slow tablets).
    const fill = () => {
      try { conv.buffer = makeImpulse(ctx) } catch { /* reverb is optional */ }
    }
    if (typeof (ctx as BaseAudioContext as OfflineAudioContext).startRendering === 'function') fill()
    else setTimeout(fill, 0)
  }

  return { ctx, master, limiter, sfxBus, musicBus, duck, reverbIn, noise: makeNoise(ctx) }
}

/**
 * The engine, created lazily once the page has had a user gesture. Returns null before that (sounds requested
 * before any gesture are simply skipped: they could not play anyway) or when Web Audio is unavailable.
 */
export function getEngine(): AudioEngine | null {
  if (engine) return engine
  const Ctor = audioContextCtor()
  if (!Ctor || !hasBeenActive()) return null
  installListeners()
  let ctx: AudioContext
  try {
    ctx = new Ctor({ latencyHint: 'interactive' })
  } catch {
    try { ctx = new Ctor() } catch { return null }
  }
  engine = buildGraph(ctx)
  ctx.onstatechange = () => {
    for (const l of [...stateListeners]) l(ctx.state)
  }
  return engine
}

/** The engine only if it already exists (never creates one). */
export function peekEngine(): AudioEngine | null {
  return engine
}

export function isRunning(): boolean {
  return engine?.ctx.state === 'running'
}

export function onStateChange(fn: StateListener): () => void {
  stateListeners.add(fn)
  return () => stateListeners.delete(fn)
}

export function onVisibility(fn: VisibilityListener): () => void {
  visibilityListeners.add(fn)
  return () => visibilityListeners.delete(fn)
}

/** Run inside every user gesture (speech warm-up on iOS, retrying music start…). */
export function onGesture(fn: GestureHook): () => void {
  gestureHooks.add(fn)
  return () => gestureHooks.delete(fn)
}

/** Must run synchronously inside a user gesture: resume + the classic iOS silent-buffer kick. */
function resumeInGesture(e: AudioEngine): void {
  const { ctx } = e
  if (ctx.state === 'closed') return
  try {
    const src = ctx.createBufferSource()
    src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
    src.connect(ctx.destination)
    src.onended = () => { try { src.disconnect() } catch { /* ignore */ } }
    src.start(0)
  } catch { /* ignore */ }
  if (ctx.state !== 'running') {
    const p = ctx.resume()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }
  suspendedByUs = false
}

function handleGesture(): void {
  gestureSeen = true
  const e = wanted ? getEngine() : engine
  if (e && wanted && e.ctx.state !== 'running' && !(typeof document !== 'undefined' && document.hidden)) resumeInGesture(e)
  for (const h of [...gestureHooks]) {
    try { h() } catch { /* a hook must never break the app's input handling */ }
  }
}

function handleVisibility(): void {
  const visible = !document.hidden
  clearTimeout(hiddenTimer)
  for (const l of [...visibilityListeners]) l(visible)
  const e = engine
  if (!e) return
  if (!visible) {
    // Let the music fade, then sleep the context to save battery.
    hiddenTimer = setTimeout(() => {
      if (document.hidden && e.ctx.state === 'running') {
        suspendedByUs = true
        e.ctx.suspend().catch(() => {})
      }
    }, 450)
  } else if (wanted && (suspendedByUs || e.ctx.state !== 'running')) {
    suspendedByUs = false
    const p = e.ctx.resume()
    if (p && typeof p.catch === 'function') p.catch(() => { /* the next gesture will resume it */ })
  }
}

const GESTURE_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'mousedown', 'keydown', 'click'] as const

export function installListeners(): void {
  if (listenersInstalled || typeof window === 'undefined') return
  listenersInstalled = true
  for (const type of GESTURE_EVENTS) window.addEventListener(type, handleGesture, { capture: true, passive: true })
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', handleVisibility)
}

/** Effects or music enabled? When neither is, the context sleeps (and is not even created on gestures). */
export function setAudioWanted(on: boolean): void {
  if (wanted === on) return
  wanted = on
  clearTimeout(idleTimer)
  const e = engine
  if (!e) return
  if (!on) {
    // Let fades finish, then sleep.
    idleTimer = setTimeout(() => {
      if (!wanted && e.ctx.state === 'running') {
        suspendedByUs = true
        e.ctx.suspend().catch(() => {})
      }
    }, 900)
  } else if (e.ctx.state !== 'running') {
    resumeQuietly()
  }
}

export function audioWanted(): boolean {
  return wanted
}

/** Try to resume outside a gesture (works after the page's first activation in most browsers; else the next tap does). */
export function resumeQuietly(): void {
  const e = engine
  if (!e || !wanted || e.ctx.state === 'running' || e.ctx.state === 'closed') return
  if (typeof document !== 'undefined' && document.hidden) return
  suspendedByUs = false
  const p = e.ctx.resume()
  if (p && typeof p.catch === 'function') p.catch(() => {})
}

/** Public unlock: call from a gesture handler. Idempotent and cheap. */
export function unlock(): void {
  installListeners()
  handleGesture()
}

export function setLevel(which: 'master' | 'sfx' | 'music', value: number): void {
  levels = { ...levels, [which]: clamp(value, 0, 1) }
  const e = engine
  if (!e) return
  const node = which === 'master' ? e.master : which === 'sfx' ? e.sfxBus : e.musicBus
  const target = levels[which] * (which === 'sfx' ? SFX_MAKEUP : 1)
  const now = e.ctx.currentTime
  node.gain.cancelScheduledValues(now)
  node.gain.setValueAtTime(node.gain.value, now)
  node.gain.linearRampToValueAtTime(target, now + 0.05)
}

export function getLevel(which: 'master' | 'sfx' | 'music'): number {
  return levels[which]
}

/** Lazily created analyser tapping the master bus (dev gallery visualiser). */
export function getAnalyser(): AnalyserNode | null {
  const e = engine
  if (!e) return null
  if (!analyser) {
    analyser = e.ctx.createAnalyser()
    analyser.fftSize = 1024
    e.limiter.connect(analyser)
  }
  return analyser
}

/** Test helper: forget the engine (module subscriptions stay registered). */
export function __resetEngineForTests(): void {
  if (engine) {
    try { void engine.ctx.close() } catch { /* ignore */ }
  }
  engine = null
  analyser = null
  gestureSeen = false
  suspendedByUs = false
  clearTimeout(hiddenTimer)
  clearTimeout(idleTimer)
  wanted = true
  levels = { ...DEFAULT_LEVELS }
  if (listenersInstalled && typeof window !== 'undefined') {
    for (const type of GESTURE_EVENTS) window.removeEventListener(type, handleGesture, { capture: true })
    document.removeEventListener('visibilitychange', handleVisibility)
  }
  listenersInstalled = false
}
