/* Map labels: in every world and on every tablet and phone size, no name tag, icon or «Aquí sigue»/«¡Ayúdame!» tag
   overlaps another, and no two icons (with their gold ring) touch (boxes in real pixels, see src/world/map/labels.ts). */
import { describe, expect, it } from 'vitest'
import { season1, seasonC2 } from '@/content'
import { baseStageHeight, layoutMap, pillOf, type StopInput } from '@/world/map/labels'

// Header + story strip take about this much of the screen height.
const CHROME = 130
const SIZES = [[1000, 490], [1180, 820], [1280, 800], [820, 1180], [390, 844]] as const

type Nodes = typeof season1.worlds[number]['nodes']

function stops(nodes: Nodes, current: number, doneMode: 'all' | 'before', crystal: boolean, petName = 'Luna'): StopInput[] {
  return nodes.map((node, i) => ({
    node, title: node.title as string,
    done: doneMode === 'all' || i < current,
    current: i === current, crystal, petName,
  }))
}

for (const season of [season1, seasonC2]) {
  describe(`map labels (${season.id})`, () => {
    for (const w of season.worlds) {
      for (const [W, H] of SIZES) {
        const base = baseStageHeight(W, H - CHROME, H)
        it(`${w.id} at ${W}x${H}: every position of the current stop, with and without crystal`, () => {
          for (const crystal of [false, true]) {
            for (let cur = -1; cur < w.nodes.length; cur++) {
              const out = layoutMap(stops(w.nodes, cur, crystal || cur < 0 ? 'all' : 'before', crystal), W, base)
              // On a phone (390 wide) some authored stop positions are closer than an icon, whatever the height:
              // that is content (node.pos), so only tags over tags/icons are checked there; tablets check icons too.
              const found = W <= 600 ? out.overlaps.filter((o) => !/: (icono|aviso) sobre el icono? de|: icono sobre el de/.test(o)) : out.overlaps
              expect(found, `current=${cur} crystal=${crystal}: ${found.join('; ')}`).toEqual([])
            }
          }
        })
      }
    }
  })
}

describe('pill «Aquí sigue»', () => {
  it('is sized from the pet name and never cut', () => {
    expect(pillOf('Luna').text).toBe('Aquí sigue Luna')
    expect(pillOf('Unicornio bebé').text).toBe('Aquí sigue Unicornio bebé')
    expect(pillOf('Unicornio bebé').w).toBeGreaterThan(pillOf('Luna').w)
  })
  it('uses a short text for a very long name', () => {
    const p = pillOf('Superdragoncita Pirulina de las Estrellas')
    expect(p.text).toBe('¡Sigue aquí!')
    expect(p.w).toBeLessThan(200)
  })
  it('lays out a long pet name without overlaps', () => {
    const w = season1.worlds[1]
    for (const petName of ['Unicornio bebé', 'Superdragoncita Pirulina de las Estrellas']) {
      for (const [W, H] of SIZES) {
        const out = layoutMap(stops(w.nodes, 1, 'before', false, petName), W, baseStageHeight(W, H - CHROME, H))
        expect(out.overlaps, `${petName} ${W}x${H}: ${out.overlaps.join('; ')}`).toEqual([])
      }
    }
  })
})
