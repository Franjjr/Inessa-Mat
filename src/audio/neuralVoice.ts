/* Natural (neural) voice: MP3 clips from /api/tts (Azure, see api/tts.ts), played with one shared <audio> element.
   - A clip is fetched per chunk of text and character; the service worker keeps every clip heard, so it also plays
     offline later. Clips for the next chunks are fetched ahead while the current one plays.
   - Any failure (offline and not cached, quota, slow answer) returns null and speech.ts uses the device voice.
   - iOS only lets an <audio> element play without a gesture after it has played once inside one: the first tap
     plays a silent clip on the shared element (unlock). */
import { onGesture } from './context'
import type { SpeechCharacter } from './speech'

const FETCH_TIMEOUT_MS = 3500
/** 50 ms of silence as a WAV data URI (8 kHz, 8-bit mono), to unlock the shared element on iOS. */
function silence(): string {
  const n = 400
  const b = new Uint8Array(44 + n)
  const v = new DataView(b.buffer)
  const ascii = (o: number, s: string) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i) }
  ascii(0, 'RIFF'); v.setUint32(4, 36 + n, true); ascii(8, 'WAVE'); ascii(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true)
  ascii(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44)
  let s = ''
  for (const x of b) s += String.fromCharCode(x)
  return `data:audio/wav;base64,${btoa(s)}`
}

let available = true
/** Unit tests use the device voice unless a test turns this on. */
let enabledInTests = false
let player: HTMLAudioElement | null = null
let unlocked = false
let wired = false
let endCurrent: (() => void) | null = null
const clips = new Map<string, Promise<string | null>>()

function automated(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.webdriver
}

function element(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  if (!player) {
    player = new Audio()
    player.preload = 'auto'
  }
  return player
}

function wire(): void {
  if (wired) return
  wired = true
  onGesture(() => {
    if (unlocked) return
    const el = element()
    if (!el) return
    unlocked = true
    el.src = silence()
    el.play().catch(() => { unlocked = false })
  })
}

/** False after the server said the voice is not configured or out of quota, until the page reloads. */
export function neuralAvailable(): boolean {
  wire()
  if (import.meta.env.MODE === 'test' && !enabledInTests) return false
  return available && !automated() && typeof fetch === 'function' && !!element()
}

export function clipUrl(text: string, character: SpeechCharacter): string {
  return `/api/tts?v=${character}&t=${encodeURIComponent(text)}`
}

/** Object URL of the clip, or null when it cannot be had quickly. Cached per text and character for the session. */
export function fetchClip(text: string, character: SpeechCharacter): Promise<string | null> {
  const key = `${character}|${text}`
  const hit = clips.get(key)
  if (hit) return hit
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  const p = fetch(clipUrl(text, character), { signal: ctrl.signal })
    .then(async (res) => {
      if (res.status === 503 || res.status === 403) available = false
      if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('audio/')) return null
      return URL.createObjectURL(await res.blob())
    })
    .catch(() => null)
    .finally(() => clearTimeout(timer))
  // Failures are not remembered: the next try may be online.
  p.then((url) => { if (!url) clips.delete(key) })
  clips.set(key, p)
  return p
}

/** Plays a clip; resolves true when it ended, false when it could not play (caller falls back). */
export function playClip(url: string, rate = 1): Promise<boolean> {
  const el = element()
  if (!el) return Promise.resolve(false)
  return new Promise<boolean>((resolve) => {
    let done = false
    const finish = (ok: boolean) => {
      if (done) return
      done = true
      el.onended = null
      el.onerror = null
      endCurrent = null
      resolve(ok)
    }
    endCurrent = () => finish(true)
    el.onended = () => finish(true)
    el.onerror = () => finish(false)
    el.src = url
    el.playbackRate = rate
    el.play().catch(() => finish(false))
  })
}

export function stopClip(): void {
  if (!player) return
  player.pause()
  endCurrent?.()
}

/** Test helper. */
export function __resetNeuralForTests(enable = false): void {
  enabledInTests = enable
  available = true
  player = null
  unlocked = false
  wired = false
  endCurrent = null
  clips.clear()
}
