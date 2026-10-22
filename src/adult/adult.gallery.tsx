/* Gallery entries for the grown-ups' area. Pure components render with fixed fake data; the full screens
   are captured on their real routes (see docs/handoff: tools/shot.mjs --seed). */
import type { GalleryEntry } from '@/dev/Gallery'
import { FactHeatmap, FactLegend } from './shared/FactHeatmap'
import { NumberPad, PinDots } from './shared/NumberPad'
import { SwitchRow } from './child/SwitchRow'
import { averageGrid } from './shared/heatmap'

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
