/* Speaks a line that mixes Spanish and English: Lumi reads the Spanish parts, the English character the English ones.
   Parts are said one after another, in order, so each one waits for the previous to end. */
import type { SpeechOptions } from '@/types'
import { speech } from './speech'

export interface MixedPart {
  text: string
  lang: 'es' | 'en'
}

export async function sayMixed(parts: MixedPart[], opts: Omit<SpeechOptions, 'voice'> = {}): Promise<void> {
  for (const [i, part] of parts.entries()) {
    await speech.say(part.text, {
      ...opts,
      voice: part.lang === 'en' ? 'english' : 'lumi',
      // Only the first part may cut in; the rest wait their turn.
      interrupt: i === 0 ? opts.interrupt : false,
    })
  }
}
