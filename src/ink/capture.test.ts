import type { InkStroke } from '@/types'
import { InkCapture, type CaptureCallbacks } from './capture'
import { pointerRole, type PointerRole } from './policy'
import { handwrite } from './fixtures'
import { replayStrokes, tap } from './dev/autoplay'

function setup(opts: { penSeen?: boolean; role?: (t: string, primary: boolean) => PointerRole } = {}) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const events: string[] = []
  const ended: InkStroke[] = []
  const cb: CaptureCallbacks = {
    onStrokeStart: () => events.push('start'),
    onStrokeEnd: (s) => { events.push('end'); ended.push(s) },
    onStrokeCancel: () => events.push('cancel'),
    onTap: (i) => events.push(`tap:${i.pointerType}:${i.role}`),
    onBlockedWrite: (i) => events.push(`blocked:${i.pointerType}`),
    onEraseAt: () => events.push('erase'),
    onEraseEnd: () => events.push('eraseEnd'),
  }
  const cap = new InkCapture(el, {
    enabled: () => true,
    role: opts.role ?? ((t, primary) => pointerRole(t, { penSeen: !!opts.penSeen, mode: 'touch', isPrimary: primary })),
    zone: () => ({ width: 90, height: 110 }),
  }, cb)
  return { el, cap, events, ended }
}

function pe(type: string, init: PointerEventInit) {
  return new PointerEvent(type, { bubbles: true, cancelable: true, isPrimary: true, ...init })
}

describe('InkCapture', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('captures a multi-stroke digit drawn with a pen', () => {
    const { el, cap, events } = setup()
    replayStrokes(el, handwrite(4, { x: 0, y: 0, w: 90, h: 110 }))
    expect(events).toEqual(['start', 'end', 'start', 'end'])
    expect(cap.strokes).toHaveLength(2)
    expect(cap.strokes[0].pointerType).toBe('pen')
    expect(cap.strokes[0].points.length).toBeGreaterThan(10)
  })

  it('reports a quick press as a tap, not ink', () => {
    const { el, cap, events } = setup()
    tap(el, 30, 30)
    expect(events).toEqual(['tap:pen:write'])
    expect(cap.strokes).toHaveLength(0)
  })

  it('palm rejection: once a pen was seen, fingers only tap', () => {
    const { el, cap, events } = setup({ penSeen: true })
    replayStrokes(el, handwrite(1, { x: 0, y: 0, w: 90, h: 110 }, { pointerType: 'touch' }))
    expect(cap.strokes).toHaveLength(0)
    expect(events).toEqual(['blocked:touch']) // the finger "wrote": reported, not inked
    tap(el, 30, 30, 'touch')
    expect(events).toEqual(['blocked:touch', 'tap:touch:tap'])
  })

  it('reports a finger that tries to write after a pen was seen (no ink)', () => {
    const { el, cap, events } = setup({ penSeen: true })
    replayStrokes(el, handwrite(7, { x: 0, y: 0, w: 90, h: 110 }, { pointerType: 'touch' }))
    expect(cap.strokes).toHaveLength(0)
    expect(events).toContain('blocked:touch')
    expect(events.some((e) => e.startsWith('tap'))).toBe(false)
  })

  it('a resting palm does not take the focus; a deliberate finger tap does', () => {
    const { el } = setup({ penSeen: true })
    el.tabIndex = 0
    const other = document.createElement('button')
    document.body.appendChild(other)
    other.focus()
    el.dispatchEvent(pe('pointerdown', { pointerId: 8, pointerType: 'touch', clientX: 20, clientY: 20, buttons: 1 }))
    expect(document.activeElement).toBe(other)
    el.dispatchEvent(pe('pointerup', { pointerId: 8, pointerType: 'touch', clientX: 20, clientY: 20 }))
    expect(document.activeElement).toBe(el) // it was a quick tap
  })

  it('a finger tap whose pointerup was lost is closed silently (no phantom tap)', () => {
    const { el, events } = setup({ penSeen: true })
    el.dispatchEvent(pe('pointerdown', { pointerId: 4, pointerType: 'touch', clientX: 20, clientY: 20, buttons: 1 }))
    // the same pointer id comes down again: the first press is closed without an event
    el.dispatchEvent(pe('pointerdown', { pointerId: 4, pointerType: 'touch', clientX: 30, clientY: 30, buttons: 1 }))
    el.dispatchEvent(pe('pointerup', { pointerId: 4, pointerType: 'touch', clientX: 30, clientY: 30 }))
    expect(events).toEqual(['tap:touch:tap'])
  })

  it('without a pen, fingers write', () => {
    const { el, cap } = setup({ penSeen: false })
    replayStrokes(el, handwrite(1, { x: 0, y: 0, w: 90, h: 110 }, { pointerType: 'touch' }))
    expect(cap.strokes).toHaveLength(1)
    expect(cap.strokes[0].pointerType).toBe('touch')
  })

  it('a pen landing while a finger (palm) is writing replaces the finger stroke', () => {
    const { el, cap, events } = setup({ penSeen: false })
    el.dispatchEvent(pe('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 10, clientY: 10, buttons: 1 }))
    el.dispatchEvent(pe('pointermove', { pointerId: 1, pointerType: 'touch', clientX: 40, clientY: 40, buttons: 1 }))
    el.dispatchEvent(pe('pointerdown', { pointerId: 2, pointerType: 'pen', clientX: 50, clientY: 10, buttons: 1 }))
    el.dispatchEvent(pe('pointermove', { pointerId: 2, pointerType: 'pen', clientX: 50, clientY: 90, buttons: 1 }))
    // the palm keeps moving: ignored
    el.dispatchEvent(pe('pointermove', { pointerId: 1, pointerType: 'touch', clientX: 60, clientY: 60, buttons: 1 }))
    el.dispatchEvent(pe('pointerup', { pointerId: 2, pointerType: 'pen', clientX: 50, clientY: 90 }))
    el.dispatchEvent(pe('pointerup', { pointerId: 1, pointerType: 'touch', clientX: 60, clientY: 60 }))
    expect(events).toEqual(['start', 'cancel', 'start', 'end'])
    expect(cap.strokes).toHaveLength(1)
    expect(cap.strokes[0].pointerType).toBe('pen')
  })

  it('ignores a second pointer while one is writing', () => {
    const { el, cap } = setup()
    el.dispatchEvent(pe('pointerdown', { pointerId: 1, pointerType: 'pen', clientX: 10, clientY: 10, buttons: 1 }))
    el.dispatchEvent(pe('pointerdown', { pointerId: 3, pointerType: 'mouse', clientX: 80, clientY: 80, buttons: 1 }))
    el.dispatchEvent(pe('pointermove', { pointerId: 1, pointerType: 'pen', clientX: 10, clientY: 90, buttons: 1 }))
    el.dispatchEvent(pe('pointerup', { pointerId: 1, pointerType: 'pen', clientX: 10, clientY: 90 }))
    expect(cap.strokes).toHaveLength(1)
    expect(cap.strokes[0].points.every((p) => p.x === 10)).toBe(true)
  })

  it('the pen eraser reports erase points instead of ink', () => {
    const { el, cap, events } = setup()
    el.dispatchEvent(pe('pointerdown', { pointerId: 1, pointerType: 'pen', clientX: 10, clientY: 10, buttons: 32, button: 5 }))
    el.dispatchEvent(pe('pointermove', { pointerId: 1, pointerType: 'pen', clientX: 30, clientY: 30, buttons: 32 }))
    el.dispatchEvent(pe('pointerup', { pointerId: 1, pointerType: 'pen', clientX: 30, clientY: 30 }))
    expect(events).toEqual(['erase', 'erase', 'eraseEnd'])
    expect(cap.strokes).toHaveLength(0)
  })

  it('records pen pressure and drops a stroke rejected by the consumer', () => {
    const { el, cap } = setup()
    const s = handwrite(7, { x: 0, y: 0, w: 90, h: 110 })
    replayStrokes(el, [s[0]])
    expect(cap.strokes[0].points.some((p) => p.p != null && p.p > 0)).toBe(true)
    const el2 = setup()
    el2.cap.cb.onStrokeEnd = () => false
    replayStrokes(el2.el, [s[0]])
    expect(el2.cap.strokes).toHaveLength(0)
  })

  it('a pointer whose pointerup was lost does not block the next stroke', () => {
    const { el, cap, events } = setup()
    const [a] = handwrite(1, { x: 0, y: 0, w: 90, h: 110 })
    replayStrokes(el, [a], { partial: 0.8, pointerId: 5 }) // never lifted
    replayStrokes(el, [a], { pointerId: 5 }) // same id goes down again → the first one is closed
    expect(cap.strokes).toHaveLength(2)
    expect(events.filter((x) => x === 'end')).toHaveLength(2)
  })

  it('stops listening after destroy()', () => {
    const { el, cap } = setup()
    cap.destroy()
    replayStrokes(el, handwrite(1, { x: 0, y: 0, w: 90, h: 110 }))
    expect(cap.strokes).toHaveLength(0)
  })
})
