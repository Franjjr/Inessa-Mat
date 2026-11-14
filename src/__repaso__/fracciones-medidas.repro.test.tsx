/* Repaso de fracciones, decimales, medidas y dinero (noviembre de 2026): pruebas de regresión. Cada una reproduce un fallo que se encontró y se
   arregló; la expectativa es la de la niña y la de la maestra. */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DecimalOpExercise } from '@/types'
import DecimalOpView from '@/activities/views/DecimalOpView'
import { InkProvider } from '@/ink/InkProvider'
import { scriptedRecognizer } from '@/ink/dev/scripted'

vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
}))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, speech: { say: vi.fn(async () => {}), stop: vi.fn() }, haptics: { success: vi.fn(), error: vi.fn(), tap: vi.fn() } }))
vi.mock('@/fx', () => ({ celebrate: vi.fn() }))

const cell = (name: RegExp | string) => screen.getByRole('textbox', { name })
function typeKeys(keys: string) {
  for (const k of keys) fireEvent.keyDown(document.activeElement as HTMLElement, { key: k })
}
const wrap = (ui: React.ReactNode) => render(<InkProvider recognizer={scriptedRecognizer([])}>{ui}</InkProvider>)

describe('Decimales en columna (DecimalOpView)', () => {
  /* ERA UN FALLO: la suma de decimales en columna rellena las casillas de derecha a izquierda (centésimas → décimas →
     unidades), pero, a diferencia de ColumnView y LongMulView, su CellGroup no lleva typingOrder="column": no hay
     flecha sobre la casilla siguiente ni el aviso «Empieza por las unidades», y la respuesta es de tipo 'numbers',
     que reversedAnswer() no sabe darle la vuelta. Si la niña teclea «3,75» tal como se lee (3, 7, 5), la app guarda
     5,73 y lo suspende sin preguntar «¿Querías escribir 3,75?». */
  const sum: DecimalOpExercise = { id: 'repaso-dec-op', kind: 'decimal-op', skill: 'dec:add:2', difficulty: 3, op: 'add', places: 2, left: 125, right: 250, answer: 375 }

  it('teclear 1,25 + 2,50 = «375» en el orden en que se lee no se suspende: o se pregunta o está bien', () => {
    const onAnswered = vi.fn()
    wrap(<DecimalOpView exercise={sum} onAnswered={onAnswered} showFeedback={false} />)
    cell(/centésimas del resultado/).focus()
    typeKeys('375')
    act(() => { fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' }) })
    const asked = screen.queryByTestId('ink-doubt-prompt') !== null
    const gradedRight = onAnswered.mock.calls.length > 0 && onAnswered.mock.calls[0][0].check.correct === true
    expect(asked || gradedRight).toBe(true)
  })
})

describe('Pagar justo (MoneyView, modo pay)', () => {
  /* ERA UN FALLO: al arrastrar una moneda a la bandeja, el «up» marca justDragged = true para tragarse el clic que sigue a un
     arrastre. Pero tras un arrastre real el navegador no dispara clic sobre el botón del monedero (el dedo se ha soltado
     encima de la bandeja), así que justDragged se queda en true y se come el SIGUIENTE toque: la niña toca 50 céntimos,
     no entra nada en la bandeja, cree que ha pagado justo y la app le dice «Te falta dinero». */
  it('después de arrastrar 2 € a la bandeja, tocar 50 céntimos la añade', async () => {
    const { makePay } = await import('@/engine/money')
    const MoneyView = (await import('@/activities/views/MoneyView')).default
    if (!('PointerEvent' in window)) {
      // jsdom: PointerEvent como MouseEvent (clientX/clientY).
      ;(window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent = class extends MouseEvent {} as typeof MouseEvent
    }
    const onAnswered = vi.fn()
    wrap(<MoneyView exercise={makePay(250)} onAnswered={onAnswered} showFeedback={false} />)
    const tray = screen.getByRole('group', { name: 'Bandeja' })
    const coin2 = screen.getByRole('button', { name: 'Añadir 2 €' })
    const original = document.elementFromPoint
    document.elementFromPoint = () => tray
    fireEvent.pointerDown(coin2, { clientX: 10, clientY: 10 })
    fireEvent.pointerMove(window, { clientX: 60, clientY: 200 })
    fireEvent.pointerUp(window, { clientX: 60, clientY: 200 })
    document.elementFromPoint = original
    // El arrastre ha metido 2 € (el navegador no envía clic al botón del monedero tras soltar en la bandeja).
    expect(screen.getAllByRole('button', { name: /^Quitar 2 €/ })).toHaveLength(1)
    // Ahora un toque normal (sin arrastre): pointerdown + pointerup en el mismo sitio y clic.
    const coin50 = screen.getByRole('button', { name: 'Añadir 50 céntimos' })
    fireEvent.pointerDown(coin50, { clientX: 5, clientY: 5 })
    fireEvent.pointerUp(window, { clientX: 5, clientY: 5 })
    fireEvent.click(coin50)
    expect(screen.queryAllByRole('button', { name: /^Quitar 50 céntimos/ })).toHaveLength(1)
  })
})

describe('Euros y céntimos con el teclado de números (MoneyView / DecimalView)', () => {
  /* ERA UN FALLO: las casillas de euros/céntimos (y parte entera/décimas/centésimas) son NumberInput sueltos. Al teclear, un
     dígito que no cabe (maxDigits) se descarta en silencio (NumberInput.tsx:244) y el cursor no pasa a la casilla
     siguiente. La niña teclea el cambio «1,50» como lo lee (1, 5, 0) y la casilla de euros se queda en 15: la app
     califica 15 € y le dice que ha fallado, sin avisar de que el 0 no ha entrado. */
  it('cambio de 1,50 €: teclear 1, 5, 0 no pierde el 0 sin avisar: pasa a los céntimos', async () => {
    const { makeChange } = await import('@/engine/money')
    const MoneyView = (await import('@/activities/views/MoneyView')).default
    const onAnswered = vi.fn()
    wrap(<MoneyView exercise={makeChange(350, 500, 'un zumo')} onAnswered={onAnswered} showFeedback={false} />)
    cell('Euros').focus()
    typeKeys('150')
    // The 0 that does not fit in «Euros» is not lost in silence: it goes to «Céntimos», where the child sees it.
    expect(cell('Euros').closest('[data-value]')?.getAttribute('data-value')).toBe('15')
    expect(cell('Céntimos').closest('[data-value]')?.getAttribute('data-value')).toBe('0')
  })

  it('0,45: en la casilla de las décimas, teclear 4 y 5 no pierde el 5 sin avisar', async () => {
    const DecimalView = (await import('@/activities/views/DecimalView')).default
    wrap(<DecimalView exercise={{ id: 'repaso-dec', kind: 'decimal', skill: 'dec:read:2', difficulty: 3, mode: 'read', places: 2, value: 45, answer: 45 }} onAnswered={vi.fn()} showFeedback={false} />)
    cell('Parte entera').focus()
    typeKeys('0')
    cell('Décimas').focus()
    typeKeys('45')
    expect(cell('Décimas').textContent).toContain('4')
    const centesimas = cell('Centésimas').textContent ?? ''
    const warned = screen.queryByText('Aquí solo cabe una cifra.') !== null
    expect(centesimas.includes('5') || warned).toBe(true)
  })
})
