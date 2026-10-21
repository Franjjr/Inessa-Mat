/* PUBLIC API of the audio module (agent: audio-pwa). Synthesised SFX + generative music (Web Audio),
   speech (Web Speech API, es-ES voice selection), haptics (navigator.vibrate where available).
   Must work on iPad Safari: the AudioContext can only start inside a user gesture → unlockAudio().
   Stub bodies exist only so the app compiles before the module is implemented. */
import type { MusicTheme, SfxName, SpeechOptions } from '@/types'

export const sfx = {
  play(_name: SfxName, _opts?: { volume?: number; pitch?: number }): void {},
  setEnabled(_on: boolean): void {},
}

export const music = {
  play(_theme: MusicTheme): void {},
  stop(): void {},
  setEnabled(_on: boolean): void {},
  /** Lower music volume while speech plays. */
  duck(_on: boolean): void {},
}

export const speech = {
  available(): boolean { return false },
  say(_text: string, _opts?: SpeechOptions): Promise<void> { return Promise.resolve() },
  stop(): void {},
  setEnabled(_on: boolean): void {},
}

export const haptics = {
  tap(): void {},
  success(): void {},
  error(): void {},
}

/** Call from the first pointerdown/keydown to unlock audio on iOS. Idempotent. */
export function unlockAudio(): void {}

/** Apply child/adult audio preferences in one call. */
export function applyAudioSettings(_s: { sound: boolean; music: boolean; voice: boolean }): void {}
