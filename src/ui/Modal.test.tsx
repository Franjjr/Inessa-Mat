import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './index'

function Harness({ onClose, dismissable = true }: { onClose?: () => void; dismissable?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <button>Fuera</button>
      <Modal open={open} dismissable={dismissable} title="¿Comprar Lazo?" onClose={() => { onClose?.(); setOpen(false) }}>
        <button>Sí</button>
        <button>No</button>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('moves focus into the dialog and keeps Tab inside it', () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Abrir' })
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByRole('button', { name: 'Sí' })).toHaveFocus()
    screen.getByRole('button', { name: 'No' }).focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Sí' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('button', { name: 'No' })).toHaveFocus()
  })

  it('closes on Escape and gives focus back to the opener', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    const opener = screen.getByRole('button', { name: 'Abrir' })
    opener.focus()
    fireEvent.click(opener)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(opener).toHaveFocus()
  })

  it('ignores Escape when it is not dismissable', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} dismissable={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
