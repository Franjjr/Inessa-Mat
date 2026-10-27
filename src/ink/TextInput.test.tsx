import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { TextInput } from './TextInput'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn() } }))

function Harness({ onSubmit = () => {}, maxLength }: { onSubmit?: () => void; maxLength?: number }) {
  const [v, setV] = useState('')
  return <TextInput value={v} onChange={setV} onSubmit={onSubmit} maxLength={maxLength} ariaLabel="Respuesta" />
}

const box = () => screen.getByRole('textbox', { name: 'Respuesta' })

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
    render(<TextInput value="" onChange={onChange} ariaLabel="Respuesta" />)
    fireEvent.keyDown(box(), { key: 'Shift' })
    fireEvent.keyDown(box(), { key: 'Tab' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('stops at maxLength', () => {
    render(<Harness maxLength={3} />)
    for (const k of ['a', 'b', 'c', 'd']) fireEvent.keyDown(box(), { key: k })
    expect(box().textContent).toBe('abc')
  })

  it('only one keyboard shows when two boxes are on the screen', () => {
    render(<><TextInput value="" onChange={() => {}} ariaLabel="uno" /><TextInput value="" onChange={() => {}} ariaLabel="dos" /></>)
    expect(screen.getAllByRole('group', { name: 'Teclado de letras' })).toHaveLength(1)
  })
})
