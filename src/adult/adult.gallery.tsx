/* Gallery entries for the grown-ups' area. Pure components render with fixed fake data; the full screens
   are captured on their real routes (see docs/handoff: tools/shot.mjs --seed). */
import type { GalleryEntry } from '@/dev/Gallery'
import { FactHeatmap, FactLegend } from './shared/FactHeatmap'
import { NumberPad, PinDots } from './shared/NumberPad'
import { SwitchRow } from './child/SwitchRow'
import { averageGrid } from './shared/heatmap'
import { MistakesCard, TemarioCard, TestsCard } from './child/LearningCards'
import { GRADE3_SYLLABUS, allTopics } from '@/content/syllabus'
import { errorReport, newMastery, placementRuns, syllabusReport, PLACEMENT_ACTIVITY, PLACEMENT_COUNT } from '@/engine'
import type { AttemptRecord, ErrorType, MasteryMap } from '@/types'

const NOW = new Date('2026-10-22T10:00:00.000Z')
const ago = (days: number, ms = 0) => new Date(NOW.getTime() - days * 86_400_000 + ms).toISOString()

function sampleMastery(): MasteryMap {
  const topics = allTopics(GRADE3_SYLLABUS).filter((t) => t.status === 'disponible' && t.skills.length > 0)
  const map: MasteryMap = {}
  topics.slice(0, 9).forEach((t) => t.skills.forEach((s) => { map[s] = { ...newMastery(s, NOW), box: 3 } }))
  topics[9].skills.slice(0, 2).forEach((s) => { map[s] = { ...newMastery(s, NOW), box: 2 } })
  return map
}

function sampleAttempts(): AttemptRecord[] {
  const out: AttemptRecord[] = []
  const add = (createdAt: string, correct: boolean, errorType: ErrorType | null, over: Partial<AttemptRecord> = {}) => out.push({
    id: `g${out.length}`, childId: 'g', sessionId: 's', skill: 'mul:6x7', kind: 'fact-mul', correct, given: '', expected: '',
    ms: 3000, inputMode: 'keypad', hintsUsed: 0, errorType, context: {}, createdAt, ...over,
  })
  const recent: [ErrorType, number][] = [['carry-forgot', 5], ['carry-wrong', 2], ['fact', 4], ['clock-hour', 1]]
  recent.forEach(([t, k]) => { for (let i = 0; i < k; i++) add(ago(2 + i), false, t) })
  for (let i = 0; i < 9; i++) add(ago(35 + i), false, 'fact')
  for (let i = 0; i < 3; i++) add(ago(40 + i), false, 'operation')
  for (let i = 0; i < 60; i++) add(ago(i % 28), true, null)
  for (let i = 0; i < PLACEMENT_COUNT; i++) add(ago(50, i * 30_000), i % 2 === 0, null, { sessionId: 'p1', skill: i < 6 ? 'add:3d:1' : 'mul:6x7', context: { activity: PLACEMENT_ACTIVITY } })
  for (let i = 0; i < PLACEMENT_COUNT; i++) add(ago(3, i * 30_000), i % 5 !== 0, null, { sessionId: 'p2', skill: i < 6 ? 'add:3d:1' : 'mul:6x7', context: { activity: PLACEMENT_ACTIVITY } })
  return out.sort((x, y) => y.createdAt.localeCompare(x.createdAt))
}

function sampleGrid(seed: number): number[][] {
  const grid = Array.from({ length: 10 }, () => Array(10).fill(-1) as number[])
  for (let a = 1; a <= 10; a++) {
    for (let b = a; b <= 10; b++) {
      const easy = [1, 2, 5, 10]
      const table = easy.includes(a) ? a : easy.includes(b) ? b : Math.max(a, b)
      let box = table === 6 || table === 9 ? 2 : table === 7 || table === 8 ? 1 : 5
      box = (box + ((a * 7 + b * 3 + seed) % 3) - 1)
      const v = Math.max(0, Math.min(5, box))
      if ((a + b + seed) % 9 === 0 && !easy.includes(table)) continue
      grid[a - 1][b - 1] = v
      grid[b - 1][a - 1] = v
    }
  }
  return grid
}

const entries: GalleryEntry[] = [
  {
    title: 'TemarioCard',
    width: 720,
    render: () => <TemarioCard report={syllabusReport(GRADE3_SYLLABUS, sampleMastery())} childName="Lía" />,
  },
  {
    title: 'MistakesCard',
    width: 720,
    render: () => <MistakesCard report={errorReport(sampleAttempts(), NOW)} childName="Lía" />,
  },
  {
    title: 'TestsCard',
    width: 720,
    render: () => (
      <TestsCard
        runs={placementRuns(sampleAttempts())}
        recall={{ minDays: 14, checked: 38, remembered: 31 }}
        childName="Lía"
        offer={{ requested: false, busy: false, onOffer: () => {} }}
      />
    ),
  },
  {
    title: 'FactHeatmap · child (full)',
    width: 560,
    background: 'var(--c-surface)',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FactHeatmap grid={sampleGrid(0)} label="Ejemplo de tablas" />
        <FactLegend />
      </div>
    ),
  },
  {
    title: 'FactHeatmap · class average (compact)',
    width: 300,
    background: 'var(--c-surface)',
    render: () => <FactHeatmap compact grid={averageGrid([sampleGrid(0), sampleGrid(1), sampleGrid(2)])} label="Media de la clase" />,
  },
  {
    title: 'NumberPad with PIN dots',
    width: 400,
    background: 'var(--c-surface)',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: 8 }}>
        <PinDots length={4} filled={2} label="PIN" />
        <NumberPad onDigit={() => undefined} onBackspace={() => undefined} onSubmit={() => undefined} submitDisabled />
      </div>
    ),
  },
  {
    title: 'SwitchRow',
    width: 420,
    background: 'var(--c-surface)',
    render: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SwitchRow label="Permitir actividades con tiempo" hint="Las carreras de velocidad." checked onChange={() => undefined} />
        <SwitchRow label="Casillas grandes para escribir" checked={false} onChange={() => undefined} />
      </div>
    ),
  },
]

export default entries
