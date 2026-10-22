/* Speech via the Web Speech API, tuned for Spanish (Spain) and for 7–8-year-olds.
   - Picks the best Spanish voice (es-ES first; "Mónica" on iPad), reloading when voices arrive late (iOS polls).
   - Characters differ only slightly by pitch/rate: system voices sound robotic when the pitch moves far from 1.
   - The adult can pick the voice for this device (Ajustes); otherwise the best one is chosen automatically.
   - Queue by default; `interrupt: true` cuts in. say() always resolves (end, error, stop or watchdog), never rejects.
   - Text is cleaned and maths verbalised ("6 × 7 = 42" → "seis por siete son cuarenta y dos").
   - Music ducks while speaking. iOS needs a first speak() inside a gesture: a silent warm-up runs on the first tap.
   - Browser quirks handled: Chrome drops utterances that get garbage-collected (we keep a strong ref), cuts long
     ones (we chunk), iOS loses an utterance spoken right after cancel() (short pause), and some engines never fire
     'end' (watchdogs). */
import type { SpeechOptions } from '@/types'
import { onGesture, onVisibility, resumeQuietly } from './context'
import { music } from './music'
import { clamp } from './notes'
import { chunkForSpeech, toSpeakable } from './speechText'
import { isSpanish, pickBestVoice, scoreVoice } from './voices'

export type SpeechCharacter = NonNullable<SpeechOptions['voice']>

export const CHARACTERS: Record<SpeechCharacter, { pitch: number; rate: number }> = {
  lumi: { pitch: 1.04, rate: 0.95 },
  companion: { pitch: 1.1, rate: 1.0 },
  narrator: { pitch: 1.0, rate: 0.95 },
  guardian: { pitch: 0.94, rate: 0.9 },
}

const MAX_QUEUE = 4
const CANCEL_GAP_MS = 120

interface Job {
  chunks: string[]
  index: number
  opts: SpeechOptions
  resolve: () => void
  done: boolean
  retried: boolean
}

let enabled = true
let queue: Job[] = []
let current: Job | null = null
/** Strong reference to the utterance in flight (Chrome otherwise may GC it and never fire 'end'). */
let utterance: SpeechSynthesisUtterance | null = null
let watchdog: ReturnType<typeof setTimeout> | undefined
let startTimer: ReturnType<typeof setTimeout> | undefined
let unduckTimer: ReturnType<typeof setTimeout> | undefined
let voices: SpeechSynthesisVoice[] = []
let voicesLoaded = false
/** True once voices arrived or we stopped waiting for them (then "no Spanish voice" is a real answer). */
let voicesSettled = false
const badVoices = new Set<string>()
let wired = false
let warmed = false
let lastCancelAt = -Infinity

const nowMs = () => Date.now()

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
}

function UtteranceCtor(): typeof SpeechSynthesisUtterance | null {
  return typeof window !== 'undefined' && 'SpeechSynthesisUtterance' in window ? window.SpeechSynthesisUtterance : null
}

function isAppleWebKit(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const iPadOS = navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1
  return /iPad|iPhone|iPod/.test(ua) || iPadOS || (/Safari/.test(ua) && !/Chrome|Chromium|CriOS|Android|Edg/.test(ua))
}

function refreshVoices(): void {
  const s = synth()
  if (!s) return
  let list: SpeechSynthesisVoice[] = []
  try { list = s.getVoices() } catch { /* ignore */ }
  if (list.length) {
    voices = list
    voicesLoaded = true
    voicesSettled = true
  }
}

function wire(): void {
  if (wired) return
  wired = true
  const s = synth()
  if (!s) return
  refreshVoices()
  if (typeof s.addEventListener === 'function') s.addEventListener('voiceschanged', refreshVoices)
  else (s as SpeechSynthesis & { onvoiceschanged: unknown }).onvoiceschanged = refreshVoices
  // iOS often never fires 'voiceschanged': poll for a few seconds.
  let tries = 0
  const poll = () => {
    refreshVoices()
    if (voicesLoaded) return
    if (tries++ < 20) setTimeout(poll, 250)
    else voicesSettled = true
  }
  if (!voicesLoaded) setTimeout(poll, 250)
  onGesture(warmUp)
  onVisibility((visible) => { if (!visible) stopAll() })
}

/** iOS: the first speak() must happen inside a user gesture; a silent one unlocks later programmatic speech. */
function warmUp(): void {
  if (warmed || !isAppleWebKit()) return
  const s = synth()
  const U = UtteranceCtor()
  if (!s || !U) return
  warmed = true
  try {
    const u = new U(' ')
    u.volume = 0
    u.lang = 'es-ES'
    s.speak(u)
  } catch { /* ignore */ }
}

function online(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

const VOICE_KEY = 'numeria:voice'

const voiceId = (v: SpeechSynthesisVoice) => v.voiceURI || v.name

function preferredVoiceId(): string | null {
  try { return localStorage.getItem(VOICE_KEY) } catch { return null }
}

function bestVoice(): SpeechSynthesisVoice | null {
  if (!voicesLoaded) refreshVoices()
  const wanted = preferredVoiceId()
  if (wanted && !badVoices.has(wanted)) {
    const v = voices.find((x) => voiceId(x) === wanted && isSpanish(x))
    if (v && (v.localService || online())) return v
  }
  return pickBestVoice(voices, online(), badVoices)
}

function settle(job: Job | null | undefined): void {
  if (!job || job.done) return
  job.done = true
  job.resolve()
}

function clearTimers(): void {
  clearTimeout(watchdog)
  clearTimeout(startTimer)
}

function scheduleUnduck(): void {
  clearTimeout(unduckTimer)
  unduckTimer = setTimeout(() => {
    if (!current && queue.length === 0) music.duck(false)
  }, 250)
}

function stopAll(): void {
  for (const j of queue) settle(j)
  queue = []
  const had = current
  current = null
  settle(had)
  clearTimers()
  const s = synth()
  if (s && (had || s.speaking || s.pending)) {
    try { s.cancel() } catch { /* ignore */ }
    lastCancelAt = nowMs()
  }
  utterance = null
  scheduleUnduck()
}

function finishCurrent(): void {
  const job = current
  current = null
  utterance = null
  clearTimers()
  settle(job)
  // iOS sometimes leaves Web Audio "interrupted" after speech: wake it so the next effect is heard.
  resumeQuietly()
  if (queue.length) pump()
  else scheduleUnduck()
}

function pump(): void {
  if (current || queue.length === 0) return
  current = queue.shift() ?? null
  clearTimeout(unduckTimer)
  music.duck(true)
  speakNext()
}

function speakNext(): void {
  const job = current
  if (!job || job.done) return
  if (job.index >= job.chunks.length) {
    finishCurrent()
    return
  }
  const since = nowMs() - lastCancelAt
  if (since < CANCEL_GAP_MS) setTimeout(() => speakChunk(job), CANCEL_GAP_MS - since)
  else speakChunk(job)
}

function speakChunk(job: Job): void {
  if (job !== current || job.done) return
  const s = synth()
  const U = UtteranceCtor()
  if (!s || !U) {
    finishCurrent()
    return
  }
  const text = job.chunks[job.index]
  const voice = bestVoice()
  const char = CHARACTERS[job.opts.voice ?? 'lumi'] ?? CHARACTERS.lumi
  const u = new U(text)
  u.lang = voice?.lang?.replace('_', '-') || 'es-ES'
  if (voice) u.voice = voice
  u.pitch = clamp(char.pitch, 0.5, 2)
  u.rate = clamp(char.rate * (job.opts.rate ?? 1), 0.5, 1.6)
  u.volume = 1

  let finished = false
  let started = false
  const next = () => {
    if (finished) return
    finished = true
    clearTimers()
    if (job !== current || job.done) return
    job.index += 1
    speakNext()
  }
  u.onstart = () => { started = true }
  u.onend = next
  u.onerror = (ev: Event) => {
    const err = (ev as SpeechSynthesisErrorEvent).error
    if (job.done) {
      finished = true
      return
    }
    const voiceProblem = err === 'network' || err === 'synthesis-unavailable' || err === 'synthesis-failed' || err === 'voice-unavailable' || err === 'language-unavailable'
    if (voiceProblem && voice && !job.retried) {
      // e.g. a cloud voice while offline: never use it again this session and retry this chunk once.
      badVoices.add(voice.voiceURI || voice.name)
      job.retried = true
      finished = true
      clearTimers()
      speakChunk(job)
      return
    }
    next()
  }

  utterance = u
  try {
    if (s.paused) s.resume()
    s.speak(u)
  } catch {
    next()
    return
  }

  // Watchdogs: an utterance that never starts (no gesture yet on iOS) or never reports 'end'.
  startTimer = setTimeout(() => {
    if (!started && !finished && !s.speaking) next()
  }, 2500)
  const estimate = (text.length / (13 * u.rate)) * 1000 * 1.6 + 2500
  const check = (extra: boolean) => {
    watchdog = setTimeout(() => {
      if (finished) return
      if (extra && (s.speaking || s.pending)) check(false)
      else next()
    }, extra ? estimate : estimate / 2)
  }
  check(true)
}

export function say(text: string, opts: SpeechOptions = {}): Promise<void> {
  wire()
  const s = synth()
  const clean = toSpeakable(text)
  if (!enabled || !s || !UtteranceCtor() || !clean) return Promise.resolve()
  return new Promise<void>((resolve) => {
    if (opts.interrupt) stopAll()
    const job: Job = { chunks: chunkForSpeech(clean), index: 0, opts, resolve, done: false, retried: false }
    queue.push(job)
    while (queue.length > MAX_QUEUE) settle(queue.shift())
    pump()
  })
}

export const speech = {
  available(): boolean {
    wire()
    if (!synth() || !UtteranceCtor()) return false
    if (!voicesLoaded) refreshVoices()
    if (!voicesLoaded) return !voicesSettled
    return voices.some(isSpanish)
  },
  say,
  stop(): void {
    stopAll()
  },
  setEnabled(on: boolean): void {
    enabled = on
    if (!on) stopAll()
  },
  /** Extra: the voice that will be used (null until voices load or when there is no Spanish voice). */
  voiceInfo(): { name: string; lang: string; local: boolean } | null {
    wire()
    const v = bestVoice()
    return v ? { name: v.name, lang: v.lang, local: v.localService } : null
  },
  /** Spanish voices on this device, best first (for the voice picker in Ajustes). */
  voices(): { id: string; name: string; lang: string; local: boolean }[] {
    wire()
    if (!voicesLoaded) refreshVoices()
    return voices
      .filter(isSpanish)
      .map((v) => ({ v, score: scoreVoice(v, true) }))
      .sort((a, b) => b.score - a.score)
      .map(({ v }) => ({ id: voiceId(v), name: v.name, lang: v.lang, local: v.localService }))
  },
  /** The voice the adult chose on this device (null = automatic). */
  preferredVoice(): string | null {
    return preferredVoiceId()
  },
  setPreferredVoice(id: string | null): void {
    try {
      if (id) localStorage.setItem(VOICE_KEY, id)
      else localStorage.removeItem(VOICE_KEY)
    } catch { /* storage blocked: stays automatic */ }
    badVoices.delete(id ?? '')
  },
  /** Extra: true while a say() is in progress or queued. */
  speaking(): boolean {
    return !!current || queue.length > 0
  },
}

/** Test helper. */
export function __resetSpeechForTests(): void {
  for (const j of queue) settle(j)
  queue = []
  settle(current)
  current = null
  utterance = null
  clearTimers()
  clearTimeout(unduckTimer)
  enabled = true
  voices = []
  voicesLoaded = false
  voicesSettled = false
  badVoices.clear()
  wired = false
  warmed = false
  lastCancelAt = -Infinity
}

/** For debugging only: the utterance currently in flight. */
export function __currentUtterance(): SpeechSynthesisUtterance | null {
  return utterance
}
