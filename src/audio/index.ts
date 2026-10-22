/* PUBLIC API of the audio module (agent: audio-pwa). Synthesised SFX + generative music (Web Audio),
   speech (Web Speech API, es-ES voice selection), haptics (navigator.vibrate where available).
   Must work on iPad Safari: the AudioContext can only start inside a user gesture → unlockAudio().

   Implementation: ./context (engine + unlock), ./sfx, ./music, ./speech (+ ./speechText, ./voices), ./haptics.
   Extras beyond the original contract: sfx.setVolume/isEnabled, music.setVolume/current/isPlaying,
   speech.voiceInfo/speaking, haptics.setEnabled/supported, setMasterVolume, audioState. */
import { audioSupported, isRunning, peekEngine, setAudioWanted, setLevel, unlock } from './context'
import { haptics } from './haptics'
import { music } from './music'
import { sfx } from './sfx'
import { speech } from './speech'

export { sfx } from './sfx'
export { music } from './music'
export { speech } from './speech'
export { haptics } from './haptics'

/** Call from the first pointerdown/keydown to unlock audio on iOS. Idempotent. */
export function unlockAudio(): void {
  unlock()
}

/** Apply child/adult audio preferences in one call. Haptics follow `sound`; with sound and music both off the
    AudioContext sleeps (battery). */
export function applyAudioSettings(s: { sound: boolean; music: boolean; voice: boolean }): void {
  sfx.setEnabled(s.sound)
  haptics.setEnabled(s.sound)
  music.setEnabled(s.music)
  speech.setEnabled(s.voice)
  setAudioWanted(s.sound || s.music)
}

/** Extra: overall output volume 0..1 (default 0.9). */
export function setMasterVolume(v: number): void {
  setLevel('master', v)
}

/** Extra: 'off' (no Web Audio), 'locked' (waiting for a gesture), 'suspended' or 'running'. */
export function audioState(): 'off' | 'locked' | 'suspended' | 'running' {
  if (!peekEngine()) return audioSupported() ? 'locked' : 'off'
  return isRunning() ? 'running' : 'suspended'
}
