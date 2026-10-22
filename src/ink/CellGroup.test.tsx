import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { CellGroup, type CellGroupProps } from './CellGroup'
import { DigitCell } from './DigitCell'
import { mockCanvas } from './dev/testing'

vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
}))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))

beforeAll(() => { mockCanvas() })

let values: (number | null)[] = []
function ColumnResult(props: Partial<CellGroupProps>) {
  const [v, setV] = useState<(number | null)[]>([null, null, null])
  values = v
  const set = (i: number) => (d: number | null) => setV((old) => old.map((x, k) => (k === i ? d : x)))
  return (
    <CellGroup order="reverse" {...props}>
      <DigitCell cellId="c" value={v[0]} onChange={set(0)} ariaLabel="centenas" />
      <DigitCell cellId="d" value={v[1]} onChange={set(1)} ariaLabel="decenas" />
      <DigitCell variant="given" value={0} onChange={() => {}} ariaLabel="dada" />
      <DigitCell cellId="u" value={v[2]} onChange={set(2)} ariaLabel="unidades" />
    </CellGroup>
  )
}

const cell = (name: string) => screen.getByRole('textbox', { name })
const key = (name: string, k: string, extra: object = {}) => fireEvent.keyDown(cell(name), { key: k, ...extra })

describe('CellGroup · keyboard', () => {
  it('starts at the units, fills right to left and auto-advances (roving tabindex)', () => {
    render(<ColumnResult />)
    expect(cell('unidades')).toHaveAttribute('tabindex', '0')
    expect(cell('decenas')).toHaveAttribute('tabindex', '-1')
    cell('unidades').focus()
    key('unidades', '2')
    expect(document.activeElement).toBe(cell('decenas'))
    key('decenas', '3')
    expect(document.activeElement).toBe(cell('centenas'))
    key('centenas', '6')
    expect(values).toEqual([6, 3, 2])
    expect(cell('centenas')).toHaveAttribute('tabindex', '0')
  })

  it('Enter submits; Backspace clears, and on an empty cell goes back and clears the previous one', () => {
    const onSubmit = vi.fn()
    render(<ColumnResult onSubmit={onSubmit} />)
    cell('unidades').focus()
    key('unidades', '2')
    key('decenas', '3')
    key('decenas', 'Enter')
    expect(onSubmit).toHaveBeenCalledTimes(1)
    key('centenas', 'Backspace') // empty → back to decenas, clear it
    expect(document.activeElement).toBe(cell('decenas'))
    expect(values).toEqual([null, null, 2])
    key('decenas', 'Backspace') // empty → back to unidades, clear it
    expect(values).toEqual([null, null, null])
  })

  it('arrows move spatially (document order without layout) and skip given cells', () => {
    render(<ColumnResult />)
    cell('unidades').focus()
    key('unidades', 'ArrowLeft')
    expect(document.activeElement).toBe(cell('decenas'))
    key('decenas', 'ArrowRight')
    expect(document.activeElement).toBe(cell('unidades'))
  })

  it('Tab follows the custom order and leaves the group at the end', () => {
    render(<ColumnResult />)
    cell('unidades').focus()
    expect(key('unidades', 'Tab')).toBe(false) // default prevented: handled
    expect(document.activeElement).toBe(cell('decenas'))
    key('decenas', 'Tab', { shiftKey: true })
    expect(document.activeElement).toBe(cell('unidades'))
    cell('centenas').focus()
    expect(key('centenas', 'Tab')).toBe(true) // last: let the browser move on
  })

  it('explicit order by cellId', () => {
    render(<ColumnResult order={['d', 'u', 'c']} />)
    expect(cell('decenas')).toHaveAttribute('tabindex', '0')
    cell('decenas').focus()
    key('decenas', '1')
    expect(document.activeElement).toBe(cell('unidades'))
  })
})

describe('CellGroup · keypad', () => {
  it('the on-screen keypad types into the current cell, ⌫ deletes, ✓ submits', () => {
    const onSubmit = vi.fn()
    render(<ColumnResult keypad="show" onSubmit={onSubmit} />)
    const pad = screen.getByRole('group', { name: 'Teclado de números' })
    fireEvent.click(within(pad).getByRole('button', { name: '4' }))
    fireEvent.click(within(pad).getByRole('button', { name: '7' }))
    expect(values).toEqual([null, 7, 4])
    fireEvent.click(within(pad).getByRole('button', { name: 'Borrar' })) // current = centenas (empty) → back to decenas
    expect(values).toEqual([null, null, 4])
    fireEvent.click(within(pad).getByRole('button', { name: 'Comprobar' }))
    expect(onSubmit).toHaveBeenCalled()
  })

  it('offers a fallback toggle that opens the keypad', () => {
    render(<ColumnResult />)
    expect(screen.queryByRole('group', { name: 'Teclado de números' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Usar el teclado de números' }))
    expect(screen.getByRole('group', { name: 'Teclado de números' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escribir a mano' })).toHaveAttribute('aria-pressed', 'true')
  })
})
