/* Inglés: hablar en voz alta («Ahora dilo tú»), opcional. Pure: no React, no I/O, no audio.
   The microphone is off by default: it needs the adult's switch with consent (settings.speaking), English on, and a
   microphone on this device. The stars are a pronunciation result only: they never reach the wallet and never count
   for mastery. The day's limit and the day's «switched off» are progress flags (habla:<day>:<n>, habla-no:<day>), so
   they follow the child like any other per-day flag. The results kept on the device hold the word and the stars only. */
import type { ChildProfile } from '@/types'

/** At most this many speaking attempts per child and day (a decision of the owner). */
export const SPEAK_DAILY_MAX = 10
/** At most this many «Ahora dilo tú» items in one English session. */
export const SPEAK_PER_SESSION_MAX = 2

/** The stars of a pronunciation score (0–100): below 60 one star, below 85 two, otherwise three. One star still praises the try. */
export function pronunciationStars(score: number): 1 | 2 | 3 {
  if (score < 60) return 1
  if (score < 85) return 2
  return 3
}

const dayOf = (now: Date) => now.toISOString().slice(0, 10)

/** The flag of the attempt number `n` of `now`'s day (set when the child's recording is sent). */
export const speakAttemptKey = (now: Date, n: number) => `habla:${dayOf(now)}:${n}`
/** Set when the speaking service failed or refused for the day: no more speaking items that day. */
export const speakOffKey = (now: Date) => `habla-no:${dayOf(now)}`

/** Attempts already made on `now`'s day (the flags habla:<day>:<n>). */
export function speakAttemptsToday(flags: Record<string, boolean> | undefined, now: Date): number {
  const prefix = `habla:${dayOf(now)}:`
  return Object.keys(flags ?? {}).filter((k) => k.startsWith(prefix)).length
}

/** Speaking may be planned: English on for the child, the adult's switch on with its consent date, and a microphone here. */
export function speakingAvailable(child: ChildProfile, mic: boolean): boolean {
  const sp = child.settings.speaking
  return !!child.settings.subjects?.includes('english') && sp?.on === true && !!sp.consentAt && mic
}

/** A result kept on the device: the word and its stars, never the audio and never a score. */
export interface SpeakingRecord { word: string; stars: 1 | 2 | 3; at: string }

/** The words whose last result was one star, the most recent first («Palabras que le cuesta decir»). */
export function hardToSay(records: readonly SpeakingRecord[]): string[] {
  const last = new Map<string, SpeakingRecord>()
  for (const r of records) {
    const prev = last.get(r.word)
    if (!prev || r.at > prev.at) last.set(r.word, r)
  }
  return [...last.values()]
    .filter((r) => r.stars === 1)
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .map((r) => r.word)
}
