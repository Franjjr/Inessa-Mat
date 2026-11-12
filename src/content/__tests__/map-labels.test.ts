/* Map labels: in every world and on every tablet and phone size, no name tag, icon or «Aquí sigue»/«¡Ayúdame!» tag
   overlaps another, and no two icons (with their gold ring) touch (boxes in real pixels, see src/world/map/labels.ts). */
import { describe, expect, it } from 'vitest'
import { getWorld, ISLAND_ID, ISLAND_STOP_PX, season1, seasonC2 } from '@/content'
import { baseStageHeight, layoutMap, pillOf, spreadForPhone, type StopInput } from '@/world/map/labels'

// Header + story strip take about this much of the screen height.
const CHROME = 130
const SIZES = [[1000, 490], [1180, 820], [1280, 800], [1366, 657], [820, 1180], [390, 844], [360, 740]] as const

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
              // Phones too: close stops are spread apart there (spreadForPhone), so icons, rings and tags are all checked.
              expect(out.overlaps, `current=${cur} crystal=${crystal}: ${out.overlaps.join('; ')}`).toEqual([])
            }
          }
        })
      }
    }
  })
}

// The island starts from the height its stops ask for (ISLAND_STOP_PX each, as WorldMapScreen draws it) and grows like
// any world when tags would collide (on a phone or a tall tablet that fixed height was not enough). Phones included.
describe('map labels (Isla de las Palabras)', () => {
  const island = getWorld(ISLAND_ID)!
  for (const [W, H] of SIZES) {
    it(`${ISLAND_ID} at ${W}x${H}: every position of the current stop, with and without crystal`, () => {
      for (const crystal of [false, true]) {
        for (let cur = -1; cur < island.nodes.length; cur++) {
          const out = layoutMap(stops(island.nodes, cur, crystal || cur < 0 ? 'all' : 'before', crystal), W, island.nodes.length * ISLAND_STOP_PX)
          expect(out.height).toBeGreaterThanOrEqual(island.nodes.length * ISLAND_STOP_PX)
          expect(out.overlaps, `current=${cur} crystal=${crystal}: ${out.overlaps.join('; ')}`).toEqual([])
        }
      }
    })
  }
})

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

describe('phones: close stops are spread apart', () => {
  it('keeps the path order and the x of every stop, and does not depend on the current stop', () => {
    for (const w of [...season1.worlds, ...seasonC2.worlds]) {
      const W = 390
      const H = baseStageHeight(W, 844 - CHROME, 844)
      const a = layoutMap(stops(w.nodes, 0, 'before', false), W, H, true)
      const b = layoutMap(stops(w.nodes, w.nodes.length - 1, 'before', false), W, H, true)
      expect(a.placed.map((p) => p.pos), w.id).toEqual(b.placed.map((p) => p.pos))
      a.placed.forEach((p, i) => expect(p.pos.x, `${w.id} ${w.nodes[i].id}`).toBeCloseTo(w.nodes[i].pos.x, 6))
    }
  })
  it('leaves tablets as authored', () => {
    const w = season1.worlds[0]
    const out = layoutMap(stops(w.nodes, 0, 'before', false), 1180, baseStageHeight(1180, 820 - CHROME, 820))
    out.placed.forEach((p, i) => expect(p.pos).toEqual(w.nodes[i].pos))
  })
  it('moves two stops side by side apart vertically', () => {
    const w = season1.worlds[0]
    const two = stops(w.nodes, 0, 'before', false).slice(0, 2).map((s, i) => ({ ...s, node: { ...s.node, pos: { x: 0.4 + i * 0.2, y: 0.5 } } }))
    const [p, q] = spreadForPhone(two, two.map((s) => ({ x: s.node.pos.x * 390, y: 500 })), [76, 76], 1000)
    expect(q.y - p.y).toBeGreaterThanOrEqual(100)
  })
})
