import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect, useState, type ReactNode } from 'react'
import { InkProvider } from './InkProvider'
import { useInputMode } from './hooks'
import { notePenContact } from './policy'
import { scriptedRecognizer } from './dev/scripted'
import { TextInput } from './TextInput'

vi.mock('@/data', () => ({
  addInkSample: vi.fn(async () => {}),
  listInkSamples: vi.fn(async () => []),
  updateChild: vi.fn(async () => ({})),
  useActiveChild: () => ({ child: null, loading: false, setActiveChild() {} }),
}))
vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn(), success: vi.fn(), error: vi.fn() } }))

/** Sets the child's answer preference for this subtree, as NumberInput's tests do. */
function Preference({ value }: { value: 'keyboard' | 'keypad' | 'pen' }) {
  const { setPreferred } = useInputMode()
  useEffect(() => { setPreferred(value) }, [setPreferred, value])
  return null
}

function Harness({ onSubmit = () => {}, maxLength, preference, children }: { onSubmit?: () => void; maxLength?: number; preference?: 'keyboard' | 'keypad' | 'pen'; children?: ReactNode }) {
  const [v, setV] = useState('')
  return (
    <InkProvider recognizer={scriptedRecognizer([])}>
      {preference && <Preference value={preference} />}
      <TextInput value={v} onChange={setV} onSubmit={onSubmit} maxLength={maxLength} ariaLabel="Respuesta" />
      {children}
    </InkProvider>
  )
}

const box = () => screen.getByRole('textbox', { name: 'Respuesta' })
const keyboard = () => screen.queryByRole('group', { name: 'Teclado de letras' })
const toggle = (name: RegExp | string) => screen.getByRole('button', { name })

afterEach(() => { notePenContact(false, 0); localStorage.clear() })

describe('TextInput', () => {
  it('a physical keyboard types letters, accents from the OS, space, Backspace; Enter submits', () => {
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)
    for (const k of ['c', 'a', 's', 'a']) fireEvent.keyDown(box(), { key: k })
    fireEvent.keyDown(box(), { key: ' ' })
    fireEvent.keyDown(box(), { key: 'ó' })
    expect(box().textContent).toBe('casa ó')
    fireEvent.keyDown(box(), { key: 'Backspace' })
    expect(box().textContent).toBe('casa ')
    fireEvent.keyDown(box(), { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('a dead key then the composed vowel types the vowel', () => {
    render(<Harness />)
    fireEvent.keyDown(box(), { key: 'Dead' })
    fireEvent.keyDown(box(), { key: 'ú' })
    expect(box().textContent).toBe('ú')
  })

  it('AltGr (Ctrl+Alt) types its character; a Ctrl shortcut does not', () => {
    render(<Harness />)
    fireEvent.keyDown(box(), { key: '@', ctrlKey: true, altKey: true })
    fireEvent.keyDown(box(), { key: 'c', ctrlKey: true })
    expect(box().textContent).toBe('@')
  })

  it('the on-screen keyboard types into the same box', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'ñ' }))
    fireEvent.click(screen.getByRole('button', { name: 'a' }))
    expect(box().textContent).toBe('ña')
    fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    expect(box().textContent).toBe('ñ')
  })

  it('keys that are not characters (Shift, Tab) are left alone', () => {
    const onChange = vi.fn()
    render(<InkProvider recognizer={scriptedRecognizer([])}><TextInput value="" onChange={onChange} ariaLabel="Respuesta" /></InkProvider>)
    fireEvent.keyDown(box(), { key: 'Shift' })
    fireEvent.keyDown(box(), { key: 'Tab' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('stops at maxLength', () => {
    render(<Harness maxLength={3} />)
    for (const k of ['a', 'b', 'c', 'd']) fireEvent.keyDown(box(), { key: k })
    expect(box().textContent).toBe('abc')
  })

  it('the typed text is announced politely', () => {
    render(<Harness />)
    fireEvent.keyDown(box(), { key: 'h' })
    expect(box().querySelector('[aria-live]')?.textContent).toBe('h')
    expect(box().querySelector('[aria-live]')?.getAttribute('aria-live')).toBe('polite')
  })

  it('a palm press on a letter key is ignored', () => {
    const onKey = vi.fn()
    const { unmount } = render(<InkProvider recognizer={scriptedRecognizer([])}><TextInput value="" onChange={onKey} ariaLabel="Respuesta" /></InkProvider>)
    notePenContact(true, Date.now())
    fireEvent.pointerDown(screen.getByRole('button', { name: 'a' }), { pointerType: 'touch' })
    fireEvent.click(screen.getByRole('button', { name: 'a' }))
    expect(onKey).not.toHaveBeenCalled()
    unmount()
  })

  it('only one keyboard shows when two boxes are on the screen', () => {
    render(<InkProvider recognizer={scriptedRecognizer([])}><TextInput value="" onChange={() => {}} ariaLabel="uno" /><TextInput value="" onChange={() => {}} ariaLabel="dos" /></InkProvider>)
    expect(screen.getAllByRole('group', { name: 'Teclado de letras' })).toHaveLength(1)
  })

  describe('input mode', () => {
    it('keypad and pen modes show the letter keyboard', () => {
      const { unmount } = render(<Harness preference="keypad" />)
      expect(keyboard()).not.toBeNull()
      unmount()
      render(<Harness preference="pen" />)
      expect(keyboard()).not.toBeNull()
    })

    it('keyboard mode hides it; the toggle brings it back and hides it again', () => {
      render(<Harness preference="keyboard" />)
      expect(keyboard()).toBeNull()
      fireEvent.click(toggle('Usar el teclado de letras'))
      expect(keyboard()).not.toBeNull()
      fireEvent.click(toggle('Ocultar el teclado de letras'))
      expect(keyboard()).toBeNull()
    })

    it('the toggle is forgotten when the input mode changes', () => {
      const { rerender } = render(<Harness preference="keyboard" />)
      fireEvent.click(toggle('Usar el teclado de letras'))
      expect(keyboard()).not.toBeNull()
      rerender(<Harness preference="keypad" />)
      expect(keyboard()).not.toBeNull()
      rerender(<Harness preference="keyboard" />)
      expect(keyboard()).toBeNull()
    })

    it('the toggle is not offered outside keyboard mode', () => {
      render(<Harness preference="keypad" />)
      expect(screen.queryByRole('button', { name: 'Usar el teclado de letras' })).toBeNull()
    })
  })
})
