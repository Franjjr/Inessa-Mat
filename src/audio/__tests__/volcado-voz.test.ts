/* V7/V8: the whole dump of what the voice reads — every sentence of the maths classes and lessons, and for every skill
   of 2.º, 3.º and 4.º the statement, the hints and the worked solution — goes through toSpeakable, and what comes out
   is accepted by the voice service (api/tts.ts SAFE_TEXT) and has no maths sign or digit left: the voice says words. */
import { describe, expect, it } from 'vitest'
import ttsSource from '../../../api/tts.ts?raw'
import { toSpeakable } from '@/audio/speechText'
import { CLASSES } from '@/content/classes'
import { lessons } from '@/content/lessons'
import { allTopics, syllabusForGrade } from '@/content/syllabus'
import { createRng, generate, hintsFor } from '@/engine'
import { solutionFor } from '@/engine/solution'
import { statementFor } from '@/engine/statement'
import type { Exercise } from '@/types'

const SAFE_TEXT = (() => {
  const m = /const SAFE_TEXT = \/(.+)\/([a-z]*)\n/.exec(ttsSource)
  if (!m) throw new Error('SAFE_TEXT not found in api/tts.ts')
  return new RegExp(m[1], m[2])
})()

/** Keys whose strings are never read aloud (ids, art, routes, data for the drawings). */
const SILENT_KEYS = new Set(['id', 'kind', 'type', 'skill', 'skills', 'visual', 'route', 'companion', 'speaker', 'topic', 'topicId', 'icon', 'art', 'world', 'worldId', 'node', 'nodeId', 'season', 'seasonId', 'color', 'tone', 'emoji', 'variant', 'mode', 'shape', 'layout'])

/** Every sentence with letters in a content tree. */
function sentences(value: unknown, out: Set<string>, key = '', seen = new WeakSet<object>()): Set<string> {
  if (typeof value === 'string') {
    if (!SILENT_KEYS.has(key) && /\p{L}{3,}/u.test(value) && /\s/.test(value)) out.add(value)
  } else if (Array.isArray(value)) {
    for (const v of value) sentences(v, out, key, seen)
  } else if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value)
    for (const [k, v] of Object.entries(value)) if (typeof v !== 'function') sentences(v, out, k, seen)
  }
  return out
}

function exercises(): Exercise[] {
  const out: Exercise[] = []
  for (const grade of [2, 3, 4]) {
    for (const topic of allTopics(syllabusForGrade(grade))) {
      if (topic.id.startsWith('lng-') || topic.id.startsWith('eng-')) continue
      for (const skill of topic.skills) {
        for (const seed of [1, 2]) {
          try {
            out.push(...generate({ skills: [skill] }, 2, { rng: createRng(seed) }))
          } catch {
            // A pending skill has nothing to read.
          }
        }
      }
    }
  }
  return out
}

function dump(): string[] {
  const out = new Set<string>()
  sentences(CLASSES, out)
  sentences(lessons, out)
  for (const ex of exercises()) {
    out.add(statementFor(ex))
    for (const h of hintsFor(ex)) out.add(h.text)
    const sol = solutionFor(ex)
    for (const step of sol.steps) out.add(step)
    out.add(sol.answer)
  }
  return [...out]
}

describe('the voice dump', () => {
  const texts = dump()

  it('is the real dump, not a handful of examples', () => {
    expect(texts.length).toBeGreaterThan(1500)
  })

  it('every sentence comes out accepted by the voice service, with no sign and no digit', () => {
    const bad: string[] = []
    for (const t of texts) {
      const out = toSpeakable(t)
      if (out === '') continue
      if (!SAFE_TEXT.test(out)) bad.push(`SAFE_TEXT: «${t}» → «${out}»`)
      else if (/[×÷=<>+−]/.test(out)) bad.push(`signo: «${t}» → «${out}»`)
      else if (/\d/.test(out)) bad.push(`cifra: «${t}» → «${out}»`)
    }
    expect(bad.slice(0, 40), `${bad.length} de ${texts.length}`).toEqual([])
  })
})
