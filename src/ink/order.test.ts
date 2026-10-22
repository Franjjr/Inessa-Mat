import { computeOrder, neighbor, step, type OrderItem } from './order'

const cell = (uid: string, x: number, y: number, domIndex: number, extra: Partial<OrderItem> = {}): OrderItem => ({
  uid, domIndex, rect: { x, y, width: 60, height: 70 }, focusable: true, ...extra,
})

// Column addition layout:  carries (row 0) above C and D; result row (row 2): C D U. Given operands not focusable.
const layout: OrderItem[] = [
  cell('carryC', 0, 0, 0),
  cell('carryD', 80, 0, 1),
  cell('givenC', 0, 100, 2, { focusable: false }),
  cell('givenU', 160, 100, 3, { focusable: false }),
  cell('resC', 0, 200, 4),
  cell('resD', 80, 200, 5),
  cell('resU', 160, 200, 6),
]

describe('computeOrder', () => {
  it('dom / reverse', () => {
    expect(computeOrder(layout, 'dom')).toEqual(['carryC', 'carryD', 'resC', 'resD', 'resU'])
    expect(computeOrder(layout, 'reverse')).toEqual(['resU', 'resD', 'resC', 'carryD', 'carryC'])
  })

  it('rtl-columns follows the Spanish column algorithm (units first, carry before its column)', () => {
    expect(computeOrder(layout, 'rtl-columns')).toEqual(['resU', 'carryD', 'resD', 'carryC', 'resC'])
  })

  it('explicit ids, unlisted cells after', () => {
    const items = layout.map((i) => ({ ...i, cellId: i.uid }))
    expect(computeOrder(items, ['resU', 'resD', 'resC'])).toEqual(['resU', 'resD', 'resC', 'carryC', 'carryD'])
  })

  it('without layout (tests) rtl-columns falls back to reverse DOM order', () => {
    const flat = layout.map((i) => ({ ...i, rect: { x: 0, y: 0, width: 0, height: 0 } }))
    expect(computeOrder(flat, 'rtl-columns')).toEqual(computeOrder(flat, 'reverse'))
  })
})

describe('neighbor (arrow keys)', () => {
  it('moves spatially and skips given cells', () => {
    expect(neighbor(layout, 'resU', 'left')).toBe('resD')
    expect(neighbor(layout, 'resD', 'up')).toBe('carryD')
    expect(neighbor(layout, 'carryD', 'down')).toBe('resD')
    expect(neighbor(layout, 'resC', 'left')).toBeNull()
    expect(neighbor(layout, 'resU', 'up')).toBe('carryD')
  })

  it('falls back to DOM order without layout', () => {
    const flat = layout.map((i) => ({ ...i, rect: { x: 0, y: 0, width: 0, height: 0 } }))
    expect(neighbor(flat, 'resD', 'left')).toBe('resC')
    expect(neighbor(flat, 'resD', 'right')).toBe('resU')
  })
})

describe('step', () => {
  it('moves without wrapping', () => {
    expect(step(['a', 'b', 'c'], 'b', 1)).toBe('c')
    expect(step(['a', 'b', 'c'], 'c', 1)).toBeNull()
    expect(step(['a', 'b', 'c'], 'a', -1)).toBeNull()
  })
})
