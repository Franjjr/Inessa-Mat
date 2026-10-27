import { fireEvent, render, screen } from '@testing-library/react'
import { LetterKeyboard } from './LetterKeyboard'

vi.mock('@/audio', () => ({ sfx: { play: vi.fn() }, haptics: { tap: vi.fn() } }))

const key = (name: string) => screen.getByRole('button', { name })

describe('LetterKeyboard', () => {
  it('types ñandú: the acute key marks the next vowel', () => {
    const onKey = vi.fn()
    render(<LetterKeyboard onKey={onKey} onDelete={() => {}} />)
    for (const k of ['ñ', 'a', 'n', 'd']) fireEvent.click(key(k))
    fireEvent.click(key('Acento'))
    fireEvent.click(key('u'))
    expect(onKey.mock.calls.map((c) => c[0]).join('')).toBe('ñandú')
  })

  it('the accent waits for a vowel: a consonant after it is typed plain', () => {
    const onKey = vi.fn()
    render(<LetterKeyboard onKey={onKey} onDelete={() => {}} />)
    fireEvent.click(key('Acento'))
    fireEvent.click(key('s'))
    fireEvent.click(key('a'))
    expect(onKey.mock.calls.map((c) => c[0])).toEqual(['s', 'a'])
  })

  it('the diaeresis key makes ü', () => {
    const onKey = vi.fn()
    render(<LetterKeyboard onKey={onKey} onDelete={() => {}} />)
    fireEvent.click(key('Diéresis'))
    fireEvent.click(key('u'))
    expect(onKey).toHaveBeenCalledWith('ü')
  })

  it('⇧ capitalises one letter, then the keys go back to small letters', () => {
    const onKey = vi.fn()
    render(<LetterKeyboard onKey={onKey} onDelete={() => {}} />)
    fireEvent.click(key('Mayúsculas'))
    fireEvent.click(key('A'))
    fireEvent.click(key('b'))
    expect(onKey.mock.calls.map((c) => c[0])).toEqual(['A', 'b'])
  })

  it('a symbol or the space disarms ⇧', () => {
    const onKey = vi.fn()
    render(<LetterKeyboard onKey={onKey} onDelete={() => {}} />)
    fireEvent.click(key('Mayúsculas'))
    fireEvent.click(key('Símbolos'))
    fireEvent.click(key('.'))
    fireEvent.click(key('a'))
    fireEvent.click(key('Mayúsculas'))
    fireEvent.click(key('Espacio'))
    fireEvent.click(key('b'))
    expect(onKey.mock.calls.map((c) => c[0])).toEqual(['.', 'a', ' ', 'b'])
  })

  it('⇧ and the accent combine: Á', () => {
    const onKey = vi.fn()
    render(<LetterKeyboard onKey={onKey} onDelete={() => {}} />)
    fireEvent.click(key('Mayúsculas'))
    fireEvent.click(key('Acento'))
    fireEvent.click(key('A'))
    expect(onKey).toHaveBeenCalledWith('Á')
  })

  it('⌫ deletes and ✓ submits', () => {
    const onDelete = vi.fn()
    const onSubmit = vi.fn()
    render(<LetterKeyboard onKey={() => {}} onDelete={onDelete} onSubmit={onSubmit} />)
    fireEvent.click(key('Borrar'))
    fireEvent.click(key('Comprobar'))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('the symbol key shows ¿ ? ¡ ! , . and hides them again', () => {
    const onKey = vi.fn()
    render(<LetterKeyboard onKey={onKey} onDelete={() => {}} />)
    expect(screen.queryByRole('button', { name: '¿' })).toBeNull()
    fireEvent.click(key('Símbolos'))
    fireEvent.click(key('¿'))
    expect(onKey).toHaveBeenCalledWith('¿')
    fireEvent.click(key('Letras'))
    expect(screen.queryByRole('button', { name: '¿' })).toBeNull()
  })

  it('does not steal focus from the answer box', () => {
    render(<LetterKeyboard onKey={() => {}} onDelete={() => {}} />)
    const ev = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    key('a').dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
  })

  it('disabled ignores presses', () => {
    const onKey = vi.fn()
    render(<LetterKeyboard onKey={onKey} onDelete={() => {}} disabled />)
    fireEvent.click(key('a'))
    expect(onKey).not.toHaveBeenCalled()
  })
})
