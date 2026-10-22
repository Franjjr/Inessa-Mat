/* Test-only Web Speech mock: a synth with a real queue, cancel semantics like Chrome/Safari ('interrupted' errors)
   and helpers to finish or fail the utterance in flight. */
import type { VoiceLike } from '../voices'

export class MockUtterance {
  text: string
  lang = ''
  voice: VoiceLike | null = null
  pitch = 1
  rate = 1
  volume = 1
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}

export class MockSynth extends EventTarget {
  voices: VoiceLike[]
  spoken: MockUtterance[] = []
  current: MockUtterance | null = null
  queue: MockUtterance[] = []
  paused = false
  cancels = 0
  /** When false, speak() is silently ignored (iOS before a gesture). */
  works = true

  constructor(voices: VoiceLike[] = []) {
    super()
    this.voices = voices
  }

  get speaking(): boolean {
    return this.current !== null
  }

  get pending(): boolean {
    return this.queue.length > 0
  }

  getVoices(): VoiceLike[] {
    return this.voices
  }

  speak(u: MockUtterance): void {
    if (!this.works) return
    this.spoken.push(u)
    this.queue.push(u)
    if (!this.current) this.startNext()
  }

  private startNext(): void {
    this.current = this.queue.shift() ?? null
    this.current?.onstart?.()
  }

  /** The utterance in flight ends normally. */
  finish(): void {
    const u = this.current
    if (!u) return
    this.current = null
    u.onend?.()
    if (!this.current) this.startNext()
  }

  /** The utterance in flight fails. */
  fail(error: string): void {
    const u = this.current
    if (!u) return
    this.current = null
    u.onerror?.({ error })
    if (!this.current) this.startNext()
  }

  cancel(): void {
    this.cancels += 1
    const all = [...(this.current ? [this.current] : []), ...this.queue]
    this.current = null
    this.queue = []
    for (const u of all) u.onerror?.({ error: 'interrupted' })
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
  }

  /** Simulate voices arriving late. */
  setVoices(v: VoiceLike[]): void {
    this.voices = v
    this.dispatchEvent(new Event('voiceschanged'))
  }
}

export function installMockSpeech(voices: VoiceLike[] = []): { synth: MockSynth; uninstall: () => void } {
  const w = window as unknown as Record<string, unknown>
  const prev = { s: w.speechSynthesis, u: w.SpeechSynthesisUtterance }
  const synth = new MockSynth(voices)
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: MockUtterance, configurable: true, writable: true })
  return {
    synth,
    uninstall: () => {
      if (prev.s === undefined) delete w.speechSynthesis
      else Object.defineProperty(window, 'speechSynthesis', { value: prev.s, configurable: true, writable: true })
      if (prev.u === undefined) delete w.SpeechSynthesisUtterance
      else Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: prev.u, configurable: true, writable: true })
    },
  }
}

export const VOICES: Record<string, VoiceLike> = {
  samantha: { name: 'Samantha', lang: 'en-US', localService: true, default: true, voiceURI: 'samantha' },
  paulina: { name: 'Paulina', lang: 'es-MX', localService: true, default: false, voiceURI: 'paulina' },
  monica: { name: 'Mónica', lang: 'es-ES', localService: true, default: false, voiceURI: 'monica' },
  eddy: { name: 'Eddy (español (España))', lang: 'es-ES', localService: true, default: false, voiceURI: 'eddy' },
  googleEs: { name: 'Google español', lang: 'es-ES', localService: false, default: false, voiceURI: 'google-es' },
  androidEs: { name: 'español España', lang: 'es_ES', localService: true, default: false, voiceURI: 'android-es' },
  elvira: { name: 'Microsoft Elvira Online (Natural) - Spanish (Spain)', lang: 'es-ES', localService: false, default: false, voiceURI: 'elvira' },
  helena: { name: 'Microsoft Helena - Spanish (Spain)', lang: 'es-ES', localService: true, default: false, voiceURI: 'helena' },
}
