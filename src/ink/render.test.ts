import { mockCanvas } from './dev/testing'
import { handwrite } from './fixtures'
import { baseInkWidth, renderInk, sizeCanvas } from './render'

describe('render', () => {
  it('sizes the backing store with the device pixel ratio and the overflow margin', () => {
    const c = document.createElement('canvas')
    expect(sizeCanvas(c, { width: 80, height: 100 }, 10, 2)).toBe(true)
    expect([c.width, c.height]).toEqual([200, 240])
    expect(c.style.width).toBe('100px')
    expect(sizeCanvas(c, { width: 80, height: 100 }, 10, 2)).toBe(false)
  })

  it('draws smooth quadratic curves; pen pressure modulates the width', () => {
    const calls = mockCanvas()
    const c = document.createElement('canvas')
    sizeCanvas(c, { width: 80, height: 100 }, 10, 1)
    renderInk(c, handwrite(3, { x: 0, y: 0, w: 80, h: 100 }), { color: '#2e1a47', margin: 10, dpr: 1, zoneHeight: 100 })
    expect(calls.quadraticCurveTo).toBeGreaterThan(20)
    expect(new Set(calls.lineWidths.map((w) => w.toFixed(2))).size).toBeGreaterThan(1)

    const touch = mockCanvas()
    renderInk(c, handwrite(3, { x: 0, y: 0, w: 80, h: 100 }, { pointerType: 'touch' }), { color: '#2e1a47', margin: 10, dpr: 1, zoneHeight: 100 })
    expect(touch.stroke).toBe(1)
    expect(touch.lineWidths[0]).toBeCloseTo(baseInkWidth(100, 'touch'))
  })
})
