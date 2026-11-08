/* The order of a song, with its timing and sound injected (the screen gives the real voice, bar clock and bubbles; the
   tests give fakes). Round 1: every verse, each on the first beat of a bar. Round 2 «¡Tu turno!»: the gaps are asked
   (the voice says the start, the child taps, the voice says the result); the rhymes are left out. abort() stops it
   for good: nothing is called after it and done resolves null. */
import { SONG_INTRO, SONG_TURN, songEnd, type FactLine, type SongLine } from './logic'

export interface SongDeps {
  /** Resolves when the sentence has been said. */
  say(text: string): Promise<void>
  /** Resolves on the next first beat of a bar. */
  waitBar(): Promise<void>
  /** Resolves when the child taps the right bubble. */
  ask(line: FactLine): Promise<{ firstTry: boolean }>
  /** The verse lit up (null: none). */
  onLine(index: number | null): void
  onRound(round: 1 | 2): void
}

export interface SongRun {
  done: Promise<{ round2: boolean; allFirstTry: boolean } | null>
  /** Ends round 1 after the verse that is sounding and goes to «¡Tu turno!». */
  skipToTurn(): void
  abort(): void
}

class Aborted extends Error {}

export function runSong(table: number, lines: SongLine[], gaps: number[], deps: SongDeps): SongRun {
  let aborted = false
  let skip = false
  const check = () => { if (aborted) throw new Aborted() }
  const step = async <T>(p: Promise<T>): Promise<T> => {
    check()
    const v = await p
    check()
    return v
  }

  const play = async () => {
    deps.onRound(1)
    await step(deps.say(SONG_INTRO))
    for (let i = 0; i < lines.length && !skip; i++) {
      await step(deps.waitBar())
      deps.onLine(i)
      await step(deps.say(lines[i].say))
    }
    deps.onLine(null)
    deps.onRound(2)
    await step(deps.say(SONG_TURN))
    let allFirstTry = true
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      if (l.kind === 'rhyme') continue
      await step(deps.waitBar())
      deps.onLine(i)
      if (gaps.includes(l.n)) {
        await step(deps.say(l.lead))
        const { firstTry } = await step(deps.ask(l))
        if (!firstTry) allFirstTry = false
        await step(deps.say(l.result))
      } else {
        await step(deps.say(l.say))
      }
    }
    deps.onLine(null)
    await step(deps.say(songEnd(table)))
    return { round2: true, allFirstTry }
  }

  const done = play().catch((e) => {
    if (e instanceof Aborted) return null
    throw e
  })
  return {
    done,
    skipToTurn: () => { skip = true },
    abort: () => { aborted = true },
  }
}
