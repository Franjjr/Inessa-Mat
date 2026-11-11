/* Map labels: in every world and on every tablet size, no name tag, icon or «Aquí sigue»/«¡Ayúdame!» tag overlaps
   another (boxes in real pixels, see src/world/map/labels.ts). */
import { describe, expect, it } from 'vitest'
import { season1, seasonC2 } from '@/content'
import { baseStageHeight, layoutMap, type StopInput } from '@/world/map/labels'

// Header + story strip take about this much of the screen height.
const CHROME = 130
const SIZES = [[1000, 490], [1180, 820], [1280, 800], [820, 1180]] as const

function stops(nodes: typeof season1.worlds[number]['nodes'], mode: 'current' | 'done'): StopInput[] {
  return nodes.map((node, i) => ({
    node, title: node.title as string, done: mode === 'done' || i === 0,
    current: mode === 'current' && i === 1, crystal: false,
  }))
}

for (const season of [season1, seasonC2]) {
  describe(`map labels (${season.id})`, () => {
    for (const w of season.worlds) {
      for (const [W, H] of SIZES) {
        for (const mode of ['current', 'done'] as const) {
          it(`${w.id} at ${W}x${H} (${mode}) has no overlaps`, () => {
            const base = baseStageHeight(W, H - CHROME)
            const out = layoutMap(stops(w.nodes, mode), W, base)
            expect(out.overlaps, out.overlaps.join('; ')).toEqual([])
          })
        }
      }
    }
  })
}
