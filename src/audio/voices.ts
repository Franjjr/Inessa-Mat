/* Choosing the best Spanish voice on each platform (pure functions, unit-tested).
   iPad/macOS: "Mónica" (es-ES, ideally the enhanced/premium download); Android: Google "español (España)";
   Edge: "Microsoft Elvira Online (Natural)"; Windows: Helena/Laura; Chrome desktop: "Google español".
   Remote (non-local) voices need a connection, so offline they are pushed to the bottom. */

export interface VoiceLike {
  name: string
  lang: string
  localService: boolean
  default: boolean
  voiceURI?: string
}

const FEMALE = /m[oó]nica|paulina|marisol|elvira|helena|laura|luc[ií]a|conchita|pen[eé]lope|soledad|esperanza|ang[eé]lica|isabela|sabina|francisca|dalia|elena|paloma|ximena|triana|abril|irene|vera|estrella|marta|carmen|sara|ana\b|female|mujer/i
const NOVELTY = /\b(eddy|flo|grandma|grandpa|abuel[ao]|reed|rocko|sandy|shelley|bad news|good news|bells|bubbles|cellos|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|bahh|boing|fred|junior|kathy|ralph)\b/i
const QUALITY = /enhanced|mejorad|premium|pr[eé]mium|neural|natural|siri/i

export function normLang(lang: string): string {
  return (lang || '').replace(/_/g, '-').toLowerCase()
}

export function isSpanish(v: VoiceLike): boolean {
  const l = normLang(v.lang)
  return l === 'es' || l.startsWith('es-') || l.startsWith('spa')
}

/** Higher is better; -Infinity = never use (not Spanish). */
export function scoreVoice(v: VoiceLike, online = true): number {
  if (!isSpanish(v)) return -Infinity
  const l = normLang(v.lang)
  let s = 0
  if (l === 'es-es' || l === 'spa-esp') s += 100
  else if (l === 'es' || l === 'spa') s += 80
  else if (l === 'es-us' || l === 'es-mx') s += 62
  else s += 55
  const name = v.name || ''
  if (/m[oó]nica/i.test(name)) s += 26
  if (/microsoft/i.test(name) && /online|natural/i.test(name)) s += 30
  else if (/google/i.test(name)) s += 16
  if (QUALITY.test(name)) s += 20
  if (FEMALE.test(name)) s += 8
  if (NOVELTY.test(name)) s -= 90
  if (v.localService) s += 6
  else if (!online) s -= 220
  if (v.default) s += 3
  return s
}

/** Best Spanish voice, or null when the platform has none. `exclude` holds voiceURIs/names that failed. */
export function pickBestVoice<T extends VoiceLike>(voices: readonly T[], online = true, exclude: ReadonlySet<string> = new Set()): T | null {
  let best: T | null = null
  let bestScore = -Infinity
  for (const v of voices) {
    if (exclude.has(v.voiceURI || v.name)) continue
    const sc = scoreVoice(v, online)
    if (sc > bestScore) {
      best = v
      bestScore = sc
    }
  }
  return bestScore === -Infinity ? null : best
}
