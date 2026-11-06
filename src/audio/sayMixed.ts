/* Speaks a line that mixes Spanish and English: Lumi reads the Spanish parts, the English character the English ones.
   Parts are said one after another, in order, so each one waits for the previous to end.

   The mixed-line format is data: in a lesson step's text, the English words and phrases go between asterisks, e.g.
   «Mira, *seven* es siete.». parseMixed reads that mark (null when the line has none, so an ordinary line is spoken as
   it always was); plainMixed drops the marks for the text on the screen. Asterisks never occur in the Spanish copy. */
import type { SpeechOptions } from '@/types'
import { speech } from './speech'

export interface MixedPart {
  text: string
  lang: 'es' | 'en'
}

/** The Spanish voice of a line: Lumi unless the speaker of the step is someone else. */
export type SpanishVoice = 'lumi' | 'companion' | 'guardian'

const MARK = /\*([^*\n]+)\*/g

/** The parts of a line marked with «*…*» (English) and the text around them (Spanish). Null when nothing is marked. */
export function parseMixed(line: string): MixedPart[] | null {
  const parts: MixedPart[] = []
  let last = 0
  for (const m of line.matchAll(MARK)) {
    const at = m.index ?? 0
    if (at > last) parts.push({ text: line.slice(last, at), lang: 'es' })
    parts.push({ text: m[1], lang: 'en' })
    last = at + m[0].length
  }
  if (parts.length === 0) return null
  if (last < line.length) parts.push({ text: line.slice(last), lang: 'es' })
  return parts
}

/** The line as the child reads it: the marks are dropped, the English stays. */
export function plainMixed(line: string): string {
  return line.replace(MARK, '$1')
}

export async function sayMixed(parts: MixedPart[], opts: Omit<SpeechOptions, 'voice'> & { spanish?: SpanishVoice } = {}): Promise<void> {
  const { spanish = 'lumi', ...rest } = opts
  for (const [i, part] of parts.entries()) {
    await speech.say(part.text, {
      ...rest,
      voice: part.lang === 'en' ? 'english' : spanish,
      // Only the first part may cut in; the rest wait their turn.
      interrupt: i === 0 ? rest.interrupt : false,
    })
  }
}
