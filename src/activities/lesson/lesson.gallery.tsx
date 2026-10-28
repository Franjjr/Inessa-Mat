/* Dev gallery for the lesson player: every visual played step by step, and whole lessons as they appear on a tablet.
   Open /dev/gallery?only=src/activities/lesson */
import { useEffect, useState } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { lessons } from '@/content'
import { LENGUA_CLASSES } from '@/content/classes'
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
  'sub-carry': { a: 352, b: 127 },
  'sub-parts': { a: 352, b: 127 },
  'sub-line': { a: 352, b: 127 },
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
  'bar-model': { a: 5, b: 3, total: 8 },
  'div-parts': { dividend: 84, divisor: 4 },
  'div-climb': { divisor: 4, quotient: 7 },
  'lng-sentence': { text: 'El perro come pan en el parque.', highlight: 'perro', mark: 'noun' },
  'lng-word': { word: 'mariposa', parts: 'ma-ri-po-sa', mark: 'ri' },
  'big-text': { text: '4 325 = 4 000 + 300 + 20 + 5' },
  'number-line': { from: 3400, to: 3500, step: 10, mark: 3456, jump: 4 },
  'fraction-shape': { parts: 4, shaded: 3, shape: 'circle' },
  'fraction-groups': { total: 20, parts: 4, take: 1 },
  money: { items: '500,200,20', price: 320 },
  clock: { h: 7, m: 5, digital: 1 },
  timeline: { start: 600, end: 645 },
  ruler: { cm: 8, object: '✏️' },
  units: { kind: 'length' },
  polygon: { sides: 5, mark: 'sides' },
  lines: { kind: 'paralelas' },
  angle: { deg: 90 },
  solid: { name: 'cilindro' },
  perimeter: { sides: '3,4,3,4' },
  'grid-route': { route: 'R,R,U,U,L' },
  pictogram: { rows: 'Gatos:3,Perros:5' },
  'bar-chart': { rows: 'Gatos:3,Perros:5' },
  'chance-bag': { balls: 'red:3,blue:0' },
}

const STATES = 5

/** Every Season 1 lesson, so each one can be reviewed without unlocking the worlds first. */
const SEASON1_LESSON_IDS = [
  'w1-groups', 'w1-easy', 'w2-placevalue', 'w2-carry', 'w3-five', 'w3-rhyme', 'w4-borrow', 'w4-zero',
  'w5-double', 'w5-pattern', 'w6-seven', 'w6-nine', 'w7-split', 'w7-carry', 'w8-share', 'w8-galera',
]

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
  ...LENGUA_CLASSES.map((cls) => ({
    title: `clase lengua · ${cls.lesson.id}`,
    width: Math.min(window.innerWidth - 48, 1280),
    height: window.innerHeight - 96,
    background: 'var(--c-bg)',
    render: () => <LessonPlayer lesson={cls.lesson} onDone={() => undefined} onExit={() => undefined} />,
  })),
  ...SEASON1_LESSON_IDS.map((id) => ({
    title: `lección · ${id}`,
    // The frame follows the viewport, so each device (iPad landscape or portrait, Android) shows the real size.
    width: Math.min(window.innerWidth - 48, 1280),
    height: window.innerHeight - 96,
    background: 'var(--c-bg)',
    render: () => {
      const lesson = lessons.find((l) => l.id === id)
      return lesson ? <LessonPlayer lesson={lesson} onDone={() => undefined} onExit={() => undefined} /> : <p>Sin lección {id}</p>
    },
  })),
]

export default entries
