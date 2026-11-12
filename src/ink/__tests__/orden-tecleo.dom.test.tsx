/* Auditoría CR-1: con el teclado de números el número sale tal como la niña lo escribe.
   - En un número de varias casillas (un cociente, las partes de una división) se teclea como en una calculadora: «172» es 172.
   - En el resultado de una cuenta en columna se escribe empezando por las unidades; si teclea el número en el orden
     en que se lee y al revés estaría bien, la app le pregunta «¿Querías escribir 625?» y no lo cuenta como fallo. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeColumnAdd, makeColumnSub } from '@/engine'
import ColumnView from '@/activities/views/ColumnView'
import { CellGroup } from '../CellGroup'
import { DigitCell } from '../DigitCell'
import { InkProvider } from '../InkProvider'
import { scriptedRecognizer } from '../dev/scripted'
import { useState } from 'react'

vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
}))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(async () => {}), stop: vi.fn() }, haptics: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const cell = (name: RegExp | string) => screen.getByRole('textbox', { name })
/** Types keys into whatever cell has the focus, one after the other (the cursor moves by itself). */
function typeKeys(keys: string) {
  for (const k of keys) fireEvent.keyDown(document.activeElement as HTMLElement, { key: k })
}
const wrap = (ui: React.ReactNode) => render(<InkProvider recognizer={scriptedRecognizer([])}>{ui}</InkProvider>)

describe('teclear un número de varias casillas: como en una calculadora', () => {
  // The step views of the retired methods (saltos, por partes) are gone; any number of several cells with a numberId
  // (the parts of a division, a cociente) types the same way.
  it('«172» tecleado de izquierda a derecha en tres casillas de un número da 172', () => {
    function Host() {
      const [d, setD] = useState<(number | null)[]>([null, null, null])
      const set = (i: number) => (v: number | null) => setD((p) => p.map((x, j) => (j === i ? v : x)))
      return (
        <CellGroup>
          {[2, 1, 0].map((i) => (
            <DigitCell key={i} numberId="total" cellId={`t${i}`} value={d[i]} onChange={set(i)} ariaLabel={`${['unidades', 'decenas', 'centenas'][i]} del total`} />
          ))}
        </CellGroup>
      )
    }
    wrap(<Host />)
    cell(/^unidades del total/).focus()
    typeKeys('172')
    expect(cell(/^centenas del total/).parentElement).toHaveAttribute('data-value', '1')
    expect(cell(/^decenas del total/).parentElement).toHaveAttribute('data-value', '7')
    expect(cell(/^unidades del total/).parentElement).toHaveAttribute('data-value', '2')
  })

  it('un número más corto que las casillas queda a la derecha: «40» en tres casillas es 40', () => {
    function Host() {
      const [d, setD] = useState<(number | null)[]>([null, null, null])
      const set = (i: number) => (v: number | null) => setD((p) => p.map((x, j) => (j === i ? v : x)))
      return (
        <CellGroup>
          {[2, 1, 0].map((i) => (
            <DigitCell key={i} numberId="n" cellId={`n${i}`} value={d[i]} onChange={set(i)} ariaLabel={`cifra ${i}`} autoFocus={i === 0} />
          ))}
          <output data-testid="n">{d.join(',')}</output>
        </CellGroup>
      )
    }
    wrap(<Host />)
    cell('cifra 0').focus()
    typeKeys('40')
    expect(screen.getByTestId('n')).toHaveTextContent('0,4,') // units 0, tens 4, hundreds empty
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Backspace' })
    expect(screen.getByTestId('n')).toHaveTextContent('4,,') // the last digit typed goes
  })
})

describe('el resultado de una cuenta en columna: unidades primero', () => {
  it('352 − 127: teclear 5, 2, 2 en el orden de la columna da 225 y está bien', () => {
    const onAnswered = vi.fn()
    wrap(<ColumnView exercise={makeColumnSub(352, 127)} onAnswered={onAnswered} showFeedback={false} />)
    cell(/unidades del resultado/).focus()
    typeKeys('522')
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: true, given: '225' })
  })

  it('352 − 127: teclear «225» como se lee pregunta «¿Querías escribir 225?» y no cuenta fallo', () => {
    const onAnswered = vi.fn()
    wrap(<ColumnView exercise={makeColumnSub(352, 127)} onAnswered={onAnswered} showFeedback={false} />)
    cell(/unidades del resultado/).focus()
    typeKeys('225') // fills units 2, tens 2, hundreds 5 → 522
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered).not.toHaveBeenCalled()
    expect(screen.getByTestId('ink-doubt-prompt')).toHaveTextContent('¿Querías escribir 225? En la cuenta las cifras se escriben de derecha a izquierda.')
    fireEvent.click(screen.getByRole('button', { name: 'Vale, lo arreglo' }))
    expect(screen.queryByTestId('ink-doubt-prompt')).toBeNull()
    // She fixes it, units first: graded right, the question did not count as a try.
    fireEvent.keyDown(cell(/unidades del resultado/), { key: '5' })
    fireEvent.keyDown(cell(/centenas del resultado/), { key: '2' })
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(true)
  })

  it('368 + 257: teclear «625» como se lee pregunta «¿Querías escribir 625?»; 5, 2, 6 está bien', () => {
    const onAnswered = vi.fn()
    wrap(<ColumnView exercise={makeColumnAdd([368, 257])} onAnswered={onAnswered} showFeedback={false} />)
    cell(/unidades del resultado/).focus()
    typeKeys('625')
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered).not.toHaveBeenCalled()
    expect(screen.getByTestId('ink-doubt-prompt')).toHaveTextContent('¿Querías escribir 625?')
    fireEvent.click(screen.getByRole('button', { name: 'Vale, lo arreglo' }))
    cell(/unidades del resultado/).focus()
    typeKeys('526')
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(onAnswered.mock.calls[0][0].check).toMatchObject({ correct: true, given: '625' })
  })

  it('a wrong answer that is not a reversed right one is graded as it is (no question)', () => {
    const onAnswered = vi.fn()
    wrap(<ColumnView exercise={makeColumnAdd([368, 257])} onAnswered={onAnswered} showFeedback={false} />)
    cell(/unidades del resultado/).focus()
    typeKeys('515')
    act(() => { fireEvent.keyDown(cell(/unidades del resultado/), { key: 'Enter' }) })
    expect(screen.queryByTestId('ink-doubt-prompt')).toBeNull()
    expect(onAnswered.mock.calls[0][0].check.correct).toBe(false)
  })

  it('column order shows an arrow over the cell typed next and the reminder above the keypad', () => {
    function Host() {
      const [d, setD] = useState<(number | null)[]>([null, null])
      const set = (i: number) => (v: number | null) => setD((p) => p.map((x, j) => (j === i ? v : x)))
      return (
        <CellGroup typingOrder="column" order={['r0', 'r1']} keypad="show">
          <DigitCell cellId="r1" value={d[1]} onChange={set(1)} ariaLabel="decenas" />
          <DigitCell cellId="r0" value={d[0]} onChange={set(0)} ariaLabel="unidades" />
        </CellGroup>
      )
    }
    wrap(<Host />)
    expect(screen.getByText('Empieza por las unidades, la casilla que brilla.')).toBeInTheDocument()
    const arrows = screen.getAllByTestId('column-arrow')
    expect(arrows).toHaveLength(1)
    expect(cell('unidades').parentElement).toContainElement(arrows[0])
  })

  it('the cell the view marks as next (status active) carries the arrow, not the cursor', () => {
    function Host() {
      return (
        <CellGroup typingOrder="column" order={['r0', 'r1']} keypad="show">
          <DigitCell cellId="r1" value={null} onChange={() => {}} ariaLabel="decenas" status="active" />
          <DigitCell cellId="r0" value={3} onChange={() => {}} ariaLabel="unidades" />
        </CellGroup>
      )
    }
    wrap(<Host />)
    const marked = screen.getAllByTestId('column-arrow').filter((a) => a.dataset.arrow === 'active')
    expect(marked).toHaveLength(1)
    expect(cell('decenas').parentElement).toContainElement(marked[0])
  })

  it('no arrow outside column order: a guided division marks its quotient active, and it goes left to right', () => {
    wrap(
      <CellGroup keypad="show">
        <DigitCell cellId="q0" value={null} onChange={() => {}} ariaLabel="cociente" status="active" />
      </CellGroup>,
    )
    expect(screen.queryByTestId('column-arrow')).toBeNull()
  })
})
