/* Inglés de 3.º: the sound of the English exercises. The English voice reads the English words (speech character `english`,
   en-GB). A listening exercise reads its text once when it opens (voice setting on); a wrong answer says the right one. With the
   sound off nothing is said. Pure hooks: the components are in shared.tsx. */
import { useEffect } from 'react'
import { speech } from '@/audio'
import { useActiveChild } from '@/data'
import type { CheckResult } from '@/types'

/** The child can hear: the sound setting is on and this device has a voice (as the dictation of Lengua decides). */
export function useSoundOn(): { soundOn: boolean; soundSetting: boolean; voiceOn: boolean } {
  const { child } = useActiveChild()
  const soundSetting = child?.settings.sound ?? true
  return { soundOn: soundSetting && speech.available(), soundSetting, voiceOn: child?.settings.voice ?? false }
}

/** Says an English text in the English voice. A press (force) always speaks; the automatic reading respects the settings. */
export function sayEnglish(text: string, force = false): void {
  void speech.say(text, { voice: 'english', interrupt: true, force }).catch(() => undefined)
}

/** A listening exercise: the text is read once when it opens (voice setting on), and «Otra vez» reads it again. */
export function useListening(text: string, exerciseId: string) {
  const { soundOn, soundSetting, voiceOn } = useSoundOn()
  useEffect(() => {
    if (voiceOn && soundOn) sayEnglish(text)
    // Only once per exercise: a new exercise is a new key in the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId])
  return { soundOn, soundSetting, again: () => sayEnglish(text, true) }
}

/** A wrong answer says the right one, in English (the sentence or the word, as the view gives it). */
export function useSayRight(result: CheckResult | null, text: string): void {
  const soundOn = useSoundOn().soundOn
  useEffect(() => {
    if (result && !result.correct && soundOn) sayEnglish(text)
  }, [result, text, soundOn])
}

export const statusOf = (result: CheckResult | null) => (result ? (result.correct ? 'correct' : 'wrong') : 'idle')
