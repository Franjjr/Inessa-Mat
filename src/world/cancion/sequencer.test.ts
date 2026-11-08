import { describe, expect, it } from 'vitest'
import { SONG_INTRO, SONG_TURN, songEnd, songLines, type FactLine } from './logic'
import { runSong, type SongDeps } from './sequencer'

/** Fake deps that log every call in order. ask answers right away (firstTry unless listed in `misses`). */
function fake(misses: number[] = []) {
  const log: string[] = []
  const deps: SongDeps = {
    say: async (t) => { log.push(`say:${t}`) },
    waitBar: async () => { log.push('bar') },
    ask: async (l: FactLine) => { log.push(`ask:${l.n}`); return { firstTry: !misses.includes(l.n) } },
    onLine: (i) => { log.push(`line:${i}`) },
    onRound: (r) => { log.push(`round:${r}`) },
  }
  return { log, deps }
}

const lines = songLines(7)

describe('runSong', () => {
  it('round 1 waits for a bar before every line and says each line once', async () => {
    const { log, deps } = fake()
    const res = await runSong(7, lines, [8], deps).done
    expect(res).toEqual({ round2: true, allFirstTry: true })
    const r1 = log.slice(0, log.indexOf('round:2'))
    expect(r1[0]).toBe('round:1')
    expect(r1).toContain(`say:${SONG_INTRO}`)
    for (const [i, l] of lines.entries()) {
      const at = r1.indexOf(`line:${i}`)
      expect(r1[at - 1]).toBe('bar')
      expect(r1[at + 1]).toBe(`say:${l.say}`)
      expect(r1.filter((x) => x === `say:${l.say}`)).toHaveLength(1)
    }
    expect(log.at(-1)).toBe(`say:${songEnd(7)}`)
  })

  it('round 2 asks only the gaps, says the lead then the result, and skips rhymes', async () => {
    const { log, deps } = fake()
    await runSong(7, lines, [6, 8], deps).done
    const r2 = log.slice(log.indexOf('round:2'))
    expect(r2).toContain(`say:${SONG_TURN}`)
    expect(r2.filter((x) => x.startsWith('ask:'))).toEqual(['ask:6', 'ask:8'])
    const a = r2.indexOf('ask:8')
    expect(r2[a - 1]).toBe('say:Siete por ocho…')
    expect(r2[a + 1]).toBe('say:¡Cincuenta y seis!')
    expect(r2.some((x) => x.startsWith('say:5, 6, 7, 8'))).toBe(false)
    expect(r2).toContain('say:Siete por nueve, sesenta y tres')
  })

  it('allFirstTry is false when one ask was not first try', async () => {
    const { deps } = fake([8])
    expect(await runSong(7, lines, [6, 8], deps).done).toEqual({ round2: true, allFirstTry: false })
  })

  it('abort stops everything: no say after abort, done is null', async () => {
    const log: string[] = []
    let release!: () => void
    const deps: SongDeps = {
      say: (t) => { log.push(`say:${t}`); return new Promise<void>((r) => { release = r }) },
      waitBar: async () => {},
      ask: async () => ({ firstTry: true }),
      onLine: () => {},
      onRound: () => {},
    }
    const run = runSong(7, lines, [8], deps)
    await Promise.resolve()
    run.abort()
    release()
    expect(await run.done).toBeNull()
    expect(log).toEqual([`say:${SONG_INTRO}`])
  })

  it('skipToTurn jumps to round 2 after the current line', async () => {
    const { log, deps } = fake()
    let run!: ReturnType<typeof runSong>
    let skipped = false
    const d: SongDeps = {
      ...deps,
      say: async (t) => {
        await deps.say(t)
        if (!skipped && t === lines[1].say) { skipped = true; run.skipToTurn() }
      },
    }
    run = runSong(7, lines, [8], d)
    await run.done
    const r1 = log.slice(0, log.indexOf('round:2'))
    expect(r1).toContain(`say:${lines[1].say}`)
    expect(r1).not.toContain(`say:${lines[2].say}`)
    expect(log).toContain('ask:8')
  })
})
