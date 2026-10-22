/* Dev gallery for the lesson player: every visual played step by step, and whole lessons as they appear on a tablet.
   Open /dev/gallery?only=src/activities/lesson */
import { useEffect, useState } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { lessons } from '@/content'
import type { LessonVisualId } from '@/types'
import LessonPlayer from './LessonPlayer'
import { LESSON_VISUALS, LESSON_VISUAL_IDS } from './visuals'

/** Params as Season 1 lessons use them, so each visual shows its real example. */
const SAMPLE: Record<LessonVisualId, Record<string, number | string>> = {
  groups: { groups: 4, perGroup: 3, emoji: '🍄' },
  'array-rotate': { rows: 3, cols: 5, emoji: '🌸' },
  'easy-tables': {},
  'place-value': { n: 2486 },
  carry: { a: 368, b: 257 },
  borrow: { a: 352, b: 127 },
  'zero-borrow': { a: 503, b: 128 },
  'sub-check': { a: 352, b: 127 },
  'five-plus-one': { b: 7 },
  'even-six-rhyme': {},
  'double-chain': { start: 3, steps: 3 },
  'pattern-units': { table: 8 },
  'known-facts': { table: 8 },
  'nine-trick': { a: 7 },
  'square-rhyme': {},
  'five-six-seven-eight': {},
  'split-multiply': { n: 23, m: 3 },
  'column-mul': { top: 47, bottom: 6 },
  share: { total: 12, groups: 3, emoji: '💎' },
  'fact-family': { a: 6, b: 7 },
  galera: { dividend: 84, divisor: 4 },
  'division-check': { dividend: 17, divisor: 5 },
}

const STATES = 5

/** One visual with step controls: ◀ ▶ and autoplay, to check every phase of its animation. */
function VisualDemo({ id }: { id: LessonVisualId }) {
  const [phase, setPhase] = useState(0)
  const [playing, setPlaying] = useState(false)
  const Visual = LESSON_VISUALS[id]
  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => setPhase((p) => (p + 1) % STATES), 1400)
    return () => window.clearInterval(t)
  }, [playing])
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--c-bg)', borderRadius: 12 }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Visual params={SAMPLE[id]} phase={phase} runLength={STATES} reduced={false} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: 8, fontFamily: 'var(--font-display)' }}>
        <button type="button" onClick={() => setPhase((p) => Math.max(0, p - 1))}>◀ paso</button>
        <span data-testid="phase">fase {phase}</span>
        <button type="button" onClick={() => setPhase((p) => Math.min(STATES - 1, p + 1))}>paso ▶</button>
        <button type="button" onClick={() => setPlaying((v) => !v)}>{playing ? 'Pausa' : 'Reproducir'}</button>
      </div>
    </div>
  )
}

const entries: GalleryEntry[] = [
  ...LESSON_VISUAL_IDS.map((id) => ({
    title: `visual · ${id}`,
    width: 620,
    height: 480,
    background: '#fff',
    render: () => <VisualDemo id={id} />,
  })),
  ...['w1-groups', 'w2-carry', 'w4-zero', 'w8-galera'].map((id) => ({
    title: `lección · ${id}`,
    width: 1180,
    height: 820,
    background: 'var(--c-bg)',
    render: () => {
      const lesson = lessons.find((l) => l.id === id)
      return lesson ? <LessonPlayer lesson={lesson} onDone={() => undefined} onExit={() => undefined} /> : <p>Sin lección {id}</p>
    },
  })),
]

export default entries
